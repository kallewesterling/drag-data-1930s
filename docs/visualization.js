

const WIDTH = 600;
const HEIGHT = 300;
const MIN_DEGREE = 0;
const STRENGTH = -200;

const MULTIPLIER = {
    'r': {
       'city': 10,
       'standard': 4,
    },
    'text': {
       'city': 10,
       'standard': 4,
    }
}




const size = function(d, type="r") {
    if (type == "r") {
        if (Object.keys(MULTIPLIER['r']).includes(d.category)) {
            return Math.sqrt(d.degree * MULTIPLIER['r'][d.category])
        } else {
            return Math.sqrt(d.degree * MULTIPLIER['r']['standard'])
        }
    } else if (type == "text") {
        if (Object.keys(MULTIPLIER['text']).includes(d.category)) {
            return Math.sqrt(d.degree * MULTIPLIER['text'][d.category])
        } else {
            return Math.sqrt(d.degree * MULTIPLIER['text']['standard'])
        }
    }
}

const clear_text = nodes => {
    var arr = nodes.map(d => d['1000x-degree-centrality'])
    // var max_degree_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    // var max_degree_centrality = nodes.find(x => x['1000x-degree-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map(d => d['1000x-betweenness-centrality'])
    // var max_betweenness_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    // var max_betweenness_centrality = nodes.find(x => x['1000x-betweenness-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map(d => d['1000x-closeness-centrality'])
    // var max_closeness_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    // var max_closeness_centrality = nodes.find(x => x['1000x-closeness-centrality'] === max_eigenvector_centrality);

    var arr = nodes.map(d => d['1000x-eigenvector-centrality'])
    // var max_eigenvector_centrality = arr.reduce(function(a, b) { return Math.max(a, b); });
    // var max_eigenvector_centrality = nodes.find(x => x['1000x-eigenvector-centrality'] === max_eigenvector_centrality);

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

const set_text = function(d, type, rel_nodes=[], node=undefined) {
    str = `<div class="row">`
    if (type == "link") {
        str += `<div class="col-12">`
        if (d.revue_name != '') {
            str += `
            <h4><small class="text-muted">LINK</small> ${d.revue_name}</h4>
            `
        } else {
            str += `
            <h4 class="text-muted"><small>LINK</small> Not a named revue</h4>
            `
        }
        str += `</div>`
        str += `<div class="col-12">`
        if (d.found.length) {
            str += `<h5>Sources</h5>`
            d.found.forEach(function(source) {
                str += `<p>${source}</p>`
            });
        }
        str += `</div>`
    } else if (type == "node") {

        collected = []
        clubs = []
        cities = []
        performers = []
        rel_nodes.forEach((rel_node_index) => {
            node
                .attr("pseud", function(node_d) {
                    if (rel_nodes.includes(node_d.index) && ! collected.includes(node_d.index) && d.index != node_d.index) {
                        if (node_d.category == 'club') {
                            clubs.push(node_d);
                        } else if (node_d.category == 'city') {
                            cities.push(node_d);
                        } else if (node_d.category == 'performer') {
                            performers.push(node_d);
                        }
                        collected.push(node_d.index);
                    }
                });
        })

        str += `<div class="col-12">`
        if (d.category == "city") {
            str += `
                <h4><small class="text-muted">CITY</small> ${d.id}</h4>
            `
        } else if (d.category == "club") {
            str += `
                <h4><small class="text-muted">CLUB</small> ${d.id}</h4>
            `
        } else if (d.category == "performer") {
            str += `
                <h4><small class="text-muted">PERFORMER</small> ${d.id}</h4>
            `;
        } else {
            str += `<h4>&nbsp;</h4>`
        }
        str += `</div>`

        str += `<div class="col-6">`
        str += `<h5>Related nodes</h5>`

        if (cities.length) {
            str += `<h6 class="border-bottom">Cities (${cities.length})</h6>`
            cities.forEach((d) => {
                str += `<p class="">${d.id}</p>`
            })
        }
        if (clubs.length) {
            str += `<h6 class="border-bottom">Clubs (${clubs.length})</h6>`
            clubs.forEach((d) => {
                str += `<p class="">${d.display}</p>`
            })
        }
        if (performers.length) {
            str += `<h6 class="border-bottom">Performers (${performers.length})</h6>`
            performers.forEach((d) => {
                str += `<p class="">${d.id}</p>`
            })
        }
        str += `</div>`
        str += `<div class="col-6">`
        str += `
            <h5>Measures</h5>
            <p><strong>In-degree</strong>: ${d.indegree}</p>
            <p><strong>Out-degree</strong>: ${d.outdegree}</p>

            <h5>Centrality measures</h5>
            <p><strong>Eigenvector</strong>: ${d['1000x-eigenvector-centrality']}</p>
            <p><strong>Degree</strong>: ${d['1000x-degree-centrality']}</p>
            <p><strong>Closeness</strong>: ${d['1000x-closeness-centrality']}</p>
            <p><strong>Betweenness</strong>: ${d['1000x-betweenness-centrality']}</p>`;
        str += `</div>`
    }
    str += `</div>`
    d3.select("#info").html(str)
}

const filter_nodes = function(nodes) {
    new_array = []
    nodes.forEach(function(n) {
        // if ( n.category == "city" ) {
        //     new_array.push(n);
        // }
        if ( n.degree > MIN_DEGREE ) {
            new_array.push(n);
        }
    });
    return new_array;
}

const filter_links = (links, nodes) => {
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

const setup_simulation = (nodes, links) => {
        return d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(STRENGTH))
            //.force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2));
            .force("x", d3.forceX())
            .force("y", d3.forceY());
    }

const setup_zoomable_g = nodes => {
    const zoomed = () => {
        g.attr("transform", d3.event.transform);
    }

    const zoom = d3.zoom()
        .scaleExtent([0, 3])
        .on("zoom", zoomed);

    const svg = d3.select("#svg").append("svg")
        .attr("viewBox", [-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT])
        .call(zoom)
        .on("click", function() { clear_text(nodes); } )
        .on("mouseover", clear_text(nodes) );

    const g = svg
        .append("g");

    return g
}

const get_rel_nodes = function(d_index, link, selected="link selected", deselected="link deselected") {
        const rel_nodes = [d_index]
        link
            .attr("class", function (link_d) {
                if (link_d.source.index == d_index || link_d.target.index == d_index) {
                    if (link_d.source.index == d_index) {
                        if (rel_nodes.includes(link_d.target.index) != true) {
                            rel_nodes.push(link_d.target.index);
                        }
                    } else if (link_d.target.index == d_index) {
                        if (rel_nodes.includes(link_d.source.index) != true) {
                            rel_nodes.push(link_d.source.index);
                        }
                    }
                    return selected;
                } else {
                    return deselected;
                }
            })
        return rel_nodes;
    }

const set_line_class = function(d) { if (d.revue_name != "") { return "link revue"; } else { return "link no-revue"; } };


d3.json('drag-data-for-1930s.json').then(function(data) {
    var nodelist = data.nodes.sort((a, b) => (a.category > b.category) ? 1 : -1)

    const nodes = filter_nodes(nodelist.map(d => Object.create(d)));
    const links = filter_links(data.links.map(d => Object.create(d)), nodes);

    const simulation = setup_simulation(nodes, links)

    const g = setup_zoomable_g(nodes)


    const link = g.append("g").attr("id", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", function(d) { return set_line_class(d) } )
        .attr("stroke-width", d => Math.sqrt(d.weight / 2))
        .on("click", function(d) {
            if (d3.select(this).attr('data-clicked') == 'true') {
                d3.select(this).attr('data-clicked', 'false');
                link.attr("class", function(d) { return set_line_class(d) });
                node.attr("class", function(node_d) { return "node " + node_d.category; });
            } else {
                d3.select(this).attr('data-clicked', 'true');
                set_text(d, 'link');
                link.attr("class", function(d_inner) {
                    if (d.index == d_inner.index ) {
                        return "link selected";
                    } else {
                        return "link deselected";
                    }
                });
                node.attr("class", function(d_inner) {
                    if (d.source.index == d_inner.index) {
                        return `node ${d_inner.category} selected`;
                    } else if (d.target.index == d_inner.index) {
                        return `node ${d_inner.category} selected`;
                    } else {
                        return `node ${d_inner.category} deselected`;
                    }
                });
            }
            d3.event.stopPropagation();
        });


    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .append("circle")
        .attr("r", d => size(d) )
        .attr("class", d => "node " + d.category)
        .on("click", function(d) {
            if (d3.select(this).attr('data-clicked') == 'true') {
                d3.select(this).attr('data-clicked', 'false');
                link.attr("class", function(link_d) { return set_line_class(link_d); });
                node.attr("class", function(node_d) { return "node " + node_d.category; });
            } else {
                d3.select(this).attr('data-clicked', 'true');
                rel_nodes = get_rel_nodes(d.index, link);
                rel_nodes.forEach((rel_node_index) => {
                    node
                        .attr("class", function(node_d) {
                            if (rel_nodes.includes(node_d.index)) {
                                return `node ${node_d.category} selected`;
                            } else {
                                return `node ${node_d.category} deselected`;
                            }
                        });
                });
                set_text(d, 'node', rel_nodes, node);
            }
            d3.event.stopPropagation();
        })
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
        .text( function(d) {
            if (d.category == 'club') {
                return d.display;
            } else {
                return d.id;
            }
        } )
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

    return g.node();


});
