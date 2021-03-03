const communityDetection = () => {
    loading('Detecting communities using Louvain algorithm.');

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

    // console.log("clusters", graph.clusters);
    document.querySelector('html').classList.add('has-community');
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

    let allHTML = ''
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
    
    document.querySelector("#appendHere").innerHTML = allHTML;
    // document.querySelector("#clusterCounter").innerHTML = `${return_val.length} `;
    
    return return_val;
}