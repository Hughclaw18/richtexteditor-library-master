import { RTEComponents } from "../RichTextEditorView";
import RichTextEditor from "../RichTextEditor";
import { defaultAnchorRegex } from "../RTELink"
import { getFeatureConfigFromOpts } from "../RichTextEditorView"

export default class AnchorMenu {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.id = this.rteView.id + '-' + this.config.id;
        this.anchorName = null;
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
            <div class="zdialog-title">${RichTextEditor.i18n('common.INSERT_ANCHOR')}</div>
            <div class="ui-flex-container ui-flex-wrap ui-top-margin-xl-video">        
                <div class="ui-flex-container rte-url-container rte-w-100 ui-top-margin-xl-video">
                    <input type="text" class="rte-inputbox rte-w-100 ui-no-right-margin" id="rte-anchor-input-${this.id}" placeholder="${RichTextEditor.i18n('common.PROVIDE_ANCHOR_NAME')}" style="height: 30px"></input>
                </div>
            </div>
            <div class="ui-flex-container ui-flex-end rte-dialog-footer-video">
                <button type="button" id="rte-anchor-submit-${this.id}" class="rte-btn rte-btn-primary ui-right-margin-small" disabled="true">${RichTextEditor.i18n('common.ADD')}</button>
                <button type="button" id="rte-anchor-cancel-${this.id}" class="rte-btn rte-btn-secondary">${RichTextEditor.i18n('common.CANCEL')}</button>
            </div>
        </div>
        `
    }

    showPopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).open();
    }


    reset() {
        this.anchorName = null;
        this.popoverEl.querySelector(`#rte-anchor-submit-${this.id}`).setAttribute("disabled", "true")
        this.popoverEl.querySelector(`#rte-anchor-input-${this.id}`).value = ""
    }

    addAnchor(popoverEl) {
        this.rteView.commands.addAnchor(this.anchorName)
        RTEComponents.popover(popoverEl).close()
        this.rteView.editorView.focus();
    }

    checkValidityOfAnchor(popoverEl) {
        var linkFeatureConf = getFeatureConfigFromOpts("link", this.rteView.options)
        var isValidAnchor = false
        var anchorReg = linkFeatureConf.anchorRegex || defaultAnchorRegex

        var anchorName = popoverEl.querySelector(`#rte-anchor-input-${this.id}`).value
        isValidAnchor = anchorReg.test(anchorName)

        if(isValidAnchor) {
            this.anchorName = anchorName
            this.validationForEnablingSubmitButton(popoverEl)
        } else {
            this.anchorName = ""
            this.validationForEnablingSubmitButton(popoverEl)
        }
    }

    validationForEnablingSubmitButton(popoverEl) {
        var self = this
        var el = popoverEl.querySelector(`#rte-anchor-submit-${self.id}`)

        if(this.anchorName) {
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
            open: function(event, data) {
                setTimeout(function() {
                    popoverEl.querySelector(`#rte-anchor-input-${self.id}`).focus()
                }, 200)
            },
            displayType: 'callout',
            beforeclose: function(event, data) {
                self.reset()
            }
        });

        this.mount.querySelector(`#rte-toolbar-${this.id}`).addEventListener('click', function() {
            self.showPopover()
        })

        popoverEl.querySelector(`#rte-anchor-submit-${self.id}`).addEventListener('click', function() {
            self.addAnchor(popoverEl)
        })

        popoverEl.querySelector(`#rte-anchor-cancel-${self.id}`).addEventListener('click', function() {
            self.reset();    
            RTEComponents.popover(popoverEl).close()
            self.rteView.editorView.focus();
        })

        popoverEl.querySelector(`#rte-anchor-input-${self.id}`).addEventListener('keyup', function(e) {
            self.checkValidityOfAnchor(popoverEl)
        })

    }
}