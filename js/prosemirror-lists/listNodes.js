var supportedOrderedListStyleTypes = ['decimal', 'decimal-leading-zero', 'lower-alpha', 'lower-roman', 'upper-alpha', 'upper-roman']
var supportedUnorderedListTypes = ['disc', 'circle', 'square']

export const orderedList = {
    parseDOM: [
        {
            tag: "ol",
            getAttrs: function(el) {
                var listStyleType = el.style.getPropertyValue('list-style-type')
                var listType = el.getAttribute("type")
                var type
                if(listStyleType) {
                    if(supportedOrderedListStyleTypes.includes(listStyleType)) {
                        type = listStyleType
                    } else {
                        type = 'decimal'
                    }
                } else if(listType) {
                    // here different values for type attribute are A, a, i, I, 1 - these needs to be mapped with the values for list-style-type
                    // such as upper-alpha, lower-alpha, lower-roman, upper-roman, decimal respectively
                    if(listType === 'A') {
                        type = 'upper-alpha'
                    } else if(listType === 'a') {
                        type = 'lower-alpha'
                    } else if(listType === 'I') {
                        type = 'upper-roman'
                    } else if(listType === 'i') {
                        type = 'lower-roman'
                    } else {
                        type = 'decimal'
                    }
                } else {
                    type = 'decimal'
                }

                return { type }
            }
        }
    ],
    attrs: {
        type: {default: 'decimal'}
    },
    content: "listItem+", 
    group: "block",
    toDOM(node) {
        // if list-style-image is not set then
        // consider a nested list, with outer list custom image list and inner list normal bullet list
        // then since in our structure for nested lists, outer li tag will contain ol tag to respresent nested list,
        // the outer list-style-image property that is set for custom lists, will be carry forwarded to the inner bullet list also
        // so to avoid this we need to set list-style-image to none for inner list if it is not a custom list

        if(node.attrs && node.attrs.type) {
            return ['ol', { style: 'list-style-type: ' +  node.attrs.type + '; list-style-image: none;'}, 0]
        } else {
            return ['ol', { style: 'list-style-type: decimal; list-style-image: none;'}, 0]
        }
    }
}

export function getBulletList(options) {
    var customListTypes = options.customTypes && options.customTypes.map((customList) => customList.type) || []
    return {
        parseDOM: [
            {
                tag: "ul",
                getAttrs: function(el) {
                    var listStyleType = el.style.getPropertyValue('list-style-type')
                    var listType = el.getAttribute("type")
                    var type
                    if(listType) {
                        if(supportedUnorderedListTypes.includes(listType)) {
                            type = listType
                        } else if(customListTypes.includes(listType)) {
                            type = listType
                        } else {
                            type = 'disc'
                        }
                    } else if(listStyleType) {
                        if(supportedUnorderedListTypes.includes(listStyleType)) {
                            type = listStyleType
                        } else {
                            type = 'disc'
                        }
                    } else {
                        type = 'disc'
                    }

                    return { type }
                }
            }
        ],
        attrs: {
            type: {default: "disc"}
        },
        content: "listItem+", 
        group: "block",
        toDOM(node) {
            if(node.attrs && node.attrs.type) {
                var toDOMSpec = ["ul", { type: node.attrs.type }, 0]
                if(customListTypes.includes(node.attrs.type)) {
                    var customImg = options.customTypes.find((customList) => customList.type === node.attrs.type).image
                    toDOMSpec[1].style = 'list-style-image: ' + customImg + ';'
                } else {
                    // if list-style-image is not set then
                    // consider a nested list, with outer list custom image list and inner list normal disc list
                    // then since in our structure for nested lists, outer li tag will contain ul tag to respresent nested list,
                    // the outer list-style-image property that is set for custom lists, will be carry forwarded to the inner disc list also
                    // so to avoid this we need to set list-style-image to none for inner list if it is not a custom list
                    toDOMSpec[1].style = 'list-style-image: none;'
                }
                return toDOMSpec
            } else {
                return ["ul", { type: 'disc', style: 'list-style-image: none;' }, 0]
            }
        }
    }
}

// in Shortcuts.js file, the splitListItem function is written assuming the first node inside listItem node will be paragraph node,
// so if suppose you change the content property in listItem node definition - please take care of the splitListItem function in Shortcuts.js file
export const listItem = {
    parseDOM: [{ tag: "li" }],
    content: "paragraph block*",
    toDOM() { return ["li", 0] },
    defining: true
}

export const checkList = {
    parseDOM: [
        {
            tag: "ul",
            getAttrs: function(el) {
                return el.getAttribute('rte-check-list') === "" ? true: false
            }
        }
    ],
    content: "checkListItem+",
    group: "block",
    toDOM: function() {
        return ["ul", { "rte-check-list": "" }, 0]
    }
}

export function getCheckListItemNode(checkListFeatureOptions) {
    var checkedSVGID = "rte-icon-checked-box", unCheckedSVGID = "rte-icon-unchecked-box"
    if(typeof checkListFeatureOptions === "object") {
        if(checkListFeatureOptions.checkedSVGID) {
            checkedSVGID = checkListFeatureOptions.checkedSVGID
        }

        if(checkListFeatureOptions.unCheckedSVGID) {
            unCheckedSVGID = checkListFeatureOptions.unCheckedSVGID
        }
    }

    return {
        parseDOM: [
            {
                tag: "li",
                getAttrs: function(el) {
                    if(el.getAttribute('rte-check-list-item') === "") {
                        if(el.getAttribute('rte-check-list-item-checked') === "") {
                            return { isChecked: true }
                        } else {
                            return { isChecked: false }
                        }
                    }
                    return false
                }
            }
        ],
        content: "paragraph block*",
        defining: true,
        attrs: {
            isChecked: { default: false }
        },
        toDOM: function(node) {
            // the contenteditable: false attribute is put for span tag because assume the below case where the contenteditable attribute is not put:
            // Type 3 checklist items(make them all 3 unchecked initalliy) namely 
            // 1. abc
            // 2. def
            // 3. ghi
            // now keep the cursor near f in second line and make the third list item ghi as checked item,
            // what's the expected behaviour is: the cursor should be near f character itself whereas the ghi item should be checked
            // what really happens is: the cursor comes near g character in third line and the ghi item is checked
            // inorder to avoid this if we put the contenteditable attribute as false, the cursor would remain near f character itself
            // at the same ghi item will also be checked.
            if(node.attrs.isChecked) {
                return ["li", { "rte-check-list-item": "", "rte-check-list-item-checked" : ""},
                    ["span", { class: "rte-check-box", contenteditable: false },
                        ['ht' + 'tp://www.w3.org/2000/svg svg', { class: "ui-rte-icon rte-check-box-svg" },
                            ["use", {['ht' + 'tp://www.w3.org/1999/xlink xlink:href'] : "#" + checkedSVGID, class: "rte-check-box-use" }]
                        ]
                    ],
                    [ "div", { class: 'rte-check-list-item-content' }, 0 ]
                ]
            } else {
                return ["li", { "rte-check-list-item": "", "rte-check-list-item-unchecked": "" },
                    ["span", { class: "rte-check-box", contenteditable: false },
                        ['ht' + 'tp://www.w3.org/2000/svg svg', { class: "ui-rte-icon rte-check-box-svg" },
                            ["use", {['ht' + 'tp://www.w3.org/1999/xlink xlink:href'] : "#" + unCheckedSVGID, class: "rte-check-box-use" }]
                        ]
                    ],
                    // ["i", {class: "zmetbi-moreTools rte-check-box", contenteditable: false }],
                    [ "div", { class: 'rte-check-list-item-content' }, 0 ]
                ]
            }
            
        }
    }
}