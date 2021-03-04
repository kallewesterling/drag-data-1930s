"use strict";

/**
 * nodeScale returns the scale for the size of nodes based on some parameters.
 * @param {boolean} sizeFromGraph
 * @param {number} min
 * @param {number} max
 * The return value is a d3 scaleLinear function.
 */
const nodeScale = (sizeFromGraph = false, min=1, max=10) => {
    if (sizeFromGraph) {
        return d3
            .scaleLinear()
            .range([min, max])
            .domain(d3.extent(graph.nodes, (d) => d.currentDegree));
    } else {
        return d3
            .scaleLinear()
            .range([min, max])
            .domain(d3.extent(graph.nodes, (d) => d.degree));
    }
};

/**
 * edgeScale returns the scale for the weight of edges based on some parameters.
 * @param {boolean} sizeFromGraph
 * @param {number} min
 * @param {number} max
 * The return value is a d3 scaleLinear function.
 */
const edgeScale = (sizeFromGraph = false, min, max) => {
    if (sizeFromGraph) {
        return d3
            .scaleLinear()
            .range([min, max])
            .domain(d3.extent(graph.edges, (d) => d.calibrated_weight));
    } else {
        return d3
            .scaleLinear()
            .range([min, max])
            .domain(d3.extent(store.edges, (d) => d.weight));
    }
};