"use strict";

const setupStoreNodes = (nodeList) => {
    let storeNodes = [];
    let counter = 1;
    nodeList.forEach((node) => {
        console.log(node)
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
            storeNodes.push(
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
    return storeNodes;
}

const setupStoreEdges = (edgeList) => {
    let storeEdges = [];
    edgeList.forEach((edge) => {
        let newEdge = Object.assign({
                has_comments: edge.comments.length > 0 ? true : false,
                has_general_comments:
                edge.general_comments.length > 0 ? true : false,
                inGraph: false,
                dates: [],
                range: { start: undefined, end: undefined },
            }, edge);
        storeEdges.push(newEdge);
    });
    storeEdges.forEach((e) => {
        let testDate = dateParser(e.date);
        if (testDate && testDate.iso !== undefined) {
            e.dates.push(testDate.iso);
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
                        e.dates.push(testDate.iso);
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
            e.range['startYear'] = +e.range.start.substring(0, 4);
            e.range['endYear'] = +e.range.end.substring(0, 4);
        }

        // fix weight... TODO: Should really fix this in the Python script!
        e.weight = e.found.length;
    });
    return storeEdges;
}

/**
 * loadNetwork takes no arguments, but loads the entire network, and runs the other appropriate functions at the start of the script.
 * The return value is true if the network file is loaded correctly and all data is set up appropriately.
 */
const loadNetwork = (callback=[]) => {
    output("Called", false, loadNetwork);
    
    let _ = fetchFromStorage('settings', 'loadNetwork')
    let filename = _ ? _.datafile.filename : _autoSettings.datafile.filename;

    enableSettings();
    document.querySelector('#datafileContainer').removeAttribute('style');
    d3.json(filename).then((data) => {
        output("File loaded", false, loadNetwork);
        // for debug purposes (TODO can be removed)
        store.raw = data;

        // set up store
        store.comments = Object.assign({}, data.comments);
        store.count = Object.assign({}, data.count);
        store.nodes = setupStoreNodes(data.nodes);
        store.edges = setupStoreEdges(data.links);

        loadStoreRanges();

        if (_) {
            if (_.edges.startYear < store.ranges.years.min) {
                // TODO: set startYear to store.ranges.years.min
            }

            if (_.edges.endYear > store.ranges.years.max) {
                // TODO: set endYear to store.ranges.years.max
            }
        }

        // setup settings box
        if (!store.settingsFinished)
            setupSettingsInterface("root");

        store.settingsFinished = true;

        // Link up store edges with nodes, and vice versa
        store.edges.forEach(e => {
            e.source = store.nodes.find((node) => node.id === e.source);
            e.target = store.nodes.find((node) => node.id === e.target);
        })

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

        // set up handlers
        setupKeyHandlers();
        setupSettingInteractivity();
        setupMiscInteractivity();

        // send us on to filter()
        filter();

        // setup preview TODO: This is currently disabled
        // preview(store);
        
        if (callback) {
            output('Calling callback functions', false, loadNetwork)
            callback.forEach(c=>c['function'](c.settings));
        }

        return true;
    }).catch(e=> {
        console.error(e);
        setupSettingInteractivity();
        setupMiscInteractivity();
        disableSettings(['datafile']);
        toggle('#datafileToggle');
        document.querySelector('#datafileContainer').setAttribute('style', 'background-color: #ffc107 !important;'); // makes the datafileContainer look like "warning"
        error(`<strong>Data file could not be found.</strong><p class="m-0 small text-muted">${filename}</p><p class="mt-3 mb-0">Select a different datafile in the "data file" dropdown.</p>`);
        zoom.on("zoom", null);
        return false;
    });
};

/**
 * setupInteractivity takes X argument/s... TODO: Needs docstring
 * The return value is ...
 */
const setupInteractivity = (settings = undefined) => {
    output("Called", false, setupInteractivity);

    if (!settings)
        settings = settingsFromDashboard('setupInteractivity');

    nodeElements.on("click", (node) => {
        d3.event.stopPropagation();
        if (d3.event.metaKey === true) {
            if (nodeIsSelected(node)) {
                hide("#nodeEdgeInfo");
                styleGraphElements();
            }
            output("Starting egoNetwork...", false, setupInteractivity);
            toggleEgoNetwork(node);
            node.fx = null;
            node.fy = null;
            return true;
        } else {
            selectNode(node);
            return true;
        }
    });

    edgeElements.on("click", (edge) => {
        d3.event.stopPropagation();
        if (window.toggledCommentedElements) {
            if (edge.has_comments || edge.has_general_comments) {
                window._selectors["popup-info"]
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
};

let textElements = g.labels.selectAll("text"),
    nodeElements = g.nodes.selectAll("circle"),
    edgeElements = g.edges.selectAll("line");

/**
 * setupFilteredElements is called after filtering and contains all the d3 logic to process the filtered data. It takes no arguments.
 * The function inherits settings from filter as they will not have changed since.
 * The return value is always true.
 * @returns {boolean} - true
 */
const setupFilteredElements = (settings = undefined) => {
    output("Called", false, setupFilteredElements);

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

    setupInteractivity(settings);
    modifySimulation(settings);

    return true;
};


const loadStoreRanges = () => {
    let output_msgs = ["Called"]

    if (store.ranges.nodeDegree && store.ranges.edgeWidth && store.ranges.years.min && store.ranges.years.max && store.ranges.years.array) {
        output_msgs.push("Ranges already existed");
        output(output_msgs, false, loadStoreRanges);
        return store.ranges;
    }

    store.ranges.nodeDegree = d3.extent(store.nodes, (d) => d.degree);
    store.ranges.edgeWidth = d3.extent(store.edges, (d) => d.weight);

    store.ranges.years = {
        min: d3.min(store.edges.map((d) => d.range.start? +d.range.start.substring(0, 4) : 1930)),
        max: d3.max(store.edges.map((d) => d.range.end? +d.range.end.substring(0, 4) : 1930 )),
    };
    
    store.ranges.years.array = range(
        store.ranges.years.min,
        store.ranges.years.max,
        1
    );
    
    // setup the setting nodes
    let options = ""
    store.ranges.years.array.forEach((year) => {
        options += `<option value="${year}">${year}</option>`;
    });
    window._elements.startYear.innerHTML = options;
    window._elements.endYear.innerHTML = options;

    output_msgs.push("Finished", store.ranges);
    output(output_msgs, false, loadStoreRanges);
    return store.ranges;
}
