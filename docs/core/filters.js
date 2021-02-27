"use strict";

const dropNode = (node) => {
    if (node.inGraph) {
        graph.nodes.forEach((o, i) => {
            if (node.node_id === o.node_id) {
                if (ERROR_LEVEL > 1) loading(`dropping node ${o.node_id}...`);
                graph.nodes.splice(i, 1);
                node.inGraph = false;
                return true;
            }
        });
    }
};

const dropEdge = (edge) => {
    graph.edges.forEach((o, i) => {
        if (edge.edge_id === o.edge_id) {
            if (ERROR_LEVEL > 1) loading(`dropping edge ${o.edge_id}...`);
            graph.edges.splice(i, 1);
            edge.inGraph = false;
            return true;
        }
    });
};

const addNode = (node) => {
    if (!node.inGraph) {
        graph.nodes.push(node);
        node.inGraph = true;
    }
};

const addEdge = (edge) => {
    edge.inGraph = true;
    graph.edges.push(edge);
};

/**
 * filterNodes takes one optional argument, which is a list of nodes to keep in the graph.nodes list. The function serves to run through all of the store.nodes and adding/removing nodes from graph.nodes, depending on filter values.
 * The return value is always true.
 * @returns {boolean} - true
 */
const filterNodes = (nodeList = []) => {
    loading("filterNodes called...");
    if (!nodeList.length) {
        let settings = getSettings();
        store.nodes.forEach((node) => {
            if (node.degree >= settings.nodes.minDegree) {
                addNode(node);
                /* potential to add more filters here...*/
            } else if (
                settings.edges.startYear > d3.min(node.sourceRange) &&
                settings.edges.endYear < d3.max(node.sourceRange)
            ) {
                addNode(node);
            } else {
                dropNode(node);
            }
        });
    } else {
        store.nodes.forEach((node) => {
            nodeList.includes(node) ? addNode(node) : dropNode(node);
        });
    }
    return true;
};

/**
 * Returns whether a node exists in the current graph or not.
 */
const nodeInGraph = (node) => {
    return graph.nodes.includes(node);
}

const getValidEdges = (inGraph=false) => {
    return store.edges.filter(e=>e.passes.startYear && e.passes.endYear && e.passes.minWeight && nodeInGraph(e.source) && nodeInGraph(e.target) && e.inGraph === inGraph);
}

const getInvalidEdges = (inGraph=true) => {
    return store.edges.filter(e=>(!e.passes.startYear && !e.passes.endYear && !e.passes.minWeight) && nodeInGraph(e.source) && nodeInGraph(e.target) && e.inGraph === inGraph);
}

/**
 * filterEdges takes one optional argument // TODO: Fix this //, and serves to run through all of the store.edges and adding/removing edges from graph.edges, depending on filter values.
 * The return value is always true.
 * @returns {boolean} - true
 */
const filterEdges = (edgeList = [], change = true) => {
    loading("filterEdges called...");

    if (edgeList.length) {
        console.error('filtering using lists is not implemented.')
        return true;
    }

    getValidEdges().forEach(e=>{
        addEdge(e);
    })

    getInvalidEdges().forEach(e=>{
        dropEdge(e);
    })

    return true;

    store.edges.filter(e=>e.passes.startYear && e.passes.endYear && e.passes.minWeight && !e.inGraph).forEach(e=>addEdge(e));
    store.edges.filter(e=>(!e.passes.startYear || !e.passes.endYear || !e.passes.minWeight) && e.inGraph).forEach(e=>dropEdge(e));
    console.log(store.edges);

    return true;

    if (!edgeList.length) {
        let settings = getSettings().edges;
        store.edges.forEach((edge) => {
            edge.calibrated_weight = edge.found.length;

            let compareWeightVal =
                settings.weightFromCurrent === true
                    ? edge.calibrated_weight
                    : edge.weight;

            if (settings.minWeight) {
                if (compareWeightVal < settings.minWeight && !edge.inGraph) {
                    // edge is lower than minWeight and not inGraph so leave it out
                    if (change) edge.inGraph = false;
                    if (!change) edgeIDList.pop(edge.edge_id);
                } else if (
                    compareWeightVal < settings.minWeight &&
                    edge.inGraph
                ) {
                    // edge is lower than minWeight and in graph so remove it!
                    if (change) dropEdge(edge);
                    if (!change) edgeIDList.pop(edge.edge_id);
                }
            } else if (
                edge.range.start &&
                +edge.range.start.substring(0, 4) <= settings.startYear &&
                !edge.inGraph
            ) {
                // edge is earlier than startYear and not inGraph so leave it out
                if (change) edge.inGraph = false;
                if (!change) edgeIDList.pop(edge.edge_id);
            } else if (
                edge.range.start &&
                +edge.range.start.substring(0, 4) <= settings.startYear &&
                edge.inGraph
            ) {
                // edge is earlier than startYear and inGraph so drop it
                if (change) dropEdge(edge);
                if (!change) edgeIDList.pop(edge.edge_id);
            } else if (
                edge.range.end &&
                +edge.range.end.substring(0, 4) >= settings.endYear &&
                !edge.inGraph
            ) {
                // range end is higher than endYear and not inGraph so leave it out
                if (change) edge.inGraph = false;
                if (!change) edgeIDList.pop(edge.edge_id);
            } else if (
                edge.range.end &&
                +edge.range.end.substring(0, 4) >= settings.endYear &&
                edge.inGraph
            ) {
                // edge has later range than endYear and inGraph so drop it"
                if (change) dropEdge(edge);
                if (!change) edgeIDList.pop(edge.edge_id);
            } else {
                if (
                    edge.source.inGraph &&
                    edge.target.inGraph &&
                    !edge.inGraph
                ) {
                    // should not be filtered but is not in graph so add it!
                    if (change) addEdge(edge);
                } else if (
                    edge.source.inGraph &&
                    edge.target.inGraph &&
                    edge.inGraph
                ) {
                    // should not be filtered but is already in graph so no need to do anything
                } else if (
                    (edge.source.inGraph || edge.target.inGraph) &&
                    edge.inGraph
                ) {
                    // in graph but should not be
                    if (change) dropEdge(edge);
                    if (!change) edgeIDList.pop(edge.edge_id);
                } else {
                    if (change) dropEdge(edge);
                    if (!change) edgeIDList.pop(edge.edge_id);
                }
            }
        });
        //console.log(`${graph.edges.length} after`)
    } else {
        // console.log('have edgeList');
        // console.log(edgeList);
        store.edges.forEach((edge) => {
            if (edgeList.includes(edge)) {
                if (!edge.inGraph) {
                    // console.log('edge is not in graph, so add it...')
                    if (change) addEdge(edge);
                } else {
                    // console.log('edge is already in graph and has the correct mark...')
                }
            } else {
                // console.log(`drop edge ${edge.edge_id}`)
                if (change) dropEdge(edge);
                if (!change) edgeIDList.pop(edge.edge_id);
            }
        });
    }
    if (change) return true;
    if (!change) return edgeIDList;
};

const clusters = {};

/**
 * filter takes two optional arguments // TODO: Fix this!! //, and serves to run subordinate functions in the correct order when filtering the entire network visualization.
 * The return value is always true.
 * @returns {boolean} - true
 */
const filter = (nodeList = [], edgeList = [], change = true) => {
    loading("Filter called...");
    let settings = getSettings();

    hide("#nodeEdgeInfo");

    filterNodes(nodeList);
    filterEdges(edgeList, change);

    modifyNodeDegrees();

    if (settings.nodes.autoClearNodes) {
        filterNodesWithoutEdge();
    }

    updateElements();

    if (settings.nodes.communityDetection) {
        communityDetection();
        textElements.text((node)=>`${node.cluster}. ${node.display}`);
    }
    graph.nodes.forEach((node) => {
        node.r = getSize(node);
    });

    if (graph.nodes.length < 300)
        graph.networkCount = getUniqueNetworks(undefined, "counter");

    graph.nodes.forEach(node=>{
        node.html_info = generateNodeInfoHTML(node);
    })
    graph.edges.forEach(edge=>{
        edge.html_info = generateEdgeInfoHTML(edge);
    })

    updateGraphElements();
    updateInfo();

    return true;
};

// TODO: Needs docstring
const findNearestNeighbors = (node) => {
    return [
        ...new Set([
            ...node.allEdges.filter((n) => n.inGraph).map((e) => e.source),
            ...node.allEdges.filter((n) => n.inGraph).map((e) => e.target),
        ]),
    ].filter((n) => n !== node);
};

// TODO: Needs docstring
const getEgoNetwork = (node, maxIterations = 1000) => {
    if (typeof node === "string") {
        node = lookupNode(node);
    }

    let nearestNeighbors = findNearestNeighbors(node);
    let allNeighbors = nearestNeighbors;
    let stop = false;
    let i = 0;

    while (!stop) {
        i += 1;
        if (i >= maxIterations) {
            stop = true;
        }

        let lengthBefore = allNeighbors.length;
        let currentNeighbors = [...allNeighbors];
        currentNeighbors.forEach((node) => {
            if (!allNeighbors.includes(node)) allNeighbors.push(node);
            allNeighbors = [
                ...new Set([...allNeighbors, ...findNearestNeighbors(node)]),
            ];
        });
        //console.log(`iteration ${i}`, currentNeighbors)

        if (allNeighbors.length - lengthBefore === 0) stop = true;
    }

    return allNeighbors;
};

// TODO: Needs docstring and I think there is an easier/faster way to do this...
const getUniqueNetworks = (nodeList, returnVal = "nodes") => {
    if (!nodeList) nodeList = graph.nodes;

    let networks = [];

    nodeList.forEach((node) => {
        let network = JSON.stringify(
            getEgoNetwork(node)
                .map((d) => d.node_id)
                .sort()
        );
        if (!networks.includes(network)) networks.push(network);
    });

    networks = networks.map(JSON.parse);

    if (returnVal === "nodeList") return networks;

    if (returnVal === "counter") return networks.length;

    if (returnVal === "nodes") {
        networks.forEach((network, i) => {
            networks[i] = network.map((node) => lookupNode(node, graph.nodes));
        });

        return networks;
    }
};

/**
 * egoNetworkOn takes X argument/s... TODO: Needs docstring
 * The return value is ...
 */
const egoNetworkOn = async (node) => {
    loading("egoNetworkOn called...");
    d3.select("#egoNetwork").classed("d-none", false);
    d3.select("#egoNetwork > #node").html(node.id);
    let egoNetwork = getEgoNetwork(node);
    const result = await filter(egoNetwork);
    //updateElements();
    restartSimulation();
    resetDraw();

    window.egoNetwork = true;
};

/**
 * egoNetworkOff takes X argument/s... TODO: Needs docstring
 * The return value is ...
 */
const egoNetworkOff = async (node) => {
    loading("egoNetworkOff called...");
    d3.select("#egoNetwork").classed("d-none", true);
    const result = await filter();
    //updateElements();
    restartSimulation();
    resetDraw();

    window.egoNetwork = undefined;
};

/**
 * toggleEgoNetwork takes X argument/s... TODO: Needs docstring
 * The return value is ...
 */
const toggleEgoNetwork = async (
    node,
    toggleSettings = true,
    force = undefined
) => {
    loading("toggleEgoNetwork called...");
    // filter nodes based on a given node
    if (window.egoNetwork || force === "off") {
        console.log("ego network already active - resetting network view...");
        await egoNetworkOff();
        updateElements();
        updateGraphElements();

        if (toggleSettings) {
            //console.log("--> show quick access and settings");
            show("#settings");
            show("#infoContainer");
        }
    } else {
        console.log("filtering out an ego network based on " + node.node_id);
        await egoNetworkOn(node);
        updateElements();
        updateGraphElements();

        d3.select("#main").on("click", () => {
            if (d3.event.metaKey && window.egoNetwork) {
                console.log(
                    "svg command + click detected while ego network active - resetting network view..."
                );
                resetLocalStorage();
            }
        });

        if (toggleSettings) {
            //console.log("--> hiding quick access and settings");
            hide("#settings");
            hide("#infoContainer");
        }
    }
};

/**
 * toggleCommentedElements takes 0 arguments but changes the "view" of the network to show the "comments" behind edges and nodes.
 * The return value is always true.
 * @returns {boolean} - true
 */
const toggleCommentedElements = (force = undefined) => {
    if (window.toggledCommentedElements || force === "off") {
        window.toggledCommentedElements = false;
        filter();
        d3.select("#popup-info").classed("d-none", true);
        restartSimulation();
    } else if (!window.toggledCommentedElements || force === "on") {
        window.toggledCommentedElements = true;
        let nodesWithComments = graph.nodes.filter((n) => n.has_comments);
        let edgesWithComments = [
            ...graph.edges.filter((e) => e.has_comments),
            ...graph.edges.filter((e) => e.has_general_comments),
        ];
        edgesWithComments.forEach((edge) => {
            nodesWithComments.push(edge.source);
            nodesWithComments.push(edge.target);
        });
        filter(nodesWithComments, edgesWithComments);
        restartSimulation();
    }
    d3.select("#commentedNodes")
        .classed("bg-dark", !window.toggledCommentedElements)
        .classed("bg-warning", window.toggledCommentedElements);
    return true;
};

/**
 * filterNodesWithoutEdge takes no arguments but loops through the visualization, looking for unconnected nodes.
 * The return value is an object with information about the dropped nodes.
 * @returns {Object} - Object with two properties, `runs` denotes how many iterations the function ran through, and `dropped` with a list of all node_ids that were removed.
 */
const filterNodesWithoutEdge = () => {
    let returnObject = {
        runs: 0,
        dropped: [],
    };
    while (hasUnconnectedNodes()) {
        graph.nodes.forEach((node) => {
            if (nodeHasEdges(node) === false) {
                // console.log(`——> remove node ${node.node_id}!`);
                graph.nodes.forEach((o, i) => {
                    if (node.node_id === o.node_id) {
                        graph.nodes.splice(i, 1);
                        returnObject.dropped.push(node.node_id);
                    }
                });
            }
        });
        returnObject.runs += 1;
    }

    if (returnObject.dropped.length > 0) {
        troubleshoot(true); // ensures that all nodes are correctly represented in
        // console.log('running updateElements in filterNodesWithoutEdge')
        // updateElements();
        updateInfo();
    }

    return returnObject; // could be passed to a debugMessage thus: debugMessage(`Dropped nodes with no edges (after ${runs} runs).`, "Information");
};
