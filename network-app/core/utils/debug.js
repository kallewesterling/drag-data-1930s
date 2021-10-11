/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

const froms = {};

/**
 * Internal function
 * @arg {string} message
 * @arg {boolean} logOutput
 * @arg {string|function|Object} from
 * @arg {function} output_function
 * @arg {boolean} passive
 * @return {undefined}
 */
const _output = (
    message,
    logOutput = false,
    from = undefined,
    output_function = console.log,
    passive = false,
) => {
  if (typeof from === 'function') {
    // you can send a message from a function, and we'll pull out the name
    from = from.name;
  } else if (typeof from === 'object') {
    from = from.constructor.name;
  } else if (typeof from === 'string') {
  } else {
    throw new Error(`From is ${typeof(from)}: cannot interpret.`);
  }

  if (message.slice(0, 6) !== 'Called' && typeof message !== 'object') {
    /*
    window._selectors["loadingContainer"].classed("bg-white", true);
    window._selectors["loadingContainer"].classed("bg-danger", false);
    window._selectors["loadingContainer"].classed("text-white", false);
    window._selectors["loadingMessage"].html(message);
    window._selectors["loading"].classed("d-none", false);
    window.loadingTimeout = setTimeout(() => {
      window._selectors["loading"].classed("d-none", true);
   }, 500);
    */
    d3.select('#loadingDot').attr('title', message);
  }

  if (![...Object.keys(froms)].includes(from)) {
    // assign color
    froms[from] = d3.interpolateRainbow(Object.keys(froms).length * 0.15);
  }
  if (logOutput || window.ERROR_LEVEL > 0) {
    if (typeof message === 'object') {
      console.groupCollapsed(
          `%c${new Date().toLocaleString()} [${from}]`,
          `color: ${passive ? 'lightgray' : froms[from]}`,
      );
      message.forEach((m) => {
        if (typeof m === 'string') {
          output_function(`%c${m}`, 'color: lightgray');
        } else {
          output_function(m);
        }
      });
      console.groupEnd();
    } else {
      console.groupCollapsed(
          `%c${new Date().toLocaleString()} [${from}]`,
          `color: ${passive ? 'lightgray' : froms[from]}`,
      );
      output_function(`%c${message}`, 'color: lightgray');
      console.groupEnd();
    }
  }
};

/**
 * Internal function
 * @arg {string} message
 * @arg {boolean} hide
 * @arg {boolean} clearTimeout
 *
 */
const error = (message, hide = false, clearTimeout = true) => {
  if (hide) {
    d3.select('#loading').classed('d-none', true);
  } else {
    d3.select('#loadingSpinner').classed('d-none', true);
    d3.select('#loadingContainer').classed('bg-white', false);
    d3.select('#loadingContainer').classed('bg-danger', true);
    d3.select('#loadingContainer').classed('text-white', true);
    d3.select('#loadingMessage').html(message);
    d3.select('#loading').classed('d-none', false);
    if (clearTimeout) window.clearTimeout(window.loadingTimeout);
  }
};

/**
 * troubleshoot takes one argument, which specifies whether to try to
 * fix the data present in the current window.graph.
 * @arg {boolean} fix
 * @return {Object} - Object with one property, `droppedNodes`, which
 *                    lists all node_ids that were removed, and two
 *                    objects, `storeNodes` and `graphNodes` that each
 *                    contain two properties, `notInDOM` which counts the
 *                    number of nodes that could not be selected with d3,
 *                    and `inGraph` which contains lists of respective nodes
 *                    with the property `inGraph` set to true.
 */
const troubleshoot = (fix = false) => {
  const returnObject = {
    storeNodes: {
      notInDOM: 0,
      inGraph: window.store.nodes.filter((d) => d.inGraph),
    },
    graphNodes: {
      notInDOM: 0,
      inGraph: window.graph.nodes.filter((d) => d.inGraph),
    },
    droppedNodes: [],
  };
  window.store.nodes.forEach((node) => {
    if (d3.select('#' + node.node_id).node()) {
    } else {
      returnObject.storeNodes.notInDOM += 1;
    }
  });
  window.graph.nodes.forEach((node) => {
    if (d3.select('#' + node.node_id).node()) {
    } else {
      returnObject.graphNodes.notInDOM += 1;
    }
  });

  // If `fix` is set to true, we will check for inconsistency in data...
  if (fix) {
    if (returnObject.storeNodes.inGraph > returnObject.graphNodes.inGraph) {
      returnObject.storeNodes.inGraph.forEach((node) => {
        if (
          returnObject.graphNodes.inGraph.find(
              (d) => d.node_id === node.node_id,
          ) == undefined
        ) {
          returnObject.droppedNodes.push(node.node_id);
          node.inGraph = false;
        }
      });
    }
  }
  // can be used in a debugMessage, like debugMessage(dropped, "Dropped nodes");
  return returnObject;
};

/**
 * debugMessage takes two arguments, a first required message that will appear
 * in the div, and an optional second which defines the header.
 * The return value is always the identification number for the message box's
 * timeout.
 * @arg {string} message
 * @arg {string} header
 * @returns {number} - Identification number for the message box's timeout
 */
/*
const debugMessage = (message, header = "Warning") => {
  if (settingsFromDashboard('debugMessage').debugMessages === false) {
    return false;
  }
  let _id = `toast${window.store.toasterCounter}`;
  let _html = window._selectors["wrapToasters"].html();
  _html += `<div class="toast" role="alert"
                 aria-live="polite" aria-atomic="true" data-delay="5000"
                 id="${_id}">
            <div role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
              <strong class="me-auto">${header}</strong>
              <button type="button" class="ms-2 mb-1 btn-close"
                      data-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">${message}</div>
            </div></div>`;
  window._selectors["wrapToasters"].html(_html);
  // $(`#${_id}`).toast({delay: 5000});
  $(`#${_id}`).toast("show");
  let t = setTimeout(() => {
    d3.selectAll(`#${_id}`).remove();
  }, 6000);
  window.store.toasterCounter += 1;
  return t;
};
*/

const colorNetworks = () => {
  const networkIdentifiers = [
    ...new Set(
        window.store.nodes.map((node) => node.connected.network.network_id),
    ),
  ];
  _output(`${networkIdentifiers.length} networks found`, true, colorNetworks);

  nodeElements.attr('style', (node) => {
    networkID = node.connected.network.network_id;
    return (
      'fill: ' +
      d3.interpolateRainbow((networkID / networkIdentifiers.length) * 5) +
      '!important;'
    );
  });
};
