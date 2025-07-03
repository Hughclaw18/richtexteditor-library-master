import { Plugin } from "prosemirror-state"
import {Fragment,Slice} from "prosemirror-model"
import {ReplaceAroundStep} from "prosemirror-transform"
import { liftListItem } from "prosemirror-schema-list"
import { findChildrenByType } from "prosemirror-utils"
import { Decoration, DecorationSet } from "prosemirror-view"
import { getFeatureConfigFromOpts } from "../RichTextEditorView"

const maxNoOfIndentsAllowed = 4

var handleTabAndBackspace = function(view, e) {
    var options = view.rteView.options
    var tab = e.keyCode === 9;
    var backspace = e.keyCode === 8
    
    if (backspace && getFeatureConfigFromOpts("indent", options)) { 
        return handleBackspace(view)
    } else if(tab && !e.shiftKey && (getFeatureConfigFromOpts("list", options) || getFeatureConfigFromOpts("checkList", options))) { //if tab key is alone pressed and shift key is not pressed call nestedListHandling, if shift key is pressed along with tab key then don't handle
        return nestedListHandling(view)
    } else {
        return false;
    }
}    

function nestedListHandling(view) {
    /**
     * CASES:
     * 1. if listItem and no preceeding text and not the first item: create sublist
     * 2. otherwise don't handle
     */

    var listOpts = getFeatureConfigFromOpts('list', view.rteView.options)
    var OLTypesOrder = listOpts && listOpts.OLTypesOrder || ['decimal', 'lower-alpha', 'lower-roman']
    var ULTypesOrder = listOpts && listOpts.ULTypesOrder || ['disc', 'circle', 'square']

    var isList = false;
    var isCheckList = false;
    var noPreceedingText = false;
    var notTheFirstListItem = false;
    var tableWithinList = false
    var itemType;

    let { $from, $to } = view.state.selection
    $from.blockRange($to, function (node) {
        if (node.type == view.state.schema.nodes.table_cell) {
            // Used to check whether table is present within list because if tab is pressed whithin a table 
            // which is inside a list the pointer needs to move to the next cell and it should not create a sublist.
            tableWithinList = true
        }
        if(node.type === view.state.schema.nodes.listItem) {
            isList = true
            itemType = view.state.schema.nodes.listItem
            return true
        } else if(node.type === view.state.schema.nodes.checkListItem) {
            isCheckList = true
            itemType = view.state.schema.nodes.checkListItem
            return true
        } else {
            return false
        }
    })

    if (tableWithinList || $from.depth <= 0) {
        // depth === 0 represents cursor is at doc node, as a result current para can't be obtained using $from.before() api
        // so return false
        // depth can't be less than 0 in any case
        return false;
    }

    let curPosition = $from.pos//get index of the current position of the cursor 
    let paraStartPosition = $from.before();//index of the starting position of the current line
    
    if (paraStartPosition + 1 === curPosition) {
        noPreceedingText = true
    }
    if ((isList || isCheckList) && noPreceedingText) {
        // var parentListNode = $from.node($from.depth - 2);
        // notTheFirstListItem = parentListNode.content.content.length > 1;
        var range = $from.blockRange($to, node => node.childCount && node.firstChild.type == itemType)//used to get the from and to positions and the depth value of the parent that matches the given condition
        if(range && range.startIndex > 0) {
            notTheFirstListItem = true
        }
    }

    if (( isList || isCheckList ) && noPreceedingText && notTheFirstListItem) {
        
        let listItemNumber = range.startIndex
        let parent = range.parent, nodeBefore = parent.child(listItemNumber - 1)

        /**
         * Case 1: If previous list item does'nt have a sublist - The current list item should be converted as a new sublist.
         * 
         * Case 2: If the previous listItem consists of a sublist - The current list item should be appended as the child of the sublist of previous list item. 
         */
        let nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type//checks whether previous list item has a sublist or not.
        let inner = Fragment.from(nestedBefore ? itemType.create() : null)//returns an empty Fragment

        /**
         * Case 1: If nestedBefore is true - slice variable consists of a listItem node within an OrderedList node within a listItem node.
         * 
         * Case 2: If nestedBefore is false - slice variable consists of an OrderedList node within a listItem node.
         */

        // if the parent is checkList then the slice should be created normally
        // if the parent is orderedList or checkList then a new list should be created with the next type and not with the same current parent type
        // how to compute next type? - the order is based on OLTypesOrder/ULTypesOrder
        // if the current type is not in list, then the next type should be the starting item in the OLTypesOrder/ULTypesOrder
        // if the current type is in list, then the next type should be the next item in the list

        let slice;
        if(nestedBefore || parent.type.name === 'checkList') {
            slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(parent.attrs, inner)))), nestedBefore ? 3 : 1, 0)
        } else {
            let nextType
            if(parent.type.name === 'orderedList') {
                let currentTypeInd = OLTypesOrder.indexOf(parent.attrs.type)
                nextType = OLTypesOrder[(currentTypeInd + 1) % OLTypesOrder.length]
            } else if(parent.type.name === 'bulletList') {
                let currentTypeInd = ULTypesOrder.indexOf(parent.attrs.type)
                nextType = ULTypesOrder[(currentTypeInd + 1) % ULTypesOrder.length]
            }
            slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create({...parent.attrs, type: nextType}, inner)))), nestedBefore ? 3 : 1, 0)
        }

        let before = range.start, after = range.end
        view.dispatch(view.state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true)).scrollIntoView())

        return true
    }

    // if not handled return false
    return false
}

function indentHandling(view, type, opts) {
    var tr = view.state.tr
    var isViewModified = false
    
    view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
        if (node.type.name === 'paragraph') {
            
            if(type === 'increase') {
                if(node.attrs.indent < maxNoOfIndentsAllowed) { // only allow 4 indents
                    isViewModified = true
                    if(opts && opts.extraAttrs) {
                        let newExtraAttrs = Object.assign({}, node.attrs.extraAttrs, opts.extraAttrs)
                        tr.setNodeMarkup(pos, node.type, {
                            ...node.attrs, indent: node.attrs.indent + 1, extraAttrs: newExtraAttrs
                        }, node.marks)
                    } else {
                        tr.setNodeMarkup(pos, node.type, {...node.attrs, indent: node.attrs.indent + 1}, node.marks)
                    }
                }
            } else if(type === 'decrease') {
                if(node.attrs.indent > 0) { // don't allow indent to go below 0
                    isViewModified = true
                    if(opts && opts.extraAttrs) {
                        let newExtraAttrs = Object.assign({}, node.attrs.extraAttrs, opts.extraAttrs)
                        tr.setNodeMarkup(pos, node.type, {
                            ...node.attrs, indent: node.attrs.indent - 1, extraAttrs: newExtraAttrs
                        }, node.marks)
                    } else {
                        tr.setNodeMarkup(pos, node.type, {...node.attrs, indent: node.attrs.indent - 1}, node.marks)
                    }
                }
            }
            
        }
    })

    if(isViewModified) {
        view.dispatch(tr);
        view.focus();
        return true
    }

    // if increase/decrease indent is not possible return false
    return false
}

function handleBackspace(view) {

    // only if the cursor is at the beginning of the para and from === to alone, try to reduce the indent
    // if the cursor is at the middle of the para, then return false so that global handling will catch it and
    // try to delete the previous character(default behaviour of backspace key)
    // similarly if from !== to then it means there is a text selection which implies the user is going to delete a set of text,
    // so don't do decrease indent return false

    var noPreceedingText = false;
    var { $from, $to } = view.state.selection
    var curPosition=$from.pos

    if(view.state.selection.$from.depth > 0 && $from === $to) {

        var paraStartPosition = view.state.selection.$from.before();//index of the starting position of the current line
        if(paraStartPosition+1 === curPosition) {
            noPreceedingText=true
        }
        
        if (noPreceedingText) {
            return indentHandling(view, 'decrease')
        }
    }
    
    return false
}

// for increase indent the priorities are as follows:
// 1. First check whether a list can be nested if so do it, else return(before doing check whether list feature is included or not)
// 2. If a list can't be nested then try to increase indent for that para, if the indent level is already 4 then don't do anything(before doing this check whether indent format is included or not)

export function increaseIndent(rteView, opts) {

    var view = rteView.editorView
    var options = rteView.options

    var isListFeaturePresent = getFeatureConfigFromOpts('list', options)
    var isCheckListFeaturePresent = getFeatureConfigFromOpts('checkList', options)
    var isNestedListCreated = (isListFeaturePresent || isCheckListFeaturePresent) && nestedListHandling(view)

    if(isNestedListCreated) {
        return true
    } else {
        var isIndentIncreased = indentHandling(view, 'increase', opts)
        if(isIndentIncreased) {
            return true
        }
    }

    return false
}

// for decrease indent the priorities are as follows:
// 1. First check whether we can decrease the indent if so do it, else if indent level is already 0 then don't do anything(before doing this check whether indent format is included or not)
// 2. If decrease indent can't be done then try whether a list can be moved out, if so do that, else return(before doing check whether list feature is included or not)

export function decreaseIndent(rteView, opts) {

    var view = rteView.editorView
    var options = rteView.options
    var isListFeaturePresent = getFeatureConfigFromOpts('list', options)
    var isCheckListFeaturePresent = getFeatureConfigFromOpts('checkList', options)

    var isIndentDecreased = indentHandling(view, 'decrease', opts)

    if(isIndentDecreased) {
        return true
    } else if(isListFeaturePresent || isCheckListFeaturePresent) {

        let movedOutOfList = false;

        if(isListFeaturePresent) {
            movedOutOfList = liftListItem(view.state.schema.nodes.listItem)(view.state, view.dispatch)   
        }

        // if listItem can't be moved out of list as well as if there is checkList feature then try to move checkList item out of checkList
        if(!movedOutOfList && isCheckListFeaturePresent) {
            return liftListItem(view.state.schema.nodes.checkListItem)(view.state, view.dispatch)
        } else {
            // here movedOutOfList can be either true or false
            // case 1: movedOutOfList will be true when list Item has been moved out of list
            // case 2: movedOutOfList will be false if we can't move list Item out of list as well as there is no check list feature
            return movedOutOfList
        }
    } else {
        return false
    }

}

export function getListsPlugin(richTextView) {
    return new Plugin({
        // key: richTextView.pluginKeys.list, TODO: if necessary try to create a plugin key as done for tables feature in featureConf.js file using the createNewPluginKey() function
        props: {
            handleKeyDown: handleTabAndBackspace
        }
    })
}

export function getCheckedListPlugin(richTextView) {
    return new Plugin({
        props: {
            handleClickOn: function(view, pos, node, nodePos, event, direct) {
                if(direct && node.type.name === 'checkListItem') {
                    // even if the node is checkListItem we still check for these class names in event.target because, sometimes the p tag
                    // in checkListItem node can also be clicked, but if the user clicks the p tag we should make the checkbox ticked or unticked
                    // we should only make the checkbox ticked or unticked if the svg is clicked
                    var isCheckBoxClicked = Array.prototype.some.call(event.target.classList, (className) => {
                        if(className === 'rte-check-box') {
                            return true
                        } else if(className === 'rte-check-box-svg') {
                            return true
                        } else if(className === 'rte-check-box-use') {
                            return true
                        } else {
                            return false
                        }
                    })
                    if(isCheckBoxClicked) {
                        event.preventDefault()
                        var tr = view.state.tr
                        tr = tr.setNodeMarkup(nodePos, node.type, {isChecked: !node.attrs.isChecked}, node.marks)
                        view.dispatch(tr)
                    }
                }
            }
        }
    })
}

export function getCheckedListDecorationPlugin() {
    return new Plugin({
        props: {
            decorations: function decorations(state) {
                var docNode = state.doc;
                var checkListItemNode = state.schema.nodes.checkListItem
                var decorationsArray = []
                var checkListItemArray = findChildrenByType(docNode, checkListItemNode)
                checkListItemArray.forEach((node) => {
                    if(node.node.attrs.isChecked) {
                        // for calling Decoration.node() function we need from and to positions to point "just before" and "just after" the first paragrpah node
                        // node.pos points just before the checkListItem node, so do +1 to get the position just before the paragraph node
                        // we for sure know that the first node inside checkListItem node would be a paragraph node(because checkListItem node's content is "paragraph block*"")
                        // that is why we can say that node.pos + 1 will for sure point just before the paragraph node
                        // inorder to get the toPos we need to add fromPos + firstParaNodeSize, this is enough to point the toPos just after the paragraph node
                        var fromPos = node.pos + 1
                        var firstParaNode = state.doc.nodeAt(fromPos)
                        var firstParaNodeSize = firstParaNode.nodeSize
                        var toPos = fromPos + firstParaNodeSize
                        decorationsArray.push(Decoration.inline(fromPos, toPos, {
                            'check-list-item-decoration': ''
                        }))
                    }
                })
                return DecorationSet.create(docNode, decorationsArray)
            }
        }
    });
}