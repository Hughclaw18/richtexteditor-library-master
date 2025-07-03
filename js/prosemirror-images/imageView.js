const minWidth = 50
const minHeight = 50

export default class ImageView {
    constructor(node, view, options) {
        this.node = node;
        this.options = options // cache the options here for further use in update() function
        this.view = view

        this.dom = document.createElement('div');
        this.dom.className = 'rte-resize-overlay-outer-div';
        this.dom.appendChild(document.createElement('img'));

        this.dom.innerHTML = this.dom.innerHTML 
                            + 
                            `<div class="rte-resize-overlay-inner-div" style="display: none;">
                                <span class="rte-resize-top-left rte-resize-marker-outer">
                                    <span class="rte-resize-marker-inner"></span>
                                </span>
                                <span class="rte-resize-top-right rte-resize-marker-outer">
                                    <span class="rte-resize-marker-inner"></span>
                                </span>
                                <span class="rte-resize-bottom-left rte-resize-marker-outer">
                                    <span class="rte-resize-marker-inner"></span>
                                </span>
                                <span class="rte-resize-bottom-right rte-resize-marker-outer">
                                    <span class="rte-resize-marker-inner"></span>
                                </span>
                            </div>`;
        this.resizeDiv = this.dom.querySelectorAll('.rte-resize-overlay-inner-div')[0];
        this.imageDOM = this.dom.querySelectorAll('img')[0];

        this.boundedShowResizePopover = this.showResizePopover.bind(this)
        this.boundedHideResizePopover = this.hideResizePopover.bind(this)

        this.dom.addEventListener('mouseover', this.boundedShowResizePopover)
        this.dom.addEventListener('mouseout', this.boundedHideResizePopover)

        this.boundedHandleMouseDownBottomRight = this.handleMouseDown.bind(this, true, true)
        this.boundedHandleMouseDownBottomLeft = this.handleMouseDown.bind(this, false, true)
        this.boundedHandleMouseDownTopRight = this.handleMouseDown.bind(this, true, false)
        this.boundedHandleMouseDownTopLeft = this.handleMouseDown.bind(this, false, false)

        this.resizeDiv.querySelectorAll('.rte-resize-bottom-right')[0].addEventListener('mousedown', this.boundedHandleMouseDownBottomRight)
        this.resizeDiv.querySelectorAll('.rte-resize-bottom-left')[0].addEventListener('mousedown', this.boundedHandleMouseDownBottomLeft)
        this.resizeDiv.querySelectorAll('.rte-resize-top-right')[0].addEventListener('mousedown', this.boundedHandleMouseDownTopRight)
        this.resizeDiv.querySelectorAll('.rte-resize-top-left')[0].addEventListener('mousedown', this.boundedHandleMouseDownTopLeft)
        
        this.setAttrs(node, options)
    }

    setAttrs(node, options) {

        // the below are the properties that we set, minWidth property is set by columnResizing plugin
        // tableBorderWidth is set by us.
        var attrs = node.attrs
        attrs.style = ''
        if(!node.attrs.width) {
            attrs.style = attrs.style + 'max-width: 100%;'
        }
        attrs.style = attrs.style + 'position: absolute; left: 0px; top: 0px;'
        
        if(node.attrs && node.attrs.extraAttrs) {
            // Note: for tables we can't do options.serializer.toDOM and here in table the second arguement is the attrs object that is manually set by us.
            // Also note that for table tag there would be separate toDOM in node definition of table feature, but that would be ignored
            // instead all the table node related stuffs will be done only in this node view, but rest of the things such as parseDOM, group, content, etc.
            // all these properties would be taken from node definition of table node only.
            attrs = options.serializer.image.setAttrs(node, attrs, options)
        } 
        
        // the toDOM logic should be writter by us, because in nodeView toDOM is our responsibility
        for(var key in attrs) {
            this.imageDOM.setAttribute(key, attrs[key])
        }

        this.dom.style.height = attrs.height + 'px';
        this.dom.style.width = attrs.width + 'px';
        this.resizeDiv.style.height = attrs.height + 'px';
        this.resizeDiv.style.width = attrs.width + 'px';
    }

    update(node) {
        if (node.type != this.node.type) {
            return false;
        }    
        this.node = node;
        this.setAttrs(node, this.options)
        return true;
    }

    showResizePopover() {
        this.resizeDiv.style.display = 'block';
    }

    hideResizePopover() {
        this.resizeDiv.style.display = 'none';
    }

    handleMouseMove(aspRatio, isGrowthOfXPositive, isGrowthOfYPositive, e) {
        // isGrowthOfXPositive and isGrowthOfYPositive are boolean flags
        // consider the user uses the bottom right resize handle, then the growth of x and y should be directly proportional
        // because if x grows then image's size should increase, similarly if y grows then also image's size should increase
        // but if user uses the top right resize handle, then the growth of x should be directly proportional and growth of y should be inversely proportional
        // because if x grows then image's size should increase, but if y grows then image's size should decrease
        // similarly apply same logic for bottom left and top left resize handles
        // inorder to specify this proportionality we are using isGrowthOfXPositive and isGrowthOfYPositive flags
        e.preventDefault()

        let end = { x: e.movementX, y: e.movementY }
        // e.movementX and e.movementY are the x and y units of movement of the mouse pointer relative to the last mousemove event.
        let newH, newW;
        
        if(!isGrowthOfXPositive) {
            end.x = -end.x
        }
        if(!isGrowthOfYPositive) {
            end.y = -end.y
        }

        // we take absolute values of x and y because we need to check which one is greater
        // if x is greater then we increase width and calculate height based on aspect ration
        // if y is greater then we increase height and calculate width based on aspect ratio
        if(Math.abs(end.x) > Math.abs(end.y)) {
            newW = Number(this.node.attrs.width) + end.x
            newH = newW / aspRatio
        } else {
            newH = Number(this.node.attrs.height) + end.y
            newW = newH * aspRatio
        }

        // if calculated height or width is less than the minimum height or width then we don't update
        if(newH < minHeight || newW < minWidth) {
            return
        }

        let imgPos = this.view.posAtDOM(this.imageDOM)

        let tr = this.view.state.tr
        let nodeType = this.view.state.schema.nodes.image
        tr = tr.setNodeMarkup(imgPos, nodeType, { ...this.node.attrs, height : newH, width: newW, fit: "best" })
        this.view.dispatch(tr)
    }

    handleMouseDown(isGrowthOfXPositive, isGrowthOfYPositive, e) {
        e.preventDefault()
        let aspRatio = this.node.attrs.originalWidth / this.node.attrs.originalHeight
        
        this.boundedHandleMouseMove = this.handleMouseMove.bind(this, aspRatio, isGrowthOfXPositive, isGrowthOfYPositive)
        this.boundedHandleMouseUp = this.handleMouseUp.bind(this)

        window.addEventListener('mousemove', this.boundedHandleMouseMove)
        window.addEventListener('mouseup', this.boundedHandleMouseUp)
    }

    handleMouseUp(e) {
        e.preventDefault()
        window.removeEventListener('mousemove', this.boundedHandleMouseMove)
        window.removeEventListener('mouseup', this.boundedHandleMouseUp)
    }

    destroy() {
        this.dom.removeEventListener('mouseover', this.boundedShowResizePopover)
        this.dom.removeEventListener('mouseout', this.boundedHideResizePopover)

        this.resizeDiv.querySelectorAll('.rte-resize-bottom-right')[0].removeEventListener('mousedown', this.boundedHandleMouseDownBottomRight)
        this.resizeDiv.querySelectorAll('.rte-resize-bottom-left')[0].removeEventListener('mousedown', this.boundedHandleMouseDownBottomLeft)
        this.resizeDiv.querySelectorAll('.rte-resize-top-right')[0].removeEventListener('mousedown', this.boundedHandleMouseDownTopRight)
        this.resizeDiv.querySelectorAll('.rte-resize-top-left')[0].removeEventListener('mousedown', this.boundedHandleMouseDownTopLeft)

        this.dom.remove()
    }
}