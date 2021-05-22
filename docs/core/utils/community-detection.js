const communityDetection = (settings = undefined) => {
    if (!settings)
        settings = settingsFromDashboard('setupInteractivity');
    
    // TODO: #37 add dropdown for communityDetection with options [jLouvain, Girvin-Newman, Claiset-Newman-Moore]
    
    let isDetecting = settings.nodes.communityDetection === 'jLouvain' ||
                settings.nodes.communityDetection === 'Clauset-Newman-Moore' ||
                settings.nodes.communityDetection === 'Girvan Newman' ||
                settings.nodes.communityDetection === 'Louvain'

    if (settings.nodes.communityDetection === 'jLouvain') {
        output('Using jLouvain algorithm', false, communityDetection);

        // TODO: I am using JLouvain here. Are there other community detectors out there? Learn more about algorithms...
        // See invention of Louvain method here https://arxiv.org/pdf/0803.0476.pdf
        var allNodes = graph.nodes.map((d) => d.node_id);
        var allEdges = graph.edges.map((d) => {
            return {
                source: d.source.node_id,
                target: d.target.node_id,
                weight: d.weight,
            };
        });

        var community = jLouvain().nodes(allNodes).edges(allEdges);

        let result = community();

        graph.nodes.forEach((node) => {
            node.cluster = result[node.node_id] + 1;
            if (!graph.clusters[node.cluster] || node.r > graph.clusters[node.cluster].r
            ) {
                graph.clusters[node.cluster] = node;
            }
        });
    } else if (settings.nodes.communityDetection === 'Clauset-Newman-Moore') {
        output('Using Clauset-Newman-Moore data from networkx', false, communityDetection);
        graph.nodes.forEach((node) => {
            node.cluster = node.modularities['Clauset-Newman-Moore'];
            if (!graph.clusters[node.cluster] || node.r > graph.clusters[node.cluster].r) {
                graph.clusters[node.cluster] = node;
            }
        });
    } else if (settings.nodes.communityDetection === 'Girvan Newman') {
        output('Using Girvan Newman data from networkx', false, communityDetection);
        graph.nodes.forEach((node) => {
            node.cluster = node.modularities['Girvan Newman'];
            if (!graph.clusters[node.cluster] || node.r > graph.clusters[node.cluster].r) {
                graph.clusters[node.cluster] = node;
            }
        });
    } else if (settings.nodes.communityDetection === 'Louvain') {
        output('Using Louvain data from networkx', false, communityDetection);
        graph.nodes.forEach((node) => {
            node.cluster = node.modularities['Louvain'];
            if (!graph.clusters[node.cluster] || node.r > graph.clusters[node.cluster].r) {
                graph.clusters[node.cluster] = node;
            }
        });
        graph.simulation.restart().alpha(1);
    } else {
        output('Dropping communityDetection', false, communityDetection);
        graph.clusters = {}
        graph.simulation.restart().alpha(1);
    }
    if (isDetecting) {
        // output('Setting has-community class', false, communityDetection);
        document.querySelector('html').classList.add('has-community');
    } else {
        // output('Removing has-community class', false, communityDetection);
        document.querySelector('html').classList.remove('has-community');
    }
}

const getNodeClusterInfo = (returnFullNodes = false) => {
    return_val = [];
    clusterIDs = [...Object.keys(graph.clusters)].map(c=>+c);
    clusterIDs.forEach(id => {
        id = +id;
        let data = {'id': id, 'nodes': graph.nodes.filter(n=>n.cluster === id)};
        return_val.push(data);
    });
    return_val.forEach((data, idx) => {
        return_val[idx]['by-category'] = {
            'city': [],
            'performer': [],
            'venue': []
        };
        data.nodes.forEach((node, nidx)=>{
            if (returnFullNodes) {
                return_val[idx]['nodes'][nidx] = node;
                return_val[idx]['by-category'][node.category].push(node);
            } else {
                return_val[idx]['nodes'][nidx] = node.display;
                return_val[idx]['by-category'][node.category].push(`${node.display}`);
            }
        })
    });

    return_val.forEach((data, idx) => {
        return_val[idx]['by-category']['performer'] = return_val[idx]['by-category']['performer'].sort();
        return_val[idx]['by-category']['venue'] = return_val[idx]['by-category']['venue'].sort();
        return_val[idx]['by-category']['city'] = return_val[idx]['by-category']['city'].sort();
    });

    let has_performers = return_val.map(v=>v['by-category']['performer']).filter(v=>v.length>0).length > 0;
    let has_cities = return_val.map(v=>v['by-category']['city']).filter(v=>v.length>0).length > 0;
    let has_venues = return_val.map(v=>v['by-category']['venue']).filter(v=>v.length>0).length > 0;
    
    let allHTML = ''
    if (has_performers && has_cities && has_venues) {
        return_val.forEach(data => {
            let html = `
            <tr>
                <th scope="row">${data['id']}</th>`;
            
            html += `<td>`;
            html += data['by-category']['performer'].length + data['by-category']['venue'].length + data['by-category']['city'].length;
            html += `</td><td>`;
            if (data['by-category']['performer'].length) {
                data['by-category']['performer'].forEach(node=>{
                    html += `<p class="p-0 m-0 small">${node}</p>`
                });
            } else {
                html += `—`
            }
            html += `</td><td>`;
            data['by-category']['venue'].forEach(node=>{
                html += `<p class="p-0 m-0 small">${node}</p>`
            });
            html += `</td><td>`;
            data['by-category']['city'].forEach(node=>{
                html += `<p class="p-0 m-0 small">${node}</p>`
            });
            html += `</td></tr>`;

            allHTML += html;
        });
    } else if (has_performers) {
        [4, 5].forEach(counter=>{
            document.querySelector(`#nodeTableHeader${counter}`).innerHTML = '';
        });
        return_val.forEach(data => {
            let html = `
            <tr>
                <th scope="row">${data['id']}</th>`;
            
            html += `<td>`;
            html += data['by-category']['performer'].length + data['by-category']['venue'].length + data['by-category']['city'].length;
            html += `</td><td colspan="3">`;
            if (data['by-category']['performer'].length) {
                data['by-category']['performer'].forEach(node=>{
                    html += `<span class="badge bg-secondary" style="margin-right:0.15rem;">${node}</span>`
                });
            } else {
                html += `—`
            }
            html += `</td>`;

            allHTML += html;
        });
    } else {
        [1, 2, 3, 4, 5].forEach(counter=>{
            document.querySelector(`#nodeTableHeader${counter}`).innerHTML = '';
        });
        allHTML = `<tr><td colspan="5"><em>No data to display.</em></td></tr>`
    }
    
    document.querySelector("#appendHere").innerHTML = allHTML;
    // document.querySelector("#clusterCounter").innerHTML = `${return_val.length} `;
    
    return return_val;
}