/* $Id$ */

import { Plugin } from 'prosemirror-state'; // no i18n
import { Decoration, DecorationSet } from 'prosemirror-view'; // no i18n
import { debounce } from '../RTEPluginUtils'; //no i18n

const nonTextLeafNodeReplacer = '\0';
const showListDebounce = debounce();
const externalScrollDebounce = debounce();
/**
 *
 * @param {String} mentionTrigger
 * @param {String} hashtagTrigger
 * @param {bool} allowSpace
 * @returns {Object}
 */
export function getRegexp(mentionTrigger, hashtagTrigger, allowSpace) {
    var mention = allowSpace
        ? new RegExp('(^|\\s|\\0)' + mentionTrigger + '([\\p{L}\\p{M}\\p{N}\\-\\+\@]+[.]?\\s?[\\p{L}\\p{M}\\p{N}\\-\\+]*)$', "u")
        : new RegExp('(^|\\s|\\0)' + mentionTrigger + '([\\p{L}\\p{M}\\p{N}\\-\\+\@]+)$', 'u'); // no i18n

    // hashtags should never allow spaces. I mean, what's the point of allowing spaces in hashtags?
    var tag = new RegExp('(^|\\s)' + hashtagTrigger + '([\\p{L}\\p{M}\\p{N}\\-]+)$', "u"); // no i18n

    return {
        mention: mention,
        tag: tag
    };
}

/**
 *
 * @param {ResolvedPosition} $position https://prosemirror.net/docs/ref/#model.Resolved_Positions
 * @param {JSONObject} opts
 * @returns {JSONObject}
 */
export function getMatch($position, opts) {
    // take current para text content upto cursor start.
    // this makes the regex simpler and parsing the matches easier.
    var parastart = $position.before();
    const text = $position.doc.textBetween(
        parastart,
        $position.pos,
        '\n', // no i18n
        nonTextLeafNodeReplacer
    );

    var regex = getRegexp(
        opts.mentionTrigger,
        opts.hashtagTrigger,
        opts.allowSpace
    );

    // only one of the below matches will be true.
    var mentionMatch = text.match(regex.mention);
    var tagMatch = opts.hashtagTrigger && text.match(regex.tag);

    var match = mentionMatch || tagMatch;

    // set type of match
    var type;
    if (mentionMatch) {
        type = 'mention'; // no i18n
    } else if (tagMatch) {
        type = 'tag'; // no i18n
    }

    // if match found, return match with useful information.
    if (match) {
        // adjust match.index to remove the matched extra space
    	if(match[0].startsWith(' ') || match[0].startsWith(nonTextLeafNodeReplacer)) {
    		match.index = match.index + 1;
    		match[0] = match[0].substring(1, match[0].length);
    	} else {
    		match.index = match.index;
    	}
    	
        // The absolute position of the match in the document
        var from = $position.start() + match.index;
        var to = from + match[0].length;

        var queryText = match[2];

        return {
            range: { from: from, to: to },
            queryText: queryText,
            type: type
        };
    }
    // else if no match don't return anything.
}

var getNewState = function() {
    return {
        active: false,
        range: {
            from: 0,
            to: 0
        },
        type: '', //mention or tag
        text: '',
        suggestions: [],
        isDropdownVisible: false,
        index: 0 // current active suggestion index
    };
};

/**
 * @param {JSONObject} opts
 * @returns {Plugin}
 */
export function getMentionsPlugin(opts, richTextView) {
    // default options
    var defaultOpts = {
        mentionTrigger: '@', // no i18n
        hashtagTrigger: '#', // no i18n
        allowSpace: true,
        getSuggestions: (type, text, cb) => {
            cb([]);
        },
        getSuggestionsHTML: () => {},
        activeClass: 'suggestion-item-active', // no i18n
        suggestionTextClass: 'ui-rte-prosemirror-suggestion', // no i18n
        maxNoOfSuggestions: 6,
        delay: 200,
        extras: {}
    };

    var opts = Object.assign({}, defaultOpts, opts);

    // timeoutId for clearing debounced calls
    var showListTimeoutId = null;
    // dropdown element
    var el = document.createElement('div'); // no i18n
    el.className = 'rte-mentions-drop-down-parent-div'
    // current Idx
    el.style.zIndex = 1;

    // ----- methods operating on above properties -----

    var showList = function(view, state, suggestions, opts, plugin) {
        if (!suggestions.length) {
            return hideList(plugin);
        }
        el.innerHTML = opts.getSuggestionsHTML(suggestions, state.type);

        // attach new item event handlers
        el.querySelectorAll('.ui-rte-suggestion-item').forEach(function( // no i18n
            itemNode,
            index
        ) {
            itemNode.addEventListener('click', function() {
                // no i18n
                select(view, state, opts);
                view.focus();
            });
            // TODO: setIndex() needlessly queries.
            // We already have the itemNode. SHOULD OPTIMIZE.
            itemNode.addEventListener('mouseover', function() {
                // no i18n
                setIndex(index, state, opts);
            });
            itemNode.addEventListener('mouseout', function() {
                // no i18n
                setIndex(index, state, opts);
            });
        });

        // highlight first element by default - like Facebook.
        addClassAtIndex(state.index, opts.activeClass);

        // get current @mention span left and top.
        // TODO: knock off domAtPos usage. It's not documented and is not officially a public API.
        // It's used currently, only to optimize the the query for textDOM
        var node = view.domAtPos(view.state.selection.$from.pos);
        var paraDOM = node.node;
        var textDOM = paraDOM.querySelector('.' + opts.suggestionTextClass); // no i18n

        // TODO: since showList is debounced, textDOM may not exist at this point.
        // in which case, just hide the list.
        if (!textDOM) {
            return hideList(plugin);
        }

        state.isDropdownVisible = true

        adjust4viewport(el, textDOM);
    };

    var adjust4viewport = function(el, textDOM) {
        // TODO: should add null check case for textDOM
        var offset = textDOM && textDOM.getBoundingClientRect();

        // TODO: think about outsourcing this positioning logic as options
        richTextView.dom.append(el);

        el.style.display = 'block'; // no i18n
        el.style.position = 'fixed'; // no i18n
        el.style.left = '';
        el.style.right = '';
        var elWidth = el.offsetWidth;
        var docWidth = document.documentElement.clientWidth;
        var docHeight = document.documentElement.clientHeight;

        // adjust left/right
        if (offset.left + elWidth + 1 < docWidth) {
            el.style.left = offset.left + 'px'; // no i18n
        } else {
            el.style.right = docWidth - offset.right + 'px'; // no i18n
        }

        // adjust top/bottom
        if (textDOM.offsetHeight + offset.top + el.scrollHeight < docHeight) {
            var top = textDOM.offsetHeight + offset.top;
        } else {
            var top = offset.top - el.scrollHeight;
        }
        el.style.top = top + 'px'; // no i18n
    };

    var hideList = function(plugin) {
        var editorState = richTextView.editorView.state
        var pluginState = plugin.getState(editorState)
        el.style.display = 'none'; // no i18n
        pluginState.isDropdownVisible = false
    };

    var removeClassAtIndex = function(index, className) {
        var itemList = el.querySelector('.ui-rte-suggestion-item-list').children; // no i18n
        var prevItem = itemList[index];
        prevItem.classList.remove(className);
    };

    var addClassAtIndex = function(index, className) {
        var itemList = el.querySelector('.ui-rte-suggestion-item-list').children; // no i18n
        if (itemList.length) {
            var prevItem = itemList[index];
            prevItem.classList.add(className);
            return true;
        } else {
            return false;
        }
    };

    var setIndex = function(index, state, opts) {
        removeClassAtIndex(state.index, opts.activeClass);
        state.index = index;
        addClassAtIndex(state.index, opts.activeClass);
    };

    var goNext = function(view, state, opts) {
        removeClassAtIndex(state.index, opts.activeClass);
        state.index++;
        state.index =
            state.index === state.suggestions.length ? 0 : state.index;
        addClassAtIndex(state.index, opts.activeClass);
    };

    var goPrev = function(view, state, opts) {
        removeClassAtIndex(state.index, opts.activeClass);
        state.index--;
        state.index =
            state.index === -1 ? state.suggestions.length - 1 : state.index;
        addClassAtIndex(state.index, opts.activeClass);
    };

    var select = function(view, state, opts) {
        var item = state.suggestions[state.index];
        var attrs;
        if (state.type === 'mention') {
            // no i18n
            attrs = {
                name: item.fullname,
                zuid: item.zuid,
                email: item.emailid
            };
        } else {
            attrs = {
                tag: item.tag
            };
        }
        var node = view.state.schema.nodes[state.type].create(attrs);
        var tr = view.state.tr.replaceWith(
            state.range.from,
            state.range.to,
            node
        );

        /**
         * Commented the below 2 lines because dispatchTransaction isn't getting called when state.apply() and view.updateState() is called.
         */
        // var newState = view.state.apply(tr);
        // view.updateState(newState);
        view.dispatch(tr)
    };

    /**
     * See https://prosemirror.net/docs/ref/#state.Plugin_System
     * for the plugin properties spec.
     */
    return new Plugin({
        key: richTextView.pluginKeys.mentions, // no i18n

        // we will need state to track if suggestion dropdown is currently active or not
        state: {
            init() {
                return getNewState();
            },

            apply(tr, state) {
                // compute state.active for current transaction and return
                var newState = getNewState();
                var selection = tr.selection;
                if (selection.from !== selection.to) {
                    return newState;
                }

                const $position = selection.$from;
                let match
                if($position.depth!=0) { //inorder to avoid gapcursor related problems when table is in first line
                    match = getMatch($position, opts);
                }
                // if match found update state
                if (match) {
                    newState.active = true;
                    newState.range = match.range;
                    newState.type = match.type;
                    newState.text = match.queryText;
                }

                return newState;
            }
        },

        // We'll need props to hi-jack keydown/keyup & enter events when suggestion dropdown
        // is active.
        props: {
            handleKeyDown(view, e) {
                var state = this.getState(view.state);

                // don't handle if no suggestions or not in active mode
                if (!state.active || !state.suggestions.length || !state.isDropdownVisible) {
                    return false;
                }

                // if any of the below keys, override with custom handlers.
                var down, up, enter, esc;
                enter = e.keyCode === 13;
                down = e.keyCode === 40;
                up = e.keyCode === 38;
                esc = e.keyCode === 27;

                if (down) {
                    goNext(view, state, opts);
                    return true;
                } else if (up) {
                    goPrev(view, state, opts);
                    return true;
                } else if (enter) {
                    select(view, state, opts);
                    return true;
                } else if (esc) {
                    clearTimeout(showListTimeoutId);
                    hideList(this);
                    this.state = getNewState();
                    return true;
                } else {
                    // didn't handle. handover to prosemirror for handling.
                    return false;
                }
            },
            //handles dom events
            handleDOMEvents: {
                blur: function(view, e) {
                    var state = this.getState(view.state);
                    var self = this
                    if (state && state.suggestions.length) {
                        // hide suggestions list if view is not focused
                        // hide after a timeout so that when a suggestion gets selected and @mention node is inserted
                        // otherwise it will hide the list immediately before node gets inserted
                        setTimeout(function() {
                            hideList(self);
                        }, 500);
                        return false;
                    }
                },

                focus: function(view, e) {
                    var state = this.getState(view.state);
                    var self = this
                    if (state && state.suggestions.length) {
                        opts.getSuggestions(
                            state.type,
                            state.text,
                            function(suggestions) {
                                // update `state` argument with suggestions
                                state.suggestions = suggestions;
                                showList(view, state, suggestions, opts, self);
                            },
                            opts.extras,
                            richTextView
                        );
                    }
                }
            },
            // to decorate the currently active @mention text in ui
            decorations(editorState) {
                const { active, range } = this.getState(editorState);

                if (!active) {
                    return null;
                }
                return DecorationSet.create(editorState.doc, [
                    Decoration.inline(range.from, range.to, {
                        nodeName: 'a', // no i18n
                        class: opts.suggestionTextClass
                    })
                ]);
            }, 

            handleExternalScroll : function () {
                externalScrollDebounce(hideList.bind(null, this),200)
            },

            api: {
                isDropdownVisible: function() {
                    var editorState = richTextView.editorView.state
                    var pluginState = this.getState(editorState)
                    return pluginState.isDropdownVisible
                }
            },

            //remove the element from dom once rteView.remove() is called
            destroy() {
                el.remove()
            }
        },

        // To track down state mutations and add dropdown reactions
        view() {
            return {
                update: view => {
                    var state = this.key.getState(view.state);
                    var self = this
                    if (!state.text) {
                        // no search query
                        hideList(this.key);
                        clearTimeout(showListTimeoutId);
                        return;
                    }
                    // debounce the call to avoid multiple requests
                    showListTimeoutId = showListDebounce(
                        function() {
                            // get suggestions and set new state
                            opts.getSuggestions(
                                state.type,
                                state.text,
                                function(suggestions) {
                                    // update `state` argument with suggestions
                                    state.suggestions = suggestions.slice(
                                        0,
                                        opts.maxNoOfSuggestions
                                    );
                                    showList(
                                        view,
                                        state,
                                        state.suggestions,
                                        opts,
                                        self.key
                                    );
                                },
                                opts.extras,
                                richTextView
                            );
                        },
                        opts.delay,
                        this
                    );
                }
            };
        }
    });
}
