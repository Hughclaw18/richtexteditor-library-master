import {orderedList,getBulletList,listItem, checkList, getCheckListItemNode} from "./listNodes"

export function addListNodes(nodes, options) {
    return nodes.append({
      orderedList:orderedList,
      bulletList:getBulletList(options),
      listItem:listItem
    });
};

export function addCheckListNode(nodes, checkListFeatureOptions) {

  let checkListItemNode = getCheckListItemNode(checkListFeatureOptions)

	return nodes.append({
		checkList, checkListItem : checkListItemNode
	})
}