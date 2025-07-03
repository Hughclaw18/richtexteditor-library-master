import { RTEComponents, getFeatureConfigFromOpts } from "../RichTextEditorView";
import RichTextEditor from "../RichTextEditor";
import { defaultLinkRegex } from "../RTELink"

export default class LinkMenu {

    constructor(config, rteView, mount) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.value = '';

        this.id = this.rteView.id + '-' + this.config.id;

        this.rteView.registerShortcut && this.rteView.registerShortcut("Mod-k", this.showPopover.bind(this))
        // this.rteView.registerShortcut("Mod-k", this.showPopover.bind(this))
        this.rteView.menubar.openLinkPopover = this.showPopover.bind(this)
        this.isAnchorNeeded = this.rteView.getFeatureConfig('link').anchor
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

    actionCallback(text, link) {
        if (!link) { return }

        if(text) {
            this.rteView.commands.addLinkWithText(link, text)
        } else {
            this.rteView.commands.addLink(link)
        }

        this.resetLinkDialog()
        this.closePopover()
    }

    getButtonHtml() {

        var html = `<button 
            type="button" class="rte-toolbar-btn" tabindex="-1" id="rte-toolbar-${this.id}" data-title-is-message-html-encoded="true" title="${this.config.name}">`
            + (this.config.isSVGIcon ? `<svg class="ui-rte-icon"><use xlink:href="#${this.config.icon}"></use></svg>` : `<i class="${this.config.icon} rte-font-icon-color"></i>`) +
        `</button>`

        return html;
    }

    getAnchorDropdownHtml() {
        return `
        <div id="menu-for-${this.id}" class="rte-anchor-dropdown-container">
        </div>
        `
    }

    getPopoverHtml() {
        return `<div id="popover-for-${this.id}" class="rte-link-popover rte-popover">
            <div class="zdialog-title ui-bottom-margin-big">${RichTextEditor.i18n('common.INSERT_LINK')}</div>
            <div class="ui-block-container ui-bottom-margin-medium ui-flex-space-between">
                <label class="rte-label rte-link-label ui-right-margin-large">${RichTextEditor.i18n('common.ENTER_A_TEXT')}</label>
                <input placeholder="${RichTextEditor.i18n('common.ENTER_A_TEXT')}" id="add-link-text-input-${this.id}" class="rte-inputbox rte-link-input-box" type="text"></input>
            </div>
            <div class="ui-block-container ui-bottom-margin-medium ui-flex-space-between">
                <label class="rte-label rte-link-label">${RichTextEditor.i18n('common.URL')}<span class="ui-rte-red-text"><sup>*</sup></span></label>
                <input placeholder="https://zoho.com/" id="add-link-input-${this.id}" class="rte-inputbox rte-link-input-box" type="text"></input>
            </div>
            ${this.isAnchorNeeded ?
                `<div class="ui-block-container ui-flex-space-between">
                    <label class="rte-label rte-link-label rte-anchor-label">${RichTextEditor.i18n('common.ANCHOR')}</label>
                    <button type="button" class="state-button rte-link-input-box rte-anchor-dropdown-btn" id="button-for-${this.id}" data-menu-id="menu-for-${this.id}">
                </div>`
                :
                ``
            }
            <div class="ui-flex-container ui-flex-end rte-dialog-footer-video">    
                <button type="button" class="rte-btn rte-btn-primary ui-right-margin-medium" id="add-link-btn-${this.id}"  disabled="true"">${RichTextEditor.i18n('common.INSERT')} </button>
                <button type="button" class="rte-btn rte-btn-secondary" id="add-link-cancel-btn-${this.id}">${RichTextEditor.i18n('common.CANCEL')}</button>
            </div>
        </div>`
    }

    getAllAnchorNodesInDoc() {
        var anchorNodeType = this.rteView.editorView.state.schema.nodes.anchor
        var docNode = this.rteView.editorView.state.doc
        return RichTextEditor.PMExports.prosemirrorUtils.findChildrenByType(docNode, anchorNodeType)
    }

    showPopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).open();
    }

    closePopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).close()
    }

    resetLinkDialog() {
        var textInput = this.popoverEl.querySelector(`#add-link-text-input-${this.id}`)
        var linkInput = this.popoverEl.querySelector(`#add-link-input-${this.id}`)
        linkInput.value = ''
        textInput.value = ''
        this.isAnchorNeeded && this.resetAnchorInput()

        textInput.focus()
        this.popoverEl.querySelector(`#add-link-btn-${this.id}`).setAttribute('disabled', 'true')
    }

    resetAnchorInput() {
        // remove all items and add only none option
        RTEComponents.menu('#menu-for-'+this.id).removeMenuItems()
        RTEComponents.menu('#menu-for-'+this.id).addMenuItem(this.noneOption)
        this.updateSelection(this.defaultAnchorId)
    }

    updateSelection(optionId) {
        if(optionId === this.defaultAnchorId) {
            RTEComponents.menubutton('#button-for-'+this.id).setAttribute('text', this.defaultAnchorName) // if we set id then the button text becomes
            // "anchor-none", this looks a bit abrupt, that is why we setting name which would set the button text as "None"
        } else {
            RTEComponents.menubutton('#button-for-'+this.id).setAttribute('text', optionId) // since id and name are same in menu options
            // we are setting the text as id, but if this assumption breaks, then we need to change this
        }
    }

    onItemClicked(optionId) {
        this.updateSelection(optionId);
        var popoverEl = this.popoverEl
        var linkInput = popoverEl.querySelector(`#add-link-input-${this.id}`)
        var textInput = popoverEl.querySelector(`#add-link-text-input-${this.id}`)
        if(optionId !== this.defaultAnchorId) {
            linkInput.value = '#' + optionId
            if(!textInput.value) {
                textInput.value = optionId
            }
        }
        this.validateAddLinkButton()
    }

    addOptsToAnchorInput() {
        var self = this

        var anchorNodes = this.getAllAnchorNodesInDoc()
        anchorNodes.forEach((obj) => {
            let node = obj.node
            let menuOption = {
                id: node.attrs.id,
                label: node.attrs.id,
                size: 'mini'
            }
    
            RTEComponents.menu('#menu-for-'+self.id).addMenuItem(menuOption)
        })
    }

    enableAddLinkButton() {
        var linkButton = this.popoverEl.querySelector(`#add-link-btn-${this.id}`)
        linkButton.removeAttribute('disabled')
    }

    validateAddLinkButton() {
        var linkOptions = getFeatureConfigFromOpts('link', this.rteView.options)
        var regex = linkOptions.regex || defaultLinkRegex

        var linkInput = this.popoverEl.querySelector(`#add-link-input-${this.id}`)
        var linkButton = this.popoverEl.querySelector(`#add-link-btn-${this.id}`)
        if(regex.test(linkInput.value) || (linkInput.value && linkInput.value.startsWith('#'))) {
            linkButton.removeAttribute('disabled')
        } else {
            linkButton.setAttribute('disabled', 'true')
        }
    }

    renderAnchorDropdown() {

        this.defaultAnchorName = RichTextEditor.i18n('common.NONE')
        this.defaultAnchorId = 'anchor-none'

        var menuhtml = this.getAnchorDropdownHtml();
        this.rteView.menubar.mountCompContainer.append(this.createElementFromHTML(menuhtml));
        var self = this;

        RTEComponents.menu('#menu-for-'+this.id, {
            forElement: "#button-for-"+this.id,
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            itemclick: function( event, data ) {
                self.onItemClicked(data.data.id)
            },
            size: 'mini'
        })

        var noneOption = {
            id: this.defaultAnchorId,
            label: this.defaultAnchorName,
            checked: true,
            size: 'mini'
        }

        this.noneOption = noneOption

        RTEComponents.menu('#menu-for-'+this.id).addMenuItem(noneOption)


        var menuButtonOptions = {
            arrowSVGIconId: 'rte-icon-dd-arrow',
            text: this.defaultAnchorName,
            menuId: 'menu-for-' + this.id,
            size: 'mini',
            className: 'rte-menu-button-split-dropdown'
        }
        RTEComponents.menubutton("#button-for-"+this.id, menuButtonOptions);
    }

    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getButtonHtml();
        this.mount.innerHTML = html;

        var popoverEl = this.createElementFromHTML(this.getPopoverHtml())
        this.popoverEl = popoverEl
        this.rteView.menubar.mountCompContainer.append(popoverEl);

        var self = this;

        RTEComponents.popover(`#popover-for-${this.id}`, {
            forElement: `#rte-toolbar-${this.id}`,
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            open: function(event, data) {
                setTimeout(function() {
                    var { $from, $to } = self.rteView.editorView.state.selection
                    if($from.pos === $to.pos) {
                        // if cursor is palced between a link and link popover is opened
                        var range = self.rteView.commands.getLinkRange()
                        if(range.start !== range.end) {
                            self.rteView.setSelection(range.start, range.end)

                            var text = self.rteView.editorView.state.doc.textBetween(range.start, range.end, ' ', ' ')
                            var marks = self.rteView.getCursorInfo().marks
                            var linkMark = marks.filter(mark => mark.type.name === 'link')[0]
                            var url = linkMark && linkMark.attrs.href

                            popoverEl.querySelector(`#add-link-text-input-${self.id}`).value = text
                            popoverEl.querySelector(`#add-link-input-${self.id}`).value = url
                            if(self.isAnchorNeeded) {
                                self.resetAnchorInput()
                                self.addOptsToAnchorInput()
                            }
                            self.enableAddLinkButton()
                        } else {
                            // if there is no link at current cursor position
                            self.resetLinkDialog()
                            self.isAnchorNeeded && self.addOptsToAnchorInput()
                        }
                    } else {
                        // if there is a selection, then whether the selection contains link mark or not, it doesn't matter
                        self.resetLinkDialog()
                        self.isAnchorNeeded && self.addOptsToAnchorInput()
                        var text = self.rteView.editorView.state.doc.textBetween($from.pos, $to.pos, ' ', ' ')
                        popoverEl.querySelector(`#add-link-text-input-${self.id}`).value = text

                        var marks = self.rteView.getCursorInfo().marks
                        var linkMark = marks.filter(mark => mark.type.name === 'link')[0]
                        var url = linkMark && linkMark.attrs.href

                        if(url) { 
                            popoverEl.querySelector(`#add-link-input-${self.id}`).value = url
                            self.enableAddLinkButton()
                        }
                    }
                    popoverEl.querySelector(`#add-link-input-${self.id}`).focus()
                }, 100)
            },
            beforeclose: function(event, data) {
                self.rteView.focus()
            },
            position: this.rteView.options.menubar.position == 'top' ? 'bottom' : 'top',
            displayType: 'callout'
        });

        this.mount.querySelector(`#rte-toolbar-${this.id}`).addEventListener('click', function() {
            self.showPopover()
        })

        popoverEl.querySelector(`#add-link-input-${this.id}`).addEventListener('keyup', function() {
            self.validateAddLinkButton()
        })

        popoverEl.querySelector(`#add-link-btn-${this.id}`).addEventListener('click', function() {
            self.actionCallback(popoverEl.querySelector(`#add-link-text-input-${self.id}`).value , popoverEl.querySelector(`#add-link-input-${self.id}`).value)
            self.closePopover()
        })

        popoverEl.querySelector(`#add-link-cancel-btn-${this.id}`).addEventListener('click', function() {
            self.closePopover()
        })

        this.renderAnchorDropdown()

    }
}