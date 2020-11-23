const WIDTH = 250;
const HEIGHT = 300;
var MIN_DEGREE = 2;
var STRENGTH = -800;
var ALPHA_DECAY = 0.1;

const MULTIPLIER = {
    r: {
        city: 10,
        standard: 4,
    },
    text: {
        city: 10,
        standard: 4,
    },
    lines: 0.5,
};

/*
const svg = d3.select("#svg")
    .append("svg")
    .attr("viewBox", [-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT]);
*/
const svg = d3
    .select("#svg")
    .append("svg")
    .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

var g = svg.append("g").attr("id", "base");
var link_g = g.append("g").attr("id", "links");
var node_g = g.append("g").attr("id", "nodes");
var text_g = g.append("g").attr("id", "texts");

const zoomed = () => {
    g.attr("transform", d3.event.transform);
};
const zoom = d3.zoom().scaleExtent([0, 3]).on("zoom", zoomed);
svg.call(zoom).on("dblclick.zoom", null);
svg.transition().call(zoom.scaleTo, 0.2);

var store = [];

////////////////// Settings ////////////////////////////////

d3.select("#gravity_selector").node().value = STRENGTH;
d3.select("#gravity_selector_label").html(`Gravity ${STRENGTH}`);

d3.select("#gravity_selector").on("input", function (d) {
    d3.select("#gravity_selector_label").html(`Gravity ${this.value}`);
});
d3.select("#gravity_selector").on("change", function (d) {
    STRENGTH = this.value;
    d3.select("#gravity_selector_label").html(`Gravity ${STRENGTH}`);
    update();
});

d3.select("#min_degree_selector").node().value = MIN_DEGREE;
d3.select("#min_degree_selector_label").html(`Min degree ${MIN_DEGREE}`);

d3.select("#min_degree_selector").on("input", function (d) {
    d3.select("#min_degree_selector_label").html(`Min degree ${this.value}`);
});
d3.select("#min_degree_selector").on("change", function (d) {
    MIN_DEGREE = this.value;
    d3.select("#min_degree_selector_label").html(
        `Min connections ${MIN_DEGREE}`
    );
    update();
});

d3.select("#measures").on("click", function (d) {
    clear_text(store);
});

d3.select("#switch_mode").on("click", function (d) {
    toggleTheme();
});

////////////////////////////////////////////////

const size = function (d, type = "r") {
    if (type == "r") {
        if (Object.keys(MULTIPLIER["r"]).includes(d.category)) {
            return Math.sqrt(d.degree * MULTIPLIER["r"][d.category]);
        } else {
            return Math.sqrt(d.degree * MULTIPLIER["r"]["standard"]);
        }
    } else if (type == "text") {
        if (Object.keys(MULTIPLIER["text"]).includes(d.category)) {
            return Math.sqrt(d.degree * MULTIPLIER["text"][d.category]);
        } else {
            return Math.sqrt(d.degree * MULTIPLIER["text"]["standard"]);
        }
    }
};

const clear_text = (nodes) => {
    var arr = nodes.map((d) => d["1000x-degree-centrality"]);
    // var max_degree_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    // var max_degree_centrality = nodes.find(x => x['1000x-degree-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map((d) => d["1000x-betweenness-centrality"]);
    // var max_betweenness_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    // var max_betweenness_centrality = nodes.find(x => x['1000x-betweenness-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map((d) => d["1000x-closeness-centrality"]);
    // var max_closeness_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    // var max_closeness_centrality = nodes.find(x => x['1000x-closeness-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map((d) => d["1000x-eigenvector-centrality"]);
    // var max_eigenvector_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    // var max_eigenvector_centrality = nodes.find(x => x['1000x-eigenvector-centrality'] === max_eigenvector_centrality);

    const display_or_id = (n) => {
        if (n.display != undefined) {
            return n.display;
        } else {
            return n.id;
        }
    };

    str = `
        <h2>Overall data</h2>
        <strong>Nodes</strong>: ${store.length}
    `;
    str += `<h3>Measures</h3>
            <table class="table table-striped table-sm">
            <thead>
            <tr>
            <th scope="col"></th>
            <th scope="col">Eigenvector</td>
            <th scope="col">Degree</td>
            <th scope="col">Closeness</td>
            <th scope="col">Betweenness</td>
            </tr>`;
    nodes.forEach(function (n) {
        str += `<tr>
                <th class="small pr-3" scope="row">${display_or_id(n)}</th>
                <td class="small">${Number(
                    n["1000x-eigenvector-centrality"].toFixed(2)
                )}</td>
                <td class="small">${Number(
                    n["1000x-degree-centrality"].toFixed(2)
                )}</td>
                <td class="small">${Number(
                    n["1000x-closeness-centrality"].toFixed(2)
                )}</td>
                <td class="small">${Number(
                    n["1000x-betweenness-centrality"].toFixed(2)
                )}</td>
                </tr>`;
    });
    str += "</table>";
    // $(".table").DataTable();
    d3.select("#info").html(str);
};

const get_assumed_birth_year = (d, prefix = "", postfix = "") => {
    if (d.assumed_birth_year) {
        return prefix + d.assumed_birth_year + postfix;
    }
};

const set_text = function (d, type, rel_nodes = [], node = undefined) {
    str = `<div class="row">`;
    if (type == "link") {
        str += `<div class="col-12">`;
        if (d.revue_name != "") {
            str += `
            <h4><small class="text-muted">LINK</small> ${d.revue_name}</h4>
            `;
        } else {
            str += `
            <h4 class="text-muted"><small>LINK</small> Not a named revue</h4>
            `;
        }
        str += `</div>`;
        str += `<div class="col-12">`;
        if (d.found.length) {
            str += `<h5>Sources (${d.found.length})</h5>`;
            d.found.forEach(function (source) {
                str += `<p>${source}</p>`;
            });
        }
        str += `</div>`;
    } else if (type == "node") {
        collected = [];
        clubs = [];
        cities = [];
        performers = [];
        rel_nodes.forEach((rel_node_index) => {
            node.attr("pseud", function (node_d) {
                if (
                    rel_nodes.includes(node_d.index) &&
                    !collected.includes(node_d.index) &&
                    d.index != node_d.index
                ) {
                    if (node_d.category == "club") {
                        clubs.push(node_d);
                    } else if (node_d.category == "city") {
                        cities.push(node_d);
                    } else if (node_d.category == "performer") {
                        performers.push(node_d);
                    }
                    collected.push(node_d.index);
                }
            });
        });

        str += `<div class="col-12">`;
        if (d.category == "city") {
            str += `
                <h4><small class="text-muted">CITY</small> ${d.id}</h4>
            `;
        } else if (d.category == "club") {
            str += `
                <h4><small class="text-muted">CLUB</small> ${d.id}</h4>
            `;
        } else if (d.category == "performer") {
            str += `
                <h4><small class="text-muted">PERFORMER</small> ${d.id}</h4>
            `;
            if (d.assumed_birth_year) {
                str += get_assumed_birth_year(
                    d,
                    '<p class=""><strong>Birth year:</strong> ',
                    "</p>"
                );
            }
        } else {
            str += `<h4>&nbsp;</h4>`;
        }
        str += `</div>`;

        str += `<div class="col-6">`;
        str += `<h5>Related nodes</h5>`;

        if (cities.length) {
            str += `<h6 class="border-bottom">Cities (${cities.length})</h6>`;
            cities.forEach((d) => {
                str += `<p class="">${d.id}</p>`;
            });
        }
        if (clubs.length) {
            str += `<h6 class="border-bottom">Clubs (${clubs.length})</h6>`;
            clubs.forEach((d) => {
                str += `<p class="">${d.display}</p>`;
            });
        }
        if (performers.length) {
            str += `<h6 class="border-bottom">Performers (${performers.length})</h6>`;
            performers.forEach((d) => {
                if (d.assumed_birth_year) {
                    str += get_assumed_birth_year(
                        d,
                        `<p class="">${d.id} (b. `,
                        ")</p>"
                    );
                }
            });
        }
        str += `</div>`;
        str += `<div class="col-6">`;
        str += `
            <h5>Measures</h5>
            <p><strong>In-degree</strong>: ${d.indegree}</p>
            <p><strong>Out-degree</strong>: ${d.outdegree}</p>

            <h5>Centrality measures</h5>
            <p><strong>Eigenvector</strong>: ${d["1000x-eigenvector-centrality"]}</p>
            <p><strong>Degree</strong>: ${d["1000x-degree-centrality"]}</p>
            <p><strong>Closeness</strong>: ${d["1000x-closeness-centrality"]}</p>
            <p><strong>Betweenness</strong>: ${d["1000x-betweenness-centrality"]}</p>`;
        str += `</div>`;
    }
    str += `</div>`;
    d3.select("#info").html(str);
};

const filter_nodes = function (nodes) {
    _ = [];
    nodes.forEach(function (n) {
        // if ( n.category == "city" ) {
        //     _.push(n);
        // }
        if (n.degree > MIN_DEGREE) {
            _.push(n);
            store.push(n);
        }
    });
    return _;
};

const filter_links = (links, nodes) => {
    all_ids = nodes.map((d) => d.id);
    _ = [];
    links.forEach(function (d) {
        if (all_ids.includes(d.source) && all_ids.includes(d.target)) {
            _.push(d);
        }
    });
    return _;
};

const drag = (simulation) => {
    function dragstarted(d) {
        console.log("drag started -- THIS FIXES EVERYTHING # TODO");
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

const get_rel_nodes = function (
    d_index,
    link,
    selected = "link selected",
    deselected = "link deselected"
) {
    const rel_nodes = [d_index];
    link.attr("class", function (link_d) {
        if (link_d.source.index == d_index || link_d.target.index == d_index) {
            if (link_d.source.index == d_index) {
                if (rel_nodes.includes(link_d.target.index) != true) {
                    rel_nodes.push(link_d.target.index);
                }
            } else if (link_d.target.index == d_index) {
                if (rel_nodes.includes(link_d.source.index) != true) {
                    rel_nodes.push(link_d.source.index);
                }
            }
            return selected;
        } else {
            return deselected;
        }
    });
    return rel_nodes;
};

const set_line_class = function (d) {
    if (d.revue_name != "") {
        return "link revue";
    } else {
        return "link no-revue";
    }
};

const reset_nodes = (node) => {
    node.attr("class", function (node_d) {
        return "node " + node_d.category;
    });
};

const reset_links = (link) => {
    link.attr("class", function (d) {
        return set_line_class(d);
    });
};

var nodelist = [];
var linklist = [];
var nodelist_display = [];
var linklist_display = [];

var simulation = d3
    .forceSimulation()
    .force("charge", d3.forceManyBody().strength(STRENGTH))
    //.force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2));
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .alphaDecay(ALPHA_DECAY);

const update = () => {
    console.log("update called");
    draw();
};

d3.json("drag-data.json").then(function (data) {
    nodelist = data.nodes.sort((a, b) => (a.category > b.category ? 1 : -1));
    linklist = [...data.links];
});

const draw = () => {
    d3.json("drag-data.json").then(function (data) {
        minDegree = +d3.select("#min_degree_selector").node().value;
        nodelist.forEach(function (n) {
            if (
                n.degree >= minDegree &&
                (n.filtered === true || n.filtered === undefined)
            ) {
                n.filtered = false;
                nodelist_display.push($.extend(true, {}, n));
            } else if (n.degree < minDegree) {
                n.filtered = true;
                nodelist_display.forEach((o, i) => {
                    if (n.id === o.id) {
                        nodelist_display.splice(i, 1);
                    }
                });
            } else {
                console.log(minDegree, n.degree);
            }
        });
        const nodes = filter_nodes(
            nodelist_display.map((d) => Object.create(d))
        );
        const links = filter_links(
            linklist.map((d) => Object.create(d)),
            nodes
        );

        link_g
            .selectAll("line")
            .data(links, (d) => d.pd_id)
            .exit()
            .remove();

        var newLink = link_g
            .selectAll("line")
            .data(links, (d) => d.pd_id)
            .enter()
            .append("line")
            .attr("class", function (d) {
                return set_line_class(d);
            })
            .attr("stroke-width", (d) =>
                Math.sqrt(d.weight * MULTIPLIER["lines"])
            )
            .on("click", function (d) {
                if (d3.select(this).attr("data-clicked") == "true") {
                    d3.select(this).attr("data-clicked", "false");
                    reset_links(link);
                    reset_nodes(node);
                } else {
                    d3.select(this).attr("data-clicked", "true");
                    set_text(d, "link");
                    link.attr("class", function (d_inner) {
                        if (d.index == d_inner.index) {
                            return "link selected";
                        } else {
                            return "link deselected";
                        }
                    });
                    node.attr("class", function (d_inner) {
                        if (d.source.index == d_inner.index) {
                            return `node ${d_inner.category} selected`;
                        } else if (d.target.index == d_inner.index) {
                            return `node ${d_inner.category} selected`;
                        } else {
                            return `node ${d_inner.category} deselected`;
                        }
                    });
                }
                d3.event.stopPropagation();
            });

        var link = link_g.selectAll("line");
        link = link.merge(newLink);

        node_g
            .selectAll("circle.node")
            .data(nodes, (d) => d.pd_id)
            .exit()
            .remove();

        var node = node_g
            .selectAll("circle")
            .data(nodes, (d) => d.pd_id)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", (d) => size(d))
            .attr("class", (d) => "node " + d.category)
            .attr("data-label", (d) => {
                return d.display != undefined ? d.display : d.id;
            });

        node.on("click", function (d) {
            // console.log(d3.event.altKey); THIS IS HOW YOU CHECK FOR ALT KEY PRESSED #TODO: make function to remove the node...
            if (d3.select(this).attr("data-clicked") == "true") {
                d3.select(this).attr("data-clicked", "false");
                reset_links(link);
                reset_nodes(node);
            } else {
                d3.select(this).attr("data-clicked", "true");
                rel_nodes = get_rel_nodes(d.index, link);
                rel_nodes.forEach((rel_node_index) => {
                    node.attr("class", function (node_d) {
                        if (rel_nodes.includes(node_d.index)) {
                            return `node selected ${node_d.category}`;
                        } else {
                            return `node deselected ${node_d.category}`;
                        }
                    });
                });
                set_text(d, "node", rel_nodes, node);
            }
            d3.event.stopPropagation();
        });

        text_g
            .selectAll("text")
            .data(nodes, (d) => d.pd_id)
            .exit()
            .remove();

        var text = text_g
            .selectAll("text")
            .data(nodes, (d) => d.pd_id)
            .enter()
            .append("text");

        var textLabels = text
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
            });

        simulation
            .nodes(nodes, (d) => d.id)
            .force(
                "link",
                d3.forceLink(links).id((d) => d.id)
            );

        simulation.on("tick", () => {
            link.attr("x1", (d) => d.source.x)
                .attr("y1", (d) => d.source.y)
                .attr("x2", (d) => d.target.x)
                .attr("y2", (d) => d.target.y);

            node.attr("cx", (d) => {
                // console.log(d.x);
                return d.x;
            }).attr("cy", (d) => d.y);

            textLabels.attr("x", (d) => d.x).attr("y", (d) => d.y);
        });
        node.call(drag(simulation));
        textLabels.call(drag(simulation));
        simulation.restart();

        // return g.node();
    });
};

update();

// Set up theme colors

// function to set a given theme/color-scheme
function setTheme(themeName) {
    localStorage.setItem("theme", themeName);
    document.documentElement.className = themeName;
}
// function to toggle between light and dark theme
function toggleTheme() {
    if (localStorage.getItem("theme") === "theme-dark") {
        setTheme("theme-light");
    } else {
        setTheme("theme-dark");
    }
}
// Immediately invoked function to set the theme on initial load
(function () {
    if (localStorage.getItem("theme") === "theme-dark") {
        setTheme("theme-dark");
    } else {
        setTheme("theme-light");
    }
})();
