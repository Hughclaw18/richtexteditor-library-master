/* $Id$ */

import {tagNode, mentionNode} from './schemanodes';	// no i18n

/**
 * 
 * @param {OrderedMap} nodes 
 * @returns {OrderedMap}
 */
export function addMentionNodes(nodes) {
    return nodes.append({
      mention: mentionNode
    });
};

/**
 * 
 * @param {OrderedMap} nodes 
 * @returns {OrderedMap}
 */
export function addTagNodes(nodes) {
    return nodes.append({
      tag: tagNode
    });
};