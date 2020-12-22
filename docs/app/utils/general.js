"use strict";

/**
 * nodeHasEdges takes two arguments, the first of which defines a node_id and the second whether a count should be provided.
 * The return value depends on whether the count parameter was set to true or false. If it's true, it will return the number
 * of edges from the given node_id. Otherwise, it will return a boolean that tells you whether the node has edges or not.
 * @param {Object} - A d3 node selection.
 * @param {boolean} [count] - Tell the function whether it should return a count of edges (true) or a boolean (false)
 * @returns {boolean|number} - A boolean that describes whether the node has edges or not, or the number of edges that are connected to the node.
 */
const nodeHasEdges = (node, count = false) => {
    let returnValue = false,
        counted = 0;

    graph.edges.filter((edge) => {
        if (edge.source.node_id === node.node_id) {
            returnValue = true;
            counted += 1;
        }
        if (edge.target.node_id === node.node_id) {
            returnValue = true;
            counted += 1;
        }
    });

    return count === true ? counted : returnValue;
};


/**
 * getUnconnectedNodes takes no arguments but looks through graph.nodes in the current viz for any unconnected nodes.
 * The return value is a list of all the node objects that are currently unconnected.
 * @returns {Array} - Array of all the unconnected nodes in the visualization.
 */
const getUnconnectedNodes = () => {
    let unConnectedNodes = [];
    graph.nodes.forEach((node) => {
        if (nodeHasEdges(node) === false) {
            unConnectedNodes.push(node);
        }
    });
    return unConnectedNodes;
};


/**
 * hasUnconnectedNodes takes no arguments but checks whether the current graph.nodes contains unconnected nodes.
 * The return value is a boolean of whether the graph has unconnected nodes.
 * @returns {boolean} - Boolean that describes whether the graph has unconnected nodes.
 */
const hasUnconnectedNodes = () => {
    return getUnconnectedNodes().length > 0;
};


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


/**
 * restartSimulation takes no arguments but simply runs the three commends that restarts the movement in the visualization. It is used when a setting is changed, to ensure that the simulation keeps rendering correctly.
 * The return value is always true.
 * @returns {boolean} - true
 */
const restartSimulation = () => {
    graph.nodes.forEach(node => {
        console.log(node.vx); // TODO: reset stickyness here too...?
    })
    graph.simulation.stop();
    graph.simulation.alpha(1);
    graph.simulation.restart();
    return true;
};


/**
 * nodeIsSelected takes one argument and determines whether the provided node is selected or not, by checking whether it has been classed with `selected`.
 * The return value is a boolean, whether it is selected (`true`) or not (`false`).
 * @param {Object} - A d3 node selection.
 * @returns {boolean} - Whether the node has been selected or not (in reality, has the class `selected` or not).
 */
const nodeIsSelected = (node) => {
    return d3.select(`#${node.node_id}`).classed("selected");
};


/**
 * edgeIsSelected takes one argument and determines whether the provided edge is selected or not, by checking whether it has been classed with `selected`.
 * The return value is a boolean, whether it is selected (`true`) or not (`false`).
 * @param {Object} - A d3 edge selection.
 * @returns {boolean} - Whether the edge has been selected or not (in reality, has the class `selected` or not).
 */
const edgeIsSelected = (edge) => {
    return d3.select(`#${edge.edge_id}`).classed("selected");
};


/**
 * deselectNodes takes one optional argument of a d3 selected node to be excluded from the "deselection" process (in reality, the removal of the `selected` class from the DOM elements).
 * The return value is always true;
 * @param {Object} [excludeNode] - Any given d3 selected node to exclude from the process.
 * @returns {boolean} - true
 */
const deselectNodes = (excludeNode = undefined) => {
    nodeElements.classed("selected", (node) => {
        if (excludeNode && node === excludeNode) {
            if (nodeIsSelected(node)) {
                // do nothing
            } else {
                return true;
            }
        } else {
            return false;
        }
    });
    textElements.classed("selected", (node) => {
        if (excludeNode && node === excludeNode && nodeIsSelected(node)) {
            return true;
        } else {
            return false;
        }
    });

    // formerly unselectNodes:
    let related = undefined;
    nodeElements.classed("deselected", (node) => {
        if (excludeNode && node === excludeNode) {
            node.fx = node.x;
            node.fy = node.y;
            related = getRelated(node);
            return false;
        } else {
            return true;
        }
    });
    if (related) {
        related.secondaryNodeIDs.forEach((node_id) => {
            let elem = d3.select(`#${node_id}`);
            elem.classed("selected-secondary", true);
            elem.classed("deselected", false);
        });
        related.tertiaryNodeIDs.forEach((node_id) => {
            let elem = d3.select(`#${node_id}`);
            elem.classed("selected-tertiary", true);
            elem.classed("deselected", false);
        });
        related.tertiaryEdges.forEach((edge_id) => {
            let elem = d3.select(`#${edge_id}`);
            elem.classed("selected-tertiary", true);
            elem.classed("deselected", false);
        });
    }

    return true;
};


/**
 * deselectEdges takes one optional argument of a d3 selected edge to be excluded from the "deselection" process (in reality, the removal of the `selected` class from the DOM elements).
 * The return value is always true;
 * @param {Object} [excludeEdge] - Any given d3 selected edge to exclude from the process.
 * @returns {boolean} - true
 */
const deselectEdges = (excludeEdge = undefined) => {
    edgeElements.classed("selected", (edge) => {
        if (excludeEdge && edge === excludeEdge) {
            if (edgeIsSelected(edge)) {
                // do nothing
            } else {
                return true;
            }
        } else {
            return false;
        }
    });
    edgeElements.classed("deselected", (edge) => {
        if (excludeEdge && edge === excludeEdge) {
        } else {
            return true;
        }
    });
};


/**
 * isSourceOrTarget takes one required argument, a node (which can either be a d3 node selection or a string denoting a `node_id`), and one optional argument, which specifies // TODO
 * The return value is a list of all the related edges, depending on the parameters.
 * @param {Object|string} node - A d3 selection for a node, or a string denoting a node's identification name
 * @param {boolean} [edgeList] - A list with all the edges that you want to check against.
 * @returns {Array} - List of all the edges that are connected to the given node
 */
// TODO: This function essentially doubles with nodeHasEdges...
const isSourceOrTarget = (node, edgeList = graph.edges) => {
    if (typeof node === "string")
        node = lookupNode(node);

    let isSource = edgeList
        .map((d) => d.source.node_id)
        .includes(node.node_id);
    let isTarget = edgeList
        .map((d) => d.target.node_id)
        .includes(node.node_id);
    return isSource || isTarget;
};


/**
 * getRelatedEdges takes one required argument, a node (which can either be a d3 node selection or a string denoting a `node_id`), and two optional arguments, which specifies if you want to get a list of related edges, where the node is the target (`asTarget`), the source (`asSource`) or both (set both to `true`).
 * The return value is a list of all the related edges, depending on the parameters.
 * @param {Object|string} node - A d3 selection for a node, or a string denoting a node's identification name
 * @param {boolean} [asSource] - Specifies whether to look for edges where the given node is the target
 * @param {boolean} [asTarget] - Specifies whether to look for edges where the given node is the source
 * @returns {Array} - List of all the edges that are connected to the given node
 */
const getRelatedEdges = (node, asSource = true, asTarget = true) => {
    if (typeof node === "string")
        node = lookupNode(node);

    let allRelatedEdges = [];
    if (asTarget) {
        let relatedEdgesAsTarget = g.edges
            .selectAll("line.link")
            .data()
            .filter((l) => l.target === node);
        allRelatedEdges.push(...relatedEdgesAsTarget);
    }
    if (asSource) {
        let relatedEdgesAsSource = g.edges
            .selectAll("line.link")
            .data()
            .filter((l) => l.source === node);
        allRelatedEdges.push(...relatedEdgesAsSource);
    }
    return allRelatedEdges;
};


/**
 * selectRelatedEdges takes one required argument, a node (which can either be a d3 node selection or a string denoting a `node_id`).
 * The return value is always true.
 * @param {Object|string} node - A d3 selection for a node, or a string denoting a node's identification name
 * @returns {boolean} - true
 */
const selectRelatedEdges = (node) => {
    if (typeof node === "string") {
        node = lookupNode(node);
    }
    g.edges.selectAll("line.link").classed("deselected", true);
    getRelatedEdges(node).forEach((e) => {
        d3.select(`#${e.edge_id}`).classed("selected", true);
        d3.select(`#${e.edge_id}`).classed("deselected", false);
    });
    return true;
};


/**
 * getRelated takes one required argument, a node (which can either be a d3 node selection or a string denoting a `node_id`). Then it loops through the related edges and nodes for each of its children,
 * The return value is an object, which contains a number of properties: `primary` which is the original node, `secondaryNodeIDs` and `secondaryEdges` which have lists of all the respective secondary objects, and `tertiaryNodeIDs` and `tertiaryEdges` for all the respective tertiary objects.
 * @param {Object|string} node - A d3 selection for a node, or a string denoting a node's identification name
 * @returns {Object} - Object that contains all the information about the nodes and edges (2nd and 3rd removed) from the provided node
 */
const getRelated = (node) => {
    if (typeof node === "string") {
        node = lookupNode(node);
    }

    let secondaryEdges = getRelatedEdges(node);
    let secondaryNodeIDs = [
        ...new Set([
            ...secondaryEdges.map((e) => e.source.node_id),
            ...secondaryEdges.map((e) => e.target.node_id),
        ]),
    ].filter((d) => d != node.node_id);

    let tertiaryNodeIDs = [],
        tertiaryEdges = [];
    secondaryNodeIDs.forEach((node_id) => {
        let _tertiaryEdges = getRelatedEdges(node_id);
        let _tertiaryNodeIDs = [
            ...new Set([
                ..._tertiaryEdges.map((e) => e.source.node_id),
                ..._tertiaryEdges.map((e) => e.target.node_id),
            ]),
        ].filter((d) => d != node_id && d != node.node_id);
        tertiaryNodeIDs = [...tertiaryNodeIDs, ..._tertiaryNodeIDs];
        tertiaryEdges = [...tertiaryEdges, ..._tertiaryEdges];
    });
    secondaryEdges = secondaryEdges.map((e) => e.edge_id);
    tertiaryEdges = tertiaryEdges.map((e) => e.edge_id);
    let returnValue = {
        primary: node,
        secondaryNodeIDs: secondaryNodeIDs,
        tertiaryNodeIDs: tertiaryNodeIDs,
        secondaryEdges: secondaryEdges,
        tertiaryEdges: tertiaryEdges,
    };
    // console.log(returnValue);
    return returnValue;
};


/**
 * resetGraphElements takes no arguments but resets all the different graph elements (nodes, edges, labels) to their original settings.
 * The return value is always true.
 * @returns {boolean} - true
 */
const resetGraphElements = () => {
    loading('resetGraphElements called...')

    nodeElements
        .classed("d-none", false) // show all of them circles
        .attr("class", (node) => getNodeClass(node))
        .transition()
        .attr("r", (node) => getSize(node));

    edgeElements
        .attr("class", (e) => getEdgeClass(e))
        .transition()
        .attr("stroke-opacity", 0.3);

    if (!getSettings().nodes.stickyNodes) {
        textElements
            .attr("class", "label")
            .attr("", (node) => {
                node.fx = null;
                node.fy = null;
            });
    }

    textElements
        .transition()
        .duration(750)
        .attr("opacity", 1)
        .attr("font-size", (node) => getSize(node, "text"));

    return true;
};


/**
 * selectNode takes one required argument, the d3 selector for a given node. This is the function that handles the "click" event on the node.
 * The return value is always true.
 * @param {Object} node - d3 selector for a given node.
 * @returns {boolean} - true
 */
const selectNode = (node) => {
    if (nodeIsSelected(node)) {
        window.node_selected = undefined;
        hide("#nodeEdgeInfo");
        resetGraphElements();
    } else {
        window.node_selected = true;
        resetGraphElements();
        deselectNodes(node);
        selectRelatedEdges(node);
        setNodeEdgeInfo(node);
    }
    return true;
};


/**
 * selectEdge takes one required argument, the d3 selector for a given edge. This is the function that handles the "click" event on the edge.
 * The return value is always true.
 * @param {Object} edge - d3 selector for a given edge.
 * @returns {boolean} - true
 */
const selectEdge = (edge) => {
    if (edgeIsSelected(edge)) {
        window.edge_selected = undefined;
        hide("#nodeEdgeInfo");
        resetGraphElements();
    } else {
        window.edge_selected = true;    
        deselectEdges(edge);
        setNodeEdgeInfo(edge);
    }
    return true;
};


/**
 * modifyNodeDegrees takes no arguments and just makes sure that each node in the current graph has a `current_degree` set to match its number of edges.
 * The return value is always true.
 * @returns {boolean} - true
 */
const modifyNodeDegrees = () => {
    graph.nodes.forEach((n) => {
        n.current_degree = nodeHasEdges(n, true)
    });
    return true;
};


/**
 * graphNodesContains takes one required argument, the d3 selector for a given node.
 * The return value provides an answer to whether the node is represented in the current visualization or not.
 * @param {string} node_id - An identifier string for a given node
 * @returns {boolean} - Denotes whether the node is represented in the graph.nodes or not
 */
const graphNodesContains = (node_id) => {
    return [...graph.nodes.map((n) => n.node_id)].includes(node_id);
};


/**
 * graphEdgesContains takes one required argument, the d3 selector for a given node.
 * The return value provides an answer to whether the edge is represented in the current visualization or not.
 * @param {string} edge_id - An identifier string for a given edge
 * @returns {boolean} - Denotes whether the edge is represented in the graph.edges or not
 */
const graphEdgesContains = (edge_id) => {
    return [...graph.edges.map((e) => e.edge_id)].includes(edge_id);
};


/**
 * modifySimulation takes no arguments but is the function that runs every time that the d3 network simulation is initiated or started.
 * The return value is always true.
 */
const modifySimulation = () => {
    let settings = getSettings().force;

    graph.simulation.force("link").links(graph.edges);
    graph.simulation.nodes(graph.nodes);
    if (settings.layoutCenter) {
        graph.simulation.force("center", d3.forceCenter());
        graph.simulation.force("center").strength = 1;
    } else {
        graph.simulation.force("center", null);
    }
    if (settings.layoutForceX) {
        graph.simulation.force("forceX", d3.forceX());
    } else {
        graph.simulation.force("forceX", null);
    }
    if (settings.layoutForceX) {
        graph.simulation.force("forceY", d3.forceY());
    } else {
        graph.simulation.force("forceY", null);
    }
    if (settings.layoutCharge) {
        graph.simulation.force("charge", d3.forceManyBody());
        graph.simulation.force("charge").strength(settings.charge);
    } else {
        graph.simulation.force("charge", null);
    }
    if (settings.layoutCollide) {
        graph.simulation.force("collide", d3.forceCollide());
        graph.simulation.force("collide").strength(settings.collide);
    } else {
        graph.simulation.force("collide", null);
    }

    graph.simulation.force("link").strength(0.4);

    graph.simulation.on("tick", function () {
        nodeElements.attr("cx", (n) => n.x);
        nodeElements.attr("cy", (n) => n.y);

        edgeElements.attr("x1", (e) => e.source.x);
        edgeElements.attr("y1", (e) => e.source.y);
        edgeElements.attr("x2", (e) => e.target.x);
        edgeElements.attr("y2", (e) => e.target.y);

        textElements.attr("x", (n) => n.x);
        textElements.attr("y", (n) => n.y + 4);
    });

    // restart the simulation now that everything is set
    graph.simulation.restart();

    return true;
};


/**
 * getNodeClass takes one required argument, the d3 selector for a given node. It is the function that provides the class for any given node in the visualization.
 * The return value is a string of classes.
 * @param {Object} node - d3 selector for a given node.
 * @returns {string} - The string of classes to return to the node.
 */
const getNodeClass = (node) => {
    let classes = "node " + node.category;
    classes += node.has_comments ? " has-comments" : "";
    return classes;
};


/**
 * getEdgeClass takes one required argument, the d3 selector for a given edge. It is the function that provides the class for any given edge in the visualization.
 * The return value is a string of classes.
 * @param {Object} edge - d3 selector for a given edge.
 * @returns {string} - The string of classes to return to the edge.
 */
const getEdgeClass = (edge) => {
    let classes = "link";
    classes += edge.revue_name != "" ? " revue" : " no-revue";
    classes += edge.has_comments ? " has-comments" : "";
    classes += edge.has_general_comments ? " has-comments" : "";
    return classes;
};

/**
 * getEdgeStrokeWidth takes one required argument, the d3 selector for a given edge. It is the function that provides the `stroke-width` value for the edges in the visualization.
 * The return value is a string with the stroke width followed by "px".
 * @param {Object} edge - d3 selector for a given edge.
 * @returns {string} - The string with the stroke width.
 */
const getEdgeStrokeWidth = (edge) => {
    let settings = getSettings();
    let weightScale = edgeScale(settings);

    let evalWeight = settings.edges.weightFromCurrent
        ? edge.calibrated_weight
        : edge.weight;
    return weightScale(evalWeight) + "px";
}

/**
 * getNodeClass takes one required argument, the d3 selector for a given node. It is the function that provides the class for any given node in the visualization.
 * The return value is ...
 * @param {Object} node - d3 selector for a given node.
 * @returns {string} - The string of classes to return to the node.
 */
const getTextClass = (node) => {
    let classes = "label " + node.category;
    classes += node.has_comments ? " has-comments" : "";
    return classes;
};

/**
 * getSize takes one required argument, the d3 selector for a given node. The optional `type` argument, provides whether the return value should be for an `r` value (DOM `circle` elements) or for an `font-size` value (DOM `text` elements).
 * The return value is a number, run through the current scale.
 * @param {Object} node - d3 selector for a given node.
 * @param {Object} [type] - Either "r" (default) for a `circle` DOM element, or "text" for a `text` DOM element.
 * @returns {number} - The size in pixels
 */
const getSize = (node, type = "r") => {
    let settings = getSettings();
    let yScale = nodeScale(settings);
    
    if (type === "r") {
        if (settings.nodes.nodeSizeFromCurrent === true) {
            return yScale(node.current_degree) * settings.nodes.multiplier;
        } else {
            return yScale(node.degree) * settings.nodes.multiplier;
        }
    } else if (type === "text") {
        if (settings.nodes.nodeSizeFromCurrent === true) {
            return (yScale(node.current_degree) * settings.nodes.multiplier) * 1.5;
        } else {
            return (yScale(node.degree) * settings.nodes.multiplier) * 1.5;
        }
    }
};


const lookupNode = (node_id, store=graph.nodes) => {
    return store.find((node) => node.node_id === node_id);
}