// TODO: Work on this to make it able to construct tours through the data...

const tour1 = [
    {
        text: "Welcome. We will start by setting the graph to basic settings",
        settings: [
            {
                selector: "#minDegree",
                setTo: 13,
                type: "slider",
            },
        ],
    },
    {
        wait: 4000,
    },
    {
        text: "Next, we will adjust the XYZ, to make visible the connections...",
    },
];

const tour = () => {
    // don't forget to run resetLocalStorage() before this function!
    tour1.forEach((step) => {
        step.settings.forEach((settings) => changeSetting(settings));
        console.log(step.text);
    });
    return true;
};


const explainSettings = (settings, remainHidden=false) => {
    if (!settings)
        settings = settingsFromDashboard();
    
    let story = `<p class="lead">The dataset that you are looking at is affected by some <strong>choices that delimits and makes visible a specific part of the dataset</strong>.</p>`;

    story += '<ol>';

    if (settings.datafile.filename.includes('live')) {
        story += `<li>The data loaded comes from the dataset's <strong>"live data."</strong> That is, it is the most recent data and not a stable "release."</li>`;
    } else if (settings.datafile.filename.includes('v1')) {
        story += `<li>The data loaded comes from the dataset's <strong>frozen version 1</strong>. That is, it is not the most recent data but a stable "release."</li>`;
    }

    if (settings.datafile.filename.includes('no-unnamed')) {
        story += `<li>The data is pre-filtered, which means that the <strong>data does not include performers who are unnamed</strong> in the dataset.</li>`;
    } else {
        story += `<li>The data is unfiltered, which means that the <strong>data includes unnamed performers</strong>, which may distort the data to look like there are more active performers than in actuality.</li>`;
    }

    story += `<li>Each circle (or "node") represents a performer, identified either by their performer name or (in case such a name is missing) the names conferred to them by newspapers. The names have been standardized, but the different spellings and any assumptions about such standardization are readily available in the dataset, which can be seen both via <a href="https://docs.google.com/spreadsheets/d/1UlpFQ9WWA6_6X-RuMJ3vHdIbyqhCZ1VRYgcQYjXprAg/edit" target="_blank">Google Sheets</a> and on <a href="https://kallewesterling.github.io/drag-data-browser/dataset">this website</a>. Clicking on each node, you can read more about the data that "hides" behind the circles.</li>`;

    story += `<li>The network can be described as unipartite, which means that there are only one kind of nodes and connections between them. In contrast, a bipartite network, for instance, would be structured as connections between performers and nightclubs (where no connections existed between performer—performer or nightclub—nightclub).</li>`;
    
    let period = '';
    let period_span = '';
    if (settings.datafile.filename.includes('3-days')) {
        period_span = '3-day';
        period = '3 days';
    } else if (settings.datafile.filename.includes('14-days')) {
        period_span = '14-day';
        period = '14 days';
    } else if (settings.datafile.filename.includes('31-days')) {
        period_span = '31-day';
        period = '1 month, roughly';
    } else if (settings.datafile.filename.includes('93-days')) {
        period_span = '93-day';
        period = '3 months, roughly';
    } else if (settings.datafile.filename.includes('186-days')) {
        period_span = '186-day';
        period = '6 months, roughly';
    } else if (settings.datafile.filename.includes('365-days')) {
        period_span = '365-day';
        period = '1 year, roughly';
    }
    story += `<li>The connections between the performers (or "edges") are structured as chains. The algorithm created by Kalle Westerling is explained in detail <a href="https://kallewesterling.github.io/drag-data-browser/">elsewhere</a> but in short: \
        For each day that performers were at a venue, if the next day was within the range of ±${period}, those days and concomitant performers were all collected together as one “period,” and considered reasonably knowledgeable about each other's existence and likely even considering each other colleagues, perhaps even friends.
        The width of the connection (or the "weight") between two performers signify the number of dates recorded where the two of them appeared in the same venue(s). By hovering over each connection, more information will be displayed about that particular connection.</li>`;

    // console.log(settings.datafile.bipartite);
    story += `<li>The connections between the nodes are always filtered by a range of years. In your case, the settings include links if their connections occurred between ${settings.edges.startYear} and ${settings.edges.endYear}.</li>`;
    
    story += `<li>The connections can also be filtered by a minimum "weight" (minWeight, which means number of connections between two circles, or nodes), which is currently set to ${settings.edges.minWeight} but you can also set what this "minimum describes" (see the next bullet point).</li>`;
        
    story += `<li>The nodes can also be filtered depending on their "degree," which means the number of connections that each node has in the network on the whole. Another way of expressing it is: degree means how many performers the performer is connected to. `;
    story += settings.nodes.minDegree > 0 ? `As of now, the graph shows performers with at least ${settings.nodes.minDegree} connections.` : `As of now, the graph includes all the possible nodes.`;
    story += '</li>';
    
    story += `<li>Another option, which currently is ${settings.nodes.autoClearNodes ? '' : 'not '}affecting the graph is the "auto-clear unconnected nodes" toggle button. `;
    story += settings.nodes.autoClearNodes ? `This means that the unconnected nodes (that is, nodes that with the current setting does not have any connections in the graph) are visible to you in the current graph.` : `If turned on, the button makes sure that all unconnected nodes (that is, nodes that with the current setting does not have any connections in the graph) are hidden from view.`;
    story += '</li>';
    
    story += `<li>Another option, which currently is ${settings.nodes.autoClearUnnamed ? '' : 'not '}affecting the graph is the "auto-clear unnamed nodes" toggle button. `;
    // I need to redo the logic here...
    story += !settings.datafile.filename.includes('no-unnamed') && settings.nodes.autoClearUnnamed ? `This means that the nodes that are unnamed performers are visible to you in the current graph.` : '';
    story += !settings.nodes.autoClearUnnamed ? `If turned on, the button makes sure that the nodes that are unnamed performers are visible to you in the current graph.` : '';
    story += settings.datafile.filename.includes('no-unnamed') && settings.nodes.autoClearUnnamed ? `Since you currently filter out unnamed performers, they would not be visible in this graph anyway.` : ``;
    story += '</li>';
    
    story += `<li>Finally, there is a setting that determines whether and how nodes are clustered together. This is usually called "community detection." `;
    if (!settings.nodes.communityDetection) {
        story += `Currently, it is turned off, which means that no clustering is happening.`
    } else if (settings.nodes.communityDetection === "jLouvain") {
        story += `Currently, it is set to jLouvain, which means that <a href="https://github.com/upphiminn/jLouvain" target="_blank">the JavaScript implementation</a> of <a href="https://en.wikipedia.org/wiki/Louvain_method" target="_blank">the Louvain algorithm</a> is run on the data. This is the only dynamic community detection built into this tool, which means that it is run every time that you change the filtering of the data (since the data changes). Thus, it is computationally heavy (and can slow down your computer) but it is also the only way to detect communities on your dynamic data selection/filtering.`;
    } else if (settings.nodes.communityDetection === "Clauset-Newman-Moore") {
        story += `Currently, it is set to Clauset-Newman-Moore, which means that the NetworkX implementation of <a href="https://arxiv.org/abs/cond-mat/0408187" target="_blank">the Clauset-Newman-Moore algorithm</a> has been applied to the entire dataset, and that is the clustering that you see represented in the graph. Note that the results are not dynamically generated communities but rather the result of the algorithm run on the entire network, which means that your data selection/filtering will only show a small subsection of the result of the algorithm. If you want a dynamic representation, you need to choose jLouvain here.`;
    } else if (settings.nodes.communityDetection === "Girvan Newman") {
        story += `Currently, it is set to Girvan Newman, which means that the NetworkX implementation of <a href="https://en.wikipedia.org/wiki/Girvan%E2%80%93Newman_algorithm" target="_blank">the Girvan Newman algorithm</a> has been applied to the entire dataset, and that is the clustering that you see represented in the graph. Note that the results are not dynamically generated communities but rather the result of the algorithm run on the entire network, which means that your data selection/filtering will only show a small subsection of the result of the algorithm. If you want a dynamic representation, you need to choose jLouvain here.`;
    } else if (settings.nodes.communityDetection === "Louvain") {
        story += `Currently, it is set to Louvain, which means that the NetworkX implementation of <a href="https://en.wikipedia.org/wiki/Louvain_method" target="_blank">the Louvain algorithm</a> has been applied to the entire dataset, and that is the clustering that you see represented in the graph. Note that the results are not dynamically generated communities but rather the result of the algorithm run on the entire network, which means that your data selection/filtering will only show a small subsection of the result of the algorithm. If you want a dynamic representation, you need to choose jLouvain here.`;
    }
    story += `</li>`;

    story += '</ol>';
    
    story += `<p class="lead">There are other settings that affect what the representation of the data looks like:</p>`
    
    story += '<ol>';
    
    story += `<li>You can change what determines the size of the nodes, which is currently set to `;
    if (settings.nodes.rFrom === "currentDegree") {
        story += `its degree in the current network, which means that its relative size is determined from how many connections the performer has to other performers in the current filtered view. It can be considered an interesting measure to see who is more likely to catch whatever is flowing through the current filtered view, such as information.`;
    } else if (settings.nodes.rFrom === "degrees__degree") {
        story += `its degree in the network on the whole, which means that its relative size is determined from how many connections the performer has to other performers in the network altogether (and is not affected by the filtered data view). It can be considered an interesting measure to see who is more likely to catch whatever is flowing through the network, such as information in the case of this network.`;
    } else if (settings.nodes.rFrom === "betweenness_centrality") {
        story += `its <a href="https://en.wikipedia.org/wiki/Betweenness_centrality" target="_blank">betweenness centrality</a> (across the entire network), which means that its relative size is determined from what we most intuitively think of as centrality: the number of paths between all the other nodes that leads through the node. In this network, this means the performer who most other performers would have to go through to be in contact with another performer.`;
    } else if (settings.nodes.rFrom === "closeness_centrality") {
        story += `its <a href="https://en.wikipedia.org/wiki/Closeness_centrality" target="_blank">closeness centrality</a> (across the entire network), which means that its relative size is determined from the sum of the length of the shortest ath between the node and all the other nodes in the network. In this network, it means the sum of the shortest link between any given performer and all the other performers in the network.`;
    } else if (settings.nodes.rFrom === "degree_centrality") {
        story += `its <a href="https://en.wikipedia.org/wiki/Centrality#Degree_centrality" target="_blank">degree centrality</a> (across the entire network), which means that its relative size is determined from number of ties that any given node has. Thus, this choice is the same as choosing the "Overall degree" option. It can be considered an interesting measure to see who is more likely to catch whatever is flowing through the network, such as information in the case of this network.`;
    } else if (settings.nodes.rFrom === "eigenvector_centrality") {
        story += `its <a href="https://en.wikipedia.org/wiki/Eigenvector_centrality" target="_blank">eigenvector centrality</a> (across the entire network), which means that its relative size is determined from the influence that the node has on the network as a whole. For a node, a score is computed where connections to other more connected nodes provides a higher point. This is a measure that allows to see power distribution in the network in a visual way.`;
    }
    story += ` The size is set to a relative scale between ${settings.nodes.minR} and ${settings.nodes.maxR} (these values can not be manually changed) and is then multiplied by the nodeMultiplier value (which is currently set to ${settings.nodes.nodeMultiplier}).`;
    story += `</li>`;

    story += `<li>You can drag around the nodes in the graph in any given scenario (and the other nearby nodes should follow your selected node). `;
    if (settings.nodes.stickyNodes) {
        story += `Because the "stickyNodes" option is selected, the nodes will stick to where you drop them, when you drag them around.`
    } else {
        story += `If you want the nodes to stick, you will have to activated "stickyNodes" by clicking that option. Currently, the nodes are freely floating around.</li>`;
    }
    
    story += `<li>The thickness of the connections between the nodes is currently set to describe total number of `;
    if (settings.edges.weightFrom === 'numDates') {
        story += `co-appearing dates, which means that the weight displays how many dates the two artists appeared together in the given time period (see above).`;
    } else if (settings.edges.weightFrom === 'numLocations') {
        story += `co-appearing venues, which means that the weight displays in how many venues the two artists appeared together in the given time period (see above).`;
    } else if (settings.edges.weightFrom === 'numDateGroups') {
        story += `co-appearing periods, which means that the weight displays in how many time periods (${period}) the two artists appeared together in the given time period (see above).`
    }
    story += ` The size is set to a relative scale between ${settings.edges.maxStroke} and ${settings.edges.minStroke} (these values cannot be manually changed) and is then multiplied by the edgeMultiplier value (which is currently set to ${settings.edges.edgeMultiplier}).`
    story += `</li>`;

    story += `<li>Finally, the graph is affected by different forces that pull and push the nodes towards or away from each other. Those can be changed by clicking on the "Force settings" header in the Settings box. `
    if (settings.force.layoutCharge) {
        story += `One force that pulls nodes together in the current graph is the "charge," which is set to ${getChargePercentage(settings.force.charge)}. `;
    } else {
        story += `One force that pulls nodes together in the current graph is the "charge," which is currently not on. Without this setting on, there is not much point to a network visualization. `;
    }
    
    story += `Another force that pulls together nodes (and cannot be turned off) is the "linkStrength," which determines how much the links between the nodes should pull on the other nodes that they are connected to. Currently, the "linkStrength" setting is set to ${getLinkStrengthPercentage(settings.force.linkStrength)}. `

    if (settings.force.layoutCollide) {
        story += `One force that pushes nodes apart in the current graph is the "collide," which is set to ${settings.force.collide * 100 + '%'}. It makes sure that the nodes do not overlap each other and is best used with a lower "force" setting (see above). `;
    } else {
        story += `One force that could push nodes apart in the current graph is the "collide," which is currently off. It would ensure that nodes do not overlap each other and is best used with a lower "force" setting (see above). `;
    }
    
    story += `The <a href="https://github.com/d3/d3-force#centering" target="_blank">centering force</a> ("center") which is currently turned ${settings.force.layoutCenter ? 'on' : 'off'} ensures that nodes are uniformly pulled in towards the middle of the visualization. `
    story += `The <a href="https://github.com/d3/d3-force#forceX" target="_blank">positioning force along the X-axis</a> ("forceX") which is currently turned ${settings.force.layoutForceX ? 'on' : 'off'} ensures that nodes are uniformly pulled towards a preset value on the X-axis. `
    story += `The <a href="https://github.com/d3/d3-force#forceY" target="_blank">positioning force along the Y-axis</a> ("forceY") which is currently turned ${settings.force.layoutForceY ? 'on' : 'off'} ensures that nodes are uniformly pulled towards a preset value on the Y-axis. `
    
    story += `</li>`

    story += `<li>Finally, by changing the "clustering" setting under the force settings, you can turn off the clustering based on the community detection above, and let the gravitational forces here work regardless of the community detection settings. If you do run the community detection algorithms and want nodes that belong to the same community to cluster together, this option must be turned on. It is currently turned ${settings.force.layoutClustering ? 'on' : 'off'}.</li>`

    story += '</ol>';
    
    d3.select('#explanation').html(story);
    
    if (remainHidden === true) {
        hide('#explanation');
    } else {
        if (!isVisible('#explanation')) show('#explanation');
    }
}