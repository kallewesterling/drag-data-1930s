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
    }

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
    Object.entries(jsnx.betweennessCentrality(G)._stringValues).forEach(
        (entry) => {
            const [key, value] = entry;
            findNode(key).currentCentralities.betweenness_centrality_100x = value * 100;
        }
    );
    Object.entries(jsnx.eigenvectorCentrality(G)._stringValues).forEach(
        (entry) => {
            const [key, value] = entry;
            findNode(key).currentCentralities.eigenvector_centrality_100x = value * 100;
        }
    );
    return graph.nodes;
};
