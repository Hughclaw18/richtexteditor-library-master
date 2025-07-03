import { EditorSelection, Transaction } from '@codemirror/state';

var boldCommand = function({state, dispatch}) {
    var selectedText = state.sliceDoc(state.selection.main.from, state.selection.main.to)
    var tr = state.update(state.replaceSelection('**'+selectedText+'**'), {
        scrollIntoView: true,
        annotations: Transaction.addToHistory.of(true)
    })
    dispatch(tr);
    return true;
}

var italicCommand = function({state, dispatch}) {
    var selectedText = state.sliceDoc(state.selection.main.from, state.selection.main.to)
    var tr = state.update(state.replaceSelection('*'+selectedText+'*'), {
        scrollIntoView: true,
        annotations: Transaction.addToHistory.of(true)
    })
    dispatch(tr);
    return true;
}

var strikeCommand = function({state, dispatch}) {
    var selectedText = state.sliceDoc(state.selection.main.from, state.selection.main.to)
    var tr = state.update(state.replaceSelection('~~'+selectedText+'~~'), {
        scrollIntoView: true,
        annotations: Transaction.addToHistory.of(true)
    })
    dispatch(tr);
    return true;
}

var linkCommand = function({state, dispatch}) {
    var changes = state.changeByRange(range => {
        var text = state.sliceDoc(range.from, range.to);
        var replacement = `[${text}](https://)`;
        return {
            changes: {from: range.from, to: range.to, insert: replacement},
            range: EditorSelection.range(range.from + replacement.length - 1, range.from + replacement.length - 1)
        }
    })

    var tr = state.update(changes, {
        scrollIntoView: true,
        annotations: Transaction.addToHistory.of(true)
    })
    dispatch(tr);
    return true;
}

var linesBetween = function(from, to, state) {
    var docSlice = state.doc.slice(from, to);
    var noOfLines = docSlice.lines;
    var line = state.doc.lineAt(from);
    var firstLine = state.doc.line(line.number)

    var lines = [];
    for (var ln = line.number; ln < firstLine.number + noOfLines; ln++) {
        var line = state.doc.line(ln);
        lines.push(line)
    }

    return lines;
}


var ulCommand = function({state, dispatch}) {
    var changes = state.changeByRange(range => {
        var changes = [];
        linesBetween(range.from, range.to, state).forEach(line => {
            var replacement = '- ' + line.text
            changes.push({from: line.from, to: line.to, insert: replacement})
        })

        return {
            changes: changes,
            range: EditorSelection.range(range.from, range.to)
        }
    })

    var tr = state.update(changes, {
        scrollIntoView: true,
        annotations: Transaction.addToHistory.of(true)
    })

    dispatch(tr);
    return true;
}

var olCommand = function({state, dispatch}) {
    var changes = state.changeByRange(range => {
        var changes = [];
        linesBetween(range.from, range.to, state).forEach((line, idx) => {
            var replacement = idx+1 + '. ' + line.text
            changes.push({from: line.from, to: line.to, insert: replacement})
        })

        return {
            changes: changes,
            range: EditorSelection.range(range.from, range.to)
        }
    })

    var tr = state.update(changes, {
        scrollIntoView: true,
        annotations: Transaction.addToHistory.of(true)
    })
    
    dispatch(tr);
    return true;
}

var getHeadingCommand = function(type) {

    var hmap = {
        h1: '#',
        h2: '##',
        h3: '###',
        h4: '####',
        h5: '#####',
        h6: '######'
    }

    return function({state, dispatch}) {        
        var changes = state.changeByRange(range => {
            var changes = [];
            linesBetween(range.from, range.to, state).forEach(line => {
                var replacement = hmap[type]+ ' ' + line.text
                changes.push({from: line.from, to: line.to, insert: replacement})
            })

            return {
                changes: changes,
                range: EditorSelection.range(range.from, range.to)
            }
        })

        var tr = state.update(changes, {
            scrollIntoView: true,
            annotations: Transaction.addToHistory.of(true)
        })
        dispatch(tr);
        return true;
    }
}

var code = function({state, dispatch}) {
    var selectedText = state.sliceDoc(state.selection.main.from, state.selection.main.to)
    var isSameLine = state.doc.lineAt(state.selection.main.from).number === state.doc.lineAt(state.selection.main.to).number
    if (isSameLine) {
        var changes = state.replaceSelection('`'+selectedText+'`')
    } else {
        var changes = state.replaceSelection('\n```\n'+selectedText+'\n```\n')
    }
    var tr = state.update(changes, {
        scrollIntoView: true,
        annotations: Transaction.addToHistory.of(true)
    })
    dispatch(tr);

    return true;
}

var blockQuote = function({state, dispatch}) {
    var changes = state.changeByRange(range => {
        var changes = [];
        linesBetween(range.from, range.to, state).forEach(line => {
            var replacement = '> ' + line.text
            changes.push({from: line.from, to: line.to, insert: replacement})
        })

        return {
            changes: changes,
            range: EditorSelection.range(range.from, range.to)
        }
    })

    var tr = state.update(changes, {
        scrollIntoView: true,
        annotations: Transaction.addToHistory.of(true)
    })
    dispatch(tr);
    return true;
}

var getCommand = function(command) {
    return function() {
        command(this.editorView)
    }
}

var registerMarkdownCommands = function(rteView) {
    rteView.registerCommand({
        boldCommand: getCommand(boldCommand), 
        italicCommand: getCommand(italicCommand), 
        strikeCommand: getCommand(strikeCommand),
        linkCommand: getCommand(linkCommand), 
        h1Command: getCommand(getHeadingCommand('h1')),
        h2Command: getCommand(getHeadingCommand('h2')),
        h3Command: getCommand(getHeadingCommand('h3')),
        ulCommand: getCommand(ulCommand),
        olCommand: getCommand(olCommand),
        code: getCommand(code),
        blockQuote: getCommand(blockQuote)
    })
}

export {boldCommand, italicCommand, linkCommand, strikeCommand, getHeadingCommand, ulCommand, olCommand, code, blockQuote, registerMarkdownCommands}