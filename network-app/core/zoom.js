/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

const zoom = d3.zoom().extent([
  [window.autoSettings.zoomMin, window.autoSettings.zoomMin],
  [window.innerWidth, window.innerHeight],
]);
zoom.scaleExtent([window.autoSettings.zoomMin, window.autoSettings.zoomMax]);

const zoomedActions = (event) => {
  saveToStorage(undefined, event);
  window.graph.k = Math.round(event.transform.k * 10) / 10;
  window.graph.x = Math.round(event.transform.x * 10) / 10;
  window.graph.y = Math.round(event.transform.y * 10) / 10;
  updateInfo();
  window.graph.plot.attr('transform', event.transform);
  return true;
};

zoom.on('zoom', zoomedActions);

/**
 * transformToWindow takes no arguments but sets the `transform` attribute
 * on the `plot` property in the `g` object to the height and width of the
 * user's viewport.
 * The return value is true in all cases.
 * @arg {Object} settings
 * @return {boolean} - true
 */
const transformToWindow = (settings) => {
  _output('Called', false, transformToWindow);

  if (!settings) settings = settingsFromDashboard('transformToWindow');

  _output(
      `zoomMin: ${settings.zoomMin}, zoomMax: ${settings.zoomMax}`,
      false,
      transformToWindow,
  );

  window.graph.plot.attr('width', window.innerWidth);
  window.graph.plot.attr('height', window.innerHeight);
  window.graph.svg.attr('viewBox', [
    -window.innerWidth / 2,
    -window.innerHeight / 2,
    window.innerWidth,
    window.innerHeight,
  ]);

  zoom.extent([
    [settings.zoomMin, settings.zoomMax],
    [window.innerWidth, window.innerHeight],
  ]);

  return true;
};

// first time, load the settings from the saved data, if they exist!
const _ = fetchFromStorage('transform', 'zoom.js');
if (_) {
  window.graph.svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(_.x, _.y).scale(_.k),
  );
}

/**
 * zoomToNode ...TODO
 * @arg {undefined|string} node
 * @arg {integer} z
 * @return {Object} node
 */
function zoomToNode(node = undefined, z = 0.5) {
  if (node === undefined) {
    node = window.graph.nodes[
        Math.floor(Math.random() * window.graph.nodes.length - 1)
    ];
  }

  if (typeof node == 'string') {
    node = findNode(node);
  }

  // goTo(node.x, node.y, 4);
  window.graph.svg
      .transition()
      .duration(1000)
      .call(
          zoom.transform,
          d3.zoomIdentity
              .scale(z)
              .translate(-node.x, -node.y));

  highlightNode(node.node_id, 3);

  return node;
}

/**
 * goTo ...TODO
 * @arg {integer} x
 * @arg {integer} y
 * @arg {integer} z
 * @return {boolean} - true
 */
function goTo(x = undefined, y = undefined, z = 1) {
  if (x === undefined || y === undefined) {
    throw new Error('This function requires and x and a y coordinate.');
  }

  window.graph.svg
      .transition()
      .duration(1000)
      .call(zoom.transform, d3.zoomIdentity.scale(z).translate(-x, -y));

  return true;
}


const highlightNode = (nodeID, repeatFor = 5) => {
  // TODO: As pulsing happens, dim all other nodes/labels
  if (!document.querySelector(`circle#${nodeID}`)) {
    if (window.graph.nodes.filter((node) => node.id === nodeID).length === 1) {
      nodeID = window.graph.nodes.filter((node) => node.id === nodeID)[0]
          .node_id;
    } else console.error(`No such circle (circle#${nodeID})...`);
  }

  const pulse = (circle) => {
    let counter = 0;
    (function repeat() {
      counter += 1;
      if (counter > repeatFor) {
        document.querySelector(
            `#communityHighlight${nodeID}`,
        ).style.backgroundColor = '';
        document
            .querySelector(`#communityHighlight${nodeID} a`)
            .classList.add('text-dark');
        document
            .querySelector(`#communityHighlight${nodeID} a`)
            .classList.remove('text-light');

        return undefined;
      }
      circle
          .transition()
          .duration(500)
          .attr('stroke-width', 0)
          .attr('stroke-opacity', 0)
          .transition()
          .duration(500)
          .attr('stroke-width', 0)
          .attr('stroke-opacity', 0.5)
          .transition()
          .duration(1000)
          .attr('stroke-width', (node) => node.r * 100)
          .attr('stroke-opacity', 0)
          .ease(d3.easeSin)
          .on('end', repeat);
    })();
  };

  graph.elements.nodes
      .transition()
      .duration(2000)
      .attr('r', (node) => {
        if (node.node_id === nodeID) {
          return node.r * 2;
        } else {
          return node.r;
        }
      })
      .style('fill', (node) => {
        if (node.node_id === nodeID) {
          return 'red';
        } else {
          return getComputedStyle(
              document.querySelector(`circle#${node.node_id}`),
          ).fill;
        }
      });

  d3.selectAll('circle').classed('highlighted', false);
  [...document.querySelectorAll(`.badge.cluster`)].forEach(
      (elem) => (elem.style.backgroundColor = ''),
  );
  [...document.querySelectorAll(`.badge.cluster a`)].forEach((elem) =>
    elem.classList.add('text-dark'),
  );
  [...document.querySelectorAll(`.badge.cluster a`)].forEach((elem) =>
    elem.classList.remove('text-light'),
  );

  d3.selectAll(`circle#${nodeID}`).classed('highlighted', true);
  document.querySelector(
      `#communityHighlight${nodeID}`,
  ).style.backgroundColor = 'red';
  document
      .querySelector(`#communityHighlight${nodeID} a`)
      .classList.remove('text-dark');
  document
      .querySelector(`#communityHighlight${nodeID} a`)
      .classList.add('text-light');

  pulse(d3.select(`circle#${nodeID}`));
};
