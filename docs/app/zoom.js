"use strict";

const zoom = d3.zoom().extent([[0.25, 7], [window.innerWidth, window.innerHeight]]);

const zoomedActions = () => {
    saveSettings();
    graph.k = d3.event.transform.k;
    graph.x = d3.event.transform.x;
    graph.y = d3.event.transform.y;
    updateInfo();    
    graph.plot.attr("transform", d3.event.transform);
};

zoom.on("zoom", zoomedActions);

// first time, load the settings from the saved data, if they exist!
if (loadSettings('transform'))
    graph.svg.call(zoom.transform, d3.zoomIdentity.translate(loadSettings('transform').x, loadSettings('transform').y).scale(loadSettings('transform').k))
