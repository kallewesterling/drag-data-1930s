/* eslint no-unused-vars: ["error", { "vars": "local" }] */
/* global loadNetwork */
/* global setupFilteredElements */
'use strict';

const testForErroneousNode = (node) => {
  return (
    !node.node_id ||
    node.node_id === '' ||
    node.node_id === '-' ||
    node.node_id === '–' ||
    node.node_id === '—'
  );
};

const setupStoreNodes = (nodeList) => {
  const storeNodes = [];
  let counter = 1;
  nodeList.forEach((node) => {
    let prohibitedID = {match: false};
    if (!node.node_id) {
      const newNode = `unidentifiedNode${counter}`;
      counter++;
      console.error(`Unable to find node_id (will set to ${newNode})`, node);
      node.node_id = newNode;
      return false;
    }
    if (node.node_id.charAt(0).match(/[_—–—.]/)) {
      prohibitedID = Object.assign(
          {match: true, node_id: node.node_id},
          node.node_id.charAt(0).match(/[_—–—.]/),
      );
    }
    if (prohibitedID.match) {
      throw new Error(`Found prohibited ID: ${prohibitedID}`);
    }

    if (testForErroneousNode(node)) {
      console.error(node);
      throw new Error('found an erroneous data point:');
    } else {
      if (node.display.toLowerCase().includes('unnamed performer')) {
        node.display = 'Unnamed performer';
      }

      const hasComments =
        node.comments !== undefined && node.comments.length > 0 ? true : false;

      storeNodes.push(Object.assign(
          {
            inGraph: false,
            has_comments: hasComments,
            modularities: {},
            centralities: {},
            degrees: {},
            connected: {},
          },
          node,
      ),
      );
    }
  });
  return storeNodes;
};

const setupStoreEdges = (edgeList) => {
  const storeEdges = [];
  edgeList.forEach((edge) => {
    const newEdge = Object.assign(
        {
          has_comments: edge.comments.length > 0 ? true : false,
          has_general_comments: edge.general_comments.length > 0 ? true : false,
          inGraph: false,
          dates: [],
          range: {start: undefined, end: undefined},
        },
        edge,
    );
    storeEdges.push(newEdge);
  });
  storeEdges.forEach((edge) => {
    if (!edge.found) {
      edge.found = edge.found.filter((found) => {
        return found != null && found != '' && found != '' ? true : false;
      });
      edge.found = [...new Set(edge.found)];
      edge.found.forEach((source) => {
        let date = moment(source);
        if (!date.isValid()) {
          throw new Error('Invalid date found in dataset.');
          // date = dateParser(source);
        } else {
          date = {
            date: date,
            iso: date.format('YYYY-MM-DD'),
          };
        }
        if (date && date.iso !== undefined) {
          edge.dates.push(date.iso);
        } else if (date.iso === undefined) {
          throw new Error(`Unable to interpret date ${source}.`);
        }
      });
    } else {
      edge.dates = edge.found;
    }

    if (edge.dates) {
      edge.dates = [...new Set(edge.dates)].sort();
      edge.range = {
        start: edge.dates[0],
        end: edge.dates[edge.dates.length - 1],
      };
      edge.range['startYear'] = +edge.range.start.substring(0, 4);
      edge.range['endYear'] = +edge.range.end.substring(0, 4);
    } else {
      throw new Error('No ranges set. The graph will not render.');
    }

    const locations = Object.keys(edge.coLocated);
    edge.weights.numLocations = locations.length;
    edge.weights.numDateGroups = 0;
    edge.weights.numDates = [];
    Object.keys(edge.coLocated).map((key) => {
      const dateGroups = edge.coLocated[key];
      dateGroups.forEach((dates) => {
        edge.weights.numDateGroups += 1;
        edge.weights.numDates = [...edge.weights.numDates, ...dates];
      });
    });
    edge.weights.numDates = [...new Set(edge.weights.numDates)].length;

    if (!edge.weights.weight) edge.weights.weight = edge.found.length;
  });
  return storeEdges;
};

const setupWindowStore = (data) => {
  window.store.raw = data;
  let cdHTML = `<p><strong>Visualization last generated</strong>:`;
  cdHTML += `${window.store.raw.createdDate}</p>`;
  d3.select('#createdDate').html(cdHTML);
  window.store.comments = Object.assign({}, data.comments);
  window.store.count = Object.assign({}, data.count);
  window.store.nodes = setupStoreNodes(data.nodes);
  window.store.edges = setupStoreEdges(data.links);
  return true;
}

/**
 * loadNetwork takes no arguments, but loads the entire network, and runs the
 * other appropriate functions at the start of the script.
 * The return value is true if the network file is loaded correctly and all
 * data is set up appropriately.
 * @arg {Array} callback - An array of functions to execute after loadNetwork.
 */
const loadNetwork = (callback = []) => {
  _output('Called', false, loadNetwork);

  const _ = fetchFromStorage('settings', 'loadNetwork');
  let filename = _ ?
    _.datafile.filename :
    window.autoSettings.datafile.filename;

  filename = window.DATA_DIR + '/' + filename;

  include('includes/project.html').then((html) => {
    d3.select('#project-description').html(html);
  });

  enableSettings();
  document.querySelector('#datafileContainer').removeAttribute('style');

  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  // TODO: Use `params.performer` here, for instance, to filter out the data related to that node

  const networkCleanup = (data) => {
    const p = d3.timeParse('%Y-%m-%d %H:%M:%S');
    data.createdDate = p(data.createdDate);
    data.days = +data.days;
    return data;
  };

  d3.json(filename)
      .then((data) => {
        data = networkCleanup(data);
        _output(`File loaded: ${filename}`, false, loadNetwork);
        // for debug purposes (TODO can be removed)
        setupWindowStore(data);

        loadStoreRanges();

        if (_) {
          if (_.edges.startYear < window.store.ranges.years.min) {
            // TODO: set startYear to window.store.ranges.years.min
          }

          if (_.edges.endYear > window.store.ranges.years.max) {
            // TODO: set endYear to window.store.ranges.years.max
          }
        }

        // setup settings box
        if (!window.store.settingsFinished) setupSettingsInterface('root');

        window.store.settingsFinished = true;

        // Link up store edges with nodes, and vice versa
        window.store.edges.forEach((edge) => {
          edge.source = window.store.nodes.find((node) =>
            node.id === edge.source);
          edge.target = window.store.nodes.find((node) =>
            node.id === edge.target);
        });

        window.store.nodes.forEach((node) => {
          // Set up node.connected.edges for each node
          node.connected.edges = window.store.edges.filter((edge) =>
            edge.source.node_id === node.node_id ||
            edge.target.node_id === node.node_id,
          );

          // Set up node.connected.nodes for each node
          node.connected.nodes = [];
          node.connected.nodes.push(
              ...node.connected.edges
                  .map((edge) => edge.source)
                  .filter((cmpNode) => cmpNode.node_id !== node.node_id),
          );
          node.connected.nodes.push(
              ...node.connected.edges
                  .map((edge) => edge.target)
                  .filter((cmpNode) => cmpNode.node_id !== node.node_id),
          );
          node.connected.nodes = [...new Set(node.connected.nodes)];

          // Set up node.sourceRange for each node
          let startYear = 0;
          let endYear = 0;
          node.connected.edges.forEach((edge) => {
            const edgeStartYear = edge.range.start ?
              +edge.range.start.slice(0, 4) :
              undefined;
            const edgeEndYear = edge.range.end ?
              +edge.range.end.slice(0, 4) :
              undefined;

            if (startYear === 0 || edgeStartYear < startYear) {
              startYear = edgeStartYear;
            }

            if (endYear === 0 || edgeEndYear > endYear) {
              endYear = edgeEndYear;
            }
          });

          node.sourceRange = startYear && endYear ?
            d3.range(startYear, endYear, 1) :
            [];
        });

        // set up handlers
        setupKeyHandlers();
        setupSettingInteractivity();
        setupMiscInteractivity();

        // send us on to filter()
        filter();

        // setup preview TODO: This is currently disabled
        // preview(store);

        if (callback) {
          _output('Calling callback functions', false, loadNetwork);
          callback.forEach((c) => c['function'](c.settings));
        }

        return true;
      })
      .then(() => {
        if (params.performer) {
          let node = findNode(params.performer);
          if (!node.inGraph) {
            throw new Error('Node cannot be found with current settings.')
          }
          toggleNode(node, false);
          if (isVisible('#settingsContainer')) {
            toggle('#settingsContainer');
          };
          window.graph.svg
            .transition()
            .duration(1000)
            .call(zoom.transform, d3.zoomIdentity.translate(-window.innerWidth/6, 0).scale(1))
        };
      })
      .catch((err) => {
        console.error(err);
        setupSettingInteractivity();
        setupMiscInteractivity();
        disableSettings(['datafile']);
        toggle('#datafileToggle');
        // make the datafileContainer look like "warning"
        document.querySelector('#datafileContainer')
            .setAttribute('style', 'background-color: #ffc107 !important;');
        let errorMsg = `<p><strong>An error has occurred:</strong></p>`;
        errorMsg += `<p class="m-0 mb-3 small">${err}</p>`;
        errorMsg += `<p class="m-0 small">Sometimes, it helps to <a class="btn btn-sm btn-dark" href="javascript:resetLocalStorage()">reset the locally stored settings</a>.</p>`;
        /*
        errorMsg += `<p class="m-0 small text-muted">${filename}</p>`;
        errorMsg += `<p class="mt-3 mb-0">Change datafile in the dropdown.</p>`;
        */
        error(errorMsg);
        zoom.on('zoom', null);
        return false;
      });

  /*
    let json_files = [
      DATA_DIR + "/co-occurrence-grouped-by-3-days.json",
      DATA_DIR + "/co-occurrence-grouped-by-14-days.json",
      DATA_DIR + "/co-occurrence-grouped-by-31-days.json",
      DATA_DIR + "/co-occurrence-grouped-by-93-days.json",
      DATA_DIR + "/co-occurrence-grouped-by-186-days.json",
      DATA_DIR + "/co-occurrence-grouped-by-365-days.json",
    ];
    Promise.all(json_files.map(file=>d3.json(file))).then(function(files) {
      files.forEach((file, ix)=>{
        datafiles[json_files[ix]] = file;
      });
      processData(datafiles);
    }).catch(function(err) {
      console.error(err);
    })
  */
};

/*
let datafiles = {};
let processData = (datafiles) => {
  let row = document.createElement('tr')
  let col1 = row.appendChild(document.createElement('td'))
  let col2 = row.appendChild(document.createElement('td'))

  col1.appendChild(document.createTextNode(''))
  col2.appendChild(document.createTextNode('nodes'))

  document.querySelector('#data-info thead').append(row);

  let rows = []
  Object.keys(datafiles).forEach(file=>{
    let row = document.createElement('tr')
    let col1 = row.appendChild(document.createElement('td'))
    let col2 = row.appendChild(document.createElement('td'))
    col1.appendChild(document.createTextNode(file))
    col2.appendChild(document.createTextNode(datafiles[file].nodes.length))
    rows.push(row)
 });
  rows.forEach(row=>document.querySelector('#data-info tbody').append(row))
}
*/

/**
 * setupInteractivity takes X argument/s... TODO: Needs docstring
 * @arg {Object} settings - The loaded settings for the visualization
 * The return value is ...
 */
const setupInteractivity = (settings = undefined) => {
  _output('Called', false, setupInteractivity);

  if (!settings) settings = settingsFromDashboard('setupInteractivity');

  nodeElements.on('click', (event, node) => {
    event.stopPropagation();
    if (event.altKey === true &&
        event.metaKey === true &&
        event.shiftKey === true) {
      dropNode(node);
      return true;
    }
    if (event.metaKey === true) {
      if (nodeIsSelected(node)) {
        hide('#nodeEdgeInfo');
        styleGraphElements();
      }
      _output('Starting egoNetwork...', false, setupInteractivity);
      toggleEgoNetwork(node);
      node.fx = null;
      node.fy = null;
      return true;
    }
    toggleNode(node);
    return true;
  });

  const showComment = (node, top = 0, left = 0) => {
    const searchBoxContent = document.querySelector('#searchComment').value;
    if (d3.select('body').classed('searchComment') && searchBoxContent !== '') {
      const comments = [];
      node.comments.forEach((comment) => {
        if (comment.content.toLowerCase().includes(searchBoxContent)) {
          comments.push(comment);
        }
      });
      if (comments.length) {
        quickCommentInfo(comments, top, left);
      }
    }
  };

  nodeElements.on('mouseover', (event, node) => {
    showComment(node, event.clientY, event.clientX);
  });

  textElements.on('mouseover', (event, node) => {
    showComment(node, event.clientY, event.clientX);
  });

  textElements.on('click', (event, node) => {
    event.stopPropagation();
    if (event.altKey === true &&
        event.metaKey === true &&
        event.shiftKey === true) {
      const nodes = [];
      window.graph.nodes.forEach((node)=>{
        if (node !== node) {
          nodes.push(node);
        }
      });
      filter(nodes);
      return true;
    }
    toggleNode(node);
    return true;
  });

  edgeElements.on('mouseover', (event, edge) => {
    if (!window.nodeSelected && !window.edgeSelected) quickEdgeInfo(edge);
  });

  edgeElements.on('click', (event, edge) => {
    event.stopPropagation();
    quickEdgeInfo(edge);
    if (window.toggledCommentedElements) {
      if (edge.has_comments || edge.has_general_comments) {
        window._selectors['popup-info']
            .html(generateCommentHTML(edge))
            .classed('d-none', false)
            .attr('edge-id', edge.edge_id)
            .attr('style',
                `top: ${event.y}px !important; left: ${event.x}px !important;`,
            );
      }
    } else {
      toggleEdge(edge);
    }
  });

  nodeElements.call(
      d3.drag()
          .on('start', (event, node) => {
            window.graph.simulation.restart().alpha(0.15);
            // uncomment to avoid restart except on first drag start event:
            /*
            if (!event.active) {
              window.graph.simulation.alphaTarget(0.3).restart();
            }
            */
            node.fx = node.x;
            node.fy = node.y;
          })
          .on('drag', (event, node) => {
            d3.select(`circle#${node.node_id}`).raise();
            d3.select(`text[data-node=${node.node_id}]`).raise();
            node.fx = event.x;
            node.fy = event.y;
          })
          .on('end', (event, node) => {
            // uncomment to restore alphaTarget to normal value
            /*
            if (!event.active) {
              window.graph.simulation.alphaTarget(0);
            }
            */
            if (settings.nodes.stickyNodes) {
              node.fx = node.x;
              node.fy = node.y;
            } else {
              node.fx = null;
              node.fy = null;
            }
          }),
  );

  textElements.call(
      d3.drag()
          .on('start', (event, node) => {
            window.graph.simulation.restart().alpha(0.15);
            // uncomment avoid restart except on the first drag start event:
            /*
            if (!event.active) {
              window.graph.simulation.alphaTarget(0.3).restart();
            }
            */
            node.fx = node.x;
            node.fy = node.y;
          })
          .on('drag', (event, node) => {
            d3.select(`circle#${node.node_id}`).raise();
            d3.select(`text[data-node=${node.node_id}]`).raise();
            node.fx = event.x;
            node.fy = event.y;
          })
          .on('end', (event, node) => {
            // uncomment to restore alphaTarget to normal value
            /*
            if (!event.active) {
              window.graph.simulation.alphaTarget(0);
            }
            */
            if (settings.nodes.stickyNodes) {
              node.fx = node.x;
              node.fy = node.y;
            } else {
              node.fx = null;
              node.fy = null;
            }
          }),
  );
};

let textElements = window.graph.elements.labels.selectAll('text');
let nodeElements = window.graph.elements.nodes.selectAll('circle');
let edgeElements = window.graph.elements.edges.selectAll('line');
// let personElements = window.graph.elements.nodes.selectAll('path');

/**
 * setupFilteredElements is called after filtering and contains all the d3
 * logic to process the filtered data. It takes no arguments.
 * The function inherits settings from filter as they will not have changed.
 * The return value is always true.
 * @arg {Object} settings - The loaded settings for the visualization
 * @return {boolean} - true
 */
const setupFilteredElements = (settings = undefined) => {
  _output('Called', false, setupFilteredElements);

  nodeElements = window.graph.elements.nodes
      .selectAll('circle')
      .data(window.graph.nodes, (node) => node.node_id)
      .join(
          (enter) =>
            enter
                .append('circle')
                .attr('r', 0)
                .attr('id', (node) => node.node_id)
                .attr('stroke-width', 0.1)
                .attr('class', getNodeClass(node)),
          (update) => update,
          (exit) => exit.transition(750).attr('r', 0).remove(),
      );

  /*
  let personSVG = 'M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 ';
  personSVG += '3 0 1 0 0-6 3 3 0 0 0 0 6z';

  personElements = window.graph.elements.nodes
    .selectAll("path")
    .data(window.graph.nodes, (node) => node.node_id)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("d", personSVG)
          .attr("id", (node) => node.node_id)
          .attr("stroke-width", 0.1),
      (update) => update,
      (exit) => exit.transition(750).attr("r", 0).remove()
    );
  */

  textElements = window.graph.elements.labels
      .selectAll('text')
      .data(window.graph.nodes, (node) => node.node_id)
      .join(
          (enter) =>
            enter
                .append('text')
                .text((node) => node.display)
                .attr('class', (node) => getTextClass(node))
                .attr('style', 'pointer-events: none;')
                .attr('opacity', 0)
                .attr('data-node', (node) => node.node_id),
          (update) => update,
          (exit) => exit.transition(750).attr('opacity', 0).remove(),
      );

  edgeElements = window.graph.elements.edges
      .selectAll('line')
      .data(window.graph.edges, (edge) => edge.edge_id)
      .join(
          (enter) =>
            enter
                .append('line')
                .attr('id', (edge) => edge.edge_id)
                .attr('stroke-opacity', 0.3),
          (update) => update,
          (exit) => exit.transition(750).attr('stroke-opacity', 0).remove(),
      );

  setupInteractivity(settings);
  modifySimulation(settings);

  return true;
};

const loadStoreRanges = () => {
  const outputMessages = ['Called'];

  if (
    window.store.ranges.nodeDegree &&
    window.store.ranges.edgeWidth &&
    window.store.ranges.years.min &&
    window.store.ranges.years.max &&
    window.store.ranges.years.array
  ) {
    outputMessages.push('Ranges already existed');
    _output(outputMessages, false, loadStoreRanges);
    return window.store.ranges;
  }

  window.store.ranges.nodeDegree = d3.extent(window.store.nodes, (node) =>
    node.degrees.degree);

  window.store.ranges.edgeWidth = d3.extent(window.store.edges, (edge) =>
    edge.weights.weight);

  const startYears = window.store.edges.map((d) => d.range.start ?
      +d.range.start.substring(0, 4) :
      1930);

  const endYears = window.store.edges.map((d) => d.range.end ?
      +d.range.end.substring(0, 4) :
      1930);

  window.store.ranges.years = {
    min: d3.min(startYears),
    max: d3.max(endYears),
  };

  window.store.ranges.years.array = d3.range(
      d3.min(startYears),
      d3.max(endYears) + 1);

  // setup the setting nodes
  let options = '';
  window.store.ranges.years.array.forEach((year) => {
    options += `<option value="${year}">${year}</option>`;
  });
  window._elements.startYear.innerHTML = options;
  window._elements.endYear.innerHTML = options;

  // setup the community algorithms
  options = '';
  const algorithms = ['', ...window.store.algorithms];

  algorithms.forEach((algorithm) => {
    if (algorithm === 'jLouvain') {
      options += '<option disabled>Dynamic</option>';
    } else if (!algorithm) {
      options += '<option disabled>Off</option>';
    }

    options += `<option value="${algorithm}">${
      algorithm ? algorithm : 'No community detection'
    }</option>`;

    if (algorithm === 'jLouvain') {
      options += '<option disabled>Entire graph</option>';
    }
  });
  window._elements.communityDetection.innerHTML = options;

  // setup the "weight from" option
  options = '';
  const weightFromOptions = {
    numDates: 'Total number of co-appearing dates',
    numLocations: 'Number of co-appearing venues',
    numDateGroups: 'Number of co-appearing periods',
  };
  Object.entries(weightFromOptions).forEach(([value, text]) => {
    options += `<option value="${value}">${text}</option>`;
  });
  window._elements.weightFrom.innerHTML = options;

  // setup the "weight from" option
  options = '';
  const rFromOptions = {
    'currentDegree': 'Degree in current network',
    'degrees__degree': 'Overall degree',
    '': 'Centrality measures',
    'betweenness_centrality': 'Betweenness',
    'closeness_centrality': 'Closeness',
    'degree_centrality': 'Degree',
    'eigenvector_centrality': 'Eigenvector',
  };
  Object.entries(rFromOptions).forEach(([value, text]) => {
    if (!value) options += `<option disabled>${text}</option>`;
    else options += `<option value="${value}">${text}</option>`;
  });
  window._elements.rFrom.innerHTML = options;

  outputMessages.push('Finished', window.store.ranges);
  _output(outputMessages, false, loadStoreRanges);
  return window.store.ranges;
};
