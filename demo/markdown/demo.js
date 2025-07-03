// construct options

var currentView = 'md' // 'json', 'html'

var options = {
    mode: 'markdown',
    // content: getContent(),
    content: ''
};


var slashCommandFeature = {
    name: 'suggestions',
    trigger: ['/'],
    getSuggestions: (state, query, done, view) => {
        var commands = [
            {id: 'h1', title: 'Heading 1', description: 'Big section heading.', img: 'https://www.notion.so/images/blocks/header.57a7576a.png'},
            {id: 'h2', title: 'Heading 2', description: 'Medium section heading.', img: 'https://www.notion.so/images/blocks/subheader.9aab4769.png'},
            {id: 'h3', title: 'Heading 3', description: 'Small section heading.', img: 'https://www.notion.so/images/blocks/subsubheader.d0ed0bb3.png'},
            {id: 'blockquote', title: 'Quote', description: 'Capture a quote.', img: 'https://www.notion.so/images/blocks/quote/en-US.png'},
            {id: 'codeblock', title: 'Code', description: 'Capture a code snippet.', img: 'https://www.notion.so/images/blocks/code.a8b201f4.png'},
            {id: 'blist', title: 'Bulleted List', description: 'Create a simple bulleted list.', img: 'https://www.notion.so/images/blocks/bulleted-list.0e87e917.png'},
            {id: 'nlist', title: 'Numbered List', description: 'Create a list with numbering.', img: 'https://www.notion.so/images/blocks/numbered-list.0406affe.png'}
        ]
        
        var result = query.length ? commands.filter(c => c.title.toLowerCase().indexOf(query.toLowerCase()) > -1) : commands
        done(result)
    },

    getSuggestionsHTML: (suggestions, state) => {
        let el = `<div class="ui-rte-suggestion-item-list ui-rte-atmetion-suggestion-container zdc_shareautocompletedialog suggestion-dropdown-list">`
        suggestions.forEach((suggestion)=>{
            el += `<div class="ui-rte-suggestion-item suggestion-dropdown-list-item">
            <div style="height:30px;width:30px;float:left;margin-right: 10px;margin-left: 10px;margin-top: 10px;" class="">
                <img src="${suggestion.img}" style="border-radius: 10px; height:35px;width:35px;border:1px solid #e0e0e0;" id="contact-img" title=""> 
            </div>
            <div class="" style="float:left;padding:3px;margin-top:5px">
                <div style="" class="">
                <a style="white-space:nowrap;" class="ui-corner-all ui-cmt-atmention-fname" tabindex="-1"><span class="ui-rte-cmnt-atmention-name" id="full-name">${suggestion.title}</span></a>
                </div>
                <div class="">
                <span class="graytxt" id="graytxt">${suggestion.description}</span>
                </div>
            </div>
            </div>`
        })
        el += `</div>`
        return el
    },

    onSelect: (view, item, state) => {
        view.commands.insertText('', state.range.from, state.range.to)
        var commandMap = {
            blockquote: () => { view.commands.insertBlockquote() },
            codeblock: () => { view.commands.insertCodeBlock() },
            h1: () => { view.commands.setHeading('h1') },
            h2: () => { view.commands.setHeading('h2') },
            h3: () => { view.commands.setHeading('h3') },
            blist: () => { view.commands.toggleUL() },
            nlist: () => { view.commands.toggleOL() }
        }

        commandMap[item.id] && commandMap[item.id]()
    },

    activeClass: "suggestion-item-active",
    suggestionTextClass: "slash-command-query-text"
}

function getCustomMenuItems() {
    return [
        // {type: 'button', name: 'Upload Markdown', icon: 'rte-icon-upload', isSVGIcon: true, command: 'upload'},
        {type: 'button', name: 'Download Markdown', icon: 'rte-icon-download', isSVGIcon: true, command: 'download'}
    ]
}

var wyswygOptions = function(json) {
    return {
        placeholder: '',
        formats: ["strong", "em", "link", "headings", 'inlineQuote', 'strikeThrough'],
        features: ["list", 'code_block', 'blockquote', 'hr', 'images', slashCommandFeature, 'emoji'],
        menubar: {position: 'top', overrides: {fontSize: {addMenu: () => {}}, inlineQuote: {addMenu: () => {}}},  customMenuItems: getCustomMenuItems(), menuItemOverrides: {blockquote: {icon: 'zmetbi-quote'}}},
        // defaults: {fontFamily: 'Source Serif Pro', fontSize: '18px', lineHeight: 1.58},
        defaults: {fontFamily: 'medium-content-serif-font,Georgia,Cambria,"Times New Roman",Times,serif', fontSize: '18px', lineHeight: 1.58},
        content: json || '',
        // isHTMLContent: true,
        plugins: [RichTextEditor.PMExports.prosemirrorInputRules.inputRules({rules: getInputRules()})],
        keepFormatsAcrossBlocks: false
    }
}

var onMarkdownModeChange = function(selectEl) {
    if (selectEl.value === 'markdown') {
        var json = zwRteView.getJSON();
        // json.content = toMdSchema(json.content)
        // var mdContent = RichTextEditor.doc2md(json)

        var mdContent = RichTextEditor.doc2md(json)
    
        window.zwRteView && window.zwRteView.remove();
        window.zwRteView = null;

        window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), {
            ...options,
            content: mdContent
        });

        zwRteView.menubar.addMenu({type: 'group', custom: true, id: 'toggle'}) // create new custom group so that it aligns to right side
        var mountPoint = zwRteView.menubar.getMountEl(zwRteView.menubar, 'mode-toggle', 'toggle') // create a mount point inside that group
        // add necessary menu component inside that mount point
        mountPoint.innerHTML = `<select id='menu-mode-toggle' value='markdown' style="padding:3px; border: transparent;" onchange="onMarkdownModeChange(this)"><option value='preview'>RTE Mode</option><option value='markdown' selected>Markdown Mode</option></select>`

        registerCommands(zwRteView)

    } else {
        var mdContent = window.zwRteView && window.zwRteView.editorView.state.doc.toString();
        
        var json = RichTextEditor.md2doc(mdContent)


        window.zwRteView && window.zwRteView.remove();
        window.zwRteView = null;

        setTimeout(function() {
            window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), wyswygOptions(json));

            zwRteView.menubar.addMenu({type: 'group', custom: true, id: 'toggle'}) // create new custom group so that it aligns to right side
            var mountPoint = zwRteView.menubar.getMountEl(zwRteView.menubar, 'mode-toggle', 'toggle') // create a mount point inside that group
            // add necessary menu component inside that mount point
            mountPoint.innerHTML = `<select id='menu-mode-toggle' value='preview' style="padding:3px; border: transparent;" onchange="onMarkdownModeChange(this)"><option value='preview' selected>RTE Mode</option><option value='markdown'>Markdown Mode</option></select>`
        
            registerCommands(zwRteView)
        
        }, 100)
    }
}

// init editor once dom content is ready
document.addEventListener('DOMContentLoaded', function() {
    RichTextEditor.onload.then(function() {

        window.zwRteView = RichTextEditor.init(document.getElementById('rte-wrapper-container'), wyswygOptions(getContent()));

        zwRteView.menubar.addMenu({type: 'group', custom: true, id: 'toggle'}) // create new custom group so that it aligns to right side
        var mountPoint = zwRteView.menubar.getMountEl(zwRteView.menubar, 'mode-toggle', 'toggle') // create a mount point inside that group
        // add necessary menu component inside that mount point
        mountPoint.innerHTML = `<select id='menu-mode-toggle' style="padding:3px; border: transparent;" onchange="onMarkdownModeChange(this)"><option value='preview' selected>RTE Mode</option><option value='markdown'>Markdown Mode</option></select>`
        registerCommands(zwRteView)
    })
})




/**
 * 
 * ------------- HELPERS ------------------------------
 */

function getContent() {
    return {"type":"doc","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"h2"},"content":[{"type":"text","text":"❤️ Elegant markdown editor, "},{"type":"text","marks":[{"type":"em"}],"text":"powered by Writer's RTE!"}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"Start writing documentation & notes using this distraction-free, blazing fast editor. "}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"✔️ Use /slash commands to quickly format or insert elements 😄 "}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"✅ Save your notes as "},{"type":"text","marks":[{"type":"em"}],"text":".md files"},{"type":"text","text":" right inside "},{"type":"text","marks":[{"type":"strong"}],"text":"WorkDrive, "},{"type":"text","text":"leveraging WD features like search, sharing and folder organizations. Or you can download your notes as markdown files. "}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"🔥 You can start drafting here, and later "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://writer.zoho.com"}}],"text":"export your content to Writer"},{"type":"text","text":" to use more powerful features from Writer!"}]},{"type":"hr"},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Simple yet powerful tools to structure your content"}]},{"type":"orderedList","attrs":{"type":"decimal"},"content":[{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"Numbered & bulleted lists"}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"Markdown supported formatting options like "},{"type":"text","marks":[{"type":"strong"}],"text":"bold"},{"type":"text","text":", "},{"type":"text","marks":[{"type":"em"}],"text":"italics"},{"type":"text","text":" and "},{"type":"text","marks":[{"type":"strikeThrough"}],"text":"strikethrough"}]}]},{"type":"listItem","content":[{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"Embed codeblocks with syntax highlighting & an IDE-like experience."}]}]}]},{"type":"code_block","attrs":{"id":"code-block-79796","readOnly":false,"nodeView":null},"content":[{"type":"text","text":"var max = function(num1, num2) {\n  /**\n   * Use code-blocks to quickly write code\n   * with an IDE-like experience.\n   * No more battling with the editor for spaces and indents\n   * Comes with syntax highlighting for a variety of languages including Pali!\n   */\n  return result;\n}\n"}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"Happy Writing! "}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"},"content":[{"type":"text","text":"Made with 💙 | Zoho Writer Team"}]},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"}},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"}},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"}},{"type":"paragraph","attrs":{"align":null,"lineHeight":null,"dir":null,"indent":0,"type":"p"}}]};
}

var registerCommands = function(rteView) {
    rteView.registerCommand({
        download: function() {
            var json = zwRteView.getJSON();
            var mdContent = RichTextEditor.doc2md(json)
            download(mdContent, 'content.md', 'application/json')
        }
    })
}

function download(content, filename, contentType) {
    if(!contentType) { contentType = 'application/octet-stream' }
        var a = document.createElement('a');
        var blob = new Blob([content], {'type':contentType});
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
}

function getInputRules() {
    var boldInputRule = markInputRule(/(?:^|\s|\_)(\*)([^*]+)(\*)$/g, state => state.schema.marks.strong)
    var italicsInputRule = markInputRule(/(?:^|\s|\*)(\_)([^_]+)(\_)$/g, state => state.schema.marks.em)
    var underlineInputRule = markInputRule(/(?:^|\s)(__)([^*]+)(__)$/g, state => state.schema.marks.underline)
    var inlineQuoteInputRule = markInputRule(/(?:^|\s)(\`)([^*]+)(\`)$/g, state => state.schema.marks.inlineQuote)
    var headingsInputRule = getHeadingInputRule(/(?:^)(#+\s)$/g)
    var quoteInputRule = getQuoteInputRule(/(?:^)(!\s)$/g)
    var hrInputRule = getHrInputRule(/(?:^)(\-+\s)$/g)
    var linkInputRule = getLinkInputRule(/(?:^|\s)\[([\w\s\d]+)\]\((https?:\/\/[\w\d./?=#]+)\)$/)
    return [boldInputRule, inlineQuoteInputRule, headingsInputRule, quoteInputRule, hrInputRule, underlineInputRule, italicsInputRule, linkInputRule]
}

function markInputRule(regexp, markType, getAttrs) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
      let type = markType(state)
      let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
      if (!markType) { return; }
      let tr = state.tr
      if (match[1]) {
        var textStart = start + match[0].indexOf(match[1])
        tr.delete(end + 1 - match[3].length, end + 1)
        tr.delete(textStart, textStart + match[1].length)
      }
      return tr.addMark(textStart, textStart + match[2].length, type.create(attrs)).removeStoredMark(type)
    })
}

function getLinkInputRule(regexp) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
      if (!match[1] || !match[2]) { return; }
      let textStart = start
      let textEnd = end
      if(match[0].charAt(0) === ' ') {
        textStart += 1
        textEnd += 1
      }
      let type = state.schema.marks.link
      let attrs = {}
      attrs.href = match[2]
      let tr = state.tr
      tr.delete(textStart, textEnd)
      tr.insertText(match[1])
      return tr.addMark(textStart, textStart + match[1].length, type.create(attrs)).removeStoredMark(type)
    })
}

function getHeadingInputRule(regexp) {
    return new RichTextEditor.PMExports.prosemirrorInputRules.InputRule(regexp, (state, match, start, end) => {
        var paraNode = state.selection.$from.parent;
        if (paraNode.type.name !== 'paragraph') { return; }
        var hashes = paraNode.textContent.trim();
        if (hashes.replaceAll('#', '').length === 0 && hashes.length <= 6) {
            var type = 'h' + hashes.length;
            var tr = state.tr.replaceRangeWith(start, end, state.schema.nodes.paragraph.create({type: type}))
            return tr;
        }
    })
}

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