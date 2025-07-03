/* $Id$ */

/**
 * See https://prosemirror.net/docs/ref/#model.NodeSpec
 */
export const mentionNode = {
    group: 'inline', // no i18n
    inline: true, // no i18n
    atom: true, // no i18n
    isText: true,

    attrs: {
    	name: {default: undefined}, // no i18n
    	zuid: {default: undefined}, // no i18n
        email: '' // no i18n
    },

    selectable: false,
    draggable: false,

    toDOM: node => {
        // encode user data before adding in toDOM
        if (node.attrs.zuid) {
            var zuid = node.attrs.zuid;
            var name = node.attrs.name;
        } else {
            var zuid = '';
            var name = node.attrs.name;
        }

        var email = node.attrs.email;
        var domText = name || email;
        return [
            'a',	// no i18n
            {
                'data-mention-zuid': zuid, // no i18n
                'data-mention-name': name, // no i18n
                'data-mention-email': email, // no i18n
                href: 'mailto:' + email, // no i18n
                title: email, //no i18n
                class: 'ui-rte-prosemirror-mention-node' // no i18n
            },
            '@' + domText
        ]; // no i18n
    },

    parseDOM: [
        {
            // match tag with following CSS Selector
            tag: 'a[data-mention-email]', // no i18n

            getAttrs: dom => {
                var zuid = dom.getAttribute('data-mention-zuid') || null; // no i18n
                var name = dom.getAttribute('data-mention-name'); // no i18n
                var email = dom.getAttribute('data-mention-email'); // no i18n
                return {
                    zuid: zuid,
                    name: name,
                    email: email
                };
            }
        }
    ]
};

/**
 * See https://prosemirror.net/docs/ref/#model.NodeSpec
 */
export const tagNode = {
    group: 'inline', // no i18n
    inline: true,
    atom: true,

    attrs: {
        tag: '' // no i18n
    },

    selectable: false,
    draggable: false,

    toDOM: node => {
        return [
            'span',	// no i18n
            {
                'data-tag': node.attrs.tag, // no i18n
                class: 'ui-rte-prosemirror-tag-node' // no i18n
            },
            '#' + node.attrs.tag
        ]; // no i18n
    },

    parseDOM: [
        {
            // match tag with following CSS Selector
            tag: 'span[data-tag]', // no i18n

            getAttrs: dom => {
                var tag = dom.getAttribute('data-tag'); // no i18n
                return {
                    tag: tag
                };
            }
        }
    ]
};
