"use strict";
/*
TODO:
- filter on more things, like city (see `store.count`)
- choose indegree / outdegree as nodeSize !important

- add auto-generated explanation of data:
        color = three different categories of nodes (if you click them, they will turn red)
            if stickyNodes is on: if you drag the nodes, they will stick in the place where you've dragged them. If you don't desire this feature, just click here, and it will be removed and reset.

            minDegree = 
            but if current degree is different = 

        size of nodes: ("node size from current graph" is clicked) the nodes are scaled in relation to the other nodes on the chart. current_degree is used instead of degree.

        If you click each node, you will see the centrality measures. Those are counted (and described here at 1000x) across the entire network, and are not generated dynamically, depending on the graph that you see in front of you.
            - betweenness
            - closeness
            - degree
            - eigenvector

        What about the placement of the nodes? This is taken care of by the "force simulation" [TODO: read this https://medium.com/@sxywu/understanding-the-force-ef1237017d5]

*/

// TODO move to app/load
/**
 * loadNetwork takes no arguments, but ensures that all the settings containers on the screen are in/visible to the user when appropriate.
 * The return value is true in all cases.
 */
const loadNetwork = () => {
    d3.json(DATAFILE).then((data) => {
        // for debug purposes (TODO can be removed)
        store.raw = data;

        // set up store.comments
        store.comments = Object.assign({}, data.comments);

        // set up store.count
        store.count = Object.assign({}, data.count);

        // set up store.nodes
        data.nodes.forEach((d) => {
            if (d.node_id === '' || d.node_id === '-' || d.node_id === '–' || d.node_id === '—') {
                console.error('found an erroneous data point:'); console.log(d);
            } else {
                store.nodes.push(Object.assign({
                    inGraph: false,
                    has_comments: d.comments.length > 0 ? true : false,
                }, d));
            }
        });
        
        // set up store.edges
        data.links.forEach(e => {
            store.edges.push(Object.assign({
                has_comments: e.comments.length > 0 ? true : false,
                has_general_comments: e.general_comments.length > 0 ? true : false,
                inGraph: false,
                dates: [],
                range: { start: undefined, end: undefined }
            }, e));
        })
        store.edges.forEach((e) => {
            e.source = store.nodes.find((n) => n.id === e.source);
            e.target = store.nodes.find((n) => n.id === e.target);
            e.found = e.found.filter((found) => {
                return found != null && found != "" && found != "";
            });
            e.found.forEach((source) => {
                let date = dateParser(source);
                if (date && date.iso !== undefined) {
                    e.dates.push(date.iso);
                } else {
                    console.error(`Could not interpret date in ${source}`);
                }
            });
            if (e.dates) {
                e.dates = [...new Set(e.dates)].sort();
                e.range = {
                    start: e.dates[0],
                    end: e.dates[e.dates.length - 1],
                };
            }
        });

        // set up store.ranges
        let range = (start, stop, step) =>
            Array.from(
                { length: (stop - start) / step + 1 },
                (x, i) => start + i * step
            );

        store.ranges.nodeDegree = d3.extent(store.nodes, (d) => d.degree);
        store.ranges.edgeWidth = d3.extent(store.edges, (d) => d.weight);
        store.ranges.years = {
            min: d3.min(store.edges.map((d) => +d.range.start.substring(0, 4))),
            max: d3.max(store.edges.map((d) => +d.range.end.substring(0, 4))),
        };
        store.ranges.years.array = range(
            store.ranges.years.min,
            store.ranges.years.max,
            1
        );

        transformToWindow();

        // set up handlers
        setEventHandlers();
        setKeyHandlers();
        setMiscHandlers();

        /* // TODO #10: This does not work!
        let transformSettings = loadSettings("transform");
        if (transformSettings) {
            console.log("transform recorded");
            k = transformSettings.k;
            graph.plot.transition(750).call(zoom.scaleTo, transformSettings.k);
            graph.plot.transition(750).call(zoom.translateTo, transformSettings.x, transformSettings.y);
        } else {
            graph.plot.transition(750).call(zoom.scaleTo, AUTO_ZOOM);
        }
        */

        // send us on to filter()
        filter();

        // setup preview TODO: This is currently disabled
        // preview(store);
    });
};

// TODO move to app/filters
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

// TODO move to app/filters
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

// TODO move to app/utils
const modifyGraphNodes = () => {
    graph.nodes.forEach((n) => {
        n.current_degree = nodeHasEdges(n.node_id, true);
    });
};

// TODO move to app/utils
const graphNodesContains = (node_id) => {
    return [...graph.nodes.map((n) => n.node_id)].includes(node_id);
};

// TODO move to app/utils
const graphEdgesContains = (edge_id) => {
    return [...graph.edges.map((e) => e.edge_id)].includes(edge_id);
};

// TODO move to app/utils
const egoNetwork = (node) => {
    // filter nodes based on a given node
    if (window.egoNetwork) {
        console.log("ego network already active - resetting network view...");
        resetLocalStorage();
    } else {
        console.log("filtering out an ego network based on " + node.node_id);
        let related = getRelated(node.node_id);
        console.log("related secondary nodes:");
        console.log(related.secondaryNodeIDs);

        window.egoNetwork = true;

        if (isVisible("#settings") || isVisible("#infoContainer")) {
            console.log("hiding quick access and settings for this one...");
            hide("#settings");
            hide("#infoContainer");
        }

        store.nodes.forEach((n) => {
            if (n.node_id === node.node_id) {
                n.inGraph = true;
            } else if (related.secondaryNodeIDs.includes(n.node_id)) {
                n.inGraph = true;
            } else if (related.tertiaryNodeIDs.includes(n.node_id)) {
                
            } else {
                graph.nodes.forEach((o, i) => {
                    if (n.node_id === o.node_id) {
                        graph.nodes.splice(i, 1);
                    }
                });
                n.inGraph = false;
            }
        });

        store.edges.forEach((e) => {
            if (related.secondaryEdges.includes(e.edge_id) || related.tertiaryEdges.includes(e.edge_id)) {
                console.log("this edge should stay");
                e.inGraph = true;
                if (graphEdgesContains(e.edge_id)) {
                } else {
                    graph.edges.push(e);
                }
            } else {
                if (graphEdgesContains(e.edge_id)) {
                    console.log("this edge should be removed");
                    graph.edges.forEach((o, i) => {
                        if (e.edge_id === o.edge_id) {
                            graph.edges.splice(i, 1);
                        }
                    });
                    e.inGraph = false;
                }
            }
        });

        

        d3.select("#main").on("click", () => {
            if (d3.event.metaKey && window.egoNetwork) {
                console.log(
                    "svg command + click detected while ego network active - resetting network view..."
                );
                resetLocalStorage();
            }
        });
    }

    modifyGraphNodes();
    dropNodesWithNoEdges();
    updateInfo();
    restart();
};

// TODO move to app/filters
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

// TODO move to app/utils
const modifyForceLayout = (settings, node, edge, text) => {
    graph.layout.force("link").links(graph.edges);
    graph.layout.nodes(graph.nodes);
    if (settings.force.layoutCenter) {
        graph.layout.force("center", d3.forceCenter());
        graph.layout.force("center").strength = 1;
    } else {
        graph.layout.force("center", null);
    }
    if (settings.force.layoutForceX) {
        graph.layout.force("forceX", d3.forceX());
    } else {
        graph.layout.force("forceX", null);
    }
    if (settings.force.layoutForceX) {
        graph.layout.force("forceY", d3.forceY());
    } else {
        graph.layout.force("forceY", null);
    }
    if (settings.force.layoutCharge) {
        graph.layout.force("charge", d3.forceManyBody());
        graph.layout.force("charge").strength(settings.force.charge);
    } else {
        graph.layout.force("charge", null);
    }
    if (settings.force.layoutCollide) {
        graph.layout.force("collide", d3.forceCollide());
        graph.layout.force("collide").strength(settings.force.collide);
    } else {
        graph.layout.force("collide", null);
    }

    graph.layout.force("link").strength(0.4);

    graph.layout.on("tick", function (n) {
        node.attr("cx", (n) => n.x);
        node.attr("cy", (n) => n.y);

        edge.attr("x1", (e) => e.source.x);
        edge.attr("y1", (e) => e.source.y);
        edge.attr("x2", (e) => e.target.x);
        edge.attr("y2", (e) => e.target.y);

        text.attr("x", (n) => n.x);
        text.attr("y", (n) => n.y + 4);
    });

    // restart the layout now that everything is set
    graph.layout.restart();
};

// TODO move to app/scales
const nodeScale = (settings) => {
    if (settings === true || settings.nodes.nodeSizeFromCurrent === true) {
        return d3
            .scaleLinear()
            .range([1, 10])
            .domain(d3.extent(graph.nodes, (d) => d.current_degree));
    } else {
        return d3
            .scaleLinear()
            .range([1, 10])
            .domain(d3.extent(graph.nodes, (d) => d.degree));
    }
};

// TODO move to app/scales
const edgeScale = (settings) => {
    if (settings === true || settings.edges.weightFromCurrent === true) {
        return d3
            .scaleLinear()
            .range([settings.edgeMinStroke, settings.edgeMaxStroke])
            .domain(d3.extent(graph.edges, (d) => d.calibrated_weight));
    } else {
        return d3
            .scaleLinear()
            .range([settings.edgeMinStroke, settings.edgeMaxStroke])
            .domain(d3.extent(store.edges, (d) => d.weight));
    }
};

// TODO move to app/utils
const setupInteractivity = (settings, node, edge) => {
    node.call(
        d3
            .drag()
            .on("start", (n) => {
                if (!d3.event.active) graph.layout.alphaTarget(0.3).restart(); // avoid restarting except on the first drag start event
                n.fx = n.x;
                n.fy = n.y;
            })
            .on("drag", (n) => {
                n.fx = d3.event.x;
                n.fy = d3.event.y;
            })
            .on("end", (n) => {
                if (!d3.event.active) graph.layout.alphaTarget(0); // restore alphaTarget to normal value

                if (settings.nodes.stickyNodes) {
                    n.fx = n.x;
                    n.fy = n.y;
                } else {
                    n.fx = null;
                    n.fy = null;
                }
            })
    );

    node.on("click", (n) => {
        d3.event.stopPropagation();
        if (d3.event.metaKey === true) {
            if (nodeIsSelected(n)) {
                hide("#nodeEdgeInfo");
                resetNodesAndEdges();
            }
            egoNetwork(n);
        }
        if (d3.event.altKey === true && n.has_comments) {
            d3.select("#popup-info")
                .html(generateCommentHTML("node", n.node_id))
                .classed("d-none", false)
                .attr(
                    "style",
                    `top: ${d3.event.y}px !important; left: ${d3.event.x}px !important;`
                );
        } else {
            selectNode(n);
        }
    });

    edge.on("click", (e) => {
        d3.event.stopPropagation();
        if (d3.event.altKey === true) {
            //console.log(store.comments.edges)
            //console.log(e.edge_id)
            if (e.has_comments || e.has_general_comments) {
                d3.select("#popup-info")
                    .html(generateCommentHTML("edge", e.edge_id))
                    .classed("d-none", false)
                    .attr(
                        "style",
                        `top: ${d3.event.y}px !important; left: ${d3.event.x}px !important;`
                    );
            }
        } else {
            selectEdge(e);
        }
    });
};

// TODO move to app/utils
const getNodeClass = (n) => {
    let classes = "node " + n.category;
    classes += n.has_comments ? " has-comments" : ""

    return classes;
};

// TODO move to app/utils
const getSize = (n, r_or_text) => {
    let settings = getSettings();
    let yScale = nodeScale(settings);

    if (r_or_text === "r") {
        if (settings.nodes.nodeSizeFromCurrent === true) {
            return yScale(n.current_degree);
        } else {
            return yScale(n.degree);
        }
    } else if (r_or_text === "text") {
        if (settings.nodes.nodeSizeFromCurrent === true) {
            return yScale(n.current_degree) * 1.5;
        } else {
            return yScale(n.degree) * 1.5;
        }
    }
};

// TODO move to app/utils
const getEdgeClass = (e) => {
    let classes = "link";
    
    classes += e.revue_name != "" ? " revue" : " no-revue";
    classes += e.has_comments ? " has-comments" : "";
    classes += e.has_general_comments ? " has-comments" : "";

    return classes
}

// TODO move to app/load
const restart = () => {
    let settings = getSettings();

    // TODO: Rewrite the following node section according to d3's `join` method
    let node = g.nodes
        .selectAll("circle.node")
        .data(graph.nodes, (d) => d.node_id);

    node.exit().transition(750).attr("r", 0).remove();

    let newNode = node
        .enter()
        .append("circle")
        .attr("id", (n) => n.node_id)
        .attr("cx", (n) => n.x)
        .attr("cy", (n) => n.y)
        .attr("class", (n) => getNodeClass(n));

    g.nodes
        .selectAll("circle.node")
        .data(graph.nodes, (d) => d.node_id)
        .transition(750)
        .attr("r", (n) => getSize(n, "r"));

    node = node.merge(newNode);

    // TODO: Rewrite the following text section according to d3's `join` method
    let text = g.nodes
        .selectAll("text.label")
        .data(graph.nodes, (d) => d.node_id);

    text.exit().transition(750).attr("opacity", 0).remove();

    let newText = text
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("style", "pointer-events: none;");

    g.nodes
        .selectAll("text.label")
        .data(graph.nodes, (n) => n.node_id)
        .transition()
        .duration(750)
        .attr("font-size", (n) => getSize(n, "text"))
        .text((n) => {
            if (n.display) {
                return n.display;
            } else {
                return n.id;
            }
        })
        .attr('class', (n) => { return n.has_comments ? 'label has-comments' : 'label' });

    text = text.merge(newText);

    // TODO: Rewrite the following edge section according to d3's `join` method
    let weightScale = edgeScale(settings);

    let edge = g.edges
        .selectAll("line.link")
        .data(graph.edges, (d) => d.edge_id);

    edge.exit().transition(750).attr("stroke-opacity", 0).remove();

    let newEdge = edge
        .enter()
        .append("line")
        .attr("id", (e) => e.edge_id)
        .attr("class", (e) => getEdgeClass(e))
        .attr("x1", (e) => e.source.x)
        .attr("y1", (e) => e.source.y)
        .attr("x2", (e) => e.target.x)
        .attr("y2", (e) => e.target.y)
        .attr("stroke-opacity", 0.3)
        .style("stroke-width", "0px");

    g.edges
        .selectAll("line.link")
        .data(graph.edges, (d) => d.edge_id)
        .style("stroke-width", (e) => {
            let evalWeight = settings.edges.weightFromCurrent
                ? e.calibrated_weight
                : e.weight;
            return weightScale(evalWeight) + "px";
        });

    edge = edge.merge(newEdge);

    setupInteractivity(settings, node, edge);
    modifyForceLayout(settings, node, edge, text);
};

// TODO: move to app/zoom
// TODO: Continue clean-up here... + add docstring.
let zoomed = () => {
    graph.k = Math.round(d3.event.transform.k * 10) / 10;
    saveSettings();
    let windowWidth = window.innerWidth,
        windowHeight = window.innerHeight;
    let xValue = windowWidth / 2 + d3.event.transform.x;
    let yValue = windowHeight / 2 + d3.event.transform.y;
    graph.plot.attr(
        "transform",
        `translate(${xValue}, ${yValue}) scale(${d3.event.transform.k})`
    );
    updateInfo();
};

const zoom = d3.zoom().scaleExtent([0.25, 7]).on("zoom", zoomed);
loadNetwork(); // setup network visualization
graph.svg.call(zoom);
