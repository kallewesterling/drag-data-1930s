const clearAll = (e) => {
    if (!e.altKey && window.toggledCommentedElements) {
        toggleCommentedElements('true');
    }

    if (d3.select('#popup-info').classed('d-none')) {
        d3.select('#popup-info').classed('d-none', true);
    }
}

const loading = (message) => {
    // console.log(message);
    d3.select("#loading").classed('d-none', false);
    d3.select("#loadingMessage").html(message);
    setTimeout(() => {
        d3.select("#loading").classed('d-none', true);
    }, 1000);
    // console.log(message);
}

window.onmousemove = (e) => {
    clearAll(e);
}


/**
 * troubleshoot takes one argument, which specifies whether to try to fix the data present in the current graph.
 * @returns {Object} - Object with one property, `droppedNodes`, which lists all node_ids that were removed, and two objects, `storeNodes` and `graphNodes` that each contain two properties, `notInDOM` which counts the number of nodes that could not be selected with d3, and `inGraph` which contains lists of respective nodes with the property `inGraph` set to true.
 */
const troubleshoot = (fix = false) => {
    let returnObject = {
        storeNodes: {
            notInDOM: 0,
            inGraph: store.nodes.filter((d) => d.inGraph),
        },
        graphNodes: {
            notInDOM: 0,
            inGraph: graph.nodes.filter((d) => d.inGraph),
        },
        droppedNodes: [],
    };
    store.nodes.forEach((node) => {
        if (d3.select("#" + node.node_id).node()) {
        } else {
            returnObject.storeNodes.notInDOM += 1;
        }
    });
    graph.nodes.forEach((node) => {
        if (d3.select("#" + node.node_id).node()) {
        } else {
            returnObject.graphNodes.notInDOM += 1;
        }
    });

    // If `fix` is set to true, we will check for inconsistency in data...
    if (fix) {
        if (returnObject.storeNodes.inGraph > returnObject.graphNodes.inGraph) {
            /* // TODO: turn on this message?
            console.log(
                "there are more filtered nodes in store than in graph, correcting..."
            );*/
            returnObject.storeNodes.inGraph.forEach((node) => {
                if (
                    returnObject.graphNodes.inGraph.find(
                        (d) => d.node_id === node.node_id
                    ) == undefined
                ) {
                    returnObject.droppedNodes.push(node.node_id);
                    node.inGraph = false;
                }
            });
        }
    }
    return returnObject; // can be used in a debugMessage, like debugMessage(dropped, "Dropped nodes");
};


/**
 * debugMessage takes two arguments, a first required message that will appear in the div, and an optional second which defines the header.
 * The return value is always the identification number for the message box's timeout.
 * @param {string} message
 * @param {string} [header]
 * @returns {number} - Identification number for the message box's timeout
 */
const debugMessage = (message, header = "Warning") => {
    if (getSettings().debugMessages === false) {
        // console.log("[debugMessage: " + header + "] " + message);
        // console.log("debugMessage suppressed."); //TODO: Turn back on?
        return false;
    }
    let _id = `toast${store.toasterCounter}`;
    let _html = d3.select("#wrapToasters").html();
    _html += `<div class="toast" id="${_id}" role="alert" aria-live="polite" aria-atomic="true" data-delay="5000"><div role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header"><strong class="mr-auto">${header}</strong><button type="button" class="ml-2 mb-1 btn-close" data-dismiss="toast" aria-label="Close"></button></div>
        <div class="toast-body">${message}</div>
        </div></div>`;
    d3.select("#wrapToasters").html(_html);
    // $(`#${_id}`).toast({ delay: 5000 });
    $(`#${_id}`).toast("show");
    let t = setTimeout(() => {
        // console.log(`removing ${_id}`);
        d3.selectAll(`#${_id}`).remove();
    }, 6000);
    store.toasterCounter += 1;
    return t;
};


