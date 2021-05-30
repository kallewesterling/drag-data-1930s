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
const edgeScale = (settings) => {
    let rangeMin = settings.edges.minStroke;
    let rangeMax = settings.edges.maxStroke;
    let domainExtent = d3.extent(graph.edges.map(edge=>edge.weights[settings.edges.weightFrom]))
    return d3
        .scaleSqrt()
        .domain(domainExtent)
        .range([rangeMin, rangeMax])
};