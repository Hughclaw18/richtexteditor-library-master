import { DEFAULT_FONT_VALUES } from "./index"
import converter from "../utils/SizeConverter"
import getHexFor from "../utils/ColorConverter"
import { getFeatureConfigFromOpts } from "../RichTextEditorView"

export function getFontFamilyMark (options) {
    //this alone is written as a function because we need options.fonts in parseDOM

    var availableFonts = options.fonts

    return {
        attrs: {
            value: { default: undefined }
        },
        parseDOM: [
            {
                style: 'font-family', // no i18n
    
                // Note: the attrs value that you set in toDOM() shld be same as the attrs value that you check for in parseDOM() , it should also maintain case sensitivity(lowerCase/upperCase)
    
                getAttrs: function (fontNames) {

                    var defaultFontFamilyDisplayName, defaultFontFamilyValue;

                    // in options.default.fontFamily the value can be a string or an object with displayName and value properties
                    if(typeof options.defaults.fontFamily === 'string') {
                        defaultFontFamilyDisplayName = options.defaults.fontFamily.toLowerCase()
                        defaultFontFamilyValue = options.defaults.fontFamily.toLowerCase()
                    } else {
                        defaultFontFamilyDisplayName = options.defaults.fontFamily.displayName.toLowerCase()
                        defaultFontFamilyValue = options.defaults.fontFamily.value.toLowerCase()
                    }
    
                    if (!fontNames) {
                        return false
                    }
    
                    let pastedFont = fontNames.toLowerCase().replace(/"|'/g, '');//removing quotes and converting to lowercase

                    let firstFont = pastedFont.split(',')[0];//preserving the first font-name alone

                    if(pastedFont === defaultFontFamilyValue || firstFont === defaultFontFamilyDisplayName) {
                        return false
                    }

                    if( availableFonts.some((availableFont) => availableFont.value.toLowerCase() === pastedFont) ) {
                        // if pastedFont is present in available fonts array then put that else don't put it.
                        return {
                            value: availableFonts.filter((availableFont) => availableFont.value.toLowerCase() === pastedFont)[0].value
                        }
                    } else if( availableFonts.some((availableFont) => availableFont.displayName.toLowerCase() === firstFont) ) {
                        // if firstFont is present in available fonts array then put that else don't put it.
                        return {
                            value: availableFonts.filter((availableFont) => availableFont.displayName.toLowerCase() === firstFont)[0].value
                        }
                    } else {
                        return false;
                    }
                }
            }
        ],
    
        toDOM: function (node) {
            var value = node.attrs.value 
            if (value) {
                return [
                    'span', // no i18n
                    { "style": "font-family:" + value + ";" }
                ];
            }
        }
    }
}

export function getFontSizeMark(options) {
    return {
        attrs: {
            value: { default: undefined }
        },
        parseDOM: [
            {
                style: 'font-size', // no i18n
    
                getAttrs: function (sizeValue) {
    
                    if (!sizeValue) {
                        return false
                    }

                    let fontSizeOpts = getFeatureConfigFromOpts("fontSize", options)
                    let allowCustomUnits = fontSizeOpts.allowCustomUnits

                    sizeValue = sizeValue.replace(/"|'| /g, '');

                    if(allowCustomUnits) {
                        // if allowCustomUnits flag is true, then only do if sizeValue === options.defaults.fontSize - if so return false
                        // else store that value

                        // no need to do conversion stuffs or set min or max values, do it when any user raises that requirement
                        if(sizeValue === options.defaults.fontSize) {
                            return false
                        } else {
                            return { value: sizeValue }
                        }
                    }

                    var sizeNumber = converter(sizeValue).points
                    sizeNumber = Math.round((sizeNumber + Number.EPSILON) * 100) / 100//to roundOff to 2 decimal places.
                    var defaultFontSize = converter(options.defaults.fontSize).points
    
                    if (!sizeNumber || sizeNumber === defaultFontSize) {
                        return false
                    } else if (sizeNumber < options.minFontSize) {
                        sizeNumber = options.minFontSize;
                    } else if (sizeNumber > options.maxFontSize) {
                        sizeNumber = options.maxFontSize;
                    }
    
                    sizeValue = sizeNumber + "pt"
                    return { value: sizeValue };
                }
            }
        ],
    
        toDOM: function (node) {
            var value = node.attrs.value
            if (value) {
                return [
                    'span', // no i18n
                    { "style": "font-size:" + value + ";"}
                ];
            }
        }
    }
}

export function getFontColorMark(options) { 
    return {
        attrs: {
            value: { default: undefined }
        },
        parseDOM: [
            {
                style: 'color',
                getAttrs: function (colorValue) {

                    if(colorValue) {
                        colorValue = getHexFor(colorValue) // only allow #rrggbbaa format for font color and background color because, 
                        // font nodes and other related code are designed assuming only this format will come inside the editor
                        if(colorValue !== options.defaultFontColor && colorValue !== DEFAULT_FONT_VALUES.FALLBACK_COLOR_IN_COLOR_CONVERTER) {
                            return { value: colorValue }
                        }
                    }

                    return false
                }
            }
        ],

        toDOM: function (node) {
            var { value } = node.attrs
            if (value) {
                return [
                    'span', // no i18n
                    { "style": "color:" + value + ";" }
                ];
            }
        }
    }
}

// for font background color feature we are extending the highlight mark feature itself instead of creating a new node for background color.
export function getHighlightMark(options) { 
    return {
        attrs: {
            value: { default: "rgb(255, 255, 0)" }// we are setting this rgb(255, 255, 0) color as default because for backward compatibility. Since in the older comments taken from writer there will be a highlight node which would not have any attribute values..... so for those cases we are setting the default value as this rgb(255, 255, 0) color.
        },
        parseDOM: [
            {
                style: 'background-color',
                getAttrs: function (colorValue) {

                    if(colorValue) {
                        colorValue = getHexFor(colorValue) // only allow #rrggbbaa format for font color and background color because, 
                        // font nodes and other related code are designed assuming only this format will come inside the editor
                        if(colorValue !== options.defaultBackgroundColor && colorValue !== DEFAULT_FONT_VALUES.FALLBACK_COLOR_IN_COLOR_CONVERTER) {
                            return { value: colorValue }
                        }
                    }

                    return false
                }
            }
        ],

        toDOM: function (node) {
            var { value } = node.attrs
            if (value) {
                return [
                    'span', // no i18n
                    { "style": "background-color:" + value + ";" }
                ];
            }
        }
    }
}