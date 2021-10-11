/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

/**
 * resetDraw takes no arguments, but has the purpose of running subordinate
 * functions in the correct order, for resetting the graph to its original look.
 * The return value is always true.
 * @return {boolean} - true
 */
const resetDraw = () => {
  hide('#nodeEdgeInfo');
  deselectNodes();
  styleGraphElements();
  return true;
};

/**
 * uiToggleAllSettingBoxes takes no arguments, but ensures that all the
 * settings containers on the screen are in/visible to the user when
 * appropriate.
 * The return value is true in all cases.
 * @return {boolean} - true
 */
const uiToggleAllSettingBoxes = () => {
  _output('Called', false, uiToggleAllSettingBoxes);
  // if #rationale is visible, just hide that!
  if (
    bootstrap.Modal.getInstance(document.querySelector('#rationale')) &&
    bootstrap.Modal.getInstance(document.querySelector('#rationale'))
        ._isShown
  ) {
    bootstrap.Modal.getInstance(
        document.querySelector('#rationale'),
    ).hide();
    return true;
  }

  if (isVisible('#nodeTable')) hide('#nodeTable');

  // toggle all the settings containers to the correct state!
  if (isVisible('#settingsContainer') && !isVisible('#infoToggleDiv')) {
    toggle('#settingsContainer');
  } else if (
    !isVisible('#settingsContainer') &&
    isVisible('#infoToggleDiv')
  ) {
    toggle('#infoToggleDiv');
  } else {
    toggle('#settingsContainer');
    toggle('#infoToggleDiv');
  }
  return true;
};

const ensureDisabledLabels = (interfaceSettings = undefined) => {
  if (!interfaceSettings) {
    interfaceSettings = refreshValues('ensureDisabledLabels');
  }

  [
    ['layoutCharge', 'charge', 'charge_label'],
    ['layoutCollide', 'collide', 'collide_label'],
  ].forEach((d) => {
    const disable = interfaceSettings[d[0]] === false;
    window._elements[d[1]].disabled = disable;
    window._selectors[d[2]].classed('text-muted', disable);
  });
};

const getChargePercentage = (value) => {
  return ((+value + 5100) / 10).toFixed(0) + '%';
};

const getLinkStrengthPercentage = (value) => {
  return (value * 100).toFixed(0) + '%';
};

/**
 * updateLabel takes one required argument, the name of any given label
 * to update. Depending on checkboxes, it may disable slider UI elements.
 * The return value is always true.
 * @arg {string} name - The name of the label that needs updating.
 * @arg {Object} interfaceSettings
 * @arg {executable} callback
 * @return {boolean} - true
 */
const updateLabel = (
    name,
    interfaceSettings = undefined,
    callback = undefined,
) => {
  if (!interfaceSettings) interfaceSettings = refreshValues('updateLabel');

  let value = interfaceSettings[name];

  // special handling
  switch (name) {
    case 'charge':
      value = getChargePercentage(value);
      break;

    // percentages
    case 'collide':
    case 'edgeMultiplier':
    case 'nodeMultiplier':
    case 'linkStrength':
      value = getLinkStrengthPercentage(value);
      break;

    default:
      // Unhandled names include minDegree and minWeight
      break;
  }

  window._selectors[name + '_label'].html(`${name} (${value})`);

  if (callback) callback();

  return true;
};

/**
 * saveToStorage takes no arguments but saves two items to the user's
 * `localStorage`: their current `transform` (zoom) and settings.
 * The return value is true in all cases.
 * @arg {Object} settings
 * @arg {Object} zoomEvent
 * @return {boolean} - true
 */
const saveToStorage = (settings = undefined, zoomEvent = undefined) => {
  const outputMessages = ['Called'];

  if (zoomEvent && zoomEvent.transform) {
    // _output("Saving zoom settings", false, saveToStorage)
    outputMessages.push('Saving zoom settings');
    outputMessages.push(zoomEvent.transform);
    localStorage.setItem('transform', JSON.stringify(zoomEvent.transform));
    return true;
  }

  if (!settings) settings = settingsFromDashboard('saveToStorage');

  outputMessages.push('Saving settings');
  outputMessages.push(settings);

  localStorage.setItem('settings', JSON.stringify(settings));

  explainSettings(settings, true);

  _output(outputMessages, false, saveToStorage);

  return true;
};

/**
 * fetchFromStorage takes one argument, which defines the name of the
 * stored setting to load.
 * The return value is `undefined` in case no item can be found, and
 * a (parsed) object if the item was stringified before it was saved
 * (see `saveToStorage`).
 * @arg {string} item - The name of the stored setting to load.
 * @arg {string} caller - The name of the caller function.
 * @return {Object|string|undefined} - `undefined` in case no setting
 *                                     with the provided name can be
 *                                     found, and a (parsed) object
 *                                     if the item was stringified
 *                                     before it was saved. If no
 *                                     JSON data exists for the saved
 *                                     setting, a string is returned.
 */
const fetchFromStorage = (item, caller = undefined) => {
  const rawSetting = localStorage.getItem(item);
  const msg = `Called ${caller ? 'from ' + caller : ''} for \`${item}\``;
  if (rawSetting) {
    if (rawSetting.includes('{')) {
      const parsed = JSON.parse(rawSetting);
      _output([msg, parsed], false, `fetchFromStorage - ${item}`);
      return parsed;
    } else {
      _output([msg, rawSetting], false, `fetchFromStorage - ${item}`);
      return rawSetting;
    }
  } else {
    _output(
        [msg, `*** \`${item}\` does not exist in localStorage.`],
        false,
        `fetchFromStorage - ${item}`,
    );
    return undefined;
  }
};

/**
 * resetLocalStorage takes no arguments, and removes all of the locally
 * stored settings. It reloads the window after settings are deleted, to
 * signal a change to the user.
 * The return value is true in all cases.
 * @return {boolean} - true
 */
const resetLocalStorage = () => {
  ['theme', 'transform', 'settings'].forEach((item) => {
    localStorage.removeItem(item);
  });
  _output(
      'Locally stored settings have been reset.',
      false,
      resetLocalStorage,
  );
  window.location.reload();
  return true;
};

const refreshValues = (caller = undefined) => {
  _output(`Called ${caller ? 'from ' + caller : ''}`, false, refreshValues);
  const outputValue = {};
  for (const [key, element] of Object.entries(window._elements)) {
    if (!element) continue;
    let value = undefined;
    switch (element.tagName.toLowerCase()) {
      case 'input':
        switch (element.type) {
          case 'checkbox':
            value = element.checked;
            break;

          case 'range':
            value = element.value;
            break;

          default:
            console.error('Unhandled type', element.type);
            break;
        }
        break;

      case 'select':
        value = element.value;
        break;

      default:
        // Unhandled tag names - long list...
        break;
    }

    if (element.type === 'checkbox' || value) {
      if (+element.value) value = +element.value;

      outputValue[key] = value;
    }
  }
  return outputValue;
};

/**
 * filterStore loops over all of the store's edges and nodes and ensures
 * they all have a correct set of `passes` property object that will tell
 * us whether the edge has passed the test for each of the key.
 * @arg {Object} settings
 * @arg {Object} interfaceSettings
 * @return {boolean} - always true
 */
const filterStore = (settings = undefined, interfaceSettings = undefined) => {
  _output('Called', false, 'filterStore');

  if (!interfaceSettings) {
    interfaceSettings = refreshValues('settingsFromDashboard');
  }

  if (!settings) {
    settings = settingsFromDashboard('filterStore');
  }

  window.store.edges.forEach((edge) => {
    edge.passes = {};
    // set the correct `passes` for every edge
    edge.passes.startYear =
      edge.range.startYear >= interfaceSettings.startYear ? true : false;
    edge.passes.endYear =
      edge.range.endYear <= interfaceSettings.endYear ? true : false;
    edge.passes.minWeight =
      edge.weights.weight >= interfaceSettings.minWeight ? true : false;

    // set the correct `inGraph` for every edge
    if (!document.querySelector(`line#${edge.edge_id}`)) {
      edge.inGraph = false;
    } else {
      edge.inGraph = true;
    }

    // set the correct `weight` for every edge
    edge.weight = edge.weights[interfaceSettings.weightFrom];
  });

  let minDegree = 0;
  if (settings.nodes) minDegree = settings.nodes.minDegree;
  else if (interfaceSettings.minDegree) {
    minDegree = interfaceSettings.minDegree;
  } else {
    console.warn('Could not load minDegree setting, so moving forward with 0.');
  }
  // URGENT TODO
  console.log(interfaceSettings.minDegree, minDegree, settings);
  // if (settings.nodes)
  //   console.log(settings.nodes.minDegree);

  window.store.nodes.forEach((node) => {
    // set the correct `passes` for every node
    node.passes = {
      minDegree: node.degrees.degree >= interfaceSettings.minDegree ?
                 true :
                 false,
      unnamed: node.id.toLowerCase().includes('unnamed') ?
               false :
               true,
    };

    // set the correct `inGraph` for every node
    if (!document.querySelector(`circle#${node.node_id}`)) {
      node.inGraph = false;
    } else {
      node.inGraph = true;
    }
  });

  return true;
};

/**
 * settingsFromDashboard takes no arguments but loads the current settings.
 * The return value is an object with all of the settings as property values.
 * @arg {string} caller - The caller function's name.
 * @return {Object} - All of the app's settings.
 */
const settingsFromDashboard = (caller = undefined) => {
  const outputMessage = [`Called ${caller ? 'by ' + caller : ''}`];

  // if settings are not set up, set it all up!
  if (!window.store.settingsFinished) {
    setupSettingsInterface('settingsFromDashboard');
    window.store.settingsFinished = true;
  }

  const interfaceSettings = refreshValues('settingsFromDashboard');

  [
    'collide',
    'charge',
    'minDegree',
    'nodeMultiplier',
    'edgeMultiplier',
    'minWeight',
    'linkStrength',
  ].forEach((label) => updateLabel(label, interfaceSettings));

  ensureDisabledLabels(interfaceSettings);

  filterStore(interfaceSettings);

  const mappedInterfaceSettings = {
    nodes: {
      minDegree: interfaceSettings.minDegree,
      nodeMultiplier: interfaceSettings.nodeMultiplier,
      autoClearNodes: interfaceSettings.autoClearNodes,
      autoClearUnnamed: interfaceSettings.autoClearUnnamed,
      stickyNodes: interfaceSettings.stickyNodes,
      // nodeSizeFromCurrent: interfaceSettings.nodeSizeFromCurrent,
      communityDetection: interfaceSettings.communityDetection,
      rFrom: interfaceSettings.rFrom,
      minR: window.autoSettings.nodes.minR,
      maxR: window.autoSettings.nodes.maxR,
    },
    edges: {
      minWeight: interfaceSettings.minWeight,
      edgeMultiplier: interfaceSettings.edgeMultiplier,
      startYear: interfaceSettings.startYear,
      endYear: interfaceSettings.endYear,
      weightFrom: interfaceSettings.weightFrom,
      weightFromCurrent: interfaceSettings.weightFromCurrent,
      minStroke: window.autoSettings.edges.minStroke,
      maxStroke: window.autoSettings.edges.maxStroke,
    },
    force: {
      layoutCenter: interfaceSettings.layoutCenter,
      layoutClustering: interfaceSettings.layoutClustering,
      layoutForceX: interfaceSettings.layoutForceX,
      layoutForceY: interfaceSettings.layoutForceY,
      layoutCharge: interfaceSettings.layoutCharge,
      layoutCollide: interfaceSettings.layoutCollide,
      linkStrength: interfaceSettings.linkStrength,
      charge: interfaceSettings.charge,
      collide: interfaceSettings.collide,
    },
    zoom: window.autoSettings.zoom,
    zoomMin: window.autoSettings.zoomMin,
    zoomMax: window.autoSettings.zoomMax,
    // debugMessages: debugMessages,
    datafile: {
      filename: interfaceSettings.datafile,
      bipartite: false,
    },
  };
  outputMessage.push('Finished');
  outputMessage.push(mappedInterfaceSettings);
  _output(outputMessage, false, settingsFromDashboard);
  return mappedInterfaceSettings;
};

const settingsFromQueryString = () => {
  const urlParams = new URLSearchParams(window.location.search);

  const QSSettings = {};

  for (const [key, value] of urlParams) {
    if (!value) continue;
    [
      'minDegree',
      'minWeight',
      'zoomMax',
      'zoomMin',
      'startYear',
      'endYear',
      'x',
      'y',
      'z',
    ].forEach((k) => {
      if (k.toLowerCase() === key.toLowerCase()) {
        if (+value) QSSettings[k] = +value;
        else QSSettings[k] = value;
      }
    });
  }
  return QSSettings;
};

/**
 * setupSettingsInterface takes no arguments but sets up the settings
 * box correctly, with all the max, min, and step values for UI elements,
 * The return value is true in all cases.
 * @arg {string} caller - The caller function's name as a string.
 * @return {boolean} - true
 */
const setupSettingsInterface = (caller = undefined) => {
  _output(
      `Called ${caller ? 'from ' + caller : ''}`,
      false,
      setupSettingsInterface,
  );

  let settings = fetchFromStorage('settings', 'setupSettingsInterface');

  if (!settings) {
    _output(
        [
          'Stored settings empty, so reloading from autoSettings.',
          window.autoSettings,
        ],
        false,
        setupSettingsInterface,
        console.warn,
    );
    settings = window.autoSettings;
  }

  window._elements.minWeight.max = d3.max(window.store.ranges.edgeWidth);
  window._elements.minDegree.max = d3.max(window.store.ranges.nodeDegree);

  // set range for nodeMultiplier
  window._elements.nodeMultiplier.min = 0.1;
  window._elements.nodeMultiplier.max = 5;
  window._elements.nodeMultiplier.step = 0.25;

  // set range for edgeMultiplier
  window._elements.edgeMultiplier.min = 0.05;
  window._elements.edgeMultiplier.max = 5;
  window._elements.edgeMultiplier.step = 0.05;

  // set range for charge
  window._elements.charge.min = -5000;
  window._elements.charge.max = -100;
  window._elements.charge.step = 100;

  // set range for collide
  window._elements.collide.min = 0.05;
  window._elements.collide.max = 1;
  window._elements.collide.step = 0.05;

  // set range for collide
  window._elements.linkStrength.min = 0.001;
  window._elements.linkStrength.max = 1;
  window._elements.linkStrength.step = 0.01;

  // set range for minWeight
  window._elements.minDegree.min = 0;
  window._elements.minDegree.step = 1;

  // set range for minWeight
  window._elements.minWeight.min = 0;
  window._elements.minWeight.step = 1;

  // set auto values
  window._elements.minDegree.value = settings.nodes.minDegree;
  window._elements.nodeMultiplier.value = settings.nodes.nodeMultiplier;
  window._elements.edgeMultiplier.value = settings.edges.edgeMultiplier;
  window._elements.minWeight.value = settings.edges.minWeight;
  window._elements.autoClearNodes.checked = settings.nodes.autoClearNodes;
  window._elements.autoClearUnnamed.checked = settings.nodes.autoClearUnnamed;
  /*
  window._elements.nodeSizeFromCurrent.checked =
    settings.nodes.nodeSizeFromCurrent;
  window._elements.weightFromCurrent.checked = settings.edges.weightFromCurrent;
  */
  window._elements.charge.value = settings.force.charge;
  window._elements.collide.value = settings.force.collide;
  window._elements.linkStrength.value = settings.force.linkStrength;
  window._elements.layoutCenter.checked = settings.force.layoutCenter;
  window._elements.layoutClustering.checked = settings.force.layoutClustering;
  window._elements.layoutForceX.checked = settings.force.layoutForceX;
  window._elements.layoutForceY.checked = settings.force.layoutForceY;
  window._elements.layoutCharge.checked = settings.force.layoutCharge;
  window._elements.layoutCollide.checked = settings.force.layoutCollide;

  window._elements.stickyNodes.checked = settings.nodes.stickyNodes;
  // window._elements.debugMessages.checked = settings.debugMessages;
  window._elements.datafile.value = settings.datafile.filename;

  if (window._elements.communityDetection.options.length == 0) {
    _output(
        'Warning',
        false,
        'Warning: No communityDetection options (setupSettingInteractivity)',
    );
  }
  if (!settings.nodes.communityDetection) {
    settings.nodes.communityDetection = '';
  }

  window._elements.communityDetection.value =
    settings.nodes.communityDetection;

  if (window._elements.startYear.options.length == 0) {
    _output(
        'Warning',
        false,
        'Warning: No startYear options (setupSettingInteractivity)',
    );
  }
  if (window._elements.endYear.options.length == 0) {
    _output(
        'Warning',
        false,
        'Warning: No endYear options (setupSettingInteractivity)',
    );
  }
  window._elements.startYear.value = settings.edges.startYear;
  window._elements.endYear.value = settings.edges.endYear;

  if (window._elements.weightFrom.options.length == 0) {
    _output(
        'Warning',
        false,
        'Warning: No weightFrom options (setupSettingInteractivity)',
    );
  }
  window._elements.weightFrom.value = settings.edges.weightFrom;

  if (window._elements.rFrom.options.length == 0) {
    _output(
        'Warning',
        false,
        'Warning: No rFrom options (setupSettingInteractivity)',
    );
  }
  window._elements.rFrom.value = settings.nodes.rFrom;

  return true;
};

const toggleSetting = (name) => {
  if (window._elements[name].type !== 'checkbox') {
    console.trace(
        `Cannot toggle ${window._elements[name].type}; must provide value.`,
    );
    return false;
  }

  const currentSettings = refreshValues();

  if (!Object.keys(currentSettings).includes(name)) {
    console.trace(`Setting was not found.`);
    return false;
  }

  window._elements[name].click(); // no this is not what we want
};

// the start of a new changeSetting function...
const editSetting = (name, value) => {
  const currentSettings = refreshValues();
  console.log(`${name} --> ${value}`);

  switch (typeof currentSettings[name]) {
    case 'number':
      throw new Error('Cannot toggle number; must provide value.');
      // console.log('number:', name, currentSettings[name]);
      // console.log(window._elements[name].type);
      break;
    case 'string':
      // console.log('string:', name, currentSettings[name]);
      break;
    case 'boolean':
      // console.log('boolean (checkbox):', name, currentSettings[name]);
      break;
    default:
      // console.log(typeof(currentSettings[name]))
      break;
  }
};

/**
 * changeSetting is a complex function that can change any given setting,
 * and also makes sure to change the UI representation of that value in
 * the settings box. It is also the function that is run every time a
 * setting UI element is changed in the settings box.
 * The return value is always true.
 * @arg {string} selector - A CSS selector to the object in question
 *                          (preferably `#id` but can also be `.class`
 *                          or `tag`).
 * @arg {number|boolean} setTo - The value to set the selector to.
 *                               Boolean if you want to change a checkbox
 *                               or similar UI elements. Number if you're
 *                               changing a number-based UI element.
 * @arg {boolean} [_filter] - Set to `true` (default) if you want to end
 *                            by running `filter()` again (node changes,
 *                            predominantly).
 * @arg {string} [type] - "checkbox" (default), "slider", "dropdown" are
 *                        valid types.
 * @arg {Array} additionalPreFunctions - Array of executables that you
 *                                       want to run _before_ the setting
 *                                       is changed.
 * @arg {Array} additionalPostFunctions - Array of executables that you
 *                                        want to run _after_ the setting
 *                                        is changed.
 * @arg {boolean} restartSim - Set to `true` (default) if you want to
 *                             restart the simulation after the setting
 *                             has been updated.
 * @return {boolean} - true
 */
const changeSetting = (
    // TODO: #28 This function needs an overhaul
    selector,
    setTo,
    _filter = true,
    type = 'checkbox',
    additionalPreFunctions = [],
    additionalPostFunctions = [],
    restartSim = true,
) => {
  _output('Called', false, changeSetting);

  if (typeof selector === 'object') {
    setTo = selector.setTo;
    _filter = selector._filter ? selector._filter : true;
    type = selector.type ? selector.type : 'checkbox';
    additionalPreFunctions = selector.additionalPreFunctions ?
      selector.additionalPreFunctions :
      [];
    additionalPostFunctions = selector.additionalPostFunctions ?
      selector.additionalPostFunctions :
      [];
    selector = selector.selector;
  }

  let force = false;
  if (setTo === 'force') {
    force = true;
    if (type === 'checkbox') {
      setTo = d3.select(selector).node().checked;
    } else if (type === 'slider') {
      setTo = d3.select(selector).node().value;
    } else if (type === 'dropdown') {
      setTo = d3.select(selector).node().value;
    } else {
      console.error('cannot handle this input type yet!');
    }
  }
  if (
    force ||
    (type === 'checkbox' && d3.select(selector).node().checked != setTo) ||
    (type === 'slider' && d3.select(selector).node().value != setTo)
  ) {
    if (type === 'checkbox') {
      d3.select(selector).node().checked = setTo;
    } else if (type === 'slider') {
      const maxValue = +d3.select(selector).node().max;
      const minValue = +d3.select(selector).node().min;
      if (setTo >= maxValue) {
        setTo = maxValue;
      } else if (setTo <= minValue) {
        setTo = minValue;
      }
      updateLabel(selector.slice(1));
    }
    additionalPreFunctions.forEach((func) => {
      Function(func)();
    });
    d3.select(selector).node().value = setTo;
    if (_filter === true) filter();
    setupFilteredElements();
    styleGraphElements();
    if (restartSim) restartSimulation();
    saveToStorage();
    additionalPostFunctions.forEach((func) => {
      Function(func)();
    });
  } else {
    // the setting was already correctly set.
  }
  return true;
};

/**
 * setupSettingInteractivity takes no arguments but is part of the set up
 * of the interactivity in the settings box.
 * The return value is always true.
 * @return {boolean} - true
 */
const setupSettingInteractivity = () => {
  // dropdown interactivity
  window._selectors.weightFrom.on('change', () => {
    changeSetting('#weightFrom', 'force', true, 'dropdown');
  });
  window._selectors.rFrom.on('change', () => {
    changeSetting('#rFrom', 'force', true, 'dropdown', [], [], false);
    window.graph.simulation.restart().alpha(0.05); // just a nudge
  });
  window._selectors.startYear.on('change', () => {
    changeSetting('#startYear', 'force', true, 'dropdown');
  });
  window._selectors.endYear.on('change', () => {
    changeSetting('#endYear', 'force', true, 'dropdown');
  });
  window._selectors.datafile.on('change', () => {
    changeSetting(
        '#datafile',
        'force',
        true,
        'dropdown',
        [],
        [location.reload()],
    );
  });

  // slider interactivity
  window._selectors.minDegree.on('input', () => {
    updateLabel('minDegree');
  });
  window._selectors.minDegree.on('change', () => {
    changeSetting('#minDegree', 'force', true, 'slider');
  });
  window._selectors.minWeight.on('input', () => {
    updateLabel('minWeight');
  });
  window._selectors.minWeight.on('change', () => {
    changeSetting('#minWeight', 'force', true, 'slider');
    filterStore();
    filterEdges();
  });

  window._selectors.nodeMultiplier.on('input', () => {
    changeSetting(
        '#nodeMultiplier',
        'force',
        false,
        'slider',
        [],
        [],
        false,
    );
    window.graph.simulation.restart().alpha(0.05); // just a nudge
  });
  window._selectors.edgeMultiplier.on('input', () => {
    changeSetting(
        '#edgeMultiplier',
        'force',
        false,
        'slider',
        [],
        [],
        false,
    );
    window.graph.simulation.restart().alpha(0.05); // just a nudge
  });
  window._selectors.collide.on('input', () => {
    changeSetting('#collide', 'force', false, 'slider');
  });
  window._selectors.linkStrength.on('input', () => {
    changeSetting('#linkStrength', 'force', false, 'slider');
  });
  window._selectors.charge.on('input', () => {
    changeSetting('#charge', 'force', false, 'slider');
  });

  // checkbox interactivity
  window._selectors.autoClearNodes.on('change', () => {
    changeSetting('#autoClearNodes', 'force', true);
  });
  window._selectors.autoClearUnnamed.on('change', () => {
    changeSetting(
        '#autoClearUnnamed',
        'force',
        true,
        'checkbox',
        [],
        [location.reload()],
    ); // TODO: remove reload here...
    // changeSetting("#autoClearUnnamed", "force", true);
  });
  /*
  window._selectors.weightFromCurrent.on("change", () => {
    changeSetting("#weightFromCurrent", "force", true, "checkbox",
      [], [], false);
 });
  */
  /*
  window._selectors.nodeSizeFromCurrent.on("change", () => {
    changeSetting("#nodeSizeFromCurrent", "force", true, "checkbox",
      [], [], false);
 });
  */
  window._selectors.communityDetection.on('change', () => {
    changeSetting(
        '#communityDetection',
        'force',
        true,
        'dropdown',
        [],
        [styleGraphElements],
        false,
    );
    // used to be:
    /* changeSetting("#communityDetection", "force", true, "checkbox",
        [], [styleGraphElements], false);
    */
  });
  window._selectors.layoutCenter.on('change', () => {
    changeSetting('#layoutCenter', 'force', false);
  });
  window._selectors.layoutClustering.on('change', () => {
    changeSetting('#layoutClustering', 'force', false);
  });
  window._selectors.layoutForceX.on('change', () => {
    changeSetting('#layoutForceX', 'force', false);
  });
  window._selectors.layoutForceY.on('change', () => {
    changeSetting('#layoutForceY', 'force', false);
  });
  /*
  window._selectors.debugMessages.on("change", () => {
    saveToStorage();
 });
  */

  // checkboxes (special) interactivity
  window._selectors.stickyNodes.on('change', () => {
    changeSetting('#stickyNodes', 'force', false, 'checkbox', [
      'resetDraw()',
    ]);
  });
  window._selectors.layoutCollide.on('change', () => {
    changeSetting('#layoutCollide', 'force', false, 'checkbox', [
      'updateLabel(\'collide\', undefined, ensureDisabledLabels)',
    ]);
  });
  window._selectors.layoutCharge.on('change', () => {
    changeSetting('#layoutCharge', 'force', false, 'checkbox', [
      'updateLabel(\'charge\', undefined, ensureDisabledLabels)',
    ]);
  });

  // simple button interactivity
  window._selectors.switchMode.on('click', () => {
    toggleTheme();
  });
  window._selectors.showClusterInfo.on('click', () => {
    toggle('#nodeTable');
    if (isVisible('#nodeTable')) hide('#quickEdgeInfo');
  });
  window._selectors.explainSettingsToggle.on('click', () => {
    if (isVisible('#explanation')) {
      hide('#explanation');
    } else {
      explainSettings();
    }
  });
  window._selectors.nudgeNodes.on('click', () => {
    window.graph.simulation.restart().alpha(0.15);
  });
  window._selectors.resetLocalStorage.on('click', () => {
    resetLocalStorage();
  });
  window._selectors.clearUnconnected.on('click', () => {
    filterNodesWithoutEdge();
  });

  // set up settings containers
  window._selectors.settingsToggle.on('click', () => {
    toggle('#settingsContainer');
  });
  window._selectors.infoToggle.on('click', () => {
    toggle('#infoToggleDiv');
  });

  // set up collideContainer and chargeContainer (special cases)
  window._selectors.collideContainer.on('click', (event) => {
    if (
      event.target.id === 'collide' &&
      window._selectors.collide.attr('disabled') != null
    ) {
      window._elements.layoutCollide.checked = true;
      updateLabel('collide', undefined, ensureDisabledLabels);
    }
  });

  window._selectors.chargeContainer.on('click', (event) => {
    if (
      event.target.id === 'charge' &&
      window._selectors.charge.attr('disabled') != null
    ) {
      window._elements.layoutCharge.checked = true;
      updateLabel('charge', undefined, ensureDisabledLabels);
    }
  });
  return true;
};

/**
 * setupKeyHandlers takes no arguments but sets up the key interaction
 * with the network visualization.
 * The return value is always true.
 * @return {boolean} - true
 */
const setupKeyHandlers = () => {
  // resetting on keyUp
  d3.select('html').on('keyup', (evt) => {
    if (evt.key === 'Meta' || evt.key === 'Shift') {
      hide('.metaShow');
    }
    if (evt.key === 'Alt') {
      // toggleCommentedElements(); // moved to button instead
    }
  });

  let numbers = [];
  let years = [];
  const numberModal = new bootstrap.Modal(
      document.getElementById('numberModal'),
      {},
  );

  d3.select('html').on('keydown', (evt) => {
    if (evt.key === 'Meta' || evt.key === 'Shift') {
      show('.metaShow');
    } else if (evt.key === 'Alt') {
      // toggleCommentedElements(); // moved to button instead
    } else if (evt.key === 'Escape' && window.egoNetwork) {
      egoNetworkOff();
      show('#settings');
      show('#infoContainer');
    } else if (evt.key === 'Escape' && isVisible('#popupNav')) {
      toggle('#popupNav');
    } else if (evt.key === 'Escape' && isVisible('#popup-info')) {
      hide('#popup-info');
    } else if (evt.key === 'Escape' && isVisible('#nodeEdgeInfo')) {
      window.edgeSelected = undefined;
      window.nodeSelected = undefined;
      resetDraw();
    } else if (evt.key === 'Escape') {
      uiToggleAllSettingBoxes();
    } else if (evt.key === 'c' && evt.metaKey) {
      changeSetting(
          '#autoClearNodes',
          !settingsFromDashboard('selectKeyDown1').nodes
              .autoClearNodes,
      );
    } else if (evt.key === '+') {
      changeSetting({
        selector: '#nodeMultiplier',
        type: 'slider',
        setTo: settingsFromDashboard('selectKeyDown2').nodes
            .nodeMultiplier + 0.25,
      });
    } else if (evt.key === '-') {
      changeSetting({
        selector: '#nodeMultiplier',
        type: 'slider',
        setTo: settingsFromDashboard('selectKeyDown3').nodes
            .nodeMultiplier - 0.25,
      });
    }
    if (
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(evt.key)
    ) {
      numbers.push(evt.key);
      if (years.length === 1) {
        numberModal._element.querySelector('h5')
            .innerText = 'End year';
      } else {
        numberModal._element.querySelector('h5')
            .innerText = 'Start year';
      }
      numberModal._element.querySelector('h1')
          .innerText = `${+numbers.join('')}`;
      numberModal.show();
      setTimeout(() => {
        numberModal.hide();
      }, 750);
      if (numbers.length == 4) {
        const year = +numbers.join('');
        if (window.store.ranges.years.array.includes(year)) {
          years.push(year);
        } else {
          console.error(`${year} is not a year in the graph's range.`);
          // TODO: setTimeOut should be assigned to `t`.
          // Then stop `t` from timing out, flash the numberModal red,
          // and finally let the user know that nothing happened.
        }
        numbers = [];
        let startYear = undefined;
        let endYear = undefined;
        if (years.length == 2) {
          startYear = years.slice(-2)[0];
          endYear = years.slice(-2)[1];
          years = [];
        } else if (years.slice(-2).length == 1) {
          startYear = years[0];
        }
        if (startYear) {
          changeSetting({
            selector: '#startYear',
            type: 'slider',
            setTo: startYear,
            _filter: true,
          });
        }
        if (endYear) {
          changeSetting({
            selector: '#endYear',
            type: 'slider',
            setTo: endYear,
            _filter: true,
          });
        }
      }
    }
    Object.keys(window.keyMapping).forEach((key) => {
      if (
        key === evt.key &&
        window.keyMapping[key].noMeta &&
        evt.shiftKey == false &&
        evt.metaKey == false &&
        evt.altKey == false &&
        evt.ctrlKey == false
      ) {
        Function(window.keyMapping[key].noMeta)();
      } else if (
        key === evt.key &&
        window.keyMapping[key].shiftKey &&
        evt.shiftKey == true
      ) {
        Function(window.keyMapping[key].shiftKey)();
      }
    });
  });
  return true;
};

/**
 * setupMiscInteractivity takes no arguments but sets up the miscellaneous
 * interaction with elements in the network visualization, and those UI
 * elements that belong to it.
 * The return value is always true.
 * @return {boolean} - true
 */
const setupMiscInteractivity = () => {
  d3.selectAll('[data-toggle]').on('click', (event) => {
    event.stopPropagation();
    if (event.target.classList.contains('toggled')) {
      event.target.classList.remove('toggled');
    } else {
      event.target.classList.add('toggled');
    }
    toggle('#' + event.target.dataset.toggle);
  });

  d3.select(window).on('resize', transformToWindow);

  // set up clicking on html elements
  window.graph.svg.on('click', () => {
    if (isVisible('#popup-info')) {
      hide('#popup-info');
    }
  });

  return true;
};

const allSettingsElements = [
  ...document
      .querySelector('#settings')
      .querySelectorAll('input, select, .btn'),
].concat([
  ...document
      .querySelector('#infoContainer')
      .querySelectorAll('input, select, .btn'),
]);

/**
 * disableSettings is called to disable settings.
 * The return value is always true.
 * @arg {Array} exclude - identifiers (#ID) for settings to exclude from
 *                        disabling can be included.
 * @return {boolean} - true
 */
const disableSettings = (exclude = []) => {
  let outputMessages = [];
  allSettingsElements.forEach((elem) => {
    outputMessages = [`processing element ${elem.id}`];
    if (exclude.includes(elem.id)) {
      // do nothing
      outputMessages.push(
          `** Skipped ${elem.tagName} element with id ${elem.id}.`,
      );
    } else {
      elem.disabled = true;
      elem.classList.add('disabled');
      outputMessages.push(
          `disabled ${elem.tagName} element with id ${elem.id}.`,
      );
    }
    _output(outputMessages, false, disableSettings);
  });
  return true;
};

const enableSettings = (exclude = []) => {
  allSettingsElements.forEach((elem) => {
    if (exclude.includes(elem.id)) {
      // do nothing
    } else {
      elem.disabled = false;
      elem.classList.remove('disabled');
    }
  });
};

const queryStringToSettings = (settings = undefined) => {
  _output('Called', false, queryStringToSettings);
  const outputMessages = [];

  if (!settings) {
    settings = fetchFromStorage('settings', 'queryStringToSettings');
  }

  if (!settings) settings = window.autoSettings;

  const QSSettings = settingsFromQueryString();

  if (QSSettings.minDegree) {
    outputMessages.push(`--> set minDegree to ${QSSettings.minDegree}`);
    settings.nodes.minDegree = QSSettings.minDegree;
  }

  if (QSSettings.minWeight) {
    outputMessages.push(`--> set minWeight to ${QSSettings.minWeight}`);
    settings.edges.minWeight = QSSettings.minWeight;
  }

  if (QSSettings.zoomMin || QSSettings.zoomMax) {
    outputMessages.push(`--> set zoomMin to ${QSSettings.zoomMin}`);
    outputMessages.push(`--> set zoomMax to ${QSSettings.zoomMax}`);

    (settings.zoomMin = window.autoSettings.zoomMin),
    (settings.zoomMax = window.autoSettings.zoomMax);

    if (QSSettings.zoomMin !== undefined) {
      settings.zoomMin = QSSettings.zoomMin;
    }

    if (QSSettings.zoomMax !== undefined) {
      settings.zoomMax = QSSettings.zoomMax;
    }

    zoom.scaleExtent([settings.zoomMin, settings.zoomMax]);
  }

  if (QSSettings.startYear) {
    outputMessages.push(`--> set startYear to ${QSSettings.startYear}`);
    settings.edges.startYear = QSSettings.startYear;
  }

  if (QSSettings.endYear) {
    outputMessages.push(`--> set endYear to ${QSSettings.endYear}`);
    settings.edges.endYear = QSSettings.endYear;
  }

  if (QSSettings.x || QSSettings.y || QSSettings.z) {
    outputMessages.push(`--> set x, y to ${QSSettings.x}, ${QSSettings.y}`);
    outputMessages.push(`--> set z to ${QSSettings.z}`);

    let x = 0;
    let y = 0;
    let z = 1;

    if (QSSettings.x !== undefined) x = QSSettings.x;

    if (QSSettings.y !== undefined) y = QSSettings.y;

    if (QSSettings.z !== undefined) z = QSSettings.z;

    window.graph.svg
        .transition()
        .duration(1000)
        .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(z));
  }

  outputMessages.forEach((msg) => console.error(msg));
  _output(outputMessages, false, queryStringToSettings);

  saveToStorage(settings);

  return settings;
};
