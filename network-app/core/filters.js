/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

const dropNode = (node) => {
  // console.log(node)
  if (node.inGraph) {
    window.graph.nodes.forEach((o, i) => {
      if (node.node_id === o.node_id) {
        if (ERROR_LEVEL > 1) {
          _output(`dropping node ${o.node_id}...`, false, 'dropNode');
        }
        window.graph.nodes.splice(i, 1);
        node.inGraph = false;
        return true;
      }
    });
  }
};

const dropEdge = (edge) => {
  window.graph.edges.forEach((o, i) => {
    if (edge.edge_id === o.edge_id) {
      if (ERROR_LEVEL > 1) {
        _output(`dropping edge ${o.edge_id}...`, false, 'dropEdge');
      }
      window.graph.edges.splice(i, 1);
      edge.inGraph = false;
      return true;
    }
  });
};

const addNode = (node) => {
  if (!node.inGraph) {
    window.graph.nodes.push(node);
    node.inGraph = true;
  }
};

const addEdge = (edge) => {
  edge.inGraph = true;
  window.graph.edges.push(edge);
};

/**
 * filterNodes takes one optional argument, which is a list of nodes
 * to keep in the window.graph.nodes list. The function serves to run through
 * all of the window.store.nodes and adding/removing nodes from
 * window.graph.nodes, depending on filter values.
 * The return value is always true.
 * @arg {Array} nodeList - A list of nodes to control for in the filtering
 * @arg {Object} settings - The loaded settings for the visualization
 * @return {boolean} - true
 */
const filterNodes = (nodeList = [], settings = undefined) => {
  const outputMessages = ['Called'];

  if (!nodeList.length) {
    if (!settings) settings = settingsFromDashboard('filterNodes');

    outputMessages.push(`--> minDegree: ${settings.nodes.minDegree}`);
    window.store.nodes.forEach((node) => {
      if (node.passes.minDegree && node.passes.unnamed) {
        addNode(node);
      } else {
        dropNode(node);
      }
    });
  } else {
    window.store.nodes.forEach((node) => {
      nodeList.includes(node) ? addNode(node) : dropNode(node);
    });
  }
  _output(outputMessages, false, filterNodes);
  return true;
};

/**
 * Returns whether a node exists in the current graph or not.
 * @arg {Object} node - the node that we want to verify whether it exists or not
 * @return {Boolean}
 */
const nodeInGraph = (node) => {
  return window.graph.nodes.includes(node);
};

const getValidEdges = (inGraph = false) => {
  return window.store.edges.filter(
      (e) =>
        e.passes.startYear &&
      e.passes.endYear &&
      e.passes.minWeight &&
      nodeInGraph(e.source) &&
      nodeInGraph(e.target) &&
      e.inGraph === inGraph,
  );
};

const getInvalidEdges = (inGraph = true) => {
  return window.store.edges.filter(
      (e) =>
        !e.passes.startYear &&
      !e.passes.endYear &&
      !e.passes.minWeight &&
      e.inGraph === inGraph &&
      nodeInGraph([e.source, e.target]),
  );
};

/**
 * filterEdges takes one optional argument // TODO: Fix this
 * and serves to run through all of the window.store.edges and adding/removing
 * edges from window.graph.edges, depending on filter values.
 * The return value is always true.
 * @arg {Array} edgeList - Optional list of edges that we want to check against
 * @arg {Object} settings - The loaded settings for the visualization
 * @arg {boolean} change - (Inactive argument for now)
 * @return {boolean} - true
 */
const filterEdges = (edgeList = [], settings = undefined, change = true) => {
  if (edgeList.length) {
    console.error('filtering using lists is not implemented.');
    return true;
  }

  if (!settings) settings = settingsFromDashboard('filterEdges');

  _output(
      [
        'Called',
        `--> minWeight: ${settings.edges.minWeight}`,
        `--> startYear: ${settings.edges.startYear}`,
        `--> endYear: ${settings.edges.endYear}`,
      ],
      false,
      'filterEdges',
  );

  /*
  let edgesToDrop = [];
  edgesToDrop.push(...window.graph.edges
      .filter(edge=>edge.weights.weight < settings.edges.minWeight)
  );
  edgesToDrop.push(...window.graph.edges
      .filter(edge=>edge.range.startYear < settings.edges.startYear ||
              edge.range.endYear > settings.edges.endYear)
  );
  edgesToDrop = [...new Set(edgesToDrop.filter(edge=>edge.inGraph === true))];

  let edgesToAdd = [];
  edgesToAdd.push(...window.store.edges
      .filter(edge=>edge.weights.weight > settings.edges.minWeight)
  );
  edgesToAdd.push(...window.store.edges
      .filter(edge=>edge.range.startYear > settings.edges.startYear ||
              edge.range.endYear < settings.edges.endYear)
  );
  edgesToAdd = [...new Set(edgesToAdd.filter(edge=>edge.inGraph === false))];

  edgesToAdd.forEach(edge=>addEdge(edge));
  edgesToDrop.forEach(edge=>dropEdge(edge));
  */

  getValidEdges().forEach((e) => {
    addEdge(e);
  });

  getInvalidEdges().forEach((e) => {
    dropEdge(e);
  });

  window.graph.edges
      .filter((edge) => edge.inGraph === true)
      .filter(
          (edge) =>
            edge.source.inGraph === false || edge.target.inGraph === false,
      )
      .forEach((e) => {
        dropEdge(e);
      });

  window.graph.edges
      .filter((edge) => edge.inGraph === false)
      .filter((edge) => edge.passes.minWeight === true)
      .forEach((e) => {
        addEdge(e);
      });

  window.graph.edges
      .filter((edge) => edge.inGraph === true)
      .filter((edge) => edge.passes.minWeight === false)
      .forEach((e) => {
        dropEdge(e);
      });

  // edge has to both pass startYear and endYear to be in the graph
  window.graph.edges
      .filter((edge) => edge.inGraph === false)
      .filter((edge) => edge.passes.startYear === true &&
                        edge.passes.endYear === true)
      .forEach((e) => {
        addEdge(e);
      });

  // if edge does not pass startYear or endYear it should not be in the graph
  window.graph.edges
      .filter((edge) => edge.inGraph === true)
      .filter((edge) => edge.passes.startYear === false ||
                        edge.passes.endYear === false)
      .forEach((e) => {
        dropEdge(e);
      });

  return true;

  window.store.edges
      .filter(
          (e) =>
            e.passes.startYear &&
        e.passes.endYear &&
        e.passes.minWeight &&
        !e.inGraph,
      )
      .forEach((e) => addEdge(e));
  window.store.edges
      .filter(
          (e) =>
            (!e.passes.startYear ||
          !e.passes.endYear ||
          !e.passes.minWeight) &&
        e.inGraph,
      )
      .forEach((e) => dropEdge(e));

  return true;

  if (!edgeList.length) {
    const settings = settingsFromDashboard('filterEdges').edges;
    window.store.edges.forEach((edge) => {
      edge.adjusted_weight = edge.found.length;

      const compareWeightVal =
        settings.weightFromCurrent === true ?
          edge.adjusted_weight :
          edge.weights.weight;

      if (settings.minWeight) {
        if (compareWeightVal < settings.minWeight && !edge.inGraph) {
          // edge is lower than minWeight and not inGraph so leave it out
          if (change) edge.inGraph = false;
          if (!change) edgeIDList.pop(edge.edge_id);
        } else if (
          compareWeightVal < settings.minWeight &&
          edge.inGraph
        ) {
          // edge is lower than minWeight and in graph so remove it!
          if (change) dropEdge(edge);
          if (!change) edgeIDList.pop(edge.edge_id);
        }
      } else if (
        edge.range.start &&
        +edge.range.start.substring(0, 4) <= settings.startYear &&
        !edge.inGraph
      ) {
        // edge is earlier than startYear and not inGraph so leave it out
        if (change) edge.inGraph = false;
        if (!change) edgeIDList.pop(edge.edge_id);
      } else if (
        edge.range.start &&
        +edge.range.start.substring(0, 4) <= settings.startYear &&
        edge.inGraph
      ) {
        // edge is earlier than startYear and inGraph so drop it
        if (change) dropEdge(edge);
        if (!change) edgeIDList.pop(edge.edge_id);
      } else if (
        edge.range.end &&
        +edge.range.end.substring(0, 4) >= settings.endYear &&
        !edge.inGraph
      ) {
        // range end is higher than endYear and not inGraph so leave it out
        if (change) edge.inGraph = false;
        if (!change) edgeIDList.pop(edge.edge_id);
      } else if (
        edge.range.end &&
        +edge.range.end.substring(0, 4) >= settings.endYear &&
        edge.inGraph
      ) {
        // edge has later range than endYear and inGraph so drop it"
        if (change) dropEdge(edge);
        if (!change) edgeIDList.pop(edge.edge_id);
      } else {
        if (
          edge.source.inGraph &&
          edge.target.inGraph &&
          !edge.inGraph
        ) {
          // should not be filtered but is not in graph so add it!
          if (change) addEdge(edge);
        } else if (
          edge.source.inGraph &&
          edge.target.inGraph &&
          edge.inGraph
        ) {
          // shouldn't be filtered but already in graph = no need to do anything
        } else if (
          (edge.source.inGraph || edge.target.inGraph) &&
          edge.inGraph
        ) {
          // in graph but should not be
          if (change) dropEdge(edge);
          if (!change) edgeIDList.pop(edge.edge_id);
        } else {
          if (change) dropEdge(edge);
          if (!change) edgeIDList.pop(edge.edge_id);
        }
      }
    });
    // console.log(`${window.graph.edges.length} after`)
  } else {
    // console.log('have edgeList');
    // console.log(edgeList);
    window.store.edges.forEach((edge) => {
      if (edgeList.includes(edge)) {
        if (!edge.inGraph) {
          // console.log('edge is not in graph, so add it...')
          if (change) addEdge(edge);
        } else {
          // console.log('edge is already in graph and has the correct mark...')
        }
      } else {
        // console.log(`drop edge ${edge.edge_id}`)
        if (change) dropEdge(edge);
        if (!change) edgeIDList.pop(edge.edge_id);
      }
    });
  }
  if (change) return true;
  if (!change) return edgeIDList;
};

/**
 * // TODO: Fix this!!
 * filter takes two optional arguments, and serves to run subordinate functions
 * in the correct order when filtering the entire network visualization.
 * The return value is always true.
 * @arg {Array} nodeList
 * @arg {Array} edgeList
 * @arg {boolean} change
 * @return {boolean} - true
 */
const filter = (nodeList = [], edgeList = [], change = true) => {
  _output('Called', false, filter);
  const settings = settingsFromDashboard('filter');

  hide('#nodeEdgeInfo');

  filterStore(settings);

  filterNodes(nodeList, settings);
  filterEdges(edgeList, settings, change);

  setCurrentCentralities();

  modifyNodeDegrees();

  if (settings.nodes.autoClearNodes) {
    filterNodesWithoutEdge();
  }

  setupFilteredElements(settings);

  // then, detect community
  if (
    settings.nodes.communityDetection ||
    document.querySelector('html').classList.contains('has-community')
  ) {
    communityDetection();
    textElements.text((node) => {
      if (node.cluster) {
        return `${node.cluster}. ${node.display}`;
      } else {
        return `${node.display}`;
      }
    });
    window.graph.clusterInfo = getNodeClusterInfo();
  }

  window.graph.nodes.forEach((node) => {
    node.r = getSize(node, 'r', settings);
    node.infoHTML = generateNodeInfoHTML(node);
  });

  window.graph.edges.forEach((edge) => {
    edge.infoHTML = generateEdgeInfoHTML(
        edge,
        settings.edges.weightFromCurrent,
    );
  });

  styleGraphElements(settings);
  updateInfo();
  // setupLegend();

  return true;
};

// TODO: Needs docstring
const findNearestNeighbors = (node) => {
  return [
    ...new Set([
      ...node.connected.edges
          .filter((n) => n.inGraph)
          .map((e) => e.source),
      ...node.connected.edges
          .filter((n) => n.inGraph)
          .map((e) => e.target),
    ]),
  ].filter((n) => n !== node);
};

// TODO: Needs docstring
const getEgoNetwork = (node, maxIterations = 1000) => {
  if (typeof node === 'string') {
    node = findNode(node);
  }

  const nearestNeighbors = findNearestNeighbors(node);
  let allNeighbors = nearestNeighbors;
  let stop = false;
  let i = 0;

  while (!stop) {
    i += 1;
    if (i >= maxIterations) {
      stop = true;
    }

    const lengthBefore = allNeighbors.length;
    const currentNeighbors = [...allNeighbors];
    currentNeighbors.forEach((node) => {
      if (!allNeighbors.includes(node)) allNeighbors.push(node);
      allNeighbors = [
        ...new Set([...allNeighbors, ...findNearestNeighbors(node)]),
      ];
    });
    // console.log(`iteration ${i}`, currentNeighbors)

    if (allNeighbors.length - lengthBefore === 0) stop = true;
  }

  return allNeighbors;
};

/**
 * egoNetworkOn takes X argument/s... TODO: Needs docstring
 * @arg {Object} node
 * @return {undefined}
 */
const egoNetworkOn = async (node) => {
  _output('Called', false, egoNetworkOn);
  window._selectors.egoNetwork.classed('d-none', false);
  d3.select('egoNetwork > #node').html(node.id); // TODO: #29 fix this line....
  const egoNetwork = getEgoNetwork(node);
  filter(egoNetwork);
  // setupFilteredElements();
  restartSimulation();
  resetDraw();

  window.egoNetwork = true;
};

/**
 * egoNetworkOff takes X argument/s... TODO: Needs docstring
 * @return {undefined}
 */
const egoNetworkOff = async () => {
  _output('Called', false, egoNetworkOff);
  window._selectors.egoNetwork.classed('d-none', true);
  // const result = await filter();
  // setupFilteredElements();
  restartSimulation();
  resetDraw();

  window.egoNetwork = undefined;
};

/**
 * toggleEgoNetwork takes X argument/s... TODO: Needs docstring
 * The return value is ...
 * @arg {Object} node
 * @arg {boolean} toggleSettings
 * @arg {string|undefined} force
 * @return {undefined}
 */
const toggleEgoNetwork = async (
    node,
    toggleSettings = true,
    force = undefined) => {
  _output('Called', false, toggleEgoNetwork);
  // filter nodes based on a given node
  if (window.egoNetwork || force === 'off') {
    _output('Ego network active - resetting view...', false, toggleEgoNetwork);
    await egoNetworkOff();
    setupFilteredElements();
    styleGraphElements();

    if (toggleSettings) {
      // show quick access and settings
      show('#settings');
      show('#infoContainer');
    }
  } else {
    _output(
        `Filtering out an ego network based on ${node.node_id}`,
        false,
        toggleEgoNetwork,
    );
    await egoNetworkOn(node);
    setupFilteredElements();
    styleGraphElements();

    window._selectors.main.on('click', (event) => {
      if (event.metaKey && window.egoNetwork) {
        _output(`ego active - resetting view...`, false, toggleEgoNetwork);
        resetLocalStorage();
      }
    });

    if (toggleSettings) {
      // hiding quick access and settings
      hide('#settings');
      hide('#infoContainer');
    }
  }
};

/**
 * toggleCommentedElements takes 0 arguments but changes the view of the
 * network to show the "comments" behind edges and nodes.
 * The return value is always true.
 * @arg {string} force - "on" or "off" (or undefined)
 * @return {boolean} - true
 */
const toggleCommentedElements = (force = undefined) => {
  if (window.toggledCommentedElements || force === 'off') {
    window.toggledCommentedElements = false;
    filter();
    window._selectors['popup-info'].classed('d-none', true);
    restartSimulation();
  } else if (!window.toggledCommentedElements || force === 'on') {
    window.toggledCommentedElements = true;
    const nodesWithComments = window.graph.nodes.filter((n) => n.has_comments);
    const edgesWithComments = [
      ...window.graph.edges.filter((e) => e.has_comments),
      ...window.graph.edges.filter((e) => e.has_general_comments),
    ];
    edgesWithComments.forEach((edge) => {
      nodesWithComments.push(edge.source);
      nodesWithComments.push(edge.target);
    });
    filter(nodesWithComments, edgesWithComments);
    restartSimulation();
  }
  window._selectors.commentedNodes
      .classed('bg-dark', !window.toggledCommentedElements)
      .classed('bg-warning', window.toggledCommentedElements);
  return true;
};

const filterNodesWithoutName = () => {
  const returnObject = {
    runs: 1,
    dropped: [],
  };
  while (hasUnnamedNodes()) {
    window.graph.nodes.forEach((node) => {
      if (node.id.toLowerCase().includes('unnamed')) {
        // remove node with node_id node.node_id!
        window.graph.nodes.forEach((o, i) => {
          if (node.node_id === o.node_id) {
            window.graph.nodes.splice(i, 1);
            returnObject.dropped.push(node.node_id);
          }
        });
      }
    });
  }

  if (returnObject.dropped.length > 0) {
    troubleshoot(true); // ensures that all nodes are correctly represented in
    // console.log('running setupFilteredElements in filterNodesWithoutName')
    // setupFilteredElements();
    updateInfo();
  }

  // returnObject could be passed to a debugMessage thus:
  // debugMessage(`Dropped nodes without edge (after ${runs}).`, "Information");
  return returnObject;
};

/**
 * filterNodesWithoutEdge takes no arguments but loops through the visualization
 * looking for unconnected nodes.
 * The return value is an object with information about the dropped nodes.
 * @return {Object} - Object with two properties, `runs` denotes how many
 * iterations the function ran through, and `dropped` with a list of all
 * node_ids that were removed.
 */
const filterNodesWithoutEdge = () => {
  const returnObject = {
    runs: 0,
    dropped: [],
  };
  while (hasUnconnectedNodes()) {
    window.graph.nodes.forEach((node) => {
      if (nodeHasEdges(node) === false) {
        // remove node with node_id node.node_id!
        window.graph.nodes.forEach((o, i) => {
          if (node.node_id === o.node_id) {
            window.graph.nodes.splice(i, 1);
            returnObject.dropped.push(node.node_id);
          }
        });
      }
    });
    returnObject.runs += 1;
  }

  if (returnObject.dropped.length > 0) {
    troubleshoot(true); // ensures that all nodes are correctly represented in
    // console.log('running setupFilteredElements in filterNodesWithoutEdge')
    // setupFilteredElements();
    updateInfo();
  }

  // could be passed to a debugMessage thus:
  // debugMessage(`Dropped nodes with no edge (after ${runs}).`, "Information");
  return returnObject;
};
