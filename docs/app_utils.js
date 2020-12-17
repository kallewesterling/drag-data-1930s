/**
 * nodeHasEdges takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const nodeHasEdges = (node_id, count = false) => {
    let n = graph.nodes.filter((n) => {
        return n.node_id === node_id ? n : false;
    });

    if (n.length == 1) {
        n = n[0];
    } else if (n.length < 1) {
        if (count === true) {
            return 0;
        } else {
            return false;
        }
    } else {
        // console.error("Found more than one node with ID " + node_id); // TODO: #9 This is strange...
    }

    let returnValue = false,
        counted = 0;

    graph.edges.filter((d) => {
        if (d.source.node_id === n.node_id) {
            returnValue = true;
            counted += 1;
        }
        if (d.target.node_id === n.node_id) {
            returnValue = true;
            counted += 1;
        }
    });

    return count === true ? counted : returnValue;
};

/**
 * getUnconnectedNodes takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const getUnconnectedNodes = () => {
    _ = [];
    graph.nodes.forEach((n) => {
        if (nodeHasEdges(n.node_id) === false) {
            _.push(n);
        }
    });
    return _;
};

/**
 * hasUnconnectedNodes takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const hasUnconnectedNodes = () => {
    return getUnconnectedNodes().length > 0;
};

/**
 * dropNodesWithNoEdges takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * updateInfo takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const updateInfo = () => {
    d3.select("#info").classed("d-none", false);
    d3.select("#info").html(`
        <p>Graph nodes: ${graph.nodes.length}/${store.nodes.length}</p>
        <p>Graph edges: ${graph.edges.length}/${store.edges.length}</p>
        <hr />
        <p>Unconnected nodes: ${getUnconnectedNodes().length}</p>
        <hr />
        <p>Current zoom: ${graph.k}</p>
    `);
};

/**
 * troubleshoot takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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
        // checking for inconsistency in data...
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

/**
 * debugMessage takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const debugMessage = (message, header) => {
    if (getSettings().debugMessages === false) {
        // console.log("[debugMessage: " + header + "] " + message);
        console.log("debugMessage suppressed.");
        return false;
    }
    if (!header) {
        header = "Warning";
    }
    let _id = `toast${store.toasterCounter}`;
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
    store.toasterCounter += 1;
};

/**
 * isVisible takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const isVisible = (selector) => {
    return d3.select(selector).classed("d-none") === false;
};

/**
 * toggle takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const toggle = (selector) => {
    d3.select(selector).classed("d-none", isVisible(selector));

    // special rules
    if (selector === "#settingsContainer") {
        d3.select("#settingsToggle").classed("toggled", !isVisible(selector));
    } else if (selector === "#infoToggleDiv") {
        d3.select("#infoToggle").classed("toggled", !isVisible(selector));
    }
};

/**
 * hide takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const hide = (selector) => {
    d3.select(selector).classed("d-none", true);
};

/**
 * restartLayout takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const restartLayout = () => {
    graph.layout.stop();
    graph.layout.alpha(1);
    graph.layout.restart();
};

/**
 * displayOrID takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const displayOrID = (elem) => {
    return elem.display != undefined ? elem.display : elem.id;
};

/**
 * setNodeEdgeInfo takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const setNodeEdgeInfo = (elem) => {
    let _html = "";
    let settings = getSettings();
    if (elem.node_id) {
        _html = `<p><strong>${displayOrID(elem)}</strong></p>
        <p>degree: ${elem.degree}</p>
        <p>--> in: ${elem.indegree}</p>
        <p>--> out: ${elem.outdegree}</p>
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
        // TODO: Do something interactive with these?
        /*
        let related = getRelated(elem.node_id);
            <p>Secondary: ${related.secondaryNodeIDs}</p>
            <p>Tertiary: ${related.tertiaryNodeIDS}</p>
        */
    } else if (elem.edge_id) {
        let strongCurrent =
            settings.edges.weightFromCurrent === true
                ? ["<strong>", "</strong>"]
                : ["", ""];
        let strongGlobal =
            settings.edges.weightFromCurrent === false
                ? ["<strong>", "</strong>"]
                : ["", ""];

        _html = `<p><strong>${displayOrID(elem.source)} - ${displayOrID(
            elem.target
        )}</strong></p>
        <table class="table"><tbody>
        <tr><td>${strongGlobal[0]}Weight:${strongGlobal[1]}</td><td>${
            strongGlobal[0]
        }${elem.weight}${strongGlobal[1]}</td></tr>
        <tr><td>${strongCurrent[0]}Current weight:${strongCurrent[1]}</td><td>${
            strongCurrent[0]
        }${elem.calibrated_weight}${strongCurrent[1]}</td></tr>`;
        if (elem.revue) {
            _html += `<tr><td>Revue mentioned:</td><td>${elem.revue_name}</td></tr>`;
        }
        if (elem.range.start && elem.range.end) {
            _html += `<tr><td>Range:</td><td>${elem.range.start}–${elem.range.end}</td></tr>`;
        } else if (elem.range.start) {
            _html += `<tr><td>Range:</td><td>${elem.range.start}–</td></tr>`;
        }
        if (elem.comment) {
            _html += `<tr><td>Comment:</td><td>${elem.comment}</td></tr>`;
        }
        if (elem.found) {
            let plural = elem.found.length > 1 ? "s" : "";
            _html += `<tr><td>Found in:</td><td>${elem.found.length} source${plural}</td></tr>
            <tr><td colspan="2">
            <ul>`;
            elem.found.forEach((source) => {
                _html += `<li>${source}</li>`;
            });
            _html += `</ul></td></tr>`;
        }
        _html += `<tr><td>Edge ID:</td><td>${elem.edge_id}</td></tr>`;
        _html += `</table>`;
    }
    d3.select("#nodeEdgeInfo").classed("d-none", false).html(_html);
};

/**
 * nodeIsSelected takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const nodeIsSelected = (node) => {
    return d3.select(`#${node.node_id}`).classed("selected");
};

/**
 * edgeIsSelected takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const edgeIsSelected = (edge) => {
    return d3.select(`#${edge.edge_id}`).classed("selected");
};

/**
 * deselectNodes takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * deselectEdges takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * getRelatedEdges takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * selectRelatedEdges takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * getRelated takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * unselectNodes takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * resetNodesAndEdges takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * selectNode takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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

/**
 * selectEdge takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
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
