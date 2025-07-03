import { embed } from "./embedNode"
import { getEmbedVdoUrls } from "./embedVideoURLProcessing"

/**
 * Note: While inserting embed don't  calculate height, width, etc nor don't give options such as small fit, best fit, fit to width, etc
 * The problem with height and width is that, if we fix height and width as constants such as 500px x 300px , then in smaller screens it wld be abrupt, if we set max-width and max-height the iframe tag does not respect those values instead it sets default width and height values as 300px x 150px.
 * If we give small fit, best fit options then we need calculate the dimensions of each fit for different size screens, this makes the code complex and it invloves lot of calculations.
 * These worked well for images because in images we initially obtained the dimensions of the image by placing it in the dom as an invisible element and then calculated it's dimensions and then removed that element from the dom, this can't be done for videos.
 * So the solution is to give resizing(dragging the embed inorder to make it small or big) option for the customers using the drag event.
 */
export function insertVideo(rteView, attrs, opts) {
    if (attrs.src) {
        let view = rteView.editorView

        attrs.id = "rte-embed-" + (Math.floor(Math.random() * 1000) + 1)

        attrs.src = preProcessEmbedSource(attrs.src)
        if(!attrs.width) {
            attrs.width = Math.round(0.8 * rteView.editorView.dom.clientWidth) // 0.8 represents 80%, we want the embed videos to have a width of 80% of RTE width
        }
        if(!attrs.height) {
            attrs.height = Math.round(attrs.width * 0.5625) // 0.5625 represents 56.25 aspect ratio - this is the standard aspect ratio for youtube videos, but we use the same aspect ratio for all the embed videos
        }
        if(opts && opts.extraAttrs) {
            attrs.extraAttrs = opts.extraAttrs
        }

        let embedNode = view.state.schema.nodes.embed.create(attrs)
        var tr = view.state.tr
        tr.insert(view.state.selection.$from.pos, embedNode)
        view.dispatch(tr)
    } else {
        throw new Error("Video src not found")
    }
}

export function editVideo(rteView, attrs, opts) {
    let view = rteView.editorView
    let tr = view.state.tr
    let selectedNode = view.state.selection.node
    if(!selectedNode || selectedNode.type.name !== 'embed' || !selectedNode.attrs.src) {
        throw new Error("Selected node is not a video node")
    }
    let pos = view.state.selection.$from.pos

    if(attrs.src) {
        attrs.src = preProcessEmbedSource(attrs.src)
    }

    if(opts && opts.extraAttrs) {
        tr.setNodeMarkup(pos, selectedNode.type, {
            ...selectedNode.attrs,
            src: attrs.src ? attrs.src : selectedNode.attrs.src, 
            height: attrs.height? attrs.height : selectedNode.attrs.height,
            width: attrs.width ? attrs.width : selectedNode.attrs.width,
            alt: attrs.alt ? attrs.alt : selectedNode.attrs.alt,
            extraAttrs: opts.extraAttrs
        }, selectedNode.marks)
    } else {
        tr.setNodeMarkup(pos, selectedNode.type, {
            ...selectedNode.attrs,
            src: attrs.src ? attrs.src : selectedNode.attrs.src, 
            height: attrs.height? attrs.height : selectedNode.attrs.height,
            width: attrs.width ? attrs.width : selectedNode.attrs.width,
            alt: attrs.alt ? attrs.alt : selectedNode.attrs.alt
        }, selectedNode.marks)
    }

    view.dispatch(tr)
}

export function removeVideo(rteView) {

    var view = rteView.editorView
    var from = view.state.selection.$from.pos
    var to = view.state.selection.$to.pos
    var tr = view.state.tr

    view.dispatch(tr.deleteRange(from, to))
}

export function insertEmbed(rteView, attrs, opts) {
    if (attrs.iframeString) {

        let div = document.createElement('div')
        div.innerHTML = attrs.iframeString
        let iframeEle = div.getElementsByTagName('iframe')[0]

        if(iframeEle) {
            iframeEle.innerHTML = '' // sometimes script tags can be injected inside iframe tags before appending it to dom, inorder to avoid this explicitly
            // set iframe tag's innerHTML as empty string.
            attrs.iframeString = div.innerHTML
        } else {
            throw new Error("Invalid iframe string")
        }

        let view = rteView.editorView
        attrs.id = "rte-embed-" + (Math.floor(Math.random() * 1000) + 1)

        if(opts && opts.extraAttrs) {
            attrs.extraAttrs = opts.extraAttrs
        }

        let embedNode = view.state.schema.nodes.embed.create(attrs)
        var tr = view.state.tr
        tr.insert(view.state.selection.$from.pos, embedNode)
        view.dispatch(tr)
    } else {
        throw new Error("Embed string not found")
    }
}

export function editEmbed(rteView, iframeString, opts) {
    let view = rteView.editorView
    let tr = view.state.tr
    let selectedNode = view.state.selection.node
    if(!selectedNode || selectedNode.type.name !== 'embed' || !selectedNode.attrs.iframeString) {
        throw new Error("Selected node is not a embed node")
    }
    let pos = view.state.selection.$from.pos

    if(opts && opts.extraAttrs) {
        tr.setNodeMarkup(pos, selectedNode.type, {...selectedNode.attrs, iframeString,  extraAttrs: opts.extraAttrs}, selectedNode.marks)
    } else {
        tr.setNodeMarkup(pos, selectedNode.type, {...selectedNode.attrs, iframeString}, selectedNode.marks)
    }

    view.dispatch(tr)
}

export function removeEmbed(rteView) {

    var view = rteView.editorView
    var from = view.state.selection.$from.pos
    var to = view.state.selection.$to.pos
    var tr = view.state.tr

    view.dispatch(tr.deleteRange(from, to))
}

export function addEmbedNodes(nodes) {
    return nodes.append({
        embed
    });
};

function preProcessEmbedSource(source) {
    let embedPropertiesChecklist = getEmbedVdoUrls()
    embedPropertiesChecklist.forEach((itm)=>{
        if(itm.regex.test(source)) {

            //Sample test case :
            //Input : "https://www.youtube.com/embed/$2"
            //Output: "https://www.youtube.com/embed/1gFnLnUsq4s"
            //Replace $2 with the id of the embed, the id will be present in 2nd index of the match object obtained from the regex match

            let match = itm.regex.exec(source)
            let dollarIndex = itm.url.indexOf("$")
            let embedId = match[itm.url.charAt(dollarIndex+1)]
            let toBeReplacedString = itm.url.substring(dollarIndex, dollarIndex+2)
            source = itm.url.replace(toBeReplacedString, embedId)
        }
    })

    return source
}