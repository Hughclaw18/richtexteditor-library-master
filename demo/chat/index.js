var markdownRegex = {
    strong: /(\*)([^*]+)(\*)/,
    em : /(?:(?:^|\s)(\_))([^_]+)(\_)/,
    strikeThrough : /(\~)([^\~]+)(\~)/,
    underline : /(?:(?:^|\s)(__))([^*]+)(__)/,
    inlineQuote : /(?:(?:^|\s)(\`))([^\`]+)(\`)/
}

function inputRules(ref) {
    var rules = ref.rules;

    var plugin = new RichTextEditor.PMExports.prosemirrorState.Plugin({
      state: {
        init: function init() { return null },
        apply: function apply(tr, prev) {
          var stored = tr.getMeta(this);
          if (stored) { return stored }
          return tr.selectionSet || tr.docChanged ? null : prev
        }
      },

      props: {
        handleTextInput: function handleTextInput(view, from, to, text) {
          return run(view, from, to, text, rules, plugin)
        },
        handleDOMEvents: {
          compositionend: function (view) {
            setTimeout(function () {
              var ref = view.state.selection;
              var $cursor = ref.$cursor;
              if ($cursor) { run(view, $cursor.pos, $cursor.pos, "", rules, plugin); }
            });
          }
        }
      },

      isInputRules: true // this flag is used in undoInputRule command
    });
    return plugin
}

function run(view, from, to, text, rules, plugin) {
    if (view.composing) { return false }
    var state = view.state, $from = state.doc.resolve(from);
    if ($from.parent.type.spec.code) { return false }
    var textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - MAX_MATCH), $from.parentOffset,
                                              null, "\ufffc") + text;
    for (var i = 0; i < rules.length; i++) {
      var match = rules[i].match.exec(textBefore);
      var tr = match && rules[i].handler(state, match, from - (match[0].length - text.length), to);
      if (!tr) { continue }
      view.dispatch(tr.setMeta(plugin, {transform: tr, from: from, to: to, text: text}));
      return true
    }
    return false
}

const MAX_MATCH = 1000

// construct options
var options = {
    content: getHTMLContent(),
    isHTMLContent: true,
    
    // content: getContent(),

    menubar: false,

    // formatting options to include
    formats: ["strong", "em", "underline", {name: "link", autodetect: false}, "strikeThrough", "headings", "inlineQuote", "escapedCharacter"],

    // document elements to include
    features: [
        "blockquote",
        "list",
        'hr', // {name: 'hr'}, // horizontal line
        {name: 'mentions', getSuggestions: getAtmentionsSuggestions()}, // @mentions
        {name: 'emoji', hasZomoji: false},
        {
            name: 'code_block',
            lineNumbers: false,
            inputHandler: function(inputInfo, rteView) {
                var { from, to, text, codeBlockView } = inputInfo
                if(from === to && text === '`') {
                    var curLineInfo = codeBlockView.state.doc.lineAt(codeBlockView.state.selection.main.head)
                    var textBeforeInsertingCurChar = curLineInfo.text
                    var textInsertionPosInCurLine = from - curLineInfo.from
                    var textAfterInsertingCurChar = textBeforeInsertingCurChar.substring(0, textInsertionPosInCurLine)
                                                    +
                                                    text
                                                    +
                                                    textBeforeInsertingCurChar.substring(textInsertionPosInCurLine)
                    
                    // find all the matches of 3 backticks in current line
                    let matchObjs = Array.from(textAfterInsertingCurChar.matchAll(/```/g))
                    return matchObjs.some((matchObj) => {
                        var matchInd = matchObj.index
                        var matchEndInd = matchInd + matchObj[0].length
                        if(textInsertionPosInCurLine >= matchInd && textInsertionPosInCurLine < matchEndInd) {
                            // sometimes there can be instances where multiple instances of 3 backticks can occur in the same line
                            // in these cases we should only consider the instance where the current backtick is inserted
                            // this if check ensures that

                            var isAtLineEnd = ( curLineInfo.text.length === matchInd + 2 ) ? true : false // doing +2 because matchInd is the index of the 
                            // first backtick and to that we need to add 2 to get the index of the last backtick and note that we don't do +3 because
                            // the third backtick would not have entered into the text yet
                            var isLastLine = codeBlockView.state.doc.lines === curLineInfo.number
                            
                            if(isAtLineEnd && !isLastLine) { // generally at every line end there will be a new line character, so we need to remove that
                                // if we want to break the codeblock into 2
                                // because if we don't remove the new line character, then the new line character will be part of the second codeblock
                                // which would be created when we break the codeblock into 2 by inserting a paragraph node

                                // the below line deletes the characters present in between the given from and to positions
                                codeBlockView.dispatch({
                                    changes: {
                                        from: curLineInfo.from + matchInd,
                                        to: curLineInfo.from + matchInd + 3 // we are doing +3 because
                                        // +2 is for 2 backticks
                                        // +1 is to remove the new line character
                                        // we are removing the backticks becuase the user has types 3 backticks continuously in codeblock to move out of codeblock
                                    }
                                })
                            } else {
                                codeBlockView.dispatch({
                                    changes: {
                                        from: curLineInfo.from + matchInd,
                                        to: curLineInfo.from + matchInd + 2
                                    }
                                })
                            }
                            rteView.insertNode("paragraph")
                            var TextSelection = RichTextEditor.PMExports.prosemirrorState.TextSelection
                            var view = rteView.editorView
                            var dispatch = view.dispatch

                            if(isLastLine && isAtLineEnd) {
                                // if it is last line and it is at line end, then the codeblock will not be divided into 2 codeblocks
                                // so we need to move the selection to the newly inserted paragraph node
                                // so from the from position we are adding +2 because
                                // +1 for codeblock end
                                // +1 for newly inserted paragraph node
                                dispatch(view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$from.pos + 2))))
                            } else {
                                // either if it is not last line or if it is not line end, then for sure the codeblock will be divided into 2, with a paragrpah
                                // node inserted between them, so now without changing the selection, the from position will be pointing to the
                                // the start of the 2nd codeblock,
                                // so we are doing from pos - 2 to move the selection to the new paragraph node which is above the 2nd codeblock
                                // we are doing -2 becuase
                                // -1 for 2nd codeblock start
                                // -1 for above paragraph node end
                                dispatch(view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$from.pos - 2))))
                            }
                            view.focus()
                            return true
                        }
                    })
                }
                return false
            }
        },
        'cliqMention',
        'smileyNode',
        'memberNode',
        'customEmojiNode',
        'zomojiNode'
    ],

    defaults: {
        fontFamily: 'Lato'
        // fontSize: '12pt',
        // lineHeight: "1.5"
    },

    className: 'textarea',

    onEditorStateUpdate: function(currentState, view) {
        if (!window.debounced_updateCliqMarkdownContainer) {
            window.debounced_updateCliqMarkdownContainer = debounce(updateCliqMarkdownContainer);
        }
        window.debounced_updateCliqMarkdownContainer(view);
    },

    plugins: [inputRules({rules: getInputRules()}), getInlineQuoteCursorIssuePlugin(),
              getHeadingsBackspacePlugin(), getCustomInputRulesPlugin(getCustomInputRules(markdownRegex))],

    handleDOMEvents: {
        keydown: function(editorView, e) {
            // if (e.keyCode === 13 && !e.shiftKey) {
            //     // preventDefault to stop default enter behaviour
            //     e.preventDefault()
            // }
        }
    },

    regexReplacer: [
        {
            regex: /((http(s){0,1}?:\/\/)([^ <\n\"]*[^.,\s<\*~_]))/,
            mark: 'link',
            attrs: (text) => {
                return { href: text }
            }
        }, {
            regex: /(?:(href|src)=["']?)?((https?:\/\/(?:www\.)?|www\.)[a-z0-9][^@]*?)(?=[\s"'<]|$)/gi,
            mark: 'link',
            attrs: (text) => {
                return { href: text }
            }
        }
    ]

    // rtl: true
};

function customChainCommands(...commands) {
    return function (rteView, event) {
        for (let i = 0; i < commands.length; i++) {
            if (commands[i](rteView.editorView.state, rteView.editorView.dispatch, rteView.editorView)) {
                return true;
            }
        }
        return false;
    };
}

function undoInputRule(state, dispatch, view) {
    var plugins = state.plugins;
    for (var i = 0; i < plugins.length; i++) {
        var plugin = plugins[i], undoable = (void 0);
        if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
            if (dispatch) {
                var tr = state.tr, toUndo = undoable.transform;
                for (var j = toUndo.steps.length - 1; j >= 0; j--) { tr.step(toUndo.steps[j].invert(toUndo.docs[j])); }
                if (undoable.text) {
                    var marks = tr.doc.resolve(undoable.from).marks();
                    tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
                } else {
                    tr.delete(undoable.from, undoable.to);
                }
                dispatch(tr);
                view.focus()
            }
            return true
        }
    }
    return false
}

// init editor once dom content is ready
document.addEventListener('DOMContentLoaded', function() {
    RichTextEditor.onload.then(function() {
        zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), options);
        zwRteView.registerCommand({
            getCliqMessage: function getCliqMessage() {
                var serializer = new CliqMarkdownSerializer(cliqNodes, cliqMarks);
                return serializer.serialize(this.editorView.state.doc)
            }
        })
        let undoCommand = RichTextEditor.PMExports.prosemirrorHistory.undo
        zwRteView.registerShortcut('Mod-z', customChainCommands(undoCustomInputRule, undoInputRule, undoCommand))
        updateCliqMarkdownContainer(zwRteView);
    })
})


function debounce(func, timeout){
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { 
        func.apply(this, args); 
      }, timeout || 100);
    };
}

function updateCliqMarkdownContainer(zwRteView) {
    var text = zwRteView.commands.getCliqMessage();
    document.querySelector('#md-output-container').textContent = text;
}

function getInputRules() {
    // var boldInputRule = markInputRule(/(?:^|\s|\_)(\*)([^*]+)(\*)$/, state => state.schema.marks.strong)
    // var italicsInputRule = markInputRule(/(?:^|\s|\*)(\_)([^_]+)(\_)$/, state => state.schema.marks.em)
    // var underlineInputRule = markInputRule(/(?:^|\s)(__)([^*]+)(__)$/, state => state.schema.marks.underline)
    // var inlineQuoteInputRule = markInputRule(/(?:^|\s)(\`)([^*|^\`]+)(\`)$/, state => state.schema.marks.inlineQuote)
    var headingInputRule = getNewHeadingInputRule(/(#+\s)$/)
    var quoteInputRule = getQuoteInputRule(/(?:^)(!\s)$/)
    var hrInputRule = getHrInputRule(/(?:^)(\-+\s)$/)
    var newCodeblockInputRule = getNewCodeblockInputRule(/(\`)+$/)
    var linkInputRule = getLinkInputRule(/(?:^|\s|<br>|\*)\[((?:(?!\]\(.+?\)).)+?)\]\(((https?:\/\/(?:www\.)?|www\.).*?)\)(?=$)/)
    var newLinkInputRule = getNewLinkInputRule(/(?:^|\s|<br>|\*)\[((?:(?!\]\(.+?\)).)+?)\]\(((https?:\/\/(?:www\.)?|www\.).*?)\)\s/)
    var arrow = new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(/-->$/, '→')
    return [headingInputRule, quoteInputRule, hrInputRule, newCodeblockInputRule, newLinkInputRule, linkInputRule, arrow]
}

// function markInputRule(regexp, markType, getAttrs) {
//     return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
//       let type = markType(state)
//       let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
//       if (!markType) { return; }
//       let tr = state.tr
//       if (match[1]) {
//         // if there is a space before the match, then we should'nt apply bold mark for that space, so we need to adjust the textStart
//         var textStart = start + match[0].indexOf(match[1])
//         tr.delete(textStart, textStart + match[1].length)
//       }
//       if(match[3].length > 1) {
//         // here for any markdown which has more than one character, we need to remove the last n-1 characters also
//         // for eg bold markdwon has only 1 character, that is there needs to be only one * before and after the text,
//         // so we don't need to remove the last character because
//         // the last character *, will be inserted into the editor only if we return false, but since we are returing tr as return value
//         // the last character * will not even be inserted inside the editor even before it is done we will apply the bold mark
//         // but for underline there are 2 characters, that is we need 2 underscores(__) before and after the text, so we need to remove the last 2 characters,
//         // but since the last underscore will not be inserted into the editor because we return tr and not false, we need to only remove the preceeding
//         // underscore character
//         // similarly if there is a markdown which has 3 characters, that is say for eg any text inside *** shoukd be made both italicd and underline,
//         // then we need to remove the last 2 characters alone
//         tr.delete(textStart + match[2].length, textStart + match[2].length + match[3].length - 1)
//       }
//       tr.addMark(textStart, textStart + match[2].length, type.create(attrs)).removeStoredMark(type)
//       return tr.setMeta('storeMarks', false)
//     })
// }

function getLinkInputRule(regexp) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
        if (!match[1] || !match[2]) { return; }
        let textStart = start
        let textEnd = end
        if (match[0].charAt(0) === ' ') {
            textStart += 1
        }
        let type = state.schema.marks.link
        if (!match[2].startsWith('ht' + 'tp://') && !match[2].startsWith('ht' + 'tps://')) {
            match[2] = 'ht' + 'tp://' + match[2]
        }
        let attrs = {}
        attrs.href = match[2]
        let tr = state.tr
        tr.delete(textStart, textEnd)
        tr.insertText(match[1])
        return tr.addMark(textStart, textStart + match[1].length, type.create(attrs)).removeStoredMark(type)
    })
}

function getNewLinkInputRule(regexp) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
        if (!match[1] || !match[2]) { return; }
        let textStart = start
        let textEnd = end
        if (match[0].charAt(0) === ' ') {
            textStart += 1
        }
        let type = state.schema.marks.link
        if (!match[2].startsWith('ht' + 'tp://') && !match[2].startsWith('ht' + 'tps://')) {
            match[2] = 'ht' + 'tp://' + match[2]
        }
        let attrs = {}
        attrs.href = match[2]
        let tr = state.tr
        tr.delete(textStart, textEnd)
        tr.insertText(match[1] + " ")
        return tr.addMark(textStart, textStart + match[1].length, type.create(attrs)).removeStoredMark(type)
    })
}

// function getHeadingInputRule(regexp) {
//     return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
//         var paraNode = state.selection.$from.parent;
//         if (paraNode.type.name !== 'paragraph') { return; }
//         var hashes = paraNode.textContent.trim();
//         if (hashes.replaceAll('#', '').length === 0 && hashes.length <= 6) {
//             var type = 'h' + hashes.length;
//             var tr = state.tr.replaceRangeWith(start, end, state.schema.nodes.paragraph.create({type: type}))
//             let TextSelection = RichTextEditor.PMExports.prosemirrorState.TextSelection;
//             let resolvedStartPos = tr.doc.resolve(start)
//             tr = tr.setSelection(new TextSelection(resolvedStartPos, resolvedStartPos))
//             return tr;
//         }
//     })
// }

function getQuoteInputRule(regexp) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
        var {$from, $to} = state.selection;
        var paraNode = state.selection.$from.parent;
        if (paraNode.type.name !== 'paragraph') { return; }
        if (paraNode.textContent.trim() === '!') {
            var wrappers = [ { type: state.schema.nodes.blockquote, attrs: {} }]
            var tr = state.tr.wrap($from.blockRange($to), wrappers)
            var tr = tr.replaceRangeWith(tr.mapping.map(start), tr.mapping.map(end), '')
            return tr;
        }
    })
}

function getHrInputRule(regexp) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
        var paraNode = state.selection.$from.parent;
        if (paraNode.type.name !== 'paragraph') { return; }
        var hashes = paraNode.textContent.trim();
        if (hashes.replaceAll('-', '').length === 0 && hashes.length > 2) {
            var tr = state.tr.replaceRangeWith(start, end, state.schema.nodes.hr.create({}))
            var tr = tr.replaceRangeWith(start, start, state.schema.nodes.paragraph.create({}))
            return tr;
        }
    })
}

function preProcessRegex(regex) {
    if(!regex.global) {
        regex = new RegExp(regex, regex.flags + 'g')
    }
    return regex
}

function getCustomInputRules(regexObj) {
    var rules = []

    for(let key in regexObj) {
        let preProcessedRegex = preProcessRegex(regexObj[key])
        rules.push(matcher(preProcessedRegex, key))
    }

    return rules
}

function undoCustomInputRule(state, dispatch) {
    let plugins = state.plugins

    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i]
        let customInputRulesPluginState
        
        if ((plugin.spec).isCustomInputRules && plugin.getState(state)) {
            customInputRulesPluginState = plugin.getState(state)
            
            if (dispatch) {
                let tr = state.tr, toUndo = customInputRulesPluginState.tr
                
                for (let j = toUndo.steps.length - 1; j >= 0; j--) {
                    tr.step(toUndo.steps[j].invert(toUndo.docs[j]))
                }
                
                if(customInputRulesPluginState.text) {
                    let marks = tr.doc.resolve(customInputRulesPluginState.from).marks()
                    tr.replaceWith(customInputRulesPluginState.from, customInputRulesPluginState.to, state.schema.text(customInputRulesPluginState.text, marks))
                } else {
                    tr.delete(customInputRulesPluginState.from, customInputRulesPluginState.to)
                }

                let escapedCharacterMarkType = state.schema.marks.escapedCharacter
                tr.addMark(customInputRulesPluginState.start, customInputRulesPluginState.start + customInputRulesPluginState.mdSyntaxLen, escapedCharacterMarkType.create())
                tr.addMark(customInputRulesPluginState.end, customInputRulesPluginState.end + customInputRulesPluginState.mdSyntaxLen, escapedCharacterMarkType.create())
                
                dispatch(tr)
            }
            return true
        }
    }
    return false
}

function matcher(regex, markName) {
    return function(props) {
        var {
            from,
            textInParaAfterInsertion,
            startPosOfTextNodeInPara,
            insertedText,
            view
        } = props
        var tr = view.state.tr
    
        var matchObjects = textInParaAfterInsertion.matchAll(regex)
        var modified = matchObjects.some((match) => {
            var $from = view.state.doc.resolve(from)
            if($from.parentOffset >= match.index && $from.parentOffset < match.index + match[0].length) {
                // current from position should be inside the match range, only then it means the user has wantedly triggered the markdown
                // else it means user did not trigger the markdown change, so don't handle it
                var markType = view.state.schema.marks[markName]
                var textStart = startPosOfTextNodeInPara + match.index + match[0].indexOf(match[1])
    
                if($from.parentOffset === match.index) {
                    // meaning the user has typed the initial markdown character after typing the text and the ending markdown character
                    // so remove the ending markdown character and add the mark for the remaining text
                    return handleStartingMDCharacterInsertion(match, insertedText, from, textStart, markType, tr, view)
                } else if($from.parentOffset === match.index + match[0].length - 1) {
                    // meaning the user has typed the ending markdown character after typing the text and the initial markdown character
                    // so remove the initial markdown character and add the mark for the remaining text
                    // here the mark should not be carry forwarded after applying the mark
                    return handleEndingMDCharacterInsertion(match, insertedText, from, textStart, markType, tr, view)
                } else {
                    // meaning the user has typed the text after typing the initial and final markdown characters
                    // here first insert the text because this text is normal text and it is not the syntax for the markdown as in above cases
                    // then remove the initial markdown character and the final markdown character
                    // then add the mark for the text
                    return handleCharacterInsertionInBetweenMDSyntaxes(match, insertedText, from, textStart, markType, tr, view)
                }
            }
        })

        return modified ? tr : null
    }
}

function addMarkAndSetMeta(tr, textStart, match, markType, from, insertedText) {
    tr = tr.addMark(textStart, textStart + match[2].length, markType.create())
    return tr.setMeta('customMatcher', {
        start: textStart,
        end: textStart + match[1].length + match[2].length,
        mark: markType,
        mdSyntaxLen: match[1].length,
        from: from,
        text: insertedText,
        tr: tr
    })
}

function handleCharacterInsertionInBetweenMDSyntaxes(match, insertedText, from, textStart, markType, tr, view) {

    // inside this function generally 3 cases arises
    //
    // 1. Normal expected case where the regex starts with first markdown syntax character
    // Here the case will be like the editor content will be "abc **"
    // Now type the character "d" in between the 2 astericks, so the content will be "abc *d*"
    // 
    // 2. If the regex starts with someother character other than the starting markdown syntax character, and the inserted character is not a part of starting
    // or ending markdown syntax character, an example of this case is:
    // The editor content would be "abc __", now insert "d" after the first "_", so the content will be "abc _d_"
    // 
    // In both the above cases we need to check whether the starting and ending markdown syntax characters are wrapped by escapedCharacter mark or not
    //      If both starting and ending markdown syntax characters are marked by escapedCharacter mark:
    //          then we don't need to do anything, just insert the character "d"
    //      else if only the starting/ending markdown syntax character is marked by escapedCharacter mark or if none of the markdown syntax characters are
    //      marked by escapedCharacter mark:
    //          then insert the character in insertedText variable and remove the starting and ending markdown syntax characters and
    //          apply the mark for the remaining text
    // 
    // 3. If the regex starts with someother character(say space) other than the starting markdown syntax character, and the inserted character is a part of starting
    // markdown syntax character, an example of this case is:
    // The editor content would be "abc def_", now insert "_" before the character "d", so the content will be "abc _def_"
    // Here no need to check whether the starting and ending markdown syntax characters are wrapped by escapedCharacter mark or not
    // because only one of the characters will be marked by escapedCharacter mark, and the other markdown syntax character will be the character in insertedText
    // variable
    // Here we need to insert the character in insertedText variable, remove the starting and ending markdown syntax characters and then apply the mark for
    // the remaining text


    var escapedCharacterMarkType = view.state.schema.marks.escapedCharacter
    var isEscapedCharacterMarkPresentAtStartMDSyntax = false, isEscapedCharacterMarkPresentAtEndMDSyntax = false

    if(!match[1].includes(insertedText)) {
        let firstMDSyntaxEndInd = textStart + match[1].length
        let secondMDSyntaxStartInd = textStart + match[1].length + (match[2].length - 1) // -1 because match[2] includes the current character
        // that is going to be inserted into the editor also, but that character will not be in the model, so we need to remove that and then
        // check whether escapedCharacter mark is present or not
        let secondMDSyntaxEndInd = textStart + match[1].length + (match[2].length - 1) + match[3].length

        isEscapedCharacterMarkPresentAtStartMDSyntax = view.state.doc.rangeHasMark(textStart, firstMDSyntaxEndInd, escapedCharacterMarkType)
        isEscapedCharacterMarkPresentAtEndMDSyntax = view.state.doc.rangeHasMark(secondMDSyntaxStartInd, secondMDSyntaxEndInd, escapedCharacterMarkType)
    }

    if(!isEscapedCharacterMarkPresentAtStartMDSyntax || !isEscapedCharacterMarkPresentAtEndMDSyntax) {
        tr = tr.insertText(insertedText)
        tr = tr.delete(textStart, textStart + match[1].length)
        tr = tr.delete(textStart + match[2].length, textStart + match[2].length + match[3].length)
        tr = addMarkAndSetMeta(tr, textStart, match, markType, from, insertedText)
        return true
    }
}

function handleEndingMDCharacterInsertion(match, insertedText, from, textStart, markType, tr, view) {
    tr = tr.delete(textStart, textStart + match[1].length)
    if(match[3].length > 1) {
        // here for any markdown which has more than one character, we need to remove the last n-1 characters also
        // for eg bold markdwon has only 1 character, that is there needs to be only one * before and after the text,
        // so we don't need to remove the last character because
        // the last character *, will be inserted into the editor only if we return false, but since we are returing tr as return value
        // the last character * will not even be inserted inside the editor even before it is done we will apply the bold mark
        // but for underline there are 2 characters, that is we need 2 underscores(__) before and after the text, so we need to remove the last 2 characters,
        // but since the last underscore will not be inserted into the editor because we return tr and not false, we need to only remove the preceeding
        // underscore character
        // similarly if there is a markdown which has 3 characters, that is say for eg any text inside *** shoukd be made both italics and underline,
        // then we need to remove the last 2 characters alone
        tr = tr.delete(textStart + match[2].length, textStart + match[2].length + match[3].length - 1)
    }
    tr = addMarkAndSetMeta(tr, textStart, match, markType, from, insertedText)
    tr = tr.removeStoredMark(markType)
    tr = tr.setMeta('storeMarks', false)

    return true
}

function handleStartingMDCharacterInsertion(match, insertedText, from, textStart, markType, tr, view) {
    if(!match[1].includes(insertedText)) {
        let escapedCharacterMarkType = view.state.schema.marks.escapedCharacter
        let isEscapedCharacterMarkPresentAtStartMDSyntax = false, isEscapedCharacterMarkPresentAtEndMDSyntax = false
        // handles if the regex starts with someother character other than the starting markdown syntax character and
        // if this match is triggered by inserting that someother character
        // for eg : the starting character for italics is space and not underscore
        // in these cases we need to insert the character in insertedText variable and remove the starting and ending markdown syntax characters and
        // apply the mark for only the remaining characters
        
        let firstMDSyntaxEndInd = (textStart - 1) + match[1].length // doing textStart - 1 because the currently inserted space character will not be in model
        // but textStart is calculated assuming the inserted character is already in the model
        let secondMDSyntaxStartInd = (textStart - 1) + match[1].length + match[2].length
        let secondMDSyntaxEndInd = (textStart - 1) + match[1].length + match[2].length + match[3].length

        isEscapedCharacterMarkPresentAtStartMDSyntax = view.state.doc.rangeHasMark(textStart - 1, firstMDSyntaxEndInd, escapedCharacterMarkType)
        isEscapedCharacterMarkPresentAtEndMDSyntax = view.state.doc.rangeHasMark(secondMDSyntaxStartInd, secondMDSyntaxEndInd, escapedCharacterMarkType)

        // why do we need the below if check?
        // 
        // Sometimes both start and end markdown syntax characters will be inserted before as a content character itself(meaning it will be wrapped in
        // escapedCharacter mark), but it would not have matched the markdown regex for some reason, now after typing some character before the first markdown
        // character, the regex would have matched, so in this case inorder to avoid the markdown operation, we need to do the below check
        // 
        // Eg: put "def __abc__" in editor, abc will be converted to underline markdown, now undo it, so initial 2 underscores and last 2 underscores will be wrapped
        // in escapedCharacter mark, now type "z" in between last 2 underscores and insert space before the character "c", the content after these operations
        // will be like this "def __abc _z_", now if we don't do the below if check
        // "!isEscapedCharacterMarkPresentAtStartMDSyntax || !isEscapedCharacterMarkPresentAtEndMDSyntax",
        // then the text "z" will be converted to italics markdown, which is not correct
        // because underscore before and after the text "z" are wrapped in escapedCharacter mark, so it should not be considered for markdown matching

        // If only starting or ending markdown syntax character is inserted before as a content character, then the below if check should fail
        // because only one of the start or end markdown syntax character will be wrapped in escapedCharacter mark.

        // why the similar if check is present only in handleStartingMDCharacterInsertion and not in handleEndingMDCharacterInsertion?
        // 
        // This 3rd case will be applicable only if the character is typed before the start markdown character, if we do it after the end markdown character
        // it will not even enter the if condition "$from.parentOffset >= match.index && $from.parentOffset < match.index + match[0].length" in matcher function
        // because $from.parentOffset will be equal to match.index + match[0].length because we are keeping cursor after the end markdown character only
        // and typing some character, so it should not be considered for markdown matching
        //
        // Eg: put "def __abc__" in editor, abc will be converted to underline markdown, now undo it, so initial 2 underscores and last 2 underscores will be wrapped
        // in escapedCharacter mark, now type "z" in between 2 inital underscores and insert space before the character "a", the content after these operations
        // will be like this "def _z_ abc__", here since space is inserted after end markdown character only, so it should not be considered for
        // markdown matching

        if(!isEscapedCharacterMarkPresentAtStartMDSyntax || !isEscapedCharacterMarkPresentAtEndMDSyntax) {
            tr = tr.insertText(insertedText)
            tr = tr.delete(textStart, textStart + match[1].length)
            tr = tr.delete(textStart + match[2].length, textStart + match[2].length + match[3].length)
            tr = addMarkAndSetMeta(tr, textStart, match, markType, from, insertedText)
            return true
        }
    } else {
        // handles if the regex does not start with space and if this match is triggered by inserting the starting markdown syntax character
        // here the markdown character should not be inserted, the rest of the starting markdown syntax characters should be removed if match[1].length > 1
        // and the ending markdown syntax characters should also be removed, and the mark should only be applied for the remaining characters
        if(match[1].length > 1) {
            tr = tr.delete(textStart, textStart + match[1].length - 1)
        }
        tr = tr.delete(textStart + match[2].length, textStart + match[2].length + match[3].length)
        tr = addMarkAndSetMeta(tr, textStart, match, markType, from, insertedText)
        return true
    }
    
}

function getCustomInputRulesPlugin(rules) {
    return new RichTextEditor.PMExports.prosemirrorState.Plugin({
        isCustomInputRules: true,
        state: {
            init() {
                return null
            },
            apply(tr, pluginState) {
                let stored = tr.getMeta('customMatcher')
                if (stored) {
                    return stored
                } else {
                    return tr.selectionSet || tr.docChanged ? null : pluginState
                }
            }
        },

        props: {
            handleTextInput: function(view, from, to, text) {

                if (view.composing) { return false }

                var $from = view.state.doc.resolve(from)

                if(from !== to) {
                    return false;
                }

                var paraNode = $from.parent;
                if (paraNode.type.name !== 'paragraph' || $from.depth <= 0) {
                    return false;
                }

                // $from.before() represents start of para node
                // $from.before() + 1 represents the start of text node inside the para node
                var startPosOfTextNodeInPara = $from.before() + 1
                var textInsertionPosInPara = from - startPosOfTextNodeInPara

                // here we are using textBetween api instead of textContent because textContent will not include leaf nodes,
                // whereas textbetween replaces the leaf nodes with space
                var textInParaBeforeInsertion = paraNode.textBetween(0, paraNode.content.size, ' ', ' ')
                
                var textInParaBeforeCursor = textInParaBeforeInsertion.slice(0, textInsertionPosInPara)

                // here we are inserting the additional text character at the position where the user has typed the text because
                // this handleTextInput API is called before the actual text is inserted into the editor
                // so we need to insert the text character at the position where the user has typed the text inorder to get the actual text content
                // of the paragraph and only then we can do our regex checks
                var textInParaAfterInsertion = textInParaBeforeCursor
                                               +
                                               text
                                               +
                                               textInParaBeforeInsertion.slice(textInsertionPosInPara)

                for(let i = 0; i < rules.length; i++) {
                    let tr = rules[i]({
                        from,
                        textInsertionPosInPara,
                        textInParaBeforeCursor,
                        textInParaBeforeInsertion,
                        textInParaAfterInsertion,
                        startPosOfTextNodeInPara,
                        insertedText: text,
                        view
                    })
                    if(!tr) {
                        continue;
                    } else {
                        view.dispatch(tr)
                        return true;
                    }
                }

                return false
            }
        }
    })
}

function getNewCodeblockInputRule(regexp) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
        var TextSelection = RichTextEditor.PMExports.prosemirrorState.TextSelection;
        var Fragment = RichTextEditor.PMExports.prosemirrorModel.Fragment
        var { $from } = state.selection;
        var paraNode = $from.parent;
        if (paraNode.type.name !== 'paragraph' || $from.depth !== 1) { return; }

        // $from.before() represents start of para node
        // $from.before() + 1 represents the start of text node inside the para node
        
        var textInsertionPosInPara = $from.pos - ($from.before() + 1)

        // here we are using textBetween api instead of textContent because textContent will not include leaf nodes,
        // whereas textbetween replaces the leaf nodes with space
        var paraNodeTextContentBeforeInsertion = paraNode.textBetween(0, paraNode.content.size, ' ', ' ')

        // here we are inserting the additional backtick character at the position where the user has typed the backtick because
        // this handleTextInput API which is used by prosemirrorInputRules is called before the actual text is inserted into the editor
        // so we need to insert the backtick character at the position where the user has typed the backtick inorder to get the actual text content
        // of the paragraph and only then we can do our regex checks
        var paraNodeTextContentAfterInsertion = paraNodeTextContentBeforeInsertion.slice(0, textInsertionPosInPara) + '`' + paraNodeTextContentBeforeInsertion.slice(textInsertionPosInPara)
        
        // this if is executed when 3 consecutive backticks are typed at the starting of the line and provided there is no text in the paragraph
        // we need to convert the paragraph node into a code block node
        if (paraNodeTextContentAfterInsertion.replaceAll('`', '').length === 0 && paraNodeTextContentAfterInsertion.length === 3) {
            let codeBlockNode = state.schema.nodes.code_block.create({id: 'code-block-' + Math.floor(Math.random()*100000)})
            let emptyPara = state.schema.nodes.paragraph.create(null)
            let tr = state.tr.replaceRangeWith(start, end, Fragment.fromArray([codeBlockNode, emptyPara]))
            let newFrom = tr.doc.resolve(start)
            tr = tr.setSelection(new TextSelection(newFrom))
            return tr;
        } else {
            // this else is executed if the user types 3 backticks in the middle of the paragraph or at the end of the paragraph
            // or even at the beginning of the paragraph but there is some text in the paragraph
            
            // find all matches of triple backticks in the paragraph content
            let matchObjs = Array.from(paraNodeTextContentAfterInsertion.matchAll(/```/g))
            let tr = state.tr
            let isCodeblockInserted = matchObjs.some((matchObj) => {
                let startPosOfMatchInParaAfterInsertion = matchObj.index
                let endPosOfMatchInParaAfterInsertion = matchObj.index + matchObj[0].length

                if(startPosOfMatchInParaAfterInsertion <= textInsertionPosInPara && endPosOfMatchInParaAfterInsertion > textInsertionPosInPara) {
                    // sometimes the user can type 3 backticks at start of line, codeblock would have been inserted by markdown matching,
                    // now the user can do undo and 3 backticks will be retained and now the user can continue typing, after typing a few
                    // characters in the same line the user can type 3 backticks again, now only the latest 3 backticks should be used for markdown matching
                    // and not the first 3 backticks
                    // this if ensures that only the latest 3 backticks is considered for markdown matching
                    
                    let startPosOfMatchInDocAfterInsertion = $from.before() + 1 + startPosOfMatchInParaAfterInsertion
                    let textToBeMovedIntoCodeBlock = paraNodeTextContentBeforeInsertion.slice(endPosOfMatchInParaAfterInsertion - 1)
                    // startPosOfMatchInDocAfterInsertion doesn't get affected by the text insertion, so we can calculate it from
                    // startPosOfMatchInParaAfterInsertion or startPosOfMatchInParaBeforeInsertion
                    // but textToBeMovedIntoCodeblock gets affected by the text insertion, so we need to calculate it from
                    // endPosOfMatchInParaAfterInsertion, and we need to do -1 because the currentlty inserted backtick character will not be in
                    // paraNodeTextContentBeforeInsertion
                    let endPosOfTextInCurParaInDocBeforeInsertion = $from.before() + 1 + paraNode.content.size
                    
                    tr = tr.delete(startPosOfMatchInDocAfterInsertion, endPosOfTextInCurParaInDocBeforeInsertion)
                    
                    let codeBlockNode
                    // if there is no text to be moved into the code block then we should not create empty text node as this will throw an error
                    if(textToBeMovedIntoCodeBlock) {
                        let codeBlockContent = state.schema.text(textToBeMovedIntoCodeBlock)
                        codeBlockNode = state.schema.nodes.code_block.create({id: 'code-block-' + Math.floor(Math.random()*100000)}, codeBlockContent)
                    } else {
                        codeBlockNode = state.schema.nodes.code_block.create({id: 'code-block-' + Math.floor(Math.random()*100000)})
                    }
                    
                    let emptyPara = state.schema.nodes.paragraph.create(null)
                    tr = tr.insert(startPosOfMatchInDocAfterInsertion, Fragment.fromArray([codeBlockNode, emptyPara]))
                    tr = tr.setSelection(new TextSelection(tr.doc.resolve(startPosOfMatchInDocAfterInsertion + 2)))
                    // here we are doing +2 because
                    // +0 will point at current cursor position, but we want the cursor to be palced at the starting of the codeblock in the next line,
                    // so +0 will not work
                    // +1 will point at the end of the para node, so even this will not work
                    // +2 will point at the start of the codeblock node, so this is what we want
                    return true
                }
            })

            return isCodeblockInserted ? tr : null
        }
    })
}

function getNewHeadingInputRule(regexp) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
        var TextSelection = RichTextEditor.PMExports.prosemirrorState.TextSelection;
        var Fragment = RichTextEditor.PMExports.prosemirrorModel.Fragment
        var { $from } = state.selection;
        var paraNode = $from.parent;
        if (paraNode.type.name !== 'paragraph' || $from.depth !== 1) { return; }

        // here we are using textBetween api instead of textContent because textContent will not include leaf nodes,
        // whereas textbetween replaces the leaf nodes with space
        var paraNodeTextContentBeforeInsertion = paraNode.textBetween(0, paraNode.content.size, ' ', ' ')
           
        // this if is executed when consecutive hash/hashes followed by a space is typed at the starting of the line and 
        // provided there is no text in the paragraph
        // we need to convert the paragraph node into a heading node
        if (paraNodeTextContentBeforeInsertion.replaceAll('#', '').length === 0 &&
            paraNodeTextContentBeforeInsertion.length >= 1 &&
            paraNodeTextContentBeforeInsertion.length <= 6) {
            var type = 'h' + paraNodeTextContentBeforeInsertion.length;
            var tr = state.tr.replaceRangeWith(start, end, state.schema.nodes.paragraph.create({type: type}))
            let resolvedStartPos = tr.doc.resolve(start)
            tr = tr.setSelection(new TextSelection(resolvedStartPos, resolvedStartPos))
            return tr;
        } else {
            // this else is executed if the user consecutive hash/hashes followed by a space in the middle of the paragraph or at the end of the paragraph
            // or even at the beginning of the paragraph but there is some text in the paragraph
            let startPosOfHashesInCurPara = match.index
            let startPosOfHashesInDoc = $from.before() + 1 + startPosOfHashesInCurPara
            let endPosOfTextInCurPara = $from.before() + 1 + paraNode.content.size
            let sliceToBeMovedIntoHeading = paraNode.slice(startPosOfHashesInCurPara + (match[0].length - 1), paraNode.content.size, false)
            // here we are doing + (match[0].length - 1) because we should not include the space after the hashes, because it would have not been inlcuded
            // at this point in time, because rememeber we are using prosemirror-inputrules, which in turn uses handleTextInput API
            
            let tr = state.tr.delete(startPosOfHashesInDoc, endPosOfTextInCurPara)
            
            let headingNode
            if(sliceToBeMovedIntoHeading) {
                headingNode = state.schema.nodes.paragraph.create({ type: 'h' + (match[0].length - 1) }, sliceToBeMovedIntoHeading.content)
            } else {
                headingNode = state.schema.nodes.paragraph.create({ type: 'h' + (match[0].length - 1) })
            }
            
            tr = tr.insert(startPosOfHashesInDoc, Fragment.fromArray([headingNode]))
            tr = tr.setSelection(new TextSelection(tr.doc.resolve(startPosOfHashesInDoc + 2)))
            // here we are doing +2 because
            // +0 will point at current cursor position, but we want the cursor to be palced at the starting of the heading in the next line,
            // so +0 will not work
            // +1 will point at the end of the para node, so even this will not work
            // +2 will point at the start of the heading node, so this is what we want
            return tr
        }
    })
}

function getInlineQuoteCursorIssuePlugin() {
    return new RichTextEditor.PMExports.prosemirrorState.Plugin({
        props: {
            handleKeyDown: function(view, event) {
                if(event.keyCode === 39) {
                    var { $from, $to } = view.state.selection;
                    if($from.pos !== $to.pos) {
                        return false
                    }

                    var parentNode = $from.parent
                    var parentNodeSize = parentNode.nodeSize

                    if(parentNode.type.name !== "paragraph") {
                        return false
                    }

                    var childNodes = parentNode.content.content

                    if(childNodes.length === 0) {
                        return false
                    }

                    var lastChildNode = childNodes[childNodes.length - 1]
                    var lastChildNodeMarks = lastChildNode.marks
                    var isInlineQuotePresentInLastChildNode = lastChildNodeMarks.some(mark => mark.type.name === "inlineQuote")

                    if(!isInlineQuotePresentInLastChildNode) {
                        return false
                    }

                    var paraStart = $from.before()
                    var isCurCursorAtEndOfParentNode = $from.pos === paraStart + parentNodeSize - 1

                    if(!isCurCursorAtEndOfParentNode) {
                        return false
                    }

                    var tr = view.state.tr.insert($from.pos, view.state.schema.text(' '))
                    tr = tr.setSelection(RichTextEditor.PMExports.prosemirrorState.TextSelection.create(tr.doc, $from.pos + 1))
                    view.dispatch(tr)
                    return true
                } else {
                    return false
                }
            }
        }
    })
}

function getHeadingsBackspacePlugin() {
    return new RichTextEditor.PMExports.prosemirrorState.Plugin({
        props: {
            handleKeyDown: function(view, event) {
                if(event.keyCode === 8 && view.state.selection.$from.depth > 0) {
                    var fromPos = view.state.selection.$from.pos
                    var toPos = view.state.selection.$to.pos

                    if(fromPos === toPos) {
                        var parentNodeStartPos = view.state.selection.$from.before()
                        var parentNode = view.state.doc.nodeAt(parentNodeStartPos)
                        if(parentNode.type.name === "paragraph" && parentNode.content.size === 1) {
                            var paraNodeType = parentNode.attrs.type
                            if(paraNodeType === 'h1' || paraNodeType === 'h2' || paraNodeType === 'h3' || paraNodeType === 'h4' || paraNodeType === 'h5' || paraNodeType === 'h6') {
                                var tr = view.state.tr.setNodeMarkup(parentNodeStartPos, parentNode.type, { type: 'p' })
                                tr = tr.delete(fromPos - 1, fromPos)
                                view.dispatch(tr)
                                return true
                            }
                        }
                    }
                }

                return false
            }
        }
    })
}

// function getCodeblockInputRule() {

//     var codeBlockStartRule = '```'
//     var codeBlockEndRule = '```'

//     var plugin = new RichTextEditor.PMExports.prosemirrorState.Plugin({

//         appendTransaction: function(trArr, oldState, newState) {
//             var from = newState.selection.$from.pos
//             var to = newState.selection.$to.pos

//             // if there is a selection no need to check for code_blocks regex, as matching regex and converting markdown syntax to prosemirror nodes
//             // should happen only in typing thread, and not during any selections.
//             if(from !== to) {
//                 return
//             }
//             var regexString = codeBlockStartRule + '([\x00-\x7F]+)' + codeBlockEndRule
//             var codeBlockMarkdownRegex = new RegExp(regexString, 'g')
//             var docText = newState.doc.textBetween(1, to, '\n', '\n')
//             var match = Array.from(docText.matchAll(codeBlockMarkdownRegex))
//             var startInd, endInd;
//             if(match[0] && match[0][1]) {

//                 //find start index and end index
//                 newState.doc.nodesBetween(1, to, function(node, start) {
//                     if(node.type.name === 'text') {
//                         let nodeContent = node.textContent
//                         let sameNode = false
//                         if(!startInd && nodeContent.includes(codeBlockStartRule)) {
//                             startInd = nodeContent.indexOf(codeBlockStartRule) + start
//                             sameNode = true
//                         }
                            
//                         if(startInd && !endInd && nodeContent.includes(codeBlockEndRule)) {
//                             if(!sameNode) {
//                                 endInd = nodeContent.indexOf(codeBlockEndRule) + start + codeBlockEndRule.length
//                             } else {
//                                 // this if block would be executed in the below case:
//                                 // sample text ```var a = 7;```
//                                 // in the above case both start and end is in the same line, so
//                                 // we need to call indexOf and includes APIs from the index where codeBlockStartRule ends, that is from
//                                 // the starting of the letter 'v' in the word 'var'
//                                 let indToStartSearchFrom = nodeContent.indexOf(codeBlockStartRule) + codeBlockStartRule.length
//                                 if(nodeContent.includes(codeBlockEndRule, indToStartSearchFrom)) {
//                                     endInd = nodeContent.indexOf(codeBlockEndRule, indToStartSearchFrom) + start + codeBlockEndRule.length
//                                 }
//                             }
//                         }
//                     }
//                 })

//                 // create codeblock node with matched content
//                 var Fragment = RichTextEditor.PMExports.prosemirrorModel.Fragment
//                 var codeBlockContent = newState.schema.text(match[0][1])
//                 var codeBlockNode = newState.schema.nodes.code_block.create({id: 'code-block-' + Math.floor(Math.random()*100000)}, codeBlockContent)
//                 var emptyPara = newState.schema.nodes.paragraph.create(null)
//                 tr = newState.tr.replaceWith(startInd, endInd, Fragment.fromArray([codeBlockNode, emptyPara]))
//                 return tr
//             }
//         }
//     });
//     return plugin
//   }

function getHTMLContent() {
    // return `<p>--&gt; one</p><p><strong>two</strong></p><p>three <code>&#95;four&#95;</code> and <code>inline code</code></p><p><blockquote>blockquote</blockquote></p><p><h1>heading11</h1>fourr</p>`
    var html = `Bold <strong>Hello</strong><br><h1>Hello</h1><h3>Hello</h3>Italics <i>Hello</i><br>Strike <strike>Hello</strike><br>Underline <u>Hello</u><br>Quote <code>Hello</code><br><blockquote>BlockQuote Hello</blockquote>Hyperlink  <a href="https://nohello.net" markdown="linkhtml" target="_blank">hello</a><br>Codesnippet <pre>Hello</pre><br><br><span elemtype="user" hover="true" uid="681080871" class="hvrinfo " mentionedid="681080871"  mentionmsgid="CT_2230677709786161841_64396901-B1|42709957|1699363330242" mention_on="9" mentiontype="1">@AmudhaVigneshwaran</span> mention <br><br> <span class="emoji" elemtype="emoji" nodetype=":" code="💎" title="Gem">💎</span> emoji and <br><br> <em title="Curious" class="zcslymsg-curious" code=":curious:" nodetype=":"></em> zomoji <br><br> <em scheduledMsg=undefined allowToAddfav=false customSmiley=true smileyname="ZVP"  liveMessage=undefined isChatMessageRender=true type="emoji" class="customEmoji-preview-img lazy-load lazy-load-customemojis zcl-rloader-smiley" smiley_key="17202823900616982181004130" code=":17202823900616982181004130_64396901_1_1_ZVP$:" smileyimgsrc=https://download-accl.zoho.com/webdownload?x-service=cliq_resources&amp;event-id=17202823900616982181004130&amp;x-cli-msg=%7B%22x-cliq-resource-module%22%3A%22custom_emojis%22%2C%22appaccount_id%22%3A%2264396901%22%7D title="ZVP"></em> custom sticker`
    return convertCliqHTML2RTE(html);
}

RichTextEditor.registerElement({
    cliqMention: {
        addNodes: function(schema) {
            return schema.spec.nodes.append({
                cliqMention: {
                    atom: true,
                    group: 'inline',
                    inline: true,
                    attrs: {
                        uid: { default: null },
                        elemtype: { default: null },
                        nodetype: { default: null },
                        dataTitle: { default: null },
                        title: { default: null }
                    },
                    parseDOM: [
                        {
                            tag: 'span.selusr',
                            getAttrs: function(el) {
                                var attrs = {}

                                if(el.getAttribute('nodetype') === '@') {
                                    attrs.nodetype = el.getAttribute('nodetype')
                                } else if (el.getAttribute('nodetype') === '#') {
                                    attrs.nodetype = el.getAttribute('nodetype')
                                } else {
                                    return false // if the nodetype !== '@' means it can't be cliqMention node, so return false thereby stating it is not cliqMention node
                                }
                                
                                if(el.getAttribute('uid')) {
                                    attrs.uid = el.getAttribute('uid')
                                }

                                if(el.getAttribute('elemtype')) {
                                    attrs.elemtype = el.getAttribute('elemtype')
                                }

                                if(el.getAttribute('data-title')) {
                                    attrs.dataTitle = el.getAttribute('data-title')
                                }

                                if(el.getAttribute('title')) {
                                    attrs.title = el.getAttribute('title')
                                }

                                return attrs
                            }
                        }
                    ],
                    toDOM: function(node) {
                        
                        var { nodetype, uid, elemtype, dataTitle, title } = node.attrs

                        var domAttrs = {}

                        if(nodetype) {
                            domAttrs.nodetype = nodetype
                        }

                        if(uid) {
                            domAttrs.uid = uid
                        }

                        if(elemtype) {
                            domAttrs.elemtype = elemtype
                        }

                        if(dataTitle) {
                            domAttrs['data-title'] = dataTitle
                        }

                        if(title) {
                            domAttrs.title = title
                        }

                        domAttrs.class = "selusr"

                        return ['span', domAttrs, title]
                    }
                }
            })
        },

        registerCommand: function(view) {
            view.registerCommand({
                insertCliqMentionNode: function(nodeAttrs, from, to) { 
                    view.insertNode('cliqMention', nodeAttrs, from, to)
                }
            })
        }
    },
    smileyNode : {
        addNodes : function(schema) {
            return schema.spec.nodes.append({
                smileyNode: {
                    atom: true,
                    group: 'inline',
                    inline: true,
                    attrs: {
                        code: { default: null },
                        unicode : {default : null },
                        elemtype: { default: null },
                        nodetype: { default: null },
                        title: {default : null }
                    },
                    parseDOM: [
                        {
                            tag: 'span.emoji',
                            getAttrs: function(el) {
                                var attrs = {}

                                if(el.getAttribute('nodetype') === ':') {
                                    attrs.nodetype = el.getAttribute('nodetype')
                                } else {
                                    return false 
                                }
                                
                                if(el.getAttribute('elemtype')  == "emoji") {
                                    attrs.elemtype = el.getAttribute('elemtype')
                                }
                                else 
                                {
                                    return false;
                                }


                                if(el.getAttribute('title')) {
                                    attrs.title = el.getAttribute('title')
                                }

                                if(el.getAttribute('code')) {
                                    attrs.code = el.getAttribute('code')
                                }

                                if(el.getAttribute('unicode')) {
                                    attrs.code = el.getAttribute('unicode')
                                }

                                return attrs
                            }
                        }
                    ],
                    toDOM: function(node) {
                        
                        var { nodetype, code, elemtype, title, unicode } = node.attrs

                        var domAttrs = {}

                        if(nodetype) {
                            domAttrs.nodetype = nodetype
                        }

                        if(code) {
                            domAttrs.code = code
                        }

                        if(elemtype) {
                            domAttrs.elemtype = elemtype
                        }

                        if(title) {
                            domAttrs.title = title
                        }

                        if( unicode ) {
                            domAttrs.unicode = unicode
                        }


                        domAttrs.class = "emoji"

                        return ['span', domAttrs, code ]
                    }
                }
            })
        },
        registerCommand : function(view) {
            view.registerCommand({
                insertSmileyNode: function(nodeAttrs, from, to) { 
                    view.insertNode('smileyNode', nodeAttrs, from, to)
                }
            })
        }
    },
    memberNode : {
        addNodes : function(schema) {
            return schema.spec.nodes.append({
                memberNode: {
                    atom: true,
                    group: 'inline',
                    inline: true,
                    attrs: {
                        type: { default: null },
                        action : {default : null },
                        elemtype: { default: null },
                        nodetype: { default: null },
                        title: {default : null },
                        uid: {default: null}
                    },
                    parseDOM: [
                        {
                            tag: 'span.selusr',
                            getAttrs: function(el) {
                                var attrs = {}

                                if(el.getAttribute('nodetype') === '+') {
                                    attrs.nodetype = el.getAttribute('nodetype')
                                } else {
                                    return false 
                                }
                                
                                if( el.getAttribute('elemtype') ) {
                                    attrs.elemtype = el.getAttribute("elemtype");
                                }

                                if(el.getAttribute('title')) {
                                    attrs.title = el.getAttribute('title')
                                }

                                if(el.getAttribute('uid')) {
                                    attrs.uid = el.getAttribute('uid')
                                }

                                if(el.getAttribute('action')) {
                                    attrs.action = el.getAttribute('action')
                                }

                                if(el.getAttribute('type')) {
                                    attrs.type = el.getAttribute('type')
                                }

                                return attrs
                            }
                        }
                    ],
                    toDOM: function(node) {
                        
                        var { nodetype, elemtype, title, uid, action, type } = node.attrs

                        var domAttrs ={ nodetype, elemtype, title, uid, 'data-title' : title, action,type, class : "selusr" }

                        Object.keys(domAttrs).forEach((key) => 
                        {
                            if(!domAttrs[key]){ 
                                delete domAttrs[key];
                            }
                        })
                        return ['span', domAttrs, title ]
                    }
                }
            })
        },
        registerCommand : function(view) {
            view.registerCommand({
                insertMemberNode: function(nodeAttrs, from, to) { 
                    view.insertNode('memberNode', nodeAttrs, from, to)
                }
            })
        }
    },
    zomojiNode : {
        addNodes : function(schema) {
            return schema.spec.nodes.append({
                zomojiNode: {
                    atom: true,
                    group: 'inline',
                    inline: true,
                    attrs: {
                        code: { default: null },
                        className: { default: null },
                        nodetype: { default: null },
                        title: {default : null }
                    },
                    parseDOM: [
                        {
                            tag: 'span',
                            getAttrs: function(el) {
                                var attrs = {}

                                if(el.getAttribute('nodetype') === ':') {
                                    attrs.nodetype = el.getAttribute('nodetype')
                                } else {
                                    return false 
                                }
                                
                                
                                if( el.getAttribute('class') ) {
                                    attrs.className = el.getAttribute("class");
                                }

                                if(el.getAttribute('title')) {
                                    attrs.title = el.getAttribute('title')
                                }

                                if(el.getAttribute('code')) {
                                    attrs.code = el.getAttribute('code')
                                }

                                return attrs
                            }
                        }
                    ],
                    toDOM: function(node) {
                        
                        var { nodetype, title, code, className } = node.attrs

                        var domAttrs = {}

                        if(nodetype) {
                            domAttrs.nodetype = nodetype;
                        }

                        if(title) {
                            domAttrs.title = title
                        }

                        if(code) {
                             domAttrs.code  = code;
                        }


                        domAttrs.class = className

                        return ['span', domAttrs ]
                    }
                }
            })
        },
        registerCommand : function(view) {
            view.registerCommand({
                insertZomojiNode: function(nodeAttrs, from, to) { 
                    view.insertNode('zomojiNode', nodeAttrs, from, to)
                }
            })
        }
    },
    
    customEmojiNode : {
        addNodes : function(schema) {
            return schema.spec.nodes.append({
                customEmojiNode: {
                    atom: true,
                    group: 'inline',
                    inline: true,
                    attrs: {
                        code: { default: null },
                        style: { default: null },
                        nodetype: { default: null },
                        title: {default : null }
                    },
                    parseDOM: [
                        {
                            tag: 'span.customEmoji-preview-img',
                            getAttrs: function(el) {
                                var attrs = {}

                                if(el.getAttribute('nodetype') === ':') {
                                    attrs.nodetype = el.getAttribute('nodetype')
                                } else {
                                    return false 
                                }
                                
                                if(el.getAttribute('style')) {
                                    attrs.style = el.getAttribute('style')
                                }


                                if(el.getAttribute('title')) {
                                    attrs.title = el.getAttribute('title')
                                }

                                if(el.getAttribute('code')) {
                                    attrs.code = el.getAttribute('code')
                                }

                                return attrs
                            }
                        }
                    ],
                    toDOM: function(node) {
                        
                        var { nodetype, code, style, title } = node.attrs

                        var domAttrs = {}

                        if(nodetype) {
                            domAttrs.nodetype = nodetype
                        }

                        if(code) {
                            domAttrs.code = code
                        }

                        if(title) {
                            domAttrs.title = title
                        }

                        if( style ) {
                            domAttrs.style = style
                        }


                        domAttrs.class = "customEmoji-preview-img"

                        return ['span', domAttrs]
                    }
                }
            })
        },
        registerCommand : function(view) {
            view.registerCommand({
                insertCustomEmojiNode: function(nodeAttrs, from, to) { 
                    view.insertNode('customEmojiNode', nodeAttrs, from, to)
                }
            })
        }
    },

    escapedCharacter : {
        addNodes : function(schema) {
            return schema.spec.marks.append({
                escapedCharacter: {
                    inclusive: false,
                    parseDOM: [
                        {
                            tag: 'span[escaped-character]'
                        }
                    ],
                    toDOM: function() {
                        return ['span', { "escaped-character": "" }]
                    }
                }
            })
        }
    }
})


/**
 * 
 * ------------- HELPERS ------------------------------
 */

function getContent() {
    return {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "attrs": {
                    "align": null,
                    "lineHeight": null,
                    "dir": null,
                    "indent": 0,
                    "type": "p"
                },
                "content": [
                    {
                        "type": "text",
                        "text": "1. Apply "
                    },
                    {
                        "type": "text",
                        "marks": [
                            {
                                "type": "strong"
                            }
                        ],
                        "text": "bold"
                    },
                    {
                        "type": "text",
                        "text": "/"
                    },
                    {
                        "type": "text",
                        "marks": [
                            {
                                "type": "em"
                            }
                        ],
                        "text": "italic"
                    },
                    {
                        "type": "text",
                        "text": " formattings with keyboard shortcuts! "
                    },
                    {
                        "type": "text",
                        "marks": [
                            {
                                "type": "strong"
                            }
                        ],
                        "text": "CMD+B / CMD+I"
                    },
                    {
                        "type": "br"
                    },
                    {
                        "type": "br"
                    },
                    {
                        "type": "text",
                        "text": "2. Format on the fly! Try typing"
                    },
                    {
                        "type": "text",
                        "marks": [
                            {
                                "type": "strong"
                            }
                        ],
                        "text": " *bold*"
                    },
                    {
                        "type": "text",
                        "text": " and watch it turn bold as you type 🚀 "
                    },
                    {
                        "type": "br"
                    },
                    {
                        "type": "br"
                    },
                    {
                        "type": "text",
                        "text": "3.  ​Supports @mentions and /slash commands! "
                    },
                    {
                        "type": "mention",
                        "attrs": {
                            "name": "Jamel Charles",
                            "zuid": 1038,
                            "email": "Jamel@testrte.com"
                        }
                    },
                    {
                        "type": "text",
                        "text": " "
                    },
                    {
                        "type": "br"
                    },
                    {
                        "type": "br"
                    },
                    {
                        "type": "text",
                        "text": "4. The editor automatically "
                    },
                    {
                        "type": "text",
                        "marks": [
                            {
                                "type": "strong"
                            }
                        ],
                        "text": "imports and exports Cliq's markdown text format! "
                    },
                    {
                        "type": "text",
                        "text": "Ensures seamless integration with the product ✅ "
                    },
                    {
                        "type": "br"
                    },
                    {
                        "type": "br"
                    },
                    {
                        "type": "text",
                        "text": "5. Eventually, we can even provide a menubar for "
                    },
                    {
                        "type": "text",
                        "marks": [
                            {
                                "type": "em"
                            }
                        ],
                        "text": "Slack-like experience!"
                    }
                ]
            }
        ]
    }
}

function getAtmentionsSuggestions() {
    return function(type, text, callback, extras, view) {
        var suggestions = getsuggestions();
        if (type === 'mention') {
            var newSuggestions = [];
            for (var index = 0; index < suggestions.length; index++) {
                var suggestion = suggestions[index];
                var suggestionName = suggestion.fullname;
                var suggestionMailId = suggestion.emailid;
                var textSize = text.length;
                var nameStartsWithText =
                    text.toUpperCase() ===
                    suggestionName.slice(0, textSize).toUpperCase();
                var mailIdStartsWithText =
                    text.toUpperCase() ===
                    suggestionMailId.slice(0, textSize).toUpperCase();
                if (nameStartsWithText || mailIdStartsWithText) {
                    newSuggestions.push(suggestion);
                }
            }
            callback && callback(newSuggestions);
        }
    };
}

function getsuggestions() {
    return [
        {
            "zuid": 1001,
            "fullname": "Random Names",
            "usertype": "personal",
            "val": "Random@testrte.com",
            "emailid": "Random@testrte.com"
        },
        {
            "zuid": 1002,
            "fullname": "Samiyah Sosa",
            "usertype": "personal",
            "val": "Samiyah@testrte.com",
            "emailid": "Samiyah@testrte.com"
        },
        {
            "zuid": 1003,
            "fullname": "Ophelia Sims",
            "usertype": "personal",
            "val": "Ophelia@testrte.com",
            "emailid": "Ophelia@testrte.com"
        },
        {
            "zuid": 1004,
            "fullname": "Elysia Clay",
            "usertype": "personal",
            "val": "Elysia@testrte.com",
            "emailid": "Elysia@testrte.com"
        },
        {
            "zuid": 1005,
            "fullname": "Khia Pacheco",
            "usertype": "personal",
            "val": "Khia@testrte.com",
            "emailid": "Khia@testrte.com"
        },
        {
            "zuid": 1006,
            "fullname": "Nasir Whittaker",
            "usertype": "personal",
            "val": "Nasir@testrte.com",
            "emailid": "Nasir@testrte.com"
        },
        {
            "zuid": 1007,
            "fullname": "Anthony Newman",
            "usertype": "personal",
            "val": "Anthony@testrte.com",
            "emailid": "Anthony@testrte.com"
        },
        {
            "zuid": 1008,
            "fullname": "Aniqa Sullivan",
            "usertype": "personal",
            "val": "Aniqa@testrte.com",
            "emailid": "Aniqa@testrte.com"
        },
        {
            "zuid": 1009,
            "fullname": "Ernie Woodward",
            "usertype": "personal",
            "val": "Ernie@testrte.com",
            "emailid": "Ernie@testrte.com"
        },
        {
            "zuid": 1010,
            "fullname": "Pranav Copeland",
            "usertype": "personal",
            "val": "Pranav@testrte.com",
            "emailid": "Pranav@testrte.com"
        },
        {
            "zuid": 1011,
            "fullname": "Elsa Wheeler",
            "usertype": "personal",
            "val": "Elsa@testrte.com",
            "emailid": "Elsa@testrte.com"
        },
        {
            "zuid": 1012,
            "fullname": "Meadow Norman",
            "usertype": "personal",
            "val": "Meadow@testrte.com",
            "emailid": "Meadow@testrte.com"
        },
        {
            "zuid": 1013,
            "fullname": "Zayaan Bowler",
            "usertype": "personal",
            "val": "Zayaan@testrte.com",
            "emailid": "Zayaan@testrte.com"
        },
        {
            "zuid": 1014,
            "fullname": "Rihanna Burns",
            "usertype": "personal",
            "val": "Rihanna@testrte.com",
            "emailid": "Rihanna@testrte.com"
        },
        {
            "zuid": 1015,
            "fullname": "Huda Wainwright",
            "usertype": "personal",
            "val": "Huda@testrte.com",
            "emailid": "Huda@testrte.com"
        },
        {
            "zuid": 1016,
            "fullname": "Raife Hernandez",
            "usertype": "personal",
            "val": "Raife@testrte.com",
            "emailid": "Raife@testrte.com"
        },
        {
            "zuid": 1017,
            "fullname": "Zayyan Dunkley",
            "usertype": "personal",
            "val": "Zayyan@testrte.com",
            "emailid": "Zayyan@testrte.com"
        },
        {
            "zuid": 1018,
            "fullname": "Maison Banks",
            "usertype": "personal",
            "val": "Maison@testrte.com",
            "emailid": "Maison@testrte.com"
        },
        {
            "zuid": 1019,
            "fullname": "Athena Drummond",
            "usertype": "personal",
            "val": "Athena@testrte.com",
            "emailid": "Athena@testrte.com"
        },
        {
            "zuid": 1020,
            "fullname": "Bailey Silva",
            "usertype": "personal",
            "val": "Bailey@testrte.com",
            "emailid": "Bailey@testrte.com"
        },
        {
            "zuid": 1021,
            "fullname": "Kenzie Rivers",
            "usertype": "personal",
            "val": "Kenzie@testrte.com",
            "emailid": "Kenzie@testrte.com"
        },
        {
            "zuid": 1022,
            "fullname": "Brandon-Lee Ratcliffe",
            "usertype": "personal",
            "val": "Brandon-Lee@testrte.com",
            "emailid": "Brandon-Lee@testrte.com"
        },
        {
            "zuid": 1023,
            "fullname": "Macauley O'Connor",
            "usertype": "personal",
            "val": "Macauley@testrte.com",
            "emailid": "Macauley@testrte.com"
        },
        {
            "zuid": 1024,
            "fullname": "Belle Guerra",
            "usertype": "personal",
            "val": "Belle@testrte.com",
            "emailid": "Belle@testrte.com"
        },
        {
            "zuid": 1025,
            "fullname": "Carly Rubio",
            "usertype": "personal",
            "val": "Carly@testrte.com",
            "emailid": "Carly@testrte.com"
        },
        {
            "zuid": 1026,
            "fullname": "Finlay Price",
            "usertype": "personal",
            "val": "Finlay@testrte.com",
            "emailid": "Finlay@testrte.com"
        },
        {
            "zuid": 1027,
            "fullname": "Margie Riley",
            "usertype": "personal",
            "val": "Margie@testrte.com",
            "emailid": "Margie@testrte.com"
        },
        {
            "zuid": 1028,
            "fullname": "Kim Derrick",
            "usertype": "personal",
            "val": "Kim@testrte.com",
            "emailid": "Kim@testrte.com"
        },
        {
            "zuid": 1029,
            "fullname": "Mira Matthams",
            "usertype": "personal",
            "val": "Mira@testrte.com",
            "emailid": "Mira@testrte.com"
        },
        {
            "zuid": 1030,
            "fullname": "Laaibah Herring",
            "usertype": "personal",
            "val": "Laaibah@testrte.com",
            "emailid": "Laaibah@testrte.com"
        },
        {
            "zuid": 1031,
            "fullname": "Hayley Hays",
            "usertype": "personal",
            "val": "Hayley@testrte.com",
            "emailid": "Hayley@testrte.com"
        },
        {
            "zuid": 1032,
            "fullname": "Tyrone Solis",
            "usertype": "personal",
            "val": "Tyrone@testrte.com",
            "emailid": "Tyrone@testrte.com"
        },
        {
            "zuid": 1033,
            "fullname": "Thelma Rasmussen",
            "usertype": "personal",
            "val": "Thelma@testrte.com",
            "emailid": "Thelma@testrte.com"
        },
        {
            "zuid": 1034,
            "fullname": "Fionnuala English",
            "usertype": "personal",
            "val": "Fionnuala@testrte.com",
            "emailid": "Fionnuala@testrte.com"
        },
        {
            "zuid": 1035,
            "fullname": "Kirsten Mata",
            "usertype": "personal",
            "val": "Kirsten@testrte.com",
            "emailid": "Kirsten@testrte.com"
        },
        {
            "zuid": 1036,
            "fullname": "Austen Salinas",
            "usertype": "personal",
            "val": "Austen@testrte.com",
            "emailid": "Austen@testrte.com"
        },
        {
            "zuid": 1037,
            "fullname": "Reiss Piper",
            "usertype": "personal",
            "val": "Reiss@testrte.com",
            "emailid": "Reiss@testrte.com"
        },
        {
            "zuid": 1038,
            "fullname": "Jamel Charles",
            "usertype": "personal",
            "val": "Jamel@testrte.com",
            "emailid": "Jamel@testrte.com"
        },
        {
            "zuid": 1039,
            "fullname": "Lloyd Harrington",
            "usertype": "personal",
            "val": "Lloyd@testrte.com",
            "emailid": "Lloyd@testrte.com"
        },
        {
            "zuid": 1040,
            "fullname": "Presley Rodrigues",
            "usertype": "personal",
            "val": "Presley@testrte.com",
            "emailid": "Presley@testrte.com"
        },
        {
            "zuid": 1041,
            "fullname": "Payton Bannister",
            "usertype": "personal",
            "val": "Payton@testrte.com",
            "emailid": "Payton@testrte.com"
        }
    ];    
}