import dompurify from "dompurify"

export const html = {
    inline: false,
    attrs: {
        htmlString: { default: null }
    },
    group: "block",
    draggable: false,
    parseDOM: [{
        tag: "div[rte-html-string]", 
        getAttrs: function(dom) {
            return { htmlString: dom.innerHTML === '&nbsp;' ? "" : dom.innerHTML }// if empty html block is copy pasted, then dom.innerHTML will not be empty string instead it will be &nbsp; , so replace this &nbsp; with empty string
        }
    }],
    toDOM(node) { 
        let { htmlString } = node.attrs;
        let div = document.createElement('div')
        
        div.setAttribute('rte-html-string', '')
        if(!htmlString) {
            div.innerHTML = '&nbsp;'
        } else {
            htmlString = dompurify.sanitize(htmlString)//clean the html string before pasting into dom, because the html string may contain malicious data such as a script tag to run a script which automatically obtains all the cookies present, etc
            div.innerHTML = htmlString
        }
        return div
    }
} 