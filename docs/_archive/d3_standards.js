import { standard_settings } from "./settings.js";

export let setup_zoomable_g = (svg, g) => {
    const zoomed = () => {
        g.attr("transform", d3.event.transform);
    };
    const zoom = d3.zoom().scaleExtent([0, 3]).on("zoom", zoomed);
    svg.call(zoom).on("dblclick.zoom", null);
};

export let drag = (simulation) => {
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
};

export let setup_simulation = (nodes, edges) => {
    return (
        d3
            .forceSimulation(nodes)
            .force(
                "link",
                d3.forceLink(edges).id((d) => d.id)
            )
            .force(
                "charge",
                d3.forceManyBody().strength(standard_settings.gravity)
            )
            //.force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2));
            .force("x", d3.forceX())
            .force("y", d3.forceY())
    );
};
