const svg_settings = {
    width: 250,
    height: 300,
};

const standard_settings = {
    start_year: 1900,
    end_year: 1935,
    gravity: -200,
    min_degree: 6,
    max_degree: undefined,
    multiplier: {
        edges: 0.5,
        r: {
            city: 10,
            standard: 4,
        },
        text: { city: 10, standard: 4 },
    },
};

const change_degree = (d) => {
    min_degree = d3.select("#minDegree").node().value;
    max_degree = d3.select("#maxDegree").node().value;
    if (min_degree == 0) {
        min_degree = undefined;
    }
    if (max_degree == 0) {
        max_degree = undefined;
    }
    d3.json("drag-data.json").then(function (_data) {
        filtered_data = filter(_data, {
            min_degree: min_degree,
            max_degree: max_degree,
        });
        render(filtered_data);
    });
};

const setup_zoomable_g = (g) => {
    const zoomed = () => {
        g.attr("transform", d3.event.transform);
    };
    const zoom = d3.zoom().scaleExtent([0, 3]).on("zoom", zoomed);
    svg.call(zoom).on("dblclick.zoom", null);
};

const drag = (simulation) => {
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

const setup_simulation = (nodes, edges) => {
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

const svg = d3
    .select("#svg")
    .append("svg")
    .attr(
        "viewBox",
        `${svg_settings.width / 2} -${svg_settings.height / 2} ${
            svg_settings.width
        } ${svg_settings.height}`
    );

var g = svg.append("g").attr("id", "base-g");
g = d3.select("#base-g");
setup_zoomable_g(g);

var min_degrees = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var max_degrees = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

var min_degree_btn = d3.select("#minDegree");
min_degree_btn
    .selectAll("myOptions")
    .data(min_degrees)
    .enter()
    .append("option")
    .text((d) => d)
    .attr("selected", (d) => {
        if (d == standard_settings.min_degree) {
            return true;
        }
    })
    .attr("value", function (d) {
        return d;
    });
min_degree_btn.on("change", () => {
    change_degree(d3.event);
});

var max_degree_btn = d3.select("#maxDegree");
max_degree_btn
    .selectAll("myOptions")
    .data(max_degrees)
    .enter()
    .append("option")
    .text((d) => d)
    .attr("selected", (d) => {
        if (d == standard_settings.max_degree) {
            return true;
        }
    })
    .attr("value", (d) => d);
max_degree_btn.on("change", () => {
    change_degree(d3.event);
});

var gravity_slider = d3.select("#gravitySlider");
gravity_slider.on("change", () => {
    change_degree(d3.event);
});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

const filter = (_data, settings) => {
    console.log("filtering...");
    console.log(
        `min degree: ${settings.min_degree}\nmax degree: ${settings.max_degree}`
    );

    var filtered_data = {
        nodes: [...raw_data.nodes],
        edges: [...raw_data.edges],
    };

    console.log(
        filtered_data.nodes.length +
            " nodes and " +
            filtered_data.edges.length +
            " edges before."
    );

    if (settings.min_degree) {
        filtered_data.nodes = filtered_data.nodes.filter((d) => {
            if (d.degree >= settings.min_degree) {
                return d;
            }
        });
    }

    console.log(filtered_data.nodes.length + " nodes");

    if (settings.max_degree) {
        filtered_data.nodes = filtered_data.nodes.filter(
            (d) => d.degree <= settings.max_degree
        );
    }

    console.log(filtered_data.nodes.length + " nodes");

    const all_node_ids = filtered_data.nodes.map((node) => node.id);

    filtered_data.edges = raw_data.edges.filter((d) => {
        // console.log(all_node_ids, d.source, d.target);
        if (
            all_node_ids.includes(d.source) &&
            all_node_ids.includes(d.target)
        ) {
            return d;
        } else if (all_node_ids.includes(d.source)) {
            //return d;
        } else if (all_node_ids.includes(d.target)) {
            //return d;
        }
    });
    console.log(
        filtered_data.nodes.length +
            " nodes and " +
            filtered_data.edges.length +
            " edges after."
    );
    return filtered_data;
};

const get_line_class = function (d) {
    if (d.revue_name != "") {
        return "link revue";
    } else {
        return "link no-revue";
    }
};
const size = function (d, type = "r") {
    if (type == "r") {
        if (Object.keys(standard_settings.multiplier.r).includes(d.category)) {
            return Math.sqrt(
                d.degree * standard_settings.multiplier.r[d.category]
            );
        } else {
            return Math.sqrt(
                d.degree * standard_settings.multiplier.r["standard"]
            );
        }
    } else if (type == "text") {
        if (
            Object.keys(standard_settings.multiplier.text).includes(d.category)
        ) {
            return Math.sqrt(
                d.degree * standard_settings.multiplier.text[d.category]
            );
        } else {
            return Math.sqrt(
                d.degree * standard_settings.multiplier.text["standard"]
            );
        }
    }
};
const render = (filtered_data) => {
    console.log("rendering filtered data...");
    const simulation = setup_simulation(
        filtered_data.nodes,
        filtered_data.edges
    );

    // const edges_section = g.append("g").attr("id", "edges");

    var edge = g
        .selectAll("line")
        .data(filtered_data.edges, (d) => d.pd_id)
        .join(
            (enter) => {
                return enter
                    .append("line")
                    .attr("class", (d) => get_line_class(d))
                    .attr("stroke-width", (d) =>
                        Math.sqrt(d.weight * standard_settings.multiplier.edges)
                    );
            },
            (update) => {
                return update;
            },
            (exit) => {
                return exit.select("line").remove();
            }
        );

    // const node_section = g.append("g").attr("id", "nodes");

    var node = g
        .selectAll("g")
        .data(filtered_data.nodes, (d) => d.pd_id)
        .join(
            (enter) => {
                return enter
                    .append("g")
                    .append("circle")
                    .attr("r", (d) => size(d))
                    .attr("class", (d) => "node " + d.category)
                    .call(drag(simulation));
            },
            (update) => {
                return update
                    .select("g")
                    .select("circle")
                    .attr("r", (d) => size(d))
                    .attr("class", (d) => "node " + d.category);
            },
            (exit) => {
                return exit.select("g").remove();
            }
        );

    // const text_section = g.append("g").attr("id", "text");

    var text = g
        .selectAll("text")
        .data(filtered_data.nodes, (d) => d.pd_id)
        .join(
            (enter) => {
                return enter
                    .append("text")
                    .attr("x", (d) => d.x)
                    .attr("y", (d) => d.y)
                    .attr("font-size", (d) => size(d, (type = "text")))
                    .attr("class", "text-label")
                    .text(function (d) {
                        if (d.category == "club") {
                            return d.display;
                        } else {
                            return d.id;
                        }
                    })
                    .call(drag(simulation));
            },
            (update) => {
                return update;
            },
            (exit) => {
                return exit.select("text").remove();
            }
        );

    simulation.on("tick", () => {
        edge.attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

        text.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
};

var raw_data = d3.json("drag-data.json").then(function (_data) {
    return (raw_data = {
        nodes: _data.nodes.sort((a, b) => (a.category > b.category ? 1 : -1)),
        edges: _data.links,
    });
});

raw_data.then((raw_data) => {
    console.log("raw data");
    console.log(raw_data);
    filtered_data = filter(raw_data, standard_settings);
    render(filtered_data);
});
