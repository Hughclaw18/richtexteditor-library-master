import { getFeatureConfigFromOpts } from "../RichTextEditorView"

export function addInlineQuoteMark(marks, options) {

    var inlineQuoteNode = {
         parseDOM: [{tag: 'code'}, {tag: 'q'}],
 
         toDOM: function () {
             /**
              * We have added styles for code tag in editor.css.
              * Note: Don't put styles as inline styles because for example if we add font-color as inline styles, and if we enable this quote mark in rte and type 'abc',
              * 'abc' will be in quotes and then if we disable quoe mark and type 'd', the expectation is 'abc' should be in quotes and 'd' should be in normal text , but what we get is
              * 'abcd' all will be in normal text, this is because while typing 'd' prosemirror takes a diff of previous state and current state, the previous state would be 'abc' with quote marks
              * the current state will be 'abcd' with quote+font-color mark (here prosemirror first allows 'd' to be typed in as quote mark and then only removes the quote mark for the differed portion alone)
              * since it considers font-color as a mark , the differed portion becomes 'abcd' as a result the quotes mark gets removed for all 4 character.
              */
            /* Don't simply put it as any code tag inside .ui-rte-editor-div in editor.css because for codeblocks we simply wrap all the content inside code_blocks node inside a code tag*/
            /* As a result the styling written for code tag will also be applied to code_block node's content also, that is why we have written the rule in editor.css as */
            /* any code tag with attribute rte-inline-quote inside ui-rte-editor-div tag*/
             return ['code', {"rte-inline-quote": ""}]
         }
    }

    return marks.append({
        inlineQuote: inlineQuoteNode
    })
}
