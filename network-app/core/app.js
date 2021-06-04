"use strict";

window.ERROR_LEVEL = 1;

// Immediately invoked function to set the theme on initial load
(function () {
    // set egoNetwork to false, since we're not in egoNetwork when we start a new window
    window.egoNetwork = false;

    let settings = undefined;
    // catch any querystrings that may include settings
    if (window.location.search) {
        settings = queryStringToSettings();
    }

    // setup zoom functionality
    graph.svg.call(zoom);

    // load network
    loadNetwork([
        { function: transformToWindow, settings: settings },
        { function: saveToStorage },
        { function: setupJLouvain },
    ]); // transformToWindow, saveToStorage, and setupJLouvain is called as a callback
})();
