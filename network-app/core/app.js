"use strict";

// Immediately invoked function to set the theme on initial load
(function () {
    window.ERROR_LEVEL = 1;

    // start by reading in environment variables, if they exist
    d3.json("env.json").then((env_content) => {
        if (env_content.ERROR_LEVEL === undefined)
            throw "env.json does not contain ERROR_LEVEL variable"
        else
            window.ERROR_LEVEL = env_content.ERROR_LEVEL;
    }).catch((err) => {
        console.error(err);
        console.error('Setting automatic environment variables');
        window.ERROR_LEVEL = 1;
    }).finally(() => {
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

    });

    // keep track of processes...
    graph.simulation.on("tick", () => {
        if (window.ERROR_LEVEL > 0) _output(graph.simulation.alpha().toString(), true, 'tick')
        d3.select('#loadingDot').attr('data-running', true);
    });
    graph.simulation.on('end', () => {
        d3.select('#loadingDot').attr('data-running', false).attr('title', 'Done');
    })

})();
