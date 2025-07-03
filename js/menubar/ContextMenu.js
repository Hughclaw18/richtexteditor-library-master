/**
 * var dd = new Splitdropdown(mountpoint, {
 *      id: 'some-id-unique-to-dropdown',
 *      options: [{
 *          id, icon, label, action
 *      }]
 * })
 */
 import { RTEComponents } from "../RichTextEditorView";
 
 export default class ContextMenu {

    constructor(config, rteView) {
        this.config = config
        this.rteView = rteView
        this.menu = new config.menuClass(config, this.rteView, this.closePopover.bind(this));
        this.opened = false;
        this.id = this.rteView.id + '-' + this.config.id;
        // setup listener to call onContextChange whenever cursor position changes
        this.boundedOnContextChange = this.onContextChange.bind(this);
        // will cause memory leaks if menubar is destroyed but editor div is still alive. 
        // TODO: Menubar should call each menu's destroy when menubar.destroy is called.
        this.rteView.editorView.dom.addEventListener('cursorPositionChanged', this.boundedOnContextChange)

        this.boundedClosePopoverOnFocusOut = this.closePopoverOnFocusOut.bind(this)
        this.rteView.editorView.dom.addEventListener('focusout', this.boundedClosePopoverOnFocusOut)
    }

    // mandatory method
    destroy() {
        this.rteView.editorView.dom.removeEventListener('cursorPositionChanged', this.boundedOnContextChange)
        this.rteView.editorView.dom.removeEventListener('focusout', this.boundedClosePopoverOnFocusOut)
    }

    // mandatory method
    closePopover() {
        if (this.opened) {
            this.opened = false;
            this.currentPosition = null;
            this.menu.destroy(this.popoverEl);

            RTEComponents.popover(`#popover-for-${this.id}`).close();
            RTEComponents.popover(`#popover-for-${this.id}`).destroy();
            this.popoverEl.remove();
            this.popoverEl = null; // send dom element to be garbage collected
        }
    }

    closePopoverOnFocusOut(e) {
        var idOfLinkContextMenu = 'popover-for-' + this.id;
        // e.relatedTarget has the DOMElement which caused the focus to be changed from editor to itself
        // for eg, if cursor moves into a link, linkContextMenu is shown, so the focus is removed from the editor and it is put into the context menu
        // e.relatedTarget points to the linkContextMenu

        // so if editor moves out of focus because of some other reason then we can close the popover(context menu), but if the editor moves out of focus
        // becuase of the appearnace of linkContextMenu or imageContextMenu then we no need to close the popover
        if(!e.relatedTarget || idOfLinkContextMenu !== e.relatedTarget.id) {
            this.closePopover()
        }
    }

    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
      
        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }

    getContentHTML() {
        return `<div id="popover-for-${this.id}" class="rte-wrapper-context-menu">
        </div>`
    }

    // mandatory method
    onContextChange() {

        // if rte.editable is false then don't show any contextMenu
        if(!this.rteView.editorView.editable) {
            return;
        }

        // should return a x/y position to place the container div
        var position = this.menu.onContextChange();


        if (position && position.key) {
            if (!position.key) { throw new Error("Context listeners must add an attribute named 'key' when returning position") }
            // cursor has moved into registered context.
            if (this.opened && this.currentPosition.key === position.key) {
                // do nothing, the cursor is still in the same context.
                return;
            } else {
                this.closePopover(); // close existing link popover if any
                // Open context menu since it has come into a new context
                this.opened = true;
                this.currentPosition = position;
                this.popoverEl = this.createElementFromHTML(this.getContentHTML())
                this.rteView.menubar.mountCompContainer.append(this.popoverEl);
                // get popover content
                // insert html to popover div
                this.popoverEl.innerHTML = this.menu.getContentHTML(position.key, position.meta)
                // attach event handlers for popover content

                var self = this;
                RTEComponents.popover(`#popover-for-${this.id}`, {
                    forElement: position.key,
                    position: 'top',
                    appendTo: this.rteView.menubar.mountCompContainer,
                    viewport: document.body,
                    displayType: 'box',
                    within: '#' + this.rteView.dom.id,
                    closeOnEsc: true,
                    className: 'context-menu-popover',
                    title: '',
                    beforeopen: function() {
                        self.menu.addEventListeners(self.popoverEl, position.key, position.meta)
                    },
                    open: function() {
                        setTimeout(function() {
                            self.rteView.editorView.focus()
                        }, 100)
                    },
                    closeOnBodyClick: false,
                    closeOnScroll: true
                });

                RTEComponents.popover(`#popover-for-${this.id}`).open();
            }
        } else {
            // cursor has moved into a non registered context. Just close current open popovers if any.
            this.closePopover();
        }
    }
}