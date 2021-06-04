"use strict";

const zoom = d3.zoom().extent([[window.autoSettings.zoomMin, window.autoSettings.zoomMin], [window.innerWidth, window.innerHeight]]);
zoom.scaleExtent([window.autoSettings.zoomMin, window.autoSettings.zoomMax]);

const zoomedActions = (event) => {
    saveToStorage(undefined, event);
    graph.k = Math.round(event.transform.k * 10) / 10;
    graph.x = Math.round(event.transform.x * 10) / 10;
    graph.y = Math.round(event.transform.y * 10) / 10;
    updateInfo();
    graph.plot.attr("transform", event.transform);
    return true;
};

zoom.on("zoom", zoomedActions);


/**
 * transformToWindow takes no arguments but sets the `transform` attribute on the `plot` property in the `g` object to the height and width of the user's viewport.
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const transformToWindow = (settings) => {
    _output('Called', false, transformToWindow);
    
    if (!settings)
        settings = settingsFromDashboard('transformToWindow');

    _output(`zoomMin: ${settings.zoomMin}, zoomMax: ${settings.zoomMax}`, false, transformToWindow);
    
    graph.plot.attr("width", window.innerWidth);
    graph.plot.attr("height", window.innerHeight);
    graph.svg.attr("viewBox", [-window.innerWidth/2, -window.innerHeight/2, window.innerWidth, window.innerHeight]);
    
    zoom.extent([[settings.zoomMin, settings.zoomMax], [window.innerWidth, window.innerHeight]]);
    
    return true;
};


// first time, load the settings from the saved data, if they exist!
let _ = fetchFromStorage("transform", "zoom.js")
if (_)
    graph.svg.call(zoom.transform, d3.zoomIdentity.translate(_.x, _.y).scale(_.k))


function goTo(x=undefined, y=undefined) {
    // TODO: Fix this function... it should zoom into the coordinates provided above... For now, emergency function below `highlightNode`
    if (!x || !y) {
        let node = graph.nodes[Math.floor(Math.random() * graph.nodes.length-1)]
        let x = node.x
        let y = node.y
    }
    let width = graph.plot.attr("width");
    let height = graph.plot.attr("height");

    /*
    graph.svg.transition().duration(1000).call(
        zoom.transform,
        d3.zoomIdentity.translate(window.innerWidth / 2, window.innerHeight / 2).scale(5).translate(-x, -y)
    );
    */
    graph.svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity.translate(_.x, _.y).scale(_.k))

    graph.svg.transition().duration(1000).call(
        zoom.transform,
        d3.zoomIdentity.translate(-x, -y).scale(5)
    );
}
// graph.svg.on('mouseover', (evt)=>{console.log(evt.clientX, evt.clientY)})


const highlightNode = (node_id) => {
    console.log('highlightNode called');

    if (!document.querySelector(`circle#${node_id}`))
        if (graph.nodes.filter(node=>node.id === node_id).length === 1)
            node_id = graph.nodes.filter(node=>node.id === node_id)[0].node_id
        else
            console.error(`No such circle (circle#${node_id})...`)

    const pulse = (circle) => {
        let counter = 0;
        (function repeat() {
            counter += 1;
            if (counter > 5) {
                document.querySelector(`#communityHighlight${node_id}`).style.backgroundColor = '';
                document.querySelector(`#communityHighlight${node_id} a`).classList.add('text-dark')
                document.querySelector(`#communityHighlight${node_id} a`).classList.remove('text-light')
            
                return undefined;
            }
            circle
                .transition()
                .duration(500)
                .attr("stroke-width", 0)
                .attr('stroke-opacity', 0)
                .transition()
                .duration(500)
                .attr("stroke-width", 0)
                .attr('stroke-opacity', 0.5)
                .transition()
                .duration(1000)
                .attr("stroke-width", node => node.r * 100)
                .attr('stroke-opacity', 0)
                .ease(d3.easeSin)
                .on("end", repeat);
        })();
    }
    
    nodeElements
        .transition()
        .duration(2000)
        .attr('r', (node)=> {
            if (node.node_id === node_id) {
                return node.r * 2;
            } else {
                return node.r
            }
        })
        .style('fill', (node)=> {
            if (node.node_id === node_id) {
                return 'red';
            } else {
                return getComputedStyle(document.querySelector(`circle#${node.node_id}`)).fill;
            }
        })

    d3.selectAll('circle').classed('highlighted', false);
    [...document.querySelectorAll(`.badge.cluster`)].forEach(elem=>elem.style.backgroundColor = '');
    [...document.querySelectorAll(`.badge.cluster a`)].forEach(elem=>elem.classList.add('text-dark'));
    [...document.querySelectorAll(`.badge.cluster a`)].forEach(elem=>elem.classList.remove('text-light'));

    d3.selectAll(`circle#${node_id}`).classed('highlighted', true);
    document.querySelector(`#communityHighlight${node_id}`).style.backgroundColor = 'red';
    document.querySelector(`#communityHighlight${node_id} a`).classList.remove('text-dark')
    document.querySelector(`#communityHighlight${node_id} a`).classList.add('text-light')

    pulse(d3.select(`circle#${node_id}`));
}