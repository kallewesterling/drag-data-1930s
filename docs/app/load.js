"use strict";

/**
 * loadNetwork takes no arguments, but loads the entire network, and runs the other appropriate functions at the start of the script.
 * The return value is true in all cases.
 */
const loadNetwork = () => {
    loading('loadNetwork called...');
    d3.json(DATAFILE).then((data) => {
        // for debug purposes (TODO can be removed)
        store.raw = data;

        // set up store.comments
        store.comments = Object.assign({}, data.comments);

        // set up store.count
        store.count = Object.assign({}, data.count);

        // set up store.nodes
        data.nodes.forEach((d) => {
            if (
                d.node_id === "" ||
                d.node_id === "-" ||
                d.node_id === "–" ||
                d.node_id === "—"
            ) {
                console.error("found an erroneous data point:");
                console.log(d);
            } else {
                store.nodes.push(
                    Object.assign(
                        {
                            inGraph: false,
                            has_comments: d.comments.length > 0 ? true : false,
                        },
                        d
                    )
                );
            }
        });

        // set up store.edges
        data.links.forEach((e) => {
            store.edges.push(
                Object.assign(
                    {
                        has_comments: e.comments.length > 0 ? true : false,
                        has_general_comments:
                            e.general_comments.length > 0 ? true : false,
                        inGraph: false,
                        dates: [],
                        range: { start: undefined, end: undefined },
                    },
                    e
                )
            );
        });
        store.edges.forEach((e) => {
            e.source = store.nodes.find((node) => node.id === e.source); // set up as object
            e.target = store.nodes.find((node) => node.id === e.target); // set up as object
            e.found = e.found.filter((found) => found != null && found != "" && found != "" ? true : false);
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
        setupKeyHandlers();
        setupSettingInteractivity();
        setupMiscInteractivity();

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
    return true;
};

/**
 * setupInteractivity takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const setupInteractivity = () => {
    loading('setupInteractivity called...');

    let settings = getSettings();
    nodeElements.call(
        d3
            .drag()
            .on("start", (node) => {
                if (!d3.event.active) graph.simulation.alphaTarget(0.3).restart(); // avoid restarting except on the first drag start event
                node.fx = node.x;
                node.fy = node.y;
            })
            .on("drag", (node) => {
                node.fx = d3.event.x;
                node.fy = d3.event.y;
            })
            .on("end", (node) => {
                if (!d3.event.active) graph.simulation.alphaTarget(0); // restore alphaTarget to normal value

                if (settings.nodes.stickyNodes) {
                    node.fx = node.x;
                    node.fy = node.y;
                } else {
                    node.fx = null;
                    node.fy = null;
                }
            })
    );

    nodeElements.on("click", (node) => {
        d3.event.stopPropagation();
        if (d3.event.metaKey === true) {
            if (nodeIsSelected(node)) {
                hide("#nodeEdgeInfo");
                resetGraphElements();
            }
            loading('starting egoNetwork...')
            toggleEgoNetwork(node);
            // return true;
        } else if (d3.event.altKey === true && node.has_comments) {
            d3.select("#popup-info")
                .html(generateCommentHTML(node))
                .classed("d-none", false)
                .attr(
                    "style",
                    `top: ${d3.event.y}px !important; left: ${d3.event.x}px !important;`
                );
        } else {
            selectNode(node);
        }
    });

    edgeElements.on("click", (e) => {
        d3.event.stopPropagation();
        if (d3.event.altKey === true) {
            if (e.has_comments || e.has_general_comments) {
                d3.select("#popup-info")
                    .html(generateCommentHTML(e))
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

let textElements = g.labels.selectAll("text"),
    nodeElements = g.nodes.selectAll("circle"),
    edgeElements = g.edges.selectAll("line");

/**
 * reloadNetwork takes no arguments.
 * The return value is always true.
 * @returns {boolean} - true
 */
const reloadNetwork = () => {
    loading('reloadNetwork called...')

    nodeElements = g.nodes
        .selectAll("circle")
        .data(graph.nodes, (node) => node.node_id)
        .join(
            enter => enter.append("circle")
                            .attr("r", 0)
                            .attr("id", (node) => node.node_id)
                            .attr("class", (node) => getNodeClass(node)),
            update => update,
            exit => exit.transition(750).attr("r", 0).remove()
        );

    textElements = g.labels
        .selectAll("text")
        .data(graph.nodes, (node) => node.node_id)
        .join(
            enter => enter.append("text")
                            .text((node) => displayOrID(node))
                            .attr("class", node => getTextClass(node))
                            .attr("style", "pointer-events: none;")
                            .attr("opacity", 0),
            update => update,
            exit => exit.transition(750).attr("opacity", 0).remove()
        );

    edgeElements = g.edges
        .selectAll("line")
        .data(graph.edges, (edge) => edge.edge_id).join(
            enter => enter.append("line")
                            .attr("id", edge => edge.edge_id)
                            .attr("stroke-opacity", 0.3),
            update => update,
            exit => exit.transition(750).attr("stroke-opacity", 0).remove()
        );

    setupInteractivity();
    modifySimulation();

    return true;
};
