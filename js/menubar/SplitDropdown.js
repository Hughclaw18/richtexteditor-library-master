/**
 * var dd = new Splitdropdown(mountpoint, {
 *      id: 'some-id-unique-to-dropdown',
 *      options: [{
 *          id, icon, label, action
 *      }]
 * })
 */
 import { RTEComponents } from "../RichTextEditorView";

export default class SplitDropdown {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.config.contentType = this.config.contentType || 'icon-text'
        this.config.buttonType = this.config.buttonType || 'icon-text'
        this.mount = mount;
        this.id = this.rteView.id + '-' + this.config.id;

        // setup listener to call onContextChange whenever cursor position changes
        this.boundedOnContextChange = this.onContextChange.bind(this);
        this.rteView.editorView.dom.addEventListener('cursorPositionChanged', this.boundedOnContextChange)


    }

    // mandatory method
    destroy() {
        RTEComponents.menu('#menu-for-'+this.id).destroy()
        RTEComponents.menubutton("#button-for-"+this.id).destroy()
        this.rteView.options.root.querySelector(`#menu-for-${this.id}`).remove();
        this.rteView.editorView.dom.removeEventListener('cursorPositionChanged', this.boundedOnContextChange)

    }

    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
      
        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }

    getDropdownHtml() {
        return `
        <div id="menu-for-${this.id}" class="rte-split-dropdown">
        </div>
        `
    }

    // mandatory method
    onAction(callback) {
        this.actionCallback = callback;
    }

    getButtonHtml() {
        var html = `
        <div class="zmetoolbar__btn-split" id="rte-toolbar-${this.id}">
            <button type="button" class="state-button" id="button-for-${this.id}" data-menu-id="menu-for-${this.id}" data-title-is-message-html-encoded="true" title="${this.config.name}">
        </div>
        `

        return html;
    }

    getSelectedOption() {
        var selection = this.config.options.filter(option => option.selected)
        if (selection.length) {
            return selection[0];
        } else {
            // if no option is selected, just return the first option
            this.config.options[0];
        }
    }

    getOptionById(id) {
        return this.config.options.filter(option => option.id === id)[0]
    }

    updateSelection(optionId) {
        // model update
        var selectedOption = null;
        this.config.options.forEach(function(option) {
            option.selected = false;
            if (option.id === optionId) {
                selectedOption = option;
                option.selected = true;
            }
        })

        if (selectedOption.isSVGIcon) {
            RTEComponents.menubutton('#button-for-'+this.id).setAttribute('SVGIconId', selectedOption.icon)
        } else {
            RTEComponents.menubutton('#button-for-'+this.id).setAttribute('iconClass', selectedOption.icon)
        }

        if (this.config.buttonType !== 'icon') {
            RTEComponents.menubutton('#button-for-'+this.id).setAttribute('text', selectedOption.name)
        }

    }

    onItemClicked(optionId) {
        this.updateSelection(optionId);
        this.actionCallback && this.actionCallback(this.getSelectedOption())
    }

    onContextChange() {
        var optionId = this.config.onContextChange && this.config.onContextChange()
        var option = this.getOptionById(optionId)
        if (option) {
            if (option.id != this.getSelectedOption().id) {
                // update selection to newly selected option
                this.updateSelection(optionId)
            }

            if (this.config.stateButton) {
                // apply selected class to state
                this.mount.querySelector("#button-for-"+this.id).classList.add('is-selected')
            }
        } else if (this.config.stateButton) {
            this.mount.querySelector("#button-for-"+this.id).classList.remove('is-selected')
        }
    }

    addStylesToButton() {
        var buttonEl = this.mount.querySelector(`#button-for-${this.id}`)
        var styleObj = this.config.styles
        if(styleObj) {
            for(var key in styleObj) {
                buttonEl.style[key] = styleObj[key]
            }
        } 
    }

    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getButtonHtml();
        this.mount.innerHTML = html;
        this.addStylesToButton()
        var selectedOption = this.getSelectedOption();

        var menuhtml = this.getDropdownHtml();
        this.rteView.menubar.mountCompContainer.append(this.createElementFromHTML(menuhtml));
        var self = this;
        RTEComponents.menu('#menu-for-'+this.id, {
            forElement: "#button-for-"+this.id,
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            contentType: 'icon-text',
            itemclick: function( event, data ) {
                self.onItemClicked(data.data.id)
            },
            size: 'mini'
        })
        this.config.options.forEach(function(option) {
            var menuOptions = {
                id: option.id,
                label: option.name,
                checked: option.selected,
                size: 'mini',
                contentType: this.config.contentType
            }
            var iconAttr = option.isSVGIcon ? 'SVGIconId' : 'iconClassName'
            menuOptions[iconAttr] = option.isSVGIcon ? option.icon : option.icon + " rte-font-icon-color"

            RTEComponents.menu('#menu-for-'+this.id).addMenuItem(menuOptions)
        }, this)


        var menuButtonOptions = {
            arrowSVGIconId: 'rte-icon-dd-arrow',
            text: this.config.buttonType !== 'icon' ? selectedOption.name : '',
            menuId: 'menu-for-' + this.id,
            size: 'mini',
            className: 'rte-menu-button-split-dropdown'
        }
        var iconAttr = selectedOption.isSVGIcon ? 'SVGIconId' : 'iconClass'
        menuButtonOptions[iconAttr] = selectedOption.icon
        RTEComponents.menubutton("#button-for-"+this.id, menuButtonOptions);
    }
}