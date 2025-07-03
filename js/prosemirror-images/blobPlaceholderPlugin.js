/* $Id$ */

import { Plugin, PluginKey } from 'prosemirror-state'; // no i18n
import { Decoration, DecorationSet } from 'prosemirror-view'; // no i18n
import { getFeatureConfigFromOpts } from "../RichTextEditorView"

var getImageNodesInDoc = function(doc) {
    // try to optimise it because for every tr that is passed we are iterating through all nodes in doc
    // instead we can iterate through all nodes in doc only during initialisation and post that if any tr consists of addition of an image then we can run
    // the url2Blob function on that image node alone.
    var nodes = [];
    doc.descendants((n, pos) => {
        if (n.type.name === 'image') {
            nodes.push({node: n, pos: pos})
        }
    })

    return nodes;
}

var arrayDiff = function(oldArr, newArr) {
    var deletions = oldArr.filter(n => !newArr.includes(n))
    var additions = newArr.filter(n => !oldArr.includes(n))
    var retains = newArr.filter(n => oldArr.includes(n))
    return {additions, deletions, retains}
}

var promiseFunction = function(accept, reject, imageOptions, image) {
    imageOptions.url2blob && imageOptions.url2blob(image.node.attrs.src,
        function(blob) {
            blob ?
                accept({url: image.node.attrs.src, blob: blob, id: image.node.attrs.id})
                : 
                accept({url: image.node.attrs.src, id: image.node.attrs.id, blob: image.node.attrs.src})
        },
        function(errString) {
            reject(errString)
        }
    )
}

var iteratePromisesAndAttachThen = function(promises, rteView) {
    promises.forEach((pr) => {
        pr.then((image) => {
            var transaction = rteView.editorView.state.tr.setMeta('loadedImage', image); //no i18n
            rteView.editorView.dispatch(transaction)
        }).catch((err) => {
            // need to handle the error
            // console.log(err)
        })
    })
}

/**
 * @param {JSONObject} opts
 * @returns {Plugin}
 */
export function getBlobPlaceholderPlugin(rteView) {

    return new Plugin({
        key: new PluginKey('asyncUrl2BlobLoading'), // no i18n

        state: {
            init(config, state) {

                var imagesInDoc = getImageNodesInDoc(state.doc)
                var imageOptions = getFeatureConfigFromOpts('images', rteView.options)
                if(imagesInDoc.length) {
                    var promises = imagesInDoc.map(image => {
                        return new Promise(function(accept, reject) {
                            promiseFunction(accept, reject, imageOptions, image)
                        })
                    })

                    iteratePromisesAndAttachThen(promises, rteView)
                }

                var decorations = imagesInDoc.map(n => {
                    if(imageOptions.url2blobPlaceholder) {
                        return Decoration.node(n.pos, n.pos+1, {loading: true, src: imageOptions.url2blobPlaceholder}, {url: n.node.attrs.src, id: n.node.attrs.id})
                    } else {
                        return Decoration.node(n.pos, n.pos+1, {loading: true}, {url: n.node.attrs.src, id: n.node.attrs.id})
                    }
                })

                return {decorations: decorations}
            },

            apply(tr, pluginState, oldState, newState) {
                if (tr.getMeta('loadedImage')) {
                    var loadedImage = tr.getMeta('loadedImage');

                    // return new decoration set with modified src as blobs
                    var decorations = [];
                    pluginState.decorations.forEach(d => {
                        if(loadedImage.id === d.spec.id) {
                            var decoration = Decoration.node(d.from, d.to, {loading: false, src: loadedImage.blob || loadedImage.url}, d.spec)
                            decorations.push(decoration)
                        } else {
                            decorations.push(d)
                        }
                    })

                    return {decorations: decorations}

                } else {
                    // get image diff
                    var imagesInOlddoc = getImageNodesInDoc(oldState.doc)
                    var imagesInNewDoc = getImageNodesInDoc(newState.doc)
                    var diff = arrayDiff(imagesInOlddoc.map(n => n.node.attrs.id), imagesInNewDoc.map(n => n.node.attrs.id))
                    var addedImages = imagesInNewDoc.filter(image => diff.additions.includes(image.node.attrs.id))
                    var imageOptions = getFeatureConfigFromOpts('images', rteView.options);

                    if (addedImages.length) {
                        var promises = addedImages.map(image => {
                            return new Promise(function(accept, reject) {
                                promiseFunction(accept, reject, imageOptions, image)
                            })
                        })

                        iteratePromisesAndAttachThen(promises, rteView)
                    }

                    var decorations = imagesInNewDoc.map(n => {
                        var decoration = pluginState.decorations.find(d => d.spec.id === n.node.attrs.id);
                        if (!decoration) { // it is a newly added image
                            if(imageOptions.url2blobPlaceholder) {
                                return Decoration.node(n.pos, n.pos+1, {loading: true, src: imageOptions.url2blobPlaceholder}, {url: n.node.attrs.src, id: n.node.attrs.id})
                            } else {
                                return Decoration.node(n.pos, n.pos+1, {loading: true}, {url: n.node.attrs.src, id: n.node.attrs.id})
                            }
                        } else {
                            return Decoration.node(n.pos, n.pos+1, decoration.type.attrs, decoration.spec)
                        }
                    })

                    return {decorations: decorations}
                }
            }
        },

        props: {
            decorations(editorState) {
                const state = this.getState(editorState);
                return DecorationSet.create(editorState.doc, [...state.decorations]);
            }
        }
    });
}
