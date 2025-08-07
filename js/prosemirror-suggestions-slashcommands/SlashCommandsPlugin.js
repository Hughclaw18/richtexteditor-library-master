import { Plugin,PluginKey } from 'prosemirror-state'; // no i18n
import { getSlashFormattingSuggestions } from './utils';
import { Decoration,DecorationSet } from 'prosemirror-view'; //no i18n
import { debounce } from '../RTEPluginUtils'; //no i18n

import { openMediaPopoverCommand } from './utils.js';

const nonTextLeafNodeReplacer = '\0';
const showListDebounce = debounce();
const externalScrollDebounce = debounce();

var ignoreMouseEvents = false // to not call the setIndex function  by mouseout or mouseover handler if the goNext or goPrev functions where called before it.
/**
 *
 * @param {String} mentionTrigger
 * @param {String} hashtagTrigger
 * @param {bool} allowSpace
 * @returns {Object}
 */

export function getRegexp(suggestionsTrigger, allowSpace) {
    var suggestionsRegExp = allowSpace ?
        new RegExp(suggestionsTrigger + '([\\p{L}\\p{M}\\p{N}\\-\\+]*[.]?\\s?[\\p{L}\\p{M}\\p{N}\\-\\+]*)$', "u") :
        new RegExp(suggestionsTrigger + '([\\p{L}\\p{M}\\p{N}\\-\\+]*)$', "u"); // no i18n

    return suggestionsRegExp
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


    var match = null;
    var type = null;

    for (var i = 0; i < opts.trigger.length; i++) {
        let regex;
        if (opts.trigger[i] instanceof RegExp) { //opts.trigger[i] can be either of type regexp or a normal text
            regex = opts.trigger[i]
        } else {
            regex = getRegexp(
                opts.trigger[i],
                opts.allowSpace
            );
        }

        if (text.match(regex)) {
            match = text.match(regex);
            type = opts.trigger[i];
            break; //If a opts.trigger[i] has been matched, then don't match any other opts.trigger[i]
        }
    }

    // if match found, return match with useful information.
    if (match) {
        // adjust match.index to remove the matched extra space

        match.index = match.index;

        // The absolute position of the match in the document
        var from = $position.start() + match.index;
        var to = from + match[0].length;

        var queryText;

        if (type instanceof RegExp) {
            queryText = match[0];
        } else {
            queryText = match[1]; //if type is not of regexp, then return the first capturing group, becuase the regexp is constructed by default and it has one capturing group, which returns the text just after the trigger character
        }

        // Check for alias match
        let aliasMatch = false;
        if (opts.suggestions) {
            for (const suggestion of opts.suggestions) {
                if (suggestion.aliases && suggestion.aliases.includes(queryText)) {
                    aliasMatch = true;
                    break;
                }
            }
        }

        return {
            range: {
                from: from,
                to: to
            },
            queryText: queryText,
            type: type,
            aliasMatch: aliasMatch
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
        text: '',
        type: '',
        suggestions: [],
        isDropdownVisible: false,
        index: 0 // current active suggestion index
    };
};

function addEscapeSequenceForRegExpCharacters(text) {
    //before all regExp special characters such as ?, *, {, }, etc add escapeCharacter(\) inorder to match for that escape character
    return text.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
}

function removeEscapeSequenceForRegExpCharacters(text) {
    //remove the added escape character
    if (text instanceof RegExp) {
        return text
    } else {
        return text.replace(/\\/g, '')
    }
}

function escapeRegExpCharacters(triggerCharacters) {
    triggerCharacters.forEach((character, index) => {
        if (character instanceof RegExp) {
            return
        } else {
            triggerCharacters[index] = addEscapeSequenceForRegExpCharacters(character)
        }
    })
    return triggerCharacters
}



/**
 * @param {JSONObject} opts
 * @returns {Plugin}
 */
export function getSlashCommandsPlugin(opts, richTextView) {
    // default options
    var defaultOpts = {
        name: "slashCommands",
        trigger: ['/'], // trigger is an array of characters
        allowSpace: true,
        activeClass: 'suggestion-dropdown-active', // no i18n
        suggestionTextClass: 'prosemirror-suggestion', // no i18n
        getSlashCommands: function(state, text, cb, view) {
            const slashCommandsuggestions = getSlashFormattingSuggestions(view, view.options);
            const filtered = slashCommandsuggestions.filter(s =>
                s.name.toLowerCase().startsWith(text.toLowerCase()) ||
                (s.aliases && s.aliases.some(alias => alias.toLowerCase().startsWith(text.toLowerCase())))
            );
            cb && cb(filtered);
        },
        getSlashCommandsHTML: function(slashCommandsuggestions) {
            if (slashCommandsuggestions.length === 0) {
                return '';
            }
            let el = `<div class="ui-rte-suggestion-item-list ui-rte-atmetion-suggestion-container zdc_shareautocompletedialog suggestion-dropdown-list">`
            slashCommandsuggestions.forEach((suggestion) => {
                el += `<div class="ui-rte-suggestion-item suggestion-dropdown-list-item">
                                 <div class="" style="float:left;padding:3px;margin-top:5px">
                                 <div style="" class="">
                                     <span
                                         class="ui-rte-cmnt-atmention-name"
                                         id="full-name"
                                     >${suggestion.name}</span>
                                 </div>
                                 <div class="">
                                     <span class="graytxt" id="graytxt">${suggestion.description}&nbsp;</span>
                                 </div>
                                 </div>
                             </div>`
            })
            el += `</div>`
            return el;
        },
        onSelect: function(view, item, state) {
                const { from, to } = state.range;
                view.editorView.dispatch(view.editorView.state.tr.delete(from, to));

                // Check if the command is a function or a string
                if (typeof item.command === 'function') {
                    // If it's a function, execute it and pass the view
                    item.command(view);
                } else if (view.commands[item.command]) {
                    // Otherwise, run it as a normal command string
                    view.commands[item.command]();
                    view.focus();
                }
                // view.commands[item.command]()
                // view.editorView.focus();
            },
      
            activeClass: 'suggestion-item-active',
            suggestionTextClass: 'prosemirror-suggestion',
            maxNoOfSuggestions: 6,
            delay: 1000,
            
            placeDropdown(el, offset) {
                // append el wherver you want
                // set style whatever you want
                // TODO: think about outsourcing this positioning logic as options
                zwRteView.dom.append(el);

                el.style.display = 'flex'; // no i18n
                el.style.position = 'fixed'; // no i18n
                el.style.left = '';
                el.style.right = '';
                // el.style.height = '150px' // inorder to test for scrolling inside the dropdown div uncomment this
                // el.style.overflowY = 'auto'
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
                if (offset.bottom + el.scrollHeight < docHeight) {
                    var top = offset.bottom;
                } else {
                    var top = offset.top - el.scrollHeight;
                }
                el.style.top = top + 'px'; // no i18n
            },
    };


    var opts = Object.assign({}, defaultOpts, opts);

    // Ensure getSlashCommandsHTML and onSelect are provided
    if (!opts.getSlashCommandsHTML || !opts.onSelect) {
        throw new Error("Provide getSlashCommandsHTML and onSelect functions in options for suggestions-plugin");
    }

    opts.trigger = escapeRegExpCharacters(opts.trigger);

    // timeoutId for clearing debounced calls
    var showListTimeoutId = null;
    // dropdown element
    var el = document.createElement('div'); // no i18n
    el.className = "rte-suggestions-drop-down-parent-div";

    // ----- methods operating on above properties -----

    var showList = function(view, state, suggestions, opts, plugin) {
        if (!suggestions.length) {
            return hideList(plugin);
        }
        var suggestionsHTML = opts.getSlashCommandsHTML(suggestions, {
            range: state.range,
            trigger: removeEscapeSequenceForRegExpCharacters(state.type),
            suggestions: state.suggestions,
            query: state.text
        });

        if (typeof suggestionsHTML === 'string') {
            el.innerHTML = suggestionsHTML;
        } else {
            el.innerHTML = ''; // Clear existing content
            el.appendChild(suggestionsHTML);
        }

        // attach new item event handlers
        el.querySelectorAll('.suggestion-dropdown-list-item').forEach(function( // no i18n
            itemNode,
            index
        ) {
            itemNode.addEventListener('click', function() {
                // no i18n
                let item = state.suggestions[state.index];
                opts.onSelect(richTextView, item, {
                    range: state.range,
                    trigger: removeEscapeSequenceForRegExpCharacters(state.type),
                    suggestions: state.suggestions,
                    query: state.text
                });
                //always after selecting scrollIntoView
                let dispatch = richTextView.editorView.dispatch;
                let tr = view.state.tr;
                dispatch(tr.scrollIntoView());
            });
            itemNode.addEventListener('mouseover', function() {
                // no i18n
                if (ignoreMouseEvents) {
                    return;
                } else {
                    setIndex(index, state, opts);
                }
            });
            itemNode.addEventListener('mouseout', function() {
                // no i18n
                if (ignoreMouseEvents) {
                    return;
                } else {
                    setIndex(index, state, opts);
                }
            });
        });

        // highlight first element by default - like Facebook.
        addClassAtIndex(state.index, opts.activeClass);

        if (state.active) {
            adjust4viewportUsingFromPos(el, view.state.selection.$from.pos, view);
            state.isDropdownVisible = true;
        }
    };

    var getXY = function(view) {
        var offset = view.coordsAtPos(view.state.selection.$from.pos);
        var x = Math.floor(offset.left);
        var y = Math.floor(offset.bottom);
        return {
            x,
            y
        };
    };

    var adjust4viewportUsingFromPos = function(el, fromPos, view) {
        var offset = view.coordsAtPos(fromPos);

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
        if (offset.bottom + el.scrollHeight < docHeight) {
            var top = offset.bottom;
        } else {
            var top = offset.top - el.scrollHeight;
        }
        el.style.top = top + 'px'; // no i18n
    };

    var hideList = function(plugin) {
        var editorState = richTextView.editorView.state;
        var pluginState = plugin.getState(editorState);
        el.style.display = 'none'; // no i18n
        pluginState.isDropdownVisible = false;
    };

    var removeClassAtIndex = function(index, className) {
        var itemList = el.querySelectorAll('.suggestion-dropdown-list-item'); // no i18n
        var prevItem = itemList[index];
        if (prevItem) {
            prevItem.classList.remove(className);
        }
    };

    var scrollElementIntoView = function(suggestionItemEl, suggestionContainerEl) {
        let suggestionItemRect = suggestionItemEl.getBoundingClientRect();
        let suggestionContainerRect = suggestionContainerEl.getBoundingClientRect();
        ignoreMouseEvents = true;

        //to coincide the bottom of the suggestion item with the bottom of the suggestion container
        if (suggestionItemRect.bottom > suggestionContainerRect.bottom) {
            suggestionItemEl.scrollIntoView(false);
        }

        //to coincide the top of the suggestion item with the top of the suggestion container
        if (suggestionItemRect.top < suggestionContainerRect.top) {
            suggestionItemEl.scrollIntoView();
        }
        setTimeout(function() {
            ignoreMouseEvents = false;
        }, 50);
    };

    var addClassAtIndex = function(index, className) {
        var itemList = el.querySelectorAll('.suggestion-dropdown-list-item'); // no i18n
        if (itemList.length && itemList[index]) {
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
        var itemList = el.querySelectorAll('.suggestion-dropdown-list-item'); // no i18n
        if (itemList.length) {
            var prevItem = itemList[state.index];
            scrollElementIntoView(prevItem, el); // to bring the current element into view
        }
    };

    var goPrev = function(view, state, opts) {
        removeClassAtIndex(state.index, opts.activeClass);
        state.index--;
        state.index =
            state.index === -1 ? state.suggestions.length - 1 : state.index;
        addClassAtIndex(state.index, opts.activeClass);
        var itemList = el.querySelectorAll('.suggestion-dropdown-list-item'); // no i18n
        if (itemList.length) {
            var prevItem = itemList[state.index];
            scrollElementIntoView(prevItem, el); // to bring the current element into view
        }
    };

    /**
     * See https://prosemirror.net/docs/ref/#state.Plugin_System
     * for the plugin properties spec.
     */
    return new Plugin({
        key: new PluginKey('slashCommands'), // no i18n


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

                var view = richTextView.editorView;
                var isParaNode = false;

                view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
                    if (node.type.name === 'paragraph') {
                        isParaNode = true;
                    }
                });

                if (!isParaNode) { //if it is not a para node, then don't allow this plugin to work
                    return newState;
                }

                const $position = selection.$from;
                let match;

                // Check if suggestions plugin is active
                if (richTextView.pluginKeys.suggestions) {
                    const suggestionsPlugin = richTextView.pluginKeys.suggestions.getState(richTextView.editorView.state);
                    if (suggestionsPlugin && suggestionsPlugin.active) {
                        return newState; // Do not activate slashCommands if suggestions is active
                    }
                }

                if ($position.depth != 0) { //inorder to avoid gapcursor related problems when table is in first line
                    match = getMatch($position, opts);
                }
                // if match found update state
                if (match) {
                    newState.active = true;
                    newState.range = match.range;
                    newState.type = match.type;
                    newState.text = match.queryText;
                    newState.match = match;
                }

                return newState;
            }
        },

        // We'll need props to hi-jack keydown/keyup & enter events when suggestion dropdown
        // is active.
        props: {
            handleKeyDown(view, e) {
                var state = this.getState(view.state);

                // don't handle if no suggestions or not in active mode or if the dropdown is not visible
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
                    e.preventDefault(); // Prevent default enter behavior
                    let item = state.suggestions[state.index];
                    opts.onSelect(richTextView, item, {
                        range: state.range,
                        trigger: removeEscapeSequenceForRegExpCharacters(state.type),
                        suggestions: state.suggestions,
                        query: state.text
                    });
                    //always after selecting scrollIntoView
                    let dispatch = richTextView.editorView.dispatch;
                    let tr = view.state.tr;
                    dispatch(tr.scrollIntoView());
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
                    var self = this;
                    if (state && state.suggestions.length) {
                        // hide slashSuggestions list if view is not focused
                        setTimeout(function() {
                            hideList(self);
                        }, opts.delay - 30);
                        return false;
                    }
                },

                focus: function(view, e) {
                    var state = this.getState(view.state);
                    var self = this;
                    if (state && state.suggestions.length) {
                        opts.getSlashCommands({
                                range: state.range,
                                trigger: removeEscapeSequenceForRegExpCharacters(state.type),
                                suggestions: state.suggestions
                            },
                            state.text,
                            function(suggestions) {
                                // update `state` argument with suggestions
                                state.suggestions = suggestions.slice(
                                    0,
                                    opts.maxNoOfSuggestions
                                );
                                showList(view, state, state.suggestions, opts, self);
                            },
                            richTextView
                        );
                    }
                }
            },
            // to decorate the currently active @mention text in ui
            decorations(editorState) {
                const {
                    active,
                    range
                } = this.getState(editorState);

                if (!active) {
                    return null;
                }
                return DecorationSet.create(editorState.doc, [
                    Decoration.inline(range.from, range.to, {
                        nodeName: 'span', // no i18n
                        class: opts.suggestionTextClass
                    })
                ]);
            },

            api: {
                isDropdownVisible: function() {
                    var editorState = richTextView.editorView.state;
                    var pluginState = this.getState(editorState);
                    return pluginState.isDropdownVisible;
                }
            },

            //remove the element from dom once rteView.remove() is called
            destroy() {
                el.remove();
            }
        },

        // To track down state mutations and add dropdown reactions
        view() {
            return {
                update: view => {
                    var state = this.key.getState(view.state);
                    var self = this;
                    if (!state.active || !view.editable) {
                        // no search query
                        hideList(this.key);
                        clearTimeout(showListTimeoutId);
                        return;
                    }
                    // debounce the call to avoid multiple requests
                    showListTimeoutId = showListDebounce(
                        function() {
                            opts.getSlashCommands({
                                    range: state.range,
                                    trigger: removeEscapeSequenceForRegExpCharacters(state.type),
                                    suggestions: state.suggestions,
                                    match: state.match
                                },
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