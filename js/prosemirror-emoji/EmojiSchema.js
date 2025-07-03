const emoji = {
    inline: true,
    attrs: {
        emojiName: '' //no i18n
    },
    group: 'inline', // no i18n
    atom : true,
    selectable: true,
    toDOM: function(node) {
        var name = node.attrs.emojiName;
        var className = "zw-zomoji zomoji-w-24-"+name;  // no i18n
        return [
            'span',  // no i18n
            {
                'emoji-name': name,  // no i18n
                'class': className //no i18n
            }
        ];
    }, 
    parseDOM: [
        {
            tag: 'span[class][emoji-name]',   // no i18n
            getAttrs: function(dom) {
                var name = dom.getAttribute('emoji-name');  // no i18n
                return {
                    emojiName: name
                };
            }
        }
    ]
}

export function addEmojiNode(nodes) {
    return nodes.append({ emoji: emoji });
}