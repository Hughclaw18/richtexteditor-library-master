const escapeMarkdown = str => {
	return str.replace(/[!#`[\\\]()*_~&<>]/g, matched => {
		switch (matched) {
			case '&':
				return '&amp;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			default:
				return `\\${matched}`;
		}
	});
};

function isPlainURL(link, parent, index) {
	if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) { return false }
	let content = parent.child(index)
	if (!content.isText || content.text != link.attrs.href || content.marks[content.marks.length - 1] != link) { return false }
	return index == parent.childCount - 1 || !link.isInSet(parent.child(index + 1).marks)
}

class MarkdownSerializerState extends RichTextEditor.PMExports.prosemirrorMarkdown.MarkdownSerializerState {
	// overrided flushClose from to_markdown file in prosemirror-markdown package, because multiple 2 "\n" was included after every block node
	// now it is resolved by commenting the line if (!this.atBlank()) this.out += "\n"
	// not sure how this impacts the list implementation, need to check this once while implementing lists
	flushClose(size = 2) {
		if (this.closed) {
			// if (!this.atBlank()) this.out += "\n"
			if (size > 1) {
				let delimMin = this.delim
				let trim = /\s+$/.exec(delimMin)
				if (trim) {
					delimMin = delimMin.slice(0, delimMin.length - trim[0].length)
				}
				for (let i = 1; i < size; i++) {
					this.out += delimMin + "\n"
				}
			}
			this.closed = null
		}
	}
	renderContent(parent) {
		parent.forEach((child, _offset, index) => {
			if (
				// If child is an empty Textblock we need to insert a zwnj-character in order to preserve that line in markdown
				child.isTextblock && !child.textContent &&
				// If child is a Codeblock we need to handle this separately as we want to preserve empty code blocks
				!(child.type.name === 'code_block') && !(child.content && child.content.size > 0)) {
				return cliqNodes.empty_line(this, child);
			}
			return this.render(child, parent, index);
		});
	}
	text(text, escape = true) {
        let lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
            this.write();
            // // Escape exclamation marks in front of links
            // if (!escape && lines[i][0] == "[" && /(^|[^\\])\!$/.test(this.out))
            //  this.out = this.out.slice(0, this.out.length - 1) + "\\!";
            this.out += escape ? this.esc(lines[i], this.atBlockStart) : lines[i];
            if (i != lines.length - 1) {
                this.out += "\n";
            }
        }
    }
}
class CliqMarkdownSerializer extends RichTextEditor.PMExports.prosemirrorMarkdown.MarkdownSerializer {
	serialize(content, options) {
		const state = new MarkdownSerializerState(this.nodes, this.marks, options || {});
		state.renderContent(content);
		return state.out === '\u200c' ? '' : state.out; // Return empty string if editor only contains a zero-non-width character
	}
}

const cliqNodes = {
	blockquote(state, node) {
		state.wrapBlock('', undefined, node, () => state.renderContent(node));
	},
	code_block(state, node) {
		state.write('```');
		// state.ensureNewLine();
		state.text(node.textContent ? node.textContent : '\u200c', false);
		// state.ensureNewLine();
		state.write('```');
		state.closeBlock(node);
	},

	hr(state, node) {
		state.write(`---`)
		state.closeBlock(node)
	},
	// heading(state, node) {
	//   state.renderInline(node);
	//   state.closeBlock(node);
	// },
	// rule(state, node) {
	//   state.closeBlock(node);
	// },
	bulletList(state, node) {
	  for (let i = 0; i < node.childCount; i++) {
	    const child = node.child(i);
	    state.render(child, node, i);
	  }
	},
	orderedList(state, node) {
	  for (let i = 0; i < node.childCount; i++) {
	    const child = node.child(i);
	    state.render(child, node, i);
	  }
	},
	listItem(state, node, parent, index) {
	  const delimiter = parent.type.name === 'bulletList' ? '- ' : `${index + 1}. `;
	  for (let i = 0; i < node.childCount; i++) {
	    const child = node.child(i);
	    if (i > 0) {
	      state.write('\n');
	    }
	    if (i === 0) {
	      state.wrapBlock('  ', delimiter, node, () => state.render(child, parent, i));
	    } else {
	      state.wrapBlock('    ', undefined, node, () => state.render(child, parent, i));
	    }
	    if (child.type.name === 'paragraph' && i > 0) {
	      state.write('\n');
	    }
	    state.flushClose(1);
	  }
	//   if (index === parent.childCount - 1) {
	    state.write('\n');
	//   }
	},
	// caption(state, node) {
	//   state.renderInline(node);
	//   state.closeBlock(node);
	// },
	paragraph(state, node, parent) {
		if(parent.type.name === 'blockquote') {
			state.write('!');
		}
		if (node.attrs.type && node.attrs.type.startsWith('h')) {
			// heading
			var level = parseInt(node.attrs.type.split('h')[1])
			state.write(state.repeat("#", level) + " ")
			state.renderInline(node);
			state.closeBlock(node);
		} else {
			state.renderInline(node);
			state.closeBlock(node);
		}

	},
	br(state) {
		state.write('\n');
	},
	text(state, node) {
		const lines = node.textContent.split('\n');
		for (let i = 0; i < lines.length; i++) {
			state.write();
			state.out += escapeMarkdown(lines[i]);
			if (i !== lines.length - 1) {
				state.out += '\n';
			}
		}
	},
	empty_line(state, node) {
		state.write('\u200c'); // zero-width-non-joiner
		state.closeBlock(node);
	},
	mention(state, node, parent, index) {
		const isLastNode = parent.childCount === index + 1;
		let delimiter = '';
		if (!isLastNode) {
			const nextNode = parent.child(index + 1);
			const nextNodeHasLeadingSpace = nextNode.textContent.indexOf(' ') === 0;
			delimiter = nextNodeHasLeadingSpace ? '' : ' ';
		}
		state.write(`{@${node.attrs.zuid}}${delimiter}`);
	},
	cliqMention(state, node, parent, index) {
		const isLastNode = parent.childCount === index + 1;
		let delimiter = '';
		if (!isLastNode) {
			const nextNode = parent.child(index + 1);
			const nextNodeHasLeadingSpace = nextNode.textContent.indexOf(' ') === 0;
			delimiter = nextNodeHasLeadingSpace ? '' : ' ';
		}
		state.write(`{${node.attrs.nodetype}${node.attrs.uid}}${delimiter}`);
	},
	smileyNode(state, node) {
		state.write(node.attrs.code);
	},
	memberNode(state, node, parent, index) {
		const isLastNode = parent.childCount === index + 1;
		let delimiter = '';
		if (!isLastNode) {
			const nextNode = parent.child(index + 1);
			const nextNodeHasLeadingSpace = nextNode.textContent.indexOf(' ') === 0;
			delimiter = nextNodeHasLeadingSpace ? '' : ' ';
		}
		state.write(`{${node.attrs.action}:${node.attrs.uid}:${node.attrs.type}:${node.attrs.title}:${node.attrs.action}}${delimiter}`);
	},
	customEmojiNode(state, node) {
		state.write(node.attrs.code);
	},
	zomojiNode(state, node) {
		state.write(node.attrs.code);
	}
	// mediaGroup(state, node) {
	//   for (let i = 0; i < node.childCount; i++) {
	//     const child = node.child(i);
	//     state.render(child, node, i);
	//   }
	// },
	// mediaSingle(state, node) {
	//   for (let i = 0; i < node.childCount; i++) {
	//     const child = node.child(i);
	//     state.render(child, node, i);
	//     state.write('\n');
	//   }
	// },
	// /**
	//  * Slack markdown does not have specific syntax for images/files.
	//  * We just show that there's an image attached as a link and a media just as a text.
	//  */
	// media(state) {
	//   state.write('[media attached]');
	//   state.write('\n');
	// },
	// image(state, node) {
	//   state.write(`[<${node.attrs.src}|image attached>]`);
	// }
};

const cliqMarks = {
	em: {
		open: '_',
		close: '_',
		mixable: true,
		expelEnclosingWhitespace: true
	},
	strong: {
		open: '*',
		close: '*',
		mixable: true,
		expelEnclosingWhitespace: true
	},
	underline: {
		open: '__',
		close: '__',
		mixable: true,
		expelEnclosingWhitespace: true
	},
	strikeThrough: {
		open: '~',
		close: '~',
		mixable: true,
		expelEnclosingWhitespace: true
	},
	link: {
		open(state, mark, parent, index) {
		  state.inAutolink = isPlainURL(mark, parent, index)
		  return state.inAutolink ? "<" : "["
		},
		close(state, mark, parent, index) {
		  let {inAutolink} = state
		  state.inAutolink = undefined
		  return inAutolink ? ">"
			: "](" + mark.attrs.href + ")"
		},
		mixable: true
	},
	inlineQuote: {
		open: '`',
		close: '`',
		mixable: true,
		expelEnclosingWhitespace: true
	},
	escapedCharacter: {
		open: ``,
		close: "",
		mixable: true,
		expelEnclosingWhitespace: true
	}
	// code: {
	//   open: '`',
	//   close: '`',
	//   escape: false
	// }
};