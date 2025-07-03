import { RTEComponents } from "../RichTextEditorView";

export default class ColorPicker {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.id = this.rteView.id + '-' + this.config.id;

        // setup listener to call onContextChange whenever cursor position changes
        this.boundedOnContextChange = this.onContextChange.bind(this);
        this.rteView.editorView.dom.addEventListener('cursorPositionChanged', this.boundedOnContextChange)
    }

    // mandatory method
    destroy() {
        RTEComponents.colorpicker(`#color-picker-${this.id}`).destroy()
        this.rteView.editorView.dom.removeEventListener('cursorPositionChanged', this.boundedOnContextChange)
        // need to remove the empty color picker popover div manually,
        // zohocomponents does not do this by default on calling RTEComponents.colorpicker(`#color-picker-${this.id}`).destroy() metho.
        this.popoverEl.remove()
    }

    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
      
        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }

    // mandatory method
    onAction(callback) {
        this.actionCallback = callback;
    }

    getButtonHtml(theme) {
        var html = `
        <button 
            type="button" class="rte-toolbar-btn" tabindex="-1" id="color-picker-button-${this.id}" data-title-is-message-html-encoded="true" title="${this.config.name}"> `
            + (this.config.isSVGIcon ? `<svg class="ui-rte-icon"><use xlink:href="#${this.config.icon}"></use></svg>` : `<i class="${this.config.icon} rte-font-icon-color"></i>`) +
            `<div id="rte-color-picker-line-${this.config.id}" style="width: 14px;background-color: ${this.config.defaultColor(theme)};display: block;position: absolute;bottom: 5px;left: 7px;height: 1px;border-radius: 3px;"></div>
        </button>
        `
        return html;
    }

    getColorPickerPopoverHtml() {
        return `<div id="color-picker-${this.id}"></div>`
    }

    getSelectedOption() {
        return RTEComponents.colorpicker(`#color-picker-${this.id}`).getValue()
    }

    onContextChange() {
        var colorCode = this.config.onContextChange && this.config.onContextChange()
        RTEComponents.colorpicker(`#color-picker-${this.id}`).setValue(colorCode)
        this.mount.querySelector(`#rte-color-picker-line-${this.config.id}`).style.backgroundColor = colorCode

    }

    changeDefaultValue(theme) {
        RTEComponents.colorpicker(`#color-picker-${this.id}`).setAttribute("defaultValue", this.config.defaultColor(theme))
    }

    setColor(event, data) {

        if(!data.fromUI) {//if we manually set color value in colorPicker component (for eg we are setting in onContextChange()) we shld not call this.actionCallback instead we shld only change the bg color of the div with the id "rte-color-picker-line-${this.config.id}", so we are returning without doing anything
            return
        }

        var params = []
        data.value = data.value === "transparent" ? "" : data.value //if "no fill" option is clicked in color picker then we would get the value as transparent in data.value...... but we want the no fill option to work as removeFontColor or removeBackgroundColor , so we pass an empty string
        params.push(data.value)//pass params as an array because execCommand expexcts the parameter to be passed as an array
        this.actionCallback && this.actionCallback(params)
        RTEComponents.colorpicker(`#color-picker-${this.id}`).close()
    }

    // mandatory method
    render() {
        var html = this.getButtonHtml(this.rteView.options.isDarkThemeEnabled ? "dark" : "light");
        this.mount.innerHTML = html;
        this.popoverEl = this.createElementFromHTML(this.getColorPickerPopoverHtml())
        this.rteView.menubar.mountCompContainer.append(this.popoverEl);
        var self = this;
        RTEComponents.colorpicker(`#color-picker-${this.id}`,{
            forElement: `#color-picker-button-${this.id}`,
            className: `rte-color-picker-drop-down ${this.config.className}`,
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            advancedPicker: true,
            defaultColorButton: true,
            noColorButton: false,
            standardColors: true,
            opacity: false,
            defaultValue: this.config.defaultColor(this.rteView.options.isDarkThemeEnabled ? "dark" : "light"),
            pick : this.setColor.bind(this)//this event is not in documentation , found it from the node_modules...... Took this event because of the following case:
            //type the string "abc def ghi" and mark "abc" and "ghi" in red now select from abc till ghi and select red color once again inorder to make the color of "def" as red, the font-color will change .....this will not change if we use onChange event
        })

        this.mount.querySelector(`#color-picker-button-${this.id}`).addEventListener('click',function() {
            RTEComponents.colorpicker(`#color-picker-${self.id}`).open()
        })
    }
}