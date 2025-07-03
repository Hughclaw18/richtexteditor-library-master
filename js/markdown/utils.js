import { schema as mdschema } from "prosemirror-markdown" 
import { Schema } from 'prosemirror-model';
import { getParser } from "./mdparser";
import { rteMarkdownSerializer } from "./mdserializer";
import { Node } from 'prosemirror-model';
import MarkdownIt from "markdown-it"
import { full as emoji } from 'markdown-it-emoji'
import markdownItFootNote from "markdown-it-footnote"
import checkboxplugin from './checkbox-markdownit-plugin'
import headingplugin from './anchoredheadings-markdownit-plugin'
import dompurify from "dompurify"

/**
 * Takes an RTE editor's output JSON 
 * and converts it into a JSON compatible with markdown parser's schema
 * 
 * This is a hack. Proper way is to modify whatever serializer converts json-2-md to work with RTE's schema. 
 * But is the effort worth it? We'll know if we run into problems. Until then we'll live with this simple hack.
 */
var toMdSchema = function(content) {
    return content.map(node => {
        if (node.type === 'paragraph') {
            
            if (node.attrs.type !== 'p') {
                return {
                    ...node,
                    type: 'heading',
                    attrs: {
                        level: +node.attrs.type.slice(1)
                    },
                    content: toMdSchema(node.content)
                }
            } else {
                return {
                    ...node,
                    content: toMdSchema(node.content || [])
                };
            }
        } else if (node.type === 'orderedList') {
            return {
                type: 'ordered_list',
                attrs: {
                    ...node.attrs,
                    tight: true
                },
                content: toMdSchema(node.content)
            }
        } else if (node.type === 'bulletList') {
            return {
                type: 'bullet_list',
                attrs: {
                    ...node.attrs,
                    tight: true
                },
                content: toMdSchema(node.content)
            }
        } else if (node.type === 'listItem') {
            return {
                type: 'list_item',
                content: toMdSchema(node.content)
            }
        } else if (node.type === 'br') {
            return {
                type: 'hard_break'
            }
        } else if (node.type === 'hr') {
            return {
                type: 'horizontal_rule'
            }
        } else if (node.type === 'text') {
            var marks = node.marks || [];
            marks = marks.map(m => {
                if (m.type === 'inlineQuote') {
                    return {
                        ...m,
                        type: 'code'
                    }
                } else {
                    return m
                }
            })
            return {
                type: 'text',
                text: node.text,
                marks: marks
            }
        } else if (node.content) {
            return {
                ...node,
                content: toMdSchema(node.content)
            }
        } else {
            return node;
        }
    })
}

/**
 * Reverse of toMDSchema() i.e Takes an Markdown parser's output JSON
 * and converts it into a JSON compatible with RTE's schema.
 * 
 * This is a hack too. Proper way is to modify the parser's output JSON, but until we are sure the effort is worth it, this hack will do.
 */
var toRTESchema = function(content) {
    return content.map(node => {
        if (node.type === 'heading') {
            return {
                ...node,
                content: toRTESchema(node.content),
                type: 'paragraph',
                attrs: {
                    type: 'h' + node.attrs.level
                }
            }
        } else if (node.type === 'ordered_list') {
            return {
                type: 'orderedList',
                content: toRTESchema(node.content)
            }
        } else if (node.type === 'bullet_list') {
            return {
                type: 'bulletList',
                content: toRTESchema(node.content)
            }
        } else if (node.type === 'list_item') {
            return {
                type: 'listItem',
                content: toRTESchema(node.content)
            }
        } else if (node.type === 'text') {
            var marks = node.marks || [];
            marks = marks.map(m => {
                if (m.type === 'code') {
                    return {
                        ...m,
                        type: 'inlineQuote'
                    }
                } else {
                    return m
                }
            })
            return {
                type: 'text',
                text: node.text,
                marks: marks
            }
        } else if (node.type === 'hard_break') {
            return {
                type: 'br'
            }
        } else if (node.type === 'horizontal_rule') {
            return {
                type: 'hr'
            }
        } else if (node.content) {
            return {
                ...node,
                content: toRTESchema(node.content)
            }
        } else {
            return node;
        }
    })
}


export function getMarkdownSchema() {
    var strikeConf = RichTextEditor.getConf()['strikeThrough']
    var marks = strikeConf.addNodes(mdschema)
    var tableConf = RichTextEditor.getConf()['tables']
    var nodes = tableConf.addNodes(mdschema)
    return new Schema({nodes: nodes, marks: marks})
}

export function getMarkdownSerializer() {
    return rteMarkdownSerializer;
}

export function getMarkdownParser() {
    return getParser();
}

export function doc2md(doc) {
    doc.content = toMdSchema(doc.content)
    var mdschema = getMarkdownSchema()
    var mdserializer = getMarkdownSerializer()
    var doc = Node.fromJSON(mdschema, doc)
    return mdserializer.serialize(doc, {tightLists: true});
}

export function md2doc(md, options) {
    var docNode = getMarkdownParser().parse(md);
    var doc = docNode.toJSON()
    doc.content = toRTESchema(doc.content)
    return doc;
}


export function getMarkdownOptions(options) {
    return {
        mode: 'markdown',
    
        formats: ["strong", "em", "link", "headings", 'inlineQuote', 'strikeThrough'],
        features: ["list", 'code_block', 'blockquote', 'hr', 'images', 'tables'],
    
        menubar: {
            position: 'top',
            overrides: {
                strong: {
                    addMenu: function(rteView) {
                        rteView.menubar.addMenu({
                            type: 'button',
                            simple: true,
                            id: 'bold',
                            name: 'Bold',
                            icon: 'rte-icon-bold',
                            isSVGIcon: true,
                            shortcut: 'Ctrl+B',
                            command: 'boldCommand',
                            params: [],
                        })
                    }
                },
    
                em: {
                    addMenu: function(rteView) {
                        rteView.menubar.addMenu({
                            type: 'button',
                            simple: true,
                            id: 'italic',
                            name: 'Italic',
                            icon: 'rte-icon-italic',
                            shortcut: 'Ctrl+i',
                            isSVGIcon: true,
                            command: 'italicCommand',
                            params: []
                        })
                    }
                },
    
                link: {
                    addMenu: function(rteView) {
                        rteView.menubar.addMenu({
                            type: 'button',
                            simple: true,
                            id: 'add-link',
                            name: 'Link',
                            icon: 'rte-icon-link',
                            isSVGIcon: true,
                            command: 'linkCommand',
                            params: []
                        })
                    }
                },
    
                strikeThrough: {
                    addMenu: function (rteView) {
                        rteView.menubar.addMenu({
                            type: 'button',
                            simple: true,
                            id: 'strikethrough',
                            name: 'Strikethrough',
                            icon: 'rte-icon-strkthr',
                            isSVGIcon: true,
                            shortcut: 'Shift-Mod-x',
                            command: 'strikeCommand',
                            params: []
                        })
                    }
                },
    
                headings: {
                    addMenu: function(rteView) {
                        rteView.menubar.addMenu({
                            id: 'heading',
                            type: 'splitbutton',
                            contentType: 'text',
                            name: 'Headings',
                            options: [{
                                id: 'ui-rte-heading-h1',
                                name: 'Heading 1',
                                selected: true,
                                icon: '',
                                command: 'h1Command'
                            }, {
                                id: 'ui-rte-heading-h2',
                                name: 'Heading 2',
                                icon: '',
                                command: 'h2Command'
                            }, {
                                id: 'ui-rte-heading-h3',
                                name: 'Heading 3',
                                icon: '',
                                command: 'h3Command'
                            }]
                        })
                    }
                },
    
                fontSize: {
                    addMenu: function() { }
                },
    
                list: {
                    addMenu: function (rteView) {
                        rteView.menubar.addMenu({
                            type: 'group',
                            id: 'group-5',
                            items: [{
                                type: 'button',
                                simple: true,
                                id: 'ordered-list',
                                name: 'Numbered List',
                                icon: 'rte-icon-numlist',
                                isSVGIcon: true,
                                command: 'olCommand',
                                params: [],
                            }, {
                                type: 'button',
                                simple: true,
                                id: 'unordered-list',
                                name: 'Bullet List',
                                icon: 'rte-icon-bulletlist',
                                isSVGIcon: true,
                                command: 'ulCommand',
                                params: []
                            }]
                        })
                    }
                },
    
                code_block: {
                    addMenu: function (rteView) {
                        rteView.menubar.addMenu({
                            type: 'button',
                            simple: true,
                            id: 'code-block',
                            name: 'Code block',
                            icon: 'rte-icon-code',
                            isSVGIcon: true,
                            command: 'code',
                            params: []
                        })
                    },
    
                    addContextMenu: function() {
    
                    }
                },
    
                inlineQuote: {
                    addMenu: function (rteView) {
                        // rteView.menubar.addMenu({
                        //     type: 'button',
                        //     id: 'inlineQuote',
                        //     name: 'Inline Code',
                        //     icon: 'zmetbi-quote',
                        //     command: 'toggleInlineQuote',
                        //     params: []
                        // })
                    },
    
                    addContextMenu: function() {
                        
                    }
                },
    
                blockquote: {
                    addMenu: function (rteView) {
                        rteView.menubar.addMenu({
                            type: 'button',
                            simple: true,
                            id: 'block-quote',
                            name: 'Block Quote',
                            icon: 'zmetbi-quote',
                            // isSVGIcon: true,
                            shortcut: 'Shift-Mod-x',
                            command: 'blockQuote',
                            params: []
                        })
                    },
    
                    addContextMenu: function() {
                        
                    }
                }
            }
        }
    };
}

/**
 * Repository team related utils
 */


function startsWithProtocol(url) {
    return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
}

function resolveUrlWithFragment(baseUrl, relativeUrl) {
    // Split base URL into main part and fragment part
    let [mainPart, fragment] = baseUrl.split("#");

    // If there's no fragment, just use the normal resolution
    if (!fragment) {
        return new URL(relativeUrl, mainPart).href;
    }

    // Resolve the relative path inside the fragment
    fragment = fragment.startsWith('/') ? fragment.slice(1) : fragment
    let resolvedFragment = new URL(relativeUrl, "ht"+"tp://dummy.com/" + fragment).pathname; 
    console.log(resolvedFragment)

    // Reattach the resolved fragment to the main URL
    return `${mainPart}#${resolvedFragment}`;
}

export function renderMarkdownHTML(mdcontent, options) {
    /**
     * options = {
     *  container: dom element in which html needs to be rendered
     *  repoRoot: 'https://repository.zoho.com/orgname/reponame/' 
     *  dirRoot: 'https://repository.zoho.com/orgname/reponame/current/directory/'
     *  imgRepoRoot: 'https://repository.zoho.com/orgname/reponame/' 
     *  imgDirRoot: 'https://repository.zoho.com/orgname/reponame/current/directory/' 
     *  filepath: 'https://repository.zoho.com/orgname/reponame/directory/file.md'
     *  onLinkClicked: () => {}
     *  onHeadingLinkClicked
     *  onCheckboxClicked: () => {}
     * }
     */
    
    var markdownItOptions = Object.assign({
        html: true,
        linkify: true,
        breaks: true,
        typographer: true
    }, options.markdownItOptions)

    
    var mdparser = new MarkdownIt(markdownItOptions)
        .use(checkboxplugin, {
            disabled: false,
            divWrap: false,
            divClass: 'checkbox',
            idPrefix: 'check-',
            ulClass: 'check-list',
            liClass: 'check-list-item'
        })
        .use(headingplugin)
        .use(markdownItFootNote)
        .use(emoji)

    var html = mdparser.render(mdcontent) // convert md to html

    html = dompurify.sanitize(html) // sanitize html

    // requirement 1: add basepath to all image links to point to images inside the repository (mimic behaviour from gitlab/github)
    var tempdiv = document.createElement('div')

    tempdiv.innerHTML = html
    tempdiv.querySelectorAll('img').forEach(img => {
        var src = img.getAttribute('src') || ''
        src = src.trim()
        var resolvedSrc = src
        if (!startsWithProtocol(src)) { // it's a relative image url. add the absolute part from options
            if (src.startsWith('/')) { // need to point from repo root
                src = src.slice(1) // removes the staring / slash character
                resolvedSrc = options.imgRepoRoot + src
            } else if (src.startsWith('./') || src.startsWith('../')){ // need to resolve relative path
                var resolvedSrc = resolveUrlWithFragment(options.imgDirRoot, src)
            } else { // need to point relatively into the current directory
                resolvedSrc = `${options.imgDirRoot}${src}`
            }
        }
        img.setAttribute('src', resolvedSrc)
    })

    var container = options.container || tempdiv
    container.innerHTML = tempdiv.innerHTML
    
    // requirement 2: whenever a link is clicked call repository team's callback
    container.querySelectorAll('a').forEach(link => {
        var href = link.getAttribute('href') || ''
        href = href.trim()
        var resolvedHref = href
        if (!startsWithProtocol(href)) { // it's a relative image url. add the absolute part from options
            if (href.startsWith('#')) { // handle TOC i.e links that point to same page headings
                href = href.slice(1) // remove the starting "#" character
                resolvedHref = `${options.filepath}${href}`
            } else if (href.trim().startsWith('/')) { // need to point from project root, so add just the base path - https://repository.zoho.com/<projectname>
                href = href.slice(1) // removes the staring / slash character
                resolvedHref = options.repoRoot + href
            } else if (href.startsWith('./') || href.startsWith('../')) {
                resolvedHref = resolveUrlWithFragment(options.dirRoot, href)
            } else { // need to point relatively into the folder
                resolvedHref = `${options.dirRoot}${href}`
            }
        }

        link.setAttribute('href', resolvedHref)

        link.addEventListener('click', e => {
            options.onLinkClicked(link, e)
        })
    })

    // requirement 3: when checkbox is clicked, call repository team's callback
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', e => {
            options.onCheckboxClicked(checkbox, e)
        })
    })

    // requirement 4: add a copy button for codeblocks
    container.querySelectorAll('pre').forEach(pre => {

        var copyBtnContainer = document.createElement('div')
        copyBtnContainer.style.position = 'absolute'
        copyBtnContainer.style.top = '0px'
        copyBtnContainer.style.right = '0px'
        copyBtnContainer.classList.add('rte-codeblock-copy-btn')

        pre.style.position = 'relative'

        if (options.copyButton) {
            copyBtnContainer.innerHTML = options.copyButton
        } else {
            var copyBtn = document.createElement('button')
            copyBtn.innerHTML = 'copy'
            copyBtnContainer.append(copyBtn)
        }

        pre.appendChild(copyBtnContainer)

        copyBtnContainer.addEventListener('click', e => {
            var codeText = pre.querySelector('code').innerText
            window.navigator.clipboard.writeText(codeText);
            options.onCodeCopied && options.onCodeCopied(e, codeText)
        })
    })

    // requirement 5: copy heading link button for all headings
    container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {

        // Get the heading's ID (assuming markdown-it adds IDs to headings)
        const id = heading.id;

        if (id) {
            // Create a wrapper div
            const wrapperDiv = document.createElement("div");
            wrapperDiv.style.position = 'relative'
            wrapperDiv.classList.add("heading-wrapper");

            // Create an anchor link next to the heading
            const anchorLink = document.createElement("a");
            anchorLink.href = `${options.filepath}${id}`;
            anchorLink.style.position = 'absolute';
            anchorLink.classList.add("heading-link");
            anchorLink.textContent = "🔗"; // You can replace this with an icon or text

            if (options.anchorLinkHTML) {
                anchorLink.innerHTML = options.anchorLinkHTML
            }

            // Wrap the heading and insert the anchor link
            heading.replaceWith(wrapperDiv);
            wrapperDiv.appendChild(anchorLink);
            wrapperDiv.appendChild(heading);

            anchorLink.addEventListener('click', e => {
                options.onHeadingLinkClicked && options.onHeadingLinkClicked(e, id)
            })
        }
    })

    return container
}