/* $Id$ */
import { getFeatureConfigFromOpts } from "./RichTextEditorView"

var defaultLinkRegex = /^((ht|f)tp(s?)\:\/\/){0,1}[-.\w]*(\/?)([a-zA-Z0-9\|\(\)~\-\.\!\?\,\:\'\/\\\+=&amp;%\$#_@\P{InBasicLatin}]*)?$/
var defaultAnchorRegex = /^[\p{L}\p{N}\p{M}\-\s_]+$/u

var getAllLinks = function(view) {
    var links = getAllLinkRanges(view);
    // join continuing links across paras
    return joinLinks(links, view);
};

var getLinkFromNode = function(node) {
    return node.marks.filter(function(m) {
        return m.type.name === 'link';
    })[0];
}

var getAllLinkRanges = function(view) {
    // all leaf nodes
    var allTextNodes = [];
    view.state.doc.content.nodesBetween(
        0,
        view.state.doc.content.size,
        function(node, pos) {
            if (node.isLeaf) {
                allTextNodes.push({ node: node, pos: pos });
            }
        }
    );

    // get all adjacent links
    var links = [];
    var currentLink = null;
    allTextNodes.forEach(function(n) {
        var node = n.node;
        var pos = n.pos;
        if (view.state.schema.marks.link.isInSet(node.marks)) {
            // node contains link mark, start a run or join with a new run
            var link = getLinkFromNode(node);
            if (!currentLink) {
                currentLink = {
                    href: link.attrs.href,
                    start: pos,
                    end: pos + node.nodeSize
                };
            } else if (
                currentLink.href === link.attrs.href &&
                currentLink.end === pos
            ) {
                // see if this can be joined
                currentLink.end = currentLink.end + node.nodeSize;
            } else {
                // this is a link with a different href. cut and start a new run
                links.push(currentLink);
                currentLink = {
                    href: link.attrs.href,
                    start: pos,
                    end: pos + node.nodeSize
                };
            }
        } else {
            // no mark, if there's an existing run break it.
            if (currentLink) {
                links.push(currentLink);
                currentLink = null;
            } // else do nothing
        }
    });
    if (currentLink) {
        links.push(currentLink);
    }

    return links;
}

var joinLinks = function(links, view) {
    // join links across adjacent paras
    var joinedLinks = links.reduce(function(joinedLinks, link) {
        var previousLink = joinedLinks.pop();
        if (!previousLink) {
            joinedLinks.push(link);
        } else if (
            link.start - previousLink.end === 2 && // 2 - gap between two paras
            !view.state.doc.resolve(previousLink.end).nodeAfter &&
            previousLink.href === link.href
        ) {
            previousLink.end = link.end;
            joinedLinks.push(previousLink);
        } else {
            joinedLinks.push(previousLink);
            joinedLinks.push(link);
        }
        return joinedLinks;
    }, []);

    return joinedLinks;
}


let RTELink = {
    // utils

    //TODO : Link optimisation.

    getLinkRange : function(view) {
        // case 1: add link to selection
        // case 2: edit an existing link
        var range = view.state.selection.ranges[0];
        var start = range.$from.pos,
            end = range.$to.pos;
        if (start === end) {
            // collapsed case
            // if link surrounds cursor, edit link.
            // if no surrounding link, do nothing.
            var node = view.state.doc.nodeAt(start);
            if (node && view.state.schema.marks.link.isInSet(node.marks)) {
                // link surround case
                // modify start and end to cover the surrounding link range.
                var linkRange = this.getSurroundingLinkRange(view, start);
                start = linkRange.start;
                end = linkRange.end;
            } // else do nothing
        } // else do nothing.
        return {
            start: start,
            end: end
        };
    },

    addLink : function(link, rteView, opts) {
        var view = rteView.editorView;
        var linkFeatureConf = getFeatureConfigFromOpts("link", rteView.options)
        var isValidUrl = false

        if(!link.startsWith('#')) {
            let regurl = linkFeatureConf.regex || defaultLinkRegex;
            isValidUrl = regurl.test(link);
        } else { // meaning it is an anchor link, so no need to test for the link regex
            isValidUrl = true
        }
        var attrs = {}

        // always check if the link starts with http:// or https://
        // if it does'nt start with http:// or https://, then add http:// to the link, so that the link will not be relative
        // that is if http:// is not added and simply google.com is added, then the link will be relative
        // so on clicking the link it will go to currentdomain/google.com
        // instead if http:// is added, then on clicking the link it will go to http://google.com

        // don't add  "ht tps://" string for links that start with #, because they are links that are added through anchor feature
        if(!link.startsWith('ht' + 'tp://') && !link.startsWith('ht' + 'tps://') && !link.startsWith('#')) {
            link = 'ht' + 'tp://' + link
        }
        attrs.href = link
        if(opts && opts.extraAttrs) {
            attrs.extraAttrs = opts.extraAttrs
        }
        if (isValidUrl) {
            var markType = view.state.schema.marks.link;
            var range = this.getLinkRange(view);
            view.state.tr.removeMark(range.start, range.end, markType);
            var schema = view.state.schema;
            if(range.start === range.end) {
                var existingMarks = view.state.selection.$from.marks()
                var marksToAdd = existingMarks.map((mark) => {
                    let markName = mark.type.name
                    let attrs = mark.attrs
                    return view.state.schema.marks[markName].create(attrs)
                })
                var linkMark = schema.mark('link', attrs) //no i18n
                marksToAdd.push(linkMark);
                var textNode = schema.text(link, marksToAdd);
                var tr = view.state.tr.replaceWith(range.start, range.end, textNode);

                // publish an event so that the host application can catch this event and do link unfurling
                this.dispatchLinkAddedEvent(view, link);

                view.dispatch(tr);
            } else {
                view.dispatch(
                    view.state.tr.addMark(
                        range.start,
                        range.end,
                        view.state.schema.marks.link.create(attrs)
                    )
                );

                // Assume the below use case:
                // User selects some text say "Hello" and adds a link to it, then in that case the host application will generally not
                // unfurl the link because the user's intention there is that he does'nt want the link to disturb the content, that is
                // why he has added the link to the text as a mark
                // But if the user copy pastes a link, then the user's intention there is that he does'nt care if the link disturbs the content
                // so, in these cases the host application would want to unfurl the link and show

                // So don't publish the event "linkAdded" if range.start !== range.end because
                // if range.start !== range.end, then we can say that the link is added as a mark to some particular text
            }
        } else {
            throw new Error("Invalid URL")
        }
    },

    addLinkWithText: function(link, text, rteView, opts) {
        var view = rteView.editorView;
        var linkFeatureConf = getFeatureConfigFromOpts("link", rteView.options)
        var isValidUrl = false

        if(!link.startsWith('#')) {
            let regurl = linkFeatureConf.regex || defaultLinkRegex;
            isValidUrl = regurl.test(link);
        } else {
            isValidUrl = true
        }

        // always check if the link starts with http:// or https://
        // if it does'nt start with http:// or https://, then add http:// to the link, so that the link will not be relative
        // that is if http:// is not added and simply google.com is added, then the link will be relative
        // so on clicking the link it will go to currentdomain/google.com
        // instead if http:// is added, then on clicking the link it will go to http://google.com

        // don't add  "ht tps://" string for links that start with #, because they are links that are added through anchor feature
        if(!link.startsWith('ht' + 'tp://') && !link.startsWith('ht' + 'tps://') && !link.startsWith('#')) {
            link = 'ht' + 'tp://' + link
        }
        
        var from = view.state.selection.$from.pos
        var to = view.state.selection.$to.pos
        if (isValidUrl) {
            var attrs = { href: link }
            if(opts && opts.extraAttrs) {
                attrs.extraAttrs = opts.extraAttrs
            }
            var linkMark = view.state.schema.marks.link.create(attrs)
            var existingMarks = view.state.selection.$from.marks()
            var marksToAdd = existingMarks.filter((mark) => {
                let markName = mark.type.name
                if(markName === 'link') {
                    // added this check in addLinkWithText function alone and not in addLink function because
                    // this condition is not required in any other case, it is only required in one case
                    // if a link is inserted in an editor at the beginning and there is no other content
                    // then in that case while editing that link by clicking changeLink in LinkContextMenu, then
                    // the new link will be added inside the old link
                    // inorder to avoid this case alone, this condition is added
                    return false
                } else {
                    let attrs = mark.attrs
                    return view.state.schema.marks[markName].create(attrs)
                }
            })
            marksToAdd.push(linkMark)
            var textNode = view.state.schema.text(text, marksToAdd)
            view.dispatch(view.state.tr.replaceWith(from, to, textNode))
        } else {
            throw new Error("Invalid URL")
        }
    },

    // removes link if present where the cursor is placed
    removeLink : function(view) {
        var range = view.state.selection.ranges[0];
        var start = range.$from.pos,
            end = range.$to.pos;

        if (start === end) {
            // collapsed case
            // if link surrounds cursor, edit link.
            // if no surrounding link, do nothing.
            var node = view.state.doc.nodeAt(start);
            if (view.state.schema.marks.link.isInSet(node.marks)) {
                // link surround case
                // modify start and end to cover the surrounding link range.
                range = this.getSurroundingLinkRange(view, start);
                start = range.start;
                end = range.end;
            } // else do nothing
        } // else do nothing.

        view.dispatch(
            view.state.tr.removeMark(start, end, view.state.schema.marks.link)
        );
    },

    getLink : function(view) {
        var node = view.state.doc.nodeAt(view.state.selection.$from.pos);

        // node can be null, if pos is end-of-document.
        if (node && view.state.schema.marks.link.isInSet(node.marks)) {
            return node.marks.get('link', function(mark, val) {
                // returns the link href from the list of marks
                return mark.type.name === val;
            }).attrs.href;
        }
        return '';
    },    

    getSurroundingLinkRange : function(view, index) {
        var links = getAllLinks(view);
        var linkSurroundingIndex = links.filter(function(linkRng) {
            return index >= linkRng.start && index <= linkRng.end;
        })[0];
        return linkSurroundingIndex;
    },

    dispatchLinkAddedEvent : function(view, link) {
        view.dom.dispatchEvent(new CustomEvent('linkAdded', {
            detail: { url: link }
        }));
    },

    addAnchor: function(name, view, opts) {
        var state = view.state;
        var tr = state.tr;

        var linkFeatureConf = getFeatureConfigFromOpts("link", view.rteView.options)
        var isValidAnchor = false
        var anchorReg = linkFeatureConf.anchorRegex || defaultAnchorRegex

        isValidAnchor = anchorReg.test(name)

        if (!isValidAnchor) {
            throw new Error("Invalid Anchor Name")
        }

        // preprocess name by removing spaces and put hyphens because it is going to be added to a link, and in general in links there won't be spaces
        var id = name.replace(/\s/g, '-');
        var attrs = {}
        attrs.id = id

        if(opts && opts.extraAttrs) {
            attrs.extraAttrs = opts.extraAttrs
        }

        var node = state.schema.nodes.anchor.create(attrs);
        tr.insert(state.selection.$from.pos, node);
        view.dispatch(tr);
    }
};

export { RTELink as default, defaultLinkRegex, defaultAnchorRegex }

/**
 * //  function for obtaining offset of give pos at the given node level

    /*
     * Working logic :
     * gets node and iterates through its child ( 1st level, 2 nd level...)
     * checks whether calculated offset is greater than the position of cursor
     * if yes --> returns the calculated offset(initial) and index in that node
     * else it iterates
     */
//     var getOffset = function(pos, node) {
//         if (pos === 1 || pos === node.nodeSize) {
//             return { offset: 0, index: 0 };
//         }
//         var indexLength = node.content.content.length;
//         for (var index = 0, initialOffset = 0; index < indexLength; index++) {
//             var subNode = node.child(index);
//             var offset = initialOffset + subNode.nodeSize;

//             if (offset >= pos) {
//                 return { offset: initialOffset, index: index };
//             } else {
//                 if (index + 1 === indexLength) {
//                     break;
//                 }
//                 initialOffset = offset;
//             }
//         }
//         return { offset: initialOffset, index: index };
//     };

//     //  function for getting start and end value of the node where the cursor is placed
//     var getStartandEnd = function(pos, view) {
//         var start = 0;
//         var end = 0;
//         var offset = 0;
//         var index = 0;
//         var node = view.state.doc;
//         while (!node.isText && node.childCount > 0) {
//             var nodeDetails = getOffset(pos, node);
//             offset += nodeDetails.offset;
//             index = nodeDetails.index;
//             pos = pos - offset;
//             start = offset + 1;
//             node = node.child(index);
//             end = start + node.nodeSize;
//         }
//         return {
//             start: start,
//             end: end,
//             index: index
//         };
//     };

//     var hasLinkContinuity = function (node, href ,view) {
//         var link = view.state.schema.marks.link.isInSet(node.marks);
//         var hasContinuity = link? link.attrs.href === href : false;
//         return hasContinuity;
//     }

//     var getLinkBoundary = function (nodeArr, view, href, boundaryType) {
//         var boundary = null;

//         for(var i =0; i < nodeArr.length; i++){
//             var node = nodeArr[i].node;
//             var pos = nodeArr[i].pos;
//             if(node.type.name !== 'paragraph'){
//                 if(hasLinkContinuity(node, href, view)) {
//                     boundary = pos;
//                 } else {
//                     break;
//                 }
//             } else if (node.type.name === 'paragraph' && node.childCount > 0) {
//                 continue;
//             } else {
//                 break;
//             }
//         }

//         if(boundary && boundaryType === 'end'){
//             var endNode = view.state.doc.nodeAt(boundary);
//             boundary = boundary + endNode.nodeSize;
//         }
//         return boundary;
//     }

//  */

//  //   function for getting range start and range end of the link to be modified or deleted
//  var getLinkRange = function(view, index) {

//     var node = view.state.doc.nodeAt(index);

//     // x------------------------------------x
//     var cursorPositionObject = view.state.selection.$from; //gets cur resolved pos
//     var node = view.state.doc.nodeAt(cursorPositionObject.pos);
//     var range = getStartandEnd(cursorPositionObject.pos, view); // gets the range of node at cursor
//     var mark = node ? view.state.schema.marks.link.isInSet(node.marks) : null;
//     var href = mark ? mark.attrs.href: null;
//     var start = range.start;
//     var end = range.end;
//     if(href){
//         var nodesBeforeLink = [];
//         var nodesAfterLink = [];

//         view.state.doc.content.nodesBetween(0 , start, function(node, pos){
//             nodesBeforeLink.push({node: node, pos: pos});
//         });

//         view.state.doc.content.nodesBetween(end , view.state.doc.content.size , function(node, pos){
//             nodesAfterLink.push({node: node, pos: pos});
//         });
//         nodesBeforeLink.reverse();

//         start = getLinkBoundary(nodesBeforeLink, view, href, 'start') || start;  //no i18n
//         end = getLinkBoundary(nodesAfterLink, view, href, 'end') || end;  //no i18n
//     } else {
//         return
//     }
//     return {
//         start : start,
//         end: end
//     }
// }
