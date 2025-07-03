import { RTEComponents } from "../RichTextEditorView";
import RichTextEditor from "../RichTextEditor";

export default class InsertHtmlMenu {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.id = this.rteView.id + '-' + this.config.id;
        this.edit = false
    }

    destroy() {
        RTEComponents.dialog(`#dialog-for-${this.id}`).destroy();
        this.rteView.options.root.querySelector(`#dialog-for-${this.id}`).remove();
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

    getDialogHtml() {
        return `
        <div id="dialog-for-${this.id}" class="rte-insert-html-drop-down">
            <label>${RichTextEditor.i18n('common.INSERT_HTML')}:</label>
            <textarea rows="4" cols="35" id="rte-textbox-for-${this.id}"></textarea>
        </div>
        `
    }

    showDialog() {
        RTEComponents.dialog(`#dialog-for-${this.id}`).open();
    }

    showEditDialog(htmlString) {
        this.edit = true
        RTEComponents.dialog(`#dialog-for-${this.id}`).open();
        this.dialogEl.querySelector(`#rte-textbox-for-${this.id}`).value = htmlString
    }


    reset() {
        this.dialogEl.querySelector(`#rte-textbox-for-${this.id}`).value = ""
        this.edit = false
    }

    submit(dialogEl) {
        let htmlString = dialogEl.querySelector(`#rte-textbox-for-${this.id}`).value
        this.edit ? this.rteView.commands.editHtml(htmlString) : this.rteView.commands.insertHtml(htmlString)
        
        RTEComponents.dialog(dialogEl).close()
        this.rteView.editorView.focus();
    }

    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getButtonHtml();
        this.mount.innerHTML = html;

        var dialogEl = this.createElementFromHTML(this.getDialogHtml())
        this.dialogEl = dialogEl
        this.rteView.menubar.mountCompContainer.append(dialogEl);

        var self = this;

        RTEComponents.dialog(`#dialog-for-${this.id}`, {
            open: function(event, data) {
                setTimeout(function() {
                    dialogEl.querySelector(`#rte-textbox-for-${self.id}`).focus()
                }, 200)
            },
            className: 'rte-insert-html-dialog',
            title: RichTextEditor.i18n('common.INSERT_HTML'),
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            beforeclose: function(event, data) {
                self.reset()
            },
            buttons: [{
                "text": RichTextEditor.i18n('common.INSERT'),
                "id": `rte-html-dialog-insert-btn`,
                "appearance": "primary",
                "action": this.submit.bind(this, this.dialogEl)
            },{
                "text": RichTextEditor.i18n('common.CANCEL'),
                "id": `rte-html-dialog-cancel-btn`,
                "action": "CLOSE"
            }],
            closeSVGIconId: "rte-dialog-close"
        });

        this.mount.querySelector(`#rte-toolbar-${this.id}`).addEventListener('click', function() {
            self.rteView.menubar.closeMoreMenu()
            self.showDialog()
        })

    }
}
