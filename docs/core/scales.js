"use strict";

/**
 * nodeScale returns the scale for the size of nodes based on some parameters.
 * @param {boolean} sizeFromGraph
 * @param {number} min
 * @param {number} max
 * The return value is a d3 scaleSqrt function.
 */
const nodeScale = (settings = undefined) => {
    if (!settings)
        console.error('Settings must be passed to an iterative function like nodeScale.')
    
    let rangeMin = settings.nodes.minR; // 1;
    let rangeMax = settings.nodes.maxR; // 10;

    let domainExtent = [];
    if (settings.nodes.nodeSizeFromCurrent) {
        domainExtent = d3.extent(graph.nodes, node => node.currentDegree)
    } else {
        domainExtent = d3.extent(graph.nodes, node => node.degrees.degree)
    }
    return d3
        .scaleSqrt()
        .range([rangeMin, rangeMax])
        .domain(domainExtent);
};

/**
 * edgeScale returns the scale for the weight of edges based on some parameters.
 * @param {object} settings
 * The return value is a d3 scaleSqrt function.
 */
const edgeScale = (settings = undefined) => {
    if (!settings)
        console.error('Settings must be passed to an iterative function like nodeScale.')

    let rangeMin = settings.edges.minStroke;
    let rangeMax = settings.edges.maxStroke;
    let domainExtent = d3.extent(graph.edges.map(edge=>edge.weights[settings.edges.weightFrom]))
    return d3
        .scaleSqrt()
        .domain(domainExtent)
        .range([rangeMin, rangeMax])
};