import { Plugin } from "prosemirror-state"
import { isInTable, selectionCell, addRowAfter, moveCellForward, CellSelection } from "prosemirror-tables"
import { TextSelection } from "prosemirror-state"

function findNextCell($cell, dir) {
    // This function returns the position of the desired cell , if no such cell is present it returns null.

    if (dir < 0) {

        let before = $cell.nodeBefore;
        if (before) {// if there is a cell before the current cell in the same row then it returns it's position
            return $cell.pos - before.nodeSize;
        }   

        //If it does not pass the if condition above, it means that the current cell is the first cell of a row and it means that it needs to go one row above to get the position of the previous cell

        for (let row = $cell.index(-1) - 1, rowEnd = $cell.before(); row >= 0; row--) {

            let rowNode = $cell.node(-1).child(row);
            if (rowNode.childCount) {
                return rowEnd - 1 - rowNode.lastChild.nodeSize;
            }

            rowEnd -= rowNode.nodeSize;
        }
    } 
    else {

        if ($cell.index() < $cell.parent.childCount - 1) {// if there is a cell after the current cell in the same row then it returns it's position
            return $cell.pos + $cell.nodeAfter.nodeSize;
        }    

        let table = $cell.node(-1);

        //If it does not pass the if condition above, it means that the current cell is the last cell of a row and it means that it needs to go one row below to get the position of the previous cell

        for (let row = $cell.indexAfter(-1), rowStart = $cell.after(); row < table.childCount; row++) {

            let rowNode = table.child(row);
            if (rowNode.childCount) {
                return rowStart + 1;
            }

            rowStart += rowNode.nodeSize;
        }
    }
}


function goToNextCell(direction) {
    return function (view, state, dispatch) {

        //if tab is pressed in the last cell another row is created

        if (!isInTable(state)) {
            return false;
        }

        /**
         * If it is the last cell of a table then:
         * 
         * Case 1: if cell is empty and direction is 1 that is RHS:
         * 1. Then add a row below that
         * 2. Call goToNextCell(1) inorder to point the cursor to the first cell of the newly added row  
         * 
         * Case 2: if cell is empty and direction is -1 that is LHS:
         * 1. It means it is the first cell of the table so no need to do anything
         */

        let cell = findNextCell(selectionCell(state), direction);

        if (direction == 1 && cell == null) {
            addRowAfter(state, dispatch)
            return goToNextCell(1)(view, view.state, view.dispatch)
        }
        else if (cell == null) {
            return;
        }    

        if (dispatch) {
            let $cell = state.doc.resolve(cell);
            dispatch(
                state.tr.setSelection(TextSelection.between($cell, moveCellForward($cell))).scrollIntoView(),
            );
        }
        return true;
    };
}


function handleTab(view, e) {

    var tab, shift;
    shift = e.shiftKey
    tab = e.keyCode === 9;

    if (!tab) {
        return;
    }
    
    if (!shift) {
        return goToNextCell(1)(view, view.state, view.dispatch)//if tab key alone is pressed within tables then it moves to the next cell towards RHS
    }
    else {
        return goToNextCell(-1)(view, view.state, view.dispatch)//if tab+shift key is pressed within tables then it moves to the previous cell towards LHS
    }

}

function isPositionWithinSelectionRange(view, pos) {
    var from = view.state.selection.$from.pos;
    var to = view.state.selection.$to.pos;

    return pos >= from && pos <= to;
}


export function getTablesPlugin(richTextView) {
    return new Plugin({
        key: richTextView.pluginKeys.tables,
        props: {
            handleKeyDown: handleTab,
            handleDOMEvents: {
                mousedown: function(view, event) {
                    // whenever multiple cell selection is done and right click is clicked,
                    // the cell selection collapses, so if we click merge cells/split cells option in table right click context menu,
                    // the cells wouldn't be merged/split because the cell selection is collapsed
                    // inorder to retain the table cell selection, we have written the below function
                    if (event.button === 2) { // for handling right click
                        const { target } = event;
                        if (target instanceof Node) {
                           const $targetPos = view.state.doc.resolve(view.posAtDOM(target, 0));
                           if (!view.state.selection.empty && view.state.selection instanceof CellSelection && isPositionWithinSelectionRange(view, $targetPos.pos)) {
                               event.preventDefault();
                               event.stopPropagation();
                               return true;
                           }
                        }
                     }
                    return false;
                }
            }
        }
    })
}