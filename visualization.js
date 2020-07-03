
const width = 600
const height = 300


clear_text = function() {
    d3.select("#info").html('')
}

set_text = function(d) {
    str = ""
    if (d.revue_name != '') {
        str += "<h4>" + d.revue_name + "</h4>"
    } else {
        str += "<h4>&nbsp;</h4>"
    }
    d.found.forEach(function(source) {
        str += "<p>" + source + "</p>"
    });
    d3.select("#info").html(str)
}


filter_nodes = function(nodes) {
    new_array = []
    nodes.forEach(function(n) {
        if ( n.category == "city" || n.degree > 1 ) {
            new_array.push(n);
        }
    });
    return new_array;
}

filter_links = function(links, nodes) {
    all_ids = nodes.map(d => d.id)
    new_array = []
    links.forEach(function(l) {
        if (all_ids.includes(l.source) && all_ids.includes(l.target)) {
            new_array.push(l);
        }
    })
    return new_array;
}

drag = simulation => {
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


    reset = function() {
        svg.transition()
            .duration(750)
            .call(
                zoom.transform,
                d3.zoomIdentity,
                d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
            );
    }

    zoomed = function() {
        g.attr("transform", d3.event.transform);
    }

    const zoom = d3.zoom()
        .scaleExtent([0, 3])
        .on("zoom", zoomed);


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
        .on("click", reset)
        .on("mouseover", clear_text() );


    const g = svg
        .append("g");


    const link = g.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", function(d) { if (d.revue_name != "") { return "link revue"; } else { return "link no-revue"; } }) //d => "node " + d.category
        .attr("stroke-width", d => Math.sqrt(d.weight / 2))
        .on("mouseover", d => set_text(d) )

    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .append("circle")
        .attr("r", d => size(d) )
        .attr("class", d => "node " + d.category)
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
