import { RTEComponents } from "../RichTextEditorView";

export default class {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.id = this.rteView.id + '-' + this.config.id;
        this.boundedShowPopover = this.showPopover.bind(this)
    }

    destroy() {
        this.mount.querySelector(`#rte-toolbar-${this.id}`).removeEventListener('click',this.boundedShowPopover)
        RTEComponents.popover(`#popover-for-${this.id}`).destroy();
        this.rteView.options.root.querySelector(`#popover-for-${this.id}`).remove();

    }

    getButtonHtml() {

        var html = `<button 
            type="button" class="rte-toolbar-btn" tabindex="-1" id="rte-toolbar-${this.id}" data-title-is-message-html-encoded="true" title="${this.config.name}">`
            + (this.config.isSVGIcon ? `<svg class="ui-rte-icon"><use xlink:href="#${this.config.icon}"></use></svg>` : `<i class="${this.config.icon} rte-font-icon-color"></i>`) +
        `</button>`

        return html;
    }

    getPopoverHtml() {

        let popoverDiv = document.createElement('div')
        popoverDiv.setAttribute('id',`popover-for-${this.id}`)
        popoverDiv.setAttribute('class', 'rte-popover')
        let table = document.createElement('table')
        for(let i = 0; i < this.config.rows; i++) {
            let row = table.insertRow()
            for(let j = 0; j < this.config.cols; j++) {
                let cell = row.insertCell()
                if(i === 0 && j === 0) {
                    cell.setAttribute('class', 'rte-menubar-table-cell rte-menubar-table-cell-hovered')
                } else {
                    cell.setAttribute('class', 'rte-menubar-table-cell')
                }
                cell.setAttribute('data-row-id', i)
                cell.setAttribute('data-col-id', j)
                cell.setAttribute('id','rte-table-cell-number-'+i+j)
            }
        }
        popoverDiv.appendChild(table)

        let displayingDiv = document.createElement('div')
        displayingDiv.setAttribute('id','rte-table-display-row-and-col')
        displayingDiv.innerHTML = '1 x 1'
        popoverDiv.appendChild(displayingDiv)

        return popoverDiv

    }

    showPopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).open();
    }

    closePopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).close();
    }

    // mandatory method
    onAction(callback) {
        this.actionCallback = callback;
    }

    reset() {
        for(let i = 0; i < this.config.rows; i++) {
            for(let j = 0; j < this.config.cols; j++) {

                if(i === 0 && j === 0) {
                    //add the class if not added
                    let curEle = this.popoverEl.querySelector("#rte-table-cell-number-"+i+j)
                    if( curEle.getAttribute("class").indexOf("rte-menubar-table-cell-hovered") < 0 ) {
                        curEle.classList.add("rte-menubar-table-cell-hovered")
                    }
                } else {
                    //remove the class if not already removed
                    let curEle = this.popoverEl.querySelector("#rte-table-cell-number-"+i+j)
                    if( curEle.getAttribute("class").indexOf("rte-menubar-table-cell-hovered") >= 0 ) {
                        curEle.classList.remove("rte-menubar-table-cell-hovered")
                    }
                }
            }
        }
        this.popoverEl.querySelector("#rte-table-display-row-and-col").innerHTML = "1 x 1"
    }

    eventListenerForEachCell(row, col) {
        this.closePopover()
        this.actionCallback(row, col)
    }

    bindEventListenersToCells () {
        
        let tableCells = this.popoverEl.querySelectorAll(".rte-menubar-table-cell")

        for(let i = 0; i < tableCells.length; i++) {  

            let row = Number(tableCells[i].getAttribute('data-row-id'))
            let col = Number(tableCells[i].getAttribute('data-col-id'))

            tableCells[i].addEventListener('click', this.eventListenerForEachCell.bind(this, row+1, col+1))// add +1 because indexing of cell starts from 0
            tableCells[i].addEventListener('mouseover' , this.addOrRemoveBgColor.bind(this))  
        }
    }

    getRowAndCol(event) {
        let hoveredItem = event.target
        let row = Number(hoveredItem.getAttribute('data-row-id'))
        let col = Number(hoveredItem.getAttribute('data-col-id'))
        return {row, col}
    }

    addOrRemoveBgColor (event) {

        let {row, col} = this.getRowAndCol(event)

        for(let i = 0; i < this.config.rows; i++) {
            for(let j = 0; j < this.config.cols; j++) {
                if( i <= row && j <= col ) {
                    //add the class if not added
                    let curEle = this.popoverEl.querySelector("#rte-table-cell-number-"+i+j)
                    if( curEle.getAttribute("class").indexOf("rte-menubar-table-cell-hovered") < 0 ) {
                        curEle.classList.add("rte-menubar-table-cell-hovered")
                    }
                } else {
                    //remove the class if not already removed
                    let curEle = this.popoverEl.querySelector("#rte-table-cell-number-"+i+j)
                    if( curEle.getAttribute("class").indexOf("rte-menubar-table-cell-hovered") >= 0 ) {
                        curEle.classList.remove("rte-menubar-table-cell-hovered")
                    }
                }
            }
        }

        this.popoverEl.querySelector("#rte-table-display-row-and-col").innerHTML = (row+1) + " x " + (col+1) //add +1 as indexing starts from 0
    }

    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getButtonHtml();
        this.mount.innerHTML = html;

        var popoverEl = this.getPopoverHtml()
        this.popoverEl = popoverEl
        this.rteView.menubar.mountCompContainer.append(popoverEl);

        var self = this;

        RTEComponents.popover(`#popover-for-${this.id}`, {
            className: 'rte-toolbar-menu-bar-table-popover' ,
            forElement: `#rte-toolbar-${this.id}`,
            displayType: 'callout',
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            beforeclose: function(event, data) {
                self.reset()
            }
        });

        this.mount.querySelector(`#rte-toolbar-${this.id}`).addEventListener('click', this.boundedShowPopover)

        this.bindEventListenersToCells()
    }
}
