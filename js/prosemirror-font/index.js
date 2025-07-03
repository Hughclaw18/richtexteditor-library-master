export { addFontColorMark, addFontFamilyMark, addFontSizeMark, addHighlightMark, getStandardFonts, convertFontFamilyValueToDisplayName, getStandardFontSizes } from "./utils"
import converter from "../utils/SizeConverter";
import getHexFor from "../utils/ColorConverter";

export const DEFAULT_FONT_VALUES = { // #move to default config check
    MIN_SIZE: 8,
    MAX_SIZE: 36,
    FALLBACK_COLOR_IN_COLOR_CONVERTER: "#00000000"
}

export function markApplies(doc, ranges, type) {

    var rangeAllowsMark = function (i) {

        var ref = ranges[i];
        var $from = ref.$from;
        var $to = ref.$to;
        var can = $from.depth == 0 ? doc.type.allowsMarkType(type) : false;//if depth is 0 check first whether doc node allows this markType else set can to false

        doc.nodesBetween($from.pos, $to.pos, function (node) {
            if (can) { return false }
            can = node.inlineContent && node.type.allowsMarkType(type);
        });
        if (can) { return { v: true } }

    };

    for (var i = 0; i < ranges.length; i++) {

        var returned = rangeAllowsMark(i);
        if (returned) {
            return returned.v;
        }

    }
    return false
}

export function setFontSizeWithUnits(view, size, unit, opts) {
    // no need to do conversion stuffs or set min or max values, do it when any user raises that requirement
    let sizeToBeSet = size + unit
    if(sizeToBeSet === view.rteView.options.defaults.fontSize) {
        sizeToBeSet = ''
    }
    setFontAttrs(view, view.state.schema.marks.fontSize, sizeToBeSet, opts)
}

export function setFontSize(view, size, opts) {

    //pre-processing operations for font-size
    let sizeValue = Number(size);
    var defaultFontSize = converter(view.rteView.options.defaults.fontSize).points
    var { maxFontSize, minFontSize } = view.rteView.options
    if (sizeValue === defaultFontSize) {
        sizeValue = ''; //nothing to do
    } else if (sizeValue >= minFontSize && sizeValue <= maxFontSize) {
        sizeValue = Math.round((sizeValue + Number.EPSILON) * 100) / 100//to roundOff to 2 decimal places.
        sizeValue = sizeValue + "pt"//add the sizing unit
    } else if (sizeValue < minFontSize) {
        sizeValue = minFontSize
        sizeValue = sizeValue + "pt"
    } else if (sizeValue > maxFontSize) {
        sizeValue = maxFontSize
        sizeValue = sizeValue + "pt"
    } else {
        throw new Error("unexpected parameter for size in setFontSize: " + size)
    }

    setFontAttrs(view, view.state.schema.marks.fontSize, sizeValue, opts)
}

export function setFontFamily(view, fontFamily, opts) {
    //pre-processing operations for font-family
    var value;
    // view.rteView.options.defaults.fontFamily is an object with displayName and value properties or else it can be plain string, we need to handle for both
    // types of inputs, in string case, the displayName and value are same.
    // eg: {displayName: "Arial", value: "Arial, Helvetica, Sans-Serif"} or "Arial, Helvetica, Sans-Serif"
    var defaultFontFamily = view.rteView.options.defaults.fontFamily
    var allowedFonts = view.rteView.options.fonts
    var defaultFontFamilyDisplayName = typeof defaultFontFamily === 'string' ? defaultFontFamily.toLowerCase() : defaultFontFamily.displayName.toLowerCase()
    var defaultFontFamilyValue = typeof defaultFontFamily === 'string' ? defaultFontFamily.toLowerCase() : defaultFontFamily.value.toLowerCase()
    fontFamily = fontFamily.toLowerCase()

    // allow only fonts present in the allowedFonts array
    if(fontFamily === defaultFontFamilyDisplayName || fontFamily === defaultFontFamilyValue) {
        value = '';
    } else {
        if(allowedFonts.some((font) => font.value.toLowerCase() === fontFamily)) {
            value = allowedFonts.filter((font) => font.value.toLowerCase() === fontFamily)[0].value
        } else if(allowedFonts.some((font) => font.displayName.toLowerCase() === fontFamily)) {
            value = allowedFonts.filter((font) => font.displayName.toLowerCase() === fontFamily)[0].value
        } else {
            value = ''
        }
    }

    setFontAttrs(view, view.state.schema.marks.fontFamily, value, opts)
}

export function setBackgroundColor(view, backgroundColor, opts) {
    //pre-processing for background-color
    var value = '';

    if(backgroundColor) {
        backgroundColor = getHexFor(backgroundColor) // only allow #rrggbbaa format for font color and background color because,
        // font nodes and other related code are designed assuming only this format will come inside the editor
        if (backgroundColor !== view.rteView.options.defaultBackgroundColor) {
            value = backgroundColor;
        }
    }

    setFontAttrs(view, view.state.schema.marks.highlight, value, opts)
}

export function setFontColor(view, fontColor, opts) {
    //pre-processing for font-color
    var value = '';

    if(fontColor) {
        fontColor = getHexFor(fontColor) // only allow #rrggbbaa format for font color and background color because, 
        // font nodes and other related code are designed assuming only this format will come inside the editor
        if (fontColor !== view.rteView.options.defaultFontColor) {
            value = fontColor;
        }
    }

    setFontAttrs(view, view.state.schema.marks.fontColor, value, opts)
}


export function setFontAttrs(view, markType, value, opts) {

        var ref = view.state.selection;
        var empty = ref.empty;
        var $cursor = ref.$cursor;
        var ranges = ref.ranges;
        var state = view.state;
        var dispatch = view.dispatch;
        
        if ((empty && !$cursor) || !markApplies(view.state.doc, ranges, markType)) {
            return false
        }

        var attrs = {value: value};

        if(opts && opts.extraAttrs) {
            attrs.extraAttrs = opts.extraAttrs
        }

        /** This code is generic for font-family, font-size.
         * For example, if we want to change the font:
         * 
         * Case 1: If $from === $to then we would have value for $cursor
         * 
         *      a. Sub-Case-1:If fontFamily value in attrs is empty, it means the required fontFamily value is the default font type defined in CSS file, and if we want default font type we no need to add any mark , we should only remove the fontFamily mark if it is already present.
         *      
         *      b. Sub-Case 2:If fontFamily mark with the attrs value "Times New Roman" is already present then, and if we want to change the font type to "Courier New", then we need to first remove the fontFamily mark with the attrs value "Times New Roman" and then only add a new fontFamily mark with the attrs set to "Courier New".
         * 
         *      c. Sub-Case 3:If fontFamily value in attrs has some value and if fontFamily mark is not present at all then we only need to add the fontFamily mark to stored marks.
         * 
         * Case 2: If $from !== $to then we would not have any value for $cursor:
         * 
         *      a. Sub-Case-1: If we want to change the font type to default font then we need to just remove the fontFamily mark if it is already present.
         *
         *      b. Sub-Case-2: If we want to change the font to another font , then first remove the fontFamily mark if it is already present and then add the fontFamily mark with the attrs value set to the required font type.
         */

        if ($cursor) {

            if ( !attrs.value ) {
                dispatch(state.tr.removeStoredMark(markType))
            } else if (markType.isInSet(state.storedMarks || $cursor.marks())) {
                let tr1 = state.tr.removeStoredMark(markType);
                dispatch(tr1.addStoredMark(markType.create(attrs)));
            } else {
                dispatch(state.tr.addStoredMark(markType.create(attrs)));
            }

        } else {
            var tr = state.tr;

            for (var i$1 = 0; i$1 < ranges.length; i$1++) {

                var ref$2 = ranges[i$1];
                var $from$1 = ref$2.$from;
                var $to$1 = ref$2.$to;

                if (!attrs.value) {
                    tr = tr.removeMark($from$1.pos, $to$1.pos, markType)
                    continue;
                }

                tr = tr.removeMark($from$1.pos, $to$1.pos, markType);
                tr = tr.addMark($from$1.pos, $to$1.pos, markType.create(attrs));

            }
            view.dispatch(tr);
        }

        return true
}