import MarkdownIt from "markdown-it"
import Token from "markdown-it/lib/token"

/**
 * The default tokenizer puts text tokens directly next to <td> tokens. This causes problems when converting into prosemirror json, because as per
 * schema, any text node should be wrapped within para nodes. 
 * 
 * This extended class ensures that all text/inline tokens next to <td> tokens are wrapped within <p> tokens
 */
export default class RTEMarkdownIt extends MarkdownIt {
    constructor(preset, options) {
        super(preset, options)
    }

    parse(src, env) {
        var tokens = super.parse(src, env)
        
        // process table tokens
        var finaltokens = [];
        tokens.forEach((tok, i) => {
            finaltokens.push(tok)
            if (tok.type === 'th_open' || tok.type === 'td_open') {
                var nextToken = tokens[i+1] 
                if (nextToken && nextToken.type === 'inline') {
                    var popen = new Token('paragraph_open', 'p', 1)
                    popen.block = true
                    finaltokens.push(popen)
                }
            }
            if (tok.type === 'th_close' || tok.type === 'td_close') {
                var prevToken = tokens[i-1] 
                if (prevToken && prevToken.type === 'inline') {
                    var pclose = new Token('paragraph_close', 'p', -1)
                    pclose.block = true
                    finaltokens.push(pclose)
                }
            }
        })
        
        return finaltokens;

    }
}