const communityDetection = () => {
    loading('Detecting communities using Levain algorithm.');

    // TODO: I am using JLevain here. Are there other community detectors out there? Learn more about algorithms...
    // See invention of Louvain method here https://arxiv.org/pdf/0803.0476.pdf
    var allNodes = graph.nodes.map((d) => d.node_id);
    var allEdges = graph.edges.map((d) => {
        return {
            source: d.source.node_id,
            target: d.target.node_id,
            weight: d.weight,
        };
    });

    var community = jLouvain().nodes(allNodes).edges(allEdges);

    let result = community();

    graph.nodes.forEach((node) => {
        node.cluster = result[node.node_id] + 1;
        if (!graph.clusters[node.cluster] || node.r > graph.clusters[node.cluster].r
        ) {
            graph.clusters[node.cluster] = node;
        }
    });

    // console.log("clusters", graph.clusters);
}