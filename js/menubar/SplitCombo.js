import { RTEComponents } from "../RichTextEditorView";

export default class SplitCombo {

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
        RTEComponents.combobox(`#menu-for-${this.id}`).destroy()
        this.rteView.options.root.querySelector(`#menu-for-${this.id}`).remove();
        this.rteView.editorView.dom.removeEventListener('cursorPositionChanged', this.boundedOnContextChange)
    }

    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
      
        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }

    getDefaultOption() {
        return this.config.options.filter((obj)=> {
            return obj.default//if default is set to true then set the current option as default
        })[0].name
    }

    getComboBoxHtml() {
        return `<select id="menu-for-${this.id}" class="zmetoolbar__btn" tabindex="-1" >
                </select >`
    }

    // mandatory method
    onAction(callback) {
        this.actionCallback = callback;
    }

    toAddCustomOption(value) {    

        var configOptionObj = {}
        configOptionObj.name = value.toString()
        configOptionObj.id = this.config.customValueId + '-' + value.toString()
        configOptionObj.customValueCommand = this.config.customValueCommand
        // configOptionObj.label = value.toString()//the name to be displayed on the dropdown

        var parameters = []
        parameters.push(value)
        configOptionObj.params = parameters

        this.config.options.push(configOptionObj)

        var valueToBeAdded = []
        var newDropDownObj = {}
        newDropDownObj.value = value.toString()
        newDropDownObj.label = value.toString()
        newDropDownObj.id = this.config.customValueId + '-' + value.toString()
        newDropDownObj.className = 'rte-split-combo-box-dropdown-elements'
        valueToBeAdded.push(newDropDownObj)
        
        RTEComponents.combobox(`#menu-for-${this.id}`).addOption(valueToBeAdded)
    }

    constructNewOptionAndSelectIt(customValue) {

        this.toAddCustomOption(customValue)
        RTEComponents.combobox(`#menu-for-${this.id}`).setValue(customValue)

        var options = {}
        options.params = []
        options.params.push(customValue)
        options.customValueCommand = this.config.customValueCommand
        this.actionCallback && this.actionCallback(options)
    }

    onNewValueAdd(event, data) {
        var customValue = parseFloat(data.newOptionData)

        if (customValue) {
            customValue = Math.round((customValue + Number.EPSILON) * 100) / 100//to roundoff to 2 decimal places
            let { minFontSize, maxFontSize } = this.rteView.options
            if(customValue > maxFontSize) {//if custom value is greater than default max font size then make it equal to default max font size
                customValue = maxFontSize
            } else if (customValue < minFontSize) {//if custom value is lesser than default min font size then make it equal to default min font size
                customValue = minFontSize
            }

            //check if already this value is present in dropdown
            var resultantOption = this.config.options.filter((option) => {
                return customValue.toString() === option.name
            })[0]

            if( !resultantOption ) {
                this.constructNewOptionAndSelectIt(customValue)
            } else {
                RTEComponents.combobox(`#menu-for-${this.id}`).setValue(customValue)
                this.actionCallback && this.actionCallback(resultantOption)
            }
        } else {
            //the input given is not a number, so print an error message
            // don't throw error, if error is thrown then the zoho componenets executes this function twice
            //if error is not thrown the function is executed only once
            return//return is simply to put to avoid codecheck error
        }
    }

    onOptionClick(event, data) {
        this.actionCallback && this.actionCallback(this.getSelectedOption(data))
    }

    getSelectedOption(data) {
        var selectedOptionId = data.optionData.id
        return this.config.options.filter( option => option.id === selectedOptionId )[0]
    }

    getOptionById(id) {
        return this.config.options.filter(option => option.id === id)[0]
    }

    onContextChange() {
        var currentOption = this.config.onContextChange && this.config.onContextChange()
        var option = this.getOptionById(currentOption.id)
        if (option) {
            RTEComponents.combobox(`#menu-for-${this.id}`).setValue(option.name)
        } else {
            this.constructNewOptionAndSelectIt(currentOption.value)
        }
    }

    sortingFunction(records) {
        records.sort(function(firstObj, secondObj) {
            var firstVal = parseFloat(firstObj.value)
            var secondVal = parseFloat(secondObj.value)
            return firstVal - secondVal;
        })
        return records
    }    

    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getComboBoxHtml();
        this.mount.innerHTML = html;
        
        // for setting tooltip content as html/text
        // adding this here seems to be different when compared to other components like splitDropdown etc,
        // because this is what components team suggested
        this.mount.setAttribute("data-title-is-message-html-encoded", "true")
        this.mount.setAttribute("title", this.config.name)

        var defaultValue = this.getDefaultOption()
        var self = this;
        var dropdownList = this.config.options.map((option)=>{
            return {
                label: option.name,
                value: option.name,
                id: option.id,
                className: 'rte-split-combo-box-dropdown-elements'
            }
        })
        RTEComponents.combobox(`#menu-for-${this.id}`, {
            sort: true,
            dataMapping: {
                value: "value"
            },
            search: {
                criteria: "startswith",
                by: "value"
            },
            options: dropdownList,
            acceptNewValues: true,
            customSorter: this.sortingFunction,
            selectedValue: defaultValue,
            dropdownList: {
                appendTo: this.rteView.menubar.mountCompContainer,
                viewport: document.body
            },
            optionclick: this.onOptionClick.bind(this),
            newvalueadd: this.onNewValueAdd.bind(this),
            className: 'rte-split-combo-box-button',
            arrowSVGIconId: 'rte-icon-dd-arrow',
            placeholder: " "
        });
    }
}
