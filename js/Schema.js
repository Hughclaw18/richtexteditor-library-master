import { getFeatureConfigFromOpts } from "./RichTextEditorView"

var paragraphTagTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

function getAttrsForPara(options) {
    return function(el) {
        var align = null, lineHeight = null, dir=null, indent = null;
        var defaultLineHeight = options.defaults.lineHeight === "normal"? "normal" : parseFloat(options.defaults.lineHeight)

        if (!options.rtl && el.style.textAlign && ["right", "center", "justify"].includes(el.style.textAlign) && getFeatureConfigFromOpts("align", options)) {//don't check for left alignment becuase left alignment is the default value, so it is not necessary to explicitly mention it.
            align = el.style.textAlign
        } else if(options.rtl && el.style.textAlign && ["left", "center", "justify"].includes(el.style.textAlign) && getFeatureConfigFromOpts("align", options)) {
            align = el.style.textAlign
        }

        // if there is no options.rtl, then the default text-direction is ltr only, so we need to look for rtl only and put it explicitly if it is present,
        // if there is options.rtl, then the default text-direction is rtl, so we need to look for ltr and put it explicitly if it present
        if (!options.rtl && (el.getAttribute('dir') === "rtl" || el.style.direction === "rtl") && getFeatureConfigFromOpts("direction", options)) {
            dir = el.getAttribute('dir') || el.style.direction
        } else if (options.rtl && (el.getAttribute('dir') === "ltr" || el.style.direction === "ltr") && getFeatureConfigFromOpts("direction", options)) {
            dir = el.getAttribute('dir') || el.style.direction
        }

        if (el.style.lineHeight && getFeatureConfigFromOpts("lineHeight", options)) {
            if( defaultLineHeight === "normal" && el.style.lineHeight.toString() === defaultLineHeight) {
                lineHeight = null;
            } else if( parseFloat(el.style.lineHeight) === defaultLineHeight ) {
                lineHeight = null;
            } else {
                lineHeight = el.style.lineHeight
            }
        }

    if(el.getAttribute('data-indent-left-level') && getFeatureConfigFromOpts("indent", options)) {
        indent = Number(el.getAttribute('data-indent-left-level'))
    } else if(el.getAttribute('data-indent-right-level') && getFeatureConfigFromOpts("indent", options)) {
        indent = Number(el.getAttribute('data-indent-right-level'))
    }

        let type = el.tagName.toLowerCase()

        if((paragraphTagTypes.includes(type)) && !getFeatureConfigFromOpts("headings", options)) {// if headings are not required then hardcode the type as p tag
            type = 'p'
        }

        return { align:align, lineHeight:lineHeight , dir:dir, type: type, indent: indent }

    }

}

function isStringPresent(sentence, stringToBeSearched) {
    if(sentence.indexOf(stringToBeSearched)>=0) {
        return true
    } else {
        return false
    }
}

var getSchema = function(options) {

    var basicNodes = {
        // :: NodeSpec The top level document node.
        doc: {
            content: options.isSingleLine ? 'paragraph' : 'block+' // no i18n
        },

        paragraph: {
            content: 'inline*', // no i18n
            group: 'block', // no i18n
            attrs: {
                align: { default: null },
                lineHeight: { default: null },
                dir: {default: null },
                indent: {default: 0},
                type: {default: 'p'} // 'h1' / 'h2' / 'h3' / 'h4' / 'h5' / 'h6'
            },
            parseDOM: [
                {
                    tag: 'p',
                    getAttrs: getAttrsForPara(options)
                },
                {
                    tag: 'h1',
                    getAttrs: getAttrsForPara(options)
                },
                {
                    tag: 'h2',
                    getAttrs: getAttrsForPara(options)
                },
                {
                    tag: 'h3',
                    getAttrs: getAttrsForPara(options)
                },
                {
                    tag: 'h4',
                    getAttrs: getAttrsForPara(options)
                },
                {
                    tag: 'h5',
                    getAttrs: getAttrsForPara(options)
                },
                {
                    tag: 'h6',
                    getAttrs: getAttrsForPara(options)
                }
            ], // no i18n
            toDOM: function (node) {

                var textAlign = node.attrs.align;
                var lineHeight = node.attrs.lineHeight;
                var dir = node.attrs.dir;
                var type = node.attrs.type
                var indent = node.attrs.indent

                var styleText="";

                styleText = styleText + (textAlign? 'text-align:' + textAlign + ';' : '');
                styleText = styleText + (lineHeight? 'line-height:' + lineHeight + ';' : '');

                var attrs = {}

                if(dir) {
                    attrs.dir = dir
                }

                if(styleText) {
                    attrs.style = styleText
                }

                if(indent) {
                    if((!options.rtl && !dir) || (options.rtl && dir)) {
                        // indicates 
                        // default text-direction = ltr and text-direction mark = no , or
                        // default text-direction = rtl and text-direction mark = yes
                        attrs['data-indent-left-level'] = indent
                    } else if((!options.rtl && dir) || (options.rtl && !dir)) {
                        // indicates 
                        // default text-direction = ltr and text-direction mark = yes
                        // default text-direction = rtl and text-direction mark = no
                        attrs['data-indent-right-level'] = indent
                    }
                    
                }

                return [type, attrs, 0]; // no i18n
            }
        },

        text: {
            group: 'inline' // no i18n
        }
    }

    if(!options.isSingleLine) {
        basicNodes.br = {
            inline: true,
            group: 'inline', // no i18n
            selectable: false,
            parseDOM: [{
                    tag: 'br',
                    getAttrs: function(el) {
                        if(el.className.indexOf('rte-ignore-br') >= 0) { 

                            // prosemirror adds automatically br tags between empty p tags, while doing toJSON() prosemirror removes these br tags.

                            // this className will be added in RichTextEditor.getHTML() method for empty paras becuase if empty paras are left as such then all
                            // the empty paras will not be in separate separate line instead they won't be visible at all, so inorder to make it visible we add br tags
                            // in between empty paras.

                            // once it is added while using the same html if we do setHTML() then along with this br prosemirror adds additional br, as a result 2 empty lines will exist
                            // for each empty para, so inorder to avoid this we remove the br tags that has this class name, so that prosemirror will automatically add only one br between empty
                            // p tags.
                            return false
                        }
                    }
                }
            ], // no i18n
            toDOM: function () {
                return ['br']; // no i18n
            }
        }
    }

    /**
     * Used this for mergefields, autofields. If any other fields are to be added use the same schema
     * #1 attrs : {
     *       fieldId *
     *       fieldName *
     *       type : 'mergefield|autofield' (by default it will be undefined /mergefield falls in this category/ if no value is passed)
     *       contentType : 'text|qrcode' (undefined by default /text falls in this category/ if no value passed)
     *       props : { props that are needed for rendering. Ex src for image }
     *       meta : { extra data that needs for other operations}
     *      }
     *
     * #2 toDOM : what should be given as html
     *    based on contentType tag changes
     *       img for image fields
     *       span for text fields
     *       additionally attr for rendering of each type will be added
     *      extra data that are not needed for rendering
     *
     *
     * #3 parseDOM : array of parsing rules while pasting
     *       #3a : Rule for blocking qrcode paste flow
     *       #3b : Rule 2 for text field
     *       
     *
     * NOTE: BEFORE IMAGE NODE RELEASE THIS FIELD IS USED AS A NODE SPECIFIC FOR MERGE FIELD ALONE
     * JSON STORED BEFORE THIS RELEASE WILL WORK PROPERLY AS THE NEWLY INTRODUCED ATTRS ARE GIVEN SOME DEFAULT VALUES, WHICH MATCHES TO MERGEFIELD JSON
     */
    // var mergefieldNode = {
    //     group: 'inline', // no i18n
    //     inline: true,
    //     atom: true,
    //     selectable: false,
    //     draggable: false,

    //     // #1
    //     attrs: {
    //         fieldId: '', //no i18n
    //         fieldName: '', //no i18n

    //         type: { default: undefined }, //no i18n
    //         contentType: { default: undefined },

    //         props: {
    //             default: undefined
    //         },

    //         meta: {
    //             default: undefined
    //         }
    //     },

    //     // #2
    //     toDOM: function (node) {
    //         // TODO : Move to es6 for cleaner code
    //         var fieldId = node.attrs.fieldId;
    //         var fieldName = node.attrs.fieldName;
    //         var type = node.attrs.type;
    //         var contentType = node.attrs.contentType;
    //         var props = node.attrs.props;
    //         var meta = node.attrs.meta;

    //         var tag = 'span';
    //         var uiText;

    //         var attrs = {
    //             'mm-field-id': fieldId,
    //             'mm-field-name': fieldName,
    //             'type': type,
    //             'content-type': contentType
    //         };

    //         if (meta) {
    //             attrs['data-field-info'] = JSON.stringify(meta);
    //         }

    //         // if contentType is qrcode, then the HTML structure goes 
    //         if (contentType === 'qrcode') {
    //             var imageAttrs = {};
    //             imageAttrs.src = props.src;
    //             attrs.title = props.title;
    //             imageAttrs.width = props.width;
    //             imageAttrs.height = props.height;
    //             attrs.class = 'fgImgOuterDiv js-image-field ui-display-inblock';    // no i18n
    //             toDom = [
    //                 'span',
    //                 attrs,
    //                 ['img', imageAttrs],
    //                 ['span', { class: 'ui-brokenImg-cont ui-flex-container ui-flex-center' },    // no i18n
    //                     [
    //                         'span',
    //                         { class: 'ui-brokenImg-innercont' },  // no i18n
    //                         ['span', { class: 'ui-emergefield-placeholder' }, fieldName]   // no i18n
    //                     ]
    //                 ]
    //             ];
    //         } else {
    //             var className = props && props.class;
    //             if (className) {
    //                 attrs.class = className;
    //             }

    //             if (type === 'autofield') {
    //                 uiText = fieldName;
    //             } else { // if no class passed render in default format.
    //                 uiText = '«' + fieldName + '»'; // no i18n
    //             }

    //             toDom = [tag, attrs, uiText];
    //         }

    //         return toDom;
    //     },

    //     // #3
    //     parseDOM: [
    //         // #3a - copy/paste disabling for qrcode
    //         {
    //             tag: 'span.js-image-field',
    //             ignore: true
    //         },
    //         {
    //             //3b - for other text nodes
    //             tag: 'span[mm-field-id][mm-field-name]', // no i18n
    //             getAttrs: function (dom) {
    //                 var fieldId = dom.getAttribute('mm-field-id'); // no i18n
    //                 var fieldName = dom.getAttribute('mm-field-name'); // no i18n
    //                 var type = dom.getAttribute('type'); // no i18n
    //                 var contentType = dom.getAttribute('content-type'); //no i18n
    //                 var props;
    //                 var className = dom.getAttribute('class');
    //                 if (className) {
    //                     props = { class: className };
    //                 }
    //                 var meta = dom.getAttribute('data-field-info'); //no i18n

    //                 var attrs = {
    //                     fieldId: fieldId,
    //                     fieldName: fieldName
    //                 };

    //                 if (meta) {
    //                     attrs.meta = meta;
    //                 }

    //                 if (props) {
    //                     attrs.props = meta;
    //                 }

    //                 if (type) {
    //                     attrs.type = type;
    //                 }

    //                 if (contentType) {
    //                     attrs.contentType = contentType;
    //                 }

    //                 return attrs;
    //             }
    //         }
    //     ]
    // }
    
    return {
        nodes : basicNodes
    }
}

// Marks are formatting attribute that can be applied on an element
// bold, italic, underline, link, backroundcolor are given here
var defaultMarks = {
    em: {
        content: 'text', // no i18n
        parseDOM: [
            { tag: 'i' }, // no i18n
            { tag: 'em' }, // no i18n
            { 
                style: 'font-style',
                getAttrs: function(value) {
                    value = value.toLowerCase()
                    return isStringPresent(value, "italic")
                } 
            } // no i18n
        ],

        toDOM: function () {
            return ['em']; // no i18n
        }
    },

    underline: {
        parseDOM: [
            { tag: 'u' }, // no i18n
            { 
                style: 'text-decoration',
                getAttrs: function(value) {
                    value = value.toLowerCase()
                    return isStringPresent(value, "underline")
                } 
            } // no i18n
        ],

        toDOM: function () {
            return ['u']; // no i18n
        }
    },

    strong: {
        parseDOM: [
            { tag: 'strong' }, // no i18n
            {
                tag: 'b', // no i18n
                getAttrs: function (node) {
                    return node.style.fontWeight != 'normal' && null; // no i18n
                }
            }, // no i18n
            {
                style: 'font-weight', // no i18n
                getAttrs: function (value) {
                    return /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null;
                }
            }
        ],

        toDOM: function () {
            return ['strong']; // no i18n
        }
    },

    strikeThrough: {
        parseDOM: [
            { tag: 's' }, // no i18n
            { tag: 'strike' },
            { tag: 'del' },
            { 
                style: 'text-decoration',
                getAttrs: function(value) {
                    value = value.toLowerCase()
                    return isStringPresent(value, "line-through")
                } 
            } // no i18n
        ],

        toDOM: function () {
            return ['del']; // no i18n
        }
    },

    script: {
        attrs: {
            type: { default: undefined }
        },
        parseDOM: [
            {
                style: 'vertical-align',
                getAttrs: function ( alignmentType ) {

                    if ( !alignmentType ) {
                        return false
                    } else if ( alignmentType === "super" ) {
                        return { type: "sup" }
                    } else if ( alignmentType === "sub" ) {
                        return { type: "sub" }
                    } else {//if some other alignmenType comes such as "vertical-align:baseline" ignore it.
                        return false;
                    }

                }
            },
            {
                tag: 'sup',
                getAttrs: function () {
                    return { type: "sup" }
                }
            },
            {
                tag: 'sub',
                getAttrs: function () {
                    return { type: "sub" }
                }
            }
        ],

        toDOM: function (node) {
            var { type } = node.attrs
            if ( type ) {
                return [ type ];
            }
        }
    }
}

export function addDefaultMarks(marks, name) {
    return marks.append({
        [name]: defaultMarks[name]
    })
}

function getLinkMarkAttrsForSchemaDefinition(isLinkMarkUsedInRegexReplacer) {
    let basicAttrs = {
        href: { default: null }
    }

    if(isLinkMarkUsedInRegexReplacer) {
        basicAttrs.autolinked = { default: false }
    }

    return basicAttrs
}

export function addLinkMark(marks, options) {

    var isLinkMarkUsedInRegexReplacer = false;
    if(options.regexReplacer) {
        isLinkMarkUsedInRegexReplacer = options.regexReplacer.some((regexReplacerObj) => regexReplacerObj.mark === 'link')
    }

    var linkNode = {
        attrs: getLinkMarkAttrsForSchemaDefinition(isLinkMarkUsedInRegexReplacer),
        inclusive: true,  // made true for spell replacement issue and
        // if it is false, then if a link is inserted and if we go and type in the middle of a
        // link, then the typed character will be without link mark, but what we want is, if a character is typed in the middle of a link, the link
        // mark should be carry forwarded, if it is typed only at the edges of a link it need not be carry forwarded.
        parseDOM: [
            {
                tag: 'a[href]', // no i18n
                getAttrs: function (dom) {
                    var emailId = dom.getAttribute('data-mention-email');
                    var attrs = {}, autolinked;
                    if(isLinkMarkUsedInRegexReplacer) {
                        autolinked = dom.getAttribute('data-auto-linked') === '' ? true: false;
                    }
                    if (!emailId) {
                            attrs.href = dom.getAttribute('href') // no i18n
                    } else {
                        return false;
                    }

                    if(autolinked) {
                        attrs.autolinked = autolinked;
                    }

                    return attrs;
                }
            }
        ],
        toDOM: function (node) {
            var { href } = node.attrs;
            var autolinked = node.attrs.autolinked;

            var toDOMRepresentation = ['a', {	// no i18n
                'href': href,	// no i18n
                'target': href.startsWith('#') ? '_self' : '_blank',	// this if check is done for anchor node, because anchor node's href starts with '#'
                // and for anchor node target should be '_self' and for all other links' target should be '_blank'
                // we put target as _self because if clicking that anchor node, the page should not be redirected to other page,
                // instead it should go to the anchor point in the same page.
                'rel': 'noreferrer',	// no i18n
                'class': 'rte-link'
            }];

            if(autolinked) {
                toDOMRepresentation[1]['data-auto-linked'] = '';
            }

            return toDOMRepresentation;
        }
    }

    return marks.append({
        link: linkNode
    })
}

export function addAnchorNode(nodes) {
    return nodes.append({
        anchor: {
            attrs: {
                id: { default: null }
            },
            inline: true,
            atom: true,
            selectable: false,
            draggable: false,
            isText: true,
            group: 'inline',
            parseDOM: [{
                tag: 'span[rte-anchor]',
                getAttrs: function (el) {
                    return { id: el.id }
                }
            }],
            toDOM: function (node) {
                var { id } = node.attrs;
                return ['span', { "rte-anchor": "", id: id }];
            }
        }
    })
}

export default getSchema
