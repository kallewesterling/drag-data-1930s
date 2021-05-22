"use strict";

/**
 * nodeScale returns the scale for the size of nodes based on some parameters.
 * @param {boolean} sizeFromGraph
 * @param {number} min
 * @param {number} max
 * The return value is a d3 scalePow function.
 */
const nodeScale = (sizeFromGraph = false, min=1, max=10) => {
    if (sizeFromGraph) {
        return d3
            .scalePow()
            .range([min, max])
            .domain(d3.extent(graph.nodes, (d) => d.currentDegree));
    } else {
        return d3
            .scalePow()
            .range([min, max])
            .domain(d3.extent(graph.nodes, (d) => d.degree));
    }
};

/**
 * edgeScale returns the scale for the weight of edges based on some parameters.
 * @param {boolean} sizeFromGraph
 * @param {number} min
 * @param {number} max
 * The return value is a d3 scalePow function.
 */
const edgeScale = (settings, weightFromCurrent = false, min, max) => {
    if (weightFromCurrent) {
        return d3
            .scalePow()
            .range([min, max])
            .domain(d3.extent(graph.edges, (d) => d.adjusted_weight));
    } else {
        return d3
            .scalePow()
            .range([min, max])
            .domain(d3.extent(store.edges, (d) => d.weight));
    }
};