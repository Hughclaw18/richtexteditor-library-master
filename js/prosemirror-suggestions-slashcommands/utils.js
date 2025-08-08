// utils.js
import { getSuggestionsPlugin } from "../prosemirror-suggestions";
import { getFeatureConfigFromOpts } from "../RichTextEditorView";
import TableMenu from "../menubar/TableMenu";
import ImageMenu from "../menubar/ImageMenu";
import LinkMenu from "../menubar/LinkMenu";
import ColorPicker from "../menubar/ColorPicker";
/**
 * Finds the TableMenu component, defines its action for inserting a table,
 * and then displays the popover grid.
 * This function should be exported so it can be used elsewhere.
 * @param {object} view - The main Rich Text Editor view object.
 */


export function openMediaPopoverCommand(view, type) {
    const menu = view.menubar.menus.find(itm => 
        type === 'table' ? itm instanceof TableMenu : itm instanceof ImageMenu
    );

    if (menu) {
        menu.onAction((...args) => {
            if (type === 'table') {
                view.commands.insertTable(...args);
            } else {
                view.commands.insertImage(...args);
            }
            view.focus();
        });

        menu.showPopover();
    } else {
        console.error(`${type}Menu component could not be found in the menubar.`);
    }
}

export const openLinkPopoverCommand = (rteView) => {
    rteView.menubar.openLinkPopover();
}
export const openImagePopoverCommand = (rteView) => {
    rteView.menubar.openImagePopover();
}
export const openVideoPopoverCommand = (rteView) => {
    rteView.menubar.openVideoPopover();
}
export const openTablePopoverCommand = (rteView) => {
    rteView.menubar.openTablePopover();
}
export const openColorPickerPopoverCommand = (rteView) => {
    rteView.menubar.openColorPickerPopover(view);
}
export function getSlashFormattingSuggestions(view,formats) {
    const allSuggestions = [
        // Basic Text Formatting
        // Basic Text Formatting
        { id: 'bold', name: 'Bold', description: 'Make text bold', command: 'toggleBold', aliases: ['strong', 'b'] },
        { id: 'em', name: 'Italicize text', description: 'Italicize text', command: 'toggleItalic', aliases: ['em', 'i'] }, // Corrected: 'em' -> 'toggleItalic'
        { id: 'underline', name: 'Underline', description: 'Underline text', command: 'toggleUnderline', aliases: ['ul', 'u'] }, // Corrected: 'underline' -> 'toggleUnderline'
        { id: 'strike', name: 'Strikethrough', description: 'Strikethrough text', command: 'toggleStrikethrough', aliases: ['strikethrough', 's'] }, // Corrected: 'strikeThrough' -> 'toggleStrikethrough'
        { id: 'highlight', name: 'Highlight', description: 'Highlight text', command: 'toggleHighlight', aliases: ['mark', 'yellow'] },
        { id: 'inlinequote', name: 'Inline Quote', description: 'Apply inline quote formatting', command: 'toggleInlineQuote', aliases: ['quote'] },
        { id: 'clearformatting', name: 'Clear Formatting', description: 'Remove all formatting', command: 'clearFormatting', aliases: ['clear', 'removeformat'] },

        // Headings & Paragraphs
        // Note: For 'toggleHeading1' and 'toggleHeading2', RTECommands only has 'setHeading'.
        // If these are intended to be direct calls, setHeading would need arguments ('h1', 'h2').
        // The 'setHeading' command below has 'argsRequired: true'.
        { id: 'h1', name: 'Heading 1', description: 'Apply heading 1 style', command: 'setHeading', size: 16, aliases: ['h1', 'heading1'] }, // Changed to setHeading, will need arg passing if used directly
        { id: 'h2', name: 'Heading 2', description: 'Apply heading 2 style', command: 'setHeading', size: 14, aliases: ['h2', 'heading2'] }, // Changed to setHeading, will need arg passing if used directly
        { id: 'setheading', name: 'Set Heading', description: 'Apply a specific heading style (e.g., h3, h4)', command: 'setHeading', argsRequired: true, aliases: ['heading', 'h3', 'h4', 'h5', 'h6'] },


        // Lists
        { id: 'ul', name: 'Bullet List', description: 'Insert bulleted list', command: 'toggleUL', aliases: ['ul', 'bulletlist', 'unorderedlist'] },
        { id: 'ol', name: 'Numbered List', description: 'Insert numbered list', command: 'toggleOL', aliases: ['ol', 'numberedlist', 'orderedlist'] },
        { id: 'checklist', name: 'Checklist', description: 'Insert a checklist', command: 'toggleCheckList', aliases: ['checkbox', 'tasklist'] },
        { id: 'increaseindent', name: 'Increase Indent', description: 'Increase paragraph indentation', command: 'increaseIndent', aliases: ['indent', 'tab'] },
        { id: 'decreaseindent', name: 'Decrease Indent', description: 'Decrease paragraph indentation', command: 'decreaseIndent', aliases: ['outdent', 'shift-tab'] },

        // Links & Anchors
        { id: 'addlink', name: 'Add Link', description: 'Insert a hyperlink', command: (view) => openLinkPopoverCommand(view), aliases: ['link', 'a'] },
        { id: 'addanchor', name: 'Add Anchor', description: 'Insert an anchor (bookmark)', command: 'addAnchor', argsRequired: true, aliases: ['anchor', 'bookmark'] },

        // Alignment
        { id: 'alignpara', name: 'Align Paragraph', description: 'Change paragraph alignment', command: 'alignPara', argsRequired: true, aliases: ['align', 'textalign'] },

        // Images
        // Note: 'insertImage' here will be called without args unless handled specifically in onSelect
        { id: 'insertimage', name: 'Insert Image', description: 'Insert an image', command: (view) => openImagePopoverCommand(view), aliases: ['img','image', 'picture'] },
        { id: 'updateimagefit', name: 'Update Image Fit', description: 'Adjust image fit (e.g., cover, contain)', command: 'updateImageFit', argsRequired: true },

        // Videos & Embeds
        { id: 'insertvideo', name: 'Insert Video', description: 'Insert a video', command: 'insertVideo', argsRequired: true, aliases: ['video', 'youtube', 'vimeo'] },
        { id: 'insertembed', name: 'Insert Embed', description: 'Insert an embed (e.g., iframe)', command: 'insertEmbed', argsRequired: true, aliases: ['embed', 'iframe'] },
        { id: 'editembed', name: 'Edit Embed', description: 'Edit selected embed content', command: 'editEmbed', argsRequired: true },
        { id: 'removeembed', name: 'Remove Embed', description: 'Remove the selected embed', command: 'removeEmbed', aliases: ['deleteembed'] },

        // Tables
        // Note: 'inserttable' will insert default 3x3 table without args if called directly.
        // If you want to open the picker, use 'openTablePicker' command as previously discussed.
        { id: 'inserttable', name: 'Insert Table', description: 'Insert a table', command: (view) => openTablePopoverCommand(view), argsRequired: true , aliases: ['table']},
        { id: 'addcolumnbefore', name: 'Add Column Before', description: 'Add column before current', command: 'addColumnBefore' },
        { id: 'addcolumnafter', name: 'Add Column After', description: 'Add column after current', command: 'addColumnAfter' },
        { id: 'deletecolumn', name: 'Delete Column', description: 'Delete current column', command: 'deleteColumn' },
        { id: 'addrowbefore', name: 'Add Row Before', description: 'Add row before current', command: 'addRowBefore' },
        { id: 'addrowafter', name: 'Add Row After', description: 'Add row after current', command: 'addRowAfter' },
        { id: 'deleterow', name: 'Delete Row', description: 'Delete current row', command: 'deleteRow' },
        { id: 'deletetable', name: 'Delete Table', description: 'Delete the current table', command: 'deleteTable' },
        { id: 'mergecells', name: 'Merge Cells', description: 'Merge selected table cells', command: 'mergeCells' },
        { id: 'splitcell', name: 'Split Cell', description: 'Split the current table cell', command: 'splitCell' },
        { id: 'toggleheadercolumn', name: 'Toggle Header Column', description: 'Toggle header status for column', command: 'toggleHeaderColumn' },
        { id: 'toggleheaderrow', name: 'Toggle Header Row', description: 'Toggle header status for row', command: 'toggleHeaderRow' },
        { id: 'toggleheadercell', name: 'Toggle Header Cell', description: 'Toggle header status for cell', command: 'toggleHeaderCell' },

        // Font & Color
        { id: 'setfontfamily', name: 'Set Font Family', description: 'Change font family', command: 'setFontFamily', argsRequired: true, aliases: ['font', 'fontfamily'] },
        { id: 'setfontsize', name: 'Set Font Size', description: 'Change font size', command: 'setFontSize', argsRequired: true, aliases: ['size', 'fontsize'] },
        { id: 'setfontsizewithunits', name: 'Set Font Size With Units', description: 'Change font size with specific units (e.g., px, em)', command: 'setFontSizeWithUnits', argsRequired: true, aliases: ['sizeunits'] },
        { id: 'setfontcolor', name: 'Set Font Color', description: 'Change font color', command: 'setFontColor', argsRequired: true, aliases: ['color', 'textcolor'] },

        // Structural & Special Elements
        { id: 'inserthr', name: 'Insert Horizontal Rule', description: 'Insert a horizontal line', command: 'insertHr', aliases: ['hr', 'line'] },
        { id: 'setdirection', name: 'Set Text Direction', description: 'Set text direction (LTR/RTL)', command: 'setDirection', argsRequired: true, aliases: ['direction', 'ltr', 'rtl'] },
        { id: 'togglesubscript', name: 'Subscript', description: 'Apply subscript formatting', command: 'toggleSubScript', aliases: ['sub'] },
        { id: 'togglesuperscript', name: 'Superscript', description: 'Apply superscript formatting', command: 'toggleSuperScript', aliases: ['sup'] },
        { id: 'setlineheight', name: 'Set Line Height', description: 'Adjust line spacing', command: 'setLineHeight', argsRequired: true, aliases: ['lineheight', 'spacing'] },

        // HTML & Code Blocks
        { id: 'inserthtml', name: 'Insert HTML', description: 'Insert raw HTML content', command: 'insertHtml', argsRequired: true, aliases: ['html', 'codehtml'] },
        { id: 'edithtml', name: 'Edit HTML', description: 'Edit selected HTML content', command: 'editHtml', argsRequired: true },
        { id: 'removehtml', name: 'Remove HTML', description: 'Remove selected HTML content', command: 'removeHtml' },
        { id: 'insertcodeblock', name: 'Insert Code Block', description: 'Insert a code block', command: 'insertCodeBlock', aliases: ['code', 'codeblock'] },
        { id: 'deletecodeblock', name: 'Delete Code Block', description: 'Delete the selected code block', command: 'deleteCodeBlock' },
        { id: 'togglecodeblock', name: 'Toggle Code Block', description: 'Toggle code block formatting', command: 'toggleCodeBlock' },

        // Blockquotes
        { id: 'insertblockquote', name: 'Insert Blockquote', description: 'Insert a blockquote', command: 'insertBlockquote', aliases: ['blockquote', 'quote-block'] },
        { id: 'removeblockquote', name: 'Remove Blockquote', description: 'Remove the selected blockquote', command: 'removeBlockquote' },
        { id: 'toggleblockquote', name: 'Toggle Blockquote', description: 'Toggle blockquote formatting', command: 'toggleBlockquote' },

        // Utility & Paste Options
        { id: 'applyformatpainter', name: 'Apply Format Painter', description: 'Apply copied formatting', command: 'applyFormatPainter', aliases: ['formatpainter'] },
        { id: 'openziapanel', name: 'Open Zia Panel', description: 'Open Zia proofing panel', command: 'openZiaPanel', aliases: ['zia', 'proofing'] },
        { id: 'closeziapanel', name: 'Close Zia Panel', description: 'Close Zia proofing panel', command: 'closeZiaPanel' },

        { id: 'performenter', name: 'Perform Enter', description: 'Simulate an Enter key press', command: 'performEnter' },
        { id: 'formatpastedcontent', name: 'Format Pasted Content', description: 'Choose how to paste content', command: 'formatPastedContent', argsRequired: true, aliases: ['paste'] },
    ];

    if (formats && formats.length > 0) {
        const filteredSuggestions = allSuggestions.filter(suggestion => {
            const isIdEnabled = Object.keys(getFeatureConfigFromOpts(suggestion.id, view.options)).length > 0;
            if (isIdEnabled) {
                return true;
            }
            if (suggestion.aliases) {
                return suggestion.aliases.some(alias => Object.keys(getFeatureConfigFromOpts(alias, view.options)).length > 0);
            }
            return false;
        });
        return filteredSuggestions;
    } else {
        if (formats && formats.length > 0) {
        const filteredSuggestions = allSuggestions.filter(suggestion => {
            const isIdEnabled = Object.keys(getFeatureConfigFromOpts(suggestion.id, view.options)).length > 0;
            if (isIdEnabled) {
                return true;
            }
            if (suggestion.aliases) {
                return suggestion.aliases.some(alias => Object.keys(getFeatureConfigFromOpts(alias, view.options)).length > 0);
            }
            return false;
        });
        return filteredSuggestions;
    } else {
        return allSuggestions;
    }
}
}
