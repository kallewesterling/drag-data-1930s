"use strict";

// TODO: Continue clean-up here... + add docstring.
let zoomed = () => {
    graph.k = Math.round(d3.event.transform.k * 10) / 10;
    saveSettings();
    let windowWidth = window.innerWidth,
        windowHeight = window.innerHeight;
    let xValue = windowWidth / 2 + d3.event.transform.x;
    let yValue = windowHeight / 2 + d3.event.transform.y;
    graph.plot.attr(
        "transform",
        `translate(${xValue}, ${yValue}) scale(${d3.event.transform.k})`
    );
    updateInfo();
};

const zoom = d3.zoom().scaleExtent([0.25, 7]).on("zoom", zoomed);
