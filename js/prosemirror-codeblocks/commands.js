import { Fragment } from "prosemirror-model"
import { setBlockType } from "prosemirror-commands"
import { TextSelection } from "prosemirror-state"

function checkIsLastNode($from) {
    let grandParentNode;
    if($from.depth === 0) {
        // all selection is done, so no need to check last node
        return false
    } else if($from.depth === 1) {
        // doc node is the grandparent node
        grandParentNode = $from.node(0)
    } else {
        grandParentNode = $from.node(-1)
    }

    let depth = $from.depth
    let totalChildCount = grandParentNode.childCount
    let currentChildNumber = $from.path[(depth * 3) - 2]

    if(totalChildCount - 1 === currentChildNumber) {
        // doing -1 in totalChildCount because childCount is 1 based index
        // and currentChildNumber is 0 based index
        return true
    } else {
        return false
    }
}

export function deleteCodeBlock(editorView) {
    let $pos = editorView.state.selection.$anchor;
    for (let d = $pos.depth; d > 0; d--) {
      let node = $pos.node(d);
      if (node.type.name === 'code_block') {
        editorView.dispatch(
            editorView.state.tr.replaceWith($pos.before(d), $pos.after(d)).scrollIntoView(),
        );
        return true;
      }
    }
    return false;
}

export function insertCodeBlock(editorView, opts) {
    var selection = editorView.state.selection
    if (selection.$from.pos != selection.$to.pos) {
        var paragraphRuns = [];
        selection.ranges.forEach(function(range) {
            // select all continuous paragraph nodes that span within the selection
            // get text content of all those nodes
            // and replace with codeBlock, with the text content
            var paras = [];
            var previousPara = null;
            var ranges = selection.ranges;
                                
            editorView.state.doc.nodesBetween(range.$from.pos, range.$to.pos, function(node, pos) {
                if (node.type.name === 'paragraph') {
                    if (previousPara && pos === previousPara.pos + previousPara.node.nodeSize) {
                        // is the immediate next para of previous para, add it to the current run
                        paras.push({node: node, pos: pos})
                    } else {
                        // it's a new run. backup current run and start a new run and append to it.
                        if (paras.length) { paragraphRuns.push(paras) }
                        paras = []
                        paras.push({node: node, pos: pos})
                    }
                    previousPara = {node: node, pos: pos}
                }
            })
            
            // backup paras if any left over from the last batch
            if (paras.length) { paragraphRuns.push(paras) }

        })

        var tr = editorView.state.tr
        paragraphRuns.forEach(function(paras) {
            // for every para run, check if the first para's parent allows a code_block as child.
            // if yes, take textContent of all these para nodes, 
            // make them into a text node and replace all these para nodes with a single codeblock
            
            var firstPara = paras[0];
            if (!firstPara) { return } // do nothing, no para is within selected range
            
            // check if this para's parent can support code_block nodes as child
            var $pos = editorView.state.doc.resolve(firstPara.pos)
            if ($pos.parent.type.contentMatch.findWrapping(editorView.state.schema.nodes.code_block)) {
                // continue replacing the para run with code-block
                var lastPara = paras[paras.length - 1]
                var endIndex = lastPara.pos + lastPara.node.nodeSize

                var paraText = editorView.state.doc.textBetween($pos.pos, endIndex, '\n', '')
                if (!paraText) { paraText = ' ' } // if empty para, insert codeblock with empty content
                var codeBlockContent = editorView.state.schema.text(paraText)
                
                var attrsForCodeBlock = {
                    id: 'code-block-' + Math.floor(Math.random()*100000)
                }
                var attrsForPara = {}

                if(opts) {
                    if(opts.extraAttrs) {
                        attrsForCodeBlock.extraAttrs = opts.extraAttrs
                    }

                    if(opts.extraAttrsForParagraph) {
                        attrsForPara = opts.extraAttrsForParagraph
                    }
                }

                var codeBlockNode = editorView.state.schema.nodes.code_block.create(attrsForCodeBlock, codeBlockContent)
                var emptyPara = editorView.state.schema.nodes.paragraph.create(attrsForPara)
                var resolvedPos = tr.doc.resolve(tr.mapping.map(endIndex - 1)) // do endIndex - 1, because endIndex directly points to position after codeblock
                // so trying to get resolvedPos, gives the position after codeblock, where resolvedPos.path consists of only doc node
                // whereas endIndex - 1 points to position before the end of codeblock, so resolvedPos.path consists of doc node as well as codeblock node
                var isLastChild = checkIsLastNode(resolvedPos)

                if(isLastChild) {
                    tr = tr.replaceWith(tr.mapping.map($pos.pos), tr.mapping.map(endIndex), Fragment.fromArray([codeBlockNode, emptyPara]))
                } else {
                    tr = tr.replaceWith(tr.mapping.map($pos.pos), tr.mapping.map(endIndex), Fragment.fromArray([codeBlockNode]))
                }
                tr = tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(endIndex - 1)), -1))
            } else {
                // parent doesn't support code-block insertion. do nothing
                return
            }
        })
        editorView.dispatch(tr)

    } else {
        // store oldFrom to set the selection back to the same position after inserting code block
        let oldFrom = editorView.state.tr.selection.$from.pos;
        let isLastChild = checkIsLastNode(editorView.state.tr.selection.$from)

        var attrs = {
            id: 'code-block-' + Math.floor(Math.random()*100000)
        }
        if(opts && opts.extraAttrs) {
            attrs.extraAttrs = opts.extraAttrs
        }

        var insertCodeBlock = setBlockType(editorView.state.schema.nodes.code_block, attrs)
        insertCodeBlock(editorView.state, editorView.dispatch)

        // if there is no empty para, and if codeblock node is the last node in the editor, then there is no way to come out of codeblock using a click
        // the only way to come out is by using down arrow, but most users wouldn't know it

        // so, insert empty para after codeblock node so that when users click outside the codeblock (with the intention of coming out of codeblock)
        // selection would be moved to the empty para

        if(isLastChild) {
            let paraNode = editorView.state.schema.nodes.paragraph.create();
            // calculate newDepth because insertCodeBlock(editorView.state, editorView.dispatch) command would insert a codeblock which would change all
            // the selection positions
            let newDepth = editorView.state.selection.$from.depth
            let posAfterCodeBlock = editorView.state.selection.$from.after(newDepth)

            let tr = editorView.state.tr.insert(posAfterCodeBlock, paraNode);
            tr = tr.setSelection(TextSelection.near(tr.doc.resolve(oldFrom)))
            editorView.dispatch(tr)
        }
    }

    editorView.focus();
}

export function moveContentOutOfCodeBlock(view) {
    let state = view.state;
    let { $from } = state.selection;

    let node = $from.node();
    if (node.type.name === 'code_block') {
        let codeBlockPos = $from.before();
        let codeBlockEnd = $from.after();

        // Get the text content of the code_block
        let codeBlockText = node.textContent;

        // Split the text content by "\n"
        let lines = codeBlockText.split("\n");

        // Create paragraph nodes for each line
        let paragraphNodes = lines.map(line => {
            let textNode = null;
            if(line) {
                textNode = state.schema.text(line);
            }
            return state.schema.nodes.paragraph.create({}, textNode);
        });

        // Replace the code_block with the paragraph nodes
        let tr = state.tr.replaceWith(
            codeBlockPos,
            codeBlockEnd,
            Fragment.fromArray(paragraphNodes)
        );

        // Dispatch the transaction
        view.dispatch(tr);
        view.focus();
    }
}

export function toggleCodeBlock(view, opts) {
    let state = view.state
    let { $from } = state.selection
    let codeblockNodetype = state.schema.nodes.code_block

    // Check if the selection is already wrapped in a code_block
    if ($from.node() && $from.node().type === codeblockNodetype) {
        moveContentOutOfCodeBlock(view)
    } else {
        insertCodeBlock(view, opts)
    }
}