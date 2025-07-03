import { DOMSerializer } from 'prosemirror-model';
import { getAttributes, getNodeFromJSON, generateSchema } from "./RichTextEditorView"
import { version } from '../package.json';
import RichTextEditor from './RichTextEditor';
import { getFeatureConfigFromOpts } from "./RichTextEditorView"
import dompurify from "dompurify"

const rteVersionAttrName = 'data-rte-version'
const inlineStyleCSSRulesFilteringName = '.ui-rte-editor-div'
const inlineStyleKeysAttrName = 'data-added-inline-style-keys'
const inlineStylesPresentAttrName = 'data-rte-inline-styles'
var inlineStyleCSSRulesToMatch;

export function getHTMLElFromHTMLString(htmlString) {
    var div = document.createElement('div')
    div.innerHTML = htmlString
    return div.firstChild
}

function getSVGContainer() {
    // this svg container remains static and changing of checkList icons will not change this svg container
    // that is the reason we have hardcorded the html string of the svg container
    var svgContainerHTMLString = `<svg version="1.1" xmlns="ht` + `tp://www.w3.org/2000/svg" xmlns:xlink="ht` + `tp://www.w3.org/1999/xlink" style="display: none;"></svg>`
    return getHTMLElFromHTMLString(svgContainerHTMLString)
}

function addFeatureSpecificHTML(element, needCSSVariables, needDarkTheme, options, featuresPresent) {
    if(featuresPresent.checkList) {
        let checkListOpts = getFeatureConfigFromOpts("checkList", options)
        let svgContainer = getSVGContainer()
        let checkedIconHTMLEl, uncheckedIconHTMLEl
        if(checkListOpts.checkedSVGID) {
            checkedIconHTMLEl = checkListOpts.getCheckedIconHTMLEl(needCSSVariables, needDarkTheme, element)
        } else {
            checkedIconHTMLEl = RichTextEditor.getConf().checkList.getCheckedIconHTMLEl()
        }
        svgContainer.appendChild(checkedIconHTMLEl)

        if(checkListOpts.unCheckedSVGID) {
            uncheckedIconHTMLEl = checkListOpts.getUncheckedIconHTMLEl(needCSSVariables, needDarkTheme, element)
        } else {
            uncheckedIconHTMLEl = RichTextEditor.getConf().checkList.getUncheckedIconHTMLEl()
        }
        svgContainer.appendChild(uncheckedIconHTMLEl)

        element.appendChild(svgContainer)

        if(!checkListOpts.checkedSVGID || !checkListOpts.unCheckedSVGID) {
            if(!needCSSVariables) {
                // convert the css varaible in fill attribute of the svg to it's value
                Array.prototype.forEach.call(svgContainer.querySelectorAll('[fill]'), (ele) => {
                    let cssVar = ele.getAttribute('fill')
                    let cssVal = getValueOfCSSVariable('fill', cssVar, needDarkTheme, options)
                    ele.setAttribute('fill', cssVal)
                })
            } else {
                // if css variables are allowed, then we would put the values of editor related css variables and editorSpecific css variables at the top div
                // but svg icons contain css variables whose values are in menubar related css variables
                // we can't add all menubar related css variables and its values in the top div, this would increase the length of html string
                // so first we need to find which menubar related css variables are used and it's corresponding value in dark theme or in light theme
                // and then we need to add only those css variables and it's values in the top div
                let menubarCSSVarUsed = {}
                Array.prototype.forEach.call(svgContainer.querySelectorAll('[fill]'), (ele) => {
                    let cssVar = ele.getAttribute('fill')
                    let cssVarName = getCSSVarName(cssVar, 'fill')
                    if(needDarkTheme && options.menubarDarkThemeColors[cssVarName]) {
                        menubarCSSVarUsed[cssVarName] = options.menubarDarkThemeColors[cssVarName]
                    } else if(options.menubarLightThemeColors[cssVarName]) {
                        menubarCSSVarUsed[cssVarName] = options.menubarLightThemeColors[cssVarName]
                    }
                })
                
                for (var cssVar in menubarCSSVarUsed) {
                    element.style.setProperty(cssVar, menubarCSSVarUsed[cssVar])
                }
            }
        }
    }
}

function getCSSVarName(val, prop) {
    // CSSStyleValue API is not in firefox, so if browser is firefox, then we need to write a logic to get the css variable name
    if (!window.CSSStyleValue) {
        // here val can be anyone of the following types
        // 1. var(--rte-bg-color)
        // 2. var(--rte-bg-color, blue)
        // 3. var(--rte-bg-color, var(--rte-text-color))
        // 4. var(--rte-bg-color, var(--rte-text-color, blue))
        // it can go nested like above also

        // our intention is to first get the first variable name alone
        // in all above 4 cases we need to get --rte-bg-color and get the associated value in editorLightThemeColors or editorDarkThemeColors
        let cssVarNameRegex = /--[a-zA-Z0-9\-_]+/
        let match = cssVarNameRegex.exec(val)
        if (match) {
            return match[0]
        } else {
            return null
        }
    } else {
        return CSSStyleValue.parse(prop, val)[0] && CSSStyleValue.parse(prop, val)[0].variable
    }
}

function getValueOfCSSVariable(prop, val, needDarkTheme, options) {
    var cssVarName = getCSSVarName(val, prop)

    // if the cssVarName is not present in editorLightThemeColors or in editorDarkThemeColors, or in editorSpecificCssVariables,
    // or in menubarLightThemeColors, or in menubarDarkThemeColors, then return the same value
    // else return the value that is present in editorLightThemeColors or editorDarkThemeColors or editorSpecificCssVariables,
    // or menubarLightThemeColors or menubarDarkThemeColors

    // we have included menubarDarkThemeColors and menubarLightThemeColors also because, for checklists we need to include the checkList icons too,
    // so for checkList icon we have used css variable in fill attribute of the svg, so inorder to get the value of the css variable
    if(needDarkTheme && options.editorDarkThemeColors[cssVarName]) {
        return options.editorDarkThemeColors[cssVarName]

    } else if(needDarkTheme && options.editorSpecificCssVariables[cssVarName]) {
        return options.editorSpecificCssVariables[cssVarName]

    } else if(needDarkTheme && options.menubarDarkThemeColors[cssVarName]) {
        return options.menubarDarkThemeColors[cssVarName]

    } else if(options.editorLightThemeColors[cssVarName]) {
        return options.editorLightThemeColors[cssVarName]

    } else if(options.editorSpecificCssVariables[cssVarName]) {
        return options.editorSpecificCssVariables[cssVarName]

    } else if(options.menubarLightThemeColors[cssVarName]) {
        return options.menubarLightThemeColors[cssVarName]

    }  else {
        return val

    }
}

// the applyInline() function and matchRules() function was taken from net to 
// inline the styles which is written in css files

function applyInline(element, needCSSVariables, needDarkTheme, options) {
    const matches = matchRules(element);
    // we need to preserve any pre-existing inline styles.
    var srcRules = document.createElement(element.tagName).style;
    srcRules.cssText = element.style.cssText;
    var keysAdded = []
    matches.forEach(rule => {
        for (var prop of rule.style) {
            let val = srcRules.getPropertyValue(prop) || rule.style.getPropertyValue(prop);
            let priority = rule.style.getPropertyPriority(prop);
            if(!needCSSVariables && val.startsWith('var(')) { // replace only values that are css variables
                val = getValueOfCSSVariable(prop, val, needDarkTheme, options)
            }
            element.style.setProperty(prop, val, priority);

            // add the keys of styles that are added through inline styles, so that in preprocessing we can remove these keys and process the html
            // we need this preprocessing step because, if we don't do this, then
            // for link nodes and for few other nodes through inline style text-decoration: underline, font-color: blue, all these will be considered as marks
            // when the inlineStyles html is given during initialisation, inorder to avoid this
            // we do a preprocess of html.
            if(!srcRules.getPropertyValue(prop) && rule.style.getPropertyValue(prop)) {
                keysAdded.push(prop)
            }
        }
    });

    if(keysAdded.length > 0) {
        element.setAttribute(inlineStyleKeysAttrName, keysAdded.join(','))
    }

    // iterate the same process for all it's children
    Array.prototype.forEach.call(element.children, (child) => {
        applyInline(child, needCSSVariables, needDarkTheme, options);
    })

}

// get the css rules that matches for the given el from the css page(stylesheet) that is provided
function matchRules(el) {
    var ret = [];
    for (var r in inlineStyleCSSRulesToMatch) {
        if(el.matches(inlineStyleCSSRulesToMatch[r].selectorText)) {
            ret.push(inlineStyleCSSRulesToMatch[r]);
        }
    }
    return ret;
}

function getHTML(json, options, domSerializer, inlineStyleOptions) {
    var node = getNodeFromJSON(json, options);
    var target = document.createElement('div'); //no i18n
    var schema = generateSchema(options);
    target.style.display = 'none'; //no i18n

    var featuresPresent = { checkList: false }

    var domSerializer = domSerializer || DOMSerializer.fromSchema(schema)

    // fix for empty paras rendering
    domSerializer.nodes.paragraph = function (node) {
        var isEmptyPara = !node.textBetween(0, node.content.size, '$', 'o').length
        var dom = node.type.spec.toDOM(node)
        if (isEmptyPara) {
            dom[2] = ['br', { class: 'rte-ignore-br' }] // set br as the child
        }
        return dom
    }

    // fix for setting cell width based on attr
    domSerializer.nodes.table_cell = function (node) {
        var dom = node.type.spec.toDOM(node)
        var attributes = dom[1]
        if (attributes['data-colwidth']) {
            attributes.width = attributes['data-colwidth']
        }
        return dom;
    }

    // for knowing whether checkList feature is present or not
    // only if checkList feature is present we need to append the svg icons for checkList, else no need to append the icons unnecessarily
    domSerializer.nodes.checkList = function (node) {
        featuresPresent.checkList = true
        return node.type.spec.toDOM(node)
    }

    domSerializer.serializeFragment(
        node.content,
        window.document,
        target
    );

    // add default css styles to target as inline styles
    // add a style element with code_block styles if necessary
    var div = document.createElement('div');
    var attributes = getAttributes(options);
    attributes[rteVersionAttrName] = version // put rte version in getHTML alone for now, because we are doing preprocessing of html alone now
    // in future we need to put version in json also
    for (var attr in attributes) {
        div.setAttribute(attr, attributes[attr])
    }

    // set needCSSVariable variable only if inlineStyleOptions is not provided or if inlineStyleOptions.cssVariables is true
    // if inlineStyleOptions.cssVariables is false, then don't set css variables
    var needCSSVariables = inlineStyleOptions && inlineStyleOptions.cssVariables === false ? false : true
    // set needDarkTheme variable to true only if inlineStyleOptions is provided and if inlineStyleOptions.isDarkThemeEnabled is true
    // else set needDarkTheme as false
    var needDarkTheme = inlineStyleOptions && inlineStyleOptions.isDarkThemeEnabled

    if (needCSSVariables) {
        // set css variables based on theme
        if (needDarkTheme) {
            for (var cssVar in options.editorDarkThemeColors) {
                div.style.setProperty(cssVar, options.editorDarkThemeColors[cssVar])
            }
        } else {
            for (var cssVar in options.editorLightThemeColors) {
                div.style.setProperty(cssVar, options.editorLightThemeColors[cssVar])
            }
        }

        for (var cssVar in options.editorSpecificCssVariables) {
            div.style.setProperty(cssVar, options.editorSpecificCssVariables[cssVar])
        }
    }

    div.innerHTML = target.innerHTML

    addFeatureSpecificHTML(div, needCSSVariables, needDarkTheme, options, featuresPresent)

    if(!inlineStyleOptions || !inlineStyleOptions.inlineStyles) {
        return div.outerHTML
    }

    /**
     * inlineStyleOptions object will have 2 keys
     * 1. inlineStyles - boolean - if false inline styles not required, if true then inline styles required
     * 2. stylesheet - optional, if not provided then by default we take rte.css from document.styleSheets array,
     * in browser stylesheets will be converted as js objects, 
     * so if that sylesheet object is not present in document.styleSheets array, then
     * the user needs to provide the stylesheet js object in this param
     */

    var styleSheet;
    if(inlineStyleOptions && inlineStyleOptions.styleSheet) {
        styleSheet = inlineStyleOptions.styleSheet
    } else if (inlineStyleOptions && !inlineStyleOptions.styleSheet && inlineStyleOptions.inlineStyles) {
        styleSheet = Array.prototype.filter.call(document.styleSheets, (sheet) => sheet.href && sheet.href.includes("/css/rte.css"))[0]
    } 
    
    if(!styleSheet) {
        // sometimes if user does'nt provide stylesheet and if we are also not able to get defaultStyleSheet, then in those cases throw an error
        throw new Error("Error: Missing file rte.css")
    }

    // set this flag, so that in preprocessig only if this flag is there do preprocessing
    // if this flag is not there, then it means html is not obtained by puttting inlineStyles: true option in getHTML
    // so no need to do preprocessing
    div.setAttribute(inlineStylesPresentAttrName, "true")

    if (!inlineStyleCSSRulesToMatch) {
        inlineStyleCSSRulesToMatch = styleSheet.rules || styleSheet.cssRules;
        inlineStyleCSSRulesToMatch = Array.prototype.filter.call(inlineStyleCSSRulesToMatch, (rule) => {
            if (rule.selectorText && rule.selectorText.includes(inlineStyleCSSRulesFilteringName)) {
                return true
            } else {
                return false
            }
        })
    }

    applyInline(div, needCSSVariables, needDarkTheme, options)
    return div.outerHTML;
}

export function sanitize(htmlString) {

    dompurify.addHook('uponSanitizeAttribute', (node, data) => {
        // Allow all attributes that do NOT start with "on"
        if (!data.attrName.toLowerCase().startsWith('on')) {
            data.forceKeepAttr = true;
        }
    });

    // by default iframe and use tags are being removed by dompurify
    // so we need to add them explicitly to the default allowed list of tags
    return dompurify.sanitize(htmlString, {ADD_TAGS: ['iframe', 'use']})
}

export function processHTMLByRemovingInlineStyles(htmlString) {
    htmlString = sanitize(htmlString)
    var div = document.createElement('div')
    div.innerHTML = htmlString

    if(div.querySelectorAll("[" + inlineStylesPresentAttrName + "]").length > 0) {
        // iterate through all the keys in inlineStyleKeysAttrName and remove those properties from the style attribute in each element
        var eleWithInlineStyleKeysAttr = div.querySelectorAll('[' + inlineStyleKeysAttrName + ']')
        eleWithInlineStyleKeysAttr.forEach((ele) => {
            let keys = ele.getAttribute(inlineStyleKeysAttrName).split(',')
            keys.forEach((key) => {
                ele.style.removeProperty(key)
            })
            ele.removeAttribute(inlineStyleKeysAttrName)
            if(ele.style.cssText === '') {
                // Note: ele.style.cssText will convert all hexcodes for representing fontColor, bgColor to rgb
                // and if cssText is like "font-size:18pt", then cssText returns "font-size: 18pt" by adding space after colon
                // this is done for all properties in style attribute
                // but giving this preprocessed html again to the editor, the getAttrs() function for each node,
                // removes this space after colon, converts this rgb to hexcodes
                // and returns the normal html string that would have obtained by putting getHTML()
                // as a result there wouldn't be difference at all.
                ele.removeAttribute('style')
            }
        })
    }

    return div.innerHTML
}

export default getHTML