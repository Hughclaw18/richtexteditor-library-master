import { tableNodes } from "./tableNodes"
import { Fragment, Slice } from "prosemirror-model"
import { TextSelection } from "prosemirror-state"

export function addTableNodes(nodes) {
    return nodes.append(tableNodes)
    
};

export function insertTable(rows, cols, state, dispatch, opts) {
    rows = rows || 3;
    cols = cols || 3;

    const offset = state.tr.selection.anchor + 1;
    const transaction = state.tr;


    var tableAttrs = {}, paraAttrs = {};

    if(opts) {
        if(opts.extraAttrs) {
            tableAttrs.extraAttrs = opts.extraAttrs
        }
    
        if(opts.extraAttrsForPara) {
            paraAttrs.extraAttrs = opts.extraAttrsForPara
        }
    }

    /**
     * Creating a table:
     * 
     * 1. Create a table cell
     * 
     * 2. Create a colArr and push the table cell for a particular number of times as stated in cols variable.
     * 
     * 3. Create a rowArr and push the colArr for a particular number of times as stated in rows variable.
     * 
     * 4. Wrap all these in a table node.
     * 
     * 5. Above the table node insert a paragraph node.
     * 
     * 6. If the table is created within a list alone add a listItem node below the table node.
     */

    const cell = state.schema.nodes.table_cell.createAndFill();
    let rowArr = [], colArr = []

    for (let j = 0; j < cols; j++) {
        colArr.push(cell)
    }
    for (let i = 0; i < rows; i++) {
        rowArr.push(state.schema.nodes.table_row.create({}, colArr))
    }

    const node = state.schema.nodes.table.create(tableAttrs, rowArr);
    const paraNode=state.schema.nodes.paragraph.create(paraAttrs)

    const newNode=[]
    newNode.push(paraNode)
    newNode.push(node)

    const depth=state.selection.$from.depth>=3 && state.selection.$from.depth-1//get the depth of the parent, the minimum depth required to create a list will be 3
    const parentNode=depth && state.selection.$from.node(depth)
    const isWithinList=parentNode && parentNode.type.name==="listItem"

    if(isWithinList) {
        const listItemNode=state.schema.nodes.listItem.create()
        newNode.push(listItemNode)
    } else {
        newNode.push(paraNode) // if it is not within a list then insert a p tag below a table to store marks globally when cursor moved out of the table
    }

    const newFragment=Fragment.from(newNode)
    const newSlice=new Slice(newFragment,1,1)

    if (dispatch) {
        dispatch(
            transaction
                .replaceSelection(newSlice)
                .scrollIntoView()
                .setSelection(TextSelection.near(transaction.doc.resolve(offset)))
        );
    }

    return true;
};