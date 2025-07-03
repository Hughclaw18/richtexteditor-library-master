import { RTEComponents } from "../RichTextEditorView";
import RichTextEditor from "../RichTextEditor";

export default class EmbedMenu {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.id = this.rteView.id + '-' + this.config.id;
        this.iframeString = null;
        this.editOperation = false;
    }

    destroy() {
        RTEComponents.popover(`#popover-for-${this.id}`).destroy();
        this.rteView.options.root.querySelector(`#popover-for-${this.id}`).remove();
    }

    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
      
        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }

    getButtonHtml() {

        var html = `<button 
            type="button" class="rte-toolbar-btn" tabindex="-1" id="rte-toolbar-${this.id}" data-title-is-message-html-encoded="true" title="${this.config.name}">`
            + (this.config.isSVGIcon ? `<svg class="ui-rte-icon"><use xlink:href="#${this.config.icon}"></use></svg>` : `<i class="${this.config.icon} rte-font-icon-color"></i>`) +
        `</button>`

        return html;
    }

    getPopoverHtml() {
        return `
        <div id="popover-for-${this.id}" class="rte-popover" style="width: 366px">
            <div class="zdialog-title">${RichTextEditor.i18n('common.EMBED')}</div>
            <div class="ui-flex-container ui-flex-wrap ui-top-margin-xl-video">        
                <div class="ui-flex-container rte-url-container rte-w-100 ui-top-margin-xl-video">
                    <textarea type="text" class="rte-inputbox rte-w-100 ui-no-right-margin" id="rte-embed-string-${this.id}" placeholder="${RichTextEditor.i18n('common.PROVIDE_EMBED_CODE')}" style="height: 130px;"></textarea>
                </div>
            </div>
            <div class="ui-flex-container ui-flex-end rte-dialog-footer-video">
                <button type="button" id="rte-embed-submit-${this.id}" class="rte-btn rte-btn-primary ui-right-margin-small" title="Insert" disabled="true">${RichTextEditor.i18n('common.INSERT')}</button>
                <button type="button" id="rte-embed-cancel-${this.id}" class="rte-btn rte-btn-secondary" title="Cancel">${RichTextEditor.i18n('common.CANCEL')}</button>
            </div>
        </div>
        `
    }

    showPopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).open();
    }


    reset() {
        this.iframeString = null;
        this.popoverEl.querySelector(`#rte-embed-submit-${this.id}`).setAttribute("disabled", "true")
        this.popoverEl.querySelector(`#rte-embed-string-${this.id}`).value = ""
        this.editOperation = false;
    }

    submitEmbed(popoverEl) {
        if(this.editOperation) {
            this.rteView.commands.editEmbed(this.iframeString)
        } else {
            this.rteView.commands.insertEmbed({ iframeString: this.iframeString })
        }
        RTEComponents.popover(popoverEl).close()
        this.rteView.editorView.focus();
    }

    validationForEnablingSubmitButton(popoverEl) { //get the fit value that needs to be applied
        var self = this
        var el = popoverEl.querySelector(`#rte-embed-submit-${self.id}`)
        this.iframeString = popoverEl.querySelector(`#rte-embed-string-${this.id}`).value

        if(this.iframeString) {
            el.removeAttribute("disabled")
        } else {
            el.setAttribute("disabled", "true")
        }
    }


    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getButtonHtml();
        this.mount.innerHTML = html;

        var popoverEl = this.createElementFromHTML(this.getPopoverHtml())
        this.popoverEl = popoverEl
        this.rteView.menubar.mountCompContainer.append(popoverEl);

        var self = this;

        RTEComponents.popover(`#popover-for-${this.id}`, {
            forElement: `#rte-toolbar-${this.id}`,
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            open: function() {
                setTimeout(function() {
                    popoverEl.querySelector(`#rte-embed-string-${self.id}`).focus()
                }, 200)
            },
            displayType: 'callout',
            beforeopen: function() {
                var selectedNode = self.rteView.editorView.state.selection.node
                if(selectedNode && selectedNode.type.name === "embed" && selectedNode.attrs.iframeString) {
                    var iframeString = selectedNode.attrs.iframeString
                    self.iframeString = iframeString;
                    self.popoverEl.querySelector(`#rte-embed-string-${self.id}`).value = self.iframeString
                    self.popoverEl.querySelector(`#rte-embed-submit-${self.id}`).removeAttribute("disabled")
                    self.editOperation = true;
                }
            },
            beforeclose: function() {
                self.reset()
            }
        });

        this.mount.querySelector(`#rte-toolbar-${this.id}`).addEventListener('click', function() {
            self.showPopover()
        })

        popoverEl.querySelector(`#rte-embed-submit-${self.id}`).addEventListener('click', function() {
            self.submitEmbed(popoverEl)
        })

        popoverEl.querySelector(`#rte-embed-cancel-${self.id}`).addEventListener('click', function() {
            self.reset();    
            RTEComponents.popover(popoverEl).close()
            self.rteView.editorView.focus();
        })

        popoverEl.querySelector(`#rte-embed-string-${self.id}`).addEventListener('keyup', function(e) {
            self.validationForEnablingSubmitButton(popoverEl)
        })

    }
}