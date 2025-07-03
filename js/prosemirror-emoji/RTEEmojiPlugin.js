import { Plugin } from 'prosemirror-state'; // no i18n
import { Slice } from 'prosemirror-model' //no i18n
import { Decoration, DecorationSet } from 'prosemirror-view'; // no i18n
import { getEmojiCode, getMatchedEmojiList, getShortCutList, getEmojiList, getZomojiList, getTrimmedEmojiName } from './RTEEmoji' //no i18n
import { getWordBeforeCurPos, debounce } from '../RTEPluginUtils' //no i18n
import NodeSerializer from '../NodeSerializer';
import emojicontainerTemplate from '../../templates/emojicontainer.hbs';
import emojimenuTemplate from '../../templates/emojimenu.hbs';
import emojisuggestionsTemplate from '../../templates/emojisuggestions.hbs';

export function getEmojiPlugin(rteView, schema, hasZomoji){
    /**
     * For popup opened on emoji icon click, it will be either unicode or zomoji
     * depending on the tab selected
     * For dropdwon opened on typing we will have both emoji type, so combined
     */
    const EmojiType = {
        unicode: 'UNICODE', //no i18n
        zomoji: 'ZOMOJI', //no i18n
        combined: 'COMBINED' //no i18n
    };

    /**
     * popup - the container which is opened on emoji icon click
     * dropdown - the container which is opened on typing :
     */
    const containerType = {
        popup: 'POPUP', //no i18n
        dropdown: 'DROPDOWN' //no i18n
    };

    const nonTextLeafNodeReplacer = '\0';

    const showEmojiDebounce = debounce();
    const externalScrollDebounce = debounce();

    var hideTimeOut = {
        timeOutId: '',
        set: function(id) {
            clearTimeout(this.timeOutId);
            this.timeOutId = id;
        },
        clear: function() {
            clearTimeout(this.timeOutId);
        }
    };

    // Node Serializer for converting text to emoji nodes on typing
    const nodeSerializer = NodeSerializer(schema, 'emoji', { hasZomoji: hasZomoji }); //no i18n

    var el = null;

    // while navigating(down/up) in dropdown, we need to jump over elements
    // navFactor tells number of elements in each row, so jumping to elements would be easy
    var navigationFactor = {
        _factor: 1,
        setFactor(value) {
            this._factor = value;
        },
        getFactor() {
            return this._factor;
        }
    };

    var getMenubarElement = function(dom) {
        var menuBar = dom.parentElement.querySelector('#rte-menubar'); //no i18n
        return menuBar && menuBar.querySelector('#rte-format'); //no i18n
    };

 // EMOJI CONTAINER - CREATE , POPULATE , POSITION , REFRESH --- START

    /**
     * Emoji Container Structure
     * <div>  el - outer most container - positioned in the document
     *      <div> #emoji-dropdown-container - contains searchbox, emoji popup/dropdown, tabs
     *      emoji popup - shown when emoji icon is clicked
     *      emoji dropdown -  shown when : is typed in dom
     *          <div>  - emoji-parent div -> holds emoji box css prop
     *              <div></div>   - holds emoji details (name, class, unicode)
     *          </div>
     *      </div>
     * </div>
     */

    var createAndPositionEmojiContainer = function(state, menubarElement) {
        el = document.createElement('div');
        el.classList.add('ui-rte-emoji-parent-container'); //no i18n
        /**
         * Why do we append emoji container to document.body instead of appending as a sibling
         * appending as sibling may hide the element depending on ancestor css properties
         * even position fixed elements will be hidden if ancestor have transform - css property
         */
        rteView.dom.append(el);
        populateEmojiContainer(state);
        positionEmojiContainer(state);
    };

    // populate parent dropdown with search box and emoji containers
    var populateEmojiContainer = function(state) {
        var isPopupType = state.type === containerType.popup;
        var hasTabs = isPopupType && hasZomoji;
        var dropdownHTML = emojicontainerTemplate({ searchBox: isPopupType, hasTabs: hasTabs }); //no i18n
        el.innerHTML = dropdownHTML;
        populateEmoji(state);

        isPopupType && bindPopupListeners(state);
    };

    var getCurrentContainer = function(state) {
        let emojiContainer = el.querySelector('#emoji-container'); //no i18n
        let combinedContainer = el.querySelector('#combined-container');    //no i18n
        if (emojiContainer) {
            let unicodeContainer = emojiContainer.querySelector('#unicode-cont');   //no i18n
            let zomojiContainer = emojiContainer.querySelector('#zomoji-cont'); //no i18n
            if (state.emojiType === EmojiType.unicode) {
            	unicodeContainer.classList.remove('ui-zomoji-active'); //no i18n
                return unicodeContainer;
            } else if (state.emojiType === EmojiType.zomoji) {
            	unicodeContainer.classList.add('ui-zomoji-active'); //no i18n
                return zomojiContainer;
            }
        } else {
            return combinedContainer;
        }
    }
    
    // populate emoji container with emoji's
    var populateEmoji = function(state) {
        let emojiContainer = getCurrentContainer(state);
        var emojiConatinerHTML = getEmojiContainerHTML(state);
        emojiContainer.innerHTML = emojiConatinerHTML;
        // no problem in binding click every time, as innerHTML removes eventListeners bound on the element
        bindOnClickforEmoji(state, emojiContainer);
    };

    function positionEmojiContainer(state) {
        var elemRect = rteView.editorView.dom.querySelector('.ui-rte-emoji-lookup-query').getBoundingClientRect();
        var yPos = elemRect.y + elemRect.height;
        var xPos = elemRect.x;
        var docHeight = document.documentElement.clientHeight;
        if (el) {
            var eleHeight = el.firstElementChild.offsetHeight;
            if (yPos + eleHeight >= docHeight) {
                yPos = elemRect.y - eleHeight - 5;
            }
            el.style.position = 'fixed'; //no i18n
            el.style.left = xPos + 'px'; //no i18n
            el.style.top = yPos + 'px'; //no i18n
            el.style['z-index'] = 1020; //no i18n
        }
    }

    //get the html of emoji list, which needs to be inserted in emoji container
    var getEmojiContainerHTML = function(state) {
        if (state.type === containerType.popup) {
            return getPopupHTML(state);
        } else {
            return getDropdownHTML(state);
        }
    };

    // Emoji html for popup type
    var getPopupHTML = function(state) {
        let context = {
            isEmoji : (state.emojiType === EmojiType.unicode),
            isZomoji : (state.emojiType === EmojiType.zomoji)
        }
        context.emoji = context.isEmoji ? state.emojiMatched[EmojiType.unicode] : state.emojiMatched[EmojiType.zomoji];
        var el = emojimenuTemplate(context); //no i18n
        return el;
    };

    // Emoji html for dropdown type
    var getDropdownHTML = function(state) {
        let hasEmoji = !!getMatchedEmojiCount(state,EmojiType.unicode);
        let hasZomoji = !!getMatchedEmojiCount(state,EmojiType.zomoji);
        let context = {}
        if (hasEmoji) {
            context.hasEmoji = hasEmoji;
            context.emoji = state.emojiMatched[EmojiType.unicode];
        }
        if (hasZomoji) {
            context.hasZomoji = hasZomoji;
            context.zomoji = state.emojiMatched[EmojiType.zomoji];
        }
        var el = emojisuggestionsTemplate(context); //no i18n
        return el;
    }

    // refresh the container if the container is already present
    var refreshEmojiDropDown = function(state){
        var hasSearchBox = el.querySelector('#search-container');   //no i18n
        if (
            (state.type === containerType.popup && hasSearchBox) ||
            (state.type === containerType.dropdown && !hasSearchBox)
        ) {
            populateEmoji(state);
        } else {
            populateEmojiContainer(state);
        }
    };

    // check whether the element is completely visible or not
    function isElementCompletelyVisible(element, container) {
        var eleRect = element.getBoundingClientRect();
        var containerRect = container.getBoundingClientRect();
        if(eleRect.top < containerRect.top) { // element is at top of parent container
            return eleRect.top > containerRect.top;
        } else { // element is at bottom of parent container
            return eleRect.bottom < containerRect.bottom;
        }
    };

    function hasEmojiDropDown(){
        return el;
    }

    function openEmojiDropDown(state) {
        hideTimeOut.clear()
        if (hasEmojiDropDown()) {
            showEmojiDropDown(state);
            refreshEmojiDropDown(state);
            positionEmojiContainer(state);
        } else {
            createAndPositionEmojiContainer(state);
        }

        if (state.type === containerType.dropdown && getMatchedEmojiCount(state)) {
            focusFirstElement(el, state);
            calculateNavigationFactor();
        } else if (state.type === containerType.popup) {
            focusSearchBox();
        }
    }

    function hideEmojiDropDown() {
        if(el){
            el.style.display = "none";  // no i18n
        }
    }

    function resetComponentsToDefault(){
        let emojiTab = el.getElementsByClassName('ui-rte-emoji-tab');  //no i18n
        emojiTab.length && highlightSelectedTab(emojiTab[0]);
        let searchBox = el.querySelector('#search-box'); //no i18n
        if (searchBox) {
            searchBox.value = '';
        }
    }

    function showEmojiDropDown(state) {
        if(el && el.style.display === "none"){
            el.style.display = "block";
            state.type === containerType.popup && resetComponentsToDefault();
        }
    }

    function removeEmojiDropDown() {
        if (hasEmojiDropDown()) {
            rteView.dom.removeChild(el);
            el = null;
        }
    }
    
// EMOJI CONTAINER - CREATE , POPULATE , POSITION , REFRESH --- END 


// FOCUS , NAVIGATE , SELECT ELEMENTS -- START

    // focus the element on navigation
    // scroll the element into view, if not in view port
    function focusElement(state, element) {
        var elementList = el.getElementsByClassName('ui-rte-emoji');   //no i18n
        elementList[state.index] && elementList[state.index].classList.remove('ui-rte-focus-emoji');
        element && element.classList.add('ui-rte-focus-emoji');    //no i18n
        state.index = parseInt(element.getAttribute('index'));
        if(!isElementCompletelyVisible(element, element.offsetParent)){
            element.scrollIntoView && element.scrollIntoView();
        }
    }

    function focusFirstElement(el,state) {
        var emoji = el.getElementsByClassName('ui-rte-emoji-type-2')[0];
        focusElement(state,emoji);
    }

    // factor to navigate when vertical navigation is done. 
    // this calculates the number of lements that can be accomodated in a row in type-2 container
    function calculateNavigationFactor() {
        var containerWidth = el.querySelector('#emoji-dropdown-container').offsetWidth; //no i18n
        var emojiWidth = el.querySelector('.ui-rte-emoji-type-2').offsetWidth;  //no i18n
        navigationFactor.setFactor(Math.floor((containerWidth-10)/emojiWidth));
    };

    
    function goNext(state, direction) {
        var index = state.index;
        var noOfMatchedEmojis = getMatchedEmojiCount(state);
        /**
         * if horizontal move to next index
         * if last element move to index = 0,
         * modulo does the work
         * if vertical find the posAtCurrentRow and navigate the same to next row
         * if in last row, posAtCUrRow will be the index
         */
        if (direction === 'horizontal') {
            // modulo helps moving index to 0 when index count is equal to noOf emojis (as no more emoji after that)
            index = (index+1) % noOfMatchedEmojis;
        } else {
            /**
             * navFactor gives number of elements in every row
             * To get position in current row, modulo with navFactor gives the position
             * while moving down if next is with in matchedcount
             *       we can move to index by just adding navFatcor to the index
             * else
             * We should move to some index in first row. 
             * That index would be position of element in current row
             */
            var navFactor = navigationFactor.getFactor();
            var posAtCurRow = state.index % navFactor;
            if ((index+navFactor) < noOfMatchedEmojis ) {
                index += navFactor;
            } else {
                index = posAtCurRow;
            }
        }

        var elementList = el.getElementsByClassName('ui-rte-emoji');
        focusElement(state, elementList[index]);
    };

    function goPrev(state, direction){
        var index = state.index;
        var noOfMatchedEmojis = getMatchedEmojiCount(state);
        /**
         * if horizontal move to prev index
         * if at index 0, move to the last element
         * if vertical find the posAtCurrentRow and navigate to the same to prev row
         * if in first row, move to the posAtCurrentRow in last row
         */
        if (direction === 'horizontal') {
            // if index > 0 , reducing one will move one position in left
            // if index = 0, we should move to last element , so setting noOfMatchedEmojis-1
            index = (index !== 0) ? index-1 : noOfMatchedEmojis-1;
        } else {
            /**
             * to move to up, reducing index with navFactor will help
             * if reduced index > 0, we can proceed with the same
             * else { we should reduce something from noOfMatchedEmoji's to set selection in last row
             *      1. Find the number of elements in last row
             *      2. Find the position of element in current row
             *      3. if current row position is available in last row also we can move there
             *              For that reduce noOfElemInLastRow with posAtCurRow, this gives position of element from lastElement
             *      4. Else navigate to curPos at prev row
             *              For that add NoOfElemLastRow and (navFactor - posAtCurR0w), this gives position of element from lastElement
             *  }
             */
            var navFactor = navigationFactor.getFactor();
            var posAtCurRow = state.index % navFactor;
            if ((index-navFactor) >= 0) {
                index = index-navFactor;
            } else {
                var noOfEleInLastRow = noOfMatchedEmojis % navFactor;
                index = noOfMatchedEmojis - ((noOfEleInLastRow > posAtCurRow) ? (noOfEleInLastRow-posAtCurRow) : (noOfEleInLastRow+(navFactor-posAtCurRow)));
            }
        }
        var elementList = el.getElementsByClassName('ui-rte-emoji');
        focusElement(state, elementList[index]);
    };

    function select(state) {
        var emoji = getEmojiAtIndex(state, state.index);
        insertEmoji(emoji, state);
    };

 // FOCUS , NAVIGATE , SELECT ELEMENTS -- END



// EVENT LISTENERS FOR EMOJI COMPONENTS --- START
    // For popup type we need to add listeners for search box, tabs
    function bindEventListeners(searchBox){
        searchBox.addEventListener('input', triggerInputEvent);

        function focusOutCallback(event) {
            let id = setTimeout(function() {
                var transaction = rteView.editorView.state.tr.setMeta("hideEmojiDropDown", {}); //no i18n
                rteView.editorView.dispatch(transaction);
            },300);
            hideTimeOut.set(id);
        }
       searchBox.addEventListener('blur', focusOutCallback);
        
        searchBox.addEventListener('keydown', function(event) {
            if (event.keyCode == 27) {
                var transaction = rteView.editorView.state.tr.setMeta('hideEmojiDropDown', {}); //no i18n
                rteView.editorView.dispatch(transaction);
            } else if (event.keyCode == 9) { // swicth between tabs on tab key press
                var tabs = el.getElementsByClassName('ui-rte-emoji-tab');  //no i18n
                if (tabs.length) {
                    let selectedTab = el.getElementsByClassName('ui-rte-tab-sel')[0];
                    if (selectedTab.getAttribute('tabName') === 'unicode') {
                        switchTab(tabs[1]);
                    } else {
                        switchTab(tabs[0]);
                    }
                };
                // prevent default, so that, it wont make input box out of focus
                event.preventDefault();
            }
        });
    };

    // trigger event if some text is typed in search box
    function triggerInputEvent(e) {
        var view = rteView.editorView;
        var tr = view.state.tr.setMeta("searchTextUpdated", {text: e.target.value}); //no i18n
        view.dispatch(tr);
    };

    function bindOnClickforEmoji(state, emojiContainer) {
        // bindOnClick for emoji conatiner and insert emoji using target element on click
        emojiContainer.onclick = function(ev) {
            let emoji = ev.target;
            let index = emoji.getAttribute('index') || emoji.parentElement.getAttribute('index');
            emoji = getEmojiAtIndex(state, index);
            insertEmoji(emoji, state);
        };
    }

    // bind event listeners for popup type container
    var bindPopupListeners = function (state) {
        hasZomoji && bindOnClickforTabs();
        var searchBox = el.querySelector('#search-box');    //no i18n
        if (searchBox) {
            bindEventListeners(searchBox);
            searchBox.focus();
        }
    }

    function highlightSelectedTab(tabElement) {
        var tabs = el.getElementsByClassName('ui-rte-emoji-tab');  //no i18n
        for(var i = 0; i<tabs.length; i++ ) {
            tabElement!=tabs[i] && tabs[i].classList.remove('ui-rte-tab-sel');
        }
        tabElement.classList.add('ui-rte-tab-sel')    //no i18n
    }

    function switchTab(tabElement) {
        hideTimeOut.clear();
        highlightSelectedTab(tabElement);
        var view = rteView.editorView;
        var tab = tabElement.getAttribute('tabName');
        var tr = view.state.tr.setMeta("tabSwitched", {tab: EmojiType[tab]}); //no i18n
        view.dispatch(tr);
        focusSearchBox();
    }

    function focusSearchBox() {
        var searchBox = el.querySelector('#search-box');    //no i18n
        searchBox && searchBox.focus();
    }

    function bindOnClickforTabs() {
        var tabs = el.getElementsByClassName('ui-rte-emoji-tab');    //no i18n
        var onclick = (event) => {
            var element = event.currentTarget;
            switchTab(element);
        };
        for(var i = 0; i<tabs.length; i++ ) {
            tabs[i].onclick = onclick;
        }
    }

// EVENT LISTENERS FOR EMOJI COMPONENTS --- END

    function insertEmoji(emoji, emojiState) {
        var emojiType = emoji.type;
        var view = rteView.editorView;
        let from = emojiState.range.from;
        let to = emojiState.range.to;

        if (emojiType === EmojiType.unicode) {
            var emojiCodeArr = getEmojiCode(":"+emoji.name+":");

            var emojiCode = emojiCodeArr.map(function(code){
                return "0"+code.slice(2);
            });
            // fromCodePoint supports in all browsers except I.E
            var node = view.state.schema.text(String.fromCodePoint.apply(null,emojiCode));
        } else {
            if (!view.state.schema.nodes.emoji) {
                return;
            }
            var emojiName = emoji.name;
            var node = view.state.schema.nodes.emoji.create({emojiName:emojiName});
        }
        replaceSelectionWithNode(node, from, to, view);
        rteView.focus();
    };

    function replaceSelectionWithNode(node, from, to, view) {
        // for retaining marks after emoji set the mark to space following the emoji
        // if from === to, get the mark from previous index
        // bcz mostly the index at last will have no node to take marks from it
        var preCurPosition = from === to && from > 1 ? from - 1 : from;
        var nodeAtCur = view.state.doc.nodeAt(preCurPosition);
        var marks = (nodeAtCur && nodeAtCur.marks) || [];
        var textNode = view.state.schema.text(' ', marks);
        var nodeArr = [node, textNode];
        var tr = view.state.tr.replaceWith(from, to, nodeArr);
        view.dispatch(tr);
    }

    function getMatchedEmojiCount(state, type) {
        var emojiMatched = state.emojiMatched;
        type = type ? type : state.emojiType;
        if( type === EmojiType.unicode ){
            return emojiMatched[type] && emojiMatched[type].length;
        } else if (type === EmojiType.zomoji){
            return emojiMatched[type] && emojiMatched[type].length;
        }else {
            return emojiMatched[EmojiType.unicode].length + emojiMatched[EmojiType.zomoji].length;
        }
    }

     // adds index to matched emoji list
     var getEmojiListWithIndex = function(state) {
        var emojiList = getMatchedEmojiList(state.text, state.emojiType);
        let indexCount = 0;
        for (let key in emojiList) {
            let list = emojiList[key];
            list.forEach(function(emoji) {
                emoji.index = indexCount++; //no i18n
            });
        }
        return emojiList;
    };

    function getEmojiAtIndex(state, index) {
        var emojiType = state.emojiType;
        var emoji;
        if (emojiType != EmojiType.combined) {
            emoji = state.emojiMatched[emojiType][index];
            emoji.type = emojiType;
        } else {
            let noOfUnicodeEmoji = state.emojiMatched[EmojiType.unicode].length;
            if (index < noOfUnicodeEmoji) {
                let type = EmojiType.unicode;
                emoji = state.emojiMatched[type][index];
                emoji.type = type;
            } else {
                let type = EmojiType.zomoji;
                index = index - noOfUnicodeEmoji;
                emoji = state.emojiMatched[type][index];
                emoji.type = type;
            }
        }
        return emoji;
    }

    function getMatch($position) {
        var parastart = $position.before();
        var text = $position.doc.textBetween(
            parastart,
            $position.pos,
            '\n', // no i18n
            '\0'
        );
        var regex = new RegExp('(^|\\s|\\0)' + ':' + '([\\S]*)$'); // no i18n
        var match = text.match(regex);
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

            var queryText = match[0];

            return {
                range: { from: from, to: to },
                text: queryText
            };
        }
        return {
            range: { from: $position.start(), to: $position.start() },
            text: ''
        };
    }

    var getNewState = function getNewState() {
        return {
            active: false,  // for displaying dropdown and reacting to changes
            text : '',
            range: {
                from: '',
                to: ''
            },
            emojiMatched : {}, // will contain array of emojis and zomojis {emoji:[...], zomoji:{...}}.
            emojiType : EmojiType.unicode,
            type : containerType.popup,   // popup: elem on emoji icon click  dropdown:elem on dom search
            index: 0   // index of currently focused element
        };
    };

    return new Plugin({
        key : rteView.pluginKeys.emoji,//no i18n

        state: {
            init() {
                return getNewState();
            },

            apply(tr, state) {
                var newState = getNewState();
                var selection = tr.selection;
                // var hidePopup = tr.getMeta('hideAllPopup'); //no i18n
                // if (hidePopup) {
                //     return newState;
                // }
                /**
                 * for type 1 => we get emoji dropdown on emoji icon click
                 * showEmojiDropDown insists to show emoji dropdown on click
                 * searchTextUpdated gives a meta value of text for which match should be shown
                 */
                var showEmojiDropDown = tr.getMeta('showEmojiDropDown');    //no i18n
                var newSearchText = tr.getMeta('searchTextUpdated');   //no i18n
                var tabSwitched = tr.getMeta('tabSwitched');    //no i18n
                var isPopupContainer = showEmojiDropDown || newSearchText || tabSwitched;
                
                var hideEmoji = tr.getMeta('hideEmojiDropDown');     //no i18n
                if (hideEmoji) {
                    return newState;
                }

                // if meta is not present then popup type is not possible
                // if from and to is not equal then dropdown type is not possible. So return a dummy state
                if (!isPopupContainer && (selection.from !== selection.to)) {
                    return newState;
                }
                
                if (isPopupContainer) {
                    newState.active = true;
                    if (newSearchText) {
                        newState.text = newSearchText.text;
                    } else if(state.type === containerType.popup){
                        newState.text = state.text;
                    }
                    // newState.text = (newSearchText && newSearchText.text) || (newSearchText || state.text) || '';
                    if(tabSwitched) {
                        newState.emojiType = tabSwitched.tab;
                    } else if (state.type === containerType.popup) {
                        newState.emojiType = state.emojiType;
                    }
                    newState.emojiMatched = getEmojiListWithIndex(newState);
                    newState.range.from = selection.from;
                    newState.range.to = selection.to;
                } else {
                    newState.type = containerType.dropdown;
                    if(tr.selection.$from.depth!=0)//added for gapcursor related errors for tables in first line itself
                    {
                        let match = getMatch(tr.selection.$from);
                        if (match.text) {
                            newState.text = match.text;
                            newState.range = match.range;
                            if (hasZomoji) {
                                newState.emojiType = EmojiType.combined;
                            }
                            newState.emojiMatched = getEmojiListWithIndex(newState);
                            if (getMatchedEmojiCount(newState)) {
                                newState.active = true;
                            }
                        }
                    }
                }
                return newState;
            }
        },

        props: {
            handleKeyDown : function(view, e){
                var state = this.getState(view.state);
                if (!state.active || state.type === containerType.popup) { // for popup type (on button click) naviagtion is not needed
                    return false;
                }
                var down, up, right, left, enter, esc;
                enter = e.keyCode === 13;
                esc = e.keyCode === 27;
                left = e.keyCode === 37;
                up = e.keyCode === 38;
                right = e.keyCode === 39;
                down = e.keyCode === 40;
                if(esc) {
                    hideEmojiDropDown();   //no i18n
                    return true;
                } else if(down) {
                    goNext(state,'vertical');    //no i18n
                    return true;
                } else if (left) {
                    goPrev(state,'horizontal');  //no i18n
                    return true;
                } else if (up) {
                    goPrev(state,'vertical');    //no i18n
                    return true;
                } else if(right) {
                    goNext(state,'horizontal');  //no i18n
                    return true;
                } else if(enter) {
                    select(state);
                    return true;
                }
                return false;
            },
            // paste handling done
            transformPasted: function(slice) {
                var fr = nodeSerializer.serializeFragment(slice.content);
                var sl = new Slice(fr, slice.openStart, slice.openEnd);
                return sl;
            },
            handleDOMEvents: {
                
                blur: function(view, e) {
                    var state = this.getState(view.state);
                    if (state) {
                        let id= setTimeout(function() {
                            // hideEmojiDropDown();
                        }, 500);
                        hideTimeOut.set(id);
                        return false;
                    }
                },

                focus: function(view, e) {
                    var state = this.getState(view.state);
                    if (state.active) {
                        openEmojiDropDown(state);
                    }
                }
            }, 

            // to decorate the currently active :emoji text
            decorations(editorState) {
                const { active, range } = this.getState(editorState);

                if (!active) {
                    return null;
                }
                return DecorationSet.create(editorState.doc, [
                    Decoration.inline(range.from, range.to, {
                        nodeName: 'span', // no i18n
                        class: 'ui-rte-emoji-lookup-query'
                    })
                ]);
            }, 

            handleExternalScroll : function () {
                externalScrollDebounce(hideEmojiDropDown,200);
            }
        },
        // detect emoji on typing - handled in appendTransaction
        appendTransaction (trArr, oldState, newState) {
            var wordObj = getWordBeforeCurPos(trArr, oldState, newState);
            if(!wordObj) {return};
            var word = wordObj.word;
            var shortcut = getShortCutList();
            var emojiList = getEmojiList();
            var zomojiList = getZomojiList();
            var match = shortcut[word] || word;
            var matchedEmojiCode = emojiList[match];
            var matchedZomojiClass = zomojiList[match];
            if (matchedEmojiCode) {
                let emojiCode = matchedEmojiCode.map(function(code){
                    return "0"+code.slice(2);
                });
                // create new transaction with link added and return it
                let newTr = newState.tr.replaceWith(
                    wordObj.start,
                    wordObj.end,
                    newState.schema.text(String.fromCodePoint.apply(null, emojiCode))
                );
                return newTr;
            } else if (hasZomoji && matchedZomojiClass) {
                let newTr = newState.tr.replaceWith(
                    wordObj.start,
                    wordObj.end,
                    newState.schema.nodes.emoji.create({emojiName: getTrimmedEmojiName(match), class: matchedZomojiClass})
                );
                return newTr;
            }
            return;
        },

        view: function view() {
            return {
                update: (view) => {
                    var state = this.key.getState(view.state);
                    if (state.active) {
                        openEmojiDropDown(state);
                    } else {
                        hideEmojiDropDown();
                    }
                    return;
                }, 
                // remove emoji dropdown once view gets destroyed
                destroy: () => {
                    removeEmojiDropDown();
                }
            };
        }
    });

};