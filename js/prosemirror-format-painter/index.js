import { Plugin } from "prosemirror-state"
import { markApplies } from '../prosemirror-font'

// TODO: Make this specific to each editor by adding these flags in options, since this is global, if two editors are in same page
/// then the below case will fail
// Eg: Type "def" in second editor,
// then type "abc" and apply line-height of 2.0 and bold mark for this word in first editor,
// select the word "abc" in first editor and click format painter icon
// Now in second editor select the word "def"
// You will see line-height of 2.0 and bold mark will be applied in second editor.

// But expected behaviour is when you do selection in second editor, only selection should appear, the styles should not be pasted
// Because the copied styles belong to first editor, so whenever the next selection is made in first editor,
// only then the styles should be applied in first editor
var isFormatPainterEnabled = false
var marksToBeApplied = null
var attrsToBeApplied = null

export function getStyles(rteView) {
    var view = rteView.editorView
    var { $from } = view.state.selection
    
    if(view.state.selection.$from.depth > 0) {
        isFormatPainterEnabled = true

        var curParaStartPosition = $from.before()
        var curParaNode = view.state.doc.nodeAt(curParaStartPosition)
        
        attrsToBeApplied = curParaNode.attrs
        marksToBeApplied = $from.marks()
    }
}

function flushMark(view, markType, attrs, tr) {

    var ref = view.state.selection;
    var empty = ref.empty;
    var $cursor = ref.$cursor;
    var ranges = ref.ranges;
    var state = view.state;
    var { $from, $to } = state.selection
    
    if ((empty && !$cursor) || !markApplies(view.state.doc, ranges, markType)) {
        return false
    }

    if ($cursor) {
        // $cursor will be true if $from === $to
        tr = tr.addStoredMark(markType.create(attrs))
    } else {
        tr = tr.addMark($from.pos, $to.pos, markType.create(attrs));
    }
    return tr
}

function flushAttrs(view, attrs, tr) {
    view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
        if (node.type.name === 'paragraph') {
            tr = tr.setNodeMarkup(pos, node.type, {...attrs}, node.marks)
        }    
    })
    return tr
}

function flushStyles(view) {

    view.rteView.commands.clearFormatting() // first remove the marks if any, and then apply the given marks

    var tr = view.state.tr
    tr = flushAttrs(view, attrsToBeApplied, tr)
    // apply attrs first then apply marks, becuase while applying attrs in tr.setNodeMarkup we are setting the last parameter as node.marks itself
    // so if we apply marks followed by attrs, then the marks that are set will be returned to default because we are passing node.marks

    marksToBeApplied.forEach((mark) => {
        let markType = mark.type
        let attrs = mark.attrs
        tr = flushMark(view, markType, attrs, tr)
    })

    resetFormatPainterValues()

    if(tr) {// for cases where marks are not applicable, flushMark() may return false, for those cases don't dispatch tr
        tr = tr.scrollIntoView()
        view.dispatch(tr)
        view.focus()
    }

}

function resetFormatPainterValues() {
    isFormatPainterEnabled = false
    marksToBeApplied = null
    attrsToBeApplied = null
}

export function getFormatPainterPlugin(rteView) {
    return new Plugin({
        key: rteView.pluginKeys.formatPainter,
        props: {
            handleDOMEvents: {
                mouseup: function(view) {
                    if(isFormatPainterEnabled) {
                        flushStyles(view)
                    } else {
                        return false
                    }
                }
            }
        }
    })
}
