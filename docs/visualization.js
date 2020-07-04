

const width = 600
const height = 300



size = function(d, type="r") {
    if (type == "r") {
        if (d.category == "city") {
            return 10
        } else {
            return Math.sqrt(d.degree * 2)
        }
    } else if (type == "text") {
        if (d.category == "city") {
            return 6
        } else {
            return Math.sqrt(d.degree * 2 )
        }
    }
}
const clear_text = function(nodes) {
    var arr = nodes.map(d => d['1000x-degree-centrality'])
    var max_degree_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    var max_degree_centrality = nodes.find(x => x['1000x-degree-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map(d => d['1000x-betweenness-centrality'])
    var max_betweenness_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    var max_betweenness_centrality = nodes.find(x => x['1000x-betweenness-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map(d => d['1000x-closeness-centrality'])
    var max_closeness_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    var max_closeness_centrality = nodes.find(x => x['1000x-closeness-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map(d => d['1000x-eigenvector-centrality'])
    var max_eigenvector_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    var max_eigenvector_centrality = nodes.find(x => x['1000x-eigenvector-centrality'] === max_eigenvector_centrality);

    str = `<table class="table table-striped table-sm">
            <thead>
            <tr>
            <th scope="col"></th>
            <th scope="col">Eigenvector</td>
            <th scope="col">Degree</td>
            <th scope="col">Closeness</td>
            <th scope="col">Betweenness</td>
            </tr>`
    nodes.forEach(function(n) {
        str += `<tr>
                <th class="small pr-3" scope="row">${n.id}</th>
                <td class="small">${Number((n['1000x-eigenvector-centrality']).toFixed(2))}</td>
                <td class="small">${Number((n['1000x-degree-centrality']).toFixed(2))}</td>
                <td class="small">${Number((n['1000x-closeness-centrality']).toFixed(2))}</td>
                <td class="small">${Number((n['1000x-betweenness-centrality']).toFixed(2))}</td>
                </tr>`
    })
    str += '</table>'
    $('.table').DataTable();
    d3.select("#info").html(str)
}


const set_text = function(d, type) {
    str = ""
    if (type == "link") {
        // this_line = d3.selectAll("line")._groups[0][d.index];

        // d3.selectAll("line")[d].attr("opacity", "0.1")
        // d3.select(this_line).attr('opacity', '1.0')

        if (d.revue_name != '') {
            str += '<h4><small class="text-muted">LINK</small> ' + d.revue_name + '</h4>'
        } else {
            str += '<h4 class="text-muted"><small>LINK</small> Not a named revue</h4>'
        }
        d.found.forEach(function(source) {
            str += "<p>" + source + "</p>"
        });
    } else if (type == "node") {
        if (d.category == "city") {
            str += '<h4><small class="text-muted">CITY</small> ' + d.id + '</h4>'
        } else if (d.category == "club") {
            str += '<h4><small class="text-muted">CLUB</small> ' + d.id + '</h4>'
        } else if (d.category == "performer") {
            str += '<h4><small class="text-muted">PERFORMER</small> ' + d.id + '</h4>'
        }
        str += "<p><strong>In-degree</strong>: " + d.indegree + "</p>"
        str += "<p><strong>Out-degree</strong>: " + d.outdegree + "</p>"
        str += "<h5>Centrality measures</h5>"
        str += "<p><strong>Eigenvector</strong>: " + d['1000x-eigenvector-centrality'] + "</p>"
        str += "<p><strong>Degree</strong>: " + d['1000x-degree-centrality'] + "</p>"
        str += "<p><strong>Closeness</strong>: " + d['1000x-closeness-centrality'] + "</p>"
        str += "<p><strong>Betweenness</strong>: " + d['1000x-betweenness-centrality'] + "</p>"
    }
    d3.select("#info").html(str)
}


const filter_nodes = function(nodes) {
    new_array = []
    nodes.forEach(function(n) {
        if ( n.category == "city" || n.degree > 1 ) {
            new_array.push(n);
        }
    });
    return new_array;
}

const filter_links = function(links, nodes) {
    all_ids = nodes.map(d => d.id)
    new_array = []
    links.forEach(function(l) {
        if (all_ids.includes(l.source) && all_ids.includes(l.target)) {
            new_array.push(l);
        }
    })
    return new_array;
}

const drag = simulation => {
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

d3.json('drag-data-for-1930s.json').then(function(data) {


    reset = function(nodes) {
        svg.transition()
            .duration(750)
            .call(
                zoom.transform,
                d3.zoomIdentity,
                d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
            );
        clear_text(nodes);
    }

    zoomed = function() {
        g.attr("transform", d3.event.transform);
    }

    const zoom = d3.zoom()
        .scaleExtent([0, 3])
        .on("zoom", zoomed);


    

    const nodes = filter_nodes(data.nodes.map(d => Object.create(d)));
    const links = filter_links(data.links.map(d => Object.create(d)), nodes);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        //.force("center", d3.forceCenter(width / 2, height / 2));
        .force("x", d3.forceX())
        .force("y", d3.forceY());


    const svg = d3.select("#svg").append("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .call(zoom)
        .on("click", function() { clear_text(nodes); } )
        .on("mouseover", clear_text(nodes) );


    const g = svg
        .append("g");


    const link = g.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", function(d) { if (d.revue_name != "") { return "link revue"; } else { return "link no-revue"; } }) //d => "node " + d.category
        .attr("stroke-width", d => Math.sqrt(d.weight / 2))
        .on("mouseover", function(d) {
            set_text(d, 'link');
            // d3.select(d).select('line').attr('opacity', 1.0)
        } )

    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .append("circle")
        .attr("r", d => size(d) )
        .attr("class", d => "node " + d.category)
        .on("mouseover", function(d) {
            set_text(d, 'node');
            // d3.select(d).select('line').attr('opacity', 1.0)
        } )
        .call(drag(simulation));

    const text = g.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")

    const textLabels = text
        .attr("x", d => d.x )
        .attr("y", d => d.y )
        .attr("font-size", d => size(d, type="text") )
        .attr("class", "text-label")
        .text( d => d.id )
        .call(drag(simulation));

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        textLabels
            .attr("x", d => d.x )
            .attr("y", d => d.y );

    });

            // invalidation.then(() => simulation.stop());

            return svg.node();


});
