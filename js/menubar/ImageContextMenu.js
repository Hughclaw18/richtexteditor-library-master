import RichTextEditor from "../RichTextEditor";

export default class ImageContextMenu {

    constructor(config, rteView, close) {
        this.config = config
        this.rteView = rteView
        this.close =  close
        this.id = this.rteView.id + '-' + this.config.id
        this.boundedSmallFit = this.changeFit.bind(this,"small")
        this.boundedBestFit = this.changeFit.bind(this,"best")
        this.boundedOriginal= this.changeFit.bind(this,"original")
        this.boundedFitToWidth = this.changeFit.bind(this,"fitToWidth")
        this.contextMenuHeight = 50 // this is the height of the image context menu which will be rendered, as of now it is kept as constant ..... do change this value when the design of the context menu changes
    }

    // mandatory method
    getContentHTML(key, meta) {
        return `<div id="context-menu-for-${this.id}">
            <a class="rte-link-btn ${meta.fit === "small"? "rte-img-fit-selected" : ""}">
                <span id="rte-image-small-fit"> ${RichTextEditor.i18n('common.SMALL_FIT')} </span>
            </a>
             | 
            <a class="rte-link-btn ${meta.fit === "best"? "rte-img-fit-selected" : ""}">
                <span id="rte-image-best-fit"> ${RichTextEditor.i18n('common.BEST_FIT')} </span>
            </a>
             | 
            <a class="rte-link-btn ${meta.fit === "original"? "rte-img-fit-selected" : ""}">
                <span id="rte-image-original"> ${RichTextEditor.i18n('common.ORIGINAL_SIZE')} </span>
            </a>
             | 
            <a class="rte-link-btn ${meta.fit === "fitToWidth"? "rte-img-fit-selected" : ""}">
                <span id="rte-image-fit-to-width"> ${RichTextEditor.i18n('common.FIT_TO_PAGE')} </span>
            </a>
        </div>`
    }

    // mandatory method
    addEventListeners(popoverEl, key, meta) {
        popoverEl.querySelector("#rte-image-small-fit").addEventListener('click', this.boundedSmallFit)
        popoverEl.querySelector("#rte-image-best-fit").addEventListener('click', this.boundedBestFit)
        popoverEl.querySelector("#rte-image-original").addEventListener('click', this.boundedOriginal)
        popoverEl.querySelector("#rte-image-fit-to-width").addEventListener('click', this.boundedFitToWidth)
    }

    // mandatory method
    destroy(popoverEl) {
        popoverEl.querySelector("#rte-image-small-fit").removeEventListener('click', this.boundedSmallFit)
        popoverEl.querySelector("#rte-image-best-fit").removeEventListener('click', this.boundedBestFit)
        popoverEl.querySelector("#rte-image-original").removeEventListener('click', this.boundedOriginal)
        popoverEl.querySelector("#rte-image-fit-to-width").removeEventListener('click', this.boundedFitToWidth)
    }

    changeFit(fitType) {
        this.rteView.commands.updateImageFit(fitType)
        this.close()
        var self = this;
        setTimeout(function() {
            self.rteView.focus()
        }, 100)
    }

    // mandatory method
    onContextChange() {
        var state = this.rteView.editorView.state;
        var isImageNode = false;
        var fit;
        if (state.selection.$from.pos === state.selection.$to.pos - 1) {// always an image will get selected only if the difference between the $from and $to positions is 1, if the difference is 1 then return the node at $from position
            let node = state.doc.nodeAt(state.selection.$from.pos)
            if(node.type.name === "image") {
                isImageNode = true
                fit = node.attrs.fit
            }
        }

        if (isImageNode) {
            var view = this.rteView.editorView
            var imageDOM = view.nodeDOM(view.state.selection.$from.pos)
            if(imageDOM) {
                return {
                    key: imageDOM,
                    meta: {
                        fit
                    }
                }
            }
        }
    }
}