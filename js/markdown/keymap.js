import { keymap as cmKeymap } from '@codemirror/view';
import { boldCommand, italicCommand, linkCommand, strikeCommand } from "./commands";

export default cmKeymap.of([{
    key: "Mod-b",
    run: boldCommand
}, {
    key: 'Mod-i',
    run: italicCommand
}, {
    key: 'Mod-k',
    run: linkCommand
}, {
    key: 'Shift-Mod-x',
    run: strikeCommand
}])