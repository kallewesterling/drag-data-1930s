"use strict";

/**
 * nodeScale takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const nodeScale = (settings) => {
    let val = 0;
    if (settings === true || settings.nodes.nodeSizeFromCurrent === true) {
        let extent = d3.extent(graph.nodes, (d) => d.current_degree);
        val = d3
            .scaleLinear()
            .range([1, 10])
            .domain(extent);
    } else {
        let extent = d3.extent(graph.nodes, (d) => d.degree);
        val = d3
            .scaleLinear()
            .range([1, 10])
            .domain(extent);
    }
    
    return val;
};

/**
 * edgeScale takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const edgeScale = (settings) => {
    let val = 0;
    if (settings === true || settings.edges.weightFromCurrent === true) {
        let extent = d3.extent(graph.edges, (d) => d.calibrated_weight);
        val = d3
            .scaleLinear()
            .range([settings.edgeMinStroke, settings.edgeMaxStroke])
            .domain(extent);
    } else {
        let extent = d3.extent(store.edges, (d) => d.weight);
        val = d3
            .scaleLinear()
            .range([settings.edgeMinStroke, settings.edgeMaxStroke])
            .domain(extent);
    }
    return val;
};