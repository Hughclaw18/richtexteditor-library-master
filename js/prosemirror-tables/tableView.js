// copy pasted the tableView.js file from prosemirror-tables package with some changes that are listed below:
// 1. inorder to allow the styles to be put on table tag during copy paste from desk to rte
// 2. inorder to respect getAttrs and setAttrs
// 3. modified updateColumns function in such a way that we hard code the default column width value, becuase if we don't give a default value then ,
//    the following scenario arises:
//          a. if width for table tag is set as 100% in css, then automatically width of the parent container is calculated and is divided by the no.of columns,
//             and that width is given for each column implicitly, but this causes some malfunctions, such as if you try to reduce the size of one column,
//             the sizes of all other columns increases inorder to match with the css property 'width:100%'
//          b. if we remove 'width:100%' css property for table tag, then the table columns will have width that is given as cellMinWidth to the tableView constructor, 
//             say if the cellMinWidth is 25px, then the table that is inserted will be very small with each column's width as 25px
//    the solution for this problem is to set the css property 'width:fit-content' for table tag and to calculate the value of defaultColWidth and 
//    put it explicitly in every column for the first time the table is created

 export class TableView {
    constructor(node, cellMinWidth, view, options) {
        this.node = node;
        this.cellMinWidth = cellMinWidth;
        this.dom = document.createElement('div');
        this.dom.className = 'tableWrapper';
        this.table = this.dom.appendChild(document.createElement('table'));
        this.colgroup = this.table.appendChild(document.createElement('colgroup'));
        updateColumns(node, this.colgroup, this.table, cellMinWidth, null, null, view);
        this.contentDOM = this.table.appendChild(document.createElement('tbody'));
        this.options = options // cache the options here for further use in update() function
        this.setAttrs(node, options)
        this.view = view
    }

    setAttrs(node, options) {

        // the below are the properties that we set, minWidth property is set by columnResizing plugin
        // tableBorderWidth is set by us.
        var attrs = {}
        attrs.style = '--rte-table-border-width: ' + node.attrs.borderWidth + ';' + 'min-width: ' + this.table.style.minWidth + ';'
        
        if(node.attrs && node.attrs.extraAttrs) {
            // Note: for tables we can't do options.serializer.toDOM and here in table the second arguement is the attrs object that is manually set by us.
            // Also note that for table tag there would be separate toDOM in node definition of table feature, but that would be ignored
            // instead all the table node related stuffs will be done only in this node view, but rest of the things such as parseDOM, group, content, etc.
            // all these properties would be taken from node definition of table node only.
            attrs = options.serializer.table.setAttrs(node, attrs, options)
        } 
        
        // the toDOM logic should be writter by us, because in nodeView toDOM is our responsibility
        for(var key in attrs) {
            this.table.setAttribute(key, attrs[key])
        }
    }

    update(node) {
        if (node.type != this.node.type) {
            return false;
        }    
        this.node = node;
        updateColumns(node, this.colgroup, this.table, this.cellMinWidth, null, null, this.view);
        this.setAttrs(node, this.options)
        return true;
    }

    ignoreMutation(record) {
        return (
            record.type == 'attributes' &&
            (record.target == this.table || this.colgroup.contains(record.target))
        );
    }
}

function getDefaultColWidth(view, childCount, cellMinWidth) {
    var copmputedStyle = window.getComputedStyle(view.dom)
    var rteWidth = parseFloat(copmputedStyle.width)
    
    // since in computedStyle.width padding size would not be subtracted, subtract that explicitly
    var rtePaddingLeft = parseFloat(copmputedStyle.paddingLeft)
    var rtePaddingRight = parseFloat(copmputedStyle.paddingRight)
    var totalComputedWidth = rteWidth - rtePaddingLeft - rtePaddingRight

    var widthOfTable = 0.95;// as of now keep it as 95%, don't keep it as 100% because
    // if we keep it as 100% then the table will accomodate a width slightly say 2-3px more than the parent container width, as a result a horizontal
    // will appear, so inorder to avoid that keep it as 95%
    totalComputedWidth = Math.floor( widthOfTable * totalComputedWidth)

    var colWidth = totalComputedWidth / childCount

    // if colWidth goes less than cellMinWidth , then put the width as cellMinWidth itself
    if(colWidth < cellMinWidth) {
        return cellMinWidth
    } else {
        return colWidth
    }
}

export function updateColumns(
    node,
    colgroup,
    table,
    cellMinWidth,
    overrideCol,
    overrideValue,
    view
) {
    let totalWidth = 0,
        fixedWidth = true;
    let nextDOM = colgroup.firstChild,
        row = node.firstChild;
    let childCount = 0
    for(let i = 0; i < row.childCount; i++) {
        childCount += row.child(i).attrs.colspan // if columns are merged then row.childCount will be lesser than the actual no.of cells
    }
    for (let i = 0, col = 0; i < row.childCount; i++) {
        let defaultColWidth = getDefaultColWidth(view, childCount, cellMinWidth)
        let { colspan, colwidth } = row.child(i).attrs;
        for (let j = 0; j < colspan; j++, col++) {
            let hasWidth =
                overrideCol == col ? overrideValue : colwidth && colwidth[j];
            let cssWidth = hasWidth ? hasWidth + 'px' : defaultColWidth + 'px';
            totalWidth += hasWidth || cellMinWidth;
            if (!hasWidth) {
                fixedWidth = false;
            } 
            if (!nextDOM) {
                colgroup.appendChild(document.createElement('col')).style.width =
                    cssWidth;
            } else {
                if (nextDOM.style.width != cssWidth) {
                    nextDOM.style.width = cssWidth;
                }
                nextDOM = nextDOM.nextSibling;
            }
        }
    }

    while (nextDOM) {
        let after = nextDOM.nextSibling;
        nextDOM.parentNode.removeChild(nextDOM);
        nextDOM = after;
    }
    if (fixedWidth) {
        table.style.width = totalWidth + 'px';
        table.style.minWidth = '';
    } else {
        table.style.width = '';
        table.style.minWidth = totalWidth + 'px';
    }
}
