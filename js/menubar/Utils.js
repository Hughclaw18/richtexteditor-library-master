export var defaultOrdering = [
    {
        id: 'group-1', // put hyphen separated words because this string will exactly be used as id in menubar dom elements, so don't use space separated words
        order: ["strong", "em", "underline", "strikeThrough"]
    },
    {
        id: 'group-2',
        order: ["fontFamily", "fontSize"]
    },
    {
        id: 'group-3',
        order: ["fontColor", "highlight"]
    },
    {
        id: 'group-4',
        order: ["align", "direction", "lineHeight"]
    },
    {
        id: 'group-5',
        order: ['list', 'checkList', 'indent']
    },
    {
        id: 'group-6',
        order: ['images', 'tables']
    },
    {
        id: 'group-7',
        order: ['link', 'video', 'embed']
    },
    {
        id: 'group-8',
        order: ['inlineQuote', 'blockquote', "headings"]
    },
    {
        id: 'group-9',
        order: ["script", 'hr']
    },
    {
        id: 'group-10',
        order: ['html', 'code_block']
    },
    {
        id: 'group-11',
        order: ['formatPainter', "clearFormatting", "pasteFormat"]
    }
]

export function createEmptyGroup(groupId, rteView) {
    rteView.menubar.addMenu({
        type: 'group',
        id: groupId
    })
}

export function createRightEmptyGroup(groupId, rteView) {
    rteView.menubar.addMenu({
        type: 'group',
        id: groupId,
        custom: true
    })
}