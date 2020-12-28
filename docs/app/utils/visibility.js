"use strict";

/**
 * isVisible takes one argument, which can be the string of the selector that you want to know whether it visible or not, or the d3 selected object (created using `d3.select(selector)`).
 * The return value will tell you whether the selector is currently visible (`true`) or not (`false`).
 * @param {string|object} selector - The string of the DOM selector or d3 selection
 * @returns {boolean} - Whether the selector is currently visible or not
 */
const isVisible = (selector) => {
    return d3.select(selector).classed("d-none") === false;
};

/**
 * toggle takes one argument, which should be the string of the selector you want to toggle, or the d3 selection (created using `d3.select(selector)`). The function uses the `isVisible` function to determine whether the selector should be shown or hidden. It also has some special rules added to it.
 * The return value is always true.
 * @param {string|object} selector - The string of the DOM selector or d3 selection
 * @returns {boolean} - true
 */
const toggle = (selector) => {
    if (typeof selector === "object") {
        selector.classed("d-none", isVisible(selector));
    } else {
        d3.select(selector).classed("d-none", isVisible(selector));
    }

    // special rules
    if (selector === "#settingsContainer") {
        d3.select("#settingsToggle").classed("toggled", !isVisible(selector));
    } else if (selector === "#infoToggleDiv") {
        d3.select("#infoToggle").classed("toggled", !isVisible(selector));
    }

    return true;
};

/**
 * hide takes one argument, which can be the string of the selector that you want hidden (added class `d-none` to the element) or the d3 selected object (created using `d3.select(selector)`).
 * The return value is always true.
 * @param {string|object} selector - The string of the DOM selector or d3 selection to hide
 * @returns {boolean} - true
 */
const hide = (selector) => {
    if (typeof selector === "object") {
        selector.classed("d-none", true);
    } else {
        if (!selector.startsWith("#")) {
            d3.selectAll(selector).classed("d-none", true);
        } else {
            d3.select(selector).classed("d-none", true);
        }
    }
    return true;
};

/**
 * show takes one argument, which can be the string of the selector that you want shown (removed class `d-none` from the element) or the d3 selected object (created using `d3.select(selector)`).
 * The return value is always true.
 * @param {string|object} selector - The string of the DOM selector or d3 selection to show
 * @returns {boolean} - true
 */
const show = (selector) => {
    if (typeof selector === "object") {
        selector.classed("d-none", false);
    } else {
        if (!selector.startsWith("#")) {
            d3.selectAll(selector).classed("d-none", false);
        } else {
            d3.select(selector).classed("d-none", false);
        }
    }
};

/**
 * setNodeEdgeInfo takes one argument and determines whether the provided element is a node or an edge, updates the information box, and finally shows it.
 * The return value is always true.
 * @param {Object} - The d3 selection of a node or an edge from the visualization.
 * @returns {boolean} - true
 */
const setNodeEdgeInfo = (elem) => {
    let selector = d3.select("#nodeEdgeInfo");
    if (elem.node_id) {
        selector.html(generateNodeInfoHTML(elem));
    } else if (elem.edge_id) {
        selector.html(generateEdgeInfoHTML(elem));
    }
    show(selector);
};

const toggleColorNetworks = () => {
    console.log('toggleColorNetworks called...')
    if (graph.nodes.length > 300) {
        alert(`Processing ${graph.nodes.length} nodes is a heavy operation and can take some time...`)
    }
    if (!window.coloredNetworks) {
        window.coloredNetworks = true;
        colorNetworks();
    } else {
        window.coloredNetworks = false;
        resetDraw();
    }
    d3.select('#colorNetworks').classed('bg-light', !window.coloredNetworks).classed('bg-warning', window.coloredNetworks);
}

/**
 * updateInfo takes no arguments acts as a quick access point for functions that need to update the information about the visualization.
 * The return value is always true.
 * @return {boolean} true
 */
const updateInfo = () => {
    show("#info");
    d3.select("#info").html(getInfoHTML());
    d3.select('#colorNetworks').on("click", toggleColorNetworks);
    d3.select('#commentedNodes').on("click", toggleCommentedElements);
    return true;
};
