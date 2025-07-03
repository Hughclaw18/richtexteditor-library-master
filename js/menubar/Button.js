export default class Button {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.value = false;
        this.id = this.rteView.id + '-' + this.config.id;

        // setup listener to call onContextChange whenever cursor position changes
        this.boundedOnContextChange = this.onContextChange.bind(this);
        this.rteView.editorView.dom.addEventListener('cursorPositionChanged', this.boundedOnContextChange)
    } 

    // mandatory method
    destroy() {
        this.rteView.editorView.dom.removeEventListener('cursorPositionChanged', this.boundedOnContextChange)
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

    getButtonHtml() {

        var html = `<button 
            type="button" class="rte-toolbar-btn" tabindex="-1" id="rte-toolbar-${this.id}" data-title-is-message-html-encoded="true" title="${this.config.name}">`
            + (this.config.isSVGIcon ? `<svg class="ui-rte-icon"><use xlink:href="#${this.config.icon}"></use></svg>` : `<i class="${this.config.icon} rte-font-icon-color"></i>`) +
        `</button>`

        return html;
    }


    updateSelection(selected) {
        if (selected) {
            this.mount.querySelector(`#rte-toolbar-${this.id}`).classList.add('is-selected')
        } else {
            this.mount.querySelector(`#rte-toolbar-${this.id}`).classList.remove('is-selected')
        }
    }

    onItemClicked() {
        this.value = !this.value;
        !this.config.simple && this.updateSelection(this.value)
        this.actionCallback && this.actionCallback(this.value)
    }

    onContextChange() {
        if (this.config.simple) { // don't update selection if simple button
            return;
        }
        var value = this.config.onContextChange && this.config.onContextChange()
        if (this.value != value) {
            this.value = value
            this.updateSelection(value)
        }
    }

    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getButtonHtml();
        this.mount.innerHTML = html;
        var self = this;
        this.mount.querySelector(`#rte-toolbar-${this.id}`).addEventListener('click', function() {
            self.onItemClicked()
        })
    }
}