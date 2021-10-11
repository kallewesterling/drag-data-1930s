/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

const setupJLouvain = (
    caller = undefined,
    nodes = window.graph.nodes,
    edges = window.graph.edges,
) => {
  // TODO:
  // I am using JLouvain here. Are there other community detectors out there?
  // Learn more about algorithms = See invention of Louvain method here:
  // https://arxiv.org/pdf/0803.0476.pdf

  _output(
      `Regenerating jLouvain communities in real-time${
      caller ? ' from ' + caller : ''
      }`,
      false,
      'setupJLouvain',
  );

  const allNodes = nodes.map((d) => d.node_id);
  const allEdges = edges.map((d) => {
    return {
      source: d.source.node_id,
      target: d.target.node_id,
      weight: d.weight,
    };
  });

  const community = jLouvain().nodes(allNodes).edges(allEdges);

  const result = community();

  nodes.forEach((node) => {
    node.modularities['jLouvain'] = result[node.node_id] + 1;
  });

  _output(
      `Successfully created ${
        [...new Set(nodes.map((node) => node.modularities['jLouvain']))]
            .length
      } jLouvain communities.`,
      false,
      setupJLouvain,
  );
};

const communityDetection = (settings = undefined) => {
  if (!settings) settings = settingsFromDashboard('setupInteractivity');

  let isDetecting = false;

  setupJLouvain('communityDetection');

  const algorithmCounter = {};
  window.store.algorithms.forEach((algorithm) => {
    algorithmCounter[algorithm] = [
      ...new Set(window.graph.nodes.map(
          (node) => node.modularities[algorithm]),
      ),
    ].length;
    if (settings.nodes.communityDetection === algorithm) isDetecting = true;
  });
  algorithmCounter;

  const hasDetected = document
      .querySelector('html')
      .classList.contains('has-community');
  const algorithm = settings.nodes.communityDetection;

  if (isDetecting && hasDetected) {
    // we want to reset window.graph.clusters
    window.graph.clusters = {};
  }

  if (algorithm) {
    if (algorithm !== 'jLouvain') {
      _output(
          `Using ${algorithm} data from networkx`,
          false,
          communityDetection,
      );
    } else {
      _output(
          `Using ${algorithm} data (dynamically)`,
          false,
          communityDetection,
      );
    }

    window.graph.nodes.forEach((node) => {
      node.cluster = node.modularities[algorithm];
      if (
        !window.graph.clusters[node.cluster] ||
        node.r > window.graph.clusters[node.cluster].r
      ) {
        window.graph.clusters[node.cluster] = node;
      }
    });
    window.graph.simulation.restart().alpha(1);
  } else {
    _output('Dropping communityDetection', false, communityDetection);
    window.graph.clusters = {};
    window.graph.simulation.restart().alpha(1);
  }

  if (isDetecting) {
    // _output('Setting has-community class', false, communityDetection);
    document.querySelector('html').classList.add('has-community');
  } else {
    // _output('Removing has-community class', false, communityDetection);
    document.querySelector('html').classList.remove('has-community');
  }

  let message = '';

  if (isDetecting || hasDetected) {
    if (!isDetecting) {
      message = `The number that would sit next to this heart would show how
                 many number of communities have been identified in the graph
                 you are currently seeing. Since you have not chosen to detect
                 communities in the Settings box, the heart displays no
                 community information.`;
    } else {
      message = `The number that you see here shows how many number of
                 communities have been identified in the graph you are currently
                 seeing. The algorithm used is the ${algorithm} clustering
                 algorithm, which you can read more about under the "Rationale".
                 Click the button furthest to the left in the menubar if you are
                 more interested.`;
    }

    message += '<br />';

    window.store.algorithms.forEach((algorithm) => {
      message += `<br />${algorithm}: ${algorithmCounter[algorithm]}`;
    });

    document.querySelectorAll('.numCommunities').forEach((elem) => {
      elem.dataset.bsContent = message;
    });
  }

  window.graph.clusterColors = {};
  window.graph.communityScale = d3
      .scaleLinear()
      .range([0, 1])
      .domain(d3.extent(nodeElements.data().map((node) => node.cluster)));
  window.graph.nodes.forEach((node) => {
    window.graph.clusterColors[node.cluster] = d3.interpolateRainbow(
        window.graph.communityScale(node.cluster),
    );
  });
};

const getNodeClusterInfo = (returnFullNodes = false) => {
  const returnValue = [];
  const clusterIDs = [...Object.keys(window.graph.clusters)].map((c) => +c);
  clusterIDs.forEach((id) => {
    id = +id;
    const data = {
      id: id,
      nodes: window.graph.nodes.filter((node) => node.cluster === id),
    };
    returnValue.push(data);
  });
  returnValue.forEach((data, idx) => {
    returnValue[idx]['by-category'] = {
      city: [],
      performer: [],
      venue: [],
    };
    data.nodes.forEach((node, nidx) => {
      if (returnFullNodes) {
        returnValue[idx]['nodes'][nidx] = node;
        returnValue[idx]['by-category'][node.category].push(node);
      } else {
        returnValue[idx]['nodes'][nidx] = node.display;
        returnValue[idx]['by-category'][node.category].push(
            `${node.display}`,
        );
      }
    });
  });

  returnValue.forEach((data, idx) => {
    returnValue[idx]['by-category']['performer'] =
      returnValue[idx]['by-category']['performer'].sort();
    returnValue[idx]['by-category']['venue'] =
      returnValue[idx]['by-category']['venue'].sort();
    returnValue[idx]['by-category']['city'] =
      returnValue[idx]['by-category']['city'].sort();
  });

  const hasPerformers =
    returnValue
        .map((v) => v['by-category']['performer'])
        .filter((v) => v.length > 0).length > 0;
  const hasCities =
    returnValue
        .map((v) => v['by-category']['city'])
        .filter((v) => v.length > 0).length > 0;
  const hasVenues =
    returnValue
        .map((v) => v['by-category']['venue'])
        .filter((v) => v.length > 0).length > 0;

  let allHTML = '';
  if (hasPerformers && hasCities && hasVenues) {
    returnValue.forEach((data) => {
      let html = `
      <tr>
        <th scope="row">${data['id']}</th>`;

      html += `<td>`;
      html +=
        data['by-category']['performer'].length +
        data['by-category']['venue'].length +
        data['by-category']['city'].length;
      html += `</td><td>`;
      if (data['by-category']['performer'].length) {
        data['by-category']['performer'].forEach((node) => {
          html += `<p class="p-0 m-0 small">${node}</p>`;
        });
      } else {
        html += `—`;
      }
      html += `</td><td>`;
      data['by-category']['venue'].forEach((node) => {
        html += `<p class="p-0 m-0 small">${node}</p>`;
      });
      html += `</td><td>`;
      data['by-category']['city'].forEach((node) => {
        html += `<p class="p-0 m-0 small">${node}</p>`;
      });
      html += `</td></tr>`;

      allHTML += html;
    });
  } else if (hasPerformers) {
    [4, 5].forEach((counter) => {
      document.querySelector(`#nodeTableHeader${counter}`).innerHTML = '';
    });
    returnValue.forEach((data) => {
      let html = `
      <tr>
        <th scope="row"><span class="badge me-1" style="background-color: ${
  window.graph.clusterColors[data['id']]
}">${data['id']}</span></th>`;

      html += `<td>`;
      html +=
        data['by-category']['performer'].length +
        data['by-category']['venue'].length +
        data['by-category']['city'].length;
      html += `</td><td colspan="3">`;
      if (data['by-category']['performer'].length) {
        data['by-category']['performer'].forEach((node) => {
          let nodeElement = nodeElements
              .data()
              .filter((cmpNode) => cmpNode.id === node);
          if (nodeElement.length === 1) nodeElement = nodeElement[0];
          else console.error('Found too many nodes with ID!');
          html += `<span class="badge me-1 cluster"
                         id="communityHighlight${nodeElement.node_id}">
                    <a class="text-decoration-none"
                      href="javascript:highlightNode('${nodeElement.node_id}')">
                      ${node}
                    </a>
                  </span>`;
        });
      } else {
        html += `—`;
      }
      html += `</td>`;

      allHTML += html;
    });
  } else {
    [1, 2, 3, 4, 5].forEach((counter) => {
      document.querySelector(`#nodeTableHeader${counter}`).innerHTML = '';
    });
    allHTML = `<tr><td colspan="5"><em>No data to display.</em></td></tr>`;
  }

  document.querySelector('#appendHere').innerHTML = allHTML;
  /*
  document.querySelector("#clusterCounter")
      .innerHTML = `${returnValue.length} `;
  */

  return returnValue;
};

/*
const setupLegend = () => {
  legend = document.querySelector('#legend');
  legend.innerHTML = '';
  Object.entries(window.graph.clusterColors).forEach(([cluster, color]) => {
    div = document.createElement('div')
    badge = document.createElement('span')
    badge.classList.add('badge')
    badge.classList.add('me-1')
    badge.style['background-color'] = color
    badge.innerHTML = '&nbsp';
    div.appendChild(badge)
    txt = document.createTextNode(cluster)
    div.appendChild(txt)
    legend.appendChild(div)
  });
  // d3.select('#legend').html(`${htmlText}`);
}
*/
