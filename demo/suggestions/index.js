// construct options
var options = {
    content: getContent(),
    menubar: {
        position: 'top',
        customMenuItems: [],
        overrides: {}
    },


    // formatting options to include
    formats: ["strong", "em", "underline", {name: "link", autodetect: false}, "strikeThrough", "align", "fontSize", "fontFamily", "fontColor", "highlight", "script", "lineHeight", "direction", "headings", "clearFormatting"],
    // here put fontSize first followed by fontFamily because in cases of applying heading we need fontSize mark to be applied first and then only we need to apply fontFamily mark else for every change in fontFamily mark the fontSize mark will be applied.
    
    // put highlight mark after fontSize mark because backgroundColor(that is highlight mark) needs to be applied on span tag based on font-size
    //Assume a case: type "abc def ghi" and make the font-size of def as 24pt and put bgcolor of "abc def ghi" as orange, now if highlight is put before fontSize then, highlight mark will be applied as a line with the thickness 10pt(default font-size), so bgColor applied for def would not be proper.....so we need bgColor to be applied based on font-size

    // put highlight mark after fontColor mark inorder to maintain the order in the menubar

    // document elements to include
    features: [
        'hr', // Horizontal rule
        {
            name: 'images',
            getImageUrl: function(file, blob, callback, errorCallback) {
                setTimeout(() => {
                    // errorCallback("not supported format");
                    callback(blob);
                }, 100);
            }
        },
        {
            name: 'mentions',
            getSuggestions: getAtmentionsSuggestions() // @mentions
        },
        {
            name: 'emoji',
            hasZomoji: false
        },
        'list',
        'tables',
        'code_block',
        'datafield',
        {
            name: 'suggestions',
            trigger: ['/','@'],
            allowSpace: false,
            delay: 100,
            maxNoOfSuggestions: 6,
            activeClass: 'suggestion-item-active',
            suggestionTextClass: 'prosemirror-suggestion',

            getSuggestions: function(state, text, cb, view) {
                const suggestions = getSlashFormattingSuggestions();
                const filtered = suggestions.filter(s =>
                    s.name.toLowerCase().startsWith(text.toLowerCase())
                );
                cb && cb(filtered);
            },

            getSuggestionsHTML: function(suggestions) {
                /*
                let el = `<div class="slash-suggestion-dropdown">`;
                suggestions.forEach(item => {
                    el += `
                        <div class="ui-rte-suggestion-item suggestion-dropdown-list-item">
                                <span class="name" id="suggestion-text">${item.name}</span>                                
                        </div>`;      
                });
                el += `</div>`;
                return el;
                */
                // let el = `<div class="slash-suggestion-dropdown">`;
                // suggestions.forEach(item => {
                //     el += `
                //         <div class="ui-rte-suggestion-item suggestion-dropdown-list-item">
                            
                //             <div class="" style="float:left;padding:3px;margin-top:5px">
                //             <div style="" class="">
                //                 <span class="name" id="suggestion-text">${item.name}</span>                                
                //                 <div class="">
                //                 <span class="desc">${item.description || ''}&nbsp;</span>
                //                 </div>
                //             </div>
                //             </div>
                //         </div>`;      
                // });
                // el += `</div>`;
                // return el;
               

                let el = `<div class="ui-rte-suggestion-item-list ui-rte-atmetion-suggestion-container zdc_shareautocompletedialog suggestion-dropdown-list">`
                suggestions.forEach((suggestion)=>{
                    el += `<div class="ui-rte-suggestion-item suggestion-dropdown-list-item">
                                <div class="" style="float:left;padding:3px;margin-top:5px">
                                <div style="" class="">
                                    <span
                                        class="ui-rte-cmnt-atmention-name"
                                        id="full-name"
                                    >${suggestion.name}</span>
                                </div>
                                <div class="">
                                    <span class="graytxt" id="graytxt">${suggestion.description}&nbsp;</span>
                                </div>
                                </div>
                            </div>`
                })
                el += `</div>`
                return el

                // // can provide html dom element also inorder to bind event listeners as per their use case
                // var div = document.createElement('div')
                // var innerDiv = document.createElement('div')
                // innerDiv.innerText = 'options'
                // div.appendChild(innerDiv)
                // div.className =  'suggestion-dropdown-list'

                // innerDiv.addEventListener('mouseenter', function(e) { 
                //     console.log('options clicked')
                // })
                // 
                // return div
                /* should return a 
                    <div class="suggestion-dropdown-list">
                        <div class="suggestion-dropdown-list-item"></div>
                        <div class="suggestion-dropdown-list-item"></div>
                        <div class="suggestion-dropdown-list-item"></div>
                    </div>
                */ 
            },
            onSelect: function(view, item, state) {
                const { from, to } = state.range;
                const matchedText = view.editorView.state.doc.textBetween(from, to);
                const split = matchedText.trim().split(/\s+/);
                const commandText = split[0]; // e.g., "/bold"
                const contentToFormat = split.slice(1).join(' '); // e.g., "this is bold"

                // Remove the matched command
                view.editorView.dispatch(view.editorView.state.tr.delete(from, to));

                if (contentToFormat.length > 0) {
                    // Insert content and select it
                    view.editorView.dispatch(
                        view.editorView.state.tr.insertText(contentToFormat, from)
                    );
                    const textEnd = from + contentToFormat.length;
                    view.setSelection(from, textEnd);
                } else {
                    // No content — just place cursor and apply format to current location
                    view.setSelection(from, from);
                }

                // Apply formatting command
                switch (item.command) {
                    case 'strong':
                        view.commands.toggleBold();
                        break;
                    case 'em':
                        view.commands.toggleItalic();
                        break;
                    case 'underline':
                        view.commands.toggleUnderline();
                        break;
                    case 'strikeThrough':
                        view.commands.toggleStrikethrough();
                        break;
                    case 'toggleHeading1':
                        view.commands.setHeading("h1");
                        break;
                    case 'toggleHeading2':
                        view.commands.setHeading("h2");
                        break;
                    case 'toggleUL':
                        view.commands.toggleUL();
                        break;
                    case 'toggleOL':
                        view.commands.toggleOL();
                        break;
                    default:
                        console.warn('Unsupported slash command:', item.command);
                }

                view.editorView.focus();
            },
      
            activeClass: 'suggestion-item-active',
            suggestionTextClass: 'prosemirror-suggestion',
            maxNoOfSuggestions: 6,
            delay: 1000,
            /*
           +// name: 'suggestions',//mandatory
            // trigger: ['/'],
            // trigger: function(text, view, selection) {

            //     var regex = /[\w-\+]*$/
            //     if(text.match(regex)) {
            //         console.log(text)
            //         let match = text.match(regex)
            //         return {
            //             isMatched: true,
            //             index: match.index
            //         }
            //     }

            //     if(text.charAt(text.length-1) === "a") {
            //         console.log(text)
            //         return {
            //             isMatched: true,
            //             index: text.length-1
            //         }
            //     } else if(text === "mi" || text === "su") {
            //         console.log(text)
            //         return {
            //             isMatched: true,
            //             index: text.length-2
            //         }
            //     } 
            // },
            // allowSpace: true, // allow space inbetween query
            // getSuggestions: function(state, text, cb, view) {
                // console.log("suggestions")
                // console.log(state)
                // console.log(text)
                // console.log(view)
               // var suggestions = getsuggestions();
                //var newSuggestions = [];
                //for (var index = 0; index < suggestions.length; index++) {
                //    var suggestion = suggestions[index];
                //    var suggestionName = suggestion.fullname;
                //    var suggestionMailId = suggestion.emailid;
                //    var textSize = text.length;
                //    var nameStartsWithText =
                //       text.toUpperCase() ===
                //        suggestionName.slice(0, textSize).toUpperCase();
                //    var mailIdStartsWithText =
                //        text.toUpperCase() ===
                //        suggestionMailId.slice(0, textSize).toUpperCase();
                //    if (nameStartsWithText || mailIdStartsWithText) {
                //        newSuggestions.push(suggestion);
                //   }
                }
                cb && cb(newSuggestions);
            },//mandatory
            getSuggestionsHTML: function(suggestions, state) {
                // console.log("html")
                // console.log(suggestions)
                // console.log(state)
                let el = `<div class="ui-rte-suggestion-item-list ui-rte-atmetion-suggestion-container zdc_shareautocompletedialog suggestion-dropdown-list">`
                suggestions.forEach((suggestion)=>{
                    el += `<div class="ui-rte-suggestion-item suggestion-dropdown-list-item">
                                <div
                                style="height:30px;width:30px;float:left;margin-right: 10px;margin-left: 10px;margin-top: 10px;"
                                class=""
                                >
                                <img
                                    src="https://contacts.zoho.com/file?ID=${suggestion.zuid}&fs=thumb"
                                    style="border-radius: 100%;height:35px;width:35px;border:1px solid #e0e0e0;"
                                    id="contact-img"
                                    title=""
                                />
                                </div>
                                <div class="" style="float:left;padding:3px;margin-top:5px">
                                <div style="" class="">
                                    <a
                                    style="white-space:nowrap;"
                                    class="ui-corner-all ui-cmt-atmention-fname"
                                    tabindex="-1"
                                    ><span
                                        class="ui-rte-cmnt-atmention-name"
                                        id="full-name"
                                    >${suggestion.fullname}</span></a>
                                </div>
                                <div class="">
                                    <span class="graytxt" id="graytxt">${suggestion.emailid}&nbsp;</span>
                                </div>
                                </div>
                            </div>`
                })
                el += `</div>`
                return el

                // // can provide html dom element also inorder to bind event listeners as per their use case
                // var div = document.createElement('div')
                // var innerDiv = document.createElement('div')
                // innerDiv.innerText = 'options'
                // div.appendChild(innerDiv)
                // div.className =  'suggestion-dropdown-list'

                // innerDiv.addEventListener('mouseenter', function(e) { 
                //     console.log('options clicked')
                // })
                // 
                // return div
                /* should return a 
                    <div class="suggestion-dropdown-list">
                        <div class="suggestion-dropdown-list-item"></div>
                        <div class="suggestion-dropdown-list-item"></div>
                        <div class="suggestion-dropdown-list-item"></div>
                    </div>
                
            }, */
            placeDropdown(el, offset) {
                // append el wherver you want
                // set style whatever you want
                // TODO: think about outsourcing this positioning logic as options
                zwRteView.dom.append(el);

                el.style.display = 'flex'; // no i18n
                el.style.position = 'fixed'; // no i18n
                el.style.left = '';
                el.style.right = '';
                // el.style.height = '150px' // inorder to test for scrolling inside the dropdown div uncomment this
                // el.style.overflowY = 'auto'
                var elWidth = el.offsetWidth;
                var docWidth = document.documentElement.clientWidth;
                var docHeight = document.documentElement.clientHeight;

                // adjust left/right
                if (offset.left + elWidth + 1 < docWidth) {
                    el.style.left = offset.left + 'px'; // no i18n
                } else {
                    el.style.right = docWidth - offset.right + 'px'; // no i18n
                }

                // adjust top/bottom
                if (offset.bottom + el.scrollHeight < docHeight) {
                    var top = offset.bottom;
                } else {
                    var top = offset.top - el.scrollHeight;
                }
                el.style.top = top + 'px'; // no i18n
            },
            /* onSelect: function(view, item, state) {
                // console.log("onSelect")
                // console.log(view)
                // console.log(item)
                // console.log(state)
                view.commands.insertField()
            },//mandatory
            activeClass: 'suggestion-item-active',
            suggestionTextClass: 'prosemirror-suggestion',
            maxNoOfSuggestions: 6,
            delay: 200 */
        },

        // {
        //     name: 'suggestions',//mandatory
        //     trigger: ['/', '?', '{', /(^|\s|\0)\*\*([\w-\+]+[.]?\s?[\w-\+]*)$/, /[\w-\+]*$/],
        //     // trigger: function(text, view, selection) {
        //     //     var regex = /[\w-\+]*$/
        //     //     if(text.match(regex)) {
        //     //         console.log(text)
        //     //         let match = text.match(regex)
        //     //         return {
        //     //             isMatched: true,
        //     //             index: match.index
        //     //         }
        //     //     }

        //     //     if(text.charAt(text.length-1) === "a") {
        //     //         console.log(text)
        //     //         return {
        //     //             isMatched: true,
        //     //             index: text.length-1
        //     //         }
        //     //     } else if(text === "mi" || text === "su") {
        //     //         console.log(text)
        //     //         return {
        //     //             isMatched: true,
        //     //             index: text.length-2
        //     //         }
        //     //     }                 
        //     // },
        //     allowSpace: true, // allow space inbetween query
        //     customDropdown: true,
        //     onMatch: function(state, text, position, view) {
        //         // console.log(state)
        //         // console.log(text)
        //         // console.log(position)
        //         // console.log(view)
        //         // console.log("yes")
        //     },
        //     unMatch: function(view) {
        //         // console.log(view)
        //         // console.log("no")
        //     },
        //     suggestionTextClass: 'prosemirror-suggestion',
        //     delay: 200
        // }
    ],

    defaults: {
        fontFamily: 'Open Sans'
        // fontSize: '12pt',
        // lineHeight: "1.5"
    },

    fontOptions: ['Lato', 'Open Sans'],

    className: 'ui-rte-editor-div outer-wrapper-container',

    onEditorStateUpdate: function(currentState, view) {
        // do the necessary processes
        // console.log(currentState)
        // console.log(view.getJSON())
    }

};


RichTextEditor.registerElement({
    datafield: {
        addNodes: function(schema) {
            return schema.spec.nodes.append({
                datafield: {
                    atom: true,
                    group: 'inline',
                    inline: true,
                    attrs: {
                        id: '',
                        label: '',
                        meta: {
                            default: {}
                        }
                    },
                    parseDOM: [
                        {
                            tag: 'span.custom-field',
                            getAttrs: function(el) {
                                if(el.getAttribute('datafieldid')) {
                                    return { id: el.getAttribute('datafieldid'), label: 'Joe Lewis' }
                                } else {
                                    return false
                                }
                            }
                        }
                    ],
                    toDOM: function(node) {
                        // Note: can return a DOM element too
                        return ['span', 
                        {
                            class: 'custom-field', 
                            dataFieldId: node.attrs.id, 
                            style: 'border: 1px solid #999; padding: 1px; border-radius: 2px;'
                        }, node.attrs.label]
                    }
                }
            })
        },

        registerCommand: function(view) {
            view.registerCommand({
                insertField: function(fieldAttrs) {
                    fieldAttrs = fieldAttrs ||{id: '101', label: 'Joe Lewis'} 
                    view.insertNode('datafield', fieldAttrs)
                }
            })
        }
    }
})

// init editor once dom content is ready
document.addEventListener('DOMContentLoaded', function() {
    RichTextEditor.onload.then(function() {
        window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), options);
    })

    // add event handlers for mini editor / max editor
    document.querySelector('#switch-to-mini-editor').addEventListener('click', function() {
        window.zwRteView && window.zwRteView.remove();
        document.querySelector('#rte-wrapper-container').style.minHeight = '80px';
        document.querySelector('#rte-wrapper-container').style.width = '500px';
        // setTimeout(function() {
        //     window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), {
        //         placeholder: 'Enter your comment...',
        //         formats: ["strong", "em", "underline", "highlight", "link", "strikeThrough"],
        //         features: [{name: 'mentions', getSuggestions: getAtmentionsSuggestions()}, {name: 'emoji', hasZomoji: false}, 'datafield'],
        //         menubar: {position: 'bottom'},
        //         className: 'ui-rte-editor-div outer-wrapper-container',
        //         defaults: {fontFamily: 'Open Sans'},
        //         content: `🚀 A <b>sample</b> <u>demo</u> editor. <br> To insert emojis start typing with <b>:</b> <i>(colon)</i>. <br> To @mention people start typing with <b>@</b> character.`,
        //         isHTMLContent: true
        //     });
        // }, 100)

        setTimeout(function() {
            window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), {
                placeholder: '',
                formats: ["strong", "em", "underline", "link", "strikeThrough"],
                features: [{name: 'mentions', getSuggestions: getAtmentionsSuggestions()}, {name: 'emoji', hasZomoji: false}, 'datafield'],
                menubar: {position: 'bottom', customMenuItems: [{
                    type: 'button',
                    id: 'annotate',
                    name: 'Annotate', //will be shown in tooltip
                    icon: 'rte-icon-bold', // will be rendered as <i class="{icon}" />
                    isSVGIcon: true, // if true, will render svg symbol passed in icon
                    shortcut: 'Ctrl+B', // optional shortcut to invoke the command
                    command: 'annotate'
                }]},
                defaults: {fontFamily: 'Open Sans'},
                content: `🚀 A <b>sample</b> <u>demo</u> editor. <br> To insert emojis start typing with <b>:</b> <i>(colon)</i>. <br> To @mention people start typing with <b>@</b> character.`,
                isHTMLContent: true
            });

            zwRteView.registerCommand({
                annotate: function() { /* console.log(this) */ }
            })
            zwRteView.registerCommand({
                insertText: function(text, from, to) {
                    to = to || from;
                    this.editorView.dispatch(this.editorView.state.tr.insertText(text+'', from, to)) // insert text
                    this.focus(); // set focus
                }
            })
        }, 100)
        
    })

    document.querySelector('#switch-to-full-editor').addEventListener('click', function() {
        window.zwRteView && window.zwRteView.remove();
        document.querySelector('#rte-wrapper-container').style.width = '';

        setTimeout(function() {
            window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), options);
        }, 100)
    })

    // document.querySelector('#download-json').addEventListener('click', function() {
    //     download(JSON.stringify(zwRteView.getJSON()), 'content.json', 'application/json')
    // })

    // document.querySelector('#download-html').addEventListener('click', function() {
    //     download(RichTextEditor.getHTML(zwRteView.getJSON(), zwRteView.options), 'content.html', 'text/html')
    // })

    document.querySelector('#view-html').addEventListener('click', function() {
        // var html = RichTextEditor.getHTML(zwRteView.getJSON(), zwRteView.options)
        var html = zwRteView.getHTML({fromView: false})
        zwRteView.remove();
        window.zwRteView = null;
        document.querySelector('#rte-wrapper-container').innerHTML = html
        hljs.highlightAll();

    })

    function download(content, filename, contentType) {
        if(!contentType) { contentType = 'application/octet-stream' }
            var a = document.createElement('a');
            var blob = new Blob([content], {'type':contentType});
            a.href = window.URL.createObjectURL(blob);
            a.download = filename;
            a.click();
    }


})



/**
 * 
 * ------------- HELPERS ------------------------------
 */

    function getContent() {
    return {"type":"doc","content":[{"type":"paragraph","attrs":{"align":"center","lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"},{"type":"fontSize","attrs":{"value":"12pt"}}],"text":"Writer’s Richtext Editor Library"},{"type":"text","marks":[{"type":"strong"},{"type":"fontSize","attrs":{"value":"12pt"}},{"type":"script","attrs":{"type":"sup"}}],"text":"TM"}]},{"type":"hr"},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"},{"type":"fontSize","attrs":{"value":"12pt"}}],"text":"Overview & Goals:"}]},{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Rendering is based on a data-model / schema, instead of “contenteditable/HTML” as the source of truth."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Contenteditable"},{"type":"text","text":" is only used to capture input events and as output device (cursor navigation, selection and RTL font rendering is taken care of by the browser). Everything else is under the library’s control. "}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Data-model is extensible. We can incrementally add custom document elements by extending the base schema. Comes with a plugin system to add custom behavior."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Should work well with common browser extensions like "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://grammarly.com"}}],"text":"Grammarly"},{"type":"text","text":"."}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Rendering fidelity"},{"type":"text","text":". Content shouldn’t lose formatting when saved and re-opened for editing. "}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Copy / paste shouldn't bring junk HTML inside editor. It preserve only the formatting & elements supported by the editor configuration."}]}]}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"},{"type":"fontSize","attrs":{"value":"12pt"}}],"text":"API overview: "}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}},{"type":"code_block","attrs":{"id":"code-block-7347"},"content":[{"type":"text","text":"// drop this script tag or bundle it in the product's JS\n<script src=\"https://cdn.writer.zoho.com/rte.js\" />\n\nvar div = document.querySelector('#ui-rte-editor-div') // div for mounting rich text editor\n\n/**\n * To instantiate default editor with basic formatting options\n */\nvar editor = RTE.init(div); // check mini-editor in demo. \n// Useful for smaller textinput areas like comments/feedback panels\n\n\n/**\n * To instantiate editor with customized configurations\n */\nvar options = {\n    placeholder: \"E.g Enter ticket response...\",\n    content: \"default content in the editor\", // can also take JSON or HTML input saved from a previous instance\n    formats: [\"bold\", \"italics\", \"highlight\", \"underline\", \"link\"],\n    features: [{name: 'atmention', getSuggestions: () => {}}, {name: 'proofing', afterInit: () => {}, beforeDestroy: () => {}}]\n    // refer docs for detailed configuration options\n}\n\nvar editor = RTE.init(div, options)\n\n/**\n * Commands available to perform editor operations\n */\neditor.commands.toggleBold() // toggles bold formatting\neditor.commands.insertImage(src, fit) // fit = 'best' || 'small' || 'original' || 'fitToWidth'\neditor.commands.inserTable(3,4) // 3 rows and 4 columns\n// ... more commands available in the table below!\n\n/*\n * Useful editor API methods  \n */\neditor.getJSON() // get content as JSON\neditor.getHTML() // get content as HTML\neditor.remove() // to destroy the rich text editor\neditor.focus() // to trigger focus on the editor\neditor.reset() // clear editor content\neditor.setEditable(true || false) // to make it read-only or vice versa\neditor.setPlaceholder(\"placeholder content\") // to dynamically change placeholder text\nRTE.getHTML(json, options) // options = options passed to the editor that generated the JSON"}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"},{"type":"fontSize","attrs":{"value":"12pt"}}],"text":"Status Tracker:"}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}},{"type":"table","content":[{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":"ltr"},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Nos."}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"},{"type":"underline"}],"text":"Feature"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"},{"type":"underline"}],"text":"Development status"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"},{"type":"underline"}],"text":"Testing Status"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"},{"type":"underline"}],"text":"Command"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"1"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Bold"},{"type":"text","text":" / "},{"type":"text","marks":[{"type":"em"}],"text":"Italics"},{"type":"text","text":" / "},{"type":"text","marks":[{"type":"underline"}],"text":"Underline"},{"type":"text","text":" / "},{"type":"text","marks":[{"type":"strikeThrough"}],"text":"Strikethrough"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-49321"},"content":[{"type":"text","text":"editor.commands.toggleBold()\neditor.commands.toggleItalic()\n..."}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"2"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"link","attrs":{"href":"http://google.com"}}],"text":"Link"},{"type":"text","text":" "}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"orange"}}],"text":"In Progress"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-76736"},"content":[{"type":"text","text":"editor.commands.addLink(link)\neditor.commands.removeLink()"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"3"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Emoji 😄 "}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"orange"}}],"text":"In Progress - 30%"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"orange"}}],"text":"In Progress"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"4"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontSize","attrs":{"value":"14pt"}}],"text":"Font size"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-60511"},"content":[{"type":"text","text":"editor.commands.setFontSize(14)"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"5"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Font Family"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-90580"},"content":[{"type":"text","text":"editor.commands.setFontFamily('Arial')"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"6"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"highlight","attrs":{"value":"#e2e7ff"}}],"text":"Font Background / "},{"type":"text","marks":[{"type":"highlight","attrs":{"value":"#e2e7ff"}},{"type":"fontColor","attrs":{"value":"#08C"}}],"text":"Font Color"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-8785"},"content":[{"type":"text","text":"editor.commands.setFontColor('#000')\neditor.commands.setBackgroundColor()"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"7"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Numbered List"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-56241"},"content":[{"type":"text","text":"editor.commands.toggleOL()"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"8"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Bulleted List"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-59481"},"content":[{"type":"text","text":"editor.commands.toggleUL()"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"9"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Text Alignment (RTL, LTR)"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-67670"},"content":[{"type":"text","text":"editor.commands.setDirection('rtl')"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"10"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Tables"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-64772"},"content":[{"type":"text","text":"editor.commands.insertTable(3,3)\neditor.commands.addRowBefore()\neditor.commands.addRowAfter()\neditor.commands.addColumnBefore()\neditor.commands.addColumnAfter()\neditor.commands.mergeCells()\neditor.commands.deleteRow()\neditor.commands.deleteColumn()"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"11"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Inline Image"}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"image","attrs":{"src":"https://webglfundamentals.org/webgl/lessons/resources/clipspace.svg","alt":null,"height":150,"width":200,"originalHeight":150,"originalWidth":200,"fit":"best","id":null}}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-36572"},"content":[{"type":"text","text":"editor.commands.insertImage(url)\neditor.commands.updateImageFit('small')"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"12"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Horizontal Line"}]},{"type":"hr"}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-7909"},"content":[{"type":"text","text":"editor.commands.insertHr()"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"13"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":"left","lineHeight":null,"dir":null},"content":[{"type":"text","text":"Para alignment (Left/Right/Center/Justify)"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-24510"},"content":[{"type":"text","text":"editor.commands.alignPara('center')"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"14"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Line-spacing"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"orange"}}],"text":"In Progress"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-18601"},"content":[{"type":"text","text":"editor.commands.setLineHeight(1.2)"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"15"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Superscript / Subscript"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"orange"}}],"text":"In Progress"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-31537"},"content":[{"type":"text","text":"editor.commands.toggleSubScript(url)\neditor.commands.toggleSuperScript(url)"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"16"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Quotes"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-19692"},"content":[{"type":"text","text":" "}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"17"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Code blocks"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"#4caf50"}}],"text":"Completed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"orange"}}],"text":"In Progress"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"code_block","attrs":{"id":"code-block-47206"},"content":[{"type":"text","text":"editor.commands.insertCodeBlock()\neditor.commands.deleteCodeBlock()"}]}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"18"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Format painter"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"19"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Video Embed"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"20"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Special blocks (Warning/Idea/Info/Quote)"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"21"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"HTML insert / edit"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}}]}]},{"type":"table_row","content":[{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[43]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"22"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[231]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","text":"Customizable Menubar"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[157]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"orange"}}],"text":"In Progress - 70%"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":[172]},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null},"content":[{"type":"text","marks":[{"type":"fontColor","attrs":{"value":"red"}}],"text":"Not taken yet"}]}]},{"type":"table_cell","attrs":{"colspan":1,"rowspan":1,"colwidth":null},"content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}}]}]}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null}}]}
}

function getAtmentionsSuggestions() {
    return function(type, text, callback, extras, view) {
        var suggestions = getsuggestions();
        if (type === 'mention') {
            var newSuggestions = [];
            for (var index = 0; index < suggestions.length; index++) {
                var suggestion = suggestions[index];
                var suggestionName = suggestion.fullname;
                var suggestionMailId = suggestion.emailid;
                var textSize = text.length;
                var nameStartsWithText =
                    text.toUpperCase() ===
                    suggestionName.slice(0, textSize).toUpperCase();
                var mailIdStartsWithText =
                    text.toUpperCase() ===
                    suggestionMailId.slice(0, textSize).toUpperCase();
                if (nameStartsWithText || mailIdStartsWithText) {
                    newSuggestions.push(suggestion);
                }
            }
            callback && callback(newSuggestions);
        }
    };
}

function getSlashFormattingSuggestions() {
    return [
        { id: 'bold', name: 'Bold', description: 'Make text bold', command: 'strong', commandMap: 'strong' },
        { id: 'italic', name: 'Italic', description: 'Italicize text', command: 'em', commandMap: 'em' },
        { id: 'underline', name: 'Underline', description: 'Underline text', command: 'underline', commandMap: 'underline' },
        { id: 'strike', name: 'Strikethrough', description: 'Strikethrough text', command: 'strikeThrough', commandMap:'strikeThrough' },
        { id: 'h1', name: 'Heading 1', description: 'Apply heading 1', command: 'toggleHeading1', size: 16 },
        { id: 'h2', name: 'Heading 2', description: 'Apply heading 2', command: 'toggleHeading2', size: 10 },
        { id: 'ul', name: 'Bullet List', description: 'Insert bulleted list', command: 'toggleUL' },
        { id: 'ol', name: 'Numbered List', description: 'Insert numbered list', command: 'toggleOL' }
    ];
}


function getsuggestions() {
    return [
        {
            "zuid": 1001,
            "fullname": "Random Names",
            "usertype": "personal",
            "val": "Random@testrte.com",
            "emailid": "Random@testrte.com"
        },
        {
            "zuid": 1002,
            "fullname": "Samiyah Sosa",
            "usertype": "personal",
            "val": "Samiyah@testrte.com",
            "emailid": "Samiyah@testrte.com"
        },
        {
            "zuid": 1003,
            "fullname": "Ophelia Sims",
            "usertype": "personal",
            "val": "Ophelia@testrte.com",
            "emailid": "Ophelia@testrte.com"
        },
        {
            "zuid": 1004,
            "fullname": "Elysia Clay",
            "usertype": "personal",
            "val": "Elysia@testrte.com",
            "emailid": "Elysia@testrte.com"
        },
        {
            "zuid": 1005,
            "fullname": "Khia Pacheco",
            "usertype": "personal",
            "val": "Khia@testrte.com",
            "emailid": "Khia@testrte.com"
        },
        {
            "zuid": 1006,
            "fullname": "Nasir Whittaker",
            "usertype": "personal",
            "val": "Nasir@testrte.com",
            "emailid": "Nasir@testrte.com"
        },
        {
            "zuid": 1007,
            "fullname": "Anthony Newman",
            "usertype": "personal",
            "val": "Anthony@testrte.com",
            "emailid": "Anthony@testrte.com"
        },
        {
            "zuid": 1008,
            "fullname": "Aniqa Sullivan",
            "usertype": "personal",
            "val": "Aniqa@testrte.com",
            "emailid": "Aniqa@testrte.com"
        },
        {
            "zuid": 1009,
            "fullname": "Ernie Woodward",
            "usertype": "personal",
            "val": "Ernie@testrte.com",
            "emailid": "Ernie@testrte.com"
        },
        {
            "zuid": 1010,
            "fullname": "Pranav Copeland",
            "usertype": "personal",
            "val": "Pranav@testrte.com",
            "emailid": "Pranav@testrte.com"
        },
        {
            "zuid": 1011,
            "fullname": "Elsa Wheeler",
            "usertype": "personal",
            "val": "Elsa@testrte.com",
            "emailid": "Elsa@testrte.com"
        },
        {
            "zuid": 1012,
            "fullname": "Meadow Norman",
            "usertype": "personal",
            "val": "Meadow@testrte.com",
            "emailid": "Meadow@testrte.com"
        },
        {
            "zuid": 1013,
            "fullname": "Zayaan Bowler",
            "usertype": "personal",
            "val": "Zayaan@testrte.com",
            "emailid": "Zayaan@testrte.com"
        },
        {
            "zuid": 1014,
            "fullname": "Rihanna Burns",
            "usertype": "personal",
            "val": "Rihanna@testrte.com",
            "emailid": "Rihanna@testrte.com"
        },
        {
            "zuid": 1015,
            "fullname": "Huda Wainwright",
            "usertype": "personal",
            "val": "Huda@testrte.com",
            "emailid": "Huda@testrte.com"
        },
        {
            "zuid": 1016,
            "fullname": "Raife Hernandez",
            "usertype": "personal",
            "val": "Raife@testrte.com",
            "emailid": "Raife@testrte.com"
        },
        {
            "zuid": 1017,
            "fullname": "Zayyan Dunkley",
            "usertype": "personal",
            "val": "Zayyan@testrte.com",
            "emailid": "Zayyan@testrte.com"
        },
        {
            "zuid": 1018,
            "fullname": "Maison Banks",
            "usertype": "personal",
            "val": "Maison@testrte.com",
            "emailid": "Maison@testrte.com"
        },
        {
            "zuid": 1019,
            "fullname": "Athena Drummond",
            "usertype": "personal",
            "val": "Athena@testrte.com",
            "emailid": "Athena@testrte.com"
        },
        {
            "zuid": 1020,
            "fullname": "Bailey Silva",
            "usertype": "personal",
            "val": "Bailey@testrte.com",
            "emailid": "Bailey@testrte.com"
        },
        {
            "zuid": 1021,
            "fullname": "Kenzie Rivers",
            "usertype": "personal",
            "val": "Kenzie@testrte.com",
            "emailid": "Kenzie@testrte.com"
        },
        {
            "zuid": 1022,
            "fullname": "Brandon-Lee Ratcliffe",
            "usertype": "personal",
            "val": "Brandon-Lee@testrte.com",
            "emailid": "Brandon-Lee@testrte.com"
        },
        {
            "zuid": 1023,
            "fullname": "Macauley O'Connor",
            "usertype": "personal",
            "val": "Macauley@testrte.com",
            "emailid": "Macauley@testrte.com"
        },
        {
            "zuid": 1024,
            "fullname": "Belle Guerra",
            "usertype": "personal",
            "val": "Belle@testrte.com",
            "emailid": "Belle@testrte.com"
        },
        {
            "zuid": 1025,
            "fullname": "Carly Rubio",
            "usertype": "personal",
            "val": "Carly@testrte.com",
            "emailid": "Carly@testrte.com"
        },
        {
            "zuid": 1026,
            "fullname": "Finlay Price",
            "usertype": "personal",
            "val": "Finlay@testrte.com",
            "emailid": "Finlay@testrte.com"
        },
        {
            "zuid": 1027,
            "fullname": "Margie Riley",
            "usertype": "personal",
            "val": "Margie@testrte.com",
            "emailid": "Margie@testrte.com"
        },
        {
            "zuid": 1028,
            "fullname": "Kim Derrick",
            "usertype": "personal",
            "val": "Kim@testrte.com",
            "emailid": "Kim@testrte.com"
        },
        {
            "zuid": 1029,
            "fullname": "Mira Matthams",
            "usertype": "personal",
            "val": "Mira@testrte.com",
            "emailid": "Mira@testrte.com"
        },
        {
            "zuid": 1030,
            "fullname": "Laaibah Herring",
            "usertype": "personal",
            "val": "Laaibah@testrte.com",
            "emailid": "Laaibah@testrte.com"
        },
        {
            "zuid": 1031,
            "fullname": "Hayley Hays",
            "usertype": "personal",
            "val": "Hayley@testrte.com",
            "emailid": "Hayley@testrte.com"
        },
        {
            "zuid": 1032,
            "fullname": "Tyrone Solis",
            "usertype": "personal",
            "val": "Tyrone@testrte.com",
            "emailid": "Tyrone@testrte.com"
        },
        {
            "zuid": 1033,
            "fullname": "Thelma Rasmussen",
            "usertype": "personal",
            "val": "Thelma@testrte.com",
            "emailid": "Thelma@testrte.com"
        },
        {
            "zuid": 1034,
            "fullname": "Fionnuala English",
            "usertype": "personal",
            "val": "Fionnuala@testrte.com",
            "emailid": "Fionnuala@testrte.com"
        },
        {
            "zuid": 1035,
            "fullname": "Kirsten Mata",
            "usertype": "personal",
            "val": "Kirsten@testrte.com",
            "emailid": "Kirsten@testrte.com"
        },
        {
            "zuid": 1036,
            "fullname": "Austen Salinas",
            "usertype": "personal",
            "val": "Austen@testrte.com",
            "emailid": "Austen@testrte.com"
        },
        {
            "zuid": 1037,
            "fullname": "Reiss Piper",
            "usertype": "personal",
            "val": "Reiss@testrte.com",
            "emailid": "Reiss@testrte.com"
        },
        {
            "zuid": 1038,
            "fullname": "Jamel Charles",
            "usertype": "personal",
            "val": "Jamel@testrte.com",
            "emailid": "Jamel@testrte.com"
        },
        {
            "zuid": 1039,
            "fullname": "Lloyd Harrington",
            "usertype": "personal",
            "val": "Lloyd@testrte.com",
            "emailid": "Lloyd@testrte.com"
        },
        {
            "zuid": 1040,
            "fullname": "Presley Rodrigues",
            "usertype": "personal",
            "val": "Presley@testrte.com",
            "emailid": "Presley@testrte.com"
        },
        {
            "zuid": 1041,
            "fullname": "Payton Bannister",
            "usertype": "personal",
            "val": "Payton@testrte.com",
            "emailid": "Payton@testrte.com"
        },
        {
            "zuid": 1041,
            "fullname": "min",
            "usertype": "personal",
            "val": "min@testrte.com",
            "emailid": "min@testrte.com"
        },
        {
            "zuid": 1041,
            "fullname": "max",
            "usertype": "personal",
            "val": "max@testrte.com",
            "emailid": "max@testrte.com"
        },
        {
            "zuid": 1041,
            "fullname": "sum",
            "usertype": "personal",
            "val": "sum@testrte.com",
            "emailid": "sum@testrte.com"
        },
        {
            "zuid": 1041,
            "fullname": "sub",
            "usertype": "personal",
            "val": "sub@testrte.com",
            "emailid": "sub@testrte.com"
        }
    ];    
}