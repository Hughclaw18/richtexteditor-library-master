import { EditorView as CodeMirror, keymap as cmKeymap, drawSelection, lineNumbers } from '@codemirror/view';
import { Compartment, EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript';
// import { paliLang, paliHighlighter } from './PaliLang';
// import { json } from '@codemirror/lang-json';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { defaultKeymap } from '@codemirror/commands';
import { undo, redo } from 'prosemirror-history';
import { indentWithTab } from '@codemirror/commands';
import { deleteCodeBlock } from './commands';
import { Selection, TextSelection } from "prosemirror-state"
import { getFeatureConfigFromOpts } from "../RichTextEditorView"
import { oneDark } from "@codemirror/theme-one-dark"
import { undoInputRule } from "prosemirror-inputrules"

function dispatchTrAndCallFocus(tr) {
    var view = this
    view.dispatch(tr)
    view.focus()
}

function customChainCommands(...commands) {
    let view = this;
    return function () {
        for (let i = 0; i < commands.length; i++) {
            if (commands[i](view.state, dispatchTrAndCallFocus.bind(view))
            ) {
                return true;
            }
        }
        return false;
    };
}

export default class CodeBlockView {
    constructor(node, view, getPos, options) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        // only if readOnly extension is set as a compartment we can toggle it's value whenever required
        this.readOnly = new Compartment()
        this.theme = new Compartment()
        this.codeBlockOptions = getFeatureConfigFromOpts("code_block", options)

        let extensions = [
            cmKeymap.of([...this.codeMirrorKeymap(), indentWithTab, ...defaultKeymap]),
            // drawSelection(),
            CodeMirror.updateListener.of((update) => this.forwardUpdate(update)),
            // if readOnly is set to false, then code_blocks will be editable,
            // if it is set to true then code_blocks will not be eidtable
            this.readOnly.of(EditorState.readOnly.of(false))
        ]

        let needLineNumbers = this.codeBlockOptions.lineNumbers === false ? false : true // by default lineNumbers will be enabled
        let needLineWrap = this.codeBlockOptions.lineWrap
        let needDarkTheme = options.isDarkThemeEnabled
        let needInputHandler = this.codeBlockOptions.inputHandler ? true : false
        let needSyntaxHighlighting = this.codeBlockOptions.syntaxHighlighting === false ? false : true
        
        needLineNumbers && extensions.push(lineNumbers())
        needLineWrap && extensions.push(CodeMirror.lineWrapping) // by default lineWrap will not be enabled
        needDarkTheme ? extensions.push(this.theme.of(oneDark)) : extensions.push(this.theme.of(syntaxHighlighting(defaultHighlightStyle)))
        needInputHandler && extensions.push(
            CodeMirror.inputHandler.of((view, from, to, text) => {
                return this.codeBlockOptions.inputHandler({ codeBlockView: view, from, to, text }, this.view.rteView)
            })
        )
        needSyntaxHighlighting && extensions.push(javascript()) // by default javascript syntax highlighting will be enabled

        // codemirror instance
        this.cm = new CodeMirror({
            doc: this.node.textContent,
            root: options.codeBlockRoot,
            extensions: extensions
        });

        // The editor's outer node is our DOM representation
        this.dom = this.cm.dom;
        this.dom.id = this.node.attrs.id

        // This flag is used to avoid an update loop between the outer and
        // inner editor
        this.updating = false;

        this.view.dom.addEventListener("cmDarkMode", () => {
            options.isDarkThemeEnabled = true
            this.cm.dispatch({effects: this.theme.reconfigure(oneDark)})
        })
        this.view.dom.addEventListener("cmLightMode", () => {
            options.isDarkThemeEnabled = false
            this.cm.dispatch({ effects: this.theme.reconfigure(syntaxHighlighting(defaultHighlightStyle)) })
        })
    }

    // called when an update happens to codemirror
    forwardUpdate(update) {
        if (this.updating || !this.cm.hasFocus) {
            return;
        }
        let offset = this.getPos() + 1,
            cmSel = update.state.selection;
        let selFrom = offset + cmSel.main.from,
            selTo = offset + cmSel.main.to;
        let pmSel = this.view.state.selection;
        // console.log('forwardUpdate: checking if selection need to be translated')
        if (update.docChanged || pmSel.from != selFrom || pmSel.to != selTo) {
            let tr = this.view.state.tr;
            var self = this;
            update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
                if (text.length) {
                    tr.replaceWith(offset + fromA, offset + toA, this.view.state.schema.text(text.toString()));
                } else {
                    tr.delete(offset + fromA, offset + toA);
                }
                offset += toB - fromB - (toA - fromA);
            });
            tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));
            this.view.dispatch(tr);
        }
    }


    setSelection(anchor, head) {
        this.cm.focus();
        this.updating = true;
        this.cm.dispatch({ selection: { anchor, head } });
        this.updating = false;
    }

    codeMirrorKeymap() {
        let view = this.view;
        return [
            { key: 'ArrowUp', run: () => this.maybeEscape('line', -1) },
            { key: 'ArrowLeft', run: () => this.maybeEscape('char', -1) },
            { key: 'ArrowDown', run: () => this.maybeEscape('line', 1) },
            { key: 'ArrowRight', run: () => this.maybeEscape('char', 1) },
            { key: 'Ctrl-z', mac: 'Cmd-z', run: customChainCommands.bind(view)(undoInputRule, undo) },
            // used chainCommands here for 2 reasons
            // 1. assume that there is only one undoable item within the codeblock and this undo will delete the contents inside codeblock and
            // delete the codeblock itself,
            // in this case if simply mod-z is pressed then undo will be called directly without using chainCommands as a result, the focus in the editor
            // will be lost, because undo function does not call view.focus() at last
            // but in chainCommands we have explicitly called view.focus() after calling view.dispatch(), so the focus will be preserved
            // 2. assume for cliq case, in editor if triple bacticks is entered then automatically it gets converted to codeblock using input rules,
            // now if user presses undo we need to come to a state where 3 backticks are present, for this we need to apply undoInputRule
            // instead of undo
            { key: 'Shift-Ctrl-z', mac: 'Shift-Cmd-z', run: () => redo(view.state, view.dispatch) },
            { key: 'Ctrl-y', mac: 'Cmd-y', run: () => redo(view.state, view.dispatch) },
            { key: 'Backspace', run: () => this.onBackspace(view.state, view.dispatch, view)}
        ];
    }

    maybeEscape(unit, dir) {
        let { state } = this.cm,
            { main } = state.selection;
        if (!main.empty) {
            return false;
        }
        if (unit == 'line') {
            main = state.doc.lineAt(main.head);
        }
        // if the movement is within the confines of codemirror, do nothing
        if (dir < 0 ? main.from > 0 : main.to < state.doc.length) {
             return false;
        }

        // console.log('escaping out of codemirror...', unit, dir)
        // if it came here, it means the focus has to escape out of codemirror
        if(this.codeBlockOptions.smartCursorNavigation !== false) {
            // if down or up arrow key is pressed and if there is no para above/below codeblock, then cursor can't come out of codeblocks
            // so inorder to avoid this we are checking whether there is any node below codeblock at same depth level for cursor to go out of codeblock
            // if no such node is there, then we add a paragraph

            // for eg if codeblock is the first node, and if there is no para above or below it, then there is no way for
            // cursor to come below or above it and type, so in these cases we add empty para above/below codeblock
            // and move the cursor to the above/below paragraph respectively
            let $from = this.view.state.selection.$from
            let codeBlockDepth;
                    
            for(let i = $from.depth; i >= 0; i--) {
                if($from.node(i).type.name === 'code_block') {
                    codeBlockDepth = i;
                    break;
                }
            }
            if(codeBlockDepth) {
                if(dir < 0) {
                    let parentNodeDepth = codeBlockDepth - 1
                    let childNumberOfCodeBlockInParent = $from.path[(parentNodeDepth * 3) + 1]
                    if(childNumberOfCodeBlockInParent === 0) {
                        let posToInsertParaAboveCodeBlock = $from.path[(parentNodeDepth * 3) + 2]
                        let paraNode = this.view.state.schema.nodes.paragraph.create();
                        this.view.dispatch(this.view.state.tr.insert(posToInsertParaAboveCodeBlock, paraNode))
                    }
                } else {
                    let nodePosAfterCurPos = $from.after(codeBlockDepth)
                    let nodeBelowCodeBlock = this.view.state.doc.nodeAt(nodePosAfterCurPos)
                    if(!nodeBelowCodeBlock) {
                        let paraNode = this.view.state.schema.nodes.paragraph.create();
                        this.view.dispatch(this.view.state.tr.insert(nodePosAfterCurPos, paraNode))
                    }
                }
            }
        }

        let targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
        let selection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
        let tr = this.view.state.tr.setSelection(selection).scrollIntoView();
        this.view.dispatch(tr);

        // focus appropriate view
        var nextResolvedPos = this.view.state.doc.resolve(selection.$from.pos)
        var nextNode = nextResolvedPos.parent
        if (nextNode.type.name === 'code_block') {
            // get corresponding nodeView
            // how? iterate all views and compare
            for (var i = 0, offset = 0; i < this.view.docView.children.length; i++) {
                var child = this.view.docView.children[i]
                if (selection.$from.pos >= child.posAtStart && selection.$from.pos <= child.posAtEnd) {
                    // child is a codeblock corresponding to the new position
                    // console.log('focussing: ', child)
                    child.spec.cm.focus({preventScroll: true});
                }
            }
        } else {
            this.view.focus({preventScroll: true});
        }
    }

    update(node) {
        if (node.type != this.node.type) { 
            return false;
        }
        this.node = node;

        // when rte.editable is set to false or true we need to explicitly set code_blocks.editable also because nodeViews continue to work even when editor is set to
        // readOnly mode, when rte.editable is set to false we change the readOnly attribute of code_block node to true
        // so if the node attribute value and the value of the readOnly extension for codeMirror is not the same then
        // change the value of the codeMirror readOnly extension value to the node attrobute value
        if(node.attrs.readOnly !== this.readOnly.get(this.cm.state).value) {
            this.cm.dispatch({effects: this.readOnly.reconfigure(EditorState.readOnly.of(node.attrs.readOnly))})
        }
        
        if (this.updating) {
            return true;
        }
        let newText = node.textContent,
            curText = this.cm.state.doc.toString();
        if (newText != curText) {
            let start = 0,
                curEnd = curText.length,
                newEnd = newText.length;
            while (start < curEnd && curText.charCodeAt(start) == newText.charCodeAt(start)) {
                ++start;
            }
            while (
                curEnd > start &&
                newEnd > start &&
                curText.charCodeAt(curEnd - 1) == newText.charCodeAt(newEnd - 1)
            ) {
                curEnd--;
                newEnd--;
            }
            this.updating = true;
            this.cm.dispatch({
                changes: {
                    from: start,
                    to: curEnd,
                    insert: newText.slice(start, newEnd)
                }
            });
            this.updating = false;
        }
        return true;
    }

    selectNode() {
        this.cm.focus();
    }
    stopEvent() {
        return true;
    }

    ignoreMutation() {
        return true;
    }

    onBackspace(state, dispatch, view) {
        if (
            state.selection.empty &&
            state.selection.$head.parent.type.name === 'code_block' &&
            !state.selection.$head.parent.textContent.length
        ) {
            deleteCodeBlock(view)
            view.focus()
        }
    }
}
