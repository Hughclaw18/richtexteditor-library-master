import { getFontColorMark, getFontFamilyMark, getFontSizeMark, getHighlightMark } from "./fontNodes"

export function addFontFamilyMark(marks, options) {
	return marks.append({
		fontFamily: getFontFamilyMark(options)
	});
};

export function addFontSizeMark(marks, options) {
	return marks.append({
		fontSize: getFontSizeMark(options)
	});
};

export function addFontColorMark(marks, options) {
	return marks.append({
		fontColor: getFontColorMark(options)
	});
};

export function addHighlightMark(marks, options) {
	return marks.append({
		highlight: getHighlightMark(options)
	});
};

function getStandardFonts() {
	return [
		{ displayName: "Serif", value: "Serif" }, 
		{ displayName: "Arial", value: "Arial, Helvetica, Sans-Serif" }, 
		{ displayName: "Courier New", value: "Courier New, Courier, Monospace" }, 
		{ displayName: "Georgia", value: "Georgia, Times New Roman, Times, Serif" }, 
		{ displayName: "Tahoma", value: "Tahoma, Arial, Helvetica, Sans-Serif" }, 
		{ displayName: "Times New Roman", value: "Times New Roman, Times, Serif" }, 
		{ displayName: "Trebuchet MS", value: "Trebuchet MS, Arial, Helvetica, Sans-Serif" }, 
		{ displayName: "Verdana", value: "Verdana, Arial, Helvetica, Sans-Serif" }, 
		{ displayName: "Comic Sans MS", value: "Comic Sans MS" }, 
		{ displayName: "Calibri", value: "Calibri, Verdana, Arial, Sans-Serif" }
	]
}

export function convertFontFamilyValueToDisplayName(value, options) {
    return options.fonts.filter((font) => font.value.toLowerCase() === value.toLowerCase())[0].displayName
}

function getStandardFontSizes() {
	return ["8", "10", "12", "14", "18", "24", "36"]
}

export { getStandardFontSizes, getStandardFonts }