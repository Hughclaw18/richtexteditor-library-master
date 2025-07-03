import {keymap} from "prosemirror-keymap"
import {Selection, Plugin} from "prosemirror-state"
import CodeBlockView from "./CodeBlockView"
import { insertCodeBlock, deleteCodeBlock, toggleCodeBlock } from "./commands"
// node spec 
export function getSchemaNode() {
    return {
        content: "text*",
        marks: "",
        group: "block",
        code: true,
        defining: true,
        attrs: {
          id: {default: null},
          readOnly: {default: false}
        },
        parseDOM: [{tag: "pre", preserveWhitespace: "full"}],
        toDOM(node) {
          var pre = document.createElement('pre');
          var code = document.createElement('code');
          code.textContent = node.textBetween(0, node.content.size)
          pre.appendChild(code);
          return pre;
        },
        showGapCursor: true
    }
}

/**
 * 
 * To move cursor from prosemirror editor to codemirror editor
 */
function arrowHandler(dir) {
  return (state, dispatch, view) => {
    if (state.selection.empty && view.endOfTextblock(dir)) {
      let side = dir == "left" || dir == "up" ? -1 : 1
      let $head = state.selection.$head
      let nextPos = Selection.near(
        state.doc.resolve(side > 0 ? $head.after() : $head.before()), side)
      if (nextPos.$head && nextPos.$head.parent.type.name == "code_block") {
        dispatch(state.tr.setSelection(nextPos))
        return true
      }
    }
    return false
  }
}

export const keymapPluginForCodeBlocks = keymap({
  ArrowLeft: arrowHandler("left"),
  ArrowRight: arrowHandler("right"),
  ArrowUp: arrowHandler("up"),
  ArrowDown: arrowHandler("down")
})

export const ensureIdPlugin = function() {
  return new Plugin({
      appendTransaction: function(transactions, prevState, nextState) {
        const tr = nextState.tr;
        let modified = false;
        if (transactions.some((transaction) => transaction.docChanged)) {
          // Adds a unique id to a node
          nextState.doc.descendants((node, pos) => {
            if (node.type.name === 'code_block' && !node.attrs.id) {
              tr.setNodeMarkup(pos, undefined, {...node.attrs, id: 'code-block-' + Math.floor(Math.random()*100000)});
              modified = true;
            }
          });
        }

        return modified ? tr : null;
      }
  })
}

export const copyPasteSupport = function() {
  return new Plugin({
    props: {
      transformPastedHTML: function(html, view) {
        var div = document.createElement('div')
        div.innerHTML = html;
        var regex = /<br\s*[\/]?>/gi;
        div.querySelectorAll('code').forEach(function(codeEl) {
          var innerHTML = codeEl.innerHTML
          var replacedBrWithNewline = innerHTML.replace(regex, '\n')
          codeEl.innerHTML = replacedBrWithNewline
        })
        return div.innerHTML
      }
    }
  })
}

var Commands = {
    insertCodeBlock,
    deleteCodeBlock,
    toggleCodeBlock
}

export { CodeBlockView, Commands }