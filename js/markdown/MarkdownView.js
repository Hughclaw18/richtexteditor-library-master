import { EditorView as CodeEditorView, keymap as cmKeymap, placeholder as cmplaceholder } from '@codemirror/view';
import { Compartment } from '@codemirror/state'
import { indentWithTab, defaultKeymap, history as cmhistory } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { classHighlighter, tagHighlighter, tags } from "@lezer/highlight"
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from "@codemirror/theme-one-dark"
import markdownKeymap from './keymap';
import { registerMarkdownCommands } from "./commands";

import registerDefaultElements from "../FeatureConf";
import { getMarkdownOptions } from "./utils";
import { setRootElement, processMenubarConfigurations, constructMoreOption, setContext } from '../RichTextEditorView';
import MenubarView from "../menubar/MenubarView";
import { createRightEmptyGroup } from '../menubar/Utils'

export default class MarkdownView {

    constructor(element, options) {
        this.options = constructOptions(options || {});
        registerDefaultElements();
        this.init(element)
        this.postInit()
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
        this.dom = element
        
        // this.readOnly = new Compartment()
        this.theme = new Compartment()
    
        this.editorView = new CodeEditorView({
            doc: this.options.content || '',
            parent: element,
            extensions: [
                cmhistory(),
    
                markdownKeymap,
                // lineNumbers(),
                cmKeymap.of([indentWithTab, ...defaultKeymap]),
                // drawSelection(),
                syntaxHighlighting(defaultHighlightStyle),
                // javascript(),
                markdown({
                    addKeyMap: true,
                    base: markdownLanguage,
                    codeLanguages: function() {
                        return javascript().language
                    }
                }),
    
                syntaxHighlighting(classHighlighter),
                syntaxHighlighting(tagHighlighter([
                    {tag: tags.heading1, class: 'tok-heading-1'},
                    {tag: tags.heading2, class: 'tok-heading-2'},
                    {tag: tags.heading3, class: 'tok-heading-3'},
                    {tag: tags.heading4, class: 'tok-heading-4'},
                    {tag: tags.heading5, class: 'tok-heading-5'},
                    {tag: tags.heading6, class: 'tok-heading-6'},
                    {tag: tags.paren, class: 'tok-paren'},
                    {tag: tags.squareBracket, class: 'tok-squarebracket'},
                    {tag: tags.monospace, class: 'tok-monospace'}
                    
                ])),
    
                CodeEditorView.lineWrapping,
                CodeEditorView.updateListener.of(v => {
                    if (v.docChanged) {
                        this.options.onEditorStateUpdate && this.options.onEditorStateUpdate(v.state, v.view.rteView)
                    }
                }),
    
                this.theme.of(syntaxHighlighting(defaultHighlightStyle)),

                cmplaceholder(this.options.placeholder)
            ]
        })
    
                // set a random id to this instance
        this.id = 'rte-view-' + Math.floor(Math.random()*10000000)
    
        // Temporary: to get reference back from editorView to rteView
        this.editorView.rteView = this;
    
        this.editorView.dom.addEventListener("cmDarkMode", () => {
            this.editorView.dispatch({effects: this.theme.reconfigure(oneDark)})
        })
        this.editorView.dom.addEventListener("cmLightMode", () => {
            this.editorView.dispatch({ effects: this.theme.reconfigure(syntaxHighlighting(defaultHighlightStyle)) })
        })
    
        registerMarkdownCommands(this);
    }


    postInit() {
        
        setRootElement(this.options)

        // processCommandConfigurations(this.options, this);

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

        // set css variables for light/dark theme based on options
        // this.setThemeConfig()

    }

    /**
     * pass a div here to which proofing should be initialized
     * @param {*} div
     * @param {} cb
     * returns proofing
     */
    initializeProofing(div, cb) {
        // ZBluePencil.onLoad(function() {
        //     var proofing = ZBluePencil.getInstance(div, {show_card_icon: false}); // No i18n
        //     cb(proofing);
        // });
    }

    getJSON() {

    }

    getHTML(inlineStyleOptions) {

    }

    setHTML(htmlString) {

    }

    setJSON(JSONContent) {

    }

    insertHTML(htmlString, from, to) {

    }

    insertText(text, from, to) {

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
        // TODO: implement
    }

    /**
     * Resets value in editorView
     * NOTE: If no value passed as json, Only the value gets reset. History remains preserved .
     *
     */
    reset(content) {
        // TODO: implement
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
    }

    /**
     * Returns true if editor is empty
     *
     */
    isEmpty() {
        // TODO: implement
    }

    /**
     * returns plain text from json
     * replaces at mention node with mailid
     * @param {*} json
     * @param {*} view
     */
    getText() {
        // TODO: implement
        return zwRteView.editorView.state.doc.toString()
    }


    getRTEElement() {
        return this.editorView.dom;
    }

    setPlaceholder(text) {
        // TODO: implement
    }
    
    getMountedNode(name) {
        var mountElementId = '#rte-mount-' + name; // no i18n
        return this.menubar.el.querySelector(mountElementId);
    } 

    registerCommand(commands) {
        this.commands = this.commands || {}
        for (var cmd in commands) {
            commands[cmd] = commands[cmd].bind(this);
        }
        Object.assign(this.commands, commands)
    }

    registerShortcut(keyCombination, functionToExecute) {
        // TODO: implement
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
        // TODO: implement
    }

    setSelection(from, to) {
        // TODO: implement
    }

    updateRoot(root) {
        this.editorView.updateRoot()
        this.options.root = root
        setRootElement(this.options)
    }

    setThemeConfig() {
        // we have pointed the editor color related css variables and their values to rteView instance becuase of the reason mentioned in ./editor-themes/Themes.js file
        this.editorDarkThemeColors = editorDarkThemeColors
        this.editorLightThemeColors = editorLightThemeColors
        this.menubarDarkThemeColors = menubarDarkThemeColors
        this.menubarLightThemeColors = menubarLightThemeColors

        this.options.isDarkThemeEnabled ? this.enableDarkTheme() : this.enableLightTheme()
    }

    enableDarkTheme(colorOptions) {
        // TODO: implement
    }

    enableLightTheme(colorOptions) {
        // TODO: implement
    }

    copy() {
        // TODO: implement
    }

    cut() {
        // TODO: implement
    }

    getCursorInfo() {
        // TODO: implement
    }
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

var constructOptions = function(options) {
    var defaults = Object.assign({}, options.defaults); 
    var options = Object.assign({}, getMarkdownOptions(), options)
    // TODO: better deep merge both objects, instead of special handling nested objects
    options.defaults = defaults;
    return options;
}