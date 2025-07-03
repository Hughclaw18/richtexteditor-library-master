import { liftTarget, findWrapping } from 'prosemirror-transform'

var blockquoteNode = {
    content: 'paragraph block*',
    defining: true,
    group: 'block',
    parseDOM: [{ tag: 'blockquote'}], // no i18n
    toDOM: function () {
        return ['blockquote', 0]; // no i18n
    }
}

export function addBlockquoteNode(nodes) {
    return nodes.append({
        blockquote: blockquoteNode
    });
};

export function insertBlockquote(view, opts) {
    var attrs = {}
    if(opts && opts.extraAttrs) {
        attrs.extraAttrs = opts.extraAttrs
    }
    var { $from, $to } = view.state.selection
    var blockquoteNodetype = view.state.schema.nodes.blockquote

    var wrappers = [ { type: blockquoteNodetype, attrs: attrs }]
    var isValidWrapper = findWrapping($from.blockRange($to), blockquoteNodetype, attrs)
    // isValidWrapper may be null (indicating blockquote cannot be inserted here)
    // or it can have an array consisting of objects, with each object having the nodetype of wrapper and it's attributes
    // these array of objects are the valid wrappers
    // so inorder to wrap the content with blockquote, we need to wrap the content with all the valid wrappers in the isValidWrapper array
    // but here we are assuming that inorder to wrap a content inside blockquote, there can be only one valid wrapper and not multiple
    // that is why we have hardcoded that if validWrapper has some value we wrap it with blockquote
    // if isValidWrapper is null, we throw an error stating that blockquote cannot be inserted here

    if(isValidWrapper) {
        var tr = view.state.tr.wrap($from.blockRange($to), wrappers)
        view.dispatch(tr)
        view.focus();
    } else {
        throw new Error("Blockquote cannot be inserted here, becuase it is not a valid wrapper")
    }
}

export function removeBlockquote(view) {
    let state = view.state
    let {$from, $to} = state.selection
    
    let target = liftTarget($from.blockRange($to))
    view.dispatch(state.tr.lift($from.blockRange($to), target))
}

export function toggleBlockquote(view, opts) {
    let state = view.state
    let { $from } = state.selection
    let blockquoteNodetype = state.schema.nodes.blockquote

    // Check if the selection is already wrapped in a blockquote
    if ($from.node(-1) && $from.node(-1).type === blockquoteNodetype) {
        removeBlockquote(view)
    } else {
        insertBlockquote(view, opts)
    }
}