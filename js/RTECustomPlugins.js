/* $Id$ */

import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Slice } from 'prosemirror-model';
import { getWordBeforeCurPos, preProcessRegex, addToStoredMarks, getNearestNonEmptyPara, debounce } from './RTEPluginUtils';
import { findChildrenByMark } from "prosemirror-utils"
import NodeSerializer from './NodeSerializer';
import { findParentNode } from 'prosemirror-utils'
import RTELink from "./RTELink"
import { getFeatureConfigFromOpts } from "./RichTextEditorView"

let cursorEventDebounce = debounce()

var getMarks = function(view) {
    var fromPos = view.state.selection.$from.pos, toPos = view.state.selection.$to.pos
    var marks;

    if(fromPos === toPos) {
        marks = view.state.storedMarks || view.state.selection.$from.marks();
    } else {
        // if there is selction alone get marks from, fromPosition + 1, instead of from position:

        // in general the decision to whether enable bold icon or not should be taken based on, if the user types a letter there, will that letter
        // be inserted as bold letter or not, irrespective of whether the from & to positions are same or different, if the letter is inserted as bold
        // letter then bold icon should be enabled else it shld'nt be enabled.
        
        // assume the below case:
        // double click and select a word, and then click bold icon, now the expectation is the word should be bold as well as bold icon should be enabled,
        // because if we type any letter now, the selected word would be replaced by the typed letter, and the letter would be bold as well.
        // but what we get is the word becomes bold but bold icon is not enabled, this is because from position doesn'nt have bold mark,
        // only fromPosition + 1 has bold mark.
        
        var newFromPos = fromPos + 1
        var newResolvedFromPos = view.state.doc.resolve(newFromPos)
        marks = newResolvedFromPos.marks()
    }

    return marks
}

var getLinkMarkBeforeAndAfterCursorIfNotAtCursor = function(marks, view) {

    /**
     * This function is used to get link mark at current cursor position
     * 
     * This API is used by mobile team
     * 
     * Assume a case where "abcdefghi" text is inserted in editor and link is applied only to "def"
     * in this case if cursor is placed before "d", then link context menu will not be shown similarly if cursor is placed after "f" link context menu will not
     * be shown, because in cursorPositionChanged event e.detail.marks will not have link mark
     * 
     * So inorder to cover this case we need to throw link mark when cursor is before "d" or after "f".
     * 
     * When cursor is after "f", then view.state.selection.$from.marks() will have the link mark
     * When cursor is before "d", then view.state.doc.resolve(fromPos + 1).marks() will have the link mark
     * There is an exception for the above 2 cases
     * 
     * If link is inserted at the starting of the line itself, say insert the sentence "hello all" in the beginning of a line and
     * apply link only to "hello" word
     * Now if cursor is placed before "h", then view.state.selection.$from.marks() will itself have link mark,
     * no need to check for view.state.doc.resolve(fromPos + 1).marks()
     */

    var fromPos = view.state.selection.$from.pos, toPos = view.state.selection.$to.pos
    var adjacentLink = null

    if(fromPos === toPos) {
        var isLinkMarkPresent = marks.some((mark) => {
            return mark.type.name === 'link'
        })
        if(!isLinkMarkPresent) {
            var curPosMarks = view.state.selection.$from.marks()
            curPosMarks.some((mark) => {
                if(mark.type.name === 'link') {
                    adjacentLink = mark
                    return true
                }
            })
    
            var newFromPos = fromPos + 1
            if(!adjacentLink && newFromPos <= view.state.doc.content.size) { // do this check so that from pos does'nt exceed the document size
                var newResolvedFromPos = view.state.doc.resolve(newFromPos)
                var newResolvedPosMarks = newResolvedFromPos.marks()
                newResolvedPosMarks.some((mark) => {
                    if(mark.type.name === 'link') {
                        adjacentLink = mark
                        return true
                    }
                })
            }
        }
    }

    return adjacentLink
}

var getParaAttrs = function(view) {
    var paraAtStart = findParentNode(function (node) {
        return node.type.name === 'paragraph'
    })(view.state.selection)

    if (paraAtStart && paraAtStart.node) {
        return paraAtStart.node.attrs
    } else {
        return { }
    }
}

var getParents = function(view) {
    var listAtStart = findParentNode(function (node) {
        return node.type.name === 'orderedList' || node.type.name === 'bulletList'
    })(view.state.selection)

    if(listAtStart && listAtStart.node) {
        return listAtStart.node
    } else {
        return { }
    }
}

var getPath = function(view) {
    var $from = view.state.selection.$from
    var depth = $from.depth
    var parents = []

    for(var i = depth; i >= 0; i--) {
        parents.push($from.node(i))
    }
    return parents
}

function replacePatterns(nodeSerializer, slice) {
    var sl = slice, fr;
    for(let i = 0; i < nodeSerializer.length; i++) {
        fr = nodeSerializer[i].serializeFragment(sl.content);
        sl = new Slice(fr, slice.openStart, slice.openEnd);
    }
    return sl;
}

function handleInitialization(nodeSerializer, state) {
    var schema = state.schema;

    var json = state.doc.toJSON()
    // get slice from json, because replacePaters function which is used to for transformPasted props accepts only slice as input parameter
    var sliceFromJSON = Slice.fromJSON(schema, json)

    var sliceAfterConversion = replacePatterns(nodeSerializer, sliceFromJSON)

    // after getting the converted slice insert it into the editor
    var tr = state.tr.replace(0, state.doc.content.size, sliceAfterConversion)
    tr = tr.setMeta("addToHistory", false)
    return tr
}

let RTECustomPlugins = {
    // A tiny plugin to stop rich text editor events from bubbling up.
    SandboxKeyDownEventsPlugin : function() {
        return new Plugin({
            props: {
                handleDOMEvents: {
                    keydown: function(view, event) {
                        event.stopPropagation();
                    }
                }
            }
        });
    },

    // The plugin is used for esc and enter keyhandling from callbacks passed to it
    keyEventHandlersPlugin : function(handleDOMEvents) {
        return new Plugin({
            props: {
                handleDOMEvents: handleDOMEvents
            }
        });
    },

    

    /**
     * attaches placeholder to the view whenever there is no content in editor
     * @param {String} text
     */
    placeholderPlugin : function(text) {

        return new Plugin({
            state: {
                init: function() {
                    return {'placeholder': text};
                },
                apply: function(tr, state) {
                    // if transaction has meta to placeholder then set it
                    // else return the state itself
                    if (tr.getMeta('setPlaceholder')) {
                        //no i18n
                        var placeholder = tr.getMeta('setPlaceholder'); //no i18n
                        return {'placeholder': placeholder};
                    } else {
                        return state;
                    }
                }
            },
            props: {
                decorations: function decorations(state) {
                    var doc = state.doc;
                    var placeholder = this.getState(state).placeholder;
                    var addPlaceHolder = function(node) {
                        if (doc.childCount === 1 && node.isTextblock && node.content.size === 0) {
                            return DecorationSet.create(doc, [
                                Decoration.node(0, node.nodeSize, {
                                    class: 'ui-rte-placeholder', //no i18n
                                    'data-text': placeholder //no i18n
                                })
                            ]);
                        }
                    };
                    return addPlaceHolder(doc.firstChild);
                }
            }
        });
    },

    drawDecorationsPlugin : function(rteView){
    	var decoration = Decoration;
    	var decorationSet = DecorationSet;
    	return new Plugin({
            key: new PluginKey("drawDecorations"),
    		state: {
        	    init: function(){
        	      return { decorations: {}};
        	    },
        	    apply: function(tr, pluginState) {
                    var decorations = pluginState.decorations
        	        if (tr.getMeta("decorationsOp")) {
                        if(tr.getMeta("decorationsOp").action === "add") {
                            // if in tr.getMeta("decorationsOp").action we have "add" then it means we need to add the decoration
                            var metaData = tr.getMeta("decorationsOp");	//no i18n
                            var { from, to, domAttrs, id } = metaData;

                            decorations[id] = {from, to, domAttrs};
                        } else if(tr.getMeta("decorationsOp").action === "remove") {
                            // if in tr.getMeta("decorationsOp").action we have "remove" string then it means we need to remove the decoration
                            var id = tr.getMeta("decorationsOp").id;
                            delete decorations[id];
                        }
        	        } else if(tr.getMeta("widgetsOp")) {
                        if(tr.getMeta("widgetsOp").action === "add") {
                            var metaData = tr.getMeta("widgetsOp");	//no i18n
                            var { from, domNode, id } = metaData;

                            decorations[id] = {from, domNode};
                        } else if(tr.getMeta("widgetsOp").action === "remove") {
                            var id = tr.getMeta("widgetsOp").id;
                            delete decorations[id];
                        }
                    }
                    return { decorations }
        	    }
        	  },
        	  props: {
        	    decorations: function decorations(state) {
        	        var { decorations } = this.getState(state);

                    if( Object.keys(decorations).length > 0 ) {
                        var decorationsToDraw = []
                        for(var id in decorations) {
                            if(id.includes("rte-decoration-")) {
                                var { from, to, domAttrs } = decorations[id];
                                decorationsToDraw.push(decoration.inline(from, to, domAttrs));
                            } else if(id.includes("rte-widget-")) {
                                var { from, domNode } = decorations[id];
                                decorationsToDraw.push(decoration.widget(from, domNode));
                            }
                        }

                        return decorationSet.create(state.doc, decorationsToDraw);
                    } else {
                        return decorationSet.empty;
                    }
        	    },

                api: {
                    drawHighlight: function(from, to, domAttrs) {
                        var view = rteView.editorView
                        var state = view.state
                        var tr = state.tr

                        var id = "rte-decoration-" + (Math.floor(Math.random() * 100000) + 1)
                        tr = tr.setMeta("decorationsOp", {from, to, domAttrs, id, action: "add"}); //no i18n
                        view.dispatch(tr);
                        return id;
                    },
                    removeHighlight: function(id) {
                        var view = rteView.editorView
                        var state = view.state
                        var tr = state.tr

                        tr = tr.setMeta("decorationsOp", {id, action: "remove"}); //no i18n
                        view.dispatch(tr);
                    },
                    drawWidget: function(from, domNode) {
                        var view = rteView.editorView
                        var state = view.state
                        var tr = state.tr

                        var id = "rte-widget-" + (Math.floor(Math.random() * 100000) + 1)
                        tr = tr.setMeta("widgetsOp", {from, domNode, id, action: "add"}); //no i18n
                        view.dispatch(tr);
                        return id;
                    },
                    removeWidget: function(id) {
                        var view = rteView.editorView
                        var state = view.state
                        var tr = state.tr

                        tr = tr.setMeta("widgetsOp", {id, action: "remove"}); //no i18n
                        view.dispatch(tr);
                    }
                }
              }
    	});
    },


    LinkDetectionPlugin : function(schema, rteView) {
        var linkFeatureConf = getFeatureConfigFromOpts("link", rteView.options)
        var nodeSerializer = NodeSerializer(schema,'link', linkFeatureConf, {}, rteView); //no i18n
        var linkRegex= linkFeatureConf.regex || /(https?|www\.)(:\/\/)?[\-.\w]+(\/?)([a-zA-Z0-9;\-\.\?\,\:\'\~\/\\\+=&amp;!()?%<>\$#_@*^]*)?/;
        return new Plugin({
        	props: {
                transformPasted: function(slice) {
                    var fr = nodeSerializer.serializeFragment(slice.content);
                    var sl = new Slice(fr, slice.openStart, slice.openEnd);
                    return sl;
                }
            },
            appendTransaction: function(trArr, oldState, newState) {
                var wordObj = getWordBeforeCurPos(trArr, oldState, newState);
                if (!wordObj) {return};
                var wordToConvert = wordObj.word;
                var endIndex = wordObj.end;
                var match = wordToConvert.match(linkRegex);
                // if the word has link regex convert it into link
                if (match) {
                    var url = match[0].trim();
                    var str = 'ht' + 'tps?://'; // no i18n
                    var re = new RegExp(str);
                    var mailToRegex = new RegExp('mailto:'); // no i18n
                    if (url.match(re) == null && url.match(mailToRegex) == null) {
                        url = 'ht' + 'tp://' + url; // no i18n
                    }
                    // create new transaction with link added and return it
                    var newTr = newState.tr.addMark(
                        endIndex - match[0].length,
                        endIndex,
                        newState.schema.marks.link.create({ href: url })
                    );
                    
                    // publish an event so that the host application can catch this event and do link unfurling
                    RTELink.dispatchLinkAddedEvent(rteView.editorView, url);
                    return newTr;
                }
                return;
            }
        });
    },

    // Similar to linkReplacerPlugin, but instead of hardcoding the regex to match and what mark to put, we get the
    // regex, the mark and the attrs from options as an array, so we can match multiple regex.
    regexReplacerPlugin : function(schema, options) {
        var matchObjects = preProcessRegex(options.regexReplacer)
        var nodeSerializer = [];
        matchObjects.forEach((matchObj, index) => {// there can be multiple regexReplacers , that is why we are using a loop here
            nodeSerializer[index] = NodeSerializer(schema, 'regexReplacer', options, matchObj)
        })
        return new Plugin({
            key: new PluginKey("regexReplacer"),
        	props: {
                transformPasted: replacePatterns.bind(this, nodeSerializer),
                api: {
                    init: function(rteView) {
                        var view = rteView.editorView
                        var state = view.state
                        var schema = view.state.schema

                        var json = rteView.getJSON()
                        // get slice from json, because replacePaters function which is used to for transformPasted props accepts only slice as input parameter
                        var sliceFromJSON = Slice.fromJSON(schema, json)

                        var sliceAfterConversion = replacePatterns(nodeSerializer, sliceFromJSON)

                        // after getting the converted slice insert it into the editor
                        var tr = state.tr.replace(0, state.doc.content.size, sliceAfterConversion)
                        view.dispatch(tr)
                    }
                }
            },
            appendTransaction: function(trArr, oldState, newState) {

                if(trArr.some((tr) => tr.getMeta("editorInitialized"))) {
                    return handleInitialization(nodeSerializer, newState)
                }

                /**
                 * Here we initially get the current para using the getNearestNonEmptyPara API
                 * Next we remove all the special marks added by this plugin
                 * Next we pass the para's text to the regex, if there is a match we add the mark else we don't add.
                 * 
                 * We are first removing the mark because of the below case: 
                 * Assume that a text was typed and the regex was matched and this mark was applied and then the user decides to delete a part of that text,
                 * in that case the mark would still continue to exist even though it would'nt match the regex.
                 * Inorder to avoid this, for every action we are removing the mark initially, and then doing regex matching and then adding the mark
                 */

                var paraDetails = getNearestNonEmptyPara(trArr, oldState, newState)
                
                if(paraDetails) {
                    var newTr = newState.tr;
                    var isNewTrCreated = false;
                    
                    var paraNode = paraDetails.para
                    var textContent = paraDetails.text
                    var paraStartPos = paraDetails.start

                    // remove the special marks
                    matchObjects.forEach((matchObj) => {
                        var markToApply = newState.schema.marks[matchObj.mark]
                        var nodesContainingThisSpecialMark = findChildrenByMark(paraNode, markToApply)
                        
                        nodesContainingThisSpecialMark.forEach((arrayItem)=> {
                            let currentNode = arrayItem.node

                            // if the markToApply is not link, then we simply remove the markToApply if it is present in currentNode.marks
                            
                            // let's assume regexReplacer is used by the product team to detect phone numbers and replace it with link mark

                            // if the marktoApply is link, then we simply cannot remove the link mark, we need to handle 2 cases:

                            // 1. if the link mark is not applied through regexReplacer, then we don't remove the mark - this is because assume the below case:

                                // user has inserted a link say www.google.com, now if we remove the link mark here, and if we try to match the regex
                                // provided to match phone numbers, the regex will not match as a result the link mark removed will not be re applied again
                            
                            // 2. if the link mark is applied through regexReplacer, then we remove the mark - this is because assume the below case:

                                // user has typed a number say 9876543210, now if we remove the link mark(which was applied through regex replacer) here,
                                // and if we try to match the regex provided to match phone numbers, 
                                // the regex will match again as a result the link mark removed will be re applied again
                                
                                // then why should we remove and apply it? - the answer is, assume the user has typed 9876543210, so the regex will match
                                // and link mark will be applied, now if the user decides to delete the last digit 0, then the number will be
                                // 987654321, now the regex will not match, so we need to remove the link mark once and check it whether the given text
                                // matches the regex, if it matches then we need to re apply the link mark, if it doesn't match then we don't need to
                                // re apply the link mark
                            
                            // Note: How to check whether link mark was applied through regexReplacer or not?
                            // we can check this by checking the autolinked attr of the link mark, if it is true then it was applied through regexReplacer
                            // else it was not applied through regexReplacer

                            if(markToApply.name === 'link') {
                                currentNode.marks = currentNode.marks.filter((mark) => {
                                    if(mark.type.name === matchObj.mark) {
                                        return !mark.attrs.autolinked
                                    } else {
                                        return true
                                    }
                                })
                            } else {
                                currentNode.marks = currentNode.marks.filter((mark) => {
                                    return mark.type.name !== matchObj.mark
                                })
                            }
                        })
                    })

                    // do regex matching and the mark if necessary
                    matchObjects.forEach((matchObj) => {
                        var matchArray = Array.from(textContent.matchAll(matchObj.regex))
                        var markToApply = newState.schema.marks[matchObj.mark]

                        matchArray.forEach((match) => {
                            // since mulitple matches can occur at a single para we need to iterate match variable, this match variable will have value as long as there is a match
                            var matchStart;
                            // in the below if check we are checking if there is a capturing group in regex, if there is capturing group, 
                            // then we apply the given mark to only the first capturing group, if there is no capturing group
                            // then we apply the mark to the entire string
                            if(match[1]) {
                                matchStart = paraStartPos + match.index + match[0].indexOf(match[1])
                            } else {
                                matchStart = paraStartPos + match.index
                            }
                            var matchEnd = paraStartPos + match.index + match[0].length

                            if(!newState.doc.rangeHasMark(matchStart, matchEnd, markToApply)) {
                                isNewTrCreated = true; // required inorder to know whether a newTr is created so that it can be returned, if no tr is created then no need to return anything
                                
                                // matchObj.attrs can be both an object or a function which returns an object(Note: pass first param as match[0] while calling the function)
                                var attrs = {}
                                if(matchObj.attrs) {
                                    if(typeof matchObj.attrs === "object") {
                                        attrs = matchObj.attrs
                                    } else if(typeof matchObj.attrs === "function") {
                                        attrs = matchObj.attrs(match[0])
                                    }
                                }

                                if(markToApply.name === 'link') {
                                    attrs.autolinked = true
                                }
                                newTr = newTr.addMark(
                                    matchStart,
                                    matchEnd,
                                    markToApply.create(attrs)
                                );
                            }
                        })
                    })

                    if(isNewTrCreated) {
                        return newTr;
                    }
                }
            }
        });
    },

    // commented this code as mergefield decoration is not needed as of now
    // var drawMergeFieldDecorations = function() {
    //     var decoration = Decoration;
    //     var decorationSet = DecorationSet;
    //     return new Plugin({
    // 		state: {
    //     	    init: function(){
    //     	      return decorationSet.empty;
    //     	      // No decorations set by default
    //     	    },
    //     	    apply: function(tr) {
    //                     var nodes = [];
    //                     var parentNode = tr.doc;
    //                     var deco = [];
    //                     parentNode.content.nodesBetween(0, parentNode.content.size, function(
    //                         node,
    //                         pos
    //                     ) {
    //                         if (node.type.name === "mergefield") {
    //                             nodes.push(pos);
    //                         }
    //                     });
    //                     nodes.forEach(function(pos) {
    //                         deco.push(decoration.node(pos, pos+1, {class: "rte-mf-decoration"}));	//no i18n
    //                     });
    //                     return decorationSet.create(tr.doc, deco);
    //                 }
    //     	  },
    //     	  props: {
    //     	    decorations: function decorations(state) {
    //     	      return this.getState(state);
    //     	    }
    //     	  }
    // 	});
    // };


    throwDomEventsPlugin : function() {
        return new Plugin({
        	props: {
        		handleClick: function(editorView) {
        			editorView.dom.dispatchEvent(new CustomEvent('editorFocusedOnClick'));	// no i18n
                }
        	}
        });
    },

    CursorEventsPlugin : function() {
        return new Plugin({
            view: function(view) {
                return {
                    update: function(view, oldState) {
                        cursorEventDebounce(function() {
                            var marks = getMarks(view)
                            var paraAttrs = getParaAttrs(view)
                            var parents = getParents(view)
                            var path = getPath(view)
                            var adjacentLink = getLinkMarkBeforeAndAfterCursorIfNotAtCursor(marks, view)
                            view.dom.dispatchEvent(new CustomEvent('cursorPositionChanged', {
                                detail: { marks, paraAttrs, parents, adjacentLink, path }
                            }));
                        }, 100, null)
                    }
                }
            }

            
        })
    },

    globalStoredMarksPlugin : function(rteView) {
        return new Plugin({
            appendTransaction: function(trArr, oldState, newState) {
                var newSelection = newState.selection;
                var oldSelection = oldState.selection;
                var docChanged = false;
                var isPasteFlow = false;
                var storeMarks = true
                if(rteView && rteView.editorView && rteView.editorView.composing) { // when foreign language such as japanese is being typed we should not
                    // pass transactions in between while user is typing multi-byte character
                    return
                }
                trArr.forEach(function(tr){
                    docChanged = docChanged || tr.docChanged;
                    isPasteFlow = isPasteFlow || tr.meta.paste;

                    // for cliq team, whenever mark is applied using markdown, post applying the mark we should'nt carry forward the marks
                    
                    // for eg : if user types **abc**, then we remove starting and ending ** and apply bold mark to abc, post that if user types
                    // any letter after abc it should not be in bold, it should be in normal text only, but thie globalStoredMarksPlugin
                    // will carry forward the bold mark to the next letter also
                    
                    // inorder to prevent this, we are passing the tr which adds the bold mark to the text abc with a meta value storeMarks as false,
                    // so that any tr with meta value storeMarks as false comes then we should not carry forward the marks for that tr alone,
                    // if there is no meta called storeMarks or if meta named storeMarks is set to true
                    // in both these cases we should carry forward the marks
                    storeMarks = tr.getMeta('storeMarks') === false ? false : true
                });
                if (storeMarks && (newSelection.$from.pos !== oldSelection.$from.pos || newSelection.$to.pos !== oldSelection.$to.pos || docChanged || isPasteFlow)) {
                    return addToStoredMarks(newState)
                }
            }
        })
    },

    // inorder to prevent transactions from getting applied to editorState and editorView when editor is not editable
    manageEditabilityPlugin: function(rteView) {
        return new Plugin({
            filterTransaction: function(tr) {
                // when rte.editable is set to false a tr will be created, this tr will come inside this filterTransaction method also.

                // for the first time after setting rte.editable to false alone allow the transaction to be passed,
                // from the next moment onwards don't allow any transactions to be passed if rte.editable is false
                // inorder to identify the first transaction where rte.editable is set to false we would set a meta value named 'editable'
                // so if tr.getMeta('editable') value is present allow that tr alone to be passed else don't allow

                // why do we need to allow the tr with meta value 'editable' ? because only if this tr is dispatched
                // nodeView of code_block will be able to set readOnly value to true for all the code_blocks
                // if this tr is not allowed to pass, then nodeView of code_block will not be able to set readOnly to be true
                // as a result codE_block will still remain editable when rte.editable is set to false

                // similarly if rte is changed from non editable to editable tr.getMeta('editable') will have value but rteView.editorView.editable will be true
                // as a result from this moment onwards all transactions would be dispatched normally.
                if(!tr.getMeta('editable') && !rteView.editorView.editable && tr.docChanged) {
                    return false
                } else {
                    return true
                }
            }
        })
    },

    pastePreProcessPlugin: function(preProcessingFunction) {
        return new Plugin({
            props: {
                transformPastedHTML: function(htmlString, view) {
                    return preProcessingFunction(htmlString, view)
                }
            }
        })
    }

};


export { RTECustomPlugins as default, getMarks, getParaAttrs, getLinkMarkBeforeAndAfterCursorIfNotAtCursor, getPath }