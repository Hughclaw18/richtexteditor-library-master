// construct options
var options = {
    content: customParser(getContent()),
    isHTMLContent: true,
    menubar: {
        position: 'bottom'
    },


    // formatting options to include
    formats: ["strong", "em", "underline", {name: "link", autodetect: true}],

    // document elements to include
    features: [
        {
            name: 'images',
            // useLoader: true,
            getImageUrl: function(file, blob, callback, errorCallback) {
                setTimeout(()=>{
                    // errorCallback("not supported format")
                    callback(blob)
                }, 1)
            }
        
            // url2blob: function(url, doneCallback, errorCallback) {
            //     setTimeout(() => {
            //         if(url === url1) {
            //             doneCallback(blob1)
            //         } else if(url === url2) {
            //             doneCallback(blob2)
            //         } else if(url === url3) {
            //             doneCallback(blob3)
            //         } else if(url === url4) {
            //             errorCallback("Invalid blob")
            //         } else {
            //             doneCallback(url)
            //         }
            //     }, 5000)
            // }

            // url2blobPlaceholder : `https://placebear.com/g/200/200` // try to put a base64 string so that image loads instantly as well as it works in online cases as well
        }, // inline-images
        {name: 'emoji', hasZomoji: false},
        'datafield',
        'video',
        'embed'
    ],

    className: 'ui-rte-editor-div outer-wrapper-container'

};

function customParser(htmlString) {

    // var div = document.createElement('div')
    // div.innerHTML = htmlString

    // to convert the div tag of images with caption node to span tag 
    // because that image special node in desk is represented as inline node, so we may get text along with that image special node wrapped inside a div tag
    // (representing a single p tag), but when making the migration attaching it to the secondDiv by setting secondDiv.innerHTML = htmlString, 
    // the browser thinks that image special div tag is a block node, so it separately puts outside the p tag(by this time our migration code would have converted
    // the div tag that is assumed to be a single paragraph as p tag), inorder to avoid this we need to convert that special image node div tag as span tag, so the 
    // browser would not put that special image node span tag outside the p tag

    // let imageWithCaptionDivTags = div.getElementsByClassName('KB_Editor_ImageDiscBdr')
    // for(let i = 0; i < imageWithCaptionDivTags.length; i++) {
    //     let span = document.createElement('span')
    //     let attributes = imageWithCaptionDivTags[i].attributes
    //     for(let attrCtr = 0; attrCtr < attributes.length; attrCtr++) {
    //         let name = attributes[attrCtr].name
    //         let value = attributes[attrCtr].value
    //         span.setAttribute(name, value)
    //     }
    //     span.innerHTML = imageWithCaptionDivTags[i].innerHTML
    //     imageWithCaptionDivTags[i].replaceWith(span)
    // }
    // htmlString = div.innerHTML

    var secondDiv = document.createElement('div')
    secondDiv.innerHTML = htmlString

    // remove all br tags if it is a leaf node and it is the last child of it's parent, else if we don't do this then for every br tag another br tag gets added in the view but not in the state.doc 
    var brTags = secondDiv.getElementsByTagName('br')
    for(let i=0; i<brTags.length;) {
        if(brTags[i].parentNode.lastChild === brTags[i] && !brTags[i].className.includes('rte-ignore-br')) {
            brTags[i].remove()
        } else {
            i++;
        }
    }

    // after processing htmlString, return it.
    return secondDiv.innerHTML

}

function getContent() {
    return `<div><b><i><u>dsadsa</u></i></b><br></div><div>dsaf <a href="ht` + `tp://dsafdfdsf" target="_blank">safds</a> dsa<br></div><div><div>fdsafdafd&nbsp;<img src="ht` + `tps://gc.localzoho.com/api/v1/gc/attachment/d8870e1a06f3b09f86f8ede72e40ee88b309d560eeda5cdb3f3fe9778bb0aa8e?orgId=61462059" style="padding: 0px; max-width: 100%; box-sizing: border-box; width: 56.25px; height: auto;" data-zdeskdocid="img_42866137121649484" class="docsimage" data-zdeskdocselectedclass="small">dsaf<br></div><div class="KB_Editor_ImageDiscBdr" contenteditable="false" id="desc_img_7532126927132041" style="margin: 20px; border-radius: 3px; border: 1px solid rgb(238, 238, 238); display: inline-block;"><img src="ht` + `tps://gc.localzoho.com/api/v1/gc/attachment/2c58138de0956ae6664c1f8365da594784ba31eeabfee6c4b89613bd479284b6?orgId=61462059" style="padding: 0px; max-width: 100%; box-sizing: border-box; width: 73px; height: auto;" data-zdeskdocid="img_7532126927132041" class="docsimage" data-zdeskdocselectedclass="small"><span class="colour" style="color:rgb(153, 153, 153)"><span class="inner">dsfd</span></span></div><div>&nbsp;dsds<br></div></div><div>&nbsp;😂&nbsp;<iframe allowfullscreen="" src="ht` + `tps://www.youtube.com/embed/XEzRZ35urlk" height="315" width="560"></iframe><br></div><div>asdsa<iframe allowfullscreen="" title="YouTube video player" src="ht` + `tps://www.youtube.com/embed/XEzRZ35urlk?si=Me85_wTFObNyynVE" height="315" width="560"></iframe><br></div><div>d fdsa fds af dsfdd<br></div><div>afd fda fdsa<br></div><div>fdsd&nbsp;<span style="display: inline" class="gc_global" contenteditable="false">&nbsp;@{globalObject.String}&nbsp;</span>&nbsp;dsdsd<span style="display: inline" class="gc_global" contenteditable="false">&nbsp;@{sa.validateVariable}&nbsp;</span>&nbsp;dsfd<br></div>`
}



RichTextEditor.registerElement({
    datafield: {
        addNodes: function(schema) {
            return schema.spec.nodes.append({
                datafield: {
                    atom: true,
                    group: 'inline',
                    inline: true,
                    attrs: {
                        id: '',
                        label: '',
                        meta: {
                            default: {}
                        }
                    },
                    toDOM: function(node) {
                        // Note: can return a DOM element too
                        return ['span', 
                        {
                            class: 'custom-field', 
                            dataFieldId: node.attrs.id, 
                            style: 'border: 1px solid #999; background-color: #f9f9f9; padding: 1px; border-radius: 2px;'
                        }, node.attrs.label]
                    }
                }
            })
        },

        registerCommand: function(view) {
            view.registerCommand({
                insertField: function(fieldAttrs) {
                    fieldAttrs = fieldAttrs ||{id: '101', label: 'Joe Lewis'} 
                    view.insertNode('datafield', fieldAttrs)
                }
            })
        }
    }
})

// init editor once dom content is ready
document.addEventListener('DOMContentLoaded', function() {
    RichTextEditor.onload.then(function() {
        window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), options);
    })
})