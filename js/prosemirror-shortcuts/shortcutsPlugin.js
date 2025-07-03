/**
 * The below logic for handling keyboard shortcuts were taken from prosemirror-keymap@1.2.2 package, the init and apply functions in the plugin is alone custom written.
 */

import { base, keyName } from "w3c-keyname"
import RTEConstants from "../RTEConstants"
import { Plugin } from "prosemirror-state"

const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false

function normalizeKeyName(name) {
	let parts = name.split(/-(?!$)/), result = parts[parts.length - 1]
	if (result == "Space") {
		result = " "
	}
	let alt, ctrl, shift, meta
	for (let i = 0; i < parts.length - 1; i++) {
		let mod = parts[i]
		if (/^(cmd|meta|m)$/i.test(mod)) {
			meta = true
		} else if (/^a(lt)?$/i.test(mod)) {
			alt = true
		} else if (/^(c|ctrl|control)$/i.test(mod)) {
			ctrl = true
		} else if (/^s(hift)?$/i.test(mod)) {
			shift = true
		} else if (/^mod$/i.test(mod)) {
			if (mac) {
				meta = true;
			} else {
				ctrl = true
			}
		} else {
			throw new Error("Unrecognized modifier name: " + mod)
		}
	}
	if (alt) {
		result = "Alt-" + result
	}
	if (ctrl) {
		result = "Ctrl-" + result
	}
	if (meta) {
		result = "Meta-" + result
	}
	if (shift) {
		result = "Shift-" + result
	}
	return result
}

function normalize(map) {
	let copy = Object.create(null)
	for (let prop in map) {
		copy[normalizeKeyName(prop)] = map[prop]
	}
	return copy
}

function modifiers(name, event, shift = true) {
	if (event.altKey) {
		name = "Alt-" + name
	}
	if (event.ctrlKey) {
		name = "Ctrl-" + name
	}
	if (event.metaKey) {
		name = "Meta-" + name
	}
	if (shift && event.shiftKey) {
		name = "Shift-" + name
	}
	return name
}

export function getShortcutsPlugin() {
	return new Plugin({
		key: RTEConstants.ADD_SHORTCUTS,
		state: {
			init() {
				return {}
			},
			apply(tr, state) {
				if (tr.meta && tr.meta[RTEConstants.ADD_SHORTCUTS]) {
					let shortcutObj = tr.meta[RTEConstants.ADD_SHORTCUTS]
					for (const key in shortcutObj) {
						state[key] = shortcutObj[key]
					}
				}
				return state
			}
		},
		props: {
			handleKeyDown(view, event) {
				let map = normalize(this.getState(view.state))
				let name = keyName(event), baseName
				let direct = map[modifiers(name, event)]
				if (direct && direct(view.rteView, event)) {
					return true
				}
				// A character key
				if (name.length == 1 && name != " ") {
					if (event.shiftKey) {
						// In case the name was already modified by shift, try looking
						// it up without its shift modifier
						let noShift = map[modifiers(name, event, false)]
						if (noShift && noShift(view.rteView, event)) {
							return true
						}
					}
					if ((event.shiftKey || event.altKey || event.metaKey || name.charCodeAt(0) > 127) &&
						(baseName = base[event.keyCode]) && baseName != name) {
						// Try falling back to the keyCode when there's a modifier
						// active or the character produced isn't ASCII, and our table
						// produces a different name from the the keyCode. See #668,
						// #1060
						let fromCode = map[modifiers(baseName, event)]
						if (fromCode && fromCode(view.rteView, event)) {
							return true
						}
					}
				}
				return false
			}
		}
	})
}