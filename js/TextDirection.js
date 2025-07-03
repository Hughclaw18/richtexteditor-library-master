let TextDirection = {
    setDirection: function(view, dir, opts) {
        // get all paragraphs
        // get para positions and use tr.setNodeMarkup() API to set new alignment attribute
        // Note: in a newer version of prosemirror, tr.setNodeAttribute() API is available to directly write to attributes.
        var isRTLEnabled = view.rteView.options.rtl ? true : false
        var defaultTextDirection = isRTLEnabled ? 'rtl' : 'ltr'
        var tr = view.state.tr
        view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
            if (node.type.name === 'paragraph') {
                if(dir === defaultTextDirection) {
                    dir = null//default values should not be explicitly mentioned , here ltr is default value, hence don't put it
                }
                if(opts && opts.extraAttrs) {
                    let newExtraAttrs = Object.assign({}, node.attrs.extraAttrs, opts.extraAttrs)
                    tr.setNodeMarkup(pos, node.type, {
                        ...node.attrs, dir: dir, extraAttrs: newExtraAttrs
                    }, node.marks)
                } else {
                    tr.setNodeMarkup(pos, node.type, {...node.attrs, dir: dir}, node.marks)
                }
            }
        })
        view.dispatch(tr);
    }
}


export default TextDirection
