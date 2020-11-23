import { svg_settings } from "./settings.js";
import { setup_simulation, drag, setup_zoomable_g } from "./d3_standards.js";
import { setup_options, get_object_from_settings } from "./setup_options.js";

export var post_change = (variables) => {
    d3.json("drag-data.json").then(function (data) {
        data = filter_data(data);
        render(data);
    });
};

setup_options();

const filter_data = (data) => {
    console.log("filtering...");
    let settings = get_object_from_settings();
    let nodes = data.nodes.filter((d) => d.degree > settings.min_degree);
    if (settings.max_degree) {
        nodes = nodes.filter((d) => d.degree < settings.max_degree);
    }
    nodes.sort((a, b) => (a.category > b.category ? 1 : -1));
    let node_ids = nodes.map((d) => d.id);
    let edges = data.links.filter((d) => {
        if (node_ids.includes(d.source) && node_ids.includes(d.target)) {
            return d;
        }
    });
    return { nodes: nodes, edges: edges };
};

d3.json("drag-data.json").then(function (data) {
    data = filter_data(data);
    render(data);
});

const svg = d3
    .select("#svg")
    .append("svg")
    .attr("viewBox", `-100 -100  ${svg_settings.width} ${svg_settings.height}`);

var g = svg.append("g").attr("id", "base-g");
setup_zoomable_g(svg, g);

let render = (data) => {
    console.log(
        `render initiated with ${data.nodes.length} nodes and ${data.edges.length} edges.`
    );

    let simulation = setup_simulation(data.nodes, data.edges);

    var node_holder = g.append("g").attr("id", "nodes");
    let node = node_holder.selectAll("g");

    node.data(data.nodes, (d) => d.pd_id).join(
        (enter) => {
            let g = enter.append("g").attr("id", (d) => d.pd_id);

            g.append("circle")
                .attr("r", 5)
                .attr("cx", (d) => d.x)
                .attr("cy", (d) => d.y)
                .attr("fill", "rgba(0,0,0,0.5)")
                .call(drag(simulation));

            g.append("text")
                .attr("x", (d) => d.x)
                .attr("y", (d) => d.y)
                .attr("font-size", 12)
                .attr("fill", "rgba(0,0,0,0.75)")
                .attr("text-anchor", "middle")
                .attr("pointer-events", "none")
                .text((d) => d.id)
                .call(drag(simulation));

            return g;
        },
        (update) => {
            update.select("g").select("circle").attr("r", 10);
        },
        (exit) => {
            let g = exit.select("g").remove();
            return exit;
        }
    );

    var edge_holder = g.append("g").attr("id", "edges");
    let edge = edge_holder.selectAll("g");

    edge.data(data.edges, (d) => d.pd_id).join((enter) => {
        let g = enter.append("g").attr("id", (d) => d.pd_id);
        g.append("line").attr("stroke-width", 2).attr("stroke", "black");
        return g;
    });

    simulation.on("tick", () => {
        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        edge.attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

        // text.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
};
