"use strict";

// set up store.ranges
const range = (start, stop, step) => {
    return Array.from(
        { length: (stop - start) / step + 1 },
        (x, i) => start + i * step
    );
};

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
 * getUnnamedNodes takes no arguments but looks through graph.nodes in the current viz for any unconnected nodes.
 * The return value is a list of all the node objects that are currently unconnected.
 * @returns {Array} - Array of all the unconnected nodes in the visualization.
 */
const getUnnamedNodes = () => {
    let unnamedNodes = [];
    graph.nodes.forEach((node) => {
        if (node.id.toLowerCase().includes('unnamed')) {
            unnamedNodes.push(node);
        }
    });
    return unnamedNodes;
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
 * hasUnnamedNodes takes no arguments but checks whether the current graph.nodes contains unnamed nodes.
 * The return value is a boolean of whether the graph has unnamed nodes.
 * @returns {boolean} - Boolean that describes whether the graph has unnamed nodes.
 */
const hasUnnamedNodes = () => {
    return getUnnamedNodes().length > 0;
};

/**
 * restartSimulation takes no arguments but simply runs the three commends that restarts the movement in the visualization. It is used when a setting is changed, to ensure that the simulation keeps rendering correctly.
 * The return value is always true.
 * @returns {boolean} - true
 */
const restartSimulation = () => {
    graph.nodes.forEach((node) => {
        // console.log(node.vx); // TODO: reset stickyness here too...?
    });
    graph.simulation.stop();
    // graph.simulation;
    graph.simulation.restart().alpha(0.2);
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
 * isSourceOrTarget takes one required argument, a node (which can either be a d3 node selection or a string denoting a `node_id`), and one optional argument, which specifies // TODO: Needs docstring
 * The return value is a list of all the related edges, depending on the parameters.
 * @param {Object|string} node - A d3 selection for a node, or a string denoting a node's identification name
 * @param {boolean} [edgeList] - A list with all the edges that you want to check against.
 * @returns {Array} - List of all the edges that are connected to the given node
 */
// TODO: This function essentially doubles with nodeHasEdges...
const isSourceOrTarget = (node, edgeList = graph.edges) => {
    if (typeof node === "string") node = findNode(node);

    let isSource = edgeList.map((d) => d.source.node_id).includes(node.node_id);
    let isTarget = edgeList.map((d) => d.target.node_id).includes(node.node_id);
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
/*
const getRelatedEdges = (node, asSource = true, asTarget = true) => {
    if (typeof node === "string")
        node = findNode(node);

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
*/
const getRelatedEdges = (
    node,
    asSource = true,
    asTarget = true,
    edgeList = undefined,
    returnVal = "nodelist"
) => {
    if (!edgeList) edgeList = store.edges;

    let nodeList = undefined;

    if (typeof node === "string") node = findNode(node);

    if (asSource && asTarget) {
        nodeList = edgeList.filter(
            (edge) => edge.source === node || edge.target === node
        );
    } else if (asSource) {
        nodeList = edgeList.filter((edge) => edge.source === node);
    } else if (asTarget) {
        nodeList = edgeList.filter((edge) => edge.target === node);
    }
    if (returnVal === "nodelist" && nodeList) {
        return nodeList;
    } else if (nodeList) {
        return nodeList.length;
    } else {
        return [];
    }
};

/**
 * selectRelatedEdges takes one required argument, a node (which can either be a d3 node selection or a string denoting a `node_id`).
 * The return value is always true.
 * @param {Object|string} node - A d3 selection for a node, or a string denoting a node's identification name
 * @returns {boolean} - true
 */
const selectRelatedEdges = (node) => {
    if (typeof node === "string") {
        node = findNode(node);
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
    if (typeof node === "string") node = findNode(node);

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
 * styleGraphElements takes no arguments but resets all the different graph elements (nodes, edges, labels) to their original settings.
 * The return value is always true.
 * @returns {boolean} - true
 */
const styleGraphElements = (settings = undefined) => {
    _output("Called", false, styleGraphElements);

    if (!settings)
        settings = settingsFromDashboard('styleGraphElements');

    if (!settings.nodes.communityDetection && document.querySelector('html').classList.contains('has-community')) {
        document.querySelector('html').classList.remove('has-communities');
        // graph.clusters = {}; /* TODO: Technically this should happen here but causes bug in modifySimulation. */
    };

    nodeElements
        .attr("class", (node) => getNodeClass(node))
        .transition()
        .attr("r", (node) => getSize(node, 'r', settings))
        .attr("style", (node) => {
            if (node.cluster && settings.nodes.communityDetection) {
                return `fill: ${RGBToHSL(graph.clusterColors[node.cluster], -30)};`;
            } else {
                return "";
            }
        });

    edgeElements
        .attr("class", (e) => getEdgeClass(e))
        .transition()
        .style("stroke-width", (e) => getEdgeStrokeWidth(e, settings));

    if (!settings.nodes.stickyNodes) {
        textElements.attr("", (node) => {
            node.fx = null;
            node.fy = null;
        });
    }

    textElements
        .attr("class", (node) => {
            if (settings.nodes.communityDetection) {
                return `label`;
            } else {
                return `label`;
            }
        })
        .attr("style", (node) => {
            if (settings.nodes.communityDetection) {
                return `fill: ${graph.clusterColors[node.cluster]};`; //text-shadow: 0 0 4px #00000052;
            } else {
                return ``;
            }
        })
        .transition()
        .duration(750)
        .attr("opacity", 1)
        .attr("font-size", (node) => getSize(node, "text", settings));

    return true;
};

/**
 * toggleNode takes one required argument, the d3 selector for a given node. This is the function that handles the "click" event on the node.
 * The return value is always true.
 * @param {Object} node - d3 selector for a given node.
 * @returns {boolean} - true
 */
const toggleNode = (node) => {
    if (nodeIsSelected(node)) {
        window.nodeSelected = undefined;
        hide("#nodeEdgeInfo");
        styleGraphElements();
    } else {
        window.nodeSelected = true;
        styleGraphElements();
        deselectNodes(node);
        selectRelatedEdges(node);
        setNodeEdgeInfo(node);
    }
    return true;
};

/**
 * toggleEdge takes one required argument, the d3 selector for a given edge. This is the function that handles the "click" event on the edge.
 * The return value is always true.
 * @param {Object} edge - d3 selector for a given edge.
 * @returns {boolean} - true
 */
const toggleEdge = (edge) => {
    if (edgeIsSelected(edge)) {
        window.edgeSelected = undefined;
        hide("#nodeEdgeInfo");
        styleGraphElements();
    } else {
        window.edgeSelected = true;
        deselectEdges(edge);
        setNodeEdgeInfo(edge);
    }
    return true;
};

/**
 * modifyNodeDegrees takes no arguments and just makes sure that each node in the current graph has a `currentDegree` set to match its number of edges.
 * The return value is always true.
 * @returns {boolean} - true
 */
const modifyNodeDegrees = () => {
    graph.nodes.forEach((n) => {
        n.currentDegree = nodeHasEdges(n, true);
        n.degrees.current_calculated = nodeHasEdges(n, true);
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
 * modifySimulation takes no arguments but is the function that runs after updateElement — every time that the d3 network has been filtered, and the simulation needs to be restarted.
 * The return value is always true.
 */
const modifySimulation = (settings) => {
    _output('Called', false, modifySimulation)

    if (!settings)
        settings = settingsFromDashboard('modifySimulation');
    
    if (settings.force.layoutClustering && settings.nodes.communityDetection) {
        const clustering = (alpha) => {
            graph.nodes.forEach((d) => {
                const cluster = graph.clusters[d.cluster];
                if (cluster === d) return;
                let x = d.x - cluster.x;
                let y = d.y - cluster.y;
                let l = Math.sqrt(x * x + y * y);
                const r = d.r + cluster.r;
                if (l !== r) {
                    l = ((l - r) / l) * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    cluster.x += x;
                    cluster.y += y;
                }
            });
        }
        graph.simulation.force('cluster', clustering);
    } else {
        graph.simulation.force('cluster', undefined);
    }

    graph.simulation.force("link").links(graph.edges);
    graph.simulation.nodes(graph.nodes);
    if (settings.force.layoutCenter) {
        graph.simulation.force("center", d3.forceCenter());
        graph.simulation.force("center").strength = 1;
    } else {
        graph.simulation.force("center", null);
    }
    if (settings.force.layoutForceX) {
        graph.simulation.force("forceX", d3.forceX());
    } else {
        graph.simulation.force("forceX", null);
    }
    if (settings.force.layoutForceX) {
        graph.simulation.force("forceY", d3.forceY());
    } else {
        graph.simulation.force("forceY", null);
    }
    if (settings.force.layoutCharge) {
        graph.simulation.force("charge", d3.forceManyBody());
        graph.simulation.force("charge").strength(settings.force.charge);
    } else {
        graph.simulation.force("charge", null);
    }
    if (settings.force.layoutCollide) {
        var collide = d3.bboxCollide((d,i) => {
                let width = document.querySelector(`text[data-node="${d.node_id}"]`).getBBox().width
                let height = document.querySelector(`text[data-node="${d.node_id}"]`).getBBox().height
                let divider = 2;
                return [[-width/divider, -height/divider],[width/divider, height/divider]]
            })
            .strength(1)
            .iterations(2)
        graph.simulation.force("collide", collide);
    } else {
        graph.simulation.force("collide", null);
    }

    graph.simulation.force("link").strength(settings.force.linkStrength);

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
    let classes = "";
    if (window.toggledCommentedElements) {
        classes = "node";
        classes += node.has_comments
            ? ` ${node.category} has-comments`
            : " disabled";
    } else {
        classes = "node " + node.category;
        classes += node.has_comments ? " has-comments" : "";
    }
    // if (settings.communityDetection && node.cluster) classes = `node cluster-${node.cluster}` // move this to a fill instead (see `getClusterColor`)
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
const getEdgeStrokeWidth = (edge, settings) => { //, weightFromCurrent=undefined, min, max) => {
    /*
    if (weightFromCurrent===undefined || edgeMultiplier===undefined) {
        let settings = settingsFromDashboard('getEdgeStrokeWidth');
        if (!weightFromCurrent)
            weightFromCurrent = settings.edges.weightFromCurrent;
        if (!edgeMultiplier)
            edgeMultiplier = settings.edges.edgeMultiplier;
    }
    */
    if (!settings)
        settings = settingsFromDashboard('getEdgeStrokeWidth');

    let weightScale = edgeScale(settings);
    
    let evalWeight = edge.weights[settings.edges.weightFrom];
    
    return weightScale(evalWeight) * +settings.edges.edgeMultiplier + "px";
};

/**
 * getNodeClass takes one required argument, the d3 selector for a given node. It is the function that provides the class for any given node in the visualization.
 * The return value is ... // TODO: Needs docstring
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
const getSize = (node, type = "r", settings = undefined) => {
    if (!settings)
        console.error('Settings must be passed to an iterative function like getSize.')

    let nodeMultiplier = settings.nodes.nodeMultiplier;
    let degree = undefined;

    if (settings.nodes.rFrom === 'currentDegree') {
        degree = node.currentDegree;
    } else if (settings.nodes.rFrom === 'degrees__degree') {
        degree = node.degrees.degree;
    } else if (settings.nodes.rFrom === 'betweenness_centrality') {
        degree = node.centralities.betweenness_centrality_100x;
    } else if (settings.nodes.rFrom === 'closeness_centrality') {
        degree = node.centralities.closeness_centrality_100x;
    } else if (settings.nodes.rFrom === 'degree_centrality') {
        degree = node.centralities.degree_centrality_100x;
    } else if (settings.nodes.rFrom === 'eigenvector_centrality') {
        degree = node.centralities.eigenvector_centrality_100x;
    } else {
        degree = 1;
    }

    let yScale = nodeScale(settings);

    if (window.toggledCommentedElements === true) {
        if (node.has_comments) {
            return 10 * nodeMultiplier;
        } else {
            return 5 * nodeMultiplier;
        }
    }

    if (type === "r") {
        return yScale(degree) * nodeMultiplier;
    } else if (type === "text") {
        return yScale(degree) * nodeMultiplier * 1.5;
    }
};

const findNode = (node_id, nodeList = store.nodes) => {
    return nodeList.find((node) => node.node_id === node_id);
};

const hasFixedNodes = () => {
    return graph.nodes.map((n) => n.fx).every((d) => d === null);
};
