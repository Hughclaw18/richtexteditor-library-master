function getEmbedAttributes(dom) {
    var id ="rte-embed-" + (Math.floor(Math.random() * 1000) + 1);
    
    if(dom.tagName === 'IFRAME' && dom.getAttribute("data-rte-type-video") !== "") {
        var iframeString = dom.outerHTML
    } else {
        var src = dom.getAttribute("src");
        var alt = dom.getAttribute("alt");
        var height = dom.getAttribute("height") || parseInt(dom.style.height)
        var width = dom.getAttribute("width") || parseInt(dom.style.width)
    }
    
    return { src, alt, id, height, width, iframeString }
}

// the iframe string will be put inside the insert embed code popover, whereas only the src of the embed video or normal video will be put in the insert video
// popover, so how to differentiate these two types by only having the same node underneath?
// more basically why should we need to differentiate? Assume the below case:
// a video is inserted through insert video popover, if he does right click on the node, or else after selecting the node if he opens the insert video
// popover we need to populate the src of the video there, but if he opens the insert embed code popover we should'nt populate any data there because this
// video is inserted through insert video popover, so this is the reason why we need to have a differentating attribute.
// the differentiating attribute used here will be "data-rte-type-video"

// TODO: While giving a feature to upload videos from the local system or through cloud services use a different type of node say video node
// there put the video src in a video tag instead of iframe tag and put the controls attribute so that the browser would load the video player.
// for that case alone have a rightClick menu where on rightclicking a video node a right click menu pops up and show options such as 
// edit video, remove video, etc. For embed node don't have right click menu because, since we put the embed code inside iframe tag
// rightclicking on iframe tag will not throw the 'contextmenu' DOM event, that is why don't have right clkick menu for embed menu.

export const embed = {
    inline: true,
    selectable: true,
    attrs: {
        src: {default: null},
        iframeString: {default: null},
        alt: {default: null},
        id: {default: null},
        width: {default: null},
        height: {default: null}
    },
    group: "inline",
    draggable: false,
    atom : true,
    parseDOM: [{
            tag: "video[src]", 
            getAttrs: getEmbedAttributes
        }, {
            tag: "iframe[src]",
            getAttrs: getEmbedAttributes
        }
    ],
    toDOM(node) { 
        let { src, alt, id, width, height, iframeString } = node.attrs;

        if(iframeString) {
            let div = document.createElement('div')
            div.innerHTML = iframeString
            let iframeEle = div.getElementsByTagName('iframe')[0]
            
            iframeEle.setAttribute('id', id)
            iframeEle.style.setProperty('border', '0px')
            return iframeEle
        } else {
            let styleForIframe = `border: 0px; `
            if(height) {
                styleForIframe += `height: ` + height + `px; `
            }
            if(width) {
                styleForIframe += `width: ` + width + `px; `
            }
            // this "data-rte-type-video" is the differentiating attribute to know that it is inserted through insert video popover
            // if it is inserted through insert embed code popover then it would not have this attribute
            return["iframe", { alt, id, src, "data-rte-type-video": "", style: styleForIframe }]
        }
    }
}