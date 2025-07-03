import { RTEComponents } from "../RichTextEditorView";
import { startImageUpload } from "../prosemirror-images"
import { defaultLinkRegex } from "../RTELink"
import RichTextEditor from "../RichTextEditor";

export default class ImageMenu {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.value = '';
        this.id = this.rteView.id + '-' + this.config.id;
        this.imgUrl = null;
        // the index i of blob array contains the base64 string of the file at index i in fileObject array.
        this.blobs = [] // initialize as array to support insertion of multiple images
        this.fileObjects = []
    }

    destroy() {
        RTEComponents.popover(`#popover-for-${this.id}`).destroy();
        this.rteView.options.root.querySelector(`#popover-for-${this.id}`).remove();
    }

    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
      
        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }

    getButtonHtml() {

        var html = `<button 
            type="button" class="rte-toolbar-btn" tabindex="-1" id="rte-toolbar-${this.id}" data-title-is-message-html-encoded="true" title="${this.config.name}">`
            + (this.config.isSVGIcon ? `<svg class="ui-rte-icon"><use xlink:href="#${this.config.icon}"></use></svg>` : `<i class="${this.config.icon} rte-font-icon-color"></i>`) +
        `</button>`

        return html;
    }

    getPopoverHtml() {
        return `
        <div id="popover-for-${this.id}" class="rte-image-menu-drop-down">
            <div class="zdialog-title"> ${RichTextEditor.i18n('common.INSERT_IMAGE')}</div>
            <div class="ui-flex-container ui-flex-wrap rte-image-radio ui-top-margin-xl">
                <input id="rte-image-upload-local-${this.id}" type="radio" name="rte-image-upload-radio-${this.id}" class="rte-uploadimage-opt" value="local" checked="checked">
                <label for="rte-image-upload-local-${this.id}" class="ui-right-margin-xl">${RichTextEditor.i18n('common.UPLOAD_FROM_DESKTOP')}</label>

                <input id="rte-image-upload-url-${this.id}" type="radio" name="rte-image-upload-radio-${this.id}" class="rte-url-opt" value="url" >
                <label for="rte-image-upload-url-${this.id}">${RichTextEditor.i18n('common.INSERT_USING_URL')}</label>

                <div class="ui-flex-container rte-upload-image-container rte-w-100 rte-ui-hide ui-top-margin-xl">
                    <input  type="file"
                        class="ui-rte-file"
                        accept="image/gif,image/jpg,image/jpeg,image/bmp,image/png,image/webp"
                        id="rte-image-upload-${this.id}" multiple>
                    <label class="zte-file-chooser rte-btn-secondary" for="rte-image-upload-${this.id}">${RichTextEditor.i18n('common.UPLOAD')}</label>
                    <label class="ui-flex-container ui-flex-jus-space-btwn zte-file-chooser-label rte-ui-hide">
                        <span>image-for-dummy.png</span>
                        <span>
                        </span>
                    </label>
                </div>
                <div class="ui-flex-container rte-url-container rte-w-100 rte-ui-hide ui-top-margin-xl">
                    <input type="text" class="rte-inputbox rte-w-100 ui-no-right-margin" id="rte-image-link-${this.id}" placeholder="${RichTextEditor.i18n('common.ENTER_URL_HERE')}" style="height: 28px"/>
                </div>
            </div>
            <div class="rte-label ui-top-margin-xl ui-bottom-margin-small">Size:</div>
            <div class="ui-flex-container rte-image-radio">
                <input id="rte-image-fit-small-fit-${this.id}" type="radio" name="rte-image-size-radio-${this.id}" value="small">
                <label for="rte-image-fit-small-fit-${this.id}" class="ui-right-margin-large">${RichTextEditor.i18n('common.SMALL_FIT')}</label>

                <input type="radio" id="rte-image-fit-best-fit-${this.id}" name="rte-image-size-radio-${this.id}" value="best" checked="checked">
                <label for="rte-image-fit-best-fit-${this.id}" class="ui-right-margin-large">${RichTextEditor.i18n('common.BEST_FIT')}</label>

                <input id="rte-image-fit-original-fit-${this.id}" type="radio" name="rte-image-size-radio-${this.id}" value="original">
                <label for="rte-image-fit-original-fit-${this.id}" class="ui-right-margin-large">${RichTextEditor.i18n('common.ORIGINAL_SIZE')}</label>

                <input id="rte-image-fit-fit-to-width-${this.id}" type="radio" name="rte-image-size-radio-${this.id}" value="fitToWidth">
                <label for="rte-image-fit-fit-to-width-${this.id}">${RichTextEditor.i18n('common.FIT_TO_PAGE')}</label>
            </div>
            <div class="ui-flex-container ui-flex-end rte-dialog-footer ui-rte-toggle-button">
                <div id="rte-image-upload-error"></div>
                <button type="button" id="rte-image-submit-${this.id}" class="rte-btn rte-btn-primary ui-right-margin-small" title="Insert" disabled="true">${RichTextEditor.i18n('common.INSERT')}</button>
                <button type="button" id="rte-image-cancel-${this.id}" class="rte-btn rte-btn-secondary" title="Cancel">${RichTextEditor.i18n('common.CANCEL')}</button>
            </div>
        </div>
        `
    }

    showPopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).open();
    }


    reset() {
        this.imgUrl = null;
        this.fileObjects = [];
        this.blobs = []
        this.popoverEl.querySelector(`#rte-image-upload-${this.id}`).value = ""
        this.popoverEl.querySelector(`#rte-image-submit-${this.id}`).setAttribute("disabled", "true")
        this.popoverEl.querySelector(`#rte-image-fit-best-fit-${this.id}`).checked = true
        this.popoverEl.querySelector(`#rte-image-upload-local-${this.id}`).checked = true
        this.popoverEl.querySelector(`#rte-image-link-${this.id}`).value = ""
        this.popoverEl.querySelector(`#rte-image-upload-error`).innerHTML = ""
    }

    submitImage(popoverEl) {

        var imgInsertType = popoverEl.querySelector("input[type=radio][name=rte-image-upload-radio-" + this.id + "]:checked").value//get the insertion method - whether upload it from local machine or upload it by providing url
        var fit = popoverEl.querySelector("input[type=radio][name=rte-image-size-radio-" + this.id + "]:checked").value //get the fit value that needs to be applied
        var self = this

        var src = imgInsertType === "url" ? this.imgUrl : this.blobs;
        var fileObject = imgInsertType === "local" ? this.fileObjects : {}

        // only images that are uploaded from local machine can support multiple image insertion at once,
        // images inserted using urls does not support mulitple image insertions at once.
        var sources;
        if(imgInsertType === 'local') {
            sources = this.fileObjects.map((file, index) => {
                return { src: src[index], file: file }
            })
        } else {
            sources = [{ src: src, file: fileObject }]
        }

        var promiseArray = sources.map(function(source) {
            return self.rteView.commands.insertImage(source.src, fit, source.file)
        })

        return Promise.all(promiseArray).then(function() {
            RTEComponents.popover(popoverEl).close()
            self.rteView.editorView.focus();
        }).catch(function(err) {
            popoverEl.querySelector(`#rte-image-upload-error`).innerHTML = err
        })

    }


    getImgOptions() {
        var options = this.rteView.options.features.filter(function(feature) {
            return feature.name === 'images'
        })[0]

        return options
    }

    checkValidityOfURL(popoverEl) {
        var url = popoverEl.querySelector(`#rte-image-link-${this.id}`).value
        var regExForUrl = defaultLinkRegex
        var isValidUrl = regExForUrl.test(url)

        if(isValidUrl) {
            this.imgUrl = url
            this.validationForEnablingSubmitButton(popoverEl)
        }
    }

    uploadImage(popoverEl, e) {

        var self = this;
        // e.target.files is an array kind of object but not exactly an array, as a result it does not have a forEach method on it's own
        // that is why we have created an array from e.target.files object and then called forEach method.
        Array.from(e.target.files).forEach((file) => {
            startImageUpload(this.rteView.editorView, file)
            .then(function(blob) {
                if (!blob) {
                    throw new Error('Invalid image input')
                    // throw new Error("Invalid image src returned from options.getImageUrl()")
                }
                // cache the generated src url
                self.blobs.push(blob);
                self.fileObjects.push(file)
                self.validationForEnablingSubmitButton(popoverEl)
            }).catch(function (err) {
                throw new Error(err);
            })
        })
    }

    validationForEnablingSubmitButton(popoverEl) {
        var imgInsertType = popoverEl.querySelector("input[type=radio][name=rte-image-upload-radio-" + this.id + "]:checked").value//get the insertion method - whether upload it from local machine or upload it by providing url
        var fit = popoverEl.querySelector("input[type=radio][name=rte-image-size-radio-" + this.id + "]:checked").value //get the fit value that needs to be applied
        var self = this
        var el = popoverEl.querySelector(`#rte-image-submit-${self.id}`)

        if(imgInsertType === "url" && this.imgUrl) {
            el.removeAttribute("disabled")
        } else if(imgInsertType === "local" && this.blobs.length > 0) {
            el.removeAttribute("disabled")
        } else {
            el.setAttribute("disabled", "true")
        }
    }


    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getButtonHtml();
        this.mount.innerHTML = html;

        var popoverEl = this.createElementFromHTML(this.getPopoverHtml())
        this.popoverEl = popoverEl
        this.rteView.menubar.mountCompContainer.append(this.popoverEl);
        var self = this;

        RTEComponents.popover(`#popover-for-${this.id}`, {
            forElement: `#rte-toolbar-${this.id}`,
            open: function(event, data) {
                setTimeout(function() {
                    popoverEl.querySelector(`#rte-image-upload-${self.id}`).focus()
                }, 200)
            },
            displayType: 'callout',
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            beforeclose: function(event, data) {
                self.reset()
            }
        });

        this.mount.querySelector(`#rte-toolbar-${this.id}`).addEventListener('click', function() {
            self.showPopover()
        })

        popoverEl.querySelector(`#rte-image-submit-${self.id}`).addEventListener('click', function() {
            self.submitImage(popoverEl)
        })

        popoverEl.querySelector(`#rte-image-upload-${self.id}`).addEventListener('change', function(e) {
            self.blobs = [] //whenever choose image button is clicked set the blob value to null and then call uploadImage() because ,
            // consider a case where choose image is clicked previously and insert button is not clicked , now choose image is again clicked, at this instance the insert button should be disabled because new image's blob is not yet available
            self.fileObjects = []
            self.validationForEnablingSubmitButton(popoverEl)
            self.uploadImage(popoverEl, e)
        })

        popoverEl.querySelector(`#rte-image-cancel-${self.id}`).addEventListener('click', function() {
            self.reset();    
            RTEComponents.popover(popoverEl).close()
            self.rteView.editorView.focus();
        })

        popoverEl.querySelector(`#rte-image-link-${self.id}`).addEventListener('keyup', function(e) {
            self.checkValidityOfURL(popoverEl)
        })

        popoverEl.querySelector(`#rte-image-upload-local-${self.id}`).addEventListener('change', function(e) {
            self.validationForEnablingSubmitButton(popoverEl)
        })

        popoverEl.querySelector(`#rte-image-upload-url-${self.id}`).addEventListener('change', function(e) {
            self.validationForEnablingSubmitButton(popoverEl)
        })

    }
}