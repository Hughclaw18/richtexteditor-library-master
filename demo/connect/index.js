// construct options
var options = {
    menubar: {
        position: 'bottom',
        customMenuItems:[],
        overrides: {
            highlight: {
                addMenu: function(rteView) {
                    rteView.menubar.addMenu({
                        type: 'button',
                        id: 'highlight',
                        name: 'Highlight',
                        icon: 'rte-icon-text-bg-color',
                        isSVGIcon: true,
                        command: 'toggleHighlight',
                        params: [],
        
                        onContextChange: function () {
                            var view = rteView.editorView
                            var mark = view.state.schema.marks.highlight;
                            var marks = view.state.storedMarks || view.state.selection.$from.marks();
                            return mark.isInSet(marks)
                        }
                    })
                }
            }
        },
        order: [
            {
                id: 'group-1', // put hyphen separated words because this string will exactly be used as id in menubar dom elements, so don't use space separated words
                order: ["strong", "em", "underline", "strikeThrough"]
            },
            {
                id: 'group-2',
                order: ["list"]
            },
            {
                id: 'group-3',
                order: ["link", 'connectHighlight']
            },
            {
                id: 'group-4',
                order: ["blockquote", "images", "video", "code_block"]
            },
            {
                id: 'group-5',
                order: ["html", "datafield"]
            }
        ]
    },

    serializer: {
        br: {
            parseDOM: [{
                tag: 'br',
                context: "listItem/paragraph/",
                getAttrs: function(el) {
                    if(el.className.indexOf('rte-ignore-br') >= 0) {
                        return false
                    }
                }
            }]
        }
    },


    // formatting options to include
    formats: ["strong", "em", "underline", {name: "link", autodetect: false}, "strikeThrough", "connectHighlight"],

    // document elements to include
    features: [
        {name: 'images', getImageUrl: function(file, blob, callback, errorCallback) { setTimeout(()=>{
            // errorCallback("not supported format")
            callback(blob)
        }, 100)}}, // inline-images
        {name: 'mentions', getSuggestions: getAtmentionsSuggestions()
        // getSuggestionsHTML: function (suggestions, type) {
        //     if (type === 'mention') {
        //         var context = {};
        //         context.suggestions = suggestions;
        //         return Handlebars.templates.atmention(context);
        //     }
        // }
        }, // @mentions
        {name: 'emoji', hasZomoji: false},
        'list',
        'code_block',
        'video',
        'blockquote',
        'html',
        "datafield",
        "softBreak"
    ],

    defaults: {
        fontFamily: 'lato',
        fontSize: '16.2px',
        lineHeight: "normal"
    },

    className: 'ui-rte-editor-div outer-wrapper-container',

    plugins: [getBackspaceHandlingPlugin()]

};
RichTextEditor.registerElement({
    datafield: {
        addNodes: function(schema) {
            return schema.spec.nodes.append({
                datafield: {
                    atom: true,
                    group: 'block',
                    inline: false,
                    attrs: {
                        id: '',
                        label: '',
                        meta: {
                            default: {}
                        }
                    },
                    toDOM: function(node) {
                        // Note: can return a DOM element too
                        return ['div', 
                        {
                            class: 'custom-field', 
                            dataFieldId: node.attrs.id, 
                            style: 'border: 1px solid #999; background-color: #f9f9f9; padding: 1px; border-radius: 2px;'
                        }, node.attrs.label]
                    }
                }
            })
        },

        addMenu: function(rteView) {
            rteView.menubar.addMenu({
                type: 'button',
                id: 'datafield',
                name: 'Datafield',
                icon: 'rte-icon-bold',
                isSVGIcon: true,
                shortcut: 'Ctrl+B',
                command: 'connectInsertCustomNode',
                params: ["datafield", {id: '101', label: 'Dhana'}],

                onContextChange: function () {
                    return false
                }
            })
        },

        registerCommand: function(view) {
            view.registerCommand({
                insertField: function(fieldAttrs) {
                    fieldAttrs = fieldAttrs ||{id: '101', label: 'Joe Lewis'} 
                    view.insertNode('datafield', fieldAttrs)
                }
            })
        }
    },
    connectHighlight: {
        addNodes: function(schema) {
            return schema.spec.marks.append({
                connectHighlight : {
                    parseDOM: [
                        {
                            style: 'background-color',
                            context: "paragraph/",
                            getAttrs: function (color) {
                
                                if (color && (color === "#fff8a6" || color === "dark-mode-color")) {
                                    return true
                                }
                                return false
                            }
                        }, {
                            tag: "span.connect-highlight"
                        }
                    ],
                
                    toDOM: function () {
                        return [
                            'span', // no i18n
                            { "class": "connect-highlight" }
                        ];
                    }
                }
            })
        },

        addMenu: function(rteView) {
            rteView.menubar.addMenu({
                type: 'button',
                id: 'connect-highlight',
                name: 'Connect Highlight',
                icon: 'rte-icon-bold',
                isSVGIcon: true,
                command: 'connectHighlight',
                params: [],

                onContextChange: function () {
                    return false
                }
            })
        },

        registerCommand: function(view) {
            view.registerCommand({
                connectHighlight: function() {
                    var view = this.editorView
                    var dispatch = view.dispatch
                    var state = view.state
                    var markType = state.schema.marks.connectHighlight
                    RichTextEditor.PMExports.prosemirrorCommands.toggleMark(markType, null)(state, dispatch)
                    view.focus()
                }
            })
        }
    }
})

RichTextEditor.registerElement({
    softBreak: {
        addPlugin: function (plugins, feature, rteView, schema) {
            var PMModel = RichTextEditor.PMExports.prosemirrorModel
            var PMState = RichTextEditor.PMExports.prosemirrorState
            var DOMParser = PMModel.DOMParser
            var DOMSerializer = PMModel.DOMSerializer
            
            var plugin = new PMState.Plugin({
                key: new PMState.PluginKey('softBreak'),
                props: {
                    transformPastedHTML: function(html) {
                        let softBreakDomParser = new DOMParser(schema, DOMParser.schemaRules(schema).concat([{tag: "br", closeParent: true}]))
                        let div = document.createElement('div')
                        div.innerHTML = html

                        let br = div.querySelector('br')
                        if(br) {
                            // if there is atleast single br tag, then convert all br tags to p tags
                            let doc = softBreakDomParser.parse(div)
                            let domSerializer = DOMSerializer.fromSchema(schema)
                            let target = document.createElement('div')
                            domSerializer.serializeFragment(doc.content, window, target)
                            return target.innerHTML
                        } else {
                            // if there is no br tags, then leave it in the normal flow
                            return html
                        }
                    }
                }
            })
            plugins.push(plugin);
        }
    }
})

function softBreakHandling(rteView) {
    var view = rteView.editorView
    var state = view.state
    var $from = state.selection.$from
    var depth = $from.depth

    for(var i = depth; i >= 0; i--) {
        if($from.node(i).type.name === "orderedList" || $from.node(i).type.name === "bulletList") {
            // cursor inside list, so allow soft break
            var selectionRange = state.selection.ranges[0]
            var currentPosition = selectionRange.$from.pos;
            var hardBreakNode = state.schema.node('br');// no i18n
            var marks = selectionRange.$from.marks();
            
            var tr = state.tr.insert(currentPosition, hardBreakNode);
            tr = tr.setStoredMarks(marks);
            view.dispatch(tr);
            return true;
        }
    }

    // cursor not inside list, so call enterHandling function
    return rteView.commands.performEnter();
}

// init editor once dom content is ready
document.addEventListener('DOMContentLoaded', function() {
    RichTextEditor.onload.then(function() {
        window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), options);
        zwRteView.registerShortcut("Shift-Enter", softBreakHandling)
        zwRteView.registerCommand({
            connectInsertCustomNode: function(nodeName, attrs, from, to) {
                var view = this.editorView;
                var state = view.state
                var { $from, $to } = state.selection;
                $from = from ? state.doc.resolve(from) : $from
                $to = to ? state.doc.resolve(to) : $to
                attrs = attrs || {}

                let paraDepth;
                // get depth of paragraph node, inorder to find the para node after this para node
                for(let i = $from.depth; i >= 0; i--) {
                    if($from.node(i).type.name === 'paragraph') {
                        paraDepth = i;
                        break;
                    }
                }

                if($from.pos === $to.pos) {
                    let posAfterPara = $from.after(paraDepth);
                    let nodeAfterCurPara = state.doc.nodeAt(posAfterPara); // get the para node after the current paara
                    let isCursorInMiddleOfThePara = $from.nodeAfter
                    let customNode = state.schema.nodes[nodeName].create(attrs);

                    // if cursor is in the middle of the para, or else if cursor is at the end of the para and there is a para node after the current para
                    // then insert blockquote node at the current position
                    // or else insert blockquote node at the current position and a new paragraph node after the blockquote node
                    if(isCursorInMiddleOfThePara || (nodeAfterCurPara && nodeAfterCurPara.type.name === 'paragraph')) {
                        tr = state.tr.replaceWith($from.pos, $to.pos, customNode);
                    } else {
                        let paraNode = state.schema.nodes.paragraph.create();
                        tr = state.tr.replaceWith($from.pos, $to.pos, [customNode, paraNode]);
                    }
                } else {
                    let customNode = state.schema.nodes[nodeName].create(attrs);

                    if($from.depth === 0) {
                        // $from.depth === 0 means the entire content is selected
                        // so, in those cases we need to wrap the entire content with blockquote node
                        // and add para node above and below the blockquote node
                        let paraNode = state.schema.nodes.paragraph.create();
                        tr = state.tr.replaceWith($from.pos, $to.pos, [paraNode, customNode, paraNode]);
                    } else {
                        let posAfterPara = $to.after(paraDepth);
                        let nodeAfterCurPara = state.doc.nodeAt(posAfterPara);
                        let isCursorInMiddleOfThePara = $to.nodeAfter

                        if(isCursorInMiddleOfThePara || (nodeAfterCurPara && nodeAfterCurPara.type.name === 'paragraph')) {
                            tr = state.tr.replaceWith($from.pos, $to.pos, customNode);
                        } else {
                            let paraNode = state.schema.nodes.paragraph.create();
                            tr = state.tr.replaceWith($from.pos, $to.pos, [customNode, paraNode]);
                        }
                    }
                }
                
                var pmState = RichTextEditor.PMExports.prosemirrorState
                tr = tr.setSelection(pmState.TextSelection.near(tr.doc.resolve($from.pos + ($from.depth > 0 ? 2 : 3)), 1))
                view.dispatch(tr)
                view.focus();
            },
            connectInsertBlockquote: function() {
                var view = this.editorView;
                var state = view.state
                var { $from, $to } = state.selection;

                let TextSelection = RichTextEditor.PMExports.prosemirrorState.TextSelection;

                let paraDepth;
                // get depth of paragraph node, inorder to find the para node after this para node
                for(let i = $from.depth; i >= 0; i--) {
                    if($from.node(i).type.name === 'paragraph') {
                        paraDepth = i;
                        break;
                    }
                }

                if($from.pos === $to.pos) {
                    let offset = state.tr.selection.anchor + 1;

                    let posAfterPara = $from.after(paraDepth);
                    let nodeAfterCurPara = state.doc.nodeAt(posAfterPara); // get the para node after the current paara
                    let isCursorInMiddleOfThePara = $from.nodeAfter
                    let blockquoteNode = state.schema.nodes.blockquote.createAndFill({}, state.schema.nodes.paragraph.create())

                    // if cursor is in the middle of the para, or else if cursor is at the end of the para and there is a para node after the current para
                    // then insert blockquote node at the current position
                    // or else insert blockquote node at the current position and a new paragraph node after the blockquote node
                    if(isCursorInMiddleOfThePara || (nodeAfterCurPara && nodeAfterCurPara.type.name === 'paragraph')) {
                        tr = state.tr.replaceWith($from.pos, $to.pos, blockquoteNode);
                    } else {
                        let paraNode = state.schema.nodes.paragraph.create();
                        tr = state.tr.replaceWith($from.pos, $to.pos, [blockquoteNode, paraNode]);
                    }
                    
                    // to set the selection inside blockquote node, get the offset value
                    // or else selection will be set at the start of the newly inserted paragraph node
                    tr = tr.setSelection(TextSelection.near(tr.doc.resolve(offset)))
                } else {
                    // get the slice of current selection and put it inside blockquote node
                    let slice = state.selection.content();
                    let blockquoteNode = state.schema.nodes.blockquote.createAndFill({}, slice.content);

                    if($from.depth === 0) {
                        // $from.depth === 0 means the entire content is selected
                        // so, in those cases we need to wrap the entire content with blockquote node
                        // and add para node above and below the blockquote node
                        let paraNode = state.schema.nodes.paragraph.create();
                        tr = state.tr.replaceWith($from.pos, $to.pos, [paraNode, blockquoteNode, paraNode]);
                    } else {
                        let posAfterPara = $to.after(paraDepth);
                        let nodeAfterCurPara = state.doc.nodeAt(posAfterPara);
                        let isCursorInMiddleOfThePara = $to.nodeAfter

                        if(isCursorInMiddleOfThePara || (nodeAfterCurPara && nodeAfterCurPara.type.name === 'paragraph')) {
                            tr = state.tr.replaceWith($from.pos, $to.pos, blockquoteNode);
                        } else {
                            let paraNode = state.schema.nodes.paragraph.create();
                            tr = state.tr.replaceWith($from.pos, $to.pos, [blockquoteNode, paraNode]);
                        }
                    }
                    
                    let newFrom = tr.doc.resolve($from.pos + 3);
                    // +3 is added because if a range of text is selected and blockquote is inserted,
                    // then current $from.pos points at end of paragraph
                    // next position points at blockquote node
                    // next position points at paragraph node
                    // next position only points at text node inside paragraph node which is in turn inside the blockquote node
                    // that is why +3 is added to get the position of the starting of textnode inside blockquote node

                    let newTo = tr.doc.resolve($from.pos + blockquoteNode.content.size + ($from.depth === 0 ? 2 : 1));
                    // if $from.depth !== 0, then newTo would be
                    //      $from.pos + 1 + blockquoteNode.content.size
                    //      $from.pos + 1 points at the start of blockquote node
                    //      blockquoteNode.content.size gives the size of the content inside blockquote node
                    //      thereby $from.pos + 1 + blockquoteNode.content.size points at the end of the para node inside blockquote node
                    // else if $from.depth === 0, then newTo would be
                    //      $from.pos + 2 + blockquoteNode.content.size
                    //      here $from.pos would be 0, since the entire content is selected
                    //      $from.pos points at the start of first para node
                    //      $from.pos + 1 points at the end of current para node
                    //      $from.pos + 2 points at the start of blockquote node
                    //      blockquoteNode.content.size gives the size of the content inside blockquote node
                    //      thereby $from.pos + 2 + blockquoteNode.content.size points at the end of the para node inside blockquote node
                    tr = tr.setSelection(new TextSelection(newFrom, newTo))
                }
                
                view.dispatch(tr)
                view.focus();
            },
            connectInsertCodeblock: function() {
                var view = this.editorView;
                var state = view.state
                var { $from, $to } = state.selection;

                let TextSelection = RichTextEditor.PMExports.prosemirrorState.TextSelection;

                let paraDepth;
                
                for(let i = $from.depth; i >= 0; i--) {
                    if($from.node(i).type.name === 'paragraph') {
                        paraDepth = i;
                        break;
                    }
                }

                if($from.pos === $to.pos) {
                    let offset = state.tr.selection.anchor + 1;

                    let posAfterPara = $from.after(paraDepth);
                    let nodeAfterCurPara = state.doc.nodeAt(posAfterPara);
                    let isCursorInMiddleOfThePara = $from.nodeAfter
                    let codeblockNode = state.schema.nodes.code_block.create({id: 'code-block-' + Math.floor(Math.random()*100000)})

                    if(isCursorInMiddleOfThePara || (nodeAfterCurPara && nodeAfterCurPara.type.name === 'paragraph')) {
                        tr = state.tr.replaceWith($from.pos, $to.pos, codeblockNode);
                    } else {
                        let paraNode = state.schema.nodes.paragraph.create();
                        tr = state.tr.replaceWith($from.pos, $to.pos, [codeblockNode, paraNode]);
                    }
                    
                    tr = tr.setSelection(TextSelection.near(tr.doc.resolve(offset)))
                } else {
                    let text = state.doc.textBetween($from.pos, $to.pos, '\n', '');
                    let codeblockContent = state.schema.text(text);
                    let codeblockNode = state.schema.nodes.code_block.create({id: 'code-block-' + Math.floor(Math.random()*100000)}, codeblockContent);

                    if($from.depth === 0) {
                        let paraNode = state.schema.nodes.paragraph.create();
                        tr = state.tr.replaceWith($from.pos, $to.pos, [paraNode, codeblockNode, paraNode]);
                    } else {
                        let posAfterPara = $to.after(paraDepth);
                        let nodeAfterCurPara = state.doc.nodeAt(posAfterPara);
                        let isCursorInMiddleOfThePara = $to.nodeAfter

                        if(isCursorInMiddleOfThePara || (nodeAfterCurPara && nodeAfterCurPara.type.name === 'paragraph')) {
                            tr = state.tr.replaceWith($from.pos, $to.pos, codeblockNode);
                        } else {
                            let paraNode = state.schema.nodes.paragraph.create();
                            tr = state.tr.replaceWith($from.pos, $to.pos, [codeblockNode, paraNode]);
                        }
                    }
                    
                    let newFrom = tr.doc.resolve($from.pos + ($from.depth === 0 ? 3 : 2));

                    let newTo = tr.doc.resolve($from.pos + codeblockNode.content.size + ($from.depth === 0 ? 3 : 2));
                    tr = tr.setSelection(new TextSelection(newFrom, newTo))
                }
                
                view.dispatch(tr)
                view.focus();
            }
        })
        zwRteView.registerCommand({
            toggleHighlight: function() {
                var view = zwRteView.editorView
                var state = view.state
                var dispatch = view.dispatch
                var command = RichTextEditor.PMExports.commands.toggleMark(state.schema.marks.highlight, {})
                command(state, dispatch)
                zwRteView.editorView.focus()
            }
        })
    })
})

function getBackspaceHandlingPlugin() {

    var pmState = RichTextEditor.PMExports.prosemirrorState
    var specialNodes = ["code_block", "blockquote"]
    var ordinaryNodes = ["paragraph", "orderedList", "bulletList"]
    var blockAtomNodes = ["html"]

    return new pmState.Plugin({
        key: new pmState.PluginKey('backspaceHandling'),
        props: {
            handleKeyDown: function(view, e) {
                var backspace = e.keyCode === 8
                
                if (backspace) {

                    var cursorAtParaBeginning = false;
                    var { $from, $to } = view.state.selection
                    var curPosition = $from.pos

                    if(view.state.selection.$from.depth > 0 && $from === $to) {

                        var paraStartPosition = view.state.selection.$from.before();
                        if(paraStartPosition + 1 === curPosition) {
                            cursorAtParaBeginning = true
                        }
                        
                        // paraStartPosition === 0 means we are trying to delete the top most paragraph, so we shpuld not do anything
                        // we should allow default backspace behavior
                        if (cursorAtParaBeginning && paraStartPosition > 0) {
                            
                            var startingPosOfParentNodeAtFirstDepth = $from.before(1)
                            var parentNodeAtFirstDepth = view.state.doc.nodeAt(startingPosOfParentNodeAtFirstDepth)

                            // if parent node at first depth is not a paragraph, then it can be blockquote, table, etc
                            // if it is table or blockquote then don't do anything, in these cases backspace will be handled by the editor
                            if(parentNodeAtFirstDepth.type.name === "paragraph") {
                                var endPosOfPreviousNodeAtFirstDepth =  view.state.doc.resolve(startingPosOfParentNodeAtFirstDepth - 1)
                                var startPosOfPreviousNodeAtFirstDepth = endPosOfPreviousNodeAtFirstDepth.before(1)
                                var previousNodeAtFirstDepth = view.state.doc.nodeAt(startPosOfPreviousNodeAtFirstDepth)

                                var posAfterCurPara = $to.after(1);
                                var nodeAfterCurPara = view.state.doc.nodeAt(posAfterCurPara);
                                
                                // if node after current para is an ordinary node then don't do anything, backspace will be handled by the editor
                                
                                // if previous node at first depth is a special node and (the node after current para is not a ordinary node or if
                                // there is no node after current para),
                                // then on hitting backspace we should not delete the current para, instead we should put the cursor at the end of the
                                // previous node

                                // if previous node at first depth is a block atom node, then on hitting backspace we should delete the previous node
                                var isOrdinaryNode = nodeAfterCurPara && ordinaryNodes.includes(nodeAfterCurPara.type.name)
                                var isSpecialNode = specialNodes.includes(previousNodeAtFirstDepth.type.name)
                                var isBlockAtomNode = blockAtomNodes.includes(previousNodeAtFirstDepth.type.name)

                                if(isSpecialNode && !isOrdinaryNode) {
                                    var tr = view.state.tr
                                    tr = tr.setSelection(pmState.TextSelection.near(endPosOfPreviousNodeAtFirstDepth, -1))
                                    view.dispatch(tr)
                                    return true
                                } else if(isBlockAtomNode) {
                                    var tr = view.state.tr
                                    tr = tr.delete(startPosOfPreviousNodeAtFirstDepth, endPosOfPreviousNodeAtFirstDepth.pos + 1)
                                    tr = tr.setSelection(pmState.TextSelection.near(tr.doc.resolve(startPosOfPreviousNodeAtFirstDepth), -1))
                                    view.dispatch(tr)
                                    return true
                                }
                            }

                        }
                    }
                }

                return false
            }    
        }
    })
}

function getAtmentionsSuggestions() {
    return function(type, text, callback, extras, view) {
        var suggestions = getsuggestions();
        if (type === 'mention') {
            var newSuggestions = [];
            for (var index = 0; index < suggestions.length; index++) {
                var suggestion = suggestions[index];
                var suggestionName = suggestion.fullname;
                var suggestionMailId = suggestion.emailid;
                var textSize = text.length;
                var nameStartsWithText =
                    text.toUpperCase() ===
                    suggestionName.slice(0, textSize).toUpperCase();
                var mailIdStartsWithText =
                    text.toUpperCase() ===
                    suggestionMailId.slice(0, textSize).toUpperCase();
                if (nameStartsWithText || mailIdStartsWithText) {
                    newSuggestions.push(suggestion);
                }
            }
            callback && callback(newSuggestions);
        }
    };
}

function getsuggestions() {
    return [
        {
            "zuid": 1001,
            "fullname": "Random Names",
            "usertype": "personal",
            "val": "Random@testrte.com",
            "emailid": "Random@testrte.com"
        },
        {
            "zuid": 1002,
            "fullname": "Samiyah Sosa",
            "usertype": "personal",
            "val": "Samiyah@testrte.com",
            "emailid": "Samiyah@testrte.com"
        },
        {
            "zuid": 1003,
            "fullname": "Ophelia Sims",
            "usertype": "personal",
            "val": "Ophelia@testrte.com",
            "emailid": "Ophelia@testrte.com"
        },
        {
            "zuid": 1004,
            "fullname": "Elysia Clay",
            "usertype": "personal",
            "val": "Elysia@testrte.com",
            "emailid": "Elysia@testrte.com"
        },
        {
            "zuid": 1005,
            "fullname": "Khia Pacheco",
            "usertype": "personal",
            "val": "Khia@testrte.com",
            "emailid": "Khia@testrte.com"
        },
        {
            "zuid": 1006,
            "fullname": "Nasir Whittaker",
            "usertype": "personal",
            "val": "Nasir@testrte.com",
            "emailid": "Nasir@testrte.com"
        },
        {
            "zuid": 1007,
            "fullname": "Anthony Newman",
            "usertype": "personal",
            "val": "Anthony@testrte.com",
            "emailid": "Anthony@testrte.com"
        },
        {
            "zuid": 1008,
            "fullname": "Aniqa Sullivan",
            "usertype": "personal",
            "val": "Aniqa@testrte.com",
            "emailid": "Aniqa@testrte.com"
        },
        {
            "zuid": 1009,
            "fullname": "Ernie Woodward",
            "usertype": "personal",
            "val": "Ernie@testrte.com",
            "emailid": "Ernie@testrte.com"
        },
        {
            "zuid": 1010,
            "fullname": "Pranav Copeland",
            "usertype": "personal",
            "val": "Pranav@testrte.com",
            "emailid": "Pranav@testrte.com"
        },
        {
            "zuid": 1011,
            "fullname": "Elsa Wheeler",
            "usertype": "personal",
            "val": "Elsa@testrte.com",
            "emailid": "Elsa@testrte.com"
        },
        {
            "zuid": 1012,
            "fullname": "Meadow Norman",
            "usertype": "personal",
            "val": "Meadow@testrte.com",
            "emailid": "Meadow@testrte.com"
        },
        {
            "zuid": 1013,
            "fullname": "Zayaan Bowler",
            "usertype": "personal",
            "val": "Zayaan@testrte.com",
            "emailid": "Zayaan@testrte.com"
        },
        {
            "zuid": 1014,
            "fullname": "Rihanna Burns",
            "usertype": "personal",
            "val": "Rihanna@testrte.com",
            "emailid": "Rihanna@testrte.com"
        },
        {
            "zuid": 1015,
            "fullname": "Huda Wainwright",
            "usertype": "personal",
            "val": "Huda@testrte.com",
            "emailid": "Huda@testrte.com"
        },
        {
            "zuid": 1016,
            "fullname": "Raife Hernandez",
            "usertype": "personal",
            "val": "Raife@testrte.com",
            "emailid": "Raife@testrte.com"
        },
        {
            "zuid": 1017,
            "fullname": "Zayyan Dunkley",
            "usertype": "personal",
            "val": "Zayyan@testrte.com",
            "emailid": "Zayyan@testrte.com"
        },
        {
            "zuid": 1018,
            "fullname": "Maison Banks",
            "usertype": "personal",
            "val": "Maison@testrte.com",
            "emailid": "Maison@testrte.com"
        },
        {
            "zuid": 1019,
            "fullname": "Athena Drummond",
            "usertype": "personal",
            "val": "Athena@testrte.com",
            "emailid": "Athena@testrte.com"
        },
        {
            "zuid": 1020,
            "fullname": "Bailey Silva",
            "usertype": "personal",
            "val": "Bailey@testrte.com",
            "emailid": "Bailey@testrte.com"
        },
        {
            "zuid": 1021,
            "fullname": "Kenzie Rivers",
            "usertype": "personal",
            "val": "Kenzie@testrte.com",
            "emailid": "Kenzie@testrte.com"
        },
        {
            "zuid": 1022,
            "fullname": "Brandon-Lee Ratcliffe",
            "usertype": "personal",
            "val": "Brandon-Lee@testrte.com",
            "emailid": "Brandon-Lee@testrte.com"
        },
        {
            "zuid": 1023,
            "fullname": "Macauley O'Connor",
            "usertype": "personal",
            "val": "Macauley@testrte.com",
            "emailid": "Macauley@testrte.com"
        },
        {
            "zuid": 1024,
            "fullname": "Belle Guerra",
            "usertype": "personal",
            "val": "Belle@testrte.com",
            "emailid": "Belle@testrte.com"
        },
        {
            "zuid": 1025,
            "fullname": "Carly Rubio",
            "usertype": "personal",
            "val": "Carly@testrte.com",
            "emailid": "Carly@testrte.com"
        },
        {
            "zuid": 1026,
            "fullname": "Finlay Price",
            "usertype": "personal",
            "val": "Finlay@testrte.com",
            "emailid": "Finlay@testrte.com"
        },
        {
            "zuid": 1027,
            "fullname": "Margie Riley",
            "usertype": "personal",
            "val": "Margie@testrte.com",
            "emailid": "Margie@testrte.com"
        },
        {
            "zuid": 1028,
            "fullname": "Kim Derrick",
            "usertype": "personal",
            "val": "Kim@testrte.com",
            "emailid": "Kim@testrte.com"
        },
        {
            "zuid": 1029,
            "fullname": "Mira Matthams",
            "usertype": "personal",
            "val": "Mira@testrte.com",
            "emailid": "Mira@testrte.com"
        },
        {
            "zuid": 1030,
            "fullname": "Laaibah Herring",
            "usertype": "personal",
            "val": "Laaibah@testrte.com",
            "emailid": "Laaibah@testrte.com"
        },
        {
            "zuid": 1031,
            "fullname": "Hayley Hays",
            "usertype": "personal",
            "val": "Hayley@testrte.com",
            "emailid": "Hayley@testrte.com"
        },
        {
            "zuid": 1032,
            "fullname": "Tyrone Solis",
            "usertype": "personal",
            "val": "Tyrone@testrte.com",
            "emailid": "Tyrone@testrte.com"
        },
        {
            "zuid": 1033,
            "fullname": "Thelma Rasmussen",
            "usertype": "personal",
            "val": "Thelma@testrte.com",
            "emailid": "Thelma@testrte.com"
        },
        {
            "zuid": 1034,
            "fullname": "Fionnuala English",
            "usertype": "personal",
            "val": "Fionnuala@testrte.com",
            "emailid": "Fionnuala@testrte.com"
        },
        {
            "zuid": 1035,
            "fullname": "Kirsten Mata",
            "usertype": "personal",
            "val": "Kirsten@testrte.com",
            "emailid": "Kirsten@testrte.com"
        },
        {
            "zuid": 1036,
            "fullname": "Austen Salinas",
            "usertype": "personal",
            "val": "Austen@testrte.com",
            "emailid": "Austen@testrte.com"
        },
        {
            "zuid": 1037,
            "fullname": "Reiss Piper",
            "usertype": "personal",
            "val": "Reiss@testrte.com",
            "emailid": "Reiss@testrte.com"
        },
        {
            "zuid": 1038,
            "fullname": "Jamel Charles",
            "usertype": "personal",
            "val": "Jamel@testrte.com",
            "emailid": "Jamel@testrte.com"
        },
        {
            "zuid": 1039,
            "fullname": "Lloyd Harrington",
            "usertype": "personal",
            "val": "Lloyd@testrte.com",
            "emailid": "Lloyd@testrte.com"
        },
        {
            "zuid": 1040,
            "fullname": "Presley Rodrigues",
            "usertype": "personal",
            "val": "Presley@testrte.com",
            "emailid": "Presley@testrte.com"
        },
        {
            "zuid": 1041,
            "fullname": "Payton Bannister",
            "usertype": "personal",
            "val": "Payton@testrte.com",
            "emailid": "Payton@testrte.com"
        }
    ];    
}