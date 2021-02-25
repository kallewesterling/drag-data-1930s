"use strict";

/**
 * loadNetwork takes no arguments, but loads the entire network, and runs the other appropriate functions at the start of the script.
 * The return value is true if the network file is loaded correctly and all data is set up appropriately.
 */
const loadNetwork = () => {
    loading("loadNetwork called...");
    let settings = getSettings();
    // console.log(settings);
    
    enableSettings();
    document.querySelector('#datafileContainer').removeAttribute('style');
    d3.json(settings.datafile.filename).then((data) => {
        // for debug purposes (TODO can be removed)
        store.raw = data;

        // set up store.comments
        store.comments = Object.assign({}, data.comments);

        // set up store.count
        store.count = Object.assign({}, data.count);

        // set up store.nodes
        let counter = 1;
        data.nodes.forEach((node) => {
            let prohibitedID = {match: false}
            if (!node.node_id) {
                let newNode = `unidentifiedNode${counter}`;
                counter++;
                console.error(`Unable to find node_id (will set to ${newNode})`, node);
                node.node_id = newNode;
                return false;
            }
            if (node.node_id.charAt(0).match(/[_—–—.]/)) prohibitedID = Object.assign({match: true, node_id: node.node_id}, node.node_id.charAt(0).match(/[_—–—.]/));
            if (prohibitedID.match) console.error(prohibitedID)
            
            if (
                !node.node_id ||
                node.node_id === "" ||
                node.node_id === "-" ||
                node.node_id === "–" ||
                node.node_id === "—"
            ) {
                console.error("found an erroneous data point:");
                console.error(node);
            } else {
                let has_comments = node.comments !== undefined && node.comments.length > 0 ? true : false;
                store.nodes.push(
                    Object.assign(
                        {
                            inGraph: false,
                            has_comments: has_comments,
                        },
                        node
                    )
                );
            }
        });

        // set up store.edges
        data.links.forEach((edge) => {
            let newEdge = undefined
            if (settings.datafile == 'drag-data-bipartite.json') {
                newEdge = Object.assign(
                    {
                        has_revue_comments: edge.revue_comments.length > 0 ? true : false,
                        has_venue_comments: edge.venue_comments.length > 0 ? true : false,
                        inGraph: false,
                        dates: [],
                        range: { start: undefined, end: undefined },
                    },
                    edge
                    );
            } else {
                newEdge = Object.assign(
                {
                    has_comments: edge.comments.length > 0 ? true : false,
                    has_general_comments:
                    edge.general_comments.length > 0 ? true : false,
                    inGraph: false,
                    dates: [],
                    range: { start: undefined, end: undefined },
                },
                edge
                );
            }
            store.edges.push(newEdge);
        });
        store.edges.forEach((e) => {
            if (settings.datafile == 'drag-data-bipartite.json') {
                e.found = e.sources;
            }
            e.found = e.found.filter((found) =>
                found != null && found != "" && found != "" ? true : false
            );
            e.found = [...new Set(e.found)];
            e.found.forEach((source) => {
                let date = dateParser(source);
                if (date && date.iso !== undefined) {
                    e.dates.push(date.iso);
                } else if (date.iso === undefined) {
                    let testDate = dateParser(e.date);
                    if (testDate && testDate.iso !== undefined) {
                        if (window.ERROR_LEVEL > 1) {
                            console.info(`Could not interpret date in source. Adding date associated with edge (${testDate.iso}) instead:`);
                            console.error(source);
                        }
                    } else {
                        console.error(`Could not interpret date in ${source}. Backup solution failed too.`);
                    }
                }
            });
            if (e.dates) {
                e.dates = [...new Set(e.dates)].sort();
                e.range = {
                    start: e.dates[0],
                    end: e.dates[e.dates.length - 1],
                };
            }

            e.source = store.nodes.find((node) => node.id === e.source); // set up as object
            e.target = store.nodes.find((node) => node.id === e.target); // set up as object

            // fix weight... TODO: Should really fix this in the Python script!
            e.weight = e.found.length;
        });

        loadStoreRanges();

        store.nodes.forEach((node) => {
            node.allEdges = store.edges.filter(
                (e) =>
                    e.source.node_id === node.node_id ||
                    e.target.node_id === node.node_id
            );

            node.allEdges.forEach((edge) => {
                let startYear = edge.range.start
                    ? +edge.range.start.slice(0, 4)
                    : undefined;
                let endYear = edge.range.end
                    ? +edge.range.end.slice(0, 4)
                    : undefined;

                node.sourceRange =
                    startYear && endYear ? range(startYear, endYear, 1) : [];
            });
        });

        settingsSetupYearRange(undefined, undefined, false);

        // set up handlers
        setupKeyHandlers();
        setupSettingInteractivity();
        setupMiscInteractivity();

        // send us on to filter()
        filter();

        // setup preview TODO: This is currently disabled
        // preview(store);
        
        return true;
    }).catch(e=> {
        console.error(e);
        setupSettingInteractivity();
        setupMiscInteractivity();
        disableSettings(['datafile']);
        document.querySelector('#datafileContainer').setAttribute('style', 'background-color: #ffc107 !important;'); // makes the datafileContainer look like "warning"
        error(`<strong>Data file could not be found.</strong><p class="m-0 small text-muted">${settings.datafile.filename}</p><p class="mt-3 mb-0">Select a different datafile in the "data file" dropdown.</p>`);
        zoom.on("zoom", null);
        return false;
    });
};

/**
 * setupInteractivity takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const setupInteractivity = () => {
    loading("setupInteractivity called...");

    let settings = getSettings();
    nodeElements.call(
        d3
            .drag()
            .on("start", (node) => {
                if (!d3.event.active)
                    graph.simulation.alphaTarget(0.3).restart(); // avoid restarting except on the first drag start event
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
        /*
        if (window.restoreTransform) {
            // we are in a zoomed position, let's go back to where we were!
            console.log('zoom out to:', window.restoreTransform)
            graph.svg.call(zoom.transform, d3.zoomIdentity.translate(window.restoreTransform.x, window.restoreTransform.y).scale(window.restoreTransform.k))
            window.restoreTransform = undefined;
            return true;
        }
        */
        if (d3.event.metaKey === true) {
            if (nodeIsSelected(node)) {
                hide("#nodeEdgeInfo");
                updateGraphElements();
            }
            loading("starting egoNetwork...");
            toggleEgoNetwork(node);
            node.fx = null;
            node.fy = null;
            return true;
        /* // This clause is no longer effective since I have moved things around in the latest version.
        } else if (window.toggledCommentedElements && node.has_comments) {
            d3.select("#popup-info")
                .html(generateCommentHTML(node))
                .classed("d-none", false)
                .attr("node-id", node.node_id)
                .attr(
                    "style",
                    `top: ${d3.event.y}px !important; left: ${d3.event.x}px !important;`
                );
            return true;
        */
        } else {
            /*
            // testing zoom into node
            window.restoreTransform = {x: graph.x, y: graph.y, k: graph.k}

            graph.svg.transition()
                .duration(750)
                .call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(0, 0)
                        .scale(4)
                        .translate(-node.x, -node.y),
                    d3.mouse(graph.svg.node())
                );
            */
            selectNode(node);
            return true;
        }
    });

    edgeElements.on("click", (edge) => {
        d3.event.stopPropagation();
        if (window.toggledCommentedElements) {
            if (edge.has_comments || edge.has_general_comments) {
                d3.select("#popup-info")
                    .html(generateCommentHTML(edge))
                    .classed("d-none", false)
                    .attr("edge-id", edge.edge_id)
                    .attr(
                        "style",
                        `top: ${d3.event.y}px !important; left: ${d3.event.x}px !important;`
                    );
            }
        } else {
            selectEdge(edge);
        }
    });
};

let textElements = g.labels.selectAll("text"),
    nodeElements = g.nodes.selectAll("circle"),
    edgeElements = g.edges.selectAll("line");

/**
 * updateElements takes no arguments.
 * The return value is always true.
 * @returns {boolean} - true
 */
const updateElements = () => {
    loading("updateElements called...");

    nodeElements = g.nodes
        .selectAll("circle")
        .data(graph.nodes, (node) => node.node_id)
        .join(
            (enter) =>
                enter
                    .append("circle")
                    .attr("r", 0)
                    .attr("id", (node) => node.node_id)
                    .attr("class", getNodeClass(node)),
            (update) => update,
            (exit) => exit.transition(750).attr("r", 0).remove()
        );

    textElements = g.labels
        .selectAll("text")
        .data(graph.nodes, (node) => node.node_id)
        .join(
            (enter) =>
                enter
                    .append("text")
                    .text(node => node.display)
                    .attr("class", (node) => getTextClass(node))
                    .attr("style", "pointer-events: none;")
                    .attr("opacity", 0)
                    .attr("data-node", (node) => node.node_id),
            (update) => update,
            (exit) => exit.transition(750).attr("opacity", 0).remove()
        );

    edgeElements = g.edges
        .selectAll("line")
        .data(graph.edges, (edge) => edge.edge_id)
        .join(
            (enter) =>
                enter
                    .append("line")
                    .attr("id", (edge) => edge.edge_id)
                    .attr("stroke-opacity", 0.3),
            (update) => update,
            (exit) => exit.transition(750).attr("stroke-opacity", 0).remove()
        );

    setupInteractivity();
    modifySimulation();

    return true;
};
