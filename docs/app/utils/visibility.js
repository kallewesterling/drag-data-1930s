"use strict";

/**
 * isVisible takes one argument, which can be the string of the selector that you want to know whether it visible or not, or the d3 selected object (created using `d3.select(selector)`).
 * The return value will tell you whether the selector is currently visible (`true`) or not (`false`).
 * @param {string|object} selector - The string of the DOM selector or d3 selection
 * @returns {boolean} - Whether the selector is currently visible or not
 */
const isVisible = (selector) => {
    try {
        return d3.select(selector).classed("d-none") === false;
    } catch {
        console.error('Selector cannot be found');
        console.error(selector)
        return false;
    }
};

/**
 * toggle takes one argument, which should be the string of the selector you want to toggle, or the d3 selection (created using `d3.select(selector)`). The function uses the `isVisible` function to determine whether the selector should be shown or hidden. It also has some special rules added to it.
 * The return value is always true.
 * @param {string|object} selector - The string of the DOM selector or d3 selection
 * @returns {boolean} - true
 */
const toggle = (selector) => {
    try {
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
    } catch {
        console.error('Selector cannot be found');
        console.error(selector)
        return false;
    }
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
    let selector = d3.select("#nodeEdgeInfoContainer .list-group");
    if (elem.node_id) {
        selector.html(elem.html_info);
    } else if (elem.edge_id) {
        selector.html(elem.html_info);
    }
    let container = d3.select("#nodeEdgeInfo");
    show(container);
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
    d3.select('#colorNetworks').classed('bg-dark', !window.coloredNetworks).classed('bg-warning', window.coloredNetworks);
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
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        let options = {'placement': 'bottom', 'trigger': 'hover'}

        if (popoverTriggerEl.id == "numNodes") {
            options['content'] = 'Number of nodes'; // TODO: write these...
        } else if (popoverTriggerEl.id === "numEdges") {
            options['content'] = 'Number of edges'; // TODO: write these...
        } else if (popoverTriggerEl.id === "unconnectedNodes") {
            options['content'] = 'Number of unconnected nodes'; // TODO: write these...
        } else if (popoverTriggerEl.id === "currentZoom") {
            options['content'] = 'Current zoom'; // TODO: write these...
        } else if (popoverTriggerEl.id === "numCommunities") {
            options['content'] = 'Current number of communities'; // TODO: write these...
        } else if (popoverTriggerEl.id === "colorNetworks") {
            options['content'] = 'Number of networks (activated)'; // TODO: write these...
        } else if (popoverTriggerEl.id === "commentedNodes") {
            options['content'] = 'Number of commented nodes'; // TODO: write these...
        } else {
            console.error('Not catching the id', popoverTriggerEl); // TODO: write these...
        }
        if (bootstrap.Popover.getInstance(popoverTriggerEl)) {
            console.log('already exists'); // TODO: write these...
            return false;
        } else {
            return new bootstrap.Popover(popoverTriggerEl, options);
        }
    })
    return true;
};

let original = {
    fill: {},
    classList: {},
    r: {}
};

const showCities = () => {
    graph.nodes.forEach(n => {
        let node = d3.select(`#${n.node_id}`)
        original.fill[n.node_id] = node.style('fill');
        original.classList[n.node_id] = node.attr('class');
        original.r[n.node_id] = +node.attr('r');

        node.transition()
            .attr('class', null)
            .transition().duration(500)
            .style('fill', n => {
                if (n.category === 'city') {
                    return 'red';
                } else {
                    return 'gray';
                }
            })
            .transition().delay(1000).duration(500)
            .attr('r', n => {
                if (n.category === 'city') {
                    return original.r[n.node_id] * 3;
                } else {
                    return 1;
                }
            });
    });
    
}