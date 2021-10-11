/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

/**
 * isVisible takes one argument, which can be the string of the selector
 * that you want to know whether it visible or not, or the d3 selected
 * object (created using `d3.select(selector)`).
 * The return value will tell you whether the selector is currently
 * visible (`true`) or not (`false`).
 * @arg {string|object} selector - The string of the DOM selector or
 *                                 d3 selection
 * @return {boolean} - Whether the selector is currently visible or not
 */
const isVisible = (selector) => {
  try {
    return d3.select(selector).classed('d-none') === false;
  } catch {
    console.error('Selector cannot be found');
    console.error(selector);
    return false;
  }
};

/**
 * toggle takes one argument, which should be the string of the selector you
 * want to toggle, or the d3 selection (created using `d3.select(selector)`).
 * The function uses the `isVisible` function to determine whether the selector
 * should be shown or hidden. It also has some special rules added to it.
 * The return value is always true.
 * @arg {string|object} selector - The string of the DOM selector/a d3 selection
 * @return {boolean} - true
 */
const toggle = (selector) => {
  try {
    if (typeof selector === 'object') {
      selector.classed('d-none', isVisible(selector));
    } else {
      d3.select(selector).classed('d-none', isVisible(selector));
    }

    // special rules
    if (selector === '#settingsContainer') {
      window._selectors['settingsToggle'].classed(
          'toggled',
          !isVisible(selector),
      );
    } else if (selector === '#infoToggleDiv') {
      window._selectors['infoToggle'].classed(
          'toggled',
          !isVisible(selector),
      );
    } else if (selector === '#popupNav') {
      const menuWidth = getComputedStyle(
          document.querySelector('.popup-nav'),
      ).width;
      if (
        document.getElementById('popupNav').style.left ==
        `-${menuWidth}`
      ) {
        document.getElementById('popupNav').style.left = '0px';
      } else {
        document.getElementById(
            'popupNav',
        ).style.left = `-${menuWidth}`;
      }
    }

    return true;
  } catch {
    console.error('Selector cannot be found');
    console.error(selector);
    return false;
  }
};

/**
 * hide takes one argument, which can be the string of the selector that
 * you want hidden (added class `d-none` to the element) or the d3 selected
 * object (created using `d3.select(selector)`).
 * The return value is always true.
 * @arg {string|object} selector - The string of the DOM selector or d3
 *                                 selection to hide
 * @return {boolean} - true
 */
const hide = (selector) => {
  if (typeof selector === 'object') {
    selector.classed('d-none', true);
  } else {
    if (!selector.startsWith('#')) {
      d3.selectAll(selector).classed('d-none', true);
    } else {
      d3.select(selector).classed('d-none', true);
    }
  }
  return true;
};

/**
 * show takes one argument, which can be the string of the selector that
 * you want shown (removed class `d-none` from the element) or the d3
 * selected object (created using `d3.select(selector)`).
 * The return value is always true.
 * @arg {string|object} selector - The string of the DOM selector or d3
 *                                 selection to show
 * @return {boolean} - true
 */
const show = (selector) => {
  if (typeof selector === 'object') {
    selector.classed('d-none', false);
  } else {
    if (!selector.startsWith('#')) {
      d3.selectAll(selector).classed('d-none', false);
    } else {
      d3.select(selector).classed('d-none', false);
    }
  }
  return true;
};

/**
 * setNodeEdgeInfo takes one argument and determines whether the provided
 * element is a node or an edge, updates the information box, and finally
 * shows it.
 * The return value is always true.
 * @arg {Object} elem - The d3 selection of a node or an edge from the
 *                      visualization.
 * @return {boolean} - true
 */
const setNodeEdgeInfo = (elem) => {
  const selector = d3.select('#nodeEdgeInfoContainer .list-group');
  if (elem.node_id) {
    selector.html(elem.infoHTML);
  } else if (elem.edge_id) {
    selector.html(elem.infoHTML);
  }
  const container = window._selectors['nodeEdgeInfo'];
  show(container);
  return true;
};

const toggleColorNetworks = () => {
  _output('Called', false, toggleColorNetworks);
  if (!window.coloredNetworks) {
    window.coloredNetworks = true;
    colorNetworks();
  } else {
    window.coloredNetworks = false;
    resetDraw();
  }
  d3.select('.colorNetworks')
      .classed('text-dark', !window.coloredNetworks)
      .classed('text-warning', window.coloredNetworks);
};

/**
 * updateInfo takes no arguments acts as a quick access point for functions
 * that need to update the information about the visualization.
 * The return value is always true.
 * @return {boolean} true
 */
const updateInfo = () => {
  show('#info');
  d3.select('.colorNetworks').on('click', toggleColorNetworks);
  d3.select('.commentedNodes').on('click', toggleCommentedElements);

  // getCurrentGraphInfo()
  const updateValues = getCurrentGraphInfo();
  document.querySelectorAll('.numNodes').forEach((elem) => {
    elem.innerHTML =
      '<i class="me-1 small bi bi-record-fill"></i>' +
      updateValues.numNodes.content;
  });
  document.querySelectorAll('.numEdges').forEach((elem) => {
    elem.innerHTML =
      '<i class="me-1 small bi bi-slash"></i>' +
      updateValues.numEdges.content;
  }); // share-fill
  document.querySelectorAll('.unconnectedNodes').forEach((elem) => {
    elem.innerHTML =
      '<i class="me-1 bi bi-node-minus"></i>' +
      updateValues.unconnectedNodes.content;
  });
  document.querySelectorAll('.currentZoom').forEach((elem) => {
    elem.innerHTML =
      '<i class="me-1 bi bi-search"></i>' +
      updateValues.currentZoom.content;
  });
  document.querySelectorAll('.numCommunities').forEach((elem) => {
    elem.innerHTML =
      '<i class="me-1 bi bi-heart-fill"></i>' +
      updateValues.numCommunities.content;
  });
  document.querySelectorAll('.commentedNodes').forEach((elem) => {
    elem.innerHTML = '' + updateValues.commentedNodes.content;
  });
  document.querySelectorAll('.colorNetworks').forEach((elem) => {
    elem.innerHTML =
      '<i class="me-1 bi bi-share-fill"></i>' +
      updateValues.colorNetworks.content;
  });

  updateValues.colorNetworks.class.forEach((c) => {
    document.querySelectorAll('.colorNetworks').forEach((elem) => {
      elem.classList.add(c);
    });
  });
  updateValues.commentedNodes.class.forEach((c) => {
    document.querySelectorAll('.commentedNodes').forEach((elem) => {
      elem.classList.add(c);
    });
  });

  return true;
};

const showCities = () => {
  // TODO: #24 the showCities function is not working - should be rewritten
  // to be able to highlight/pulse any given category of node...
  const original = {
    fill: {},
    classList: {},
    r: {},
  };

  window.graph.nodes.forEach((node) => {
    node = d3.select(`#${node.node_id}`);
    original.fill[node.node_id] = node.style('fill');
    original.classList[node.node_id] = node.attr('class');
    original.r[node.node_id] = +node.attr('r');

    node.transition()
        .attr('class', null)
        .transition()
        .duration(500)
        .style('fill', (node) =>
          node.category === 'city' ? 'red' : 'gray')
        .transition()
        .delay(1000)
        .duration(500)
        .attr('r', (node) =>
          node.category === 'city' ? original.r[node.node_id] * 3 : 1);
  });
};
