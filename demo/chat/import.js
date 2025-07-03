var isBlock = function (node) {
    return node.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE'].includes(node.tagName)
}

var breakBlocks = function (nodes) {
    var result = [];
    var run = [];
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        currentRunType = isBlock(node) ? 'block' : 'inline';
        if (i == 0) {
            run.type = currentRunType;
        }

        if (run.type != currentRunType) {
            result.push(run)
            run = [];
            run.type = currentRunType;
        }

        run.push(node);
    }
    result.push(run);

    return result;
}


function convertCliqHTML2RTE(str) {
    var paras = str.split('<br>').map(line => {
        var d = document.createElement('div')
        d.innerHTML = line
        var cn = Array.from(d.childNodes)
        return cn;
    })
    var paraRunContainers = paras.map(nodes => breakBlocks(nodes))
    return paraRunContainers.map(n => {
        // for each
        // wrap all nodes in a para tag and return para html
        return n.map(run => {
            if (!run.length) { return '<p></p>' }
            var p = document.createElement('p')
            run.forEach(el => p.appendChild(el))
            if (run.type == 'inline') {
                return p.outerHTML
            } else {
                return p.innerHTML
            }
        }).join('');
    }).join('');
}