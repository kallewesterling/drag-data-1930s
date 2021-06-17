const sortedCentrality = (
    cat = "betweenness_centrality",
    desc = false,
    current = false
) => {
    /*
    Example use:
        To get betweenness centralities sorted descending for the entire graph:
        sortedCentrality('betweenness_centrality', true).map(node=>{return {'node_id': node.node_id, 'centrality': node.centralities.betweenness_centrality_100x}})

        To get betweenness centralities sorted descending for current graph:
        sortedCentrality('betweenness_centrality', true, true).map(node=>{return {'node_id': node.node_id, 'centrality': node.currentCentralities.betweenness_centrality_100x}})
    */

    const cmp = (keyA, keyB, desc) => {
        if (desc) {
            if (keyA > keyB) return -1;
            if (keyA < keyB) return 1;
        } else {
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
        }
        return 0;
    };

    if (current) {
        setCurrentCentralities();
        return graph.nodes.sort(function (a, b) {
            var keyA = a.currentCentralities[`${cat}_100x`],
                keyB = b.currentCentralities[`${cat}_100x`];

            return cmp(keyA, keyB, desc);
        });
    } else {
        return graph.nodes.sort(function (a, b) {
            var keyA = a.centralities[`${cat}_100x`],
                keyB = b.centralities[`${cat}_100x`];

            return cmp(keyA, keyB, desc);
        });
    }
};

const setCurrentCentralities = () => {
    var G = new jsnx.Graph();
    G.addNodesFrom(graph.nodes.map((node) => node.node_id));
    G.addEdgesFrom(
        graph.edges.map((edge) => [edge.source.node_id, edge.target.node_id])
    );
    graph.nodes.forEach((node) => (node.currentCentralities = {}));

    let betweennessCentralities = undefined,
        eigenvectorCentralities = undefined;

    try {
        betweennessCentralities = jsnx.betweennessCentrality(G)._stringValues;
    } catch {
        console.error(
            "Could not generate betweenness centralities for network."
        );
    }
    try {
        eigenvectorCentralities = jsnx.eigenvectorCentrality(G)._stringValues;
    } catch {
        console.error(
            "Could not generate eigenvector centralities for network."
        );
    }

    if (typeof betweennessCentralities === "object") {
        Object.entries(betweennessCentralities).forEach((entry) => {
            const [key, value] = entry;
            findNode(key).currentCentralities.betweenness_centrality_100x = (
                value * 100
            ).toFixed(5);
        });
    }
    if (typeof eigenvectorCentralities === "object") {
        Object.entries(eigenvectorCentralities).forEach((entry) => {
            const [key, value] = entry;
            findNode(key).currentCentralities.eigenvector_centrality_100x = (
                value * 100
            ).toFixed(5);
        });
    }
    return graph.nodes;
};

const getCitiesByEdge = (edgeList = graph.edges) => {
    _ = {};
    edgeList.map((edge) => {
        _[edge.edge_id] = [];
        edge.cities.forEach((city) => _[edge.edge_id].push(city));
    });
    return _;
};

const getCitiesByNode = (arg) => {
    let _arg = {
        nodeList: graph.nodes,
        threshold: 0,
    };
    if (!arg) {
        arg = _arg;
    } else {
        for (const [key, value] of Object.entries(_arg)) {
            if (!arg[key]) arg[key] = _arg[key];
        }
    }

    _ = {};
    arg.nodeList.forEach((node) => {
        _[node.id] = [];
        node.connected.edges.forEach((edge) => {
            edge.cities.forEach((city) => _[node.id].push(city));
        });
        _[node.id] = [...new Set(_[node.id])].sort();
    });
    if (arg.threshold === undefined) return _;

    return__ = {};
    for (const [key, value] of Object.entries(_)) {
        if (value.length >= arg.threshold) {
            return__[key] = value;
        }
    }
    return return__;
};
