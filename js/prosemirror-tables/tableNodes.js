/**
 * All the below code is copy pasted from schema.js file in prosemirror-tables@1.2.5 package, only the table nodes and their dependent code is
 * copy pasted with the below changes:
 *      1. In prosemirror-tables package, the attrs key in node definition of table_cell and table_header was pointing to the same object, as a result of which,
 *         any change made in attrs(for eg: adding extraAttrs in table_cell for desk) of one object is reflected in other object also, inorder to avoid this
 *         we have used 2 different objects for each.
 *      2. The extraAttrs variable and all it's related code in the package is removed here because as of now it isn't required.
 */

function getCellAttrs(dom) {
    let widthAttr = dom.getAttribute('data-colwidth');
    let widths = widthAttr && /^\d+(,\d+)*$/.test(widthAttr) ? widthAttr.split(',').map((s) => Number(s)) : null;
    let colspan = Number(dom.getAttribute('colspan') || 1);
    let result = {
        colspan,
        rowspan: Number(dom.getAttribute('rowspan') || 1),
        colwidth: widths && widths.length == colspan ? widths : null
    };
    return result;
}

function setCellAttrs(node) {
    let attrs = {};
    if (node.attrs.colspan != 1) {
        attrs.colspan = node.attrs.colspan;
    }
    if (node.attrs.rowspan != 1) {
        attrs.rowspan = node.attrs.rowspan;
    }    
    if (node.attrs.colwidth) {
        attrs['data-colwidth'] = node.attrs.colwidth.join(',');
    }
    return attrs;
}

let tableNodes = {
    table: {
        content: 'table_row+',
        tableRole: 'table',
        attrs: {
            // we are having default borderWidth for tables because if we put this in css as
            // .ui-rte-editor-div table, .ui-rte-editor-div {
            //      border-width: 1px;   
            // }
            // then irrespective of whether table tag has width or not we can't override this property
            // inorder to override it we need to explicitly put in toDOM the borderWidth for table tag
            // so if we are going to explicilty put the borderWidth style then we can use attrs itself and remove the css property on the whole.
            
            // This allows to do the following:-
            // if table tag has width we can use that width, or else if it does'nt have width we can use the default width of 1px,
            // or if table tag has no width then we can put width as 0px
            borderWidth: {default: '1px'}
        },
        isolating: true,
        group: 'block',
        parseDOM: [{ tag: 'table' }],
        toDOM(node) {
            var { borderWidth } = node.attrs
            return ['table', { style: '--rte-table-border-width: ' + borderWidth + ';' },['tbody', 0]];
        }
    },
    table_row: {
        content: '(table_cell | table_header)*',
        tableRole: 'row',
        parseDOM: [{ tag: 'tr' }],
        toDOM() {
            return ['tr', 0];
        }
    },
    table_cell: {
        content: 'block+',
        attrs: {
            colspan: { default: 1 },
            rowspan: { default: 1 },
            colwidth: { default: null }
        },
        tableRole: 'cell',
        isolating: true,
        parseDOM: [
            { tag: 'td', getAttrs: (dom) => getCellAttrs(dom) }
        ],
        toDOM(node) {
            return ['td', setCellAttrs(node), 0];
        }
    },
    table_header: {
        content: 'block+',
        attrs: {
            colspan: { default: 1 },
            rowspan: { default: 1 },
            colwidth: { default: null }
        },
        tableRole: 'header_cell',
        isolating: true,
        parseDOM: [
            { tag: 'th', getAttrs: (dom) => getCellAttrs(dom) }
        ],
        toDOM(node) {
            return ['th', setCellAttrs(node), 0];
        }
    }
};

export {
    tableNodes
}