"use strict";

const testForErroneousNode = (node) => {
    return (
        !node.node_id ||
        node.node_id === "" ||
        node.node_id === "-" ||
        node.node_id === "–" ||
        node.node_id === "—"
    );
};

const setupStoreNodes = (nodeList) => {
    let storeNodes = [];
    let counter = 1;
    nodeList.forEach((node) => {
        let prohibitedID = { match: false };
        if (!node.node_id) {
            let newNode = `unidentifiedNode${counter}`;
            counter++;
            console.error(
                `Unable to find node_id (will set to ${newNode})`,
                node
            );
            node.node_id = newNode;
            return false;
        }
        if (node.node_id.charAt(0).match(/[_—–—.]/))
            prohibitedID = Object.assign(
                { match: true, node_id: node.node_id },
                node.node_id.charAt(0).match(/[_—–—.]/)
            );
        if (prohibitedID.match) console.error(prohibitedID);

        if (testForErroneousNode(node)) {
            console.error("found an erroneous data point:");
            console.error(node);
        } else {
            if (node.display.toLowerCase().includes("unnamed performer")) {
                node.display = "Unnamed performer";
            }

            let has_comments =
                node.comments !== undefined && node.comments.length > 0
                    ? true
                    : false;
            storeNodes.push(
                Object.assign(
                    {
                        inGraph: false,
                        has_comments: has_comments,
                        modularities: {},
                        centralities: {},
                        degrees: {},
                        connected: {},
                    },
                    node
                )
            );
        }
    });
    return storeNodes;
};

const setupStoreEdges = (edgeList) => {
    let storeEdges = [];
    edgeList.forEach((edge) => {
        let newEdge = Object.assign(
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
        storeEdges.push(newEdge);
    });
    storeEdges.forEach((edge) => {
        let testDate = dateParser(edge.date);
        if (testDate && testDate.iso !== undefined) {
            edge.dates.push(testDate.iso);
        }
        if (!edge.found) {
            edge.found = edge.found.filter((found) =>
                found != null && found != "" && found != "" ? true : false
            );
            edge.found = [...new Set(edge.found)];
            edge.found.forEach((source) => {
                let date = moment(source);
                if (!date.isValid()) {
                    console.error(
                        `Date is uninterpretable: ${date}. Trying backup solution...`
                    );
                    let date = dateParser(source);
                } else {
                    date = {
                        date: date,
                        iso: date.format("YYYY-MM-DD"),
                    };
                }
                if (date && date.iso !== undefined) {
                    edge.dates.push(date.iso);
                } else if (date.iso === undefined) {
                    console.error(
                        `Could not interpret date in ${source}. Backup solution failed too.`
                    );
                }
            });
        } else {
            edge.dates = edge.found;
        }

        if (edge.dates) {
            edge.dates = [...new Set(edge.dates)].sort();
            edge.range = {
                start: edge.dates[0],
                end: edge.dates[edge.dates.length - 1],
            };
            edge.range["startYear"] = +edge.range.start.substring(0, 4);
            edge.range["endYear"] = +edge.range.end.substring(0, 4);
        } else {
            console.error("No ranges set. The graph will not render.");
        }

        let locations = Object.keys(edge.coLocated);
        edge.weights.numLocations = locations.length;
        edge.weights.numDateGroups = 0;
        edge.weights.numDates = [];
        Object.keys(edge.coLocated).map((key) => {
            let dateGroups = edge.coLocated[key];
            edge.weights.numDateGroups += 1;
            dateGroups.forEach((dates) => {
                edge.weights.numDates = [...edge.weights.numDates, ...dates];
            });
        });
        edge.weights.numDates = [...new Set(edge.weights.numDates)].length;

        if (!edge.weights.weight) edge.weights.weight = edge.found.length;
    });
    return storeEdges;
};

/**
 * loadNetwork takes no arguments, but loads the entire network, and runs the other appropriate functions at the start of the script.
 * The return value is true if the network file is loaded correctly and all data is set up appropriately.
 */
const loadNetwork = (callback = []) => {
    _output("Called", false, loadNetwork);

    let _ = fetchFromStorage("settings", "loadNetwork");
    let filename = _
        ? _.datafile.filename
        : window.autoSettings.datafile.filename;

    include("includes/project.html").then((html) => {
        d3.select("#project-description").html(html);
    });

    enableSettings();
    document.querySelector("#datafileContainer").removeAttribute("style");

    const networkCleanup = (data) => {
        let p = d3.timeParse('%Y-%m-%d %H:%M:%S')
        data.createdDate = p(data.createdDate);
        data.days = +data.days;
        return data;
    }
    d3.json(filename)
        .then((data) => {
            data = networkCleanup(data);
            console.log(data)
            _output("File loaded", false, loadNetwork);
            // for debug purposes (TODO can be removed)
            store.raw = data;

            d3.select("#createdDate").html(
                `<p><strong>Visualization last generated</strong>: ${store.raw.createdDate}</p>`
            );
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
            if (!store.settingsFinished) setupSettingsInterface("root");

            store.settingsFinished = true;

            // Link up store edges with nodes, and vice versa
            store.edges.forEach((e) => {
                e.source = store.nodes.find((node) => node.id === e.source);
                e.target = store.nodes.find((node) => node.id === e.target);
            });

            store.nodes.forEach((node) => {
                // Set up node.connected.edges for each node
                node.connected.edges = store.edges.filter(
                    (e) =>
                        e.source.node_id === node.node_id ||
                        e.target.node_id === node.node_id
                );

                // Set up node.connected.nodes for each node
                node.connected.nodes = [];
                node.connected.nodes.push(
                    ...node.connected.edges
                        .map((e) => e.source)
                        .filter((n) => n.node_id !== node.node_id)
                );
                node.connected.nodes.push(
                    ...node.connected.edges
                        .map((e) => e.target)
                        .filter((n) => n.node_id !== node.node_id)
                );
                node.connected.nodes = [...new Set(node.connected.nodes)];

                // Set up node.sourceRange for each node
                let startYear = 0;
                let endYear = 0;
                node.connected.edges.forEach((edge) => {
                    let edgeStartYear = edge.range.start
                        ? +edge.range.start.slice(0, 4)
                        : undefined;
                    let edgeEndYear = edge.range.end
                        ? +edge.range.end.slice(0, 4)
                        : undefined;

                    if (startYear === 0 || edgeStartYear < startYear)
                        startYear = edgeStartYear;

                    if (endYear === 0 || edgeEndYear > endYear)
                        endYear = edgeEndYear;
                });

                node.sourceRange =
                    startYear && endYear ? range(startYear, endYear, 1) : [];
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
                _output("Calling callback functions", false, loadNetwork);
                callback.forEach((c) => c["function"](c.settings));
            }

            return true;
        })
        .catch((e) => {
            console.error(e);
            setupSettingInteractivity();
            setupMiscInteractivity();
            disableSettings(["datafile"]);
            toggle("#datafileToggle");
            document
                .querySelector("#datafileContainer")
                .setAttribute("style", "background-color: #ffc107 !important;"); // makes the datafileContainer look like "warning"
            _error(
                `<strong>Data file could not be found.</strong><p class="m-0 small text-muted">${filename}</p><p class="mt-3 mb-0">Select a different datafile in the "data file" dropdown.</p>`
            );
            zoom.on("zoom", null);
            return false;
        });

    /*
    let json_files = [
        "data/co-occurrence-grouped-by-3-days.json",
        "data/co-occurrence-grouped-by-14-days.json",
        "data/co-occurrence-grouped-by-31-days.json",
        "data/co-occurrence-grouped-by-93-days.json",
        "data/co-occurrence-grouped-by-186-days.json",
        "data/co-occurrence-grouped-by-365-days.json",
    ];
    Promise.all(json_files.map(file=>d3.json(file))).then(function(files) {
        files.forEach((file, ix)=>{
            datafiles[json_files[ix]] = file;
        });
        processData(datafiles);
    }).catch(function(err) {
        console.error(err);
    })
    */
};

/*
let datafiles = {};
let processData = (datafiles) => {
    let row = document.createElement('tr')
    let col1 = row.appendChild(document.createElement('td'))
    let col2 = row.appendChild(document.createElement('td'))
    
    col1.appendChild(document.createTextNode(''))
    col2.appendChild(document.createTextNode('nodes'))

    document.querySelector('#data-info thead').append(row);

    let rows = []
    Object.keys(datafiles).forEach(file=>{
        let row = document.createElement('tr')
        let col1 = row.appendChild(document.createElement('td'))
        let col2 = row.appendChild(document.createElement('td'))
        col1.appendChild(document.createTextNode(file))
        col2.appendChild(document.createTextNode(datafiles[file].nodes.length))
        rows.push(row)
    });
    rows.forEach(row=>document.querySelector('#data-info tbody').append(row))
}
*/

/**
 * setupInteractivity takes X argument/s... TODO: Needs docstring
 * The return value is ...
 */
const setupInteractivity = (settings = undefined) => {
    _output("Called", false, setupInteractivity);

    if (!settings) settings = settingsFromDashboard("setupInteractivity");

    nodeElements.on("click", (event, node) => {
        // console.log('event', event);
        // console.log('node', node);
        event.stopPropagation();
        if (event.altKey === true && event.metaKey === true && event.shiftKey === true) {
            dropNode(node);
            return true;
        }
        if (event.metaKey === true) {
            if (nodeIsSelected(node)) {
                hide("#nodeEdgeInfo");
                styleGraphElements();
            }
            _output("Starting egoNetwork...", false, setupInteractivity);
            toggleEgoNetwork(node);
            node.fx = null;
            node.fy = null;
            return true;
        }
        toggleNode(node);
        return true;
    });

    textElements.on("click", (event, node) => {
        event.stopPropagation();
        if (event.altKey === true && event.metaKey === true && event.shiftKey === true) {
            let nodes = [];
            graph.nodes.forEach(n=>{
                if (n !== node) {
                    nodes.push(n);
                }
            })
            filter(nodes);
            return true;
        }
        toggleNode(node);
        return true;
    });

    edgeElements.on("mouseover", (event, edge) => {
        if (!window.nodeSelected && !window.edgeSelected) quickEdgeInfo(edge);
    });

    edgeElements.on("click", (event, edge) => {
        event.stopPropagation();
        quickEdgeInfo(edge);
        if (window.toggledCommentedElements) {
            if (edge.has_comments || edge.has_general_comments) {
                window._selectors["popup-info"]
                    .html(generateCommentHTML(edge))
                    .classed("d-none", false)
                    .attr("edge-id", edge.edge_id)
                    .attr(
                        "style",
                        `top: ${event.y}px !important; left: ${event.x}px !important;`
                    );
            }
        } else {
            toggleEdge(edge);
        }
    });

    nodeElements.call(
        d3
            .drag()
            .on("start", (event, node) => {
                // if (!event.active) graph.simulation.alphaTarget(0.3).restart(); // avoid restarting except on the first drag start event
                node.fx = node.x;
                node.fy = node.y;
            })
            .on("drag", (event, node) => {
                d3.select(`circle#${node.node_id}`).raise();
                d3.select(`text[data-node=${node.node_id}]`).raise();
                node.fx = event.x;
                node.fy = event.y;
            })
            .on("end", (event, node) => {
                //if (!event.active) graph.simulation.alphaTarget(0); // restore alphaTarget to normal value

                if (settings.nodes.stickyNodes) {
                    node.fx = node.x;
                    node.fy = node.y;
                } else {
                    node.fx = null;
                    node.fy = null;
                }
            })
    );
    
    textElements.call(
        d3
            .drag()
            .on("start", (event, node) => {
                // if (!event.active) graph.simulation.alphaTarget(0.3).restart(); // avoid restarting except on the first drag start event
                node.fx = node.x;
                node.fy = node.y;
            })
            .on("drag", (event, node) => {
                d3.select(`circle#${node.node_id}`).raise();
                d3.select(`text[data-node=${node.node_id}]`).raise();
                node.fx = event.x;
                node.fy = event.y;
            })
            .on("end", (event, node) => {
                //if (!event.active) graph.simulation.alphaTarget(0); // restore alphaTarget to normal value

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
    _output("Called", false, setupFilteredElements);

    nodeElements = g.nodes
        .selectAll("circle")
        .data(graph.nodes, (node) => node.node_id)
        .join(
            (enter) =>
                enter
                    .append("circle")
                    .attr("r", 0)
                    .attr("id", (node) => node.node_id)
                    .attr("stroke-width", 0.1)
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
                    .text((node) => node.display)
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
    let output_msgs = ["Called"];

    if (
        store.ranges.nodeDegree &&
        store.ranges.edgeWidth &&
        store.ranges.years.min &&
        store.ranges.years.max &&
        store.ranges.years.array
    ) {
        output_msgs.push("Ranges already existed");
        _output(output_msgs, false, loadStoreRanges);
        return store.ranges;
    }

    store.ranges.nodeDegree = d3.extent(store.nodes, node=>node.degrees.degree);
    store.ranges.edgeWidth = d3.extent(store.edges, edge=>edge.weights.weight);

    store.ranges.years = {
        min: d3.min(
            store.edges.map((d) =>
                d.range.start ? +d.range.start.substring(0, 4) : 1930
            )
        ),
        max: d3.max(
            store.edges.map((d) =>
                d.range.end ? +d.range.end.substring(0, 4) : 1930
            )
        ),
    };

    store.ranges.years.array = range(
        store.ranges.years.min,
        store.ranges.years.max,
        1
    );

    // setup the setting nodes
    let options = "";
    store.ranges.years.array.forEach((year) => {
        options += `<option value="${year}">${year}</option>`;
    });
    window._elements.startYear.innerHTML = options;
    window._elements.endYear.innerHTML = options;

    // setup the community algorithms
    options = "";
    let algorithms = ["", ...store.algorithms];

    algorithms.forEach((algorithm) => {
        if (algorithm === "jLouvain") {
            options += "<option disabled>Dynamic</option>";
        } else if (!algorithm) {
            options += "<option disabled>Off</option>";
        }

        options += `<option value="${algorithm}">${
            algorithm ? algorithm : "No community detection"
        }</option>`;

        if (algorithm === "jLouvain")
            options += "<option disabled>Entire graph</option>";
    });
    window._elements.communityDetection.innerHTML = options;

    // setup the "weight from" option
    options = "";
    let weightFromOptions = {
        numDates: "Total number of co-appearing dates",
        numLocations: "Number of co-appearing venues",
        numDateGroups: "Number of co-appearing periods",
    };
    Object.entries(weightFromOptions).forEach(([value, text]) => {
        options += `<option value="${value}">${text}</option>`;
    });
    window._elements.weightFrom.innerHTML = options;

    // setup the "weight from" option
    options = "";
    let rFromOptions = {
        currentDegree: "Degree in current network",
        degrees__degree: "Overall degree",
        "": "Centrality measures",
        betweenness_centrality: "Betweenness",
        closeness_centrality: "Closeness",
        degree_centrality: "Degree",
        eigenvector_centrality: "Eigenvector",
    };
    Object.entries(rFromOptions).forEach(([value, text]) => {
        if (!value) options += `<option disabled>${text}</option>`;
        else options += `<option value="${value}">${text}</option>`;
    });
    window._elements.rFrom.innerHTML = options;

    output_msgs.push("Finished", store.ranges);
    _output(output_msgs, false, loadStoreRanges);
    return store.ranges;
};
