export const image = {
    inline: true,
    attrs: {
        src: {},
        alt: { default: null },
        height: {default: null },//image height that is being rendered in the DOM
        width: {default: null },//image width that is being rendered in the DOM
        originalHeight: {default: null },//original height of the image
        originalWidth: {default: null },//original width of the image
        fit: {default: null },//to tell which fit is currently being applied
        id: {default: null}
    },
    group: "inline",
    draggable: false,
    atom : true,
    parseDOM: [{
        tag: "img[src]", 
        getAttrs: function(dom) {
            let id ="rte-img-" + (Math.floor(Math.random() * 1000) + 1);
            let height = dom.style.height || dom.getAttribute("height");
            let width = dom.style.width || dom.getAttribute("width");
            let fit = dom.getAttribute("fit")||"original";
            let src = dom.getAttribute("src");
            let alt = dom.getAttribute("alt");
            if(dom.getAttribute("originalHeight")) { // this will be true when image is copied and pasted within the RTE
                let originalHeight = dom.getAttribute("originalHeight");
                let originalWidth = dom.getAttribute("originalWidth")
                return { src, alt, originalHeight, originalWidth, height, width, id, fit}
            } else { //this will be executed if image is copied from outside of RTE, since we will not have the value for originalHeight attribute
                return { src, alt, height, width, id, fit }
            }
            
        }
    }],
    toDOM(node) { 
        let { src, alt, height, width, originalHeight, originalWidth, fit, id } = node.attrs; 
        if(width) {
            return ["img", { src, alt, height, width, originalHeight, originalWidth, fit, id }] 
        } else {
            return ["img", { src, alt, height, width, originalHeight, originalWidth, fit, id, style: 'max-width: 100%;'}] 
        }
    }
} 