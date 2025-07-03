import Button from "./Button";
import ColorPicker from "./ColorPicker";
import ContextMenu from "./ContextMenu";
import ImageMenu from "./ImageMenu";
import VideoMenu from "./VideoMenu";
import LinkMenu from "./LinkMenu";
import RightContextMenu from "./RightContextMenu";
import SplitCombo from "./SplitCombo";
import SplitDropdown from "./SplitDropdown";
import TableMenu from "./TableMenu";
import menubarTemplate from "../../templates/menubar.hbs"
import { RTEComponents } from "../RichTextEditorView";
import InsertHtmlMenu from "./InsertHtmlMenu";
import MoreMenu from "./MoreMenu";
import EmbedMenu from "./EmbedMenu";
import AnchorMenu from "./AnchorMenu";

var menuHandlers = {
    'button': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var button = new Button(options, this.rteView, containerEl)
        button.render();
        var self = this;
        button.onAction(function(selected) {
            self.rteView.execCommand(options.command, options.params)
        })
        this.menus.push(button)
    },
    'group': function(options) {
        var html =  `<div class="ui-flex-container rte-toolbar-group${options.custom ? '-right':''}" id="rte-toolbar-${options.id}"></div>`
        var groupEl = this.el.querySelector('#rte-toolbar-'+options.id);
        if (!groupEl) {
            groupEl = this.createElementFromHTML(html)
            var parentEl;
            if(options.custom) {
                parentEl = this.el.querySelector('#rte-menubar-right')
            } else {
                parentEl = this.el.querySelector('#rte-menubar-left')
            }
            parentEl.appendChild(groupEl)
        }

        if (options.items) {
            var self = this;
            options.items.forEach(function(item) {
                item.group = options.id
                self.addMenu(item)
            })
        }
    },
    'splitbutton': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var splitButton = new SplitDropdown(options, this.rteView, containerEl);
        splitButton.render()
        var self = this;
        splitButton.onAction(function(option) {
            self.rteView.execCommand(option.command, option.params)
        })
        this.menus.push(splitButton)
    },
    'link-menu': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var linkMenu = new LinkMenu(options, this.rteView, containerEl)
        linkMenu.render()
        this.menus.push(linkMenu)
    },
    'image-menu': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var imageMenu = new ImageMenu(options, this.rteView, containerEl)
        imageMenu.render()
        this.menus.push(imageMenu)
    },
    'video-menu': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var videoMenu = new VideoMenu(options, this.rteView, containerEl)
        videoMenu.render()
        this.menus.push(videoMenu)
    },
    'embed-menu': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var embedMenu = new EmbedMenu(options, this.rteView, containerEl)
        embedMenu.render()
        this.menus.push(embedMenu)
    },
    'table-menu': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var tableMenu = new TableMenu(options, this.rteView, containerEl)
        tableMenu.render()
        var self = this;
        tableMenu.onAction(function(row, col) {
            self.rteView.execCommand(options.command, [row, col])
        })
        this.menus.push(tableMenu)
    },
    'split-combo': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        containerEl.setAttribute("title", options.name)
        var splitCombo = new SplitCombo(options, this.rteView, containerEl) // for split combo alone we have added tooltip option here because components
        // team said we can't set tooltip to select tag that we give as input to RTEComponents.combobox()
        splitCombo.render()
        var self = this;
        splitCombo.onAction(function(option) {
            if(option.command) {//for pre-defined dropdown items
                self.rteView.execCommand(option.command, option.params)
            } else if(option.customValueCommand) {//for custom dropdown items
                self.rteView.execCommand(option.customValueCommand, option.params)
            }
        })
        this.menus.push(splitCombo)
    },
    'color-picker': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var colorPicker = new ColorPicker(options, this.rteView, containerEl)
        colorPicker.render()
        var self = this;
        colorPicker.onAction(function(colorCode) {
            self.rteView.execCommand(options.command, colorCode)
        })
        this.menus.push(colorPicker)
    },
    'html-menu': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var htmlMenu = new InsertHtmlMenu(options, this.rteView, containerEl)
        htmlMenu.render()
        this.menus.push(htmlMenu)
    },
    'more-menu': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var moreMenu = new MoreMenu(options, this.rteView, containerEl, this.el)
        moreMenu.render()
        this.menus.push(moreMenu)
    },
    'anchor-menu': function(options) {
        var containerEl = this.getMountEl(this, options.id, options.group)
        var anchorMenu = new AnchorMenu(options, this.rteView, containerEl)
        anchorMenu.render()
        this.menus.push(anchorMenu)
    }
}

export default class MenubarView {
    constructor(rteView, options) {
        this.rteView = rteView
        this.editorView = rteView.editorView;
        this.options = options;
        this.menuHandlers = menuHandlers
        // construct element
        this.el = this.createElement();
        // we are storing the menubar instance in rteView.menubar here itself so that rightContextMenu
        // can append it's elements in this.rteView.menubar.mountCompContainer
        // we are again storing the menubar instance in rteView.menubar while calling new MenubarView() in init function in RichTextEditorView.js file for
        // readability purpose, it is not necessary to store menubar instance once again there because we have already stored it here
        this.rteView.menubar = this

        this.menus = []; // menu class instances. Will call destroy of each menu when rteView.menubar.destroy is called
        
        var menuOptions = this.options.menubar
        if(!menuOptions || menuOptions.tooltip !== false) {
            RTEComponents.tooltip(this.el, {showDelay: 200, displayType: 'callout', className: 'rte-tool-tip'})
        }
        this.groupContext = null;
    }

    // groupContext tells in which group to add the current menu item
    // so before every addMenu call we call this setGroupContext to set the groupContext
    // ok now why do we need to setGroupContext? can't we pass it as a key to the param object called with addMenu function ?
    // the group to which an item is added is already given in defaultOrdering variable in ./Utils.js file or it will be provided in options.menubar.order by the user,
    // so if we pass it again in addMenu then it will be a redundant thing, adding to this is that, it can be called by the integration team, so it acts as an API,
    // so it reduces the efficiency of API, we should'nt ask the integrating team to pass a redundant information in API
    
    // scenario for redundant information passed, assume there is no setGroupContext method:
    // the user gives the menubar ordering from option say he wants to have font family first instead of bold,
    // so in group-1 in options.menubar.order he puts font family followed by bold
    // now again in menubar.overrides for font family he needs to call addMenu function where he needs to send the group context as 'group-1' as a key
    // to param obejct, so inorder to avoid this we are using this setGroupContext method.
    setGroupContext(context) {
        this.groupContext = context
    }

    resetGroupContext() {
        this.groupContext = null;
    }

    // utils
    insertAfter(node, newnode) {
        node.parentNode.insertBefore(newnode, node.nextSibling);
    }

    insertBefore(node, newnode) {
        node.parentNode.insertBefore(newnode, node);
    }

    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        
        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }

    getMountEl(menubar, id, group) {
        var html = `<div id="container-for-${id}" class="ui-flex-container ui-flex-vcenter"></div>`
        var containerEl = this.createElementFromHTML(html);
        menubar.el.querySelector('#rte-toolbar-'+(group || 'default-group')).appendChild(containerEl);
        return containerEl;
    }

    // methods
    createElement() {
        var el = document.createElement('div');
        el.setAttribute('id','rte-menubar');

        var context = {};
        // build DOM node with context.
        el.innerHTML = menubarTemplate(context);
        if (this.options.menubar.position === 'bottom') {
            this.insertAfter(this.editorView.dom, el); // attach to DOM
        } else {
            this.insertBefore(this.editorView.dom, el);
        }

        var rteCompMountContainer = document.createElement('div');
        rteCompMountContainer.setAttribute('id', 'rte-comp-mount-div');
        el.appendChild(rteCompMountContainer)
        this.mountCompContainer = rteCompMountContainer;
        return el;
    }

    addMenu(options) {
        if(this.options.menubar.menuItemOverrides && this.options.menubar.menuItemOverrides[options.id]) {
            options = Object.assign({}, options, this.options.menubar.menuItemOverrides[options.id])
        }
        var handler = this.menuHandlers[options.type];

        options.group = this.groupContext
        if (handler) {
            handler.apply(this, [options])
        }
    }

    addContextMenu(config) {
        if (config.type === 'rightclick') {
            if(!this.rightContextMenu) {
                this.rightContextMenu = new RightContextMenu({id: 'common-rightclick-menu'}, this.rteView);
            }
            this.rightContextMenu.registerMenu(config);
        } else {
            this.menus.push(new ContextMenu(config, this.rteView))
        }
    }

    getMenuItemById(id) {
        let prefixForId = this.rteView.id + '-';
        let computedId = prefixForId + id
        return this.menus.filter((menuInstance) => {
            return menuInstance.id === computedId
        })[0]
    }


    destroy() {
        var menuOptions = this.options.menubar
        if(!menuOptions || menuOptions.tooltip !== false) {
            RTEComponents.tooltip(this.el).destroy()
        }
        if(this.rightContextMenu) {
            this.rightContextMenu.destroy()
        }
        this.menus.forEach(function(menu) {
            menu.destroy && menu.destroy();
        })
        this.mountCompContainer.remove();
        this.el.remove();
    }
}