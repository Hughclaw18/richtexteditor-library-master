import Hr from "./Hr";
import TextDirection from "./TextDirection";
import { toggleMark } from 'prosemirror-commands';
import { toggleUnorderedList, toggleOrderedList, toggleCheckList } from "./prosemirror-lists"
import { insertTable } from "./prosemirror-tables"
import { addColumnAfter, addColumnBefore, deleteColumn, addRowAfter, addRowBefore, deleteRow, deleteTable, mergeCells, splitCell, toggleHeaderCell, toggleHeaderColumn, toggleHeaderRow } from "./prosemirror-tables";
import { uploadImageCommand, updateImageFit, copyImage, removeImage } from "./prosemirror-images"
import { setFontFamily, setFontSize, setFontColor, setBackgroundColor, setFontSizeWithUnits, convertFontFamilyValueToDisplayName } from "./prosemirror-font"
import { applyScript } from "./prosemirror-script"
import RTELink from "./RTELink";
import { insertVideo, removeVideo, insertEmbed, removeEmbed, editEmbed, editVideo } from "./prosemirror-embed"
import { insertHtml, removeHtml, editHtml } from "./prosemirror-html"
import { getStyles } from "./prosemirror-format-painter"
import { insertBlockquote, removeBlockquote, toggleBlockquote } from "./prosemirror-blockquote";
import { increaseIndent, decreaseIndent } from "./prosemirror-lists/listsPlugin"
import { Commands } from './prosemirror-codeblocks'
import { performEnter } from "./Shortcuts"
import { matchDestination, onlySourceFormat, pasteTextOnly } from "./prosemirror-paste";
import { getFeatureConfigFromOpts } from "./RichTextEditorView"


var toggleMarkWrapper = function(view, marktype, attrs = {}, opts) {
    if(opts && opts.extraAttrs) {
        attrs.extraAttrs = opts.extraAttrs
    }
    var command = toggleMark(marktype, attrs);
    command(view.state, view.dispatch);
};

var alignPara = function(view, align, opts) {
        // get all paragraphs
        // get para positions and use tr.setNodeMarkup() API to set new alignment attribute
        // Note: in a newer version of prosemirror, tr.setNodeAttribute() API is available to directly write to attributes.
        var tr = view.state.tr
        view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
            if (node.type.name === 'paragraph') {
                var defaultAlignment = view.rteView.options.rtl ? "right" : "left"
                if(align === defaultAlignment) { // #move to default config check
                    align = null;
                }
                if(opts && opts.extraAttrs) {
                    let newExtraAttrs = Object.assign({}, node.attrs.extraAttrs, opts.extraAttrs)
                    tr.setNodeMarkup(pos, node.type, {
                        ...node.attrs, align: align, extraAttrs: newExtraAttrs
                    }, node.marks)
                } else {
                    tr.setNodeMarkup(pos, node.type, {...node.attrs, align: align}, node.marks)
                }
            }
        })
        view.dispatch(tr);
        view.focus();
}

var setLineHeight = function(view, lineHeight, opts) {
    var tr = view.state.tr
    view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
        if (node.type.name === 'paragraph') {
            var defaultLineHeight = view.rteView.options.defaults.lineHeight
            if( defaultLineHeight === "normal" && lineHeight === defaultLineHeight) {
                lineHeight = null;
            } else if( lineHeight === parseFloat( defaultLineHeight ) ) {
                lineHeight = null;
            }
            if(opts && opts.extraAttrs) {
                let newExtraAttrs = Object.assign({}, node.attrs.extraAttrs, opts.extraAttrs)
                tr.setNodeMarkup(pos, node.type, {
                    ...node.attrs, lineHeight: lineHeight, extraAttrs: newExtraAttrs
                }, node.marks)
            } else {
                tr.setNodeMarkup(pos, node.type, {...node.attrs, lineHeight: lineHeight}, node.marks)
            }
        }    
    })
    view.dispatch(tr);
    view.focus();
}

var clearFormatting = function(view) {
    // remove all marks and para attrs from selected portions of text nodes and paragraph nodes respectively
    var selection = view.state.selection
    var tr = view.state.tr
    if(selection.$from.pos !== selection.$to.pos) {
        tr = tr.removeMark(selection.$from.pos, selection.$to.pos)
        var paraAttrs = view.state.schema.nodes.paragraph.attrs
        view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
            if (node.type.name === 'paragraph') {
                var defaultAttrs = {}
                Object.keys(paraAttrs).forEach((attr) => {
                    defaultAttrs[attr] = paraAttrs[attr].default
                })
                tr.setNodeMarkup(pos, node.type, defaultAttrs, node.marks)
            }
        })
    } else{
        tr = tr.setStoredMarks([])
        tr = tr.setMeta('storeMarks', false)
    }

    view.dispatch(tr)
}

var setHeading = function(view, tagName, opts) {
    var tr = view.state.tr

    view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
        if (node.type.name === 'paragraph') {
            if(opts && opts.extraAttrs) {
                let newExtraAttrs = Object.assign({}, node.attrs.extraAttrs, opts.extraAttrs)
                tr.setNodeMarkup(pos, node.type, {
                    ...node.attrs, type: tagName, extraAttrs: newExtraAttrs
                }, node.marks)
            } else {
                tr.setNodeMarkup(pos, node.type, {...node.attrs, type: tagName}, node.marks)
            }
        }
    })

    view.dispatch(tr);
    view.focus();
}

let RTECommands = {

    toggleBold: function(opts) {
        toggleMarkWrapper(this.editorView, this.editorView.state.schema.marks.strong, {}, opts);
        this.editorView.focus();
    },

    toggleItalic: function(opts) {
        toggleMarkWrapper(this.editorView, this.editorView.state.schema.marks.em, {}, opts);
        this.editorView.focus();
    },

    toggleUnderline: function(opts) {
        toggleMarkWrapper(this.editorView, this.editorView.state.schema.marks.underline, {}, opts);
        this.editorView.focus();
    },

    toggleStrikethrough: function(opts) {
        toggleMarkWrapper(this.editorView, this.editorView.state.schema.marks.strikeThrough, {}, opts);
        this.editorView.focus();
    },

    toggleHighlight: function(opts) {
        toggleMarkWrapper( this.editorView ,this.editorView.state.schema.marks.highlight, { value: "rgb(255, 255, 0)" }, opts)
        this.editorView.focus();
    },

    toggleInlineQuote: function(opts) {
        toggleMarkWrapper( this.editorView ,this.editorView.state.schema.marks.inlineQuote, {}, opts)
        this.editorView.focus();
    },

    addLink: function(link, opts) {
        RTELink.addLink(link, this, opts)
        this.editorView.focus();
    },

    addLinkWithText: function(link, text, opts) {
        RTELink.addLinkWithText(link, text, this, opts)
    },

    addAnchor: function(name, opts) {
        RTELink.addAnchor(name, this.editorView, opts)
        this.editorView.focus();
    },

    removeLink: function() {
        RTELink.removeLink(this.editorView);
        this.editorView.focus();
    },

    getLinkRange: function() {
        return RTELink.getLinkRange(this.editorView);
    },

    alignPara: function(align, opts) {
        alignPara(this.editorView, align, opts);
        this.editorView.focus();
    },

    insertEmoji: function() {

    },

    insertImage: function(url,fit, file, alt, opts) {
        var self = this;
        return uploadImageCommand(this, url, fit, file, alt, opts).then(function(){
            self.editorView.focus();
        })
    },

    insertVideo: function(attrs, opts) {
        insertVideo(this, attrs, opts)
        this.editorView.focus()
    },

    editVideo: function(attrs, opts) {
        editVideo(this, attrs, opts)
        this.editorView.focus()
    },

    insertEmbed: function(attrs, opts) {
        insertEmbed(this, attrs, opts)
        this.editorView.focus()
    },

    editEmbed: function(iframeString, opts) {
        editEmbed(this, iframeString, opts)
        this.editorView.focus()
    },

    updateImageFit: function(fit, opts) {
        updateImageFit(this, fit, opts)
        this.editorView.focus();
    },

    removeImage: function() {
        removeImage(this)
        this.editorView.focus();
    },

    removeVideo: function() {
        removeVideo(this)
        this.editorView.focus();
    },

    removeEmbed: function() {
        removeEmbed(this)
        this.editorView.focus();
    },

    copyImage: function() {
        copyImage(this)
        this.editorView.focus();
    },

    toggleUL: function(type, opts) {
        toggleUnorderedList(this.editorView.state.schema.nodes.bulletList, type, this.editorView, opts);
        this.editorView.focus();
    },

    toggleOL: function(type, opts) {
        toggleOrderedList(this.editorView.state.schema.nodes.orderedList, type, this.editorView, opts);
        this.editorView.focus();
    },

    toggleCheckList: function(opts) {
        toggleCheckList(this.editorView.state.schema.nodes.checkList, this.editorView, opts);
        this.editorView.focus();
    },

    insertTable: function(rows, cols, opts) {
        rows = rows || 3;
        cols = cols || 3;
        insertTable(rows, cols, this.editorView.state, this.editorView.dispatch, opts)
        this.editorView.focus();
    },

    addColumnBefore: function() {
        addColumnBefore(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    addColumnAfter: function() {
        addColumnAfter(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    deleteColumn: function() {
        deleteColumn(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    addRowBefore: function() {
        addRowBefore(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    addRowAfter: function() {
        addRowAfter(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    deleteRow: function() {
        deleteRow(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    deleteTable: function() {
        deleteTable(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    mergeCells: function() {
        mergeCells(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    splitCell: function() {
        splitCell(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    toggleHeaderColumn: function() {
        toggleHeaderColumn(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    toggleHeaderRow: function() {
        toggleHeaderRow(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    toggleHeaderCell: function() {
        toggleHeaderCell(this.editorView.state, this.editorView.dispatch)
        this.editorView.focus();
    },

    setFontFamily: function(fontName, opts) {
        setFontFamily(this.editorView, fontName, opts);
        this.editorView.focus();
    },

    getFontFamilyValue(value) {
        return convertFontFamilyValueToDisplayName(value, this.editorView.rteView.options)
    },

    setFontSize: function(size, opts) {
        setFontSize(this.editorView, size, opts);
        var self = this;
        //setTimeout has been called because the split-combo component on setting custom values, calls the window.selection and tries to empty it, so when editorView.focus() is called without setTimeout the window.selection() returns the selected content in the RTE , so the split-combo empties the content in the editor instead of emptying the custom content in the split-combo.
        setTimeout(()=>{
            self.editorView.focus();
        }, 10)
    },

    setFontSizeWithUnits: function(size, unit, opts) {
        setFontSizeWithUnits(this.editorView, size, unit, opts)
        this.editorView.focus()
    },

    setHeading: function(tagName, opts) {
        setHeading(this.editorView, tagName, opts);
        this.editorView.focus()
    },

    setFontColor: function(color, opts) {
        setFontColor(this.editorView, color, opts);
        this.editorView.focus();
    },

    setBackgroundColor: function(color, opts) {
        setBackgroundColor(this.editorView, color, opts);
        this.editorView.focus();
    },
    
    insertHr: function(opts) {
        Hr.insertHr(this, opts)
        this.editorView.focus();
    },

    clearFormatting: function() {
        clearFormatting(this.editorView);
        this.editorView.focus();
    },

    setDirection: function(dir, opts) {
        TextDirection.setDirection(this.editorView, dir, opts);
        this.editorView.focus();
    },
    
    toggleSubScript: function(opts) {
        applyScript( "sub" , this.editorView, opts )
        this.editorView.focus();
    },
    
    toggleSuperScript: function(opts) {
        applyScript( "sup" , this.editorView, opts )
        this.editorView.focus();
    },

    setLineHeight: function(value, opts) {
        setLineHeight(this.editorView, value, opts)
        this.editorView.focus();
    },

    insertHtml: function(htmlString, opts) {
        insertHtml(this, htmlString, opts)
        this.editorView.focus()
    },

    editHtml: function(htmlString, opts) {
        editHtml(this, htmlString, opts)
        this.editorView.focus()
    },

    removeHtml: function() {
        removeHtml(this)
        this.editorView.focus()
    },

    increaseIndent: function(opts) {
        increaseIndent(this, opts)
        this.editorView.focus()
    },

    decreaseIndent: function(opts) {
        decreaseIndent(this, opts)
        this.editorView.focus()
    },

    applyFormatPainter: function() {
        getStyles(this)
        this.editorView.focus()
    },

    insertCodeBlock: function(opts) {
        Commands.insertCodeBlock(this.editorView, opts)
        this.editorView.focus()
    },

    deleteCodeBlock: function() {
        Commands.deleteCodeBlock(this.editorView)
        this.editorView.focus()
    },

    toggleCodeBlock: function(opts) {
        Commands.toggleCodeBlock(this.editorView, opts)
        this.editorView.focus()
    },

    insertBlockquote: function(opts) {
        insertBlockquote(this.editorView, opts)
        this.editorView.focus()
    },

    removeBlockquote: function() {
        removeBlockquote(this.editorView)
        this.editorView.focus()
    },

    toggleBlockquote: function(opts) {
        toggleBlockquote(this.editorView, opts)
        this.editorView.focus()
    },

    performEnter: function() {
        return performEnter(this.editorView.state, this.editorView.dispatch)
    },

    openZiaPanel: function() {
        let userProofingOpts = getFeatureConfigFromOpts('proofing', this.options)
        this.proofingInstance.openPanel(userProofingOpts.ziaPanelDomEl, userProofingOpts.ziaPanelOpts)
    },

    closeZiaPanel: function() {
        this.proofingInstance.closePanel()
    },

    formatPastedContent: function(type){
        if(type === 'matchDestination'){
            matchDestination(this.editorView);
        } else if (type === 'textOnly'){
            pasteTextOnly(this.editorView);
        } else if (type === 'sourceFormatting')
            onlySourceFormat(this.editorView);
    }

}

export default RTECommands