import { resetLinkBehaviour } from "./RichTextEditorView"

export function getWordBeforeCurPos(trArr, oldState, newState) {
    // Method specific to append Transaction
    // arr of transaction passed and the trs are checked whether
        // 1. docChange occured
        // 2. is paste flow so that we can ignore it
    var docChanged = false;
    var isPasteFlow = false;
    trArr.forEach(function(tr){
        docChanged = docChanged || tr.docChanged;
        isPasteFlow = isPasteFlow ? isPasteFlow : tr.meta.paste;
    });

    var pos = newState.selection.ranges[0].$from.pos;
    // find the current cursor position 
    // continue further if 1. doc is changed 3. is not paste flow
    // why pos > 1, Inorder to get atleast a space/newline element, the pos will be greater than 1 (will be reducing 1 from pos to get nodeEnd).
    if (!docChanged || pos <= 1 || isPasteFlow) {
        return;
    }
    //depth - level from which position calculations are made by default (level of immediate parent).
    var resolvedPos = newState.doc.resolve(pos);
    var depth = resolvedPos.depth;
    //offset of current position from the start of immediate parent.
    var parentOffset = resolvedPos.parentOffset;
    // if offset is zero then the cursor is at the start of para, which means new para made. 
    // so we have to take the text from prev para inorder to check for link
    // nodeEndPoint => the pos upto which text has to be taken for checking
    //              => case 1 : space/hardbreak -> this occupies 1 char so we have to reduce 1
    //              => case 2 : newpara -> this occupies 2 char so reduce 2
    var nodeEndPoint;
    if (parentOffset) {
        nodeEndPoint = pos - 1;
    } else {
        resolvedPos = newState.doc.resolve(pos-2);
        nodeEndPoint = pos - 2;
    }
    var posOfParentNode = resolvedPos.start(depth);
    // find the text between parentNode start and nodeEnd we have
    var textContent = newState.doc.textBetween(posOfParentNode, pos, "`", "`");
    
    // if the content before cursor end with " |`" means we need to check last word for conversion
    if (!(textContent.endsWith(' ') || textContent.endsWith('`'))) {
        return;
    }
    // slice the string added at the end replacing enter/space
    textContent = textContent.slice(0, textContent.length - 1);
    var words = textContent.split(/[\s`]/);
    // check for the last work as it would be the one which needs conversion
    var wordToConvert = words.pop();
    return wordToConvert && {
        word: wordToConvert,
        end: nodeEndPoint,
        start: nodeEndPoint-wordToConvert.length
    };
};

export const debounce = function() {
    var timeoutId = null;
    return function(func, timeout, context) {
        timeout = timeout || 100;
        context = context || this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() {
            func.apply(context, arguments);
        }, timeout);

        return timeoutId;
    };
};

export function getNearestNonEmptyPara(trArr, oldState, newState) {
    // Method specific to append Transaction
    // arr of transaction passed and the trs are checked whether
        // 1. docChange occured
        // 2. is paste flow so that we can ignore it
        var docChanged = false;
        var isPasteFlow = false;
        trArr.forEach(function(tr){
            docChanged = docChanged || tr.docChanged;
            isPasteFlow = isPasteFlow ? isPasteFlow : tr.meta.paste;
        });
    
        var pos = newState.selection.ranges[0].$from.pos;
        // find the current cursor position 
        // continue further if 1. doc is changed 3. is not paste flow
        // why pos > 1, Inorder to get atleast a space/newline element, the pos will be greater than 1 (will be reducing 1 from pos to get nodeEnd).
        // if depth === 0 , then the cursor is at doc node, which means that there is no content and the dpeth can't go below 0 for any case.
        if (!docChanged || pos <= 1 || isPasteFlow || newState.selection.$from.depth <= 0) {
            return;
        }
        
        var resolvedPos = newState.doc.resolve(pos);
        var depth = resolvedPos.depth;

        var startPosOfParaNode = resolvedPos.start(depth);
        var endPosOfParaNode = resolvedPos.end(depth)
        // find the text between parentNode start and end we have
        var textContent = newState.doc.textBetween(startPosOfParaNode, endPosOfParaNode, "\n", " ");
        var paraNode = newState.doc.nodeAt(resolvedPos.before())

        return {
            para: paraNode,
            text: textContent,
            start: startPosOfParaNode,
            end: endPosOfParaNode
        }
}

export function preProcessRegex(regexReplacerArray) {
    return regexReplacerArray.map((obj) => {
        if(!obj.regex.global) {
            obj.regex = new RegExp(obj.regex, obj.regex.flags + 'g')
        }
        return obj
    })
}

function filterMarksAndDispatch(node, tr, state) {
    let marksInPreviousNode = node.marks
    if (marksInPreviousNode) {
        let marksToStore = marksInPreviousNode.filter((mark) => {
            return mark.type.spec.inclusive !== false // if nodes are defined with inclusive as false, then those marks should not be carry forwarded. See prosemirror docs for more info.
        })
        let tr1 = tr.setStoredMarks(marksToStore);
        // since transactions passed in appendTransaction will not pass through dispatchTransaction, we need to do the work done in dispatchTransaction
        // here, in dispatchTransaction resetLinkBehaviour is called and then onEditorStateUpdate is called,
        // here there is no need to call onEditorStateUpdate, only resetLinkBehaviour is enough
        if( state.schema.marks.link ) {
            tr1 = resetLinkBehaviour(state, tr1)
        }
        return tr1
    }
}

export function addToStoredMarks(state) {

    /**
     * Logic of the globalStoredMarks is as follows:
     * 
     * Exception case:
     * 1. If the current position is at a starting of a paragraph and if there is content in the paragraph then alone we need to iterate in forward direction till we get a node that is a text node.
     * 2. Then add the marks present in this node to storedMarks.
     * 
     * Normal Case:
     * 1. Find the cursor position.
     * 2. We need to find the marks present in the textnode that is present previous to the cursor. So we  need to start from the position that is equal to cursor_position-1..... This is because if we start from cursor_position itself we would get null as the return value if we call current_node.marks().
     * 3. Then we need to iterate backwards till we get a node which is a text node.
     * 4. Once we get a text node we need to get the marks present in that text node and we need to add these to storedMarks.
     * 
     */

    let tr = state.tr

    let pos = state.selection.$from.pos-1;
    let node;

    if( pos > 0 && state.selection.$from.depth > 0 && pos === state.selection.$from.before() ) {
        
        while( pos < state.selection.$from.after() ) {
            node = state.doc.nodeAt(pos);
            if (node && node.type && node.type.name === "text") {
                return filterMarksAndDispatch(node, tr, state)
            } else {
                pos += 1;
            }
        }
    }

    var previousPTag = false
    while( pos > -1 ) {
        node = state.doc.nodeAt(pos);
        if( !previousPTag && node && node.type && node.type.name === "paragraph" ) {
            //used to check whether the cursor has entered into the previous p tag
            previousPTag = true
        }
        if( node && node.type && node.type.name === "text" ) {
            if( previousPTag ) {
                let paraNode = state.doc.resolve(pos).parent
                if( paraNode.attrs.type !== "p" ) {
                    // if attrs.type has some value such as h1 or h2 or h3, etc don't carry forward the marks
                    return
                }
            }
            return filterMarksAndDispatch(node, tr, state)
        } else {
            pos-=1;
        }    
    }

    // if none of the conditions above is satisfied then set storedMarks to empty array
    return tr.setStoredMarks([])
    
}