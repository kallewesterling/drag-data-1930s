"use strict";

/*
TODO:
- make graph not so circular...
- filter on other things, like city (see `store.count`)
*/
// console.log("Running d3js v5.");

let DATAFILE = "drag-data.json";
let AUTO_ZOOM = 1.25; // TODO: This will not work

const width = 960,
    height = 800,
    store = { nodes: [], edges: [], count: {} },
    graph = { nodes: [], edges: [] },
    svg = d3.select("svg#main"),
    g = {
        plot: svg.append("g").attr("id", "plot"),
    };

let layout = d3 // setup layout with default values
    .forceSimulation()
    .force("link", d3.forceLink());

let windowWidth = window.innerWidth,
    windowHeight = window.innerHeight,
    k = AUTO_ZOOM,
    preview = null;

let range = (start, stop, step) =>
    Array.from(
        { length: (stop - start) / step + 1 },
        (_, i) => start + i * step
    );
let yearRange = [];

// stop layout until we are ready
layout.stop();

// place links underneath nodes
g.edges = g.plot.append("g").attr("id", "links");

g.nodes = g.plot.append("g").attr("id", "nodes");

const transformToWindow = () => {
    let windowWidth = window.innerWidth,
        windowHeight = window.innerHeight;
    /*
    g.nodes.attr(
        "transform",
        `translate(${windowWidth / 2}, ${windowHeight / 2})`
    ); // shifts plot so 0,0 is at center
    g.edges.attr(
        "transform",
        `translate(${windowWidth / 2}, ${windowHeight / 2})`
    ); // shifts plot so 0,0 is at center
    */
    g.plot.attr(
        "transform",
        `translate(${windowWidth / 2}, ${windowHeight / 2})`
    );
};
d3.select(window).on("resize", transformToWindow);

d3.json(DATAFILE).then((data) => {
    store.count = Object.assign({}, data.count);
    data.nodes.forEach((d) => {
        store.nodes.push(Object.assign({ inGraph: false }, d));
    });

    store.edges = [...data.links];
    store.edges.forEach((e) => {
        e.inGraph = false;
        e.source = store.nodes.find((n) => n.id === e.source);
        e.target = store.nodes.find((n) => n.id === e.target);
        e.dates = [];
        e.range = { start: undefined, end: undefined };
        // console.log(e.found);
        e.found = e.found.filter((found) => {
            return found != null && found != "" && found != "";
        });
        e.found.forEach((source) => {
            let date = dateParser(source);
            if (date && date.iso !== undefined) {
                e.dates.push(date.iso);
            } else {
                // console.log(`Could not interpret date in ${source}`);
            }
        });
        if (e.dates) {
            e.dates = [...new Set(e.dates)].sort();
            e.range = { start: e.dates[0], end: e.dates[e.dates.length - 1] };
        }
    });
    filter();
    restart();

    transformToWindow();
    /* // TODO: This does not work!
    let _ = loadSettings("transform");
    if (_) {
        console.log("transform recorded");
        k = _.k;
        g.plot.transition().call(zoom.scaleTo, _.k);
        g.plot.transition().call(zoom.translateTo, _.x, _.y);
    } else {
        g.plot.transition().call(zoom.scaleTo, AUTO_ZOOM);
    }
    */

    d3.select("#minWeight").node().max = Math.max.apply(
        Math,
        store.edges.map(function (o) {
            return o.weight;
        })
    );

    d3.select("#minDegree").node().max = Math.max.apply(
        Math,
        store.nodes.map((o) => o.degree)
    );

    let min_year = Math.min.apply(
        Math,
        store.edges.map(function (o) {
            if (o.range.start) {
                return +o.range.start.substring(0, 4);
            } else {
                return 1900;
            }
        })
    );
    let max_year = Math.max.apply(
        Math,
        store.edges.map(function (o) {
            if (o.range.end) {
                return +o.range.end.substring(0, 4);
            } else {
                return 1900;
            }
        })
    );

    yearRange = range(min_year, max_year, 1);

    // console.log(yearRange);

    let preloadedSettings = loadSettings("settings");
    if (!preloadedSettings) preloadedSettings = _autoSettings;

    let startYearSet = false;
    d3.select("#startYear")
        .selectAll("option")
        .data(yearRange)
        .enter()
        .append("option")
        .attr("value", (d) => d)
        .text((d) => d)
        .attr("selected", (d) => {
            if (
                d === preloadedSettings.edges.startYear &&
                preloadedSettings.edges.startYear <
                    preloadedSettings.edges.endYear
            ) {
                startYearSet = true;
                return true;
            }
        });
    if (!startYearSet) {
        d3.select("#startYear").node().value = _autoSettings.edges.startYear;
    }
    let endYearSet = false;
    d3.select("#endYear")
        .selectAll("option")
        .data(yearRange)
        .enter()
        .append("option")
        .attr("value", (d) => d)
        .text((d) => d)
        .attr("selected", (d) => {
            if (
                d === preloadedSettings.edges.endYear &&
                preloadedSettings.edges.startYear <=
                    preloadedSettings.edges.endYear
            ) {
                endYearSet = true;
                return true;
            }
        });
    if (!endYearSet) {
        d3.select("#endYear").node().value = _autoSettings.edges.endYear;
    }

    preview = preview(store);
});

const filter = () => {
    let settings = getSettings();

    resetNodesAndEdges();
    hide("#nodeEdgeInfo");

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

    store.edges.forEach((e) => {
        // TODO: recalibrate weight here
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

    graph.nodes.forEach((n) => {
        n.current_degree = nodeHasEdges(n.node_id, true);
    });

    if (settings.nodes.autoClearNodes) {
        dropNodesWithNoEdges();
    }
    updateInfo();
};

const restart = () => {
    let settings = getSettings();

    layout.stop();
    // console.log("--> setting up layout");
    layout.force("link").links(graph.edges);
    layout.nodes(graph.nodes);
    if (settings.force.layoutCenter) {
        // console.log("setting forceCenter");
        layout.force("center", d3.forceCenter());
        layout.force("center").strength = 1;
    } else {
        //console.log("unsetting forceCenter");
        layout.force("center", null);
    }
    if (settings.force.layoutForceX) {
        //console.log("setting forceX");
        layout.force("forceX", d3.forceX());
    } else {
        //console.log("unsetting forceX");
        layout.force("forceX", null);
    }
    if (settings.force.layoutForceX) {
        //console.log("setting forceY");
        layout.force("forceY", d3.forceY());
    } else {
        //console.log("unsetting forceY");
        layout.force("forceY", null);
    }
    if (settings.force.layoutCharge) {
        //console.log(`setting charge = ${settings.force.charge}`);
        layout.force("charge", d3.forceManyBody());
        layout.force("charge").strength(settings.force.charge);
    } else {
        layout.force("charge", null);
    }
    if (settings.force.layoutCollide) {
        //console.log(`setting collide = ${settings.force.collide}`);
        layout.force("collide", d3.forceCollide());
        layout.force("collide").strength(settings.force.collide);
    } else {
        layout.force("collide", null);
    }

    layout.force("link").strength(0.4);

    let node = g.nodes
        .selectAll("circle.node")
        .data(graph.nodes, (d) => d.node_id);

    node.exit().transition().attr("r", 0).remove();

    let newNode = node
        .enter()
        .append("circle")
        .attr("class", (n) => "node " + n.category)
        .attr("id", (n) => n.node_id)
        .attr("cx", (n) => n.x)
        .attr("cy", (n) => n.y);

    g.nodes
        .selectAll("circle.node")
        .data(graph.nodes, (d) => d.node_id)
        .transition()
        .attr("r", (n) => {
            if (settings.nodes.nodeSizeFromCurrent === true) {
                y = d3
                    .scaleLinear()
                    .range([1, 10])
                    .domain(d3.extent(graph.nodes, (d) => d.current_degree));
                // console.log("settings.nodeSizeFromCurrent is on!");
                return y(n.current_degree);
                return Math.sqrt(n.current_degree) * 2.5;
            } else {
                y = d3
                    .scaleLinear()
                    .range([1, 10])
                    .domain(d3.extent(graph.nodes, (d) => d.degree));
                return y(n.degree);
                // console.log("settings.nodeSizeFromCurrent is off!");
                return Math.sqrt(n.degree) * 1.5;
            }
        });

    node = node.merge(newNode);

    let text = g.nodes
        .selectAll("text.label")
        .data(graph.nodes, (d) => d.node_id);

    text.exit().transition().attr("opacity", 0).remove();

    let newText = text
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("style", "pointer-events: none;")
        .attr("font-size", (d) => Math.sqrt(d.degree))
        .text((d) => {
            if (d.display) {
                return d.display;
            } else {
                return d.id;
            }
        });

    // draw links at initial positions
    let edge = g.edges
        .selectAll("line.link")
        .data(graph.edges, (d) => d.edge_id);

    edge.exit().transition().attr("stroke-opacity", 0).remove();

    let newEdge = edge
        .enter()
        .append("line")
        .attr("id", (e) => e.edge_id)
        .attr("class", (e) => {
            if (e.revue_name != "") {
                return "link revue";
            } else {
                return "link no-revue";
            }
        })
        .attr("x1", (e) => e.source.x)
        .attr("y1", (e) => e.source.y)
        .attr("x2", (e) => e.target.x)
        .attr("y2", (e) => e.target.y)
        .style("stroke-width", (e) => {
            let weight =
                settings.edges.weightFromCurrent === true
                    ? Math.sqrt(e.calibrated_weight) * 0.5
                    : Math.sqrt(e.weight) * 0.5;
            weight =
                weight < settings.edgeMinStroke
                    ? settings.edgeMinStroke
                    : weight;
            weight =
                weight > settings.edgeMaxStroke
                    ? settings.edgeMaxStroke
                    : weight;
            return weight;
        })
        .call(function (link) {
            link.transition().attr("stroke-opacity", 0.3);
        });

    edge = edge.merge(newEdge);

    text = text.merge(newText);

    // updates node and link positions every tick
    layout.on("tick", function (n) {
        node.attr("cx", (n) => n.x);
        node.attr("cy", (n) => n.y);

        edge.attr("x1", (e) => e.source.x);
        edge.attr("y1", (e) => e.source.y);
        edge.attr("x2", (e) => e.target.x);
        edge.attr("y2", (e) => e.target.y);

        text.attr("x", (n) => n.x);
        text.attr("y", (n) => n.y + 4);
    });

    node.call(drag);

    node.on("click", (n) => {
        selectNode(n);
        d3.event.stopPropagation();
    });

    edge.on("click", (n) => {
        selectEdge(n);
        d3.event.stopPropagation();
    });

    // restart the layout now that everything is set
    layout.restart();
};

// setup node dragging
// https://github.com/d3/d3-drag
const drag = d3
    .drag()
    .on("start", (n) => {
        // avoid restarting except on the first drag start event
        if (!d3.event.active) layout.alphaTarget(0.3).restart();

        // fix this node position in the layout
        // https://github.com/d3/d3-force#simulation_nodes
        n.fx = n.x;
        n.fy = n.y;
    })
    .on("drag", (n) => {
        n.fx = d3.event.x;
        n.fy = d3.event.y;
    })
    .on("end", (n) => {
        // restore alphaTarget to normal value
        if (!d3.event.active) layout.alphaTarget(0);

        // no longer fix the node position after drag ended
        // allows layout to calculate its position again
        if (getSettings().nodes.stickyNodes) {
            n.fx = n.x;
            n.fy = n.y;
        } else {
            n.fx = null;
            n.fy = null;
        }
    });

let zoomed = () => {
    k = Math.round(d3.event.transform.k * 10) / 10;
    saveSettings();
    let windowWidth = window.innerWidth,
        windowHeight = window.innerHeight;
    let xValue = windowWidth / 2 + d3.event.transform.x;
    let yValue = windowHeight / 2 + d3.event.transform.y;
    g.plot.attr(
        "transform",
        `translate(${xValue}, ${yValue}) scale(${d3.event.transform.k})`
    );
    updateInfo();
};

const zoom = d3.zoom().scaleExtent([0.25, 7]).on("zoom", zoomed);

g.plot.call(zoom);

const nodeHasEdges = (node_id, count = false) => {
    // console.log("searching for edges for" + node_id);
    let n = graph.nodes.filter((n) => {
        return n.node_id === node_id ? n : false;
    });

    if (n.length == 1) {
        n = n[0];
    } else if (n.length < 1) {
        // console.log("Found no visible node with ID " + node_id);

        if (count === true) {
            return 0;
        } else {
            return false;
        }
    } else {
        // console.error("Found more than one node with ID " + node_id); // TODO: This is strange...
    }

    let returnValue = false,
        counted = 0;

    graph.edges.filter((d) => {
        if (d.source.node_id === n.node_id) {
            // console.log("found connection to " + n.id + " from " + d.source.id);
            returnValue = true;
            counted += 1;
        }
        if (d.target.node_id === n.node_id) {
            // console.log("found connection to " + n.id + " from " + d.target.id);
            returnValue = true;
            counted += 1;
        }
    });

    return count === true ? counted : returnValue;
};

const getUnconnectedNodes = () => {
    // console.log("getUnconnectedNodes");
    _ = [];
    graph.nodes.forEach((n) => {
        if (nodeHasEdges(n.node_id) === false) {
            _.push(n);
        }
    });
    return _;
};
const hasUnconnectedNodes = () => {
    // console.log("hasUnconnectedNodes");
    return getUnconnectedNodes().length > 0;
};

const dropNodesWithNoEdges = () => {
    let fixed = false,
        runs = 0;
    while (hasUnconnectedNodes()) {
        graph.nodes.forEach((n) => {
            if (nodeHasEdges(n.node_id) === false) {
                // console.log(`——> remove node ${n.node_id}!`);
                graph.nodes.forEach((o, i) => {
                    if (n.node_id === o.node_id) {
                        graph.nodes.splice(i, 1);
                        fixed = true;
                    }
                });
            }
        });
        runs += 1;
    }
    /*
    debugMessage(
        `Dropped nodes with no edges (after ${runs} runs).`,
        "Information"
    );
    */
    if (fixed === true) {
        troubleshoot(true); // ensures that all nodes are correctly represented in
        restart();
        updateInfo();
    }
};

const updateInfo = () => {
    d3.select("#info").classed("d-none", false);
    d3.select("#info").html(`
        <p>Graph nodes: ${graph.nodes.length}/${store.nodes.length}</p>
        <p>Graph edges: ${graph.edges.length}/${store.edges.length}</p>
        <hr />
        <p>Unconnected nodes: ${getUnconnectedNodes().length}</p>
        <hr />
        <p>Current zoom: ${k}</p>
    `);
};

const troubleshoot = (fix = false) => {
    let _ = {
        storeNodes: {
            notInDOM: 0,
            inGraph: store.nodes.filter((d) => d.inGraph),
        },
        graphNodes: {
            notInDOM: 0,
            inGraph: graph.nodes.filter((d) => d.inGraph),
        },
    };
    store.nodes.forEach((n) => {
        if (d3.select("#" + n.node_id).node()) {
        } else {
            _.storeNodes.notInDOM += 1;
        }
    });
    graph.nodes.forEach((n) => {
        if (d3.select("#" + n.node_id).node()) {
        } else {
            _.graphNodes.notInDOM += 1;
        }
    });
    if (fix) {
        // console.log("checking for inconsistency in data...");
        if (_.storeNodes.inGraph > _.graphNodes.inGraph) {
            /* // TODO: turn on this message?
            console.log(
                "there are more filtered nodes in store than in graph, correcting..."
            );*/
            let dropped = `Dropped nodes:`;
            _.storeNodes.inGraph.forEach((n) => {
                if (
                    _.graphNodes.inGraph.find((d) => d.node_id === n.node_id) ==
                    undefined
                ) {
                    dropped += `<li>${n.node_id}</li>`;
                    n.inGraph = false;
                }
            });
            debugMessage(dropped, "Information");
        }
    }
    return _;
};

let toasterCounter = 1;
const debugMessage = (message, header) => {
    if (getSettings().debugMessages === false) {
        // console.log("[debugMessage: " + header + "] " + message);
        console.log("debugMessage suppressed.");
        return false;
    }
    if (!header) {
        header = "Warning";
    }
    let _id = `toast${toasterCounter}`;
    let _html = d3.select("#wrapToasters").html();
    _html += `<div class="toast" id="${_id}" role="alert" aria-live="polite" aria-atomic="true" data-delay="5000"><div role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header"><strong class="mr-auto">${header}</strong><button type="button" class="ml-2 mb-1 btn-close" data-dismiss="toast" aria-label="Close"></button></div>
        <div class="toast-body">${message}</div>
        </div></div>`;
    d3.select("#wrapToasters").html(_html);
    // $(`#${_id}`).toast({ delay: 5000 });
    $(`#${_id}`).toast("show");
    setTimeout(() => {
        // console.log(`removing ${_id}`);
        d3.selectAll(`#${_id}`).remove();
    }, 6000);
    toasterCounter += 1;
};

const isVisible = (selector) => {
    return d3.select(selector).classed("d-none") === false;
};

const toggle = (selector) => {
    d3.select(selector).classed("d-none", isVisible(selector));

    // special rules
    if (selector === "#settingsContainer") {
        d3.select("#settingsToggle").classed("toggled", !isVisible(selector));
    } else if (selector === "#infoToggleDiv") {
        d3.select("#infoToggle").classed("toggled", !isVisible(selector));
    }
};

const hide = (selector) => {
    d3.select(selector).classed("d-none", true);
};

const restartLayout = () => {
    layout.stop();
    layout.alpha(1);
    layout.restart();
};

const displayOrID = (elem) => {
    return elem.display != undefined ? elem.display : elem.id;
};

const setNodeEdgeInfo = (elem) => {
    let _html = "";
    if (elem.node_id) {
        //let related = getRelated(elem.node_id);
        _html = `<p><strong>${displayOrID(elem)}</strong></p>
            <p>degree: ${elem.degree}</p>
            <p>—> in: ${elem.indegree}</p>
            <p>—> out: ${elem.outdegree}</p>
            <p>current network degree: ${nodeHasEdges(elem.node_id, true)}</p>
            <p class="mt-2"><strong>Centrality measures (across network)</strong></p>
            <p>Betweenness (1000x): ${
                Math.round(elem["1000x-betweenness-centrality"] * 100) / 100
            }</p>
            <p>Closeness (1000x): ${
                Math.round(elem["1000x-closeness-centrality"] * 100) / 100
            }</p>
            <p>Degree (1000x): ${
                Math.round(elem["1000x-degree-centrality"] * 100) / 100
            }</p>
            <p>Eigenvector (1000x): ${
                Math.round(elem["1000x-eigenvector-centrality"] * 100) / 100
            }</p>
            <p class="mt-2"><strong>Related nodes</strong></p>`;
        /* // TODO: Do something interactive with these?
            <p>Secondary: ${related.secondaryNodeIDs}</p>
            <p>Tertiary: ${related.tertiaryNodeIDS}</p>
        `;
        */
    } else if (elem.edge_id) {
        let dates = [];
        _html = `<p><strong>${displayOrID(elem.source)} - ${displayOrID(
            elem.target
        )}</strong></p>
        <p>Revue mentioned: ${elem.revue_name}</p>
        <p>Weight: ${elem.weight}</p>`;
        if (elem.dates) {
            elem.dates.sort();
            _html += `<p>Span: ${elem.dates[0]}–${
                elem.dates[elem.dates.length - 1]
            }</p>`;
        }
        if (elem.found) {
            _html += `<p>Found in ${elem.found.length} source${
                elem.found.length > 1 ? "s" : ""
            }:</p>
        <ul>`;
            elem.found.forEach((source) => {
                _html += `<li>${source}</li>`;
            });
            _html += `</ul>`;
        }
        _html += `<p>Edge ID: ${elem.edge_id}</p>`;
    }
    d3.select("#nodeEdgeInfo").classed("d-none", false).html(_html);
};

const nodeIsSelected = (node) => {
    return d3.select(`#${node.node_id}`).classed("selected");
};

const edgeIsSelected = (edge) => {
    return d3.select(`#${edge.edge_id}`).classed("selected");
};

const deselectNodes = (excludeNode = undefined) => {
    g.nodes.selectAll("circle.node").classed("selected", (node) => {
        if (excludeNode && node === excludeNode) {
            if (nodeIsSelected(node)) {
                // do nothing
            } else {
                return true;
            }
        } else {
            return false;
        }
    });
    g.nodes.selectAll("text.label").classed("selected", (node) => {
        if (excludeNode && node === excludeNode && nodeIsSelected(node)) {
            return true;
        } else {
            return false;
        }
    });
};

const deselectEdges = (excludeEdge = undefined) => {
    g.edges.selectAll("line.link").classed("selected", (edge) => {
        if (excludeEdge && edge === excludeEdge) {
            if (edgeIsSelected(edge)) {
                // do nothing
            } else {
                return true;
            }
        } else {
            return false;
        }
    });
    g.edges.selectAll("line.link").classed("deselected", (edge) => {
        if (excludeEdge && edge === excludeEdge) {
        } else {
            return true;
        }
    });
};

const getRelatedEdges = (node, asSource = true, asTarget = true) => {
    if (typeof node === "string") {
        // console.log("got string.. so looking up node object");
        node = graph.nodes.find((n) => n.node_id === node);
    }
    let _ = [],
        __ = [];
    if (asTarget) {
        __ = g.edges
            .selectAll("line.link")
            .data()
            .filter((l) => l.target === node);
        _.push(...__);
    }
    if (asSource) {
        __ = g.edges
            .selectAll("line.link")
            .data()
            .filter((l) => l.source === node);
        _.push(...__);
    }
    return _;
};

const selectRelatedEdges = (node) => {
    g.edges.selectAll("line.link").classed("selected", (edge) => {
        if (
            (edge.source == node || edge.target == node) &&
            nodeIsSelected(node)
        ) {
            return true;
        } else {
            return false;
        }
    });

    g.edges.selectAll("line.link").classed("deselected", (edge) => {
        if (
            (edge.source == node || edge.target == node) &&
            nodeIsSelected(node)
        ) {
            return false;
        } else {
            return true;
        }
    });
};

const getRelated = (node) => {
    if (typeof node === "string") {
        node = d3.select("#" + node).datum();
    }
    let secondaryEdges = getRelatedEdges(node.node_id);
    let secondaryNodeIDs = [
        ...new Set([
            ...secondaryEdges.map((e) => e.source.node_id),
            ...secondaryEdges.map((e) => e.target.node_id),
        ]),
    ].filter((d) => d != node.node_id);

    let tertiaryNodeIDs = [],
        tertiaryEdges = [];
    secondaryNodeIDs.forEach((node_id) => {
        let _tertiaryEdges = getRelatedEdges(node_id);
        let _tertiaryNodeIDs = [
            ...new Set([
                ..._tertiaryEdges.map((e) => e.source.node_id),
                ..._tertiaryEdges.map((e) => e.target.node_id),
            ]),
        ].filter((d) => d != node_id && d != node.node_id);
        tertiaryNodeIDs = [...tertiaryNodeIDs, ..._tertiaryNodeIDs];
        tertiaryEdges = [...tertiaryEdges, ..._tertiaryEdges];
    });
    secondaryEdges = secondaryEdges.map((e) => e.edge_id);
    tertiaryEdges = tertiaryEdges.map((e) => e.edge_id);
    let returnValue = {
        primary: node.node_id,
        secondaryNodeIDs: secondaryNodeIDs,
        tertiaryNodeIDs: tertiaryNodeIDs,
        secondaryEdges: secondaryEdges,
        tertiaryEdges: tertiaryEdges,
    };
    // console.log(returnValue);
    return returnValue;
};

const unselectNodes = (excludeNode) => {
    let related = undefined;
    g.nodes.selectAll("circle.node").classed("deselected", (node) => {
        if (excludeNode && node === excludeNode) {
            node.fx = node.x;
            node.fy = node.y;
            related = getRelated(node);
            return false;
        } else {
            return true;
        }
    });
    // console.log(related);
    related.secondaryNodeIDs.forEach((node_id) => {
        let elem = d3.select(`#${node_id}`);
        elem.classed("selected-secondary", true);
        elem.classed("deselected", false);
    });
    related.tertiaryNodeIDs.forEach((node_id) => {
        let elem = d3.select(`#${node_id}`);
        elem.classed("selected-tertiary", true);
        elem.classed("deselected", false);
    });
    related.tertiaryEdges.forEach((edge_id) => {
        let elem = d3.select(`#${edge_id}`);
        elem.classed("selected-tertiary", true);
        elem.classed("deselected", false);
    });
};

const resetNodesAndEdges = () => {
    g.nodes.selectAll("circle.node").attr("class", (n) => "node " + n.category);
    g.edges.selectAll("line.link").attr("class", (e) => {
        if (e.revue_name != "") {
            return "link revue";
        } else {
            return "link no-revue";
        }
    });
    if (!getSettings().nodes.stickyNodes) {
        g.nodes
            .selectAll("text.label")
            .attr("class", "label")
            .attr("selected", (n) => {
                n.fx = null;
                n.fy = null;
            });
    }
};

const selectNode = (node) => {
    if (nodeIsSelected(node)) {
        hide("#nodeEdgeInfo");
        // deselectNodes();
        // selectRelatedEdges(node);
        resetNodesAndEdges();
    } else {
        resetNodesAndEdges();
        selectRelatedEdges(node);
        deselectNodes(node);
        unselectNodes(node);
        setNodeEdgeInfo(node);
    }
};

const selectEdge = (edge) => {
    if (edgeIsSelected(edge)) {
        hide("#nodeEdgeInfo");
        resetNodesAndEdges();
    } else {
        // console.log("edge not selected yet");
        deselectEdges(edge);
        setNodeEdgeInfo(edge);
    }
};
