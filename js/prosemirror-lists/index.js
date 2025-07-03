export {orderedList,getBulletList,listItem} from "./listNodes"
export {addListNodes, addCheckListNode} from "./utils"
export {getListsPlugin, getCheckedListPlugin, getCheckedListDecorationPlugin} from "./listsPlugin"
import { liftListItem, wrapInList } from "prosemirror-schema-list"
import { TextSelection, Selection } from "prosemirror-state"

var defaultUnorderedListType = 'disc'
var defaultOrderedListType = 'decimal'

function convertFromOneListToAnother(currentListItemType, listTypeToBeApplied, attrs, view) {
    let dispatch = view.dispatch
    let $from = view.state.selection.$from
    let state = view.state
    
    // get the start and end position of the grand parent node of the current selection
    // grand parent node should be a orderedList, bulletList or checkList
    let startPosOfParentNode = $from.before($from.depth - 2)
    let endPosOfParentNode = $from.after($from.depth - 2)
    let resolvedStartPosOfParentNode = state.doc.resolve(startPosOfParentNode)
    let resolvedEndPosOfParentNode = state.doc.resolve(endPosOfParentNode)
    
    // select the entire grand parent node
    // Note: do TextSelection, don't do NodeSelection becuase if we do NodeSelection then liftListItem and wrapInList will not work
    var { $from : resolvedStartPosOfTextSelectionOfParentNode } = Selection.near(resolvedStartPosOfParentNode)
    var { $to : resolvedEndPosOfTextSelectionOfParentNode } = Selection.near(resolvedEndPosOfParentNode, -1)
    dispatch(state.tr.setSelection(new TextSelection(resolvedStartPosOfTextSelectionOfParentNode, resolvedEndPosOfTextSelectionOfParentNode)))

    // remove the grand parent by calling liftListItem and then wrap that selection with listTypeToBeApplied by calling wrapInList
    // below pass view.state, instead of state, because we need to get the updated selection in state variable
    // if we use only state variable then we will not get the updated selection
    liftListItem(currentListItemType)(view.state, dispatch)
    return wrapInList(listTypeToBeApplied, attrs)(view.state, dispatch)
}

var toggleOrderedList = function(listType, type, view, opts) {
    /**
     * Depth should have a minimum value of 3 for the cursor to be inside a list
     * 
     * Depth 0 - doc node
     * Depth 1 - orderList/ bulletList
     * Depth 2 - listItem node
     * Depth 3 - paragraph
     * 
     * We can't place the cursor at the starting of listItem node, we can only place the cursor at the starting of the paragraph node, so the minimun depth
     * required would be 3 for the cursor to be inside a list.
     * Note: There is one exception to this assumption, create a list with 2 items and then in the end of 2nd list item insert an hr node, now select the hr node
     * by keeping the cursor at the start of first list item and press down arrow until the hr node is selected, when hr node is selected the depth of $from pos
     * would be 2, so ignore this case alone - if we try to toggle a list now nothing happens
     * In general when hr node alone is selected anywhere in the editor we will not be able to create a list
     * 
     * if depth is > 2, then:
     *      is the parent node of $from pos, is a bullet list or ordered list then:
     *              if the listStyleType of current node and the list type to which it needs to be changed are same then:
     *                      we need to make it work as a toggle, that is we need to move the current selection out of the list
     *              else if the listStyleType of current node and the list type to which it needs to be changed are not same then:
     *                      if the parent node is orderedList then:
     *                              then we only need to change the attribute of the parent node to the list type to which it needs to be changed
     *                      else if the parent node is unorderedList then:
     *                              then we need to change the parent node itself to ordered list and set it's attribute to the list type to which it needs to
     *                              be changed
     *      if the parent node of $from pos, is checkList then:
     *          call the convertFromOneListToAnother function to convert the checkList to orderedList
     *      if the parent node of $from pos, is not a bullet list or ordered list or checkList then:
     *              we need to wrap the given selection into ordered list and set it's attribute to the list type to which it needs to be changed
     * else if depth is <= 2 then:
     *     we need to wrap the given selection into ordered list and set it's attribute to the list type to which it needs to be changed
     */

    type = type || defaultOrderedListType
    var attrs = { type: type }
    if(opts && opts.extraAttrs) {
        attrs.extraAttrs = opts.extraAttrs
    }

    let state = view.state
    let dispatch = view.dispatch
    let listItemNode = state.schema.nodes.listItem
    let orderedListNode = state.schema.nodes.orderedList
    let checkListItemNode = state.schema.nodes.checkListItem

    let { $from } = view.state.selection;
    if($from.depth <= 2) {
        return wrapInList(listType, attrs)(state, dispatch)
    }

    let parentNode = $from.node($from.depth - 2)
    let isUnorderedList = parentNode.type.name === "bulletList"
    let isOrderedList = parentNode.type.name === "orderedList"
    let isCheckList = parentNode.type.name === "checkList"

    if(isOrderedList || isUnorderedList) {
        let listStyleType = parentNode.attrs ? parentNode.attrs.type : defaultOrderedListType
        let posOfParentNode = $from.before($from.depth - 2)
        let tr = state.tr

        if(listStyleType === attrs.type) {
            return liftListItem(listItemNode)(state, dispatch)
        } else {
            if(isOrderedList) {
                if(opts && opts.extraAttrs) {
                    let newExtraAttrs = Object.assign({}, parentNode.attrs.extraAttrs, attrs.extraAttrs)
                    tr = tr.setNodeMarkup(posOfParentNode, parentNode.type, {...parentNode.attrs, type: attrs.type, extraAttrs: newExtraAttrs}, parentNode.marks)
                } else {
                    tr = tr.setNodeMarkup(posOfParentNode, parentNode.type, {...parentNode.attrs, type: attrs.type}, parentNode.marks)
                }
            } else {
                tr = tr.setNodeMarkup(posOfParentNode, orderedListNode, attrs, parentNode.marks)
            }
            dispatch(tr)
        }
    } else if(isCheckList) {
        return convertFromOneListToAnother(checkListItemNode, orderedListNode, attrs, view)
    } else {
        return wrapInList(listType, attrs)(state, dispatch)
    }
}

var toggleUnorderedList=function(listType, type, view, opts) {
    /**
     * if depth is > 2, then:
     *      is the parent node of $from pos, is a bullet list or ordered list then:
     *              if the listStyleType of current node and the list type to which it needs to be changed are same then:
     *                      we need to make it work as a toggle, that is we need to move the current selection out of the list
     *              else if the listStyleType of current node and the list type to which it needs to be changed are not same then:
     *                      if the parent node is unOrderedList then:
     *                              then we only need to change the attribute of the parent node to the list type to which it needs to be changed
     *                      else if the parent node is OrderedList then:
     *                              then we need to change the parent node itself to unOrdered list and set it's attribute to the list type to which it needs to
     *                              be changed
     *      if the parent node of $from pos, is checkList then:
     *          call the convertFromOneListToAnother function to convert the checkList to bulletList
     *      if the parent node of $from pos, is not a bullet list or ordered list or checkList then:
     *              we need to wrap the given selection into unOrdered list and set it's attribute to the list type to which it needs to be changed
     * else if depth is <= 2 then:
     *     we need to wrap the given selection into unOrdered list and set it's attribute to the list type to which it needs to be changed
     */

    type = type || defaultUnorderedListType
    var attrs = { type: type }
    if(opts && opts.extraAttrs) {
        attrs.extraAttrs = opts.extraAttrs
    }

    let state = view.state
    let dispatch = view.dispatch
    let listItemNode = state.schema.nodes.listItem
    let unOrderedListNode = state.schema.nodes.bulletList
    let checkListItemNode = state.schema.nodes.checkListItem

    let { $from } = view.state.selection;
    if($from.depth <= 2) {
        return wrapInList(listType, attrs)(state, dispatch)
    }

    let parentNode = $from.node($from.depth - 2)
    let isUnorderedList = parentNode.type.name === "bulletList"
    let isOrderedList = parentNode.type.name === "orderedList"
    let isCheckList = parentNode.type.name === "checkList"

    if(isOrderedList || isUnorderedList) {
        let listStyleType = parentNode.attrs ? parentNode.attrs.type : defaultUnorderedListType
        let posOfParentNode = $from.before($from.depth - 2)
        let tr = state.tr

        if(listStyleType === attrs.type) {
            return liftListItem(listItemNode)(state, dispatch)
        } else {
            if(isUnorderedList) {
                if(opts && opts.extraAttrs) {
                    let newExtraAttrs = Object.assign({}, parentNode.attrs.extraAttrs, attrs.extraAttrs)
                    tr = tr.setNodeMarkup(posOfParentNode, parentNode.type, {...parentNode.attrs, type: attrs.type, extraAttrs: newExtraAttrs}, parentNode.marks)
                } else {
                    tr = tr.setNodeMarkup(posOfParentNode, parentNode.type, {...parentNode.attrs, type: attrs.type}, parentNode.marks)
                }
            } else {
                tr = tr.setNodeMarkup(posOfParentNode, unOrderedListNode, attrs, parentNode.marks)
            }
            dispatch(tr)
        }
    } else if(isCheckList) {
        return convertFromOneListToAnother(checkListItemNode, unOrderedListNode, attrs, view)
    } else {
        return wrapInList(listType, attrs)(state, dispatch)
    }
}

var toggleCheckList = function(listType, view, opts) {
    /**
     * if depth is > 2, then:
     *      is the parent node of $from pos, is a bullet list or ordered list then:
     *              we need to wrap the given selection into check list
     *      if the parent node of $from pos, is a check list then:
     *              we need to make it work as a toggle, that is we need to move the current selection out of the list
     * else if depth is <= 2 then:
     *     we need to wrap the given selection into check list
     */

    var attrs = {}
    if(opts && opts.extraAttrs) {
        attrs.extraAttrs = opts.extraAttrs
    }

    let state = view.state
    let dispatch = view.dispatch
    let checkListItemNode = state.schema.nodes.checkListItem
    let checkListNode = state.schema.nodes.checkList
    let listItemNode = state.schema.nodes.listItem

    let { $from } = view.state.selection;
    if($from.depth <= 2) {
        return wrapInList(listType, attrs)(state, dispatch)
    }

    let parentNode = $from.node($from.depth - 2)
    let isUnorderedList = parentNode.type.name === "bulletList"
    let isOrderedList = parentNode.type.name === "orderedList"
    let isCheckList = parentNode.type.name === "checkList"

    if(isOrderedList || isUnorderedList) {
        return convertFromOneListToAnother(listItemNode, checkListNode, attrs, view)
    } else if( isCheckList ) {
        return liftListItem(checkListItemNode)(state, dispatch)
    } else {
        return wrapInList(listType, attrs)(state, dispatch)
    }
}

export {toggleOrderedList, toggleUnorderedList, toggleCheckList};
