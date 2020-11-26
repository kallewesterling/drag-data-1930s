"use strict";

const _autoSettings = {
    nodes: {
        minDegree: 6,
        autoClearNodes: true,
        stickyNodes: true,
        nodeSizeFromCurrent: false,
    },
    edges: {
        minWeight: 0,
        startYear: 1920,
        endYear: 1940,
        weightFromCurrent: false,
    },
    force: {
        charge: -320,
        collide: 0.5,
        layoutCenter: true,
        layoutCharge: true,
        layoutCollide: false,
        layoutForceX: true,
        layoutForceY: true,
    },
    zoom: 1.25,
    edgeMinStroke: 1,
    edgeMaxStroke: 7,
    debugMessages: false,
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
    },
};

let DATAFILE = "drag-data.json";
let AUTO_ZOOM = 1.25; // TODO: #10 This will not work

const store = {
    nodes: [],
    edges: [],
    count: {},
    ranges: {},
    toasterCounter: 1,
    settingsFinished: false,
};

const graph = {
    nodes: [],
    edges: [],
    layout: d3.forceSimulation().force("link", d3.forceLink()),
    svg: d3.select("svg#main"),
    k: 1,
};

graph.plot = graph.svg.append("g").attr("id", "plot");

// place links underneath nodes
let g = {
    edges: graph.plot.append("g").attr("id", "links"),
    nodes: graph.plot.append("g").attr("id", "nodes"),
};
