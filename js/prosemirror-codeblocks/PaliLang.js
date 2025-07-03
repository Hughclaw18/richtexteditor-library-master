// import { LRLanguage, LanguageSupport } from '@codemirror/language';

import { tagHighlighter, tags } from "@lezer/highlight"

const parseLine = function(line) {
    if (!window.PaliAceHighlighter) { // wasm not loaded
        return []
    }

    var tokens = getString(PaliAceHighlighter.exports_.GetTokens(toWasmString(line, PaliAceHighlighter.exports_.GetOffset()), 0, 0))
    PaliAceHighlighter.exports_.Reset_()
    tokens = JSON.parse(tokens).map(x => {
        return {
            type: PaliAceHighlighter.tokensList[x.name] ? PaliAceHighlighter.tokensList[x.name].style : '',
            value: line.slice(x.range.start.character, x.range.end.character + 1)
        }
    })

    return tokens;
}

export const paliLang = {
    name: "pali",
    
    token: function(stream, state) {
        if (stream.string != state.line) {
            state.line = stream.string
            state.tokenIdx = 0
            try {
                state.tokens = parseLine(stream.string)
            } catch (ex) {
                state.tokens = []
            }
        }

        if (state.tokens && state.tokens[state.tokenIdx]) {
            var tok = state.tokens[state.tokenIdx];
            if (stream.match(tok.value)) {
                state.tokenIdx++;
                if (tok.type === 'keyword') {
                    return 'keyword'
                } else if (tok.type === 'variable') {
                    return 'name'
                } else if (tok.type === 'flow' || tok.type === 'string') {
                    return 'string'
                } else if (tok.type === 'comment') {
                    return 'comment'
                }
            } else {
                stream.skipToEnd()
            }
        } else {
            stream.skipToEnd()
        }
    },

    startState: function(indentUnit) {
        return {
            line: '',
            tokens: null,
            tokenIdx: undefined
        }
    },

    languageData: {
      commentTokens: {line: "#", block: {open: "#|", close: "|#"}},
      closeBrackets: {brackets: ["(", "[", "{", '"']}
    }
};

export const paliHighlighter = tagHighlighter([
    {tag: tags.keyword, class: 'pali-keyword', color: '#5e57b5'},
    {tag: tags.name, class: 'pali-variable', color: '#c69060'},
    // {tag: tags.variable, class: 'pali-variable', color: '#c69060'},
    {tag: tags.variableName, class: 'pali-variable', color: '#c69060'},
    {tag: tags.string, class: 'pali-string', color: '#d10000'},
    {tag: tags.comment, class: 'pali-comment', color: '#9c9b96'}
])