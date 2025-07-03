/* $Id$ */

/**
 * >>> Keymap.generate(schema)
 * {
 *    'Mod-z': undoCommandFn,
 *    'Mod-y': redoCommandFn,
 *    'Mod-b': boldCommandFn
 * }
 */

import { undo, redo } from 'prosemirror-history';
import { splitBlock, liftEmptyBlock, createParagraphNear, chainCommands, deleteSelection, joinBackward, selectNodeBackward } from 'prosemirror-commands';
import { sinkListItem, liftListItem } from 'prosemirror-schema-list';
import { getFeatureConfigFromOpts } from "./RichTextEditorView"
import { Fragment, Slice } from "prosemirror-model"
import { Selection, TextSelection } from "prosemirror-state"
import { canSplit } from "prosemirror-transform"
import { undoInputRule } from "prosemirror-inputrules"
import { joinTextblockBackward } from 'prosemirror-commands';

// the below splitListItem function is copied from prosemirror-schema-list package
// we have modified in 2 places in the lines that follow the comment "added manually by us"
// we have added an if condition to check if the node is of type paragraph and has type as "p" and
// then we have appended the new paragraph node with the attributes of the current paragraph node
// we have made this change inorder to carry forward paragraph attributes to the next paragraph when enter key is pressed
// we have written the code assuming that the first node inside the list item is always a paragraph node
function splitListItem(itemType) {
    return function (state, dispatch) {
        var _state$selection2 = state.selection,
            $from = _state$selection2.$from,
            $to = _state$selection2.$to,
            node = _state$selection2.node;
        if (node && node.isBlock || $from.depth < 2 || !$from.sameParent($to)) {
            return false;
        }
        var grandParent = $from.node(-1);
        if (grandParent.type != itemType) {
            return false;
        }
        if ($from.parent.content.size == 0 && $from.node(-1).childCount == $from.indexAfter(-1)) {
            if ($from.depth == 3 || $from.node(-3).type != itemType || $from.index(-2) != $from.node(-2).childCount - 1) {
                return false;
            }
            if (dispatch) {
                var wrap = Fragment.empty;
                var depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;

                for (var d = $from.depth - depthBefore; d >= $from.depth - 3; d--) {
                    wrap = Fragment.from($from.node(d).copy(wrap));
                }

                var depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1 : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3;
                
                // added manually by us
                if($from.node().type.name === "paragraph" && $from.node().attrs.type === "p") {
                    wrap = wrap.append(Fragment.from(itemType.createAndFill(null, state.schema.nodes.paragraph.create($from.node().attrs))));
                } else {
                    wrap = wrap.append(Fragment.from(itemType.createAndFill()));
                }
                
                var start = $from.before($from.depth - (depthBefore - 1));

                var _tr = state.tr.replace(start, $from.after(-depthAfter), new Slice(wrap, 4 - depthBefore, 0));

                var sel = -1;

                _tr.doc.nodesBetween(start, _tr.doc.content.size, function (node, pos) {
                    if (sel > -1) {
                        return false;
                    }
                    if (node.isTextblock && node.content.size == 0) {
                        sel = pos + 1;
                    }
                });

                if (sel > -1) {
                    _tr.setSelection(Selection.near(_tr.doc.resolve(sel)));
                }
                dispatch(_tr.scrollIntoView());
            }

            return true;
        }

        var nextType = $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
        var tr = state.tr.delete($from.pos, $to.pos);

        // added manually by us
        var types;
        if(nextType && nextType.name === "paragraph" && $from.node().type.name === "paragraph" && $from.node().attrs.type === "p") {
            types = [null, { type: nextType, attrs: $from.node().attrs }];
        } else {
            types = nextType ? [null, {
                type: nextType
            }] : undefined;
        }

        if (!canSplit(tr.doc, $from.pos, 2, types)) {
            return false;
        }
        if (dispatch) {
            dispatch(tr.split($from.pos, 2, types).scrollIntoView());
        }
        return true;
    };
}

// If backspace is pressed when cursor is within the list item at start of the para, then we would try to move that para out of the list.
function moveOutOfList() {
    return function(state, dispatch){
        const { selection, tr } = state;
        const { $from } = selection;
        //this is to skip lift if there is selection, anyway we already have deleteSelection fn in chainCommands as first
        if(!selection.empty){
            return false;
        }  
        
        //Ensuring cursor is at start of the paragraph
        if ($from.parentOffset > 0){
            return false;
        }
        
        //Getting the parent node of para with depth and confirming that parent node is listItem
        const listItem = $from.node(-1);
        if (!listItem || listItem.type.name !== "listItem"){
            return false;
        }

        liftListItem(state.schema.nodes.listItem)(state, dispatch)// need to check for scrollToView

        return true;
    
    }
    
}

// Scenario: 
// 1. abc
// def

// Cursor is before "def"

// Normal working of backspace:
// If backspace is pressed now, then the output is:
// 1. abc
// 2. def (wrap as a listItem)

// The expected behaviour:
// If backspace is pressed now, then the output is:
// 1. abcdef(need to join with previous text block)

// Inorder to achieve this we are calling joinTextblockBackward before joinBackward is called
const customJoinTextblockBackward = (state, dispatch, view) => {
    const $pos = state.selection.$from;

    const resolved = state.doc.resolve($pos.pos - 1);
    var { $from } = TextSelection.near(resolved, -1);
    var isPara = false, isListItem = false, isCursorAtParaStart = false;
    if($from.depth > 2 ) { // the minimum depth required to place a para node inside list item node is 3
      isPara = $from.node($from.depth).type.name === "paragraph"
      isListItem = $from.node($from.depth-1).type.name === "listItem"
      isCursorAtParaStart = $pos.parentOffset === 0;
    }

    if(isPara && isListItem && isCursorAtParaStart) { // if only that previous node is listItem, 
        joinTextblockBackward(state, dispatch, view)
        return true;
    } 
    return false;
};

/***
 * Handling enter key when list plugin is added:
 *  
 * 
 * When enter key is pressed within list then splitListItem() would create a new listItem and store the marks and return true
 * 
 * Else chainCommands() is called when liftEmptyBlock() is used to come out of list and splitBlockKeepMarks() is used to come to a newline as well as store the marks
 */

 function enterHandler(schema) {

    var commandsToExecuteInOrder = []

    if(schema.nodes.listItem) {
        commandsToExecuteInOrder.push(splitListItem(schema.nodes.listItem))
    }

    if(schema.nodes.checkListItem) {
        commandsToExecuteInOrder.push(splitListItem(schema.nodes.checkListItem))
    }

    commandsToExecuteInOrder.push(createParagraphNear, liftEmptyBlock, splitBlockKeepAttrsAndMarks)
    return chainCommands(...commandsToExecuteInOrder)
}

function backspaceHandler(schema){

    var commandsToExecuteInOrder = []

    commandsToExecuteInOrder.push(deleteSelection) //Pushing this as a first command to check first if there is selection while backspacing, then followed by our liftPara fn cmd.

    if(schema.nodes.listItem){
        commandsToExecuteInOrder.push(moveOutOfList(), customJoinTextblockBackward)
    }
    commandsToExecuteInOrder.push(joinBackward, selectNodeBackward)
    return chainCommands(...commandsToExecuteInOrder)
}

export function performEnter(state, dispatch) {
    return enterHandler(state.schema)(state, dispatch);
}

const splitBlockKeepAttrsAndMarks = function (state, dispatch) {
    return splitBlock(state, dispatch && (tr => {

        /**
         * This code is to store the attributes of "p tag alone".
         * 
         * There would be 2 fragments in the content array, the first fragment would contain all the attributes of the previous p tag from which enter key is pressed and the second fragment would contain an empty p tag.
         * 
         * So copy the attributes of first fragment and put it inside the second fragment..... Here if we just copy and paste the attribiutes it isn't working so we have used the setNodeMarkup() API to modify the attributes of the second fragment.
         */
        if (tr.steps[0] && tr.steps[0].slice && tr.steps[0].slice.content && tr.steps[0].slice.content.content[0] && tr.steps[0].slice.content.content[1]) {
            
            let beforeFragment = tr.steps[0].slice.content.content[0];
            let afterFragment = tr.steps[0].slice.content.content[1];
            let beforeFragmentNodeName = beforeFragment.type && beforeFragment.type.name;
            let afterFragmentNodeName = afterFragment.type && afterFragment.type.name;
            let beforeFragmentNodeAttrsType = beforeFragment.attrs && beforeFragment.attrs.type

            if (beforeFragmentNodeName === afterFragmentNodeName && beforeFragmentNodeName === "paragraph" && beforeFragmentNodeAttrsType === "p") {
                // this will cause problem if user wants to add id to all p tags because, if we press enter from first para with id as 123 which is stored in paragraph node attrs,
                // then the next para will also have the same id as 123 instead of new id
                tr.setNodeMarkup(tr.steps[0].from+1, null, beforeFragment.attrs) 
            }

        }

        dispatch(tr)

    }))
}

//to insert a tab character when tab is pressed
let insertTabChar = function () {
    return function (state, dispatch) {
        dispatch(state.tr.insertText("\t").scrollIntoView())
        return true
    }
}

let Shortcuts = {

    generate : function (schema, rteView) {
        var mac =
            typeof navigator != 'undefined'	 //no i18n
                ? /Mac/.test(navigator.platform)
                : false; // no i18n
        var keys = {};

        // this function binds keys with the command
        function bind(key, cmd) {
            keys[key] = cmd;
        }

        bind('Mod-z', chainCommands(undoInputRule, undo)); // no i18n
        // bind('Mod-Z', undo); // no i18n // Causing error in doing undo and redo because capital Z is accepted when Shift-z is pressed along with Mod key
        bind('Shift-Mod-z', redo); // no i18n
        // bind('Shift-Mod-Z', redo); // no i18n  // Causing error in doing undo and redo because capital Z is accepted when Shift-z is pressed along with Mod key
        bind('Mod-y', redo); // no i18n

        if(!rteView.options.isSingleLine) {
            bind('Shift-Enter', function (state, dispatch, view) {	 // no i18n
                var currentPosition = view.state.selection.ranges[0].$from.pos;
                var hardBreakNode = view.state.schema.node('br');// no i18n
                var marks = view.state.selection.ranges[0].$from.marks();
                var tr = view.state.tr.insert(currentPosition, hardBreakNode);
                tr = tr.setStoredMarks(marks);
                view.dispatch(tr);
                return true;
            });
        }

        if(getFeatureConfigFromOpts("align", rteView.options)) {
            bind('Mod-r', function (state, dispatch, view) {
                view.rteView.commands.alignPara('right');
                return true;
            })
            bind('Mod-l', function (state, dispatch, view) {
                view.rteView.commands.alignPara('left');
                return true;
            })
            bind('Mod-e', function (state, dispatch, view) {
                view.rteView.commands.alignPara('center');
                return true
            })
            bind('Mod-j', function (state, dispatch, view) {
                view.rteView.commands.alignPara('justify');
                return true
            })
        }

        if (schema.marks.strong) {
            bind('Mod-b', function (state, dispatch, view) {
                view.rteView.commands.toggleBold();
                return true
            }); // no i18n
        }

        if (schema.marks.em) {
            bind('Mod-i', function (state, dispatch, view) {
                view.rteView.commands.toggleItalic();
                return true
            }); // no i18n
        }

        if (schema.marks.underline) {
            bind('Mod-u', function (state, dispatch, view) {
                view.rteView.commands.toggleUnderline();
                return true
            });
        }

        if (schema.marks.strikeThrough) {
            bind('Shift-Mod-x', function (state, dispatch, view) {
                view.rteView.commands.toggleStrikethrough();
                return true
            }) //no i18n
        }

        if (schema.marks.script) {
            bind('Mod-.', function(state, dispatch, view) {
                view.rteView.commands.toggleSuperScript();
                return true
            })    
            bind('Mod-,', function(state, dispatch, view) {
                view.rteView.commands.toggleSubScript();
                return true;
            })
        }

        if (schema.nodes.listItem) {
            bind("Mod-[", liftListItem(schema.nodes.listItem))
            bind("Mod-]", sinkListItem(schema.nodes.listItem))
            bind("Shift-Tab", liftListItem(schema.nodes.listItem))
            bind("Mod-Shift-7", function (state, dispatch, view) {
                view.rteView.commands.toggleOL(view.state.schema.nodes.orderedList, {}, view);
                return true;
            })
            bind("Mod-Shift-8", function (state, dispatch, view) {
                view.rteView.commands.toggleUL(view.state.schema.nodes.bulletList, {}, view);
                return true;
            })
        }

        keys.Enter = enterHandler(schema)
        keys.Backspace = backspaceHandler(schema)

        if(!rteView.options.disableTabKey) {
            bind('Tab', insertTabChar())
        }

        return keys;
    }
}    

export { Shortcuts as default, splitBlockKeepAttrsAndMarks}