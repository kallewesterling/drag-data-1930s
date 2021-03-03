"use strict";

const _autoSettings = {
    nodes: {
        autoClearNodes: true,
        stickyNodes: true,
        nodeSizeFromCurrent: true,
        minDegree: 6,
        nodeMultiplier: 1,
        communityDetection: true,
    },
    edges: {
        weightFromCurrent: true,
        minWeight: 0,
        edgeMultiplier: 1,
        startYear: 1920,
        endYear: 1940,
    },
    force: {
        layoutCenter: true,
        layoutClustering: true,
        layoutCharge: true,
        layoutCollide: true,
        layoutForceX: true,
        layoutForceY: true,
        charge: -320,
        collide: 0.5,
        linkStrength: 0.40,
    },
    zoom: 1.25,
    zoomMin: 0.60,
    zoomMax: 4,
    edgeMinStroke: 1,
    edgeMaxStroke: 7,
    debugMessages: false,
    datafile: {
        filename: 'data/multipartite-data.json',
        bipartite: false
    }
};

const keyMapping = {
    U: {
        noMeta:
            'changeSetting({selector: "#autoClearNodes", setTo: !getSettings().nodes.autoClearNodes})',
    },
    S: {
        noMeta:
            'changeSetting({selector: "#stickyNodes", setTo: !getSettings().nodes.stickyNodes})',
    },
    N: {
        shiftKey:
            'changeSetting({selector: "#nodeSizeFromCurrent", type: "checkbox", setTo: !getSettings().nodes.nodeSizeFromCurrent})',
    },
    ArrowRight: {
        noMeta:
            'changeSetting({selector: "#minDegree", type: "slider", setTo: getSettings().nodes.minDegree+1})',
        shiftKey:
            'changeSetting({selector: "#minWeight", type: "slider", setTo: getSettings().edges.minWeight+1})',
    },
    ArrowLeft: {
        noMeta:
            'changeSetting({selector: "#minDegree", type: "slider", setTo: getSettings().nodes.minDegree-1})',
        shiftKey:
            'changeSetting({selector: "#minWeight", type: "slider", setTo: getSettings().edges.minWeight-1})',
    },
    ArrowUp: {
        noMeta:
            'changeSetting({selector: "#charge", type: "slider", setTo: getSettings().force.charge+10})',
    },
    ArrowDown: {
        noMeta:
            'changeSetting({selector: "#charge", type: "slider", setTo: getSettings().force.charge-10})',
    }
};

const store = {
    raw: {},
    nodes: [],
    edges: [],
    count: {},
    ranges: {
        edgeWidth: 0,
        nodeDegree: 0,
        years: {
            array: []
        }
    },
    toasterCounter: 1,
    settingsFinished: false,
};

const graph = {
    nodes: [],
    edges: [],
    simulation: d3.forceSimulation().force("link", d3.forceLink()),
    svg: d3.select("svg#main"),
    k: 1,
    networkCount: 0,
    communities: [],
    clusters: {},
    clusterInfo: {}
};

graph.plot = graph.svg.append("g").attr("id", "plot");

// place links underneath nodes, and labels on top of everything
let g = {
    edges: graph.plot.append("g").attr("id", "links"),
    nodes: graph.plot.append("g").attr("id", "nodes"),
    labels: graph.plot.append("g").attr("id", "labels"),
};
