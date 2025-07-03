/* $Id$ */

import { Plugin } from 'prosemirror-state'; // no i18n
import { Decoration, DecorationSet } from 'prosemirror-view'; // no i18n
import { debounce } from '../RTEPluginUtils'; //no i18n

const nonTextLeafNodeReplacer = '\0';
const showListDebounce = debounce();
const externalScrollDebounce = debounce();

var ignoeMouseEvents = false//to not call the setIndex function by mouseout or mouseover handler if the goNext or goPrev functions where called before it.

/**
 *
 * @param {String} mentionTrigger
 * @param {String} hashtagTrigger
 * @param {bool} allowSpace
 * @returns {Object}
 */
export function getRegexp(suggestionsTrigger, allowSpace) {
    var suggestionsRegExp = allowSpace
        ? new RegExp(suggestionsTrigger + '([\\p{L}\\p{M}\\p{N}\\-\\+]*[.]?\\s?[\\p{L}\\p{M}\\p{N}\\-\\+]*)$', "u")
        : new RegExp(suggestionsTrigger + '([\\p{L}\\p{M}\\p{N}\\-\\+]*)$', "u"); // no i18n

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

    for(var i = 0; i < opts.trigger.length; i++) {
        let regex;
        if(opts.trigger[i] instanceof RegExp) {//opts.trigger[i] can be either of type regexp or a normal text
            regex = opts.trigger[i]
        } else {
            regex = getRegexp(
                opts.trigger[i],
                opts.allowSpace
            );
        }
    
        if(text.match(regex)) {
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

        if(type instanceof RegExp) {
            queryText = match[0];
        } else {
            queryText = match[1];//if type is not of regexp, then return the first capturing group, becuase the regexp is constructed by default and it has one capturing group, which returns the text just after the trigger character
        }

        return {
            range: { from: from, to: to },
            queryText: queryText,
            type: type
        };
    }
    // else if no match don't return anything.
}

export function customGetMatch($position, opts, rteView, selection) {
    // take current para text content upto cursor start.
    // this makes the regex simpler and parsing the matches easier.
    var parastart = $position.before();
    const text = $position.doc.textBetween(
        parastart,
        $position.pos,
        '\n', // no i18n
        nonTextLeafNodeReplacer
    );

    let matchedObj = opts.trigger(text, rteView, selection)//call the custom getMAtch function passed by the user

    // if match found, return match with useful information.
    if (matchedObj && matchedObj.isMatched) {
    	
        // The absolute position of the match in the document
        var from = $position.start() + matchedObj.index;
        var to = from + (text.length - matchedObj.index); //calculate to position considering that, the matched text will start from match.index till the end of the text

        var queryText = text.substring(matchedObj.index, text.length);

        return {
            range: { from: from, to: to },
            queryText: queryText,
            type: null
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
    if(text instanceof RegExp) {
        return text
    } else {
        return text.replace(/\\/g, '')
    }
}

function escapeRegExpCharacters(triggerCharacters) {
    triggerCharacters.forEach((character, index)=>{
        if(character instanceof RegExp) {
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
export function getSuggestionsPlugin(opts, richTextView) {
    // default options
    var defaultOpts = {
        name: "suggestions",
        trigger: ['/'], // if trigger is an array then use default getMatch() function else if it is a function then use this function as getMatch() function
        allowSpace: true,
        customDropdown: false,//if customDropdown is set to true then getSuggestions(), getSuggestionsHTML(), onSelect() functions need not be provided by the user, we'll just make sure that whenever there is a match we'll call the function onMatch() which shld inturn handle the functions such as filtering the suggestions , designing the dropwdown, attaching the event listeners to each dropdown item, etc.
        activeClass: 'suggestion-dropdown-active', // no i18n
        suggestionTextClass: 'prosemirror-suggestion', // no i18n
        getSuggestions: function(state, text, cb, view) {
            cb([])
        },
        maxNoOfSuggestions: 6,
        delay: 200
    };

    var opts = Object.assign({}, defaultOpts, opts);

    // if getSuggestions is present and getSuggestionsHTML or onSelect methods are not present then throw an error
    // else if getSuggestions itself is not present means , write a default getSuggestions method which always returns empty array as suggestions
    if(!opts.customDropdown && opts.getSuggestions && (!opts.getSuggestionsHTML || !opts.onSelect)) {
        throw new Error("Provide getSuggestionsHTML and onSelect functions in options for suggestions-plugin")
    }

    if(opts.trigger && typeof opts.trigger === "object") {
        opts.trigger = escapeRegExpCharacters(opts.trigger)
    }

    // timeoutId for clearing debounced calls
    var showListTimeoutId = null;
    // dropdown element
    var el = document.createElement('div'); // no i18n
    el.className = "rte-suggestions-drop-down-parent-div"
    // current Idx

    // ----- methods operating on above properties -----

    var showList = function(view, state, suggestions, opts, plugin) {
        if(opts.getSuggestionsHTML) {
            if (!suggestions.length) {
                return hideList(plugin);
            }
            var suggestionsHTML = opts.getSuggestionsHTML(suggestions, {
                range: state.range, 
                trigger: state.type ? removeEscapeSequenceForRegExpCharacters(state.type) : null, //if there is no state.type then it means, getMatch() function is defined by the user
                suggestions: state.suggestions, 
                query: state.text
            });

            if(typeof suggestionsHTML === 'string') {
                el.innerHTML = suggestionsHTML 
            } else {
                el.innerHTML = '' // since we are only appending the child , we need to first clear whatever is inside the el html dom element and then only we need to append the child
                el.appendChild(suggestionsHTML)
            }
    
            // attach new item event handlers
            el.querySelectorAll('.suggestion-dropdown-list-item').forEach(function( // no i18n
                itemNode,
                index
            ) {
                itemNode.addEventListener('click', function() {
                    // no i18n
                    let item = state.suggestions[state.index]
                    opts.onSelect && opts.onSelect(view.rteView, item, { //pass rteView and not editorView
                        range: state.range, 
                        trigger: state.type ? removeEscapeSequenceForRegExpCharacters(state.type) : null, //if there is no state.type then it means, getMatch() function is defined by the user,
                        suggestions: state.suggestions,
                        query: state.text
                    });
                    //always after selecting scrollIntoView
                    let dispatch = richTextView.editorView.dispatch
                    let tr = view.state.tr
                    dispatch(tr.scrollIntoView())
                });
                // TODO: setIndex() needlessly queries.
                // We already have the itemNode. SHOULD OPTIMIZE.
                itemNode.addEventListener('mouseover', function() {
                    // no i18n
                    if(ignoeMouseEvents) {
                        return
                    } else {
                        setIndex(index, state, opts);
                    }
                });
                itemNode.addEventListener('mouseout', function() {
                    // no i18n
                    if(ignoeMouseEvents) {
                        return
                    } else {
                        setIndex(index, state, opts);
                    }
                });
            });
    
            // highlight first element by default - like Facebook.
            addClassAtIndex(state.index, opts.activeClass);
    
            if(state.active) {
                adjust4viewportUsingFromPos(el, view.state.selection.$from.pos, view)
                state.isDropdownVisible = true
            }

        }
    };

    var getXY = function(view) {
        var offset = view.coordsAtPos(view.state.selection.$from.pos)
        var x = Math.floor(offset.left)
        var y = Math.floor(offset.bottom)
        return {x, y}
    }

    var adjust4viewportUsingFromPos = function(el, fromPos, view) {
        var offset = view.coordsAtPos(fromPos)

        if (opts.placeDropdown) {
            opts.placeDropdown(el, offset);
            return;
        }
        
        // TODO: think about outsourcing this positioning logic as options
        richTextView.dom.append(el);

        el.style.display = 'block'; // no i18n
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
    };

    var hideList = function(plugin) {
        var editorState = richTextView.editorView.state
        var pluginState = plugin.getState(editorState)
        el.style.display = 'none'; // no i18n
        pluginState.isDropdownVisible = false
    };

    var removeClassAtIndex = function(index, className) {
        var itemList = el.querySelectorAll('.suggestion-dropdown-list-item'); // no i18n
        var prevItem = itemList[index];
        prevItem.classList.remove(className);
    };

    var scrollElementIntoView = function(suggestionItemEl, suggestionContainerEl) {
        let suggestionItemRect = suggestionItemEl.getBoundingClientRect()
        let suggestionContainerRect = suggestionContainerEl.getBoundingClientRect()
        ignoeMouseEvents = true
        
        //to coincide the bottom of the suggestion item with the bottom of the suggestion container
        if( suggestionItemRect.bottom > suggestionContainerRect.bottom  ) {
            suggestionItemEl.scrollIntoView(false)
        }

        //to coincide the top of the suggestion item with the top of the suggestion container
        if( suggestionItemRect.top < suggestionContainerRect.top ) {
            suggestionItemEl.scrollIntoView()
        }
        setTimeout(function() {
            ignoeMouseEvents = false
        }, 50)
    }

    var addClassAtIndex = function(index, className) {
        var itemList = el.querySelectorAll('.suggestion-dropdown-list-item'); // no i18n
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
        var itemList = el.querySelectorAll('.suggestion-dropdown-list-item'); // no i18n
        if (itemList.length) {
            var prevItem = itemList[state.index]; 
            scrollElementIntoView( prevItem, el ) // to bring the current element into view
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
            scrollElementIntoView( prevItem, el ) // to bring the current element into view
        }
    };

    /**
     * See https://prosemirror.net/docs/ref/#state.Plugin_System
     * for the plugin properties spec.
     */
    return new Plugin({
        key: richTextView.pluginKeys.suggestions, // no i18n

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

                var view = richTextView.editorView
                var isParaNode = false

                view.state.doc.nodesBetween(view.state.selection.$from.pos, view.state.selection.$to.pos, function(node, pos) {
                    if (node.type.name === 'paragraph') {
                        isParaNode = true
                    }
                })

                //TODO: Try to avoid the working of plugins inside nodeViews
                //As of now only the eventHandlers and mutationObserver is made to not work inside node views, try to extend this working for plugins also
                if(!isParaNode) {//if it is not a para node, then don't allow this plugin to work
                    return newState 
                }

                const $position = selection.$from;
                let match
                if($position.depth!=0) { //inorder to avoid gapcursor related problems when table is in first line

                    if(typeof opts.trigger === "object") {
                        match = getMatch($position, opts);
                    } else {
                        match = customGetMatch($position, opts, richTextView, tr.selection)
                    }
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

                // don't handle if no suggestions or not in active mode or when customDropwn is true(here the user itself will handle it) or if the dropdown is not visible
                //isDropDownVisible is used because if the dropdown is shown and the user presses the escape key the drdopdown gets hidden and now if the user presses the enter key then the opts.onSelect() is called because there is an event handler binded with the enter key, so inorder to avoid this the event listener should work only if the dropdown is visible
                if (!state.active || !state.suggestions.length || opts.customDropdown || !state.isDropdownVisible) {
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
                    let item = state.suggestions[state.index]
                    opts.onSelect && opts.onSelect(view.rteView, item, {//pass rteView and not editorView
                        range: state.range,
                        trigger: state.type ? removeEscapeSequenceForRegExpCharacters(state.type) : null, //if there is no state.type then it means, getMatch() function is defined by the user,, 
                        suggestions: state.suggestions, 
                        query: state.text
                    });
                    //always after selecting scrollIntoView
                    let dispatch = richTextView.editorView.dispatch
                    let tr = view.state.tr
                    dispatch(tr.scrollIntoView())
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
                    //if customDropdown is enabled no need to handle blur event
                    if (opts.customDropdown) {
                        return
                    } else if (state && state.suggestions.length) {
                        // hide suggestions list if view is not focused
                        // hide after a timeout so that when a suggestion gets selected and @mention node is inserted
                        // otherwise it will hide the list immediately before node gets inserted
                        
                        // put setTimeout lesser than opts.delay(time delayed to show the list on debounce) because 
                        // if regex provided by user to match empty word and opts.delay as timeout value <= timeout value set here then the following use case will cause problem:
                        
                        // if the user selects an item from suggestions dropdown then because of blur event, 
                        // the hiding of list on a timeout will be called, after that the opts.onSelect() is called
                        // and the node is inserted, after that again empty word is matched and 
                        // the suggestions list is shown, after this the hidelist will be called by the debounced function called because of blur event, 
                        // so the list will be hidden automatically 
                        // inorder to avoid this have the opts.delay timeout value > timeout value set here

                        // here how much lesser should the timeout value be lesser than opts.delay timeout value is set to -30 using trial and error approach, initially
                        // tried with opts.delay/4, opts.delay/2, opts.delay - 50, etc but all did not work properperly, only opts.delay - 30 works properly
                        setTimeout(function() {
                            hideList(self);
                        }, opts.delay-30);
                        return false;
                    }
                },

                focus: function(view, e) {
                    var state = this.getState(view.state);
                    var self = this
                    // Assume the following case:
                    // If regex provided by user matches even the empty word, then for the first time if RTE is loaded and if we click inside it, the focus event would be called
                    // whereas during this flow the apply() function for any plugin would not be called because the editorState is not updated
                    // so when it comes inside this focus() function the state.active would still be false, but the regex is provided to match even epmty word
                    // so inorder to make the state.active as true we need to call the apply() function
                    // inorder to call the apply() function we are dispatching an empty transaction, so that the editorState will be updated which inturn calls the apply() function for every plugin
                    if(!state.active && view.rteView.isEmpty()) {
                        view.dispatch(view.state.tr)
                    } else if(!state.active && opts.customDropdown && opts.unMatch) {
                        opts.unMatch(richTextView)
                    } else if(state && state.active && opts.customDropdown) {
                        opts.onMatch(
                            {
                                range: state.range, 
                                trigger: state.type ? removeEscapeSequenceForRegExpCharacters(state.type) : null, //if there is no state.type then it means, getMatch() function is defined by the user,, 
                                suggestions: state.suggestions
                            },
                            state.text,
                            getXY(view),
                            richTextView
                        )
                    } else if (state && state.suggestions.length) {
                        opts.getSuggestions(
                            {
                                range: state.range, 
                                trigger: state.type ? removeEscapeSequenceForRegExpCharacters(state.type) : null, //if there is no state.type then it means, getMatch() function is defined by the user,, 
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
                    // if the view is not editable then no need to execute this plugin
                    // Note: we need to add this case in all plugins, that is if RTE is not editable we shld not execute any plugins
                    // we can make RTE as non editable by calling the command zwRteView.setEditable(false)
                    if (!state.active || !view.editable) {
                        // no search query
                        hideList(this.key);
                        clearTimeout(showListTimeoutId);
                        if(opts.customDropdown && opts.unMatch) {
                            opts.unMatch(richTextView)
                        }
                        return;
                    }
                    // debounce the call to avoid multiple requests
                    showListTimeoutId = showListDebounce(
                        function() {
                            if(opts.customDropdown) {
                                opts.onMatch(
                                    {
                                        range: state.range, 
                                        trigger: state.type ? removeEscapeSequenceForRegExpCharacters(state.type) : null, //if there is no state.type then it means, getMatch() function is defined by the user,, 
                                        suggestions: state.suggestions
                                    },
                                    state.text,
                                    getXY(view),
                                    richTextView
                                )
                            } else {
                                // get suggestions and set new state
                                opts.getSuggestions(
                                    {
                                        range: state.range, 
                                        trigger: state.type ? removeEscapeSequenceForRegExpCharacters(state.type) : null, //if there is no state.type then it means, getMatch() function is defined by the user,, 
                                        suggestions: state.suggestions
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
                            }
                        },
                        opts.delay,
                        this
                    );
                }
            };
        }
    });
}
