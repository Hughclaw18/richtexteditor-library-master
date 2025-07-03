function markApplies(doc, ranges, type) {

    var rangeAllowsMark = function (i) {

        var ref = ranges[i];
        var $from = ref.$from;
        var $to = ref.$to;
        var can = $from.depth == 0 ? doc.type.allowsMarkType(type) : false;//if depth is 0 check first whether doc node allows this markType else set can to false

        doc.nodesBetween($from.pos, $to.pos, function (node) {
            if (can) { return false }
            can = node.inlineContent && node.type.allowsMarkType(type);
        });
        if (can) { return { v: true } }

    };

    for (var i = 0; i < ranges.length; i++) {

        var returned = rangeAllowsMark(i);
        if (returned) {
            return returned.v;
        }

    }
    return false
}

function rangeHasMark(from, to, markType, type, view) {
    var found = false;

    if (to > from) {
        view.state.doc.nodesBetween(from, to, function (node) {
            if (markType.isInSet(node.marks) && markType.isInSet(node.marks).attrs.type === type) {
                found = true;
            }
            return !found
        });
    }

    return found
};

export function applyScript(type, view, opts) {

    if (!type) {
        return
    }

    var state = view.state
    var dispatch = view.dispatch
    var markType = view.state.schema.marks.script

    var ref = state.selection;
    var empty = ref.empty;
    var $cursor = ref.$cursor;
    var ranges = ref.ranges;

    if ((empty && !$cursor) || !markApplies(state.doc, ranges, markType)) {
        return false
    }

    var attrs = {}
    attrs.type = type

    if(opts && opts.extraAttrs) {
        attrs.extraAttrs = opts.extraAttrs
    }

    /** If we want to add or change the script:
     * 
     * Case 1: If $from === $to then we would have value for $cursor
     * 
     *      b. Sub-Case 1:If script mark with the attrs value "super" is already present , and if we want to change the script type to "sub", then we need to first remove the script mark with the attrs value "super" and then only add a new script mark with the attrs set to "sub".
     * 
     *      c. Sub-Case 2:If script mark is not present at all then we only need to add the script mark to stored marks.
     * 
     * Case 2: If $from !== $to then we would not have any value for $cursor:
     * 
     *      If we want to toggle superScript, then first check if the script mark with atttrs value "sup" is present:
     * 
     *          Sub-Case1 : If it is present, then just remove the mark.
     * 
     *          Sub-Case 2: If it not present, then add the mark.
     */
    if (dispatch) {

        if ($cursor) {

            if (markType.isInSet(state.storedMarks || $cursor.marks())) {

                let mark = markType.isInSet(state.storedMarks || $cursor.marks())
                if (mark.attrs.type === type) {
                    dispatch(state.tr.removeStoredMark(markType));
                } else {
                    dispatch(state.tr.addStoredMark(markType.create(attrs)));
                }

            } else {
                dispatch(state.tr.addStoredMark(markType.create(attrs)));
            }

        } else {
            var tr = state.tr;

            for (var i$1 = 0; i$1 < ranges.length; i$1++) {

                var ref$2 = ranges[i$1];
                var $from$1 = ref$2.$from;
                var $to$1 = ref$2.$to;

                if (rangeHasMark($from$1.pos, $to$1.pos, markType, type, view)) {
                    tr = tr.removeMark($from$1.pos, $to$1.pos, markType);
                } else {
                    tr = tr.addMark($from$1.pos, $to$1.pos, markType.create(attrs));
                }

            }
            dispatch(tr);
        }

    }
    return true

}