/**
 * var dd = new Splitdropdown(mountpoint, {
 *      id: 'some-id-unique-to-dropdown',
 *      options: [{
 *          id, icon, label, action
 *      }]
 * })
 */
 import { RTEComponents } from "../RichTextEditorView";

export default class RightContextMenu {

    constructor(config, rteView) {
        this.config = config
        this.rteView = rteView
        this.boundedHandler = this.onRightClick.bind(this)
        this.rteView.editorView.dom.addEventListener('contextmenu', this.boundedHandler)
        this.menus = [];
        this.id = this.rteView.id + '-' + this.config.id;

        this.render()
    }

    // mandatory method
    destroy() {
        this.rteView.editorView.dom.removeEventListener('contextmenu', this.boundedHandler)
        RTEComponents.menu('#rightclick-menu-for-'+this.id).destroy()
        this.menuEl && this.menuEl.remove();
    }

    registerMenu(menuconfig) {
        this.menus.push(menuconfig)
    }

    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
      
        return div.firstChild;
    }


    getContentHTML() {
        return `
            <ul id="rightclick-menu-for-${this.id}" class="rte-right-context-menu-list">
            </ul>
        `
    }

    onRightClick(e) {

        // if rte.editable is false then don't show any contextMenu
        if(!this.rteView.editorView.editable) {
            return;
        }

        var menus2show = this.menus.filter(function(menu) {
            return menu.shouldShow(this.rteView)
        }, this)
        if (menus2show.length) {
            e.preventDefault();
            e.stopPropagation();
            // show menu
            this.opened = true;
            var zmenu = RTEComponents.menu('#rightclick-menu-for-'+this.id)

            // remove all items before adding menu items each time because
            // even if in RTEComponents.menu we are removing all items before closing the menu
            // (that is what hide function does which is passed in options to RTEComponents.menu(`#rightclick-menu-for-${this.id}`) in render() function
            // In cases of shadowDOM where sometimes the right context menu will not be closed properly, since before closing itself
            // the context for $rteZc will be changed, so RTEComponents.menu(`#rightclick-menu-for-${this.id}`).removeMenuItems() will not work since
            // RTEComponents.menu(`#rightclick-menu-for-${this.id}`) will not have any value as it's context is changed (the context value will be represented
            // by $rteZc.context variable, this variable's value will be set on every mouseenter into rteView.dom element to rteView.options.root)
            zmenu.removeMenuItems()
            menus2show.forEach(function(menuconfig, index) {
                zmenu.addMenuItems(menuconfig.options())
                if (index < menus2show.length - 1) { // if more menus to come, add a separator
                    zmenu.addMenuItem({
                        label: 'Image Options',
                        itemType: 'separator'
                    })
                }
            })
            
            RTEComponents.menu('#rightclick-menu-for-'+this.id).show({
                isRightClick: true,
                direction: 'at-cursor',
                event: e
            })
            return false;
        }
    }

    render() {
        this.menuEl = this.createElementFromHTML(this.getContentHTML())
        this.rteView.menubar.mountCompContainer.append(this.menuEl);

        var self = this;
        RTEComponents.menu(`#rightclick-menu-for-${this.id}`, {
            displayType: 'box',
            direction: 'at-cursor',
            appendTo: this.rteView.menubar.mountCompContainer,
            viewport: document.body,
            hide: function(event, data) {
                RTEComponents.menu(`#rightclick-menu-for-${self.id}`).removeMenuItems()
            }
        })
    }
}