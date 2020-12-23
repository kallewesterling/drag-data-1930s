"use strict";

/**
 * getInfoHTML takes no arguments but generates the HTML for the viz information.
 * The return value is always the HTML itself.
 * @return {string} html - raw HTML
 */
const getInfoHTML = () => {
    let html = `
        <p>Graph nodes: ${graph.nodes.length}/${store.nodes.length}</p>
        <p>Graph edges: ${graph.edges.length}/${store.edges.length}</p>
        <hr />
        <p>Unconnected nodes: ${getUnconnectedNodes().length}</p>
        <hr />
        <p>Current zoom: ${graph.k}</p>
        <p>Current x, y: ${graph.x}, ${graph.y}</p>`;
    return html;
};

/**
 * displayOrID takes one argument, which is any object.
 * The return value is a string, which is in descending order, the `display` property from the object, the `id` property of the object, or an empty string.
 * @param {Object} - Any given object
 * @returns {string} - A string for display
 */
const displayOrID = (o) => {
    let returnValue = o.display != undefined ? o.display : o.id;
    returnValue = returnValue === undefined ? "" : returnValue;
    return returnValue;
};

/**
 * generateNodeInfoHTML takes one required argument, the d3 selector for a given node.
 * The return value is always the HTML with the selected information about the node.
 * @param {Object} node - d3 selector for a given node.
 * @return {string} html - raw HTML
 */
const generateNodeInfoHTML = (node) => {
    console.log(node)
    let html = `<p><strong>${displayOrID(node)}</strong></p>
        <p>degree: ${node.degree}</p>
        <p>—> in: ${node.indegree}</p>
        <p>—> out: ${node.outdegree}</p>
        <p>current network degree: ${node.currentDegree}</p>
        <p class="mt-2"><strong>Source range</strong></p>
        <p>${d3.min(node.sourceRange)}-${d3.max(node.sourceRange)}</p>
        <p class="mt-2"><strong>Centrality measures (across network)</strong></p>
        <p>Betweenness (1000x): ${
            Math.round(node["1000x-betweenness-centrality"] * 100) / 100
        }</p>
        <p>Closeness (1000x): ${
            Math.round(node["1000x-closeness-centrality"] * 100) / 100
        }</p>
        <p>Degree (1000x): ${
            Math.round(node["1000x-degree-centrality"] * 100) / 100
        }</p>
        <p>Eigenvector (1000x): ${
            Math.round(node["1000x-eigenvector-centrality"] * 100) / 100
        }</p>`;
        // TODO: Do something interactive with these?
        /*
        <p class="mt-2"><strong>Related nodes</strong></p>`;
        let related = getRelated(node.node_id);
            <p>Secondary: ${related.secondaryNodeIDs}</p>
            <p>Tertiary: ${related.tertiaryNodeIDS}</p>
        */
    return html;
};

/**
 * generateEdgeInfoHTML takes one required argument, the d3 selector for a given edge.
 * The return value is always the HTML with the selected information about the edge.
 * @param {Object} edge - d3 selector for a given edge.
 * @return {string} html - raw HTML
 */
const generateEdgeInfoHTML = (edge) => {
    let settings = getSettings();
    let strongCurrent =
        settings.edges.weightFromCurrent === true
            ? ["<strong>", "</strong>"]
            : ["", ""];
    let strongGlobal =
        settings.edges.weightFromCurrent === false
            ? ["<strong>", "</strong>"]
            : ["", ""];

    let html = `<p><strong>${displayOrID(edge.source)} - ${displayOrID(
        edge.target
    )}</strong></p>
                <table class="table"><tbody>
                <tr><td>${strongGlobal[0]}Weight:${strongGlobal[1]}</td><td>${
        strongGlobal[0]
    }${edge.weight}${strongGlobal[1]}</td></tr>
                <tr><td>${strongCurrent[0]}Current weight:${
        strongCurrent[1]
    }</td><td>${strongCurrent[0]}${edge.calibrated_weight}${
        strongCurrent[1]
    }</td></tr>`;
    if (edge.revue) {
        _html += `<tr><td>Revue mentioned:</td><td>${edge.revue_name}</td></tr>`;
    }
    if (edge.range.start && edge.range.end) {
        html += `<tr><td>Range:</td><td>${edge.range.start}–${edge.range.end}</td></tr>`;
    } else if (edge.range.start) {
        html += `<tr><td>Range:</td><td>${edge.range.start}–</td></tr>`;
    }
    if (edge.comment) {
        html += `<tr><td>Comment:</td><td>${edge.comment}</td></tr>`;
    }
    if (edge.found) {
        let plural = edge.found.length > 1 ? "s" : "";
        html += `<tr><td>Found in:</td><td>${edge.found.length} source${plural}</td></tr>
        <tr><td colspan="2">
        <ul>`;
        edge.found.forEach((source) => {
            html += `<li>${source}</li>`;
        });
        html += `</ul></td></tr>`;
    }
    html += `<tr><td>Edge ID:</td><td>${edge.edge_id}</td></tr>`;
    html += `</table>`;
    return html;
};

/**
 * urlify takes one argument, a given text string, and searches for URLs in the text, and returns them back with HTML `<a>` elements inserted for each link.
 * The return value is the text with the replaced link.
 * @param {string} text - The text with potential unlinked links.
 * @returns {string} - Corrected text with `<a>` elements.
 */
const urlify = (text) => {
    // Source: https://www.labnol.org/code/20294-regex-extract-links-javascript
    return (text || "").replace(
        /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
        function (match, space, url) {
            var hyperlink = url;
            if (!hyperlink.match("^https?://")) {
                hyperlink = "http://" + hyperlink;
            }
            return space + '<a target="_blank" href="' + hyperlink + '">' + url + "</a>";
        }
    );
};

/**
 * generateCommentHTML takes one required argument, the d3 selector for a given node or edge, and generates the HTML for the popup information box. This is the function that handles the alt-button + "click" event on any given node or edge with comments in the graph.
 * The return value is a string of HTML.
 * @param {Object} elem - A d3 selector for any given node or edge.
 * @returns {string} - HTML with comments and information.
 */
const generateCommentHTML = (elem) => {
    let html = "";
    if (elem.node_id) {
        // we have a node!
        html += `<h1>${displayOrID(elem)}</h1>`;
        if (elem.has_comments) {
            html += "<h2>Comments</h2>";
            elem.comments.forEach((c) => {
                html += `<p>${urlify(c.comment)} (${urlify(c.source)})</p>\n`;
            });
        }
    } else if (elem.edge_id) {
        // we have an edge!
        if (elem.revue_name) {
            html += `<h1>${elem.revue_name}</h1>`;
            html += `<h2>${displayOrID(elem.source)} - ${displayOrID(
                elem.target
            )}</h2>`;
        } else {
            html += `<h1>${displayOrID(elem.source)} - ${displayOrID(
                elem.target
            )}</h1>`;
        }

        if (elem.has_comments) {
            html += "<h2>Comments</h2>";
            elem.comments.forEach((c) => {
                html += `<p>${urlify(c.comment)} (${urlify(c.source)})</p>\n`;
            });
        }
        if (elem.has_general_comments) {
            html += "<h2>General comments</h2>";
            elem.general_comments.forEach((c) => {
                html += `<p>${urlify(c.comment)} (${urlify(c.source)})</p>\n`;
            });
        }
    }
    return html;
};
