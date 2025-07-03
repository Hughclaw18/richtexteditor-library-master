import { html } from "./htmlNode"

export function insertHtml(rteView, htmlString, opts) {
    let view = rteView.editorView
    let htmlAttrs = {}, paraAttrs = {}
    htmlAttrs.htmlString = htmlString

    if(opts) {
        if(opts.extraAttrs) {
            htmlAttrs.extraAttrs = opts.extraAttrs
        }
        if(opts.extraAttrsForPara) {
            paraAttrs.extraAttrs = opts.extraAttrsForPara
        }
    }

    let htmlNode = view.state.schema.nodes.html.create(htmlAttrs)
    let paraNode = view.state.schema.nodes.paragraph.create(paraAttrs)

    var nodesToBeInserted = []
    nodesToBeInserted.push(htmlNode)
    nodesToBeInserted.push(paraNode)//put an empty para node at the bottom of a html node inorder to preserve globalStoredMarks as well as to remove gapCursor dependancy in future

    var tr = view.state.tr
    tr.insert(view.state.selection.$from.pos, nodesToBeInserted)
    view.dispatch(tr)
}

export function editHtml(rteView, htmlString, opts) {
    var view = rteView.editorView
    var state = view.state
    var tr = state.tr
    var from = state.selection.$from.pos
    var node = rteView.editorView.state.schema.nodes.html
    var attrs = {
        htmlString: htmlString
    }

    if(opts && opts.extraAttrs) {
        attrs.extraAttrs = opts.extraAttrs
    }

    tr.setNodeMarkup(from, node, attrs)
    view.dispatch(tr)
}

export function removeHtml(rteView) {

    var view = rteView.editorView
    var from = view.state.selection.$from.pos
    var to = view.state.selection.$to.pos
    var tr = view.state.tr

    view.dispatch(tr.deleteRange(from, to))
}

export function addHtmlNode(nodes) {
    return nodes.append({
        html
    });
};
