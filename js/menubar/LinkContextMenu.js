/**
 * var dd = new Splitdropdown(mountpoint, {
 *      id: 'some-id-unique-to-dropdown',
 *      options: [{
 *          id, icon, label, action
 *      }]
 * })
 */
import RichTextEditor from "../RichTextEditor";

export default class LinkContextMenu {

    constructor(config, rteView, close) {
        this.config = config
        this.rteView = rteView
        this.close =  close
        this.id = this.rteView.id + '-' + this.config.id;
    }

    // mandatory method
    getContentHTML() {
        return `<div id="context-menu-for-${this.id}">
            <a class="rte-link-btn open-link-btn" id="open-link-${this.id}"> ${RichTextEditor.i18n('common.OPEN')} </a> 
            | 
            <a class="rte-link-btn remove-link-btn" id="remove-link-${this.id}"> ${RichTextEditor.i18n('common.REMOVE')} </a> 
            | 
            <a class="rte-link-btn change-link-btn" id="change-link-${this.id}"> ${RichTextEditor.i18n('common.EDIT')} </a> 
            | 
            <a class="rte-link-btn copy-link-btn" id="copy-link-${this.id}"> ${RichTextEditor.i18n('common.COPY')}</a> 
        </div>`
    }

    // mandatory method
    addEventListeners(popoverEl, key, meta) {
        this.boundedOpenLink = this.openLink.bind(this, meta)
        this.boundedRemoveLink = this.removeLink.bind(this)
        this.boundedCopyLink = this.copyLink.bind(this)
        this.boundedChangeLink = this.rteView.menubar.openLinkPopover
        popoverEl.querySelector('#open-link-' + this.id).addEventListener('click', this.boundedOpenLink)
        popoverEl.querySelector('#remove-link-' + this.id).addEventListener('click', this.boundedRemoveLink)
        popoverEl.querySelector('#copy-link-' + this.id).addEventListener('click', this.boundedCopyLink)
        popoverEl.querySelector('#change-link-' + this.id).addEventListener('click', this.boundedChangeLink)
    }

    // mandatory method
    destroy(popoverEl) {
        popoverEl.querySelector('#open-link-' + this.id).removeEventListener('click', this.boundedOpenLink)
        popoverEl.querySelector('#remove-link-' + this.id).removeEventListener('click', this.boundedRemoveLink)
        popoverEl.querySelector('#copy-link-' + this.id).removeEventListener('click', this.boundedCopyLink)
        popoverEl.querySelector('#change-link-' + this.id).removeEventListener('click', this.boundedChangeLink)
    }

    closeContextMenu() {
        this.close()
        var self = this;
        setTimeout(function() {
            self.rteView.focus()
        }, 100)
    }

    openLink(href) {
        window.open(href, "_blank", "noopener, noreferrer")
        this.closeContextMenu()
    }

    removeLink() {
        this.rteView.commands.removeLink()
        this.closeContextMenu()
    }

    copyLink() {
        var selection = this.rteView.editorView.state.selection;
        if (!selection.$cursor) {
            // cursor is not in collapsed state
            return;
        }

        var link = selection.$cursor.marks().filter(function(mark) {
            return mark.type.name === 'link'
        })[0]
        if (link) {
            navigator.clipboard.writeText(link.attrs.href);
        }
        this.closeContextMenu()
    }

    // mandatory method
    onContextChange() {
        var selection = this.rteView.editorView.state.selection;
        if (selection.$cursor && selection.$cursor.marks()) {
            var link = selection.$cursor.marks().filter(function(mark) {
                return mark.type.name === 'link'
            })[0]

            if (link) {
                var domNodeAtCursor = this.rteView.editorView.domAtPos(selection.$from.pos)
                if (domNodeAtCursor.node.nodeType === Node.TEXT_NODE) {
                    return {
                        key: domNodeAtCursor.node.parentElement,// given parentElement because domNodeAtCursor.node represents text node,
                        // text node does'nt have certain properties required by components - popover component, that is why we have given 
                        // domNodeAtCursor.node.parentElement (it represents the span tag that the link is wrapped in).
                        meta: link.attrs.href
                    }
                }
            }
        }
    }
}