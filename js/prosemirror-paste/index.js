import { Plugin, PluginKey } from "prosemirror-state";

export function pasteHandlePlugin() {
    return new Plugin({
        key: new PluginKey("pasteHandlePlugin"),
        state: {
            init() {
                return {}; 
            },
            apply(tr, value, oldState, newState) {
                if (tr.getMeta("pasteDetails")) {
                    return tr.getMeta("pasteDetails");
                // Clear pasteDetails if selection changed but no document change, no history meta, and no new paste    
                } else if (!tr.docChanged && !tr.getMeta("addToHistory") && !oldState.selection.eq(newState.selection)){
                    return {};
                }
            
                return value;
            }
        },
        props: {
            handlePaste(view, event, slice) {
                let { state } = view;
                let { selection } = state;
                let fromPos = selection.from;
                let tr = state.tr;
                // Computed toPos by diffing doc size before and after applying slice
                let oldSize = tr.doc.nodeSize;
                let newTr = state.tr.replaceSelection(slice);
                let newSize = newTr.doc.nodeSize;
                
                let toPos = fromPos + (newSize - oldSize);
                let storedMarks = state.storedMarks || [];
                tr = tr.setMeta("pasteDetails", {
                    fromPos,
                    toPos,
                    slice,
                    storedMarks
                });
            
                view.dispatch(tr);
                return false;
            }
        }
    });
}

var matchDestination =  function(view){
    let pastePlugin = view.state.plugins.find(
        (plugin) => plugin.key && plugin.key.includes("pasteHandlePlugin")
      );
    let pluginState = pastePlugin.getState(view.state);
    if (!pluginState || !pluginState.fromPos) {
        return;
    }

    let { fromPos, toPos, storedMarks } = pluginState;
    let tr = view.state.tr.removeMark(fromPos, toPos);


    storedMarks.forEach((mark) => {
        tr = tr.addStoredMark(mark);
        tr = tr.addMark(fromPos, toPos, mark);
    });
    view.dispatch(tr.scrollIntoView());
    view.focus()
};

var pasteTextOnly =  function(view){
    let pastePlugin = view.state.plugins.find(
        (plugin) => plugin.key && plugin.key.includes("pasteHandlePlugin")
      );
    let pluginState = pastePlugin.getState(view.state);
    if (!pluginState || !pluginState.fromPos) {
        return;
    }

    let { fromPos, toPos } = pluginState;
    let tr = view.state.tr.removeMark(fromPos, toPos);

    view.dispatch(tr.scrollIntoView());
    view.focus()
}

var onlySourceFormat = function(view){
    let pastePlugin = view.state.plugins.find(
        (plugin) => plugin.key && plugin.key.includes("pasteHandlePlugin")
      );
    let pluginState = pastePlugin.getState(view.state);
    if (!pluginState || !pluginState.fromPos) {
        return;
    }
    let { fromPos, toPos, slice } = pluginState;

    let tr = view.state.tr.replace(fromPos, toPos, slice);
    view.dispatch(tr.scrollIntoView());
    view.focus()
}

export {pasteTextOnly, onlySourceFormat, matchDestination}