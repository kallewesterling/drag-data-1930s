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
