import { Fragment, Slice } from "prosemirror-model"

let Hr = {
    getSchemaNode: function() {
        return {
            parseDOM: [{tag: "hr"}],
            toDOM: function() {
                return ["hr"]
            },
            atom: true,
            group: 'block',
            selectable: true
        }
    },

    insertHr: function(view, opts) {
        var nodesToBeInserted = []
        var attrsForHr = {}
        var attrsForPara = {}

        if(opts) {
            if(opts.extraAttrs) {
                attrsForHr.extraAttrs = opts.extraAttrs
            }
            if(opts.extraAttrsForPara) {
                attrsForPara.extraAttrs = opts.extraAttrsForPara
            }
        }
        
        var hrnode = view.editorView.state.schema.nodes.hr.create(attrsForHr)
        var paraNode = view.editorView.state.schema.nodes.paragraph.create(attrsForPara)

        nodesToBeInserted.push(hrnode)
        nodesToBeInserted.push(paraNode)

        const newFragment=Fragment.from(nodesToBeInserted)
        const newSlice=new Slice(newFragment,0,0) // put the depth as 0,0 becuase only then we can insert an hr when the cursor is within a apara containing some text
        // if the depth is put as 1,1 then we can't insert hr in certain cases such as open rte and write some text in first line and from there itself insert an hr,
        // you will see that only an empty para will be created and no hr will be created, inorder to insert hr we need to again press the insert hr button, this 
        // can be avoided if depth is put as 0,0.

        var tr = view.editorView.state.tr
        view.editorView.dispatch(tr.replaceSelection(newSlice))
    }
}

export default Hr