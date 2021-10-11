/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

window.autoSettings = {
  nodes: {
    autoClearNodes: true,
    autoClearUnnamed: false,
    stickyNodes: true,
    // nodeSizeFromCurrent: true,
    minDegree: 10,
    nodeMultiplier: 0.6,
    communityDetection: 'jLouvain',
    minR: 1,
    maxR: 35,
    rFrom: 'currentDegree',
  },
  edges: {
    weightFromCurrent: true,
    weightFrom: 'numDates',
    minWeight: 0,
    edgeMultiplier: 1,
    startYear: 1930,
    endYear: 1940,
    minStroke: 0.9,
    maxStroke: 5,
  },
  force: {
    layoutCenter: true,
    layoutClustering: true,
    layoutCharge: true,
    layoutCollide: false,
    layoutForceX: true,
    layoutForceY: true,
    charge: -200,
    collide: 0,
    linkStrength: 0.05,
  },
  zoom: 1.25,
  zoomMin: 0.1,
  zoomMax: 4,
  // debugMessages: false,
  datafile: {
    filename: 'v1-co-occurrence-grouped-by-14-days-no-unnamed-performers.json',
    bipartite: false,
  },
};

window.keyMapping = {
  U: {
    noMeta: `changeSetting({
        selector: "#autoClearNodes",
        setTo: !settingsFromDashboard("keyMappingU").nodes.autoClearNodes
      })`,
  },
  S: {
    noMeta: `changeSetting({
                selector: "#stickyNodes",
                setTo: !settingsFromDashboard("keyMappingS").nodes.stickyNodes
            })`,
  },
  /*
  N: {
    shiftKey: `changeSetting({
          selector: "#nodeSizeFromCurrent",
          type: "checkbox",
          setTo: !settingsFromDashboard("keyMappingN").nodes.nodeSizeFromCurrent
              })`,
  },
  */
  ArrowRight: {
    noMeta: `changeSetting({
        selector: "#minDegree",
        type: "slider",
        setTo: settingsFromDashboard("keyMappingArrowRight1").nodes.minDegree+1
            })`,
    shiftKey: `changeSetting({
        selector: "#minWeight",
        type: "slider",
        setTo: settingsFromDashboard("keyMappingArrowRight2").edges.minWeight+1
            })`,
  },
  ArrowLeft: {
    noMeta: `changeSetting({
                selector: "#minDegree",
                type: "slider",
                setTo: settingsFromDashboard("keyMappingAL1").nodes.minDegree-1
            })`,
    shiftKey: `changeSetting({
                selector: "#minWeight",
                type: "slider",
                setTo: settingsFromDashboard("keyMappingAL2").edges.minWeight-1
            })`,
  },
  ArrowUp: {
    noMeta: `changeSetting({
                selector: "#charge",
                type: "slider",
                setTo: settingsFromDashboard("keyMappingAU").force.charge+10
            })`,
  },
  ArrowDown: {
    noMeta: `changeSetting({
                selector: "#charge",
                type: "slider",
                setTo: settingsFromDashboard("keyMappingAD").force.charge-10
            })`,
  },
};

window.store = {
  raw: {},
  nodes: [],
  edges: [],
  count: {},
  ranges: {
    edgeWidth: 0,
    nodeDegree: 0,
    years: {
      array: [],
    },
  },
  toasterCounter: 1,
  settingsFinished: false,
  algorithms: [
    'jLouvain',
    'Clauset-Newman-Moore',
    'Girvan Newman',
    'Louvain',
  ],
};

window.graph = {
  nodes: [],
  edges: [],
  simulation: d3.forceSimulation().force('link', d3.forceLink()),
  svg: d3.select('svg#main'),
  k: 1,
  networkCount: 0,
  communities: [],
  clusters: {},
  clusterInfo: {},
  communityScale: undefined,
  clusterColors: {},
  plot: undefined,
  elements: {
    edges: undefined,
    nodes: undefined,
    labels: undefined,
  },
};

window.graph.plot = window.graph.svg.append('g').attr('id', 'plot');

// place links underneath nodes, and labels on top of everything
window.graph.elements = {
  edges: window.graph.plot.append('g').attr('id', 'links'),
  nodes: window.graph.plot.append('g').attr('id', 'nodes'),
  labels: window.graph.plot.append('g').attr('id', 'labels'),
};

window._selectors = {};
window._elements = {};

[
  'startYear',
  'endYear',
  'minDegree',
  'charge',
  'collide',
  'linkStrength',
  'nodeMultiplier',
  'edgeMultiplier',
  'minWeight',
  'datafile',
  'autoClearNodes',
  'autoClearUnnamed',
  // 'nodeSizeFromCurrent',
  'communityDetection',
  'weightFromCurrent',
  'layoutCenter',
  'layoutClustering',
  'layoutForceX',
  'layoutForceY',
  'layoutCollide',
  'layoutCharge',
  'stickyNodes',
  // 'debugMessages',
  'egoNetwork',
  'main',
  'popup-',
  'commentedNodes',
  'loadingContainer',
  'loadingMessage',
  'loading',
  'switchMode',
  'showClusterInfo',
  'explainSettingsToggle',
  'nudgeNodes',
  'resetLocalStorage',
  'clearUnconnected',
  'settingsToggle',
  'infoToggle',
  'settingsContainer',
  'infoToggleDiv',
  'collideContainer',
  'chargeContainer',
  'charge_label',
  'collide_label',
  'minDegree_label',
  'nodeMultiplier_label',
  'edgeMultiplier_label',
  'minWeight_label',
  'linkStrength_label',
  'nodeEdgeInfo',
  'weightFrom',
  'rFrom',
].forEach((element) => {
  window._selectors[element] = d3.select(`#${element}`);
  window._elements[element] = d3.select(`#${element}`).node();
});


const regexes = [
  {
    map: 'YYYY\\-MM\\-DD', // matches 1934-10-26
    locations: {
      full: 0,
      Y: 1,
      M: 2,
      D: 3,
    },
  },
  {
    // matches 26 Oct 1934
    map: 'DD\\ MMM\\ YYYY',
    locations: {
      full: 0,
      Y: 3,
      M: 2,
      D: 1,
    },
  },
  {
    // 11 June 1938
    map: 'DD\\ MMM\\ YYYY',
    locations: {
      full: 0,
      Y: 3,
      M: 2,
      D: 1,
    },
  },
  {
    // 10-09-40
    map: 'DD\\-MM\\-YY',
    locations: {
      full: 0,
      Y: 3,
      M: 2,
      D: 1,
    },
  },
  {
    // 100940
    map: 'MMDDYY',
    locations: {
      full: 0,
      Y: 3,
      M: 1,
      D: 2,
    },
  },
  {
    // starr-jackie-11-14-37
    map: 'MM\\-DD\\-YY',
    locations: {
      full: 0,
      Y: 3,
      M: 1,
      D: 2,
    },
  },
  {
    // 30-12-17
    map: 'YY\\-MM\\-DD',
    locations: {
      full: 0,
      Y: 1,
      M: 2,
      D: 3,
    },
  },
  {
    // December 13, 1932 + Feb 27, 1934
    map: 'MMM\\ DD,\\ YYYY',
    locations: {
      full: 0,
      Y: 3,
      M: 1,
      D: 2,
    },
  },
  {
    // 5-11-26
    map: 'Dnozero\\-Mnozero\\-YY',
    locations: {
      full: 0,
      Y: 3,
      M: 2,
      D: 1,
    },
  },
  {
    // 1940
    map: 'YYYY',
    locations: {
      full: 0,
      Y: 1,
      M: undefined,
      D: undefined,
    },
  },
];

window.months = [...new Set([...moment.months(), ...moment.monthsShort()])];

const regex = {
  rYYYY: '(1[8-9][0-9][0-9])[-,\\s\\]\\)\\.]',
  rMMM: `(${window.months.join('|')})`,
  rMM: '(0[1-9]|1[0-2])',
  rDwithZero: '(0[1-9]|[1-2][0-9]|3[0-1])',
  rDnoZero: '([1-9]|[1-2][0-9]|3[0-1])',
  rYY: '([0-9]{2})', // since we are only looking for 1900s
  rM: '([1-9]|1[0-2])',
};
