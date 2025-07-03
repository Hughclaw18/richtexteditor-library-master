/* $Id$ */
import * as JDOMUtil from "zohocomponents/js/zdomutility.js"
import * as JComponents from "zohocomponents/js/components.js";
import getSchema from "./Schema";
import Shortcuts from "./Shortcuts";
import MenubarView from "./menubar/MenubarView";
import RTEConstants from "./RTEConstants";
import RTECustomPlugins, { getMarks, getParaAttrs, getLinkMarkBeforeAndAfterCursorIfNotAtCursor, getPath } from "./RTECustomPlugins";
import { Node, Schema, DOMSerializer, DOMParser } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands'; // no i18n
import { history } from 'prosemirror-history'; // no i18n
import { keymap } from 'prosemirror-keymap'; // no i18n
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { initMarkdown } from './markdown/init'

import { getShortcutsPlugin } from "./prosemirror-shortcuts"
import { wrappingInputRule, inputRules } from "prosemirror-inputrules"
import { tableEditing, columnResizing, gapCursor } from "./prosemirror-tables"
import RichTextEditor from "./RichTextEditor";
import registerDefaultElements from "./FeatureConf";
import converter from "./utils/SizeConverter";
import extendSpec from "./NodeExtensions";
import { TextSelection } from "prosemirror-state"
export let RTEComponents = window.RTEComponents//since zohocomponents works only with the global namespace "RTEComponents", remove the globally attached window.RTEComponents and assign it to RTEComponents variable locally, so now wherever zohocomponents looks for RTEComponents from global namespace we can import it from this local variable RTEComponents.
// RTEComponents.setProperties() is only responsible for calculating the display screen width and height and it uses this to position the insertHTML popup in the center of the screen, if RTEComponents.setProperties() is not called the pop up will be displayed on top left of the screen
RTEComponents.setProperties() // since RTEComponents.setProperties() is called in RTEComponents._init(), but RTEComponents._init() is inturn binded to the "DOMContentLoaded" event, so if rte.min.js is loaded lazily then the "DOMContentLoaded" event will be binded to the RTEComponents._init() in a delayed time during which the "DOMContentLoaded" event will already be finished as a result RTEComponents._init() will not be called so RTEComponents.setProperties() will also not be called
delete window.RTEComponents
import { getListsPlugin } from "./prosemirror-lists/listsPlugin"
import PMExports from './ProsemirrorExports'
import { createEmptyGroup, createRightEmptyGroup, defaultOrdering as defaultMenubarOrdering } from './menubar/Utils'
import NodeSerializer from "./NodeSerializer";
import RTECommands from "./Commands";
import { enableLightThemeForEditor, enableDarkThemeForEditor } from "./editor-themes/Themes";
import { getEditorDarkThemeColors, getEditorLightThemeColors, getMenubarDarkThemeColors, getMenubarLightThemeColors } from "./editor-themes/ThemeColors"
import { getStandardFonts, getStandardFontSizes, DEFAULT_FONT_VALUES } from "./prosemirror-font"
import sizeConverter from "./utils/SizeConverter"

class PluginAPI {
    constructor(pluginInstance) {
        let api = pluginInstance.props.api
        for(var obj in api) {
            this[obj] = api[obj].bind(pluginInstance)
        }
    }
}

var defaultOpts = {
    mode: 'rte',
    formats: [
        RTEConstants.BOLD,
        RTEConstants.ITALIC,
        RTEConstants.UNDERLINE,
        RTEConstants.LINK,
        RTEConstants.STRIKETHROUGH
    ],
    features: [{name: 'emoji', hasZomoji: false}],
    menubar: {position: 'top'},
    placeholder: '', // No I18N

    defaults: {
        fontFamily: { displayName: "Arial", value: "Arial, Helvetica, Sans-Serif" },
        fontSize: '10pt',
        lineHeight: 'normal'
    },
    fontOptions: []
};

var orderToAddMarksIntoSchema = ['inlineQuote', "strong", "em", "link", "align", "fontSize", "fontFamily", "fontColor",
"script", "underline", "strikeThrough", "highlight", "lineHeight", "direction", "headings", "clearFormatting", 'indent', 'formatPainter']
// here put fontSize first followed by fontFamily because in cases of applying heading we need fontSize mark to be applied first and 
// then only we need to apply fontFamily mark else for every change in fontFamily mark the fontSize mark will be applied.

// put underline after fontColor, only then the color of underline will be based on font color or else, irrespective of font color,
// the color of underline will be black

// put highlight mark after fontSize mark because backgroundColor(that is highlight mark) needs to be applied on span tag based on font-size
// Assume a case: type "abc def ghi" and make the font-size of def as 24pt and put bgcolor of "abc def ghi" as orange, now if highlight is put before fontSize then,
// highlight mark will be applied as a line with the thickness 10pt(default font-size), so bgColor applied for def would not be proper.....
// so we need bgColor to be applied based on font-size

// put script mark before underline because, if underline is put before script mark then it would be inapropriate visibly in the below case:
// type "abc def ghi" and apply underline for all 3 words and then apply superscript for "ghi" alone, you will see that
// underline will not be exactly below the superscripted text, it will be below the paragraph, this is because sup tag is inside underline tag
// inorder to place the underline exactly below the superscripted text, we need to put script mark before underline mark, so that
// underline tag will be inside sup tag

// put "strikeThrough" after "fontSize", "fontColor" and "fontFamily" because if fontSize is put after strikeThrough, then if a text is selected and set to a greater font size value
// greater than the default value and post that if strikethrough is applied, then strikethrough behaves improperly, this happens similarly for fontColor and fontFamily marks also

// put inlineQuote mark before all marks because inlineQuote mark is a special mark which when applied will add some padding before and after
// so if we put inline quote mark after other marks then following case will happen:
// type abcdef and apply inlineQuote mark for all 6 characters and then for bcd characters alone apply strong mark
// you can see single inlineQuote mark will be split into 3 inlineQuote marks, one with the character a alone, next with characters bcd and strong mark,
// and one more with the character ef alone, so inorder to avoid this we need to put inlineQuote mark before all other marks
// inlineQuote mark is a special mark because there wouldn't be a visual difference between strong tag inside em tag and em tag inside strong tag
// but for inlineQuote since we apply padding before and after the mark, code tag inside strong tag is visually different from strong tag inside code tag
// as demonstrated in the above case

// add checklist node after list node because in checklist parseDOM we are catching all ul tags with rte-check-list attribute, but in unordered list parseDOM
// we are catching all ul tags only
// if we add list nodes before checklist nodes, then list node's parseDOM will be executed first followed by checkList node's parseDOM
// so if we have ul tag with rte-check-list attribute it will be first passed to unordered list parseDOM which would return true
// thereby parseDOM in checkList will not even get a chance to execute, as a result a checkList node if copy pasted then it will be converted to
// unordered list by default
// inorder to avoid this if we add checkList node followed by list node, then checkList's parseDOM will be executed first followed by unordered list's
// parseDOM as a result ul tag with rte-check-list attribute will be first processed by checklist node's parseDOM and it will be returned true
// if we get any ul tag alone then checkList node's parseDOM will return false so now list node's parseDOM can catch it and parse it and then return true 
var orderToAddNodesIntoSchema = ['hr', 'images', 'mentions', 'emoji', 'checkList', 'list', 'tables', 'code_block', 'embed', 'video', 'html', 'blockquote']
var isNodeMentionedInOptions = function(nodes, nodeNameToBeChecked) {
    return nodes.some((node) => {
        let nodeName = typeof node === 'string' ? node : node.name
        return nodeName === nodeNameToBeChecked
    })
}

/**
 *
 * Gives the elements needed to contruct a pm state
 * @param {*} options
 * @param {JSONObject} docContentJson
 * @param {String} plainText
 */
var getState = function(rteView) {
    var state = {};
    var options = rteView.options;
    state.schema = generateSchema(options); //filters the schema based on the requirements passed
    state.plugins = generatePlugins(options, state.schema, rteView);
    var content = options.content;
    if(options.isHTMLContent) { // if it is html content
        if(typeof content === 'string') { // if it is html string
            content = RichTextEditor.processHTMLByRemovingInlineStyles(content)
            var shadowEl = document.createElement('div')
            shadowEl.innerHTML = content
            state.doc = DOMParser.fromSchema(state.schema).parse(shadowEl, { preserveWhitespace: options.whiteSpace === "collapse" ? false : true })
        } else if(content instanceof Element) { // if it is html dom element
            let processedHTMLString = RichTextEditor.processHTMLByRemovingInlineStyles(content.outerHTML)
            let shadowEl = document.createElement('div')
            shadowEl.innerHTML = processedHTMLString
            content = shadowEl.childNodes[0]
            state.doc = DOMParser.fromSchema(state.schema).parse(content, { preserveWhitespace: options.whiteSpace === "collapse" ? false : true })
        }
    } else if (typeof content === 'object') { // if it is JSON object
        //no i18n
        //docContent = DOMParser.fromSchema(mySchema).parse(document.querySelector("#content"))
        state.doc = Node.fromJSON(state.schema, content);
    } else if (typeof content === 'string') {	// if it is plain string
        state.doc = getNodeFromText(content, state.schema);
    }
    
    return EditorState.create(state);
};

var constructOptions = function(options) {
    var defaults = Object.assign({}, defaultOpts.defaults, options.defaults); 
    var options = Object.assign({}, defaultOpts, options)
    // TODO: better deep merge both objects, instead of special handling nested objects
    options.defaults = defaults;

    //push all the fonts to available fonts
    if(getFeatureConfigFromOpts("fontFamily", options)) {

        // in options.fontOptions and in options.default.fontFamily the value can be a string or an object, so if it is a string while pushing it
        // into options.fonts we need to convert it into an object and then push
        // if it is an object then directly push it into options.fonts

        options.fonts = []

        //first push the default font followed by additional fonts and then standard fonts because only then in the font-family dropdown in UI this order will be maintained.

        //push the default font to options.fonts
        
        var defaultFont = options.defaults.fontFamily
        if( defaultFont ) {
            if( typeof options.defaults.fontFamily === 'string' ) {
                options.fonts.push({
                    displayName: options.defaults.fontFamily,
                    value: options.defaults.fontFamily
                })
            } else {
                options.fonts.push(defaultFont)
            }
        }

        //push the additional fonts if it not a default font provided by the user
        var additionalFonts = options.fontOptions
        additionalFonts = additionalFonts.map((additionalFont) => {
            if( typeof additionalFont === 'string' ) {
                return {
                    displayName: additionalFont,
                    value: additionalFont
                }
            } else {
                return additionalFont
            }
        })
        if( additionalFonts ) {
            additionalFonts.forEach((newFont) => {
                let isFontAlreadyPresent = options.fonts.some((existingFont) => existingFont.displayName.toLowerCase() === newFont.displayName.toLowerCase())
                if(!isFontAlreadyPresent) {
                    options.fonts.push(newFont)
                }
            })
        }

        //push the standard fonts if it is not already present in options.fonts
        // if the displayName in standardFont and displayName in options.fonts are same then we need to retain font in options.fonts
        getStandardFonts().forEach((standardFont) => {
            let isFontAlreadyPresent = options.fonts.some((existingFont) => existingFont.displayName.toLowerCase() === standardFont.displayName.toLowerCase())
            if(!isFontAlreadyPresent) {
                options.fonts.push(standardFont)
            }
        })
        
    }

    if(getFeatureConfigFromOpts("fontSize", options)) {

        // add standard font sizes
        options.fontSizes = getStandardFontSizes()

        // add default font sizes if not present in default font sizes
        var defaultFontSize = converter(options.defaults.fontSize).points.toString()
        if( defaultFontSize ) {
            if( !options.fontSizes.some((fontSize) => fontSize === defaultFontSize)) {
                options.fontSizes.push(defaultFontSize)
            }
        }

        // add custom font sizes if not already present in options.fontSizes
        var additionalFontSizes = getFeatureConfigFromOpts("fontSize", options).additionalFontSizes
        if(additionalFontSizes) {
            additionalFontSizes.forEach((additionalFontSize) => {
                if(!options.fontSizes.some((fontSize) => fontSize === additionalFontSize)) {
                    options.fontSizes.push(additionalFontSize)
                }
            })
        }

        options.maxFontSize = sizeConverter(getFeatureConfigFromOpts("fontSize", options).maxFontSize).points || DEFAULT_FONT_VALUES.MAX_SIZE
        options.minFontSize = sizeConverter(getFeatureConfigFromOpts("fontSize", options).minFontSize).points || DEFAULT_FONT_VALUES.MIN_SIZE
    }

    if(getFeatureConfigFromOpts("fontColor", options)) {
        options.defaultFontColor = getEditorLightThemeColors()["--rte-text-color"]
    }

    if(getFeatureConfigFromOpts("highlight", options)) {
        options.defaultBackgroundColor = getEditorLightThemeColors()["--rte-bg-color"]
    }

    // we have pointed the editor color related css variables and their values to rteView instance
    // becuase of the reason mentioned in ./editor-themes/Themes.js file
    options.editorDarkThemeColors = getEditorDarkThemeColors()
    options.editorLightThemeColors = getEditorLightThemeColors()
    options.menubarDarkThemeColors = getMenubarDarkThemeColors()
    options.menubarLightThemeColors = getMenubarLightThemeColors()

    options.editorSpecificCssVariables = getEditorSpecificCssVariables()

    return options;
}

function getEditorSpecificCssVariables()  {
    return {
        "--rte-table-border-width" : "none"
    }
}

var createSchema = function(nodes, marks) {
    return new Schema({
        nodes: nodes,
        marks: marks
    });
};

var addNodeToSchema = function(features, featureNameToBeAdded, schema) {

    features.some((feature) => {
        var featureName = typeof feature === 'string' ? feature : feature.name;

        if(featureName === featureNameToBeAdded) {
            var featureProperties = RichTextEditor.getConf()[featureName];
            
            if (featureProperties && featureProperties.addNodes) {
                var nodes = featureProperties.addNodes(schema, feature);
                // update schema with new nodes
                schema = createSchema(nodes, schema.spec.marks);
            } // else keep schema as such

            return true
        }
    })

    return schema
}

var addMarkToSchema = function(options, formatNameToBeAdded, schema) {
    options.formats.some((format) => {
        var formatName = typeof format === 'string' ? format : format.name;

        if(formatName === formatNameToBeAdded) {
            var formatProperties = RichTextEditor.getConf()[formatName];
            
            if (formatProperties && formatProperties.addNodes) {
                var marks = formatProperties.addNodes(schema, options);
                schema = createSchema(schema.spec.nodes, marks);
                if(formatProperties.addAdditionalNodes) {
                    // used to add nodes into schema.nodes for any marks
                    // for now except link mark no other feature uses this feature - that is why even in addNodesToSchema we haven't put this feature
                    // for link mark, anchor node is added into schema.nodes
                    let nodes = formatProperties.addAdditionalNodes(schema, options)
                    schema = createSchema(nodes, schema.spec.marks)
                }
            }

            return true
        }
    })

    return schema
}

// add nodes to schema, by parsing options
var addNodesFromOptions = function(schema, options) {

    orderToAddNodesIntoSchema.forEach((nodeName) => {
        if(isNodeMentionedInOptions(options.features, nodeName)) {
            schema = addNodeToSchema(options.features, nodeName, schema)
        }
    })

    var features = options.features;
    features.forEach(function(feature) {
        var featureName = typeof feature === 'string' ? feature : feature.name;
        if(!orderToAddNodesIntoSchema.includes(featureName)) {
            schema = addNodeToSchema(options.features, featureName, schema)
        }
    });
    return schema;
};

// to add marks from options which are not by default present in schema.js file
var addMarksFromOptions = function(schema, options) {

    // assume in options.formats we have ['underline', 'fontColor', 'splMark'], here splMark is a custom mark
    // inorder to add marks in pre defined order we iterate over orderToAddMarksIntoSchema and check for each mark in orderToAddMArksIntoSchema whether it is present
    // in options, if it is present then we add it to schema, if it is not present we don't add.
    // By this way we have added the rte defined marks, but inorder to add custom marks, we iterate over options.formats and check the mark present in options.formats
    // but not present in orderToAddMarksIntoSchema(since orderToAddMArksIntoSchema contains only rte defined marks) and add those marks alone into schema at last.

    orderToAddMarksIntoSchema.forEach((markName) => {
        if(isNodeMentionedInOptions(options.formats, markName)) {
            schema = addMarkToSchema(options, markName, schema)
        }
    })

    var formats = options.formats;
    formats.forEach(function(format) {
        var formatName = typeof format === 'string' ? format : format.name;
        if(!orderToAddMarksIntoSchema.includes(formatName)) {
            schema = addMarkToSchema(options, formatName, schema)
        }
    });
    return schema;
};

var evaluateConf = function(functionName, overrideConf, defaultConf) {
    if(overrideConf && overrideConf[functionName]) {
        return overrideConf[functionName]
    } else {
        return defaultConf[functionName]
    }
}

export var constructMoreOption = function(rteView) {
    rteView.menubar.setGroupContext('group-more')
    
    createEmptyGroup('group-more', rteView)
    constructMenubar('more', rteView)
    
    rteView.menubar.resetGroupContext()
}

var constructMenubar = function(property, rteView) {
    var conf = RichTextEditor.getConf()[property];
    var overrideConf = rteView.options.menubar && rteView.options.menubar.overrides && rteView.options.menubar.overrides[property]

    if( (conf && conf.addMenu) || (overrideConf && overrideConf.addMenu) ) {
        var addMenu = evaluateConf('addMenu', overrideConf, conf)
    }

    if( (conf && conf.addContextMenu) || (overrideConf && overrideConf.addContextMenu)) {
        var addContextMenu = evaluateConf('addContextMenu', overrideConf, conf)
    }

    addMenu && addMenu(rteView)
    addContextMenu && addContextMenu(rteView)
}

export var processMenubarConfigurations = function(options, rteView) {

    var menubarOrdering = rteView.options.menubar.order ? rteView.options.menubar.order : defaultMenubarOrdering

    menubarOrdering.forEach((group) => {

        rteView.menubar.setGroupContext(group.id)

        group.order.forEach((element) => {

            let isGroupCreated = false

            var elementPresentInFormats = options.formats.some(function(format) {
                var name = typeof format === 'string' ? format : format.name;
                return element === name
            })

            var elementPresentInFeatures = options.features.some(function(feature) {
                var name = typeof feature === 'string' ? feature : feature.name;
                return element === name
            })

            if(elementPresentInFormats || elementPresentInFeatures) {

                if(!isGroupCreated) {
                    // if atleast one element is present in the group alone create the group, else if no elements is present in the group, then no need to
                    // create the group
                    createEmptyGroup(group.id, rteView)
                    isGroupCreated = true
                }

                constructMenubar(element, rteView)
            }
        })

        rteView.menubar.resetGroupContext()
    })
}

export var setRootElement = function(options) {

    // why do we have root and rootContainer separately?
    // root element is used to provide to zohoComponents as $zc.context, as well as it is used to set root in codeBlockView
    // as well as it is used to do querySelector or invoke getElementById, getElementsByClassName and similar methods
    // for appending an element we use rootContainer because root.append will work in case of shadowRoot but if root is document then document.append will not work

    if(!options.root) {
        options.root = document;
        options.rootContainer = document.body
    } else {
        options.rootContainer = options.root
    }
    // for setting codeBlock root,
    // we are copying the options.root to options.codeBlockRoot because this options.codeBlockRoot may change if we move the editor div to somewhere inside
    // or outside the shadow dom, in those cases we need to update the codeBlockRoot to the current root, there the codeBlock nodes created henceforth
    // will have this updated root, while the previously present codeblock nodes will be iterated in updateCodeMirrorRoot function
    // and their root will be updated, the options.root value is still persisted because we need this value when zwRteView.destory() method is called
    // becuase this method inturn calls all the destroy method of menu items such as LinkMenu where 
    // this.rteView.options.root.querySelector(`#popover-for-${this.id}`).remove(); is called, so we need to retain the options.root value
    options.codeBlockRoot = options.root
}

export function setContext() {
    $rteZc.context = this.options.root
}

var setContextForRTEComponents = function(rteView) {
    // for shadowRoot we need to set context, if no shadowRoot then context will be document by default
    $rteZc.context = rteView.options.root
    // for editors in different shadow roots, we need to set $rteZc.context to the current editor's shadow root for zohocomponents to work properly
    // this value is set on every mouseenter into rteView.dom because, if you click an editor's menubar, it would work only if the context is
    // set before hand itself, so the best time to set is during mouseenter into rteView.dom
    rteView.boundedSetContext = setContext.bind(rteView)
    rteView.dom.addEventListener('mouseenter', rteView.boundedSetContext)
}

var registerBasicCommands = function(rteView) {
    rteView.registerCommand({
        performEnter: RTECommands.performEnter
    })
}

var processCommandConfigurations = function(options, rteView) {

    registerBasicCommands(rteView)

    options.formats.forEach(function(format) {
        var name = typeof format === 'string' ? format : format.name;
        var conf = RichTextEditor.getConf()[name];
        conf && conf.registerCommand && conf.registerCommand(rteView);
    })

    options.features.forEach(function(feature) {
        var name = typeof feature === 'string' ? feature : feature.name;
        var conf = RichTextEditor.getConf()[name];
        conf && conf.registerCommand && conf.registerCommand(rteView);
    })
}

var shouldAutodetectLinks = function(options) {
    let linkFeatureConf = getFeatureConfigFromOpts('link', options)
    if(linkFeatureConf && linkFeatureConf.autodetect === false) { 
        return linkFeatureConf.autodetect
    } else if (!linkFeatureConf) {
        return false
    } else {
        return true
    }
} 

/**
     * generates plugins from options
     * NOTE: SHOULD NOT CHANGE THE ORDER OF PLUGIN ARRAY UNLESS NEEDED
     * @param {*} options
     * @param {*} schema
     */
var generatePlugins = function(options, schema, rteView) {
    // plugin list
    var plugins = [];

    // add plugins from options if any
    if (options.plugins) {
        plugins = plugins.concat(options.plugins)
    }
    plugins.push(history()); // adds undo redo functionality
    plugins.push(RTECustomPlugins.manageEditabilityPlugin(rteView))

    // Note: Do add this plugin before plugins in featureConf and shortcuts plugin gets added because
    // if plugins in featureConf gets added then tables plugin will get added first as a result if a list is created within tables and 
    // while trying to create a nested list if the user presses the tab key instead of creating the nested list the cursor will move to the next cell
    // because tables plugin adds a rule where if tab key is pressed within a table, move the cursor to the next cell
    // similarly if shorcuts plugin gets added first then........ after creating a list, the user intends to create a nested list by pressing the tab key, but the
    // the shortcuts plugin inserts a tab character because of pressing the tab key
    // inorder to avoid both of the above cases do push the lists plugin first
    if(getFeatureConfigFromOpts('list', options) || getFeatureConfigFromOpts('indent', options) || getFeatureConfigFromOpts('checkList', options)) {
        plugins.push(getListsPlugin(rteView))
    }

    var features = options.features;
    features.forEach(function(feature) {
        var name = typeof feature === 'string' ? feature : feature.name;
        var config = RichTextEditor.getConf()[name];
        config &&
            config.addPlugin &&
            config.addPlugin(plugins, feature, rteView, schema);
    });

    var formats = options.formats;
    formats.forEach(function(feature) {
        var name = typeof feature === 'string' ? feature : feature.name;
        var config = RichTextEditor.getConf()[name];
        config &&
            config.addPlugin &&
            config.addPlugin(plugins, feature, rteView, schema);
    });

    if(options.regexReplacer) {
        plugins.push(RTECustomPlugins.regexReplacerPlugin(schema, options))
    }

    if (options.handleDOMEvents) {
        plugins.push(
            RTECustomPlugins.keyEventHandlersPlugin(options.handleDOMEvents)
        );
    }

    plugins.push(RTECustomPlugins.drawDecorationsPlugin(rteView));
    // plugins.push(RTECustomPlugins.drawMergeFieldDecorations());
    plugins.push(RTECustomPlugins.throwDomEventsPlugin());

    // we want to push this plugin before Shortcuts.generate(schema, rteView) plugin and keymap(baseKeymap) plugin
    // so that the user can override the default shortcuts added by us.
    // for eg: if user want to override the enter key bhaviour
    // (cliq team does this, because they may use enter key for sending meesage,
    // shift + enter key to move to next line or even vice versa based on user settings),
    // then we need to pass this plugin followed by the other 2 plugins
    // so that whenever enter key is pressed it firsts comes to this plugin only if it returns false, it moves to other plugins
    // else if this plugin returns true, then it will not move to other plugins
    plugins.push(getShortcutsPlugin())

    plugins.push(
        keymap(Shortcuts.generate(schema, rteView))
    ); // keyboard shortcuts for schema
    plugins.push(
        keymap(baseKeymap)
    ); // keyboard shortcuts for basic functions.
    plugins.push(RTECustomPlugins.SandboxKeyDownEventsPlugin()); // to stop Writer main editor from reacting to keydown events from this editor.

    //only if there is any formats is required push this plugin else don't push it.......
    //mainly this check was put because in auto-suggestions customGetMatch() gets called twice for every character insertion because
    //the first time it gets called for the tr that is passed for character insertion
    //the second time it gets called for tr that is passed by globalStoredMarks plugin for setting the tr.setStoredMarks()
    if(options.formats.length > 0 && options.keepFormatsAcrossBlocks !== false) { 
        plugins.push(RTECustomPlugins.globalStoredMarksPlugin(rteView))// to store marks globally
    }

    plugins.push(RTECustomPlugins.CursorEventsPlugin(schema)); // to activate menu buttons based on current cursor context

    if (options.placeholder) {
        plugins.push(
            RTECustomPlugins.placeholderPlugin(options.placeholder)
        ); // adds placeholder in editor
    }

    if(shouldAutodetectLinks(options, rteView)) {
        plugins.push(RTECustomPlugins.LinkDetectionPlugin(schema, rteView));
    }

    if(options.transformPastedHTML) {
        plugins.push(RTECustomPlugins.pastePreProcessPlugin(options.transformPastedHTML))
    }
    
    
    //to create an ordered list when "1. " is typed
    function addOrderedListShortcut() {
        /**
         * Once we come out of a list and immediately press "1. " we would get attached to the before list itself.
         */
        return wrappingInputRule(/^(1)\.\s$/, schema.nodes.orderedList)
        /**
         * The below return statement passes two more functions as parameters inorder to create a new ordered list once we press "1. " immediately after we come out of previous ordered list.
         */
        // return wrappingInputRule(/^(1)\.\s$/, schema.nodes.orderedList, function(match) {return ({ order: +match[1] })} ,function(match, node) {return node.childCount + node.attrs.order == +match[1]})
    }

    //to create an unordered list when "* " is typed
    function addBulletListShortcut() {
        /**
         * Once we come out of a list and immediately press "* " we would get attached to the before list itself.
         */
        return wrappingInputRule(/^\s*([*])\s$/, schema.nodes.bulletList)
        /**
         * The below return statement passes two more functions as parameters inorder to create a new bullet list once we press "* " immediately after we come out of previous bullet list.
         */
        // return wrappingInputRule(/^\s*([*])\s$/, schema.nodes.bulletList, function(match) {return ({ order: +match[1] })} ,function(match, node) {return node.childCount + node.attrs.order == +match[1]})
    }

    function buildInputRules() {
        let rules=[];

        if(schema.nodes.bulletList) {
            rules.push(addBulletListShortcut())
        }   

        if(schema.nodes.orderedList) {
            rules.push(addOrderedListShortcut())
        }

        if(schema.nodes.checkListItem) {
            // if "[] " this is typed in starting of line need to insert unchecked checkListItem
            // if "[x] " this is typed in starting of line need to insert checked checkListItem
            rules.push(wrappingInputRule(/^\[\]\s$/, schema.nodes.checkListItem))
            rules.push(wrappingInputRule(/^\[x\]\s$/, schema.nodes.checkListItem, { isChecked: true }))

        }
        return inputRules({rules})
    }

    plugins.push(buildInputRules())

    if(schema.nodes.table)
    {
        plugins.push(columnResizing())
        if(!options.rtl) {
            // if rtl is set to true, then this plugin causes problems for arrow key movements within the tables, so don't add this plugin.
            plugins.push(tableEditing())
        }
        plugins.push(gapCursor())//plugin to move the cursor out of a table
    }

    return plugins;
};

/**
     * gives the attributes of node from jsonContent
     * @param {String} nodeName
     * @param {Node} parentNode
     */
var getNodeAttrs= function(nodeName, parentNode) {
    var attrs = [];
    parentNode.content.nodesBetween(0, parentNode.content.size, function(
        node,
        pos,
        parent,
        index
    ) {
        if (node.type.name === nodeName) {
            attrs.push(node.attrs);
        }
    });
    return attrs;
};

/**
     * creates a text node for given text
     * @param {String} text
     * @param {*} schema
     */
var getTextNode = function(text, schema) {
    return schema.text(text);
};

/**
 * creates a mention node for given mailid
 * @param {*} emailId
 * @param {*} schema
 */
var getMentionNode = function(emailId, schema) {
    var attrs = {
        name: emailId.split('@')[1],
        email: emailId.slice(1) //no i18n
    };
    return schema.node('mention', attrs); //no i18n
};

 var getLinkNode = function(text, schema) {
    var link = schema.mark('link', { href: text });	// NO I18N
    return schema.text(text, link);
};

/**
     * inserts Plain text into the editor
     * checks for mention elements and if found with values required for mention node replaces it with mention node
     * @param {String} text
     * @param {*} schema
     */
var findMentionsInText = function(text) {
    var mentions = [];
    var mentionRegex = /@([\w\.\+-]+)@([\w-]+)\.([a-zA-Z\.]{2,22}(\.[a-zA-Z]{2}){0,2})/g;
    for (
        var match = mentionRegex.exec(text);
        match !== null;
        match = mentionRegex.exec(text)
    ) {
        mentions.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'mention'	// NO I18N
        });
    }
    return mentions;
};

var findLinksInText = function(text) {
    var links = [];
    var linkRegex = /(^|\s)((http|ftp|https|www\.)(:\/\/|)[\w-]+(\.[\w-]+)+([\w.,@?^=\(\)%&amp;:\/~+#-]*[\w@?^\(\)=%&amp;\/~+#-])?)($|\s)/g;
    for (
        var match = linkRegex.exec(text);
        match !== null;
        match = linkRegex.exec(text)
    ) {
        var prefixPadding = match[1].length; // first captured group's length
        var link = match[2]; // second capture group
        var start = prefixPadding + match.index;
        links.push({
            start: start,
            end: start + link.length,
            type: 'link'  // NO I18N
        });
    }
    return links;
};

/**
     * inserts Plain text into the editor
     * checks for mention elements and if found with values required for mention node replaces it with mention node
     * @param {String} text
     * @param {*} schema
     *
     * TODO: write unit tests for this utility
     */
var getNodeFromText = function(text, schema) {
    var paraSplitRegex = /\n/;
    // var paraElements = text.split(paraSplitRegex);
    var paras = text.split(paraSplitRegex);
    var paraNodes = [];

    paras.forEach(function(paraText) {
        var mentions = findMentionsInText(paraText);
        var links = findLinksInText(paraText);
        var ranges = mentions.concat(links).sort(function(rng) {
            return rng.start;
        });
        var childNodes = [];
        var textRun = '';

        var getRangeWithStart = function(i) {
            return ranges.filter(function(rng) {
                return rng.start === i;
            })[0];
        };

        for (var i = 0; i <= paraText.length; ) {
            // var node = nodes.filter(isNewNodeStart(i))[0];

            var node = getRangeWithStart(i);

            var isLastIteration = i === paraText.length - 1;

            // cut and push textRun if necessary
            if (node && textRun) {
                childNodes.push(getTextNode(textRun, schema));
                textRun = '';
            }

            if (node && node.type === 'mention' && schema.nodes.mention) {
                // if mentionStart or link start, push node
                var mentionNode = getMentionNode(
                    paraText.substring(node.start, node.end),
                    schema
                );
                childNodes.push(mentionNode);
                i += node.end - node.start;
            } else if (node && node.type === 'link' && schema.marks.link) {
                var linkNode = getLinkNode(
                    paraText.substring(node.start, node.end),
                    schema
                );
                childNodes.push(linkNode);
                i += node.end - node.start;
            } else {
                // if not a special node, just add char to text run
                textRun += paraText[i];
                i++;
            }

            // cut and push textRun if last iteration
            if (isLastIteration && textRun) {
                childNodes.push(getTextNode(textRun, schema));
                textRun = '';
            }
        }

        paraNodes.push(
            makeParentNode('paragraph', childNodes, schema) //no i18n
        );
    });

    return makeParentNode('doc', paraNodes, schema); //no i18n
};

/**
     * constructs a parentNode from childnode or childnode array
     * @param {doc | paragraph} parentNodeName
     * @param {*} nodeArray
     * @param {*} schema
     */
var makeParentNode = function(parentNodeName, nodeArray, schema) {
    if (nodeArray) {
        return schema.node(parentNodeName, null, nodeArray);
    } else {
        return schema.node(parentNodeName);
    }
};

var getFeatureMap = function(features) {
    var map = {};
    features.forEach(function(feature) {
        var name = typeof feature === 'string' ? feature : feature.name;
        map[name] = feature;
    });
    return map;
};

/**
     * 
     * @param {*} view 
     * @param {*} tr 
     * For proofing in comments link is given inclusive true
     * So it behaves like other marks
     * Inorder to provide normal link behaviour, we had externally made link to behave like its normal flow
     * This method will be called whenever view is updated
     * 
     */
export var resetLinkBehaviour = function(state, tr) {
    var range = tr.selection.ranges[0];
    var docSize = tr.doc.content.size;
    var nodeAtCurPos = tr.selection.$cursor;
    var isStart = range.$from.pos <= 1;
    var posAfter = range.$to.pos < docSize && range.$to.pos + 1;

    var parentNode = tr.selection.$from.parent
    var isPara = parentNode.type.name === 'paragraph'
    var isParaStart = isPara && tr.selection.$from.parentOffset === 0
    // check 1 & 2 : checks whether there is someContent after given range and there is node at cursor pos
    if (posAfter && nodeAtCurPos) {
        // marks will be in nodeAtCurPos
        // in someCases will get mark from state.storedmarks (forgot those cases)
        var marks = tr.storedMarks || nodeAtCurPos.marks();
        var link = state.schema.marks.link.isInSet(marks);
        // check 1 : if the cursor point has link
        // check 2 : if link at start remove from storedMark and no docChange(only navigation)
        // don't remove if there is a docChange when cursor is at start(possible actions del/backspace which needs this behaviour)
        // check 3 : also it checks whether the next char after cursor don't have link mark
        // if there is no link after the current cur pos, remove link from storedMarks
        // check 4 : if the cursor is at start of para, then through globalStoredMarks Plugin,
        // the link mark will be added to storedMarks, if the text at the start of para has a link mark
        // so if the cursor is at start of para and there is link mark in storedMarks, then remove it
        if (
            link &&
            ((isStart && !tr.docChanged) || !state.schema.marks.link.isInSet(tr.doc.resolve(posAfter).marks()) || (isPara && isParaStart))
        ) {
            tr.removeStoredMark(link);
        }
    }
    return tr;
};

// this will be called for every view updation
var dispatchTransaction = function(tr) {
    if( this.state.schema.marks.link ){
        tr = resetLinkBehaviour(this.state, tr);
    }   
    this.updateState(this.state.apply(tr));
    var newState = this.state
    
    if(this.rteView.options.onEditorStateUpdate && tr.steps.length!==0) {
        this.rteView.options.onEditorStateUpdate(newState, this.rteView)
    }
};

/** when kaspersky security plugin is enabled, inorder find element inside paragraph node
jquery adds an id, which triggers mutation observer
inorder to avoid reacting to that action, mutation is ignored for that action alone
else this will lead to infinite looping thereby crashing the editor
stopping id change on para is enough for this issue.
ref : https://git.csez.zohocorpin.com/writer/zohowriter/-/issues/175         */
var paraNodeView = function() {
    return {
        ignoreMutation: function(mutationRecord) {
            if (mutationRecord.type == 'attributes') {//no i18n
                return mutationRecord.attributeName === 'id' ? true : false; //no i18n
            }
            return false;
        }
    };
};

var getNodeViews = function(options) {
    var nodeViews = { paragraph: paraNodeView };

    options.formats.forEach(function(format) {
        var name = typeof format === 'string' ? format : format.name;
        var conf = RichTextEditor.getConf()[name];
        conf && conf.getNodeViews && Object.assign(nodeViews, conf.getNodeViews(options));
    })

    options.features.forEach(function(feature) {
        var name = typeof feature === 'string' ? feature : feature.name;
        var conf = RichTextEditor.getConf()[name];
        conf && conf.getNodeViews && Object.assign(nodeViews, conf.getNodeViews(options));
    })

    return nodeViews
};

var serializeNodes = function(rteView) {
    let view = rteView.editorView
    var jsonState = view.state.toJSON()
    
    var clonedState = EditorState.fromJSON({schema: view.state.schema, plugins: view.state.plugins}, jsonState)
    var nodeSerializer = NodeSerializer(clonedState.schema, 'emoji', {hasZomoji: rteView._featureMap.emoji.hasZomoji});   //no i18n
    var serializedNodes = nodeSerializer.serializeFragment(clonedState.doc.content);
    var tr = clonedState.tr.replaceWith(0, clonedState.doc.content.size, serializedNodes);
    
    return clonedState.apply(tr);//don't call dispatch here it will lead to infinite loop problem
};


export default class RichTextEditorView {

    constructor(element, options) {
        this.options = constructOptions(options || {});
        this.pluginKeys = {};
        this.proofing = null;
        this._featureMap = getFeatureMap(this.options.features); // to form a feature name -> options map
        this.init(element);
        this.postInit();
    }

    /**
     *
     * @param* {*} element  // non-contenteditable div where you need to have your rich text editor
     * @param* {JSONObject} options   options = {formats :[] , features:[] , menubar: 'true|false', placeholder: '', className: '', keyHandlerCallback: {}}
     * @param {JSONObject} docContentJson  // Initial content in editor. If you have content as JSONObject of proseMirror
     * @param {String} plainText    // Initial content in editor. From plain text
     *
     * formats:     should be array of String from RichtextEditor.CONST.*
     *              Formats available are bold, italic, underline, highlight and link
     *
     * features:    should be an array which can have following values
     *              rteMentions -> JSONObject {
     *                     name: 'mention',      ///name should be mention and it is a mandatory key for atmention
     *                     getSuggestions: function(type, text, callback, extras, view),  /// should pass the filtered contacts as an array to the callback
     *                         // type: 'mention' | 'hashtag'
     *                         // text: query text after @ in the editor
     *                         // callback: should pass filtered contacts as argument to callback. callback(arrayOfFilteredContacts)
     *                         // extras: the extra values passed during the time of init
     *                         // view : editorView
     *                     extras: Any value that is needed for getSuggestions
     *                 }
     * menubar  // pass false if meubar is not needed.NOTE: Link, highlight depends on menubar. So disabling menubar will disable those formats too
     * placeHolder  // placeholder when edior is empty
     * className  // class to be applied div
     * keyHandlerCallback  : {  // callbacks for enter and escape key
     *                  escKeyCallback : function()  // callback that should be called when esc key is pressed
     *              }
     *
     */
     init(element) {
        // this.id = 'rte-' + Math.floow(M)
        registerDefaultElements()
        var state = getState(this);
        var attributes = getAttributes(this.options);
        
        element.innerHTML = '';
        this.dom = element
        
        setRootElement(this.options)

        setContextForRTEComponents(this)

        this.editorView = new EditorView(element, {
            state: state,
            attributes: attributes,
            dispatchTransaction: dispatchTransaction,
            nodeViews: getNodeViews(this.options)
        });
        this.editorView.updateRoot = function() {
            this._root = null
        }

        // set a random id to this instance
        this.id = 'rte-view-' + Math.floor(Math.random()*10000000)

        // Temporary: to get reference back from editorView to rteView
        this.editorView.rteView = this;
    }


    postInit() {
        
        setRootElement(this.options)

        processCommandConfigurations(this.options, this);

        if (this.options.menubar !== false) {
            this.menubar = new MenubarView(this, this.options);
            // call each optional feature's implementation for addToMenubar
            processMenubarConfigurations(this.options, this);
            // process custom menubar config
            if (this.options.menubar.customMenuItems && this.options.menubar.customMenuItems.length > 0) {
                var menuoptions = this.options.menubar.customMenuItems;
                
                var rightGroupId = 'custom-right-group'
                this.menubar.setGroupContext(rightGroupId)
                createRightEmptyGroup(rightGroupId, this)

                // since custom menu option is included, insert a group container in the right side
                menuoptions.forEach(menuoption => {
                    this.menubar.addMenu(menuoption)
                })

                this.menubar.resetGroupContext()
            }

            if(this.options.menubar.responsive || this.options.menubar.responsive === undefined) {
                constructMoreOption(this)
            }
        }

        if (getFeatureConfigFromOpts('proofing', this.options)) {
            var userProofingOpts = getFeatureConfigFromOpts('proofing', this.options)
            this.initializeProofing(this.editorView.dom, userProofingOpts)
        }

        // set css variables for light/dark theme based on options
        this.setThemeConfig()
        // set general css variables for editor such as table border width, etc.
        this.setEditorSpecificCssVariables()
        this.onInitComplete()
    }

    onInitComplete() {
        this.editorView.dispatch(this.editorView.state.tr.setMeta('editorInitialized', true));
    }

    /**
     * pass a div here to which proofing should be initialized
     * @param {*} div
     * @param {} cb
     * returns proofing
     */
    initializeProofing(div, userProofingOpts) {
        let rteView = this

        if(!RichTextEditor.onProofingMinAllLoad) {
            var defaultProofingVersion = '5_9'
            var proofingVersion = userProofingOpts.version || defaultProofingVersion

            RichTextEditor.onProofingMinAllLoad =  new Promise(function(resolve, reject) {
                RichTextEditor.loadJS('https://static.zohocdn.com/bluepencil/v' + proofingVersion + '/js/zbluepencil_web_min_all.js', resolve, reject)
            })

            RichTextEditor.onProofingMinAllLoad.then(() => {
                let bluePencilOpts = {
                    from: 'rte',
                    onLoad: function () {
                        rteView.proofingOnLoad(div, userProofingOpts);
                    }
                }

                if(userProofingOpts.zsoid) {
                    bluePencilOpts.zsoid = userProofingOpts.zsoid
                }

                if(userProofingOpts.getAuthToken) {
                    bluePencilOpts.getAuthToken = userProofingOpts.getAuthToken
                }

                ZBluePencil.load(bluePencilOpts)
            }).catch((error) => {
                console.log("Error while loading proofing: ", error) //no i18n
            })
        } else {
            RichTextEditor.onProofingMinAllLoad.then(() => {
                rteView.proofingOnLoad(div, userProofingOpts);
            })
        }
    }

    proofingOnLoad(div, userProofingOpts) {
        var proofingInstance = ZBluePencil.getInstance(div, userProofingOpts.instanceOpts);
        if(userProofingOpts.check === 'spell') {
            proofingInstance.checkSpell(userProofingOpts.language);
        } else if(userProofingOpts.check === 'grammar') {
            proofingInstance.checkGrammar(userProofingOpts.language);
        } else {
            proofingInstance.checkStyle(userProofingOpts.language);
        }

        this.proofingInstance = proofingInstance
        userProofingOpts.onLoad && userProofingOpts.onLoad(this)
    }

    getJSON() {
        var json = this.editorView.state.doc.toJSON();
        if(this._featureMap.emoji) {
            try {
                var newState = serializeNodes(this);
                json = newState.doc.toJSON();
            } catch (e){
                // console.log("Error occured while converting doc to toJSON")   //no i18n
            }
        }
        return json;
    }

    getHTML(inlineStyleOptions) {
        var domSerializer = DOMSerializer.fromSchema(this.editorView.state.schema)
        return RichTextEditor.getHTML(this.getJSON(), this.options, domSerializer, inlineStyleOptions)
    }

    setHTML(htmlString) {
        var view = this.editorView
        var state = view.state
        var shadowEl = document.createElement('div')
        htmlString = RichTextEditor.processHTMLByRemovingInlineStyles(htmlString)
        shadowEl.innerHTML = htmlString
        var newDocNode = DOMParser.fromSchema(state.schema).parse(shadowEl, { preserveWhitespace: this.options.whiteSpace === "collapse" ? false : true })
        var tr = state.tr.replaceWith(0, state.doc.content.size, newDocNode.content)
        view.dispatch(tr)
    }

    setJSON(JSONContent) {
        var view = this.editorView
        var state = view.state
        var newDocNode = state.doc.constructor.fromJSON(state.schema, JSONContent)
        var tr = state.tr.replaceWith(0, state.doc.content.size, newDocNode.content)
        view.dispatch(tr)
    }

    insertHTML(htmlString, from, to) {
        var view = this.editorView
        var state = view.state
        var shadowEl = document.createElement('div')
        htmlString = RichTextEditor.processHTMLByRemovingInlineStyles(htmlString)
        shadowEl.innerHTML = htmlString
        var htmlSlice = DOMParser.fromSchema(state.schema).parseSlice(shadowEl, { preserveWhitespace: this.options.whiteSpace === "collapse" ? false : true })
        var tr = state.tr
        if(!from && !to) {
            tr = state.tr.replaceSelection(htmlSlice)
        } else if(!to) {
            tr = state.tr.replace(from, from, htmlSlice)
        } else {
            tr = state.tr.replace(from, to, htmlSlice)
        }
        view.dispatch(tr)
    }

    insertText(text, from, to) {
        var view = this.editorView
        var state = view.state
        var tr;
        if(!from && !to) {
            tr = state.tr.insertText(text)
        } else if(!to) {
            tr = state.tr.insertText(text, from, from)
        } else {
            tr = state.tr.insertText(text, from, to)
        }
        view.dispatch(tr)
    }

    focus() {
        this.editorView.focus();
    }

    /**
     * toggles editor btwn readOnly and edit mode
     * @param {boolean} isEditable  pass true in editor should be editable
     *                              pass false if editor should be read only
     */
    setEditable(isEditable) {
        this.editorView.setProps({
            editable: function() {
                return isEditable;
            }
        });

        // when rte.editable is set to false or true we need to explicitly set code_blocks.editable also because nodeViews continue to work even when editor is set to
        // changed to readOnly mode, so iterate all the code_block nodes in rte and change it's readOnly attribute

        var tr = this.editorView.state.tr
        var findChildrenByType = PMExports.prosemirrorUtils.findChildrenByType
        var codeBlockNode = this.editorView.state.schema.nodes.code_block
        var docNode = this.editorView.state.doc

        var listOfCodeBlockNodesInDocNode = findChildrenByType(docNode, codeBlockNode)

        listOfCodeBlockNodesInDocNode.forEach((currentCodeBlockNodeProperties) => {
            let node = currentCodeBlockNodeProperties.node
            let pos = currentCodeBlockNodeProperties.pos
            tr = tr.setNodeMarkup(pos, node.type, {...node.attrs, readOnly: !isEditable}, node.marks)
        })

        tr = tr.setMeta('editable', 'toggled')
        this.editorView.dispatch(tr)
        this.editorView.focus()
    }

    /**
     * Resets value in editorView
     * NOTE: If no value passed as json, Only the value gets reset. History remains preserved .
     *
     */
    reset(json) {
        if (json) {
            this.options.content = json;
            var newState = getState(this);
            this.editorView.updateState(newState);
        } else {
            var transaction = this.editorView.state.tr.delete(0, this.editorView.state.doc.content.size);
            this.editorView.dispatch(transaction);
        }
    }

    destroyPluginDomEl(pluginArr) {
        pluginArr.forEach(function(plugin){
            plugin.props && plugin.props.destroy && plugin.props.destroy();
        }, this);
    }

    /**
     * removes editorView
     *
     */
    remove() {
        setContext.bind(this)() // if while calling editor.remove(), the context for components is set to someother editor, then components will not be
        // destroyed properly, so inorder to avoid that, before destroying for safer side set the context to the current editor and then destroy it.
        this.menubar && this.menubar.destroy(this.editorView);
        this.editorView.destroy();
        this.dom.removeEventListener('mouseenter', this.boundedSetContext)
        if (getFeatureConfigFromOpts('proofing', this.options)) {
            this.proofingInstance.destroyInstance()
        }
        this.destroyPluginDomEl(this.editorView.state.plugins)
        Object.keys(this).forEach(function(key){
            delete this[key];
        },this);

        // TODO: destroy view from dom
        // destroy menubar from dom
        // send editorView to garbage
    }

    /**
     * Returns true if editor is empty
     *
     */
    isEmpty() {
        var doc = this.editorView.state.doc;
        var isEmpty = doc.childCount === 1 && doc.firstChild.isTextblock && doc.firstChild.content.size === 0;
        return isEmpty;
    }

    /**
     * returns plain text from json
     * replaces at mention node with mailid
     * @param {*} json
     * @param {*} view
     */
    getText(json, serializer) {
        var str = '';
        var defaultTextSerializer = {
            paragraph: function(node, pos, parent, index) {
                if (index != 0) {
                    return '\n'; //no i18n
                } else {
                    return '';
                }
            },

            text: function(node) {
                var str = '';
                var linkMark = node.marks.filter(function(mark) {
                    return mark.type.name === 'link';
                });
                var nodeHasLinkMark = linkMark.length;
                if (nodeHasLinkMark) {
                    str += '[' + node.text + ']';
                    str += '(' + linkMark[0].attrs.href + ')'; //no i18n
                } else {
                    str += node.text;
                }
                return str;
            },

            mention: function(node) {
                return '@' + node.attrs.email;
            },

            br: function(node) {
                return '\n';
            },

            emoji: function(node) {
                return ':' + node.attrs.emojiName + ':';
            }
        }

        var serializer = Object.assign({}, defaultTextSerializer, serializer);

        var docNode = json ? getNodeFromJSON(json, this.options) : this.editorView.state.doc;
        var self = this;
        docNode.content.nodesBetween(0, docNode.content.size, function(node, pos, parent, index) {
            var nodeTextSerializer = serializer[node.type.name];
            if (!nodeTextSerializer) {
                nodeTextSerializer = self.editorView.state.schema.nodes[node.type.name] && self.editorView.state.schema.nodes[node.type.name].spec.toText
            }
            if (nodeTextSerializer) {
                str += nodeTextSerializer(node, pos, parent, index);
            }
        });
        return str;
    }

    getNodeAttrsFromJSON(nodeName, json) {
        var parentNode = getNodeFromJSON(json, this.options);
        return getNodeAttrs(nodeName, parentNode);
    }

    setproofing(proofing) {
        this.proofing = proofing;
    }

    getproofing() {
        return this.proofing;
    }

    removeproofing() {
        this.proofing = null;
    }

    hasproofing() {
        return this.proofing ? true : false;
    }

    getRTEElement() {
        return this.editorView.dom;
    }

    setPlaceholder(text) {
        var transaction = this.editorView.state.tr.setMeta('setPlaceholder', text); //no i18n
        this.editorView.dispatch(transaction);
    }
    
    insertMergeField(mergeJSON) {
        var view = this.editorView;
        if (!view.state.schema.nodes.mergefield) {
            return;
        }
        var node = view.state.schema.nodes.mergefield.create(mergeJSON);
        var tr = view.state.tr.replaceWith(view.state.selection.$from.pos, view.state.selection.$to.pos, node);
        //dont do updateState because we want all the state updations to be passed through our dispatchTransaction() function inorder to globally store the marks
        // var newState = view.state.apply(tr);
        // view.updateState(newState);
        view.dispatch(tr)
        view.focus();
    }

    insertNode(nodeName, attrs, from, to) {
        var view = this.editorView;
        var from = from || view.state.selection.$from.pos
        var to = to || view.state.selection.$to.pos

        if (!view.state.schema.nodes[nodeName]) {
            throw new Error('Unknown nodeType. Make sure the nodeType is defined in the schema: ', view.state.schema);
        }
        var node = view.state.schema.nodes[nodeName].create(attrs);
        var tr = view.state.tr.replaceRangeWith(from, to, node);
        //dont do updateState because we want all the state updations to be passed through our dispatchTransaction() function inorder to globally store the marks
        // var newState = view.state.apply(tr);
        // view.updateState(newState);
        view.dispatch(tr)
        view.focus();
    }

    getMountedNode(name) {
        var mountElementId = '#rte-mount-' + name; // no i18n
        return this.menubar.el.querySelector(mountElementId);
    } 

    handleScroll(){
        let pluginArr = this.editorView.state.plugins
        pluginArr.forEach(function(plugin){
            plugin.props && plugin.props.handleExternalScroll && plugin.props.handleExternalScroll();
        }, this);
    }

    getPlugin(key) {
        var pluginAPIObj = new PluginAPI(this.pluginKeys[key].get(this.editorView.state))
        return pluginAPIObj
    }

    registerCommand(commands) {
        this.commands = this.commands || {}
        for (var cmd in commands) {
            commands[cmd] = commands[cmd].bind(this);
        }
        Object.assign(this.commands, commands)
    }

    registerShortcut(keyCombination, functionToExecute) {
        let metaObj = {}
        metaObj[keyCombination] = functionToExecute
        let view = this.editorView
        let tr = view.state.tr
        view.dispatch(tr.setMeta(RTEConstants.ADD_SHORTCUTS, metaObj))
    }

    execCommand(command, params) {
        var commandFn = this.commands[command];
        if (!commandFn) {
            throw new Error("Command not found: " + command)
        }
        commandFn.apply(this, params)
    }

    getFeatureConfig (name) {
        return getFeatureConfigFromOpts(name, this.options)
    }

    setOnChangeListener(updateStateFunction) {
        this.options.onEditorStateUpdate = updateStateFunction
    }

    removeOnChangeListener() {
        this.options.onEditorStateUpdate = null
    }

    getSelection() {
        return this.editorView.state.selection
    }

    setSelection(from, to) {
        if(!to) { // from and to would point to the same position if to position is not provided
            to = from
        }

        var $from = this.editorView.state.doc.resolve(from)
        var $to = this.editorView.state.doc.resolve(to)
        var selection = new TextSelection($from, $to)

        var dispatch = this.editorView.dispatch
        var tr = this.editorView.state.tr
        tr = tr.setSelection(selection)
        dispatch(tr)
    }

    updateRoot(root) {
        this.editorView.updateRoot()
        if(getFeatureConfigFromOpts("code_block", this.options)) {
            updateCodeMirrorRoot(root, this)
        }
        this.options.root = root
        setRootElement(this.options)
    }

    setEditorSpecificCssVariables() {
        for(let cssVar in this.options.editorSpecificCssVariables) {
            this.dom.style.setProperty(cssVar, this.options.editorSpecificCssVariables[cssVar])
        }
    }

    setThemeConfig() {
        this.options.isDarkThemeEnabled ? this.enableDarkTheme() : this.enableLightTheme()
    }

    enableDarkTheme(colorOptions) {
        enableDarkThemeForEditor(colorOptions, this)
    }

    enableLightTheme(colorOptions) {
        enableLightThemeForEditor(colorOptions, this)
    }

    copy() {
        var domSerializer = DOMSerializer.fromSchema(this.editorView.state.schema)
        var target = document.createElement('div')
        var jsonContent = this.editorView.state.selection.content().content
        domSerializer.serializeFragment(jsonContent, document, target)
        return target
    }

    cut() {
        var target = this.copy()

        // delete the current selection
        var view = this.editorView
        var dispatch = view.dispatch
        var tr = view.state.tr
        dispatch(tr.deleteSelection().scrollIntoView());

        return target
    }

    getCursorInfo() {
        return {
            marks: getMarks(this.editorView),
            paraAttrs: getParaAttrs(this.editorView),
            adjacentLink: getLinkMarkBeforeAndAfterCursorIfNotAtCursor(getMarks(this.editorView), this.editorView),
            path: getPath(this.editorView)
        }
    }
}

/**
 * Gives the elements needed to construct view
 * @param {*} options
 */
export function getAttributes(options) {
    var attributes = {};
    attributes.class = options.className ? (options.className + " ui-rte-editor-div ui-rte-editor") : "ui-rte-editor-div ui-rte-editor"; //no i18n
    // put default values in style attribute
    attributes.style = ''
    if (options.defaults.fontFamily) {
        // in options.default.fontFamily the value can be a string or an object with displayName and value properties
        if(typeof options.defaults.fontFamily === 'string') {
            attributes.style += 'font-family: ' + options.defaults.fontFamily + ';'
        } else {
            attributes.style += 'font-family: ' + options.defaults.fontFamily.value + ';'
        }
    }
    if (options.defaults.fontSize) {
        attributes.style += 'font-size: ' + options.defaults.fontSize + ';'
    }
    if (options.defaults.lineHeight) {
        attributes.style += 'line-height: ' + options.defaults.lineHeight + ';'
    }
    if(options.rtl) {
        attributes.dir = 'rtl'
    }
    if(options.whiteSpace !== "collapse") {
        attributes.style += 'white-space: break-spaces;'
    }
    return attributes;
}

// generate schema out of options
export function generateSchema(options) {
    if (!options) {
        options = Object.assign({}, defaultOpts, options);
    }
    var schema = new Schema({
        nodes: getSchema(options).nodes, // add certain default and compulsory nodes such as doc, paragraph
        marks: {} // gets the marks based on options.format
    });

    schema = addNodesFromOptions(schema, options); // gets the features (atmention/emoji) based on options.features
    schema = addMarksFromOptions(schema, options); // adds the formats from plugins such as font-size, font-color, font-background, etc.

    schema = extendNodes(schema, options)
    schema = createSchema(schema.spec.nodes, schema.spec.marks)

    return schema;
}

function extendNodes(schema, options) {
    schema.spec.nodes.forEach(nodeName => {
        let updatedSpec = extendSpec(nodeName, schema.nodes[nodeName].spec, options)
        let nodes = schema.spec.nodes.update(nodeName, updatedSpec)
        schema = createSchema(nodes, schema.spec.marks)
    })

    schema.spec.marks.forEach(markName => {
        let updatedSpec = extendSpec(markName, schema.marks[markName].spec, options)
        let marks = schema.spec.marks.update(markName, updatedSpec)
        schema = createSchema(schema.spec.nodes, marks)
    })
    return schema
}

/**
 * returns node from json
 * @param {*} json
 * @param {*} options
 * @param {*} schema
 */
export function getNodeFromJSON(json, options) {
    registerDefaultElements()
    var schema = generateSchema(options);
    var node = Node.fromJSON(schema, json);
    return node;
}

function updateCodeMirrorRoot(root, rteView) {
    var codeBlockNodeType = rteView.editorView.state.schema.nodes.code_block
    var docNode = rteView.editorView.state.doc
    var codeBlockNodes = PMExports.prosemirrorUtils.findChildrenByType(docNode, codeBlockNodeType)

    codeBlockNodes.forEach((codeBlockNode) => {
        let codeBlockViewId = codeBlockNode.node.attrs.id
        let codeBlockView = rteView.editorView.docView.children.find(nodeView => nodeView.spec && nodeView.spec.cm && nodeView.spec.cm.dom && nodeView.spec.cm.dom.id === codeBlockViewId)
        codeBlockView.spec.cm.setRoot(root)
    })
}

//returns empty object if feature/format is present in options as a string, if it is an object then it returns the object
export function getFeatureConfigFromOpts(name, options) {
    let featureObject = options.formats.filter(function(format) {
        if(format.name) {
            return format.name === name
        } else {
            return format === name
        }
    })[0]
    //if no such format is present check in features
    if(!featureObject) {
        featureObject = options.features.filter(function(feature) {
            if(feature.name) {
                return feature.name === name
            } else {
                return feature === name
            }
        })[0]
    }
    return typeof featureObject === "string" ? {} : featureObject
}