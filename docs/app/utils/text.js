"use strict";

const minify = (s) => {
    return s
        .replace(/\>[\r\n ]+\</g, "><")
        .replace(/(<.*?>)|\s+/g, (m, $1) => $1 ? $1 : ' ')
        .trim()
}
  
/**
 * getInfoHTML takes no arguments but generates the HTML for the viz information.
 * The return value is always the HTML itself.
 * @return {string} html - raw HTML
 */
const getInfoHTML = () => {
    let html = `
        <span id="numNodes" class="small mr-2" data-bs-toggle="popover"><i class="mr-1 small bi bi-record-fill"></i><strong>${graph.nodes.length}</strong><span class="text-muted">/${store.nodes.length}</span></span>
        <span id="numEdges" class="small mr-2" data-bs-toggle="popover"><i class="mr-1 small bi bi-share-fill"></i><strong>${graph.edges.length}</strong><span class="text-muted">/${store.edges.length}</span></span>
        <span id="unconnectedNodes" class="small mr-2" data-bs-toggle="popover"><i class="mr-1 bi bi-node-minus"></i>${hasUnconnectedNodes()? getUnconnectedNodes().length: 0}</span>
        `
    if (graph.nodes.length < 300) {
        html += `
            <span id="colorNetworks" data-bs-toggle="popover" class="mr-2 m-0 badge ${window.coloredNetworks ? 'bg-warning' : 'bg-dark'}">${graph.networkCount} networks</span>
            <span id="commentedNodes" data-bs-toggle="popover" class="mr-2 m-0 badge ${window.toggledCommentedElements ? 'bg-warning' : 'bg-dark'}">${graph.nodes.filter(n=>n.has_comments).length} commented <i class="bi bi-record-fill"></i></span>
            `
    } else {
        html += `
        <span id="colorNetworks" data-bs-toggle="popover" class="mr-2 badge ${window.coloredNetworks ? 'bg-warning' : 'bg-dark'}">${graph.networkCount ? graph.networkCount : ''} networks</span>
        <span id="commentedNodes" data-bs-toggle="popover" class="mr-2 badge ${window.toggledCommentedElements ? 'bg-warning' : 'bg-dark'}">Show nodes with comments</span>
        `
    }
    html += `
        <span id="currentZoom" class="small mr-2" data-bs-toggle="popover"><i class="mr-1 bi bi-search"></i>${(graph.k*100).toFixed(0)}%</span>`;
    if (Object.keys(graph.clusters).length)
        html += `<span id="numCommunities" class="small mr-2" data-bs-toggle="popover"><i class="mr-1 bi bi-heart-fill"></i>${Object.keys(graph.clusters).length}</span>`;
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
    let html = `
        <li class="list-group-item"><strong>ID</strong> ${node.display}</li>
        <li class="list-group-item">
            <strong class="mb-1">Degree</strong> ${node.degree}
            <p class="m-0 mb-1 small">In: ${node.indegree}</p>
            <p class="m-0 mb-1 small">Out: ${node.outdegree}</p>
            <p class="m-0 small">Current in network: ${node.currentDegree}</p>
        </li>
        <li class="list-group-item">
            <strong class="mb-1">Source range</strong>
            <p class="m-0 small">${d3.min(node.sourceRange)}-${d3.max(node.sourceRange)}</p>
        </li>
        <li class="list-group-item">
            <strong class="mb-1">Centrality measures (across entire network)</strong>
            <p class="m-0 mb-1 small">Betweenness (1000x): ${Math.round(node["1000x-betweenness-centrality"] * 100) / 100}</p>
            <p class="m-0 mb-1 small">Closeness (1000x): ${Math.round(node["1000x-closeness-centrality"] * 100) / 100}</p>
            <p class="m-0 mb-1 small">Degree (1000x): ${Math.round(node["1000x-degree-centrality"] * 100) / 100}</p>
            <p class="m-0 small">Eigenvector (1000x): ${Math.round(node["1000x-eigenvector-centrality"] * 100) / 100}</p>
        </li>`
    if (node.has_comments) {
        html += `<li class="list-group-item"><strong>Comments</strong>`
        node.comments.forEach(obj => {
            html += `<p class="m-0 mb-1 small">${obj.comment} (${obj.source})</p>`
        })
        html += `</li>`
    }
    return minify(html);
};

/**
 * generateEdgeInfoHTML takes one required argument, the d3 selector for a given edge.
 * The return value is always the HTML with the selected information about the edge.
 * @param {Object} edge - d3 selector for a given edge.
 * @return {string} html - raw HTML
 */
const generateEdgeInfoHTML = (edge) => {
    let settings = getSettings();
    console.log(edge);

    let html = `
        <li class="list-group-item"><strong>ID</strong> ${edge.source.display} - ${edge.target.display}</li>
        <li class="list-group-item">
            <strong class="mb-1">Weight</strong>
            <p class="m-0 mb-1 small ${settings.edges.weightFromCurrent ? '' : 'fw-bold'}">In entire network: ${edge.weight}</p>
            <p class="m-0 small ${settings.edges.weightFromCurrent ? 'fw-bold' : ''}">In current network: ${edge.calibrated_weight}</p>
        </li>
        `
    if (edge.revue) {
        html += `
        <li class="list-group-item"><strong>Revue mentioned</strong> ${edge.revue_name}</li>
        `;
    }

    if (edge.range.start) {
        html += `
        <li class="list-group-item"><strong>Range</strong> ${edge.range.start}${edge.range.end ? ' – ' + edge.range.end : ''}</li>
        `;
    }

    if (edge.has_general_comments) {
        html += `<li class="list-group-item"><strong class="mb-1">General comments</strong>`;
        edge.general_comments.forEach(obj => {
            html += `<p class="m-0 mb-1 small">${obj.comment} <span class="text-muted">(${obj.source})</span></p>`;
        })
        html += `</li>`;
    }

    if (edge.has_comments) {
        html += `<li class="list-group-item"><strong class="mb-1">Comments on revue</strong>`;
        edge.comments.forEach(obj => {
            html += `<p class="m-0 mb-1 small">${obj.comment} <span class="text-muted">(${obj.source})</span></p>`;
        })
        html += `</li>`;
    }

    if (edge.found) {
        html += `<li class="list-group-item"><strong class="mb-1">Found in sources:</strong>`;
        edge.found.forEach(source => {
            html += `<p class="m-0 mb-1 small">${source}</p>`;
        })
        html += `</li>`;
    }

    return minify(html);
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
        html += `<h1>${elem.display}</h1>`;
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
            html += `<h2>${elem.source.display} - ${elem.target.display}</h2>`;
        } else {
            html += `<h1>${elem.source.display} - ${elem.target.display}</h1>`;
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
