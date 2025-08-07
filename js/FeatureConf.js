import RichTextEditor from "./RichTextEditor";
import RTEConstants from "./RTEConstants";
import { PluginKey } from 'prosemirror-state';
import { addFontColorMark, addFontFamilyMark, addFontSizeMark, addHighlightMark } from "./prosemirror-font"
import { getSchemaNode, keymapPluginForCodeBlocks, ensureIdPlugin, copyPasteSupport, CodeBlockView } from "./prosemirror-codeblocks"
import { findParentNode } from 'prosemirror-utils'
import { getMentionsPlugin, addMentionNodes, addTagNodes } from './prosemirror-mentions';
import { addEmojiNode } from './prosemirror-emoji/EmojiSchema';
import { getEmojiPlugin } from './prosemirror-emoji/RTEEmojiPlugin.js';
import { addListNodes, addCheckListNode, getCheckedListPlugin, getCheckedListDecorationPlugin } from "./prosemirror-lists"
import { addTableNodes, getTablesPlugin, TableView } from "./prosemirror-tables"
import { addImagesNodes, getBlobPlaceholderPlugin, ImageView } from "./prosemirror-images"
import { addEmbedNodes } from "./prosemirror-embed"
import Hr from "./Hr";
import RTECommands from "./Commands"
import ImageContextMenu from "./menubar/ImageContextMenu";
import LinkContextMenu from "./menubar/LinkContextMenu";
import converter from "./utils/SizeConverter.js";
import atmentionTemplate from "../templates/atmention.hbs"
import { getSuggestionsPlugin } from "./prosemirror-suggestions"
import { getSlashCommandsPlugin } from "./prosemirror-suggestions-slashcommands"

import { addHtmlNode } from "./prosemirror-html"
import { getFormatPainterPlugin } from "./prosemirror-format-painter"
import { addDefaultMarks, addLinkMark, addAnchorNode } from './Schema'
import { addBlockquoteNode } from "./prosemirror-blockquote"
import { addInlineQuoteMark } from './prosemirror-inline-quote'
import { getMarks} from "./RTECustomPlugins"
import { getFeatureConfigFromOpts } from "./RichTextEditorView.js"
import { getHTMLElFromHTMLString } from "./HTMLExport.js"
import { pasteHandlePlugin } from "./prosemirror-paste/index.js";

var pluginName = {};
pluginName[RTEConstants.ATMENTION] = "autosuggestions"; //no i18n
pluginName[RTEConstants.EMOJI] = "emoji";   //no i18n
pluginName[RTEConstants.LIST] = "list";
pluginName[RTEConstants.TABLES] = "tables";
pluginName[RTEConstants.IMAGES] = "images";
pluginName[RTEConstants.CODE_BLOCK] = "codeBlock";
pluginName[RTEConstants.SUGGESTIONS] = "suggestions";
pluginName[RTEConstants.FORMAT_PAINTER] = 'formatPainter'

/**
 * Why do we create pluginKey outside the plugin and store it ?
 * For hiding popups of plugins, we need access to plugin.
 * Plugin can be accessed using get method of plugin keys.
 */
var createNewPluginKey = function (featureName, rteView) {
    var pluginkey = new PluginKey(pluginName[featureName]);
    rteView.pluginKeys[featureName] = pluginkey;
    return pluginkey;
}

var getMarkAtCursor = function (view, markName) {
    var marksAtCursor = getMarks(view)
    return marksAtCursor.filter(function (mark) {
        return mark.type.name === markName
    })[0]
}

var getHeading = function(view) {
    if(view.state.selection.$from.depth > 0) {
        var paraStart = view.state.selection.$from.before()
        var paraNode = view.state.doc.nodeAt(paraStart)
        var type = paraNode.attrs.type
        return type
    } else {//if depth == 0 then the current position points at doc node so by default return heading type as p tag 
        return "p"
    }
}

let registerDefaultElements = function() {
    RichTextEditor.registerElement({
        strong: {
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'bold',
                    name: RichTextEditor.i18n('common.BOLD'),
                    icon: 'rte-icon-bold',
                    isSVGIcon: true,
                    shortcut: 'Ctrl+B',
                    command: 'toggleBold',
                    params: [],
    
                    onContextChange: function () {
                        return getMarkAtCursor(rteView.editorView, 'strong') ? true : false
                    }
                })
            },

            addNodes: function (schema) {
                return addDefaultMarks(schema.spec.marks, 'strong');
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    toggleBold: RTECommands.toggleBold
                })
            }
        },
    
        clearFormatting: {
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    clearFormatting: RTECommands.clearFormatting
                })
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'clear-formats',
                    name: RichTextEditor.i18n('common.CLEAR_FORMATTING'),
                    icon: 'rte-icon-clrformat',
                    isSVGIcon: true,
                    shortcut: 'Ctrl+\\',
                    command: 'clearFormatting',
                    params: []
                })
            }
        },
    
        em: {
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'italic',
                    name: RichTextEditor.i18n('common.ITALIC'),
                    icon: 'rte-icon-italic',
                    shortcut: 'Ctrl+i',
                    isSVGIcon: true,
                    command: 'toggleItalic',
                    params: [],
    
                    onContextChange: function () {
                        return getMarkAtCursor(rteView.editorView, 'em') ? true : false
                    }
                })
            },

            addNodes: function (schema) {
                return addDefaultMarks(schema.spec.marks, 'em');
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    toggleItalic: RTECommands.toggleItalic
                })
            }
        },
    
        underline: {
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'underline',
                    name: RichTextEditor.i18n('common.UNDERLINE'),
                    icon: 'rte-icon-underline',
                    isSVGIcon: true,
                    shortcut: 'Ctrl+u',
                    command: 'toggleUnderline',
                    params: [],
    
                    onContextChange: function () {
                        return getMarkAtCursor(rteView.editorView, 'underline') ? true : false
                    }
                })
            },

            addNodes: function (schema) {
                return addDefaultMarks(schema.spec.marks, 'underline');
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    toggleUnderline: RTECommands.toggleUnderline
                })
            }
        },
    
        strikeThrough: {
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'strikethrough',
                    name: RichTextEditor.i18n('common.STRIKETHROUGH'),
                    icon: 'rte-icon-strkthr',
                    isSVGIcon: true,
                    shortcut: 'Shift-Mod-x',
                    command: 'toggleStrikethrough',
                    params: [],
    
                    onContextChange: function () {
                        return getMarkAtCursor(rteView.editorView, 'strikeThrough') ? true : false
                    }
                })
            },

            addNodes: function (schema) {
                return addDefaultMarks(schema.spec.marks, 'strikeThrough');
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    toggleStrikethrough: RTECommands.toggleStrikethrough
                })
            }
        },
    
        link: {
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    addLink: RTECommands.addLink,
                    removeLink: RTECommands.removeLink,
                    getLinkRange: RTECommands.getLinkRange,
                    addLinkWithText: RTECommands.addLinkWithText
                })

                var isAnchorNodeNeeded = getFeatureConfigFromOpts("link", rteView.options).anchor
                if(isAnchorNodeNeeded) {
                    rteView.registerCommand({
                        addAnchor: RTECommands.addAnchor
                    })
                }
            },

            addNodes: function (schema, options) {
                return addLinkMark(schema.spec.marks, options)
            },

            addAdditionalNodes: function(schema, options) {
                var isAnchorNodeNeeded = getFeatureConfigFromOpts("link", options).anchor
                return isAnchorNodeNeeded ? addAnchorNode(schema.spec.nodes) : schema.spec.nodes
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'link-menu',
                    id: 'add-link',
                    name: RichTextEditor.i18n('common.INSERT_LINK'),
                    icon: 'rte-icon-link',
                    isSVGIcon: true
                })

                var isAnchorNodeNeeded = getFeatureConfigFromOpts("link", rteView.options).anchor
                if(isAnchorNodeNeeded) {
                    rteView.menubar.addMenu({
                        type: 'anchor-menu',
                        id: 'add-anchor',
                        name: RichTextEditor.i18n('common.ANCHOR'),
                        icon: 'rte-icon-italic',
                        isSVGIcon: true
                    })
                }
            },   
    
            addContextMenu: function(rteView) {
                rteView.menubar.addContextMenu({
                    id: 'context-menu-link',
                    menuClass: LinkContextMenu
                })
            }
        },
        
        highlight: {
            addNodes: function (schema, options) {
                return addHighlightMark(schema.spec.marks, options);
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    setBackgroundColor: RTECommands.setBackgroundColor,
                    toggleHighlight: RTECommands.toggleHighlight
                })
            },
    
            addMenu: function(rteView) {
    
                rteView.menubar.addMenu({
                    id: 'background-color',
                    type: 'color-picker',
                    name: RichTextEditor.i18n('common.BACKGROUND_COLOR'),
                    command: 'setBackgroundColor',
                    icon: 'rte-icon-text-bg-color',
                    isSVGIcon: true,
                    className: 'rte-background-color-drop-down',
                    defaultColor: function (theme) {
                        if(theme === "light") {
                            return rteView.options.editorLightThemeColors["--rte-bg-color"]
                        } else {
                            return rteView.options.editorDarkThemeColors["--rte-bg-color"]
                        }
                    },
                    onContextChange: function () {
                        var mark = getMarkAtCursor(rteView.editorView, 'highlight');
                        if(mark) {
                            return mark.attrs.value
                        } else {
                            if(!rteView.options.isDarkThemeEnabled) {
                                return rteView.options.editorLightThemeColors["--rte-bg-color"] //by default return white
                            } else {
                                return rteView.options.editorDarkThemeColors["--rte-bg-color"]
                            }
                        }
                    }
                })
            }
        },
    
        fontFamily: {
            addNodes: function (schema, options) {
                return addFontFamilyMark(schema.spec.marks, options);
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    setFontFamily: RTECommands.setFontFamily,
                    getFontFamilyValue: RTECommands.getFontFamilyValue
                })
            },

            addMenu: function(rteView) {
    
                var fontOptions = [], defaultFont
                // in rteView.options.default.fontFamily the value can be a string or an object with displayName and value properties
                if(typeof rteView.options.defaults.fontFamily === 'string') {
                    defaultFont = rteView.options.defaults.fontFamily
                } else {
                    defaultFont = rteView.options.defaults.fontFamily.displayName
                }
                fontOptions = fontOptions.concat(rteView.options.fonts.map(function(fontFamily) {
                    return {
                        id: 'font-' + fontFamily.displayName.split(' ').join('-'),
                        name: fontFamily.displayName,
                        selected: defaultFont.toLowerCase() === fontFamily.displayName.toLowerCase(),
                        icon: '',
                        command: 'setFontFamily',
                        params: [fontFamily.value]
                    }
                }))
    
                rteView.menubar.addMenu({
                    id: 'font-family',
                    type: 'splitbutton',
                    contentType: 'text',
                    name: RichTextEditor.i18n('common.FONT'),
                    options: fontOptions,
                    styles: {
                        width: "130px",
                        justifyContent: "space-between"
                    }, // 130px is set as width because that is the
                    // length of the longest font family name (Times New Roman) as of now
    
                    onContextChange: function() {
                        var mark = getMarkAtCursor(rteView.editorView, 'fontFamily');
                        if (mark) {
                            var markName = rteView.options.fonts.filter((font) => font.value === mark.attrs.value)[0].displayName
                            return "font-" + markName.split(' ').join('-')
                        } else {
                            var defaultFont
                            // in rteView.options.default.fontFamily the value can be a string or an object with displayName and value properties
                            if(typeof rteView.options.defaults.fontFamily === 'string') {
                                defaultFont = rteView.options.defaults.fontFamily
                            } else {
                                defaultFont = rteView.options.defaults.fontFamily.displayName
                            }
                            return 'font-' + defaultFont.split(' ').join('-') // TODO: return from default setting
                        }
                    }
                })
            }
        },
    
        fontSize: {
            addNodes: function (schema, options) {
                return addFontSizeMark(schema.spec.marks, options);
            },
    
            registerCommand: function (rteView) {

                // only if allowCustomUnits flag is true register the setFontSizeWithUnits command
                let fontSizeOpts = getFeatureConfigFromOpts("fontSize", rteView.options)
                let allowCustomUnits = fontSizeOpts.allowCustomUnits

                if(allowCustomUnits) {
                    rteView.registerCommand({
                        setFontSizeWithUnits: RTECommands.setFontSizeWithUnits
                    })
                }

                rteView.registerCommand({
                    setFontSize: RTECommands.setFontSize
                })
            },
    
            addMenu: function(rteView) {
    
                var fontSizeOptions = []
                var defaultFontSize = converter(rteView.options.defaults.fontSize).points.toString() || "10"
                fontSizeOptions = fontSizeOptions.concat(rteView.options.fontSizes.map(function(fontSize) {
                    return {
                        name: fontSize,
                        id: "font-size-" + fontSize,
                        default: defaultFontSize === fontSize,
                        command: "setFontSize",
                        params: [Number(fontSize)]
                    }
                }))
    
                rteView.menubar.addMenu({
                    id: 'font-size',
                    type: 'split-combo',
                    name: RichTextEditor.i18n('common.FONT_SIZE'),
                    customValueCommand: "setFontSize",
                    customValueId: "font-size",
                    options:fontSizeOptions,
                    onContextChange: function () {
                        var mark = getMarkAtCursor(rteView.editorView, 'fontSize');
                        var currentOption = {}
                        if (mark) {
                            currentOption.value = converter(mark.attrs.value.toLowerCase()).points
                            currentOption.id = "font-size-" + currentOption.value
                        } else {
                            currentOption.value = converter(rteView.options.defaults.fontSize).points || 10; // pick 10 if no default is provided
                            currentOption.id = 'font-size-' + currentOption.value
                        }
                        return currentOption
                    }
                })
            }
        },
    
        fontColor: {
            addNodes: function (schema, options) {
                return addFontColorMark(schema.spec.marks, options);
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    setFontColor: RTECommands.setFontColor
                })
            },
    
            addMenu: function(rteView) {
    
                rteView.menubar.addMenu({
                    id: 'font-color',
                    type: 'color-picker',
                    name: RichTextEditor.i18n('common.FONT_COLOR'),
                    command: 'setFontColor',
                    icon: 'rte-icon-text-color',
                    isSVGIcon: true,
                    className: 'rte-font-color-drop-down',
                    defaultColor: function(theme) {
                        if(theme === "light") {
                            return rteView.options.editorLightThemeColors["--rte-text-color"]
                        } else {
                            return rteView.options.editorDarkThemeColors["--rte-text-color"]
                        }
                    },
                    onContextChange: function () {
                        var mark = getMarkAtCursor(rteView.editorView, 'fontColor');
                        if(mark) {
                            return mark.attrs.value
                        } else {
                            if(!rteView.options.isDarkThemeEnabled) {
                                return rteView.options.editorLightThemeColors["--rte-text-color"] //by default return black
                            } else {
                                return rteView.options.editorDarkThemeColors["--rte-text-color"]
                            }
                        }
                    }
                })
            }
        },
    
        script: {
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    toggleSubScript: RTECommands.toggleSubScript,
                    toggleSuperScript: RTECommands.toggleSuperScript
                })
            },

            addNodes: function (schema) {
                return addDefaultMarks(schema.spec.marks, 'script');
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    id: 'script',
                    type: 'splitbutton',
                    buttonType: 'icon',
                    stateButton: true,
                    name: RichTextEditor.i18n('common.SUPERSCRIPT') + "/" + RichTextEditor.i18n('common.SUBSCRIPT'),
                    options: [{
                        id: 'sup-script',
                        name: RichTextEditor.i18n('common.SUPERSCRIPT'),
                        icon: 'rte-icon-superscript',
                        isSVGIcon: true,
                        selected: true,
                        command: 'toggleSuperScript',
                        params: []
                    }, {
                        id: 'sub-script',
                        name: RichTextEditor.i18n('common.SUBSCRIPT'),
                        icon: 'rte-icon-subscript',
                        isSVGIcon: true,
                        command: 'toggleSubScript',
                        params: []
                    }],
    
                    onContextChange: function() {
                        var scriptMark = getMarkAtCursor(rteView.editorView, 'script');
                        if(scriptMark) {
                            return scriptMark.attrs.type + '-script'
                        } else {
                            return false
                        }
                    }
                })
            }
        },
    
        lineHeight: {
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    setLineHeight: RTECommands.setLineHeight
                })
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    id: 'line-height',
                    type: 'splitbutton',
                    buttonType: 'icon',
                    name: RichTextEditor.i18n('common.LINE_SPACING'),
                    options: [{
                        id: 'rte-lh-1',
                        name: RichTextEditor.i18n('common.1_0_SINGLE'),
                        icon: 'rte-icon-linespace',
                        isSVGIcon: true,
                        selected: true,
                        command: 'setLineHeight',
                        params: [1]
                    }, {
                        id: 'rte-lh-1-2',
                        name: RichTextEditor.i18n('common.1_2_NORMAL'),
                        icon: 'rte-icon-linespace',
                        isSVGIcon: true,
                        command: 'setLineHeight',
                        params: ["normal"]
                    }, {
                        id: 'rte-lh-1-5',
                        name: RichTextEditor.i18n('common.1_5'),
                        icon: 'rte-icon-linespace',
                        isSVGIcon: true,
                        command: 'setLineHeight',
                        params: [1.5]
                    }, {
                        id: 'rte-lh-2',
                        name: RichTextEditor.i18n('common.2_0_DOUBLE'),
                        icon: 'rte-icon-linespace',
                        isSVGIcon: true,
                        command: 'setLineHeight',
                        params: [2]
                    }],
    
                    onContextChange: function () {
                        var paraAtStart = findParentNode(function (node) {
                            return node.type.name === 'paragraph'
                        })(rteView.editorView.state.selection)
    
                        if (paraAtStart && !paraAtStart.node.attrs.lineHeight) {
                            return "rte-lh-1"
                        } else if (paraAtStart && paraAtStart.node.attrs.lineHeight) {
                            let val = paraAtStart.node.attrs.lineHeight
                            if (val === 1 || val === "1") {
                                return "rte-lh-1"
                            } else if (val === 1.2 || val === "1.2") {
                                return "rte-lh-1-2"
                            } else if (val === 1.5 || val === "1.5") {
                                return "rte-lh-1-5"
                            } else if (val === 2 || val === "2") {
                                return "rte-lh-2"
                            }
                        }
                    }
                })
            }
        },
    
        hr: {
            addNodes: function (schema) {
                return schema.spec.nodes.append({
                    hr: Hr.getSchemaNode()
                })
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    insertHr: RTECommands.insertHr
                })
            },
    
            addMenu: function (rteView) {
    
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'hr',
                    name: RichTextEditor.i18n('common.HORIZONTAL_LINE'),
                    icon: 'rte-icon-hrline',
                    isSVGIcon: true,
                    shortcut: '',
                    command: 'insertHr',
                    params: []
                })
            },
    
            shorthand: function (content) {
                return content.startsWith('------')
            }
        },
    
        code_block: {
            addNodes: function (schema) {
                return schema.spec.nodes.append({
                    code_block: getSchemaNode()
                })
            },
    
            addPlugin: function (plugins, feature, rteView) {
                createNewPluginKey(RTEConstants.CODE_BLOCK, rteView)
                plugins.push(keymapPluginForCodeBlocks);
                plugins.push(ensureIdPlugin());
                plugins.push(copyPasteSupport());
                
            },
    
            getNodeViews: function(options) {
                return {
                    code_block: function(node, view, getPos) {
                        return new CodeBlockView(node, view, getPos, options)
                    }
                }
            },
    
            addMenu: function(rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'code-block',
                    name: RichTextEditor.i18n('common.CODE_SNIPPET'),
                    icon: 'rte-icon-code',
                    isSVGIcon: true,
                    command: 'insertCodeBlock',
                    params: []
                })
            },    
    
            addContextMenu: function(rteView) {
                rteView.menubar.addContextMenu({
                    type: 'rightclick', // if right click menu, no need for a custom class
                    id: 'codeblock-right-click-menu',
                    shouldShow: function(rteView) {
                        var codeblock = findParentNode(function (node) {
                            return node.type.name === 'code_block'
                        })(rteView.editorView.state.selection)
                        
                        return !!codeblock;
                    },
                    options: function(zmenu) {
                        var menus = [
                            {
                                label: RichTextEditor.i18n('common.REMOVE'),
                                action: function() {
                                    rteView.commands.deleteCodeBlock()
                                    rteView.focus()
                                }
                            }
                        ]
                        return menus;
                    }
                })
            },
    
            registerCommand: function(rteView) {
                rteView.registerCommand({
                    insertCodeBlock: RTECommands.insertCodeBlock,
                    deleteCodeBlock: RTECommands.deleteCodeBlock,
                    toggleCodeBlock: RTECommands.toggleCodeBlock
                })
            }
        },
    
        align: {
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    id: 'align-group',
                    type: 'splitbutton',
                    buttonType: 'icon',
                    name: RichTextEditor.i18n('common.ALIGNMENT'),
                    options: [{
                        id: 'rte-align-left',
                        name: RichTextEditor.i18n('common.LEFT_ALIGN'),
                        icon: 'rte-icon-txtalnleft',
                        isSVGIcon: true,
                        selected: true,
                        command: 'alignPara',
                        params: ['left']
                    }, {
                        id: 'rte-align-right',
                        name: RichTextEditor.i18n('common.RIGHT_ALIGN'),
                        icon: 'rte-icon-txtalnright',
                        isSVGIcon: true,
                        command: 'alignPara',
                        params: ['right']
                    }, {
                        id: 'rte-align-center',
                        name: RichTextEditor.i18n('common.CENTER_ALIGN'),
                        icon: 'rte-icon-txtalncenter',
                        isSVGIcon: true,
                        command: 'alignPara',
                        params: ['center']
                    }, {
                        id: 'rte-align-justify',
                        name: RichTextEditor.i18n('common.JUSTIFY'),
                        icon: 'rte-icon-txtalnjustify',
                        isSVGIcon: true,
                        command: 'alignPara',
                        params: ['justify']
                    }],
    
                    onContextChange: function () {
                        var paraAtStart = findParentNode(function (node) {
                            return node.type.name === 'paragraph'
                        })(rteView.editorView.state.selection)
                
                        if (paraAtStart && paraAtStart.node.attrs.align) {
                            return 'rte-align-' + paraAtStart.node.attrs.align;
                        } else {
                            return rteView.options.rtl ? 'rte-align-right' : 'rte-align-left'
                        }
                    }
                })
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    alignPara: RTECommands.alignPara
                })
            }
        },
    
        direction: {
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    setDirection: RTECommands.setDirection
                })
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    id: 'para-direction',
                    type: 'splitbutton',
                    name: RichTextEditor.i18n('common.DIRECTION'),
                    buttonType: 'icon',
                    options: [{
                        id: 'dir-ltr',
                        name: RichTextEditor.i18n('common.LEFT_TO_RIGHT'),
                        icon: 'rte-icon-ltr',
                        isSVGIcon: true,
                        selected: true,
                        command: 'setDirection',
                        params: ['ltr']
                    }, {
                        id: 'dir-rtl',
                        name: RichTextEditor.i18n('common.RIGHT_TO_LEFT'),
                        icon: 'rte-icon-rtl',
                        isSVGIcon: true,
                        command: 'setDirection',
                        params: ['rtl']
                    }],
    
                    onContextChange: function () {
                        var paraAtStart = findParentNode(function (node) {
                            return node.type.name === 'paragraph'
                        })(rteView.editorView.state.selection)
    
                        if (paraAtStart && paraAtStart.node.attrs.dir) {
                            return 'dir-' + paraAtStart.node.attrs.dir;
                        } else {
                            return rteView.options.rtl ? 'dir-rtl' : 'dir-ltr'
                        }
                    }
                })
            }
        },
        
        indent: {
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    increaseIndent: RTECommands.increaseIndent,
                    decreaseIndent: RTECommands.decreaseIndent
                })
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    id: 'indent',
                    type: 'splitbutton',
                    name: RichTextEditor.i18n('common.TEXT_INDENT'),
                    buttonType: 'icon',
                    options: [{
                        id: 'increase-indent',
                        name: RichTextEditor.i18n('common.INCREASE_INDENT'),
                        icon: 'rte-icon-ltr',
                        isSVGIcon: true,
                        selected: true,
                        command: 'increaseIndent',
                        params: []
                    }, {
                        id: 'decrease-indent',
                        name: RichTextEditor.i18n('common.DECREASE_INDENT'),
                        icon: 'rte-icon-rtl',
                        isSVGIcon: true,
                        command: 'decreaseIndent',
                        params: []
                    }],
    
                    onContextChange: function () {
                        return 'increase-indent'
                    }
                })
            }
        },
        
        mentions: {
            // no i18n
            addNodes: function (schema) {
                return addMentionNodes(addTagNodes(schema.spec.nodes));
            },
    
            getPlugin: function (feature, rteView) {
                var mentionsPluginOpts = {
                    hashtagTrigger: false,
                    getSuggestions: feature.getSuggestions,
                    getSuggestionsHTML: feature.getSuggestionsHTML || function (suggestions, type) {
                        if (type === 'mention') {
                            var context = {};
                            context.suggestions = suggestions;
                            return atmentionTemplate(context);
                        }
                    },
                    extras: feature.extras
                };
                return getMentionsPlugin(mentionsPluginOpts, rteView);
            },
    
            addPlugin: function (plugins, feature, rteView) {
                if(feature.nodeOnly) { // don't add plugin if nodeOnly flag is set to true(for mobile use case - there they don't want the mentions dropdown
                    // they only need mentions node, the dropdown they will itself draw using suggestions plugin by setting customDropdown as true)
                    return
                }
                createNewPluginKey(RTEConstants.ATMENTION, rteView)
                var plugin = this.getPlugin(feature, rteView);
                plugins.push(plugin);
            }
        },

        suggestions: {

            getPlugin: function (feature, rteView) {
                return getSuggestionsPlugin(feature, rteView);
            },

            addPlugin: function (plugins, feature, rteView) {
                createNewPluginKey(RTEConstants.SUGGESTIONS, rteView)
                var plugin = this.getPlugin(feature, rteView);
                plugins.push(plugin);
            }
        },

        slashCommands: {
            addPlugin: function (plugins, feature, rteView, schema) {
                plugins.push(getSlashCommandsPlugin(feature, rteView,options.formats))
            },
        },

        emoji: {
            addNodes: function (schema, feature) {
                if (feature.hasZomoji) {
                    return addEmojiNode(schema.spec.nodes);
                }
                return schema.spec.nodes;
            },
            getPlugin: function (feature, rteView, schema) {
                return getEmojiPlugin(rteView, schema, feature.hasZomoji);
            },
    
            addPlugin: function (plugins, feature, rteView, schema) {
                createNewPluginKey(RTEConstants.EMOJI, rteView)
                var plugin = this.getPlugin(feature, rteView, schema);
                plugins.push(plugin);
            },
    
            addMenu: function (rteView) {
                // add menubar items using rteView.menubar APIs
            }
        },
    
        list: {
            // no i18n
            addNodes: function (schema, feature) {
                return addListNodes(schema.spec.nodes, feature);
            },
    
            // instead of adding the lists plugin here we have added it in generatePlugins function in RichTextEditorView.js file because the lists plugin is common
            // to both list feature and indent format.
            // getPlugin: function (feature, rteView) {
            //     return getListsPlugin(rteView);
            // },
    
            // addPlugin: function (plugins, feature, rteView, schema) {
            //     createNewPluginKey(RTEConstants.LIST, rteView)
            //     var plugin = this.getPlugin(feature, rteView, schema);
            //     plugins.push(plugin);
            // },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'ordered-list',
                    name: RichTextEditor.i18n('common.ORDERED_LIST'),
                    icon: 'rte-icon-numlist',
                    isSVGIcon: true,
                    shortcut: 'Shift+Tab+]',
                    command: 'toggleOL',
                    params: [],
                    onContextChange: function () {
                        var olAtStart = findParentNode(function (node) {
                            return node.type.name === 'orderedList'
                        })(rteView.editorView.state.selection)

                        return olAtStart
                    }
                })
                
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'unordered-list',
                    name: RichTextEditor.i18n('common.UNORDERED_LIST'),
                    icon: 'rte-icon-bulletlist',
                    isSVGIcon: true,
                    shortcut: 'Shift+Tab+]',
                    command: 'toggleUL',
                    params: [],
                    onContextChange: function () {
                        var ulAtStart = findParentNode(function (node) {
                            return node.type.name === 'bulletList'
                        })(rteView.editorView.state.selection)

                        return ulAtStart
                    }
                })
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    toggleOL: RTECommands.toggleOL,
                    toggleUL: RTECommands.toggleUL
                })
            }
        },

        checkList: {
            // no i18n
            addNodes: function (schema, feature) {
                return addCheckListNode(schema.spec.nodes, feature);
            },
    
            // added lists plugin in generatePlugins itself for providing indent feature within lists also
            addPlugin: function (plugins, feature, rteView, schema) {
                createNewPluginKey(RTEConstants.CHECKED_LIST, rteView)
                plugins.push(getCheckedListPlugin(rteView));
                if(feature.strike !== false) {
                    createNewPluginKey(RTEConstants.CHECKED_LIST + '-decoration', rteView)
                    plugins.push(getCheckedListDecorationPlugin());
                }
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'check-list',
                    name: RichTextEditor.i18n('common.CHECK_LIST'),
                    icon: 'rte-icon-checked-box',
                    isSVGIcon: true,
                    command: 'toggleCheckList',
                    params: [],
                    onContextChange: function () {
                        var clAtStart = findParentNode(function (node) {
                            return node.type.name === 'checkList'
                        })(rteView.editorView.state.selection)

                        return clAtStart
                    }
                })

                // why do we append checklist icon alone here instead of in menubar.hbs?
                // we do this because in editor.getHTML() API we need to append checklist icon definition because for checklists we use custom svg icons
                // so if we put entry in menubar.hbs, then we need to copy the svg string and put it inside HTMLExport.js file
                // and then append that html string during getHTML() API call, which causes 2 copies of checklist icon
                // so if we need to update checklist icon, we need to update in 2 places
                // inorder to avoid this we are appending checklist icon here
                // and from here we can append it in getHTML() API call as well as in menubar dom element
                var checkedIconHTMLEl = RichTextEditor.getConf().checkList.getCheckedIconHTMLEl()
                var uncheckedIconHTMLEl = RichTextEditor.getConf().checkList.getUncheckedIconHTMLEl()
                var svgContainer = rteView.dom.querySelector("#rte-icon-container")
                svgContainer.appendChild(checkedIconHTMLEl)
                svgContainer.appendChild(uncheckedIconHTMLEl)
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    toggleCheckList: RTECommands.toggleCheckList
                })
            },

            getCheckedIconHTMLEl: function () {
                let checkedIconHTMLString = `<svg id="rte-icon-checked-box" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 3H4C3.44772 3 3 3.44772 3 4V12C3 12.5523 3.44772 13 4 13H12C12.5523 13 13 12.5523 13 12V4C13 3.44772 12.5523 3 12 3ZM4 2C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2H4Z" fill="var(--rte-icon-fill-color)"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0303 6.32322C11.128 6.42085 11.128 6.57914 11.0303 6.67678L7.35355 10.3536C7.15829 10.5488 6.84171 10.5488 6.64645 10.3536L4.96967 8.67678C4.87204 8.57914 4.87204 8.42085 4.96967 8.32322L5.32322 7.96967C5.42085 7.87204 5.57914 7.87204 5.67678 7.96967L7 9.29289L10.3232 5.96967C10.4209 5.87204 10.5791 5.87204 10.6768 5.96967L11.0303 6.32322Z" fill="var(--rte-icon-fill-color)"/>
                </svg>`
                return getHTMLElFromHTMLString(checkedIconHTMLString)
            },

            getUncheckedIconHTMLEl: function () {
                let uncheckedIconHTMLString = `<svg id="rte-icon-unchecked-box" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 3H4C3.44772 3 3 3.44772 3 4V12C3 12.5523 3.44772 13 4 13H12C12.5523 13 13 12.5523 13 12V4C13 3.44772 12.5523 3 12 3ZM4 2C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2H4Z" fill="var(--rte-icon-fill-color)"/>
                </svg>`
                return getHTMLElFromHTMLString(uncheckedIconHTMLString)
            }
        },
    
        tables: {
            // no i18n
            addNodes: function (schema) {
                return addTableNodes(schema.spec.nodes);
            },
    
            getPlugin: function (feature, rteView) {
                return getTablesPlugin(rteView);
            },
    
            getNodeViews: function(options) {
                return {
                    table: function(node, view) {
                        return new TableView(node, 25, view, options)// hardcoded the minCellWidth to 25px because that is what is used in prosemirror-tables package
                    }
                }
            },
    
            addPlugin: function (plugins, feature, rteView, schema) {
                createNewPluginKey(RTEConstants.TABLES, rteView)
                var plugin = this.getPlugin(feature, rteView, schema);
                plugins.push(plugin);
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'table-menu',
                    id: 'table',
                    name: RichTextEditor.i18n('common.TABLE'),
                    icon: 'rte-icon-table',
                    isSVGIcon: true,
                    rows: 10,
                    cols: 10,
                    command: 'insertTable'
                })
    
            },
                
    
            addContextMenu: function(rteView) {
                rteView.menubar.addContextMenu({
                    type: 'rightclick', // if right click menu, no need for a custom class
                    id: 'table-right-click-menu',
                    shouldShow: function(rteView) {
                        var table = findParentNode(function (node) {
                            return node.type.name === 'table'
                        })(rteView.editorView.state.selection)
                        
                        return !!table;
                    },
                    options: function(zmenu) {
                        var menus = [
                            {
                                label: RichTextEditor.i18n('common.INSERT_ROW_ABOVE'),
                                action: function() {
                                    rteView.commands.addRowBefore()
                                }
                            }, {
                                label: RichTextEditor.i18n('common.INSERT_ROW_BELOW'),
                                action: function() {
                                    rteView.commands.addRowAfter()
                                }
                            }, {
                                label: RichTextEditor.i18n('common.INSERT_COLUMN_TO_RIGHT'),
                                action: function() {
                                    rteView.commands.addColumnAfter()
                                }
                            }, {
                                label: RichTextEditor.i18n('common.INSERT_COLUMN_TO_LEFT'),
                                action: function() {
                                    rteView.commands.addColumnBefore()
                                }
                            }, {
                                itemType: 'separator'
                            },{
                                label: RichTextEditor.i18n('common.DELETE_ROW'),
                                action: function() {
                                    rteView.commands.deleteRow()
                                }
                            }, {
                                label: RichTextEditor.i18n('common.DELETE_COLUMN'),
                                action: function() {
                                    rteView.commands.deleteColumn()
                                }
                            }, {
                                label: RichTextEditor.i18n('common.DELETE_TABLE'),
                                action: function() {
                                    rteView.commands.deleteTable()
                                }
                            }, {
                                itemType: 'separator'
                            }, {
                                label: RichTextEditor.i18n('common.MERGE_CELLS'),
                                action: function() {
                                    rteView.commands.mergeCells()
                                }
                            }, {
                                label: RichTextEditor.i18n('common.SPLIT_CELLS'),
                                action: function() {
                                    rteView.commands.splitCell()
                                }
                            }
                        ]
                        return menus;
                    }
                })
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    insertTable: RTECommands.insertTable,
                    addColumnBefore: RTECommands.addColumnBefore,
                    addColumnAfter: RTECommands.addColumnAfter,
                    deleteColumn: RTECommands.deleteColumn,
                    addRowBefore: RTECommands.addRowBefore,
                    addRowAfter: RTECommands.addRowAfter,
                    deleteRow: RTECommands.deleteRow,
                    deleteTable: RTECommands.deleteTable,
                    mergeCells: RTECommands.mergeCells,
                    splitCell: RTECommands.splitCell,
                    toggleHeaderColumn:  RTECommands.toggleHeaderColumn,
                    toggleHeaderRow: RTECommands.toggleHeaderRow,
                    toggleHeaderCell: RTECommands.toggleHeaderCell
                })
            }
        },
    
        images: {
            // no i18n
            addNodes: function (schema) {
                return addImagesNodes(schema.spec.nodes);
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    insertImage: RTECommands.insertImage,
                    updateImageFit: RTECommands.updateImageFit,
                    removeImage: RTECommands.removeImage,
                    copyImage: RTECommands.copyImage
                })
            },

            getNodeViews: function(options) {
                let imgOpts = getFeatureConfigFromOpts("images", options)
                let needResize = imgOpts.resize === false ? false : true // default is true, so if not provided, then needResize is true

                if(needResize) {
                    return {
                        image: function(node, view) {
                            return new ImageView(node, view, options)
                        }
                    }
                }
            },
    
            addPlugin: function (plugins, feature, rteView, schema) {
                if(feature.useLoader) {
                    plugins.push(getBlobPlaceholderPlugin(rteView));
                }
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'image-menu',
                    id: 'add-image',
                    name: RichTextEditor.i18n('common.INSERT_IMAGE'),
                    icon: 'rte-icon-image',
                    isSVGIcon: true
                })
            },    
    
            addContextMenu: function(rteView) {
                rteView.menubar.addContextMenu({
                    type: 'rightclick',
                    id: 'rightclick-menu-for-image',
                    shouldShow: function(rteView) {
                        var selection = rteView.editorView.state.selection.toJSON();
                        return selection.type === 'node' && rteView.editorView.state.selection.node.type.name === 'image'
                    },
                    options: function(zmenu) {
                        return [
                            {
                                label: RichTextEditor.i18n('common.BEST_FIT'),
                                action: function() { rteView.commands.updateImageFit('best') }
                            }, {
                                label: RichTextEditor.i18n('common.SMALL_FIT'),
                                action: function() { rteView.commands.updateImageFit('small') }
                            }, {
                                label: RichTextEditor.i18n('common.ORIGINAL_SIZE'),
                                action: function() { rteView.commands.updateImageFit('original') }
                            }, {
                                label: RichTextEditor.i18n('common.FIT_TO_PAGE'),
                                action: function() { rteView.commands.updateImageFit('fitToWidth') }
                            }, {
                                label: RichTextEditor.i18n('common.COPY_IMAGE'),
                                action: function() { rteView.commands.copyImage() }
                            }, {
                                label: RichTextEditor.i18n('common.REMOVE'),
                                action: function() { rteView.commands.removeImage() }
                            }
                        ]
                    }
                })
    
                rteView.menubar.addContextMenu({
                    id: 'context-menu-image',
                    menuClass: ImageContextMenu
                })
            }
        },

        video: {
            // no i18n
            addNodes: function (schema) {
                var isEmbedNodePresent = schema.spec.nodes.content.find((el) => el === 'embed') // embed node might be added if embed feature is present,
                // so no need to add once more if it is already present
                if(isEmbedNodePresent) {
                    return schema.spec.nodes
                } else {
                    return addEmbedNodes(schema.spec.nodes);
                }
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    insertVideo: RTECommands.insertVideo,
                    editVideo: RTECommands.editVideo,
                    removeVideo: RTECommands.removeVideo
                })
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'video-menu',
                    id: 'add-video',
                    name:  RichTextEditor.i18n('common.UPLOAD_VIDEO'),
                    icon: 'rte-icon-vdo',
                    isSVGIcon: true
                })
            }
        },

        embed: {
            // no i18n
            addNodes: function (schema) {
                return addEmbedNodes(schema.spec.nodes);
            },
            
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    insertEmbed: RTECommands.insertEmbed,
                    editEmbed: RTECommands.editEmbed,
                    removeEmbed: RTECommands.removeEmbed
                })
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'embed-menu',
                    id: 'add-embed',
                    name:  RichTextEditor.i18n('common.EMBED'),
                    icon: 'rte-icon-embed',
                    isSVGIcon: true
                })
            }
        },
    
        headings: {
    
            addMenu: function(rteView) {
                rteView.menubar.addMenu({
                    id: 'heading',
                    type: 'splitbutton',
                    contentType: 'text',
                    name:  RichTextEditor.i18n('common.ALL_HEADINGS'),
                    styles: {
                        width: "85px",
                        justifyContent: "space-between"
                    }, // 85px is set as width because that is the
                    // length of the longest heading name (Heading 1) as of now
                    options: [{
                        id: 'ui-rte-heading-p',
                        name:  RichTextEditor.i18n('common.NORMAL'),
                        icon: '',
                        selected: true,
                        command: 'setHeading',
                        params: ['p']
                    }, {
                        id: 'ui-rte-heading-h1',
                        name: RichTextEditor.i18n('common.HEADING_1'),
                        icon: '',
                        command: 'setHeading',
                        params: ['h1']
                    }, {
                        id: 'ui-rte-heading-h2',
                        name: RichTextEditor.i18n('common.HEADING_2'),
                        icon: '',
                        command: 'setHeading',
                        params: ['h2']
                    }, {
                        id: 'ui-rte-heading-h3',
                        name: RichTextEditor.i18n('common.HEADING_3'),
                        icon: '',
                        command: 'setHeading',
                        params: ['h3']
                    }, {
                        id: 'ui-rte-heading-h4',
                        name: RichTextEditor.i18n('common.HEADING_4'),
                        icon: '',
                        command: 'setHeading',
                        params: ['h4']
                    }, {
                        id: 'ui-rte-heading-h5',
                        name: RichTextEditor.i18n('common.HEADING_5'),
                        icon: '',
                        command: 'setHeading',
                        params: ['h5']
                    }, {
                        id: 'ui-rte-heading-h6',
                        name: RichTextEditor.i18n('common.HEADING_6'),
                        icon: '',
                        command: 'setHeading',
                        params: ['h6']
                    }],
    
                    onContextChange: function() {
                        var type = getHeading(rteView.editorView);
                        return "ui-rte-heading-" + type
                    }
                })
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    setHeading : RTECommands.setHeading
                })
            }
        },

        html: {
            // no i18n
            addNodes: function (schema) {
                return addHtmlNode(schema.spec.nodes);
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    insertHtml: RTECommands.insertHtml,
                    removeHtml: RTECommands.removeHtml,
                    editHtml: RTECommands.editHtml
                })
            },

            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'html-menu',
                    id: 'insert-html',
                    name: RichTextEditor.i18n('common.INSERT_HTML'),
                    icon: 'rte-icon-html',
                    isSVGIcon: true
                })
            },
    
            addContextMenu: function(rteView) {
                rteView.menubar.addContextMenu({
                    type: 'rightclick',
                    id: 'rightclick-menu-for-html-blocks',
                    shouldShow: function(rteView) {
                        var selection = rteView.editorView.state.selection.toJSON();
                        return selection.type === 'node' && rteView.editorView.state.selection.node.type.name === 'html'
                    },
                    options: function() {
                        return [
                            {
                                label: RichTextEditor.i18n('common.DELETE_HTML_BLOCK'),
                                action: function() { rteView.commands.removeHtml() }
                            },
                            {
                                label: RichTextEditor.i18n('common.EDIT_HTML'),
                                action: function() {
                                    var view = rteView.editorView
                                    var from = view.state.selection.$from.pos
                                    var node = view.state.doc.nodeAt(from)
                                    var htmlString = node.attrs.htmlString

                                    var htmlMenu = rteView.menubar.getMenuItemById('insert-html')
                                    htmlMenu.showEditDialog(htmlString)
                                }
                            }
                        ]
                    }
                })
            }
        },

        inlineQuote: {

            addNodes: function (schema, options) {
                return addInlineQuoteMark(schema.spec.marks, options);
            },

            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'inlineQuote',
                    name: RichTextEditor.i18n('common.CODE'),
                    icon: 'zmetbi-quote',
                    command: 'toggleInlineQuote',
                    params: [],
    
                    onContextChange: function () {
                        return getMarkAtCursor(rteView.editorView, 'inlineQuote') ? true : false
                    }
                })
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    toggleInlineQuote: RTECommands.toggleInlineQuote
                })
            }
        },

        blockquote: {

            addNodes: function (schema) {
                return addBlockquoteNode(schema.spec.nodes);
            },

            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'blockquote',
                    name:  RichTextEditor.i18n('common.QUOTE') ,
                    icon: 'zmetbi-attachment',
                    command: 'insertBlockquote',
                    params: [],
    
                    onContextChange: function () {
                        return false
                    }
                })
            },
    
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    insertBlockquote: RTECommands.insertBlockquote,
                    removeBlockquote: RTECommands.removeBlockquote,
                    toggleBlockquote: RTECommands.toggleBlockquote
                })
            }
        },

        formatPainter: {
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    applyFormatPainter: RTECommands.applyFormatPainter
                })
            },
    
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'button',
                    id: 'format-painter',
                    name: RichTextEditor.i18n('common.FORMAT_PAINTER'),
                    icon: 'rte-icon-format-painter',
                    isSVGIcon: true,
                    command: 'applyFormatPainter',
                    params: []
                })
            },

            getPlugin: function (feature, rteView) {
                return getFormatPainterPlugin(rteView);
            },
    
            addPlugin: function (plugins, feature, rteView, schema) {
                createNewPluginKey(RTEConstants.FORMAT_PAINTER, rteView)
                var plugin = this.getPlugin(feature, rteView, schema);
                plugins.push(plugin);
            }
        },

        more: {
            addMenu: function (rteView) {
                rteView.menubar.addMenu({
                    type: 'more-menu',
                    id: 'more',
                    name: RichTextEditor.i18n('common.MORE'),
                    icon: 'zmetbi-moreTools'
                })
            }
        },

        pasteFormat: {
            addMenu: function(rteView) {
                rteView.menubar.addMenu({
                    type: 'splitbutton',
                    id: 'paste-menu',
                    name: 'Paste Formatting Menu',
                    buttonType: 'icon',
                    isSVGIcon: true,
                    options: [
                            {
                                id: 'only-source',
                                name: "Keep source formatting",
                                icon: 'rte-icon-bold',
                                isSVGIcon: true,
                                selected: true,
                                params: ['sourceFormatting'],
                                command: "formatPastedContent"
                            }, 
                            {
                                id: 'match-dest',
                                name: "Match destination formatting",
                                icon: 'rte-icon-italic',
                                isSVGIcon: true,
                                params: ['matchDestination'],
                                command: "formatPastedContent"
                            }, 
                            {
                                id: 'text-only',
                                name: "Text only",
                                icon: 'rte-icon-underline',
                                isSVGIcon: true,
                                params: ['textOnly'],
                                command: "formatPastedContent"
                            }
                        ]
                               
                })
            },
            addPlugin: function (plugins, feature, rteView, schema) {
                plugins.push(pasteHandlePlugin())
            },
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    formatPastedContent: RTECommands.formatPastedContent
                })
            }
        },

        proofing: {
            registerCommand: function (rteView) {
                rteView.registerCommand({
                    openZiaPanel: RTECommands.openZiaPanel,
                    closeZiaPanel: RTECommands.closeZiaPanel
                })
            }
        }
    });
}

export default registerDefaultElements
