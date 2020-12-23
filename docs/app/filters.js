"use strict";

const dropNode = (node) => {
    if (node.inGraph) {
        graph.nodes.forEach((o, i) => {
            if (node.node_id === o.node_id) {
                loading(`dropping node ${o.node_id}...`)
                graph.nodes.splice(i, 1);
                node.inGraph = false;
            }
        });
    };
}


const dropEdge = (edge) => {
    graph.edges.forEach((o, i) => {
        if (edge.edge_id === o.edge_id) {
            loading(`dropping edge ${o.edge_id}...`)
            graph.edges.splice(i, 1);
            edge.inGraph = false;
        }
    });
}


const addNode = (node) => {
    if (!node.inGraph) {
        graph.nodes.push(node);
        node.inGraph = true;
    }
}


const addEdge = (edge) => {
    edge.inGraph = true;
    graph.edges.push(edge);
}


/**
 * filterNodes takes one optional argument, which is a list of nodes to keep in the graph.nodes list. The function serves to run through all of the store.nodes and adding/removing nodes from graph.nodes, depending on filter values.
 * The return value is always true.
 * @returns {boolean} - true
 */
const filterNodes = (nodeList = []) => {
    loading('filterNodes called...');
    if (!nodeList.length) {
        let settings = getSettings().nodes;
        store.nodes.forEach((node) => {
            if (node.degree >= settings.minDegree) {
                addNode(node);
            /* potential to add more filters here...*/
            } else if (getSettings().edges.startYear > d3.min(node.sourceRange) && getSettings().edges.endYear < d3.max(node.sourceRange)) {
                addNode(node);
            } else {
                dropNode(node);
            }
        });
    } else {
        store.nodes.forEach(node => {
            nodeList.includes(node) ? addNode(node) : dropNode(node);
        })
    }
    return true;
};


/**
 * filterEdges takes one optional argument // TODO: Fix this //, and serves to run through all of the store.edges and adding/removing edges from graph.edges, depending on filter values.
 * The return value is always true.
 * @returns {boolean} - true
 */
const filterEdges = (edgeList = [], change = true) => {
    loading('filterEdges called...');
    let list = store.edges.map(n=>n.edge_id);
    if (!edgeList.length) {
        let settings = getSettings().edges;
        store.edges.forEach((edge) => {
            edge.calibrated_weight = edge.found.length;

            let compareWeightVal =
                settings.weightFromCurrent === true
                    ? edge.calibrated_weight
                    : edge.weight;

            if (settings.minDegree) {
                if (compareWeightVal < settings.minWeight && !edge.inGraph) {
                    // edge is lower than minWeight and not inGraph so leave it out
                    if (change) edge.inGraph = false;
                    if (!change) list.pop(edge.edge_id)
                } else if (compareWeightVal < settings.minWeight && edge.inGraph) {
                    // edge is lower than minWeight and in graph so remove it!
                    if (change) dropEdge(edge);
                    if (!change) list.pop(edge.edge_id)
                }
            } else if (
                edge.range.start &&
                +edge.range.start.substring(0, 4) <= settings.startYear &&
                !edge.inGraph
            ) {
                // edge is earlier than startYear and not inGraph so leave it out
                if (change) edge.inGraph = false;
                if (!change) list.pop(edge.edge_id)
            } else if (
                edge.range.start &&
                +edge.range.start.substring(0, 4) <= settings.startYear &&
                edge.inGraph
            ) {
                // edge is earlier than startYear and inGraph so drop it
                if (change) dropEdge(edge);
                if (!change) list.pop(edge.edge_id)
            } else if (
                edge.range.end &&
                +edge.range.end.substring(0, 4) >= settings.endYear &&
                !edge.inGraph
            ) {
                // range end is higher than endYear and not inGraph so leave it out
                if (change) edge.inGraph = false;
                if (!change) list.pop(edge.edge_id)
            } else if (
                edge.range.end &&
                +edge.range.end.substring(0, 4) >= settings.endYear &&
                edge.inGraph
            ) {
                // edge has later range than endYear and inGraph so drop it"
                if (change) dropEdge(edge);
                if (!change) list.pop(edge.edge_id)
            } else {
                if (edge.source.inGraph && edge.target.inGraph && !edge.inGraph) {
                    // should not be filtered but is not in graph so add it!
                    if (change) addEdge(edge)
                } else if (edge.source.inGraph && edge.target.inGraph && edge.inGraph) {
                    // should not be filtered but is already in graph so no need to do anything
                } else if ((edge.source.inGraph || edge.target.inGraph) && edge.inGraph) {
                    // in graph but should not be
                    if (change) dropEdge(edge);
                    if (!change) list.pop(edge.edge_id)
                } else {
                    if (change) dropEdge(edge);
                    if (!change) list.pop(edge.edge_id)
                }
            }
        });
        console.log(`${graph.edges.length} after`)
    } else {
        // console.log('have edgeList');
        // console.log(edgeList);
        store.edges.forEach(edge => {
            if (edgeList.includes(edge)) {
                if (!edge.inGraph) {
                    // console.log('edge is not in graph, so add it...')
                    if (change) addEdge(edge)
                } else {
                    // console.log('edge is already in graph and has the correct mark...')
                }
            } else {
                // console.log(`drop edge ${edge.edge_id}`)
                if (change) dropEdge(edge);
                if (!change) list.pop(edge.edge_id)
            }
        })
    }
    if (change) return true;
    if (!change) return list;
};

const clusters = {};
/**
 * filter takes two optional arguments // TODO: Fix this!! //, and serves to run subordinate functions in the correct order when filtering the entire network visualization.
 * The return value is always true.
 * @returns {boolean} - true
 */
const filter = (nodeList = [], edgeList = [], change = true) => {
    loading('filter called...')

    hide("#nodeEdgeInfo");
    
    filterNodes(nodeList);
    filterEdges(edgeList, change);
    
    modifyNodeDegrees();
    
    if (getSettings().nodes.autoClearNodes) {
        filterNodesWithoutEdge();
    }
    
    updateElements();

    // TODO: I am using JLevain here. Are there other community detectors out there? Learn more about algorithms...
    // See invention of Louvain method here https://arxiv.org/pdf/0803.0476.pdf
    var nodeData = graph.nodes.map((d) => d.node_id);
    var linkData = graph.edges.map((d) => {return {source: d.source.node_id, target: d.target.node_id, weight: d.weight}; });

    var community = jLouvain()
        .nodes(nodeData)
        .edges(linkData);

    var result  = community();
    graph.nodes.forEach(node => {
        node.cluster = result[node.node_id];
    })
    
    resetGraphElements();
    updateInfo();

    return true;
};

/**
 * getUniqueNetworks takes X argument/s... TODO: Finish this.
 * The return value is ...
 * // TODO: This function is _extremely_ heavy at this time.
 */
const getUniqueNetworks = (nodeList = graph.nodes) => {
    loading('getUniqueNetworks called...')
    let networks = []
    let processed = []
    nodeList.forEach(node => {
        if (processed.includes(node.node_id)) {

        } else {
            let network = getEgoNetwork(node).sort((a, b) => (a.node_id > b.node_id) ? 1 : -1);
            if (network.length) {
                let listOfIDs = network.map(d=>{
                    if (d != undefined) { return d.node_id } else { return {}; }
                }).join(',')
                if (!networks.includes(listOfIDs)) {
                    networks.push(listOfIDs);
                }
                processed.push([...listOfIDs])
            }
        };
    })
    networks.forEach((list, i) => {
        let nodes = list.split(',')
        nodes.forEach((node_id, i) => {nodes[i] = lookupNode(node_id);})
        networks[i] = nodes;
    })
    return networks;
}

/**
 * getEgoNetwork takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const getEgoNetwork = (node, limit=10000) => { // limit automatically set to 10,000
    loading('getEgoNetwork called...')
    if (typeof(node) === "string") {
        node = lookupNode(node);
    }

    if (typeof(node) !== "object") {
        console.error(`node is of the wrong type (${typeof(node)})`)
        return false;
    }

    if (limit===undefined) {
        console.warn('Warning: running getEgoNetwork with no limit can cause browser issues. Set a high limit instead')
    }

    // recursive search for related nodes sprawling from original node
    let nodeIDs = getRelated(node).secondaryNodeIDs;
    let cont = true;
    let iteration = 0;
    let newNodes = []
    while (cont) {
        iteration += 1;
        if (limit && iteration >= limit || limit === 0) {
            //console.log('hit limit')
            cont = false;
        } else if (limit && iteration < limit+1 || !limit) { //run one extra...
            //console.log('searching...')
            newNodes = []
            let startVal = nodeIDs.length;
            let nextNodes = []
            nodeIDs.forEach(n=>{
                nextNodes = getRelated(n).secondaryNodeIDs;
                nextNodes.forEach(nextNode => { 
                    newNodes.push(nextNode);
                });
            })
            newNodes.forEach(n=>{if (!nodeIDs.includes(n)) { nodeIDs.push(n); }})
            let endVal = nodeIDs.length;
            if (endVal - startVal > 0) {
                // console.log(`--> iteration ${iteration} found ${newNodes.length} connected nodes (${endVal - startVal} unique)`)
                cont = true;
            } else {
                cont = false
            }
        }
    }

    let nodes = []
    nodeIDs.forEach(node_id=> {
        nodes.push(lookupNode(node_id));
    })

    return nodes;
}

/**
 * egoNetworkOn takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const egoNetworkOn = async (node) => {
    loading('egoNetworkOn called...')
    d3.select('#egoNetwork').classed('d-none', false);
    d3.select('#egoNetwork > #node').html(node.id);
    let egoNetwork = getEgoNetwork(node);
    const result = await filter(egoNetwork);
    //updateElements();
    restartSimulation();
    resetDraw();
    
    window.egoNetwork = true;
}

/**
 * egoNetworkOff takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const egoNetworkOff = async (node) => {
    loading('egoNetworkOff called...')
    d3.select('#egoNetwork').classed('d-none', true);
    const result = await filter();
    //updateElements();
    restartSimulation();
    resetDraw();
    
    window.egoNetwork = undefined;
}

/**
 * toggleEgoNetwork takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const toggleEgoNetwork = async (node, toggleSettings = true, force = undefined) => {
    loading('toggleEgoNetwork called...')
    // filter nodes based on a given node
    if (window.egoNetwork || force === "off") {
        console.log("ego network already active - resetting network view...");
        await egoNetworkOff();
        updateElements();
        resetGraphElements();

        if (toggleSettings) {
            //console.log("--> show quick access and settings");
            show("#settings");
            show("#infoContainer");
        }
    } else {
        console.log("filtering out an ego network based on " + node.node_id);
        await egoNetworkOn(node);
        updateElements();
        resetGraphElements();

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
    if (window.toggledCommentedElements || force === 'off') {
        window.toggledCommentedElements = false;
        filter();
        d3.select('#popup-info').classed('d-none', true);
        restartSimulation()
    } else if (!window.toggledCommentedElements || force === 'on') {
        window.toggledCommentedElements = true;
        let nodesWithComments = graph.nodes.filter(n => n.has_comments);
        let edgesWithComments = [...graph.edges.filter(e => e.has_comments), ...graph.edges.filter(e => e.has_general_comments)]
        edgesWithComments.forEach(edge => {
            nodesWithComments.push(edge.source);
            nodesWithComments.push(edge.target);
        })
        filter(nodesWithComments, edgesWithComments);
        restartSimulation()
    }
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