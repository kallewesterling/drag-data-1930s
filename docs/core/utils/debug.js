
const froms = {};

/**
 * Internal function
 */
const _output = (message, log_output=false, from=undefined, output_function=console.log, passive = false) => {
    if (typeof(from) === 'function') // you can send a message from a function, and we'll pull out the name
        from = from.name;
    if (typeof(from) === 'object')
        from = from.constructor.name;

    window._selectors["loadingContainer"].classed('bg-white', true);
    window._selectors["loadingContainer"].classed('bg-danger', false);
    window._selectors["loadingContainer"].classed('text-white', false);
    window._selectors["loadingMessage"].html(message);
    window._selectors["loading"].classed('d-none', false);
    window.loadingTimeout = setTimeout(() => {
        window._selectors["loading"].classed('d-none', true);
    }, 1000);

    if (![...Object.keys(froms)].includes(from)) {
        // assign color
        froms[from] = d3.interpolateRainbow(Object.keys(froms).length * 0.15);
    }
    if (log_output || window.ERROR_LEVEL > 0) {
        if (typeof(message) === "object") {
            console.groupCollapsed(`%c${new Date().toLocaleString()} [${from}]`, `color: ${passive ? 'lightgray': froms[from]}`);
            message.forEach(m=>{
                if (typeof(m) === "string") {
                    output_function(`%c${m}`, 'color: lightgray');
                } else {
                    output_function(m);
                }
            });
            console.groupEnd()
        } else {
            console.groupCollapsed(`%c${new Date().toLocaleString()} [${from}]`, `color: ${passive ? 'lightgray': froms[from]}`);
            output_function(`%c${message}`, 'color: lightgray');
            console.groupEnd()
        }
    }
}

/**
 * Internal function
 */
const error = (message, hide=false, clear_timeout=true) => {
    if (hide) {
        window._selectors["loading"].classed('d-none', true);
    } else {
        window._selectors["loadingSpinner"].classed('d-none', true);
        window._selectors["loadingContainer"].classed('bg-white', false);
        window._selectors["loadingContainer"].classed('bg-danger', true);
        window._selectors["loadingContainer"].classed('text-white', true);
        window._selectors["loadingMessage"].html(message);
        window._selectors["loading"].classed('d-none', false);
        if (clear_timeout)
            window.clearTimeout(window.loadingTimeout);
    }
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
    if (settingsFromDashboard('debugMessage').debugMessages === false) {
        // console.log("[debugMessage: " + header + "] " + message);
        // console.log("debugMessage suppressed."); //TODO: Turn back on?
        return false;
    }
    let _id = `toast${store.toasterCounter}`;
    let _html = window._selectors["wrapToasters"].html();
    _html += `<div class="toast" id="${_id}" role="alert" aria-live="polite" aria-atomic="true" data-delay="5000"><div role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header"><strong class="mr-auto">${header}</strong><button type="button" class="ml-2 mb-1 btn-close" data-dismiss="toast" aria-label="Close"></button></div>
        <div class="toast-body">${message}</div>
        </div></div>`;
    window._selectors["wrapToasters"].html(_html);
    // $(`#${_id}`).toast({ delay: 5000 });
    $(`#${_id}`).toast("show");
    let t = setTimeout(() => {
        // console.log(`removing ${_id}`);
        d3.selectAll(`#${_id}`).remove();
    }, 6000);
    store.toasterCounter += 1;
    return t;
};


const colorNetworks = () => {
    let network_ids = [...new Set(store.nodes.map(node=>node.connected.network.network_id))];
    console.log(`${network_ids.length} networks found`);
    
    nodeElements.attr('style', node => {
        networkID = node.connected.network.network_id;
        return 'fill: ' + d3.interpolateRainbow(networkID/network_ids.length*5) + '!important;';
    });

    d3.select('.colorNetworks').html(`Network count: ${network_ids.length}`);
}