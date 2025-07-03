import { EditorView as CodeEditorView, keymap as cmKeymap } from '@codemirror/view';
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

export function initMarkdown(element, options) {
    registerDefaultElements();
    this.dom = element
    
    // this.readOnly = new Compartment()
    this.theme = new Compartment()

    this.editorView = new CodeEditorView({
        doc: options.content || '',
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

            this.theme.of(syntaxHighlighting(defaultHighlightStyle))
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