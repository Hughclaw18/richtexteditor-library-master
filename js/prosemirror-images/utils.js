import { image } from "./imageNode"
import { getFeatureConfigFromOpts } from "../RichTextEditorView"

function uploadFile(view, file) {

    let reader = new FileReader()
    return new Promise((accept, fail) => {

        reader.onload = (e) => {
            accept(reader.result )
        }

        reader.onerror = () => fail(reader.error)

        //to convert the file into base64 string
        reader.readAsDataURL(file)
    })

}

export async function startImageUpload(view, file) {
    try {
        var blob= await uploadFile(view, file)
    } catch (ex) {
        throw new Error("Exception when reading file content from uploaded file")
    }    
    
    if (!blob) {
        throw new Error("Possible empty/corrupted file")
    }

    return blob;
}

export function calculateDimensions(view, fit, height, width) {

    var config = getFeatureConfigFromOpts("images", view.rteView.options)
    if(config && config.getHeightAndWidth) {
        return config.getHeightAndWidth(view, fit, height, width)
    }

    var ele = window.getComputedStyle(view.dom, null)//get the computed style of the RTE

    //inorder to get the accurate RTE dimensions we need to subtract all paddings, margins and borders from computed style.
    var screenWidth = view.dom.clientWidth - parseFloat(ele.paddingLeft) - parseFloat(ele.paddingRight) - parseFloat(ele.marginLeft) - parseFloat(ele.marginRight) - parseFloat(ele.borderLeftWidth) - parseFloat(ele.borderRightWidth);

    // var screenHeight = view.dom.clientHeight - parseFloat(ele.paddingTop) - parseFloat(ele.paddingBottom) - parseFloat(ele.marginTop) - parseFloat(ele.marginBottom) - parseFloat(ele.borderTopWidth) - parseFloat(ele.borderBottomWidth);

    var originalHeight = height
    var originalWidth = width;

    var SMALL_FIT_WIDTH_RATIO = 0.15
    var BEST_FIT_WIDTH_RATIO = 0.30

    /**For smallFit: Calculate 15% of the screen width then:
     * 
     * Case 1: if the computed value < original width of the image:
     * let width = computed value
     * let height = (originalHeight / originalWidth ) * width (inorder to maintain the aspect ration)
     * 
     * Case 2: if the computed value > original width of the image:
     * let width = originalWdith
     * let height = originalHeight
     */
    if (fit === "small") {
        var threshHoldValue = (SMALL_FIT_WIDTH_RATIO * screenWidth)
        if (threshHoldValue > originalWidth) {
            width = originalWidth
            height = originalHeight
        }
        else {
            width = threshHoldValue
            height = (originalHeight / originalWidth) * width
        }
    }
    /**For bestFit: Calculate 30% of the screen width then:
     * 
     * Case 1: if the computed value < original width of the image:
     * let width = computed value
     * let height = (originalHeight / originalWidth ) * width (inorder to maintain the aspect ration)
     * 
     * Case 2: if the computed value > original width of the image:
     * let width = originalWdith
     * let height = originalHeight
     */
    else if (fit === "best") {
        var threshHoldValue = (BEST_FIT_WIDTH_RATIO * screenWidth)
        if (threshHoldValue > originalWidth) {
            width = originalWidth
            height = originalHeight
        }
        else {
            width = threshHoldValue
            height = (originalHeight / originalWidth) * width
        }
    }
    /**For fitToWidth: Calculate screen width then:
     * 
     * let width = screenWdith
     * let height = (originalHeight / originalWidth ) * width (inorder to maintain the aspect ration)
     */
    else if (fit === "fitToWidth") {
        width = screenWidth
        height = (originalHeight / originalWidth) * width
    }
    //For original width: keep the dimensions as it is
    else {
        width = originalWidth;
        height = originalHeight;
    }
    return { height, width }
}

function setImageSrcAndCalculateDimensions(image, src, accept, fail, fit, view) {
    image.src = src;

    image.onload = function () { //only after the image is loaded we can get the original dimensions of the image
        var { height, width } = calculateDimensions(view, fit, image.height, image.width)
        accept({height, width, originalHeight: image.height, originalWidth: image.width})
    }

    image.onerror = () => fail(image.error)
}


export function setHeightAndWidth(rteView, fit, src) {
    var view = rteView.editorView
    return new Promise((accept, fail) => {

        var image = new Image();

        var config = getFeatureConfigFromOpts('images', rteView.options)

        if(config.useLoader) { // for mobile case inorder to find height and width of images send url and get blob
            // and then caluclate height and width using that blob
            let p = new Promise((blobRecievedCB, blobFailedCB) => {
                config.url2blob(src, blobRecievedCB, blobFailedCB)
            })

            p.then((blob) => {
                setImageSrcAndCalculateDimensions(image, blob, accept, fail, fit, view)
            }).catch(function(err) {
                fail("Url to blob conversion failed for image: " + err)
            })
        } else { // for web case directly use image url to calculate height and width
            setImageSrcAndCalculateDimensions(image, src, accept, fail, fit, view)
        }
    })
}

export function addImage(view, img) {
    if (img.src) {
        // add id, if missing
        img.id = img.id || "rte-img-" + (Math.floor(Math.random() * 1000) + 1)
        let tr = view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create(img))
        // let tr1 = tr.insertText(" ") // if a space needs to be added after an image is inserted then uncomment this line and dispatch tr1.scrollIntoView() instead of tr.scrollIntoView()
        view.dispatch(tr.scrollIntoView())
    }
}

export function addImagesNodes(nodes) {
    return nodes.append({
        image
    });
};

export function uploadImageCommand(rteView, url, fit, file, alt, opts) {
    var fit = fit || 'best' // by default set fit as bestFit
    var file = file || {}   

    var config = getFeatureConfigFromOpts('images', rteView.options);

    var p = new Promise(function(accept, reject) {
        if(config && config.getImageUrl) {
            config.getImageUrl(file, url, function(src) {
                accept(src)
            },function(invalid) {
                reject(invalid)
            })
        } else {
            accept(url)
        }
    })

    var newPromise = p.then(function(src){
        if (!src) {
            throw new Error("Possible empty/corrupted file ")
        }
    
        return setHeightAndWidth(rteView, fit, src).then(function({height, width, originalHeight, originalWidth}) {
            if(opts && opts.extraAttrs) {
                addImage(rteView.editorView, {
                    src, fit, height, width, originalHeight, originalWidth, alt, extraAttrs: opts.extraAttrs
                })
            } else {
                addImage(rteView.editorView, {
                    src, fit, height, width, originalHeight, originalWidth, alt
                })
            }
        }).catch(function(err) {
            throw new Error("Image insertion failed with error: " + err)
        })
    }).catch(function(errorMsg) {
        throw new Error(errorMsg)
    })

    return newPromise;

}

export function updateImageFit(rteView, imgFit, opts) {

    var pos=rteView.editorView.state.selection.$from.pos
    var { attrs } = rteView.editorView.state.doc.nodeAt(pos)

    var { originalHeight, originalWidth, id } = attrs

    if( !originalHeight && !originalWidth ) {
        let imgElement = rteView.editorView.dom.querySelector("#" + id)
        originalHeight = imgElement.naturalHeight
        originalWidth = imgElement.naturalWidth
    }

    var { height, width } = calculateDimensions(rteView.editorView, imgFit, originalHeight, originalWidth)

    if(opts && opts.extraAttrs) {
        var tr = rteView.editorView.state.tr.setNodeMarkup(pos, null, { 
            ...attrs, height, width, fit: imgFit, originalHeight, originalWidth, extraAttrs: opts.extraAttrs
        })
    } else {
        var tr = rteView.editorView.state.tr.setNodeMarkup(pos, null, { ...attrs, height, width, fit: imgFit, originalHeight, originalWidth })
    }

    rteView.editorView.dispatch(tr.scrollIntoView())
}

export function copyImage(rteView) {

    var pos=rteView.editorView.state.selection.$from.pos
    var { attrs } = rteView.editorView.state.doc.nodeAt(pos)
    var { id } = attrs
    let imgElement = rteView.editorView.dom.querySelector("#" + id)//get the image tag

    var selection = window.getSelection();
    var range = document.createRange();

    range.selectNodeContents(imgElement);//set the range to the selected image
    selection.removeAllRanges();//Once the rightContextMenu pops up and after that if we click the copy image option then the window.selection will get changed to the "copy image" text which appears on the rightContextMenu... so we need to first remove the already selected range and replace it with the selected range as imgElement
    selection.addRange(range);
    document.execCommand("copy")
    
}

export function removeImage(rteView) {

    var view = rteView.editorView
    var from = view.state.selection.$from.pos
    var to = view.state.selection.$to.pos
    var tr = view.state.tr

    view.dispatch(tr.deleteRange(from, to))
}

export const FIT = { SMALL: "small", BEST: "best", ORIGINAL: "original", FIT_TO_WIDTH: "fitToWidth" }