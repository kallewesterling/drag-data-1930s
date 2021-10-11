/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

// Immediately invoked function to set the theme on initial load
(function() {
  // window.ERROR_LEVEL = 1;
  // window.DATA_DIR = "data";

  // start by reading in environment variables, if they exist
  d3.json('env.json').then((envContent) => {
    if (envContent.ERROR_LEVEL === undefined) {
      throw new Error('env.json does not contain ERROR_LEVEL variable');
    } else {
      window.ERROR_LEVEL = envContent.ERROR_LEVEL;
    }
    /*
    if (env_content.DATA_DIR === undefined)
      throw "env.json does not contain DATA_DIR variable"
    else
      window.DATA_DIR = env_content.DATA_DIR;
    */
  }).catch((err) => {
    console.error(err);
    console.error('Setting automatic environment variables to:');
    console.error(`ERROR_LEVEL ${window.ERROR_LEVEL}`);
    console.error(`and DATA_DIR ${window.DATA_DIR}.`);
    // window.ERROR_LEVEL = 1;
    // window.DATA_DIR = "data";
  }).finally(() => {
    // since we're not in egoNetwork when we start a new window:
    // set egoNetwork to false
    window.egoNetwork = false;

    let settings = undefined;
    // catch any querystrings that may include settings
    if (window.location.search) {
      settings = queryStringToSettings();
    }

    // setup zoom functionality
    window.graph.svg.call(zoom);

    // load network, with called as a callback:
    // transformToWindow, saveToStorage, and setupJLouvain
    loadNetwork([
      {function: transformToWindow, settings: settings},
      {function: saveToStorage},
      {function: setupJLouvain},
    ]);
  });

  // keep track of processes...
  window.graph.simulation.on('tick', () => {
    if (window.ERROR_LEVEL > 0) {
      _output(window.graph.simulation.alpha().toString(), true, 'tick');
    }
    d3.select('#loadingDot').attr('data-running', true);
  });
  window.graph.simulation.on('end', () => {
    d3.select('#loadingDot').attr('data-running', false).attr('title', 'Done');
  });
})();
