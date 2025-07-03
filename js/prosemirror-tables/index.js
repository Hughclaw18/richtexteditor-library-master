export {getTablesPlugin} from "./tablesPlugin"
export {insertTable,addTableNodes} from "./utils"
export {tableEditing,addColumnAfter, addColumnBefore, deleteColumn, addRowAfter, addRowBefore, deleteRow, mergeCells, splitCell, toggleHeaderRow, toggleHeaderColumn, toggleHeaderCell, goToNextCell, deleteTable, fixTables} from "prosemirror-tables"
export {gapCursor} from "prosemirror-gapcursor"
export {TableView} from "./tableView"
export {columnResizing} from './columnResizingPlugin'