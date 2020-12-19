
/**
 * filterNodes takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const filterNodes = (settings) => {
    store.nodes.forEach((n) => {
        // if (n.degree > settings.nodes.minDegree) console.log(n);
        if (n.degree >= settings.nodes.minDegree && !n.inGraph) {
            // should not be filtered but is not in graph so add it!
            n.inGraph = true;
            graph.nodes.push(n); // console.log(n);
        } else if (n.degree >= settings.nodes.minDegree && n.inGraph) {
            // should not be filtered but is already in graph so no need to do anything
        } else if (n.degree < settings.nodes.minDegree && n.inGraph) {
            // in graph but should not be
            n.inGraph = false;
            graph.nodes.forEach((o, i) => {
                if (n.node_id === o.node_id) {
                    graph.nodes.splice(i, 1);
                }
            });
        } else {
            n.inGraph = false;
            graph.nodes.forEach((o, i) => {
                if (n.node_id === o.node_id) {
                    graph.nodes.splice(i, 1);
                }
            });
        }
    });
};

/**
 * filterEdges takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const filterEdges = (settings) => {
    store.edges.forEach((e) => {
        e.calibrated_weight = e.found.length;

        let compareWeightValue =
            settings.edges.weightFromCurrent === true
                ? e.calibrated_weight
                : e.weight;

        if (compareWeightValue < settings.edges.minWeight && !e.inGraph) {
            // edge is lower than minWeight and not inGraph so leave it out
            e.inGraph = false;
        } else if (compareWeightValue < settings.edges.minWeight && e.inGraph) {
            // edge is lower than minWeight and in graph so remove it!
            e.inGraph = false;
            graph.edges.forEach((o, i) => {
                if (e.edge_id === o.edge_id) {
                    graph.edges.splice(i, 1);
                }
            });
        } else if (
            e.range.start &&
            +e.range.start.substring(0, 4) <= settings.edges.startYear &&
            !e.inGraph
        ) {
            // edge is earlier than startYear and not inGraph so leave it out"
            e.inGraph = false;
        } else if (
            e.range.start &&
            +e.range.start.substring(0, 4) <= settings.edges.startYear &&
            e.inGraph
        ) {
            // edge is earlier than startYear and inGraph so drop it
            e.inGraph = false;
            graph.edges.forEach((o, i) => {
                if (e.edge_id === o.edge_id) {
                    graph.edges.splice(i, 1);
                }
            });
        } else if (
            e.range.end &&
            +e.range.end.substring(0, 4) >= settings.edges.endYear &&
            !e.inGraph
        ) {
            // range end is higher than endYear and not inGraph so leave it out
            e.inGraph = false;
        } else if (
            e.range.end &&
            +e.range.end.substring(0, 4) >= settings.edges.endYear &&
            e.inGraph
        ) {
            // edge has later range than endYear and inGraph so drop it"
            e.inGraph = false;
            graph.edges.forEach((o, i) => {
                if (e.edge_id === o.edge_id) {
                    graph.edges.splice(i, 1);
                }
            });
        } else {
            if (e.source.inGraph && e.target.inGraph && !e.inGraph) {
                // should not be filtered but is not in graph so add it!
                e.inGraph = true;
                graph.edges.push(e);
            } else if (e.source.inGraph && e.target.inGraph && e.inGraph) {
                // should not be filtered but is already in graph so no need to do anything
            } else if ((e.source.inGraph || e.target.inGraph) && e.inGraph) {
                // in graph but should not be
                e.inGraph = false;
                graph.edges.forEach((o, i) => {
                    if (e.edge_id === o.edge_id) {
                        graph.edges.splice(i, 1);
                    }
                });
            } else {
                e.inGraph = false;
                graph.edges.forEach((o, i) => {
                    if (e.edge_id === o.edge_id) {
                        graph.edges.splice(i, 1);
                    }
                });
            }
        }
    });
};

/**
 * filter takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const filter = () => {
    let settings = getSettings();

    resetNodesAndEdges();
    hide("#nodeEdgeInfo");

    filterNodes(settings);
    filterEdges(settings);

    modifyGraphNodes();

    if (settings.nodes.autoClearNodes) {
        dropNodesWithNoEdges();
    }

    updateInfo();
};
