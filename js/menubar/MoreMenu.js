import { RTEComponents } from "../RichTextEditorView";

export default class MoreMenu {

    constructor(config, rteView, mount, menubarEl) {
        this.rteView = rteView
        this.config = config
        this.mount = mount;
        this.id = this.rteView.id + '-' + this.config.id;
        this.popoverEl = null
        this.menubarEl = menubarEl

        this.eachGroupElWidth = null;
        this.totalWidthOfGroupEl = null;
        this.mountingSpaceForMenubarElements = null
        this.moreGroup = this.menubarEl.querySelector('#rte-toolbar-group-more')
        this.moreGroupWidth = 30 // hard coded the width occupied by the more icon, because initially the width of the more group will be 0
        //  as it's display will be set to none

        // provide resize api, so that they can be called manually by users whenever they reduce the width of the menubar div explicitly
        this.boundedMakeMenubarResponsive = this.makeMenubarResponsive.bind(this)
        this.rteView.menubar.resize = this.boundedMakeMenubarResponsive
        
        this.rteView.menubar.closeMoreMenu = this.closePopover.bind(this)
        this.rteView.menubar.openMoreMenu = this.showPopover.bind(this)
    }

    destroy() {
        RTEComponents.popover(`#popover-for-${this.id}`).destroy();
        this.rteView.options.root.querySelector(`#popover-for-${this.id}`).remove();
        window.removeEventListener('resize', this.boundedMakeMenubarResponsive)
        this.rteView.editorView.dom.removeEventListener('focus', this.boundedClosePopover)
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
        return `<div id="popover-for-${this.id}" class="ui-rte-group-more-parent">
            <div style='display: block;' class="ui-rte-group-more" id="popover-for-${this.id}-content"></div>
        </div>`
    }

    showPopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).open();
    }

    closePopover() {
        RTEComponents.popover(`#popover-for-${this.id}`).close();
    }

    addInlineFlex(domEL) {
        domEL.style.display = 'inline-flex'
    }

    removeInlineFlex(domEl) {
        domEl.style.display = ''
    }

    showMoreGroup() {
        this.moreGroup.style.display = ''
    }

    hideMoreGroup() {
        this.moreGroup.style.display = 'none'
    }

    getMenubarWidth() {
        let menubarContainerComputedStyle = window.getComputedStyle(this.menubarEl.querySelector('#ui-rte-menubar-container'))
        let paddingLeftOfMenubarContainer = parseFloat(menubarContainerComputedStyle.getPropertyValue('padding-left'))
        let paddingRightOfMenubarContainer = parseFloat(menubarContainerComputedStyle.getPropertyValue('padding-right'))
        let rightToolbarBlocksWidth = this.menubarEl.querySelector('#rte-menubar-right').clientWidth
        let menubarWidth = this.menubarEl.clientWidth // menubar width does not subtract the padding, so do it manually
        return menubarWidth - rightToolbarBlocksWidth - paddingLeftOfMenubarContainer - paddingRightOfMenubarContainer
    }

    resetAllGroupEl() {

        var self = this;

        if(this.popoverEl.childNodes.length > 0) {
            Array.from(this.popoverEl.childNodes).forEach((el) => {
                self.removeInlineFlex(el)
                self.mountingSpaceForMenubarElements.append(el)
            })
        }

        // add the more group always to the last, because the index of this.eachGroupElWidth array is based on the menubar ordering
        // assume this case:

        // initially the menubar ordering is group 1, group 2, group 3, group 4, group 5, group 6, more group

        // first the window size is small, so only 4 groups are visible and the next is more group, rest 2 more groups moves inside more group popover
        // now the order is group 1, group 2, group 3, group 4, more group

        // now if resetAllGroupEl() function is called, the remaining two groups gets attached to menubar, so now the order looks like
        // group 1, group 2, group 3, group 4, more group, group 5, group 6
        // now the index of this.eachGroupElWidth array is mismatched with menubar ordering

        // so we have to move the more group to the last, only then the menubar ordering will be like
        // group 1, group 2, group 3, group 4, group 5, group 6, more group
        // that is why we are doing the below step

        this.mountingSpaceForMenubarElements.appendChild(this.moreGroup)
        this.moreGroup.style.display = 'none'
    }

    addDomElToMoreGroup(domEl) {
        this.addInlineFlex(domEl)
        this.popoverEl.appendChild(domEl)
    }

    putElementsIntoMoreGroup() {

        // since menubar width < totalWidthOfGroupEl, we need to add more icon by default, so the minimum space required would be width of more group
        // that is why we are initialising curWidth to moreGroupWidth

        var curWidth = this.moreGroupWidth;
        var isOverflowing = false
        var self = this

        Array.from(this.mountingSpaceForMenubarElements.childNodes).forEach((el, idx) => {

            // if there is only space for group 1, group 2, group 3 to be placed, then after that all the remaining groups should go inside the more group
            // it should not be like there is space for group 1, group2, group 3 and group 5 but there is no space for group 4, group 6 and group 7 so only the
            // group 4, group 6 and group 7 will be inside more menu
            // from the moment there is no space for the next group, all the remaining groups should go inside more group
            if(isOverflowing) {
                self.addDomElToMoreGroup(el)
            } else {
                let newWidth = self.eachGroupElWidth[idx] + curWidth
                let isNewWidthGreaterThanMenubarWidth = newWidth > self.getMenubarWidth()

                if(isNewWidthGreaterThanMenubarWidth) {
                    self.addDomElToMoreGroup(el)
                    isOverflowing = true
                } else {
                    curWidth += self.eachGroupElWidth[idx]
                }
            }

        })

        this.showMoreGroup()
        this.mountingSpaceForMenubarElements.appendChild(this.moreGroup)
    }

    setMaxWidthOfLeftMenubar() {
        let leftMenubarWidth = this.menubarEl.querySelector('#rte-menubar-left').clientWidth
        this.menubarEl.querySelector(`#popover-for-${this.id}`).style.setProperty('max-width', `${leftMenubarWidth}px`)
    }

    reset() {
        this.eachGroupElWidth = []
        this.totalWidthOfGroupEl = 0
        this.resetAllGroupEl()
    }

    makeMenubarResponsive() {

        var self = this

        this.mountingSpaceForMenubarElements = this.menubarEl.querySelector('#rte-menubar-left')
        this.reset()

        var groupElements = this.mountingSpaceForMenubarElements.childNodes

        Array.from(groupElements).forEach((el) => {
            if(el.id !== this.moreGroup.id) {
                // don't push width of more group
                self.eachGroupElWidth.push(el.clientWidth)
                self.totalWidthOfGroupEl += el.clientWidth
            }
        })

        if(this.getMenubarWidth() < this.totalWidthOfGroupEl) {
            this.putElementsIntoMoreGroup()
        } else {
            this.hideMoreGroup()
        }

        this.setMaxWidthOfLeftMenubar()
    }

    bindEventListeners() {
        var self = this
        this.mount.querySelector(`#rte-toolbar-${this.id}`).addEventListener('click', function() {
            self.showPopover()
        })

        window.addEventListener('resize', this.boundedMakeMenubarResponsive)

        this.boundedClosePopover = this.closePopover.bind(this)
        this.rteView.editorView.dom.addEventListener('focus', this.boundedClosePopover)
    }

    // mandatory method
    render() {
        // render into mount point and add event listeners
        var html = this.getButtonHtml();
        this.mount.innerHTML = html;

        var popoverEl = this.createElementFromHTML(this.getPopoverHtml())
        this.rteView.menubar.mountCompContainer.append(popoverEl);

        this.popoverEl = popoverEl.querySelector(`#popover-for-${this.id}-content`)

        var self = this;

        RTEComponents.popover(`#popover-for-${this.id}`, {
            forElement: `#rte-toolbar-${this.id}`,
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            beforeclose: function(event, data) {
                self.rteView.focus()
            },
            position: this.rteView.options.menubar.position == 'top' ? 'bottom-right' : 'top-right',
            displayType: 'callout'
        });

        this.bindEventListeners()

        // initially hide the more group
        this.hideMoreGroup()

        // make the overflowing icons to move into the more group initially when the editor loads
        this.makeMenubarResponsive()
    }
}