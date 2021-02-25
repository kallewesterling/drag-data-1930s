"use strict";

/**
 * nodeScale takes X argument/s... TODO: Needs docstring
 * The return value is ...
 */
const nodeScale = (settings) => {
    if (settings === true || settings.nodes.nodeSizeFromCurrent === true) {
        return d3
            .scaleLinear()
            .range([1, 10])
            .domain(d3.extent(graph.nodes, (d) => d.currentDegree));
    } else {
        return d3
            .scaleLinear()
            .range([1, 10])
            .domain(d3.extent(graph.nodes, (d) => d.degree));
    }
};

/**
 * edgeScale takes X argument/s... TODO: Needs docstring
 * The return value is ...
 */
const edgeScale = (settings) => {
    if (settings === true || settings.edges.weightFromCurrent === true) {
        return d3
            .scaleLinear()
            .range([settings.edgeMinStroke, settings.edgeMaxStroke])
            .domain(d3.extent(graph.edges, (d) => d.calibrated_weight));
    } else {
        return d3
            .scaleLinear()
            .range([settings.edgeMinStroke, settings.edgeMaxStroke])
            .domain(d3.extent(store.edges, (d) => d.weight));
    }
};