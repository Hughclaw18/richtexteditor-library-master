/* $Id$ */
import { Fragment } from 'prosemirror-model'; 
import { getEmojiList, getShortCutList, getZomojiList, getTrimmedEmojiName } from './prosemirror-emoji/RTEEmoji';
import RTELink from "./RTELink"


function nodeSerializer(schema,serializerType,options,matchDetails,rteView) {

    // pass the text matching link regex to this function
    var linkReplacer = function (text, schema, currentMarks) {
        var storedMarks = [];
        if(currentMarks.length) {
            storedMarks = storedMarks.concat(currentMarks);
        }
        var hasMarkPresent = schema.marks.link.isInSet(storedMarks);
        if(hasMarkPresent) {
            let linkMark = storedMarks.filter(function(mark) {
                return mark.type.name === 'link';
            })[0];

            // publish an event so that the host application can catch this event and do link unfurling
            RTELink.dispatchLinkAddedEvent(rteView.editorView, linkMark.attrs.href)
        } else {
            storedMarks.push(schema.mark('link', {href:text})); //no i18n

            // publish an event so that the host application can catch this event and do link unfurling
            RTELink.dispatchLinkAddedEvent(rteView.editorView, text)
        }
        return createTextNode(text, storedMarks); //no i18n
    };

    var customNodeReplacer = function (text, schema, currentMarks) {
        var storedMarks = [];
        var customMark = matchDetails.mark
        if(currentMarks.length) {
            storedMarks = storedMarks.concat(currentMarks);
        }
        var hasMarkPresent = schema.marks[customMark].isInSet(storedMarks);  

        // assume a case where regex replacer is added and it says to add link mark whenever it matches an indian phone number
        // now 2 cases arises:

        // i. if custom mark provided in regex replacer is link mark and if storedMarks also contain link mark then 2 cases arises:

            // 1. if link mark in stored marks does not have the attribute autolinked then remove the existing link mark and,
            // add the new one with the autolinked attribute - this case would arise in the following context:
            // assume there is already a phone number typed in some where else and it is wrapped in "a"(anchor) tag, now if the user comes and pastes that
            // content in the editor, it would pass through the parseDOM of link mark, there the attribute autoLinked will not be present in "a"(anchor) tag
            // and the link mark will be applied to the pasted content without the
            // autolinked attribute, so we need to remove the existing link mark and add the new one with the autolinked attribute

            // 2. if link mark in stored marks has the attribute autolinked then don't do anything - this case would arise in the following context:
            // assume there is already a phone number typed in editor and link mark is applied through regex replacer, now if the user copies this text
            // and pastes it in the editor then the pasted content would pass through the parseDOM of link mark and the pasted content will have the
            // attribute autolinked in the "a"(anchor) tag as a result the link mark will also have the attribute autolinked
            // so we no need to remove it

        // ii. if the custom mark is some other mark and not link mark or if custom mark is link mark but the link mark is not present in stored marks
        // then 3 cases arises:
            
            // 1. if custom mark is not link mark then:
                // 1. if the mark is not present then add it
                // 2. if the mark is already present then dont do anything
            // 2. if custom mark is link mark and if it is not in storedMarks then:
                // 1. add the link mark along with the autolinked attribute
        if(customMark === 'link' && hasMarkPresent) {
            let appliedLinkMark = storedMarks.filter(function(mark) {
                return mark.type.name === customMark;
            })[0];
            if(!appliedLinkMark.attrs.autolinked) {
                storedMarks = storedMarks.filter(function(mark) {
                    return mark.type.name !== customMark;
                })

                // matchDetails.attrs can be both an object or a function which returns an object(pass the text as first param while calling function)
                let attrs = {}
                if(matchDetails.attrs) {
                    if(typeof matchDetails.attrs === "object") {
                        attrs = matchDetails.attrs
                    } else if(typeof matchDetails.attrs === "function") {
                        attrs = matchDetails.attrs(text)
                    }
                }

                attrs.autolinked = true
                storedMarks.push(schema.mark(customMark, attrs)); //no i18n
            }
        } else {
            if(!hasMarkPresent) {
                // matchDetails.attrs can be both an object or a function which returns an object(pass the text as first param while calling function)
                let attrs = {}
                if(matchDetails.attrs) {
                    if(typeof matchDetails.attrs === "object") {
                        attrs = matchDetails.attrs
                    } else if(typeof matchDetails.attrs === "function") {
                        attrs = matchDetails.attrs(text)
                    }
                }
                if(customMark === 'link') {
                    attrs.autolinked = true
                }
                storedMarks.push(schema.mark(customMark, attrs)); //no i18n
            }
        }
        return createTextNode(text, storedMarks); //no i18n
    };


    var serializeFragment = function (fragment) {
        var nodeArr = fragment.content;
        var newNodeArr = [];
        
        // iterates over each node and replace each node with if possible
        nodeArr.forEach(function(node){
            if(node.isLeaf && node.isText) {    // if leaf and text node then start replacing
                var serializedArr = [node];
                // passes the node as array element initially present
                // which in turn returns array of nodes
                // this array of nodes is passed to next serializer enabled
                // this helps in converting all the convertible matches in the node into proper nodes
                serializedArr = getSerializedNodes(serializedArr);
                newNodeArr = newNodeArr.concat(serializedArr);
            }else if(node.isLeaf && !node.isText) {     // if leaf but not text, then leave the node as it is
                newNodeArr.push(node);
            } else if (node.type.name === 'paragraph') {
                // if not leaf node then iterate again for getting leafnodes
                // here the non leaf node is again serialized so that its child can get serialized
                // the result of serializer would be a fragment
                // so it is converted into node using to node
                // NOTE: NODETYPE TO TONODE WILL BE SAME AS THE CURRENT NODE AS IT SHOULD BE CONVERTED TO THE SAME PARENT NODE
                newNodeArr.push(toNode(this.serializeFragment(node.content), node.type.name, node.attrs, node.marks));
            } else {
                newNodeArr.push(node)
            }
        },this);
        // returns fragment from the  serialized node array
        // return Fragment.fromArray(newNodeArr);
        return Fragment.fromArray(newNodeArr);
    };


    // converts framents to given nodetype 
    var toNode = function(fragment, nodeType, attrs, marks) {
        return schema.node(nodeType, attrs, fragment, marks);
    };
    
    // converts given nodeArr into serialized node array using regex and
    var getSerializedNodes =  function(nodes) {
        var nodeArr = [];
        var replaceNodesMatchingRegex = typeMap[serializerType].replaceNodesMatchingRegex;
        nodes.forEach(function(node){
            nodeArr = nodeArr.concat(replaceNodesMatchingRegex(node));
        },this);
        return nodeArr;
    };


    // creates leaf nodes from text and type passed to it
    var createTextNode = function(text, mark) {
        var node;
        node = mark? (schema.text(text, mark)): (schema.text(text));
        return node;
    };



    // replaces nodes matching the given regex using replacer 
    // returns nodeArray after replacing the node with alternative nodes
    var replaceLinkNodesMatchingRegex = function(node) {
        var text = node.text;
        var regex = options.regex || /(https?|www\.)(:\/\/)?[\-.\w]+(\/?)([a-zA-Z0-9;\-\.\?\,\:\'\~\/\\\+=&amp;!()?%<>\$#_@*^]*)?/;
        var match = text.match(regex);
        var matchIndex = null;
        var matchLength = null;
        var nodeArr = [];
        var marksetInNode = node.marks;
        var textElementToBeReplaced;
        
        // if the node contains match then loop it untill all its match gets replaced
        while(match) {
            matchIndex = match.index;
            matchLength = match[0].length;
            var textElement = text.slice(0, matchIndex);
            textElementToBeReplaced = text.slice(matchIndex, matchIndex + matchLength);
            if (textElement) {  // if it is textelement without match then convert it into text node
                nodeArr.push(createTextNode(textElement, marksetInNode));
            }
            nodeArr.push(linkReplacer(textElementToBeReplaced, schema, marksetInNode));    // replace the matched element with replacer
            text = text.slice(matchIndex + matchLength);
            match = text.match(regex);
        }

        // the text that remains after all match is converted to text node
        if (text) {
            nodeArr.push(createTextNode(text, marksetInNode));
        }
        return nodeArr;
    };

    var replaceCustomNodesMatchingCustomRegex = function(node) {

        // here a particular case has'nt been covered. The description of the case is below:
        // In this logic we match the regex only with text within a node, not across nodes , so as a result assume a text which comes as abcdef@gmail.com
        // with abc alone in bold rest all in normal letters
        // the expectation is that the entire mail id abcdef@gmail.com should be matched and the mark should be applied,
        // but the outcome is abc will be in bold and def@gmail.com only will match with the regex
        // this is because since we iterate through each node and get the text, abc will be a separate node because bold mark is applied there and 
        // def@gmail.com will be separate node because there are no marks applied for this node

        // this bug doesn't occur if we type this text instead of pasting
        // while typing the logic used in appendTransactions of regexReplacerPlugin is different,  we get the text of that particular para and 
        // then do regex matching, as a result abcdef@gmail.com will get matched irrespective of whatever marks are applied for abc

        //inorder to avoid the above bug we need to do something like the typing logic, get the text within that para and then do regex matching

        var text = node.text;
        var regex = matchDetails.regex;
        var matchArray = Array.from(text.matchAll(regex));
        var matchIndex = null;
        var startIndex = 0;
        var matchLength = null;
        var nodeArr = [];
        var marksetInNode = node.marks;
        var textElementToBeReplaced;
        
        // if the node contains match then loop it untill all its match gets replaced
        matchArray.forEach((match) => {
            // we are doing the below check because of the below case:
            // the regex we are using may be like /\s+\w{4}/, this regex matches one or more spaces followed by exactly the next 4 letters
            // so in these cases the user might expect to apply the mark for only the 4 letters and not to the before matched space characters,
            // so in these cases we expect the user to provide the regex as /\s+(\w{4})/, where there is exactly one capturing group enclosed by round brackets
            // (here \w{4} is enclosed in round brackets in the regex) to which the mark needs to be applied
            // so only if there a single capturing group there will be match[1] element 
            // that contains the string that matched the first capturing group(excluding the spaces)
            // the match[0] element consists of the string that matched the entire string(including the spaces),
            // for example let the string be "abc   defghijk", in this case the match object will be like
            // match[0] = "   defg"
            // match[1] = "defg"
            // match.input = "abc   defghijk"
            // match.index = 3
            // in the above case the matchIndex(the starting position for which the mark needs to be applied) variable should be match[0].indexOf(match[1])
            // the match

            // if there is no capturing group then the mark will be applied to the entire matched string
            if(match[1]) {
                matchIndex = match.index + match[0].indexOf(match[1])
            } else {
                matchIndex = match.index;
            }
            matchLength = match[0].length;
            var textElement = text.slice(startIndex, matchIndex);
            textElementToBeReplaced = text.slice(matchIndex, match.index + matchLength);
            // here instead of matchIndex + matchLength we are putting match.index + matchLength, because in the above "abc   defghijk" example:
            // match.index = 3, matchIndex = 6, matchLength = 7,
            // so match.index + matchLength = 10, whereas matchIndex + matchLength = 13, but we want to slice only "defg" from the text which are from indices
            // 6(inclusive) to 10(exclusive) and not from 6(inclusive) to 13(exclusive)
            if (textElement) {  // if it is textelement without match then convert it into text node
                nodeArr.push(createTextNode(textElement, marksetInNode));
            }
            nodeArr.push(customNodeReplacer(textElementToBeReplaced, schema, marksetInNode));    // replace the matched element with replacer
            startIndex = match.index + matchLength
        })

        // the text that remains after all match is converted to text node
        if (text.slice(startIndex, text.length)) {
            nodeArr.push(createTextNode(text.slice(startIndex, text.length), marksetInNode));
        }
        return nodeArr;
    };

    var replaceEmojiNodesMatchingList = function(node) {
        var text = node.text;
        var marksetInNode = node.marks;
        var words = text.split(' ');
        var nodeArr = [];
        var newText = '';
        var hasZomoji = options.hasZomoji;
        var shortcut = getShortCutList();
        var emojiList = getEmojiList();
        var zomojiList = hasZomoji ? getZomojiList() : {};
        words.forEach(function(word, index) {
            var match = shortcut[word] || word;
            var matchedEmoji = emojiList[match];
            var matchedZomji = zomojiList[match];
            if (matchedEmoji) {
                if (newText) {
                    nodeArr.push(createTextNode(newText, marksetInNode));
                    newText = '';
                }
                index && nodeArr.push(createTextNode(' ', marksetInNode));
                nodeArr.push(createEmojiNode(matchedEmoji));
            } else if (matchedZomji) {
                if (newText) {
                    nodeArr.push(createTextNode(newText, marksetInNode));
                    newText = '';
                }
                index && nodeArr.push(createTextNode(' ', marksetInNode));
                nodeArr.push(createZomoji(match));
            } else {
                newText += index ? ' ' + word : word;
            }
        });
        newText && nodeArr.push(createTextNode(newText, marksetInNode));
        return nodeArr;
    };

    var createEmojiNode = function(codeArr) {
        var emojiCode = codeArr.map(function(code){
            return "0"+code.slice(2);
        });
        var node = schema.text(String.fromCodePoint.apply(null,emojiCode));
        return node;
    };

    var createZomoji = function(name) {
        name = getTrimmedEmojiName(name);
        var node = schema.nodes.emoji.create({emojiName:name});
        return node;
    }

    var typeMap = {
        link : {
            replaceNodesMatchingRegex: replaceLinkNodesMatchingRegex
        },
        emoji: {
            replaceNodesMatchingRegex: replaceEmojiNodesMatchingList
        },
        regexReplacer: {
            replaceNodesMatchingRegex: replaceCustomNodesMatchingCustomRegex
        }
    };

    return {
        serializeFragment: serializeFragment
    };
};

export default nodeSerializer