/* eslint no-unused-vars: ["error", { "vars": "local" }] */
/* global hasUnconnectedNodes */
/* global hasUnnamedNodes */
/* global restartSimulation */
/* global isSourceOrTarget */
/* global toggleNode */
/* global toggleEdge */
/* global modifyNodeDegrees */
/* global graphNodesContains */
/* global graphEdgesContains */
/* global modifySimulation */
/* global getTextClass */
/* global hasFixedNodes */
/* global getVenuesForNode */

'use strict';

// set up window.store.ranges
window.range = (start, stop, step) => {
  return Array.from(
      {length: (stop - start) / step + 1},
      (x, i) => start + i * step,
  );
};

/**
 * nodeHasEdges takes two arguments, the first of which defines a node_id
 * and the second whether a count should be provided.
 * The return value depends on whether the count parameter was set to true
 * or false. If it's true, it will return the number
 * of edges from the given node_id. Otherwise, it will return a boolean
 * that tells you whether the node has edges or not.
 * @arg {Object} node - A d3 node selection.
 * @arg {boolean} [count] - Tell the function whether it should return a
 *                          count of edges (true) or a boolean (false).
 * @return {boolean|number} - A boolean that describes whether the node
 *                            has edges or not, or the number of edges
 *                            that are connected to the node.
 */
const nodeHasEdges = (node, count = false) => {
  let returnValue = false;
  let counted = 0;

  window.graph.edges.filter((edge) => {
    if (edge.source.node_id === node.node_id) {
      returnValue = true;
      counted += 1;
    }
    if (edge.target.node_id === node.node_id) {
      returnValue = true;
      counted += 1;
    }
  });

  return count === true ? counted : returnValue;
};

/**
 * getUnnamedNodes takes no arguments but looks through window.graph.nodes
 * in the current viz for any unconnected nodes.
 * The return value is a list of all the node objects that are currently
 * unconnected.
 * @return {Array} - Array of all the unconnected nodes in the visualization.
 */
const getUnnamedNodes = () => {
  const unnamedNodes = [];
  window.graph.nodes.forEach((node) => {
    if (node.id.toLowerCase().includes('unnamed')) {
      unnamedNodes.push(node);
    }
  });
  return unnamedNodes;
};

/**
 * getUnconnectedNodes takes no arguments but looks through window.graph.nodes
 * in the current viz for any unconnected nodes.
 * The return value is a list of all the node objects that are currently
 * unconnected.
 * @return {Array} - Array of all the unconnected nodes in the visualization.
 */
const getUnconnectedNodes = () => {
  const unConnectedNodes = [];
  window.graph.nodes.forEach((node) => {
    if (nodeHasEdges(node) === false) {
      unConnectedNodes.push(node);
    }
  });
  return unConnectedNodes;
};

/**
 * hasUnconnectedNodes takes no arguments but checks whether the current
 * window.graph.nodes contains unconnected nodes.
 * The return value is a boolean of whether the graph has unconnected nodes.
 * @return {boolean} - Boolean that describes whether the graph has
 *                     unconnected nodes.
 */
const hasUnconnectedNodes = () => {
  return getUnconnectedNodes().length > 0;
};

/**
 * hasUnnamedNodes takes no arguments but checks whether the current
 * window.graph.nodes contains unnamed nodes.
 * The return value is a boolean of whether the graph has unnamed nodes.
 * @return {boolean} - Boolean indicating whether the graph has unnamed nodes.
 */
const hasUnnamedNodes = () => {
  return getUnnamedNodes().length > 0;
};

/**
 * restartSimulation takes no arguments but simply runs the three commands that
 * restarts the movement in the visualization. It is used when a setting is
 * changed to ensure that the simulation keeps rendering correctly.
 * The return value is always true.
 * @return {boolean} - true
 */
const restartSimulation = () => {
  window.graph.simulation.stop();
  // window.graph.simulation;
  window.graph.simulation.restart().alpha(0.2);
  return true;
};

/**
 * nodeIsSelected takes one argument and determines whether the provided
 * node is selected or not, by checking whether it has been classed with
 * `selected`.
 * The return value is a boolean, whether it is selected (`true`) or
 * not (`false`).
 * @arg {Object} node - A d3 node selection.
 * @return {boolean} - Whether the node has been selected or not
 *                     (in reality, has the class `selected` or not).
 */
const nodeIsSelected = (node) => {
  return d3.select(`#${node.node_id}`).classed('selected');
};

/**
 * edgeIsSelected takes one argument and determines whether the provided
 * edge is selected or not, by checking whether it has been classed with
 * `selected`.
 * The return value is a boolean, whether it is selected (`true`) or
 * not (`false`).
 * @arg {Object} edge - A d3 edge selection.
 * @return {boolean} - Whether the edge has been selected or not (in reality,
 *                     has the class `selected` or not).
 */
const edgeIsSelected = (edge) => {
  return d3.select(`#${edge.edge_id}`).classed('selected');
};

/**
 * deselectNodes takes one optional argument of a d3 selected node to be
 * excluded from the "deselection" process (in reality, the removal of the
 * `selected` class from the DOM elements).
 * The return value is always true;
 * @arg {Object} excludeNode - Any given d3 selected node to exclude
 *                             from the process.
 * @return {boolean} - true
 */
const deselectNodes = (excludeNode = undefined, freeze=true) => {
  nodeElements.classed('selected', (node) => {
    if (excludeNode && node === excludeNode) {
      if (nodeIsSelected(node)) {
        // do nothing
      } else {
        return true;
      }
    } else {
      return false;
    }
  });
  textElements.classed('selected', (node) => {
    if (excludeNode && node === excludeNode && nodeIsSelected(node)) {
      return true;
    } else {
      return false;
    }
  });

  // formerly unselectNodes:
  let related = undefined;
  nodeElements.classed('deselected', (node) => {
    if (excludeNode && node === excludeNode) {
      if (freeze) {
        node.fx = node.x;
        node.fy = node.y;
      }
      related = getRelated(node);
      return false;
    } else {
      return true;
    }
  });
  if (related) {
    related.secondaryNodeIDs.forEach((nodeID) => {
      d3.select(`#${nodeID}`)
        .classed('selected-secondary', true)
        .classed('deselected', false);
      d3.select(`text[data-node="${nodeID}"]`)
        .classed('label-selected-secondary', true)
        .classed('deselected', false);
    });
    related.tertiaryNodeIDs.forEach((nodeID) => {
      d3.select(`#${nodeID}`)
        .classed('selected-tertiary', true)
        .classed('deselected', false);
      d3.select(`text[data-node="${nodeID}"]`)
        .classed('label-selected-tertiary', true)
        .classed('deselected', false);
    });
    related.tertiaryEdges.forEach((edgeID) => {
      d3.select(`#${edgeID}`)
        .classed('selected-tertiary', true)
        .classed('deselected', false);
    });
  }

  return true;
};

/**
 * deselectEdges takes one optional argument of a d3 selected edge to be
 * excluded from the "deselection" process (in reality, the removal of the
 * `selected` class from the DOM elements).
 * The return value is always true;
 * @arg {Object} excludeEdge - Any given d3 selected edge to exclude
 *                             from the process.
 * @return {boolean} - true
 */
const deselectEdges = (excludeEdge = undefined) => {
  edgeElements.classed('selected', (edge) => {
    if (excludeEdge && edge === excludeEdge) {
      if (edgeIsSelected(edge)) {
        // do nothing
      } else {
        return true;
      }
    } else {
      return false;
    }
  });
  edgeElements.classed('deselected', (edge) => {
    if (excludeEdge && edge === excludeEdge) {
    } else {
      return true;
    }
  });
  return false;
};

/**
 * isSourceOrTarget takes one required argument, a node (which can either
 * be a d3 node selection or a string denoting a `nodeID`), and one optional
 * argument, which specifies // TODO: Needs docstring
 * The return value is a list of all the related edges, depending on the
 * parameters.
 * @arg {Object|string} node - A d3 selection for a node, or a string denoting
 *                             a node's identification name
 * @arg {Array} [edgeList] - A list with all the edges that you want to
 *                           check against.
 * @returns {Array} - List of all the edges that are connected to the given node
 */
// TODO: This function essentially doubles with nodeHasEdges...
const isSourceOrTarget = (node, edgeList = window.graph.edges) => {
  if (typeof node === 'string') node = findNode(node);

  const isSource = edgeList.map((d) => d.source.node_id).includes(node.node_id);
  const isTarget = edgeList.map((d) => d.target.node_id).includes(node.node_id);
  return isSource || isTarget;
};

/**
 * getRelatedEdges takes one required argument, a node (which can either be a
 * d3 node selection or a string denoting a `node_id`), and two optional
 * arguments, which specifies if you want to get a list of related edges,
 * where the node is the target (`asTarget`), the source (`asSource`) or
 * both (set both to `true`).
 * The return value is a list of all the related edges, depending on the
 * parameters.
 * @arg {Object|string} node - A d3 selection for a node, or a string denoting
 *                             a node's identification name
 * @arg {boolean} asSource - Specifies whether to look for edges where the
 *                           given node is the target
 * @arg {boolean} asTarget - Specifies whether to look for edges where the
 *                           given node is the source
 * @returns {Array} - List of all the edges that are connected to the given node
 */
/*
const getRelatedEdges = (node, asSource = true, asTarget = true) => {
    if (typeof node === "string")
        node = findNode(node);

    let allRelatedEdges = [];
    if (asTarget) {
        let relatedEdgesAsTarget = window.graph.elements.edges
            .selectAll("line.link")
            .data()
            .filter((l) => l.target === node);
        allRelatedEdges.push(...relatedEdgesAsTarget);
   }
    if (asSource) {
        let relatedEdgesAsSource = window.graph.elements.edges
            .selectAll("line.link")
            .data()
            .filter((l) => l.source === node);
        allRelatedEdges.push(...relatedEdgesAsSource);
   }
    return allRelatedEdges;
};
*/
const getRelatedEdges = (
    node,
    asSource = true,
    asTarget = true,
    edgeList = undefined,
    returnVal = 'nodelist',
) => {
  if (!edgeList) edgeList = window.store.edges;

  let nodeList = undefined;

  if (typeof node === 'string') node = findNode(node);

  if (asSource && asTarget) {
    nodeList = edgeList.filter(
        (edge) => edge.source === node || edge.target === node,
    );
  } else if (asSource) {
    nodeList = edgeList.filter((edge) => edge.source === node);
  } else if (asTarget) {
    nodeList = edgeList.filter((edge) => edge.target === node);
  }
  if (returnVal === 'nodelist' && nodeList) {
    return nodeList;
  } else if (nodeList) {
    return nodeList.length;
  } else {
    return [];
  }
};

/**
 * selectRelatedEdges takes one required argument, a node (which can either be a
 * d3 node selection or a string denoting a `node_id`).
 * The return value is always true.
 * @arg {Object|string} node - A d3 selection for a node, or a string denoting a
 *                             node's identification name
 * @return {boolean} - true
 */
const selectRelatedEdges = (node) => {
  if (typeof node === 'string') {
    node = findNode(node);
  }

  window.graph.elements.edges.selectAll('line.link')
      .classed('deselected', true);

  // TODO: Also dim all text.

  getRelatedEdges(node).forEach((edge) => {
    d3.select(`#${edge.edge_id}`).classed('selected', true);
    d3.select(`#${edge.edge_id}`).classed('deselected', false);
  });
  return true;
};

/**
 * getRelated takes one required argument, a node (which can either be a d3 node
 * selection or a string denoting a `node_id`). Then it loops through the
 * related edges and nodes for each of its children, // TODO
 * The return value is an object, which contains a number of properties:
 * `primary` which is the original node, `secondaryNodeIDs` and `secondaryEdges`
 * which have lists of all respective secondary objects and `tertiaryNodeIDs`
 * and `tertiaryEdges` for all the respective tertiary objects.
 * @arg {Object|string} node - A d3 selection for a node, or a string denoting
 *                             a node's identification name
 * @return {Object} - Object that contains all the information about the nodes
 *                    and edges (2nd and 3rd removed) from the provided node
 */
const getRelated = (node) => {
  if (typeof node === 'string') node = findNode(node);

  let secondaryEdges = getRelatedEdges(node);
  const secondaryNodeIDs = [
    ...new Set([
      ...secondaryEdges.map((edge) => edge.source.node_id),
      ...secondaryEdges.map((edge) => edge.target.node_id),
    ]),
  ].filter((cmp) => cmp != node.node_id);

  let tertiaryNodeIDs = [];
  let tertiaryEdges = [];
  secondaryNodeIDs.forEach((nodeID) => {
    const _tertiaryEdges = getRelatedEdges(nodeID);
    const _tertiaryNodeIDs = [
      ...new Set([
        ..._tertiaryEdges.map((edge) => edge.source.node_id),
        ..._tertiaryEdges.map((edge) => edge.target.node_id),
      ]),
    ].filter((cmpNode) => cmpNode != nodeID &&
                          cmpNode != node.node_id);
    tertiaryNodeIDs = [...tertiaryNodeIDs, ..._tertiaryNodeIDs];
    tertiaryEdges = [...tertiaryEdges, ..._tertiaryEdges];
  });
  secondaryEdges = secondaryEdges.map((edge) => edge.edge_id);
  tertiaryEdges = tertiaryEdges.map((edge) => edge.edge_id);
  const returnValue = {
    primary: node,
    secondaryNodeIDs: secondaryNodeIDs,
    tertiaryNodeIDs: tertiaryNodeIDs,
    secondaryEdges: secondaryEdges,
    tertiaryEdges: tertiaryEdges,
  };
  return returnValue;
};

/**
 * styleGraphElements takes no arguments but resets all the different graph
 * elements (nodes, edges, labels) to their original settings.
 * The return value is always true.
 * @arg {Object} settings
 * @return {boolean} - true
 */
const styleGraphElements = (settings = undefined) => {
  _output('Called', false, styleGraphElements);

  if (!settings) settings = settingsFromDashboard('styleGraphElements');

  if (
    !settings.nodes.communityDetection &&
        document.querySelector('html').classList.contains('has-community')
  ) {
    document.querySelector('html').classList.remove('has-communities');
    // TODO: This should happen here but causes bug in modifySimulation.
    // window.graph.clusters = {};
  }

  [...document.querySelectorAll('#searchToggle input')].forEach((elem) => {
    elem.value = '';
  });
  resetAfterSearch();

  nodeElements
      .attr('class', (node) => getNodeClass(node))
      .transition()
      .attr('r', (node) => getSize(node, 'r', settings))
      .attr('style', (node) => {
        const color = window.graph.clusterColors[node.cluster];
        return (node.cluster && settings.nodes.communityDetection) ?
          `fill: ${d3.color(color).darker(1.5)}` :
          '';
      });

  edgeElements
      .attr('class', (edge) => getEdgeClass(edge))
      .transition()
      .style('stroke-width', (edge) => getEdgeStrokeWidth(edge, settings));

  if (!settings.nodes.stickyNodes) {
    textElements.attr('', (node) => {
      node.fx = null;
      node.fy = null;
    });
  }

  textElements
      .attr('class', 'label')
      .attr('style', (node) => {
        const color = window.graph.clusterColors[node.cluster];
        return settings.nodes.communityDetection ?
                `fill: ${d3.color(color).darker(0.5)};` :
                '';
      })
      .transition()
      .duration(750)
      .attr('opacity', 1)
      .attr('font-size', (node) => getSize(node, 'text', settings));

  return true;
};

/**
 * toggleNode takes one required argument, the d3 selector for a given node.
 * This is the function that handles the "click" event on the node.
 * The return value is always true.
 * @arg {Object} node - d3 selector for a given node.
 * @return {boolean} - true
 */
const toggleNode = (node, freeze=true) => {
  if (nodeIsSelected(node)) {
    window.nodeSelected = undefined;
    hide('#nodeEdgeInfo');
    styleGraphElements();
  } else {
    window.nodeSelected = true;
    styleGraphElements();
    deselectNodes(node, freeze);
    selectRelatedEdges(node);
    setNodeEdgeInfo(node);
  }
  return true;
};

/**
 * toggleEdge takes one required argument, the d3 selector for a given edge.
 * This is the function that handles the "click" event on the edge.
 * The return value is always true.
 * @arg {Object} edge - d3 selector for a given edge.
 * @return {boolean} - true
 */
const toggleEdge = (edge) => {
  if (edgeIsSelected(edge)) {
    window.edgeSelected = undefined;
    hide('#nodeEdgeInfo');
    styleGraphElements();
  } else {
    window.edgeSelected = true;
    deselectEdges(edge);
    setNodeEdgeInfo(edge);
  }
  return true;
};

/**
 * modifyNodeDegrees takes no arguments and just makes sure that each node in
 * the current graph has a `currentDegree` set to match its number of edges.
 * The return value is always true.
 * @return {boolean} - true
 */
const modifyNodeDegrees = () => {
  window.graph.nodes.forEach((node) => {
    node.currentDegree = nodeHasEdges(node, true);
    node.degrees.current_calculated = nodeHasEdges(node, true);
  });
  return true;
};

/**
 * graphNodesContains takes one required argument, the d3 selector for a given
 * node. The return value provides an answer to whether the node is represented
 * in the current visualization or not.
 * @arg {string} nodeID - An identifier string for a given node
 * @return {boolean} - Denotes whether the node is represented in the
 *                     window.graph.nodes or not
 */
const graphNodesContains = (nodeID) => {
  return [...window.graph.nodes.map((node) => node.node_id)].includes(nodeID);
};

/**
 * graphEdgesContains takes one required argument, the d3 selector for any given
 * node. The return value provides an answer to whether the edge is represented
 * in the current visualization or not.
 * @arg {string} edgeID - An identifier string for a given edge
 * @return {boolean} - Denotes whether the edge is represented in the
 *                     window.graph.edges or not
 */
const graphEdgesContains = (edgeID) => {
  return [...window.graph.edges
      .map((edge) => edge.edge_id)]
      .includes(edgeID);
};

/**
 * modifySimulation takes no arguments but is the function that runs after
 * updateElement — every time that the d3 network has been filtered, and the
 * simulation needs to be restarted.
 * The return value is always true.
 * @arg {Object} settings
 * @return {boolean} true
 */
const modifySimulation = (settings) => {
  _output('Called', false, modifySimulation);

  if (!settings) settings = settingsFromDashboard('modifySimulation');

  if (settings.force.layoutClustering && settings.nodes.communityDetection) {
    const clustering = (alpha) => {
      window.graph.nodes.forEach((d) => {
        const cluster = window.graph.clusters[d.cluster];
        if (cluster === d) return;
        let x = d.x - cluster.x;
        let y = d.y - cluster.y;
        let l = Math.sqrt(x * x + y * y);
        const r = d.r + cluster.r;
        if (l !== r) {
          l = ((l - r) / l) * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      });
    };
    window.graph.simulation.force('cluster', clustering);
  } else {
    window.graph.simulation.force('cluster', undefined);
  }

  window.graph.simulation.force('link').links(window.graph.edges);
  window.graph.simulation.nodes(window.graph.nodes);
  if (settings.force.layoutCenter) {
    window.graph.simulation.force('center', d3.forceCenter());
    window.graph.simulation.force('center').strength = 1;
  } else {
    window.graph.simulation.force('center', null);
  }
  if (settings.force.layoutForceX) {
    window.graph.simulation.force('forceX', d3.forceX());
  } else {
    window.graph.simulation.force('forceX', null);
  }
  if (settings.force.layoutForceX) {
    window.graph.simulation.force('forceY', d3.forceY());
  } else {
    window.graph.simulation.force('forceY', null);
  }
  if (settings.force.layoutCharge) {
    window.graph.simulation.force('charge', d3.forceManyBody());
    window.graph.simulation.force('charge').strength(settings.force.charge);
  } else {
    window.graph.simulation.force('charge', null);
  }
  if (settings.force.layoutCollide) {
    const collide = d3
        .bboxCollide((node) => {
          const width = document
              .querySelector(`text[data-node="${node.node_id}"]`)
              .getBBox().width;
          const height = document
              .querySelector(`text[data-node="${node.node_id}"]`)
              .getBBox().height;
          const divider = 2;
          return [
            [-width / divider, -height / divider],
            [width / divider, height / divider],
          ];
        })
        .strength(1)
        .iterations(2);
    window.graph.simulation.force('collide', collide);
  } else {
    window.graph.simulation.force('collide', null);
  }

  window.graph.simulation.force('link').strength(settings.force.linkStrength);

  window.graph.simulation.on('tick', () => {
    d3.select('#loadingDot').attr('data-running', true);
    nodeElements.attr('cx', (node) => node.x);
    nodeElements.attr('cy', (node) => node.y);

    /* personElements
        .attr("transform", (node) => {
                let width = getSize(node, "r", settings);
                return `translate(${node.x-width/2},${node.y-width/2})`
              })
    */

    edgeElements.attr('x1', (edge) => edge.source.x);
    edgeElements.attr('y1', (edge) => edge.source.y);
    edgeElements.attr('x2', (edge) => edge.target.x);
    edgeElements.attr('y2', (edge) => edge.target.y);

    textElements.attr('x', (node) => {
      const nodeElement = document
          .querySelector(`text[data-node=${node.node_id}]`);
      if (nodeElement) {
        return node.x - (nodeElement.getBBox().width/2);
      } else {
        throw new Error(`text[data-node=${node.node_id}] does not exist.`);
      }
    });
    textElements.attr('y', (node) => node.y + node.r/2);
  });

  // restart the simulation now that everything is set
  window.graph.simulation.restart();

  return true;
};


/**
 * getNodeClass takes one required argument, the d3 selector for a given node.
 * It is the function that provides the class for any given node in the
 * visualization.
 * The return value is a string of classes.
 * @arg {Object} node - d3 selector for a given node.
 * @return {string} - The string of classes to return to the node.
 */
const getNodeClass = (node) => {
  let classes = '';
  if (window.toggledCommentedElements) {
    classes = 'node';
    classes += node.has_comments ?
            ` ${node.category} has-comments` :
            ' disabled';
  } else {
    classes = 'node ' + node.category;
    classes += node.has_comments ? ' has-comments' : '';
  }
  // move this to a fill instead (see `getClusterColor`)
  /* if (settings.communityDetection && node.cluster) {
    classes = `node cluster-${node.cluster}`
  }
  */
  return classes;
};

/**
 * getEdgeClass takes one required argument, the d3 selector for a given edge.
 * It is the function that provides the class for any given edge in the
 * visualization. The return value is a string of classes.
 * @arg {Object} edge - d3 selector for a given edge.
 * @return {string} - The string of classes to return to the edge.
 */
const getEdgeClass = (edge) => {
  let classes = 'link';
  classes += edge.revue_name != '' ? ' revue' : ' no-revue';
  classes += edge.has_comments ? ' has-comments' : '';
  classes += edge.has_general_comments ? ' has-comments' : '';
  return classes;
};

/**
 * getEdgeStrokeWidth takes one required argument, the d3 selector for a given
 * edge. It is the function that provides the `stroke-width` value for the edges
 * in the visualization. The return value is a string with the stroke width
 * followed by "px".
 * @arg {Object} edge - d3 selector for a given edge.
 * @arg {Object} settings
 * @return {string} - The string with the stroke width.
 */
const getEdgeStrokeWidth = (edge, settings) => {
  // , weightFromCurrent=undefined, min, max) => {
  /*
    if (weightFromCurrent===undefined || edgeMultiplier===undefined) {
        let settings = settingsFromDashboard('getEdgeStrokeWidth');
        if (!weightFromCurrent)
            weightFromCurrent = settings.edges.weightFromCurrent;
        if (!edgeMultiplier)
            edgeMultiplier = settings.edges.edgeMultiplier;
   }
    */
  if (!settings) settings = settingsFromDashboard('getEdgeStrokeWidth');

  const weightScale = edgeScale(settings);

  const evalWeight = edge.weights[settings.edges.weightFrom];

  return weightScale(evalWeight) * +settings.edges.edgeMultiplier + 'px';
};

/**
 * getNodeClass takes one required argument, the d3 selector for a given node.
 * It is the function that provides the class for any given node in the
 * visualization. The return value is ... // TODO: Needs docstring
 * @arg {Object} node - d3 selector for a given node.
 * @return {string} - The string of classes to return to the node.
 */
const getTextClass = (node) => {
  let classes = 'label ' + node.category;
  classes += node.has_comments ? ' has-comments' : '';
  return classes;
};

/**
 * getSize takes one required argument, the d3 selector for a given node.
 * The optional `type` argument, provides whether the return value should
 * be for an `r` value (DOM `circle` elements) or for an `font-size` value
 * (DOM `text` elements).
 * The return value is a number, run through the current scale.
 * @arg {Object} node - d3 selector for a given node.
 * @arg {Object} [type] - Either "r" (default) for a `circle` DOM element,
 *                        or "text" for a `text` DOM element.
 * @arg {Object} settings
 * @return {number} - The size in pixels
 */
const getSize = (node, type = 'r', settings = undefined) => {
  if (!settings) {
    console.error(
        'Settings must be passed to an iterative function like getSize.',
    );
  }

  const nodeMultiplier = settings.nodes.nodeMultiplier;
  let degree = undefined;

  if (settings.nodes.rFrom === 'currentDegree') {
    degree = node.currentDegree;
  } else if (settings.nodes.rFrom === 'degrees__degree') {
    degree = node.degrees.degree;
  } else if (settings.nodes.rFrom === 'betweenness_centrality') {
    degree = node.centralities.betweenness_centrality_100x;
  } else if (settings.nodes.rFrom === 'closeness_centrality') {
    degree = node.centralities.closeness_centrality_100x;
  } else if (settings.nodes.rFrom === 'degree_centrality') {
    degree = node.centralities.degree_centrality_100x;
  } else if (settings.nodes.rFrom === 'eigenvector_centrality') {
    degree = node.centralities.eigenvector_centrality_100x;
  } else {
    degree = 1;
  }


  if (window.toggledCommentedElements === true) {
    if (node.has_comments) {
      return 10 * nodeMultiplier;
    } else {
      return 5 * nodeMultiplier;
    }
  }

  if (type === 'r') {
    const yScale = nodeScale(settings);
    return yScale(degree) * nodeMultiplier;
  } else if (type === 'text') {
    const yScale = nodeScale(settings, true);
    return yScale(degree) * nodeMultiplier;
  }
};

const findNode = (nodeID, nodeList = window.store.nodes) => {
  let search1 = nodeList.find((node) => node.node_id === nodeID);
  if (search1) {
    return search1;
  }
  let search2 = nodeList.find((node) => node.display === nodeID);
  if (search2) {
    return search2;
  }
  return undefined;
};

const hasFixedNodes = () => {
  return window.graph.nodes
      .map((node) => node.fx)
      .every((d) => d === null);
};

const getVenuesForNode = (nodeID) => {
  let _ = [];
  findNode(nodeID)
      .connected
      .edges
      .map((e)=>e.coLocated).forEach((o)=>
        Object.keys(o).forEach((venue)=>_.push(venue)));
  _ = [...new Set(_)];
  return _;
};

const findVenue = (searchTerm) => {
  const res = [];
  window.store.edges.forEach((e)=>{
    Object.keys(e.coLocated).forEach((v)=>{
      if (v.toLowerCase().includes(searchTerm)) {
        res.push(e);
      }
    });
  });
  return res;
};

const findComment = (searchTerm) => {
  const returnValue = [];
  window.store.nodes
      .filter((node) => node.has_comments).forEach((node)=>{
        node.comments.forEach((comment) => {
          if (comment.content.toLowerCase().includes(searchTerm)) {
            returnValue.push(node);
          }
        });
      });
  return returnValue;
};

const resetForSearch = (type) => {
  const isAlreadySearching = [
    ...document.querySelector('body')
        .classList]
      .includes(type);
  if (!isAlreadySearching) {
    document.querySelector('body')
        .classList
        .add(type);
    deselectNodes();
    textElements.attr('opacity', 0.2);
  }
};

const resetAfterSearch = (type) => {
  document.querySelector('body')
      .classList
      .remove(type);
};

const highlightSelected = (arg) => {
  edgeElements
      .classed('selected', (edge) => arg.edges.includes(edge));
  nodeElements
      .classed('selected', (node) => arg.nodes.includes(node));
  nodeElements
      .classed('highlighted', (node) => arg.nodes.includes(node));
  textElements
      .attr('opacity', (node) => arg.nodes.includes(node) ? 1 : 0.2);
  textElements
      .classed('selected', (node) => arg.nodes.includes(node) ? 1 : 0.2);
};

const searchEdge = (edge) => {
  if (edge.inputType === 'insertText' ||
      edge.inputType === 'insertFromPaste' ||
      (edge.inputType === 'deleteContentBackward' &&
       document.querySelector('#searchEdge').value !== '')) {
    resetForSearch('searchEdge');
    // continue searching...
    const selected = findVenue(document.querySelector('#searchEdge').value);
    const selectedSources = selected.map((e)=>e.source);
    const selectedTargets = selected.map((e)=>e.target);
    highlightSelected({
      edges: selected,
      nodes: [...selectedTargets, ...selectedSources],
    });
  } else if (edge.inputType.includes('delete') &&
             document.querySelector('#searchEdge').value === '') {
    resetAfterSearch('searchEdge');
    styleGraphElements();
  }
};

const searchComment = (edge) => {
  const searchField = document.querySelector('#searchComment').value;
  if (edge.inputType === 'insertText' ||
      edge.inputType === 'insertFromPaste' ||
      (edge.inputType === 'deleteContentBackward' &&
       searchField !== '')) {
    resetForSearch('searchComment');
    // continue searching...
    const selectedNodes = findComment(searchField);
    nodeElements.classed('selected', (node) => selectedNodes.includes(node));
    highlightSelected({edges: [], nodes: selectedNodes});
  } else if (edge.inputType === 'deleteContentBackward' && searchField === '') {
    resetAfterSearch('searchComment');
    styleGraphElements();
  }
};

d3.select('#searchEdge').on('input', (edge) => searchEdge(edge));
d3.select('#searchComment').on('input', (edge) => searchComment(edge));
