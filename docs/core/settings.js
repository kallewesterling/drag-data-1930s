"use strict";

/**
 * resetDraw takes no arguments, but has the purpose of running subordinate functions in the correct order, for resetting the graph to its original look.
 * The return value is always true.
 * @returns {boolean} - true
 */
const resetDraw = () => {
    hide("#nodeEdgeInfo");
    deselectNodes();
    styleGraphElements();
    return true;
};

/**
 * UIToggleAllSettingBoxes takes no arguments, but ensures that all the settings containers on the screen are in/visible to the user when appropriate.
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const UIToggleAllSettingBoxes = () => {
    _output('Called', false, UIToggleAllSettingBoxes)
    // if #rationale is visible, just hide that!
    if (bootstrap.Modal.getInstance(document.querySelector("#rationale")) && bootstrap.Modal.getInstance(document.querySelector("#rationale"))._isShown) {
        bootstrap.Modal.getInstance(document.querySelector("#rationale")).hide();
        return true;
    }

    if (isVisible("#nodeTable"))
        hide("#nodeTable");

    // toggle all the settings containers to the correct state!
    if (isVisible("#settingsContainer") && !isVisible("#infoToggleDiv")) {
        toggle("#settingsContainer");
    } else if (!isVisible("#settingsContainer") && isVisible("#infoToggleDiv")) {
        toggle("#infoToggleDiv");
    } else {
        toggle("#settingsContainer");
        toggle("#infoToggleDiv");
    }
    return true;
};


const ensureDisabledLabels = (interfaceSettings=undefined) => {
    if (!interfaceSettings)
        interfaceSettings = refreshValues('ensureDisabledLabels');

    [
        ["layoutCharge", "charge", "charge_label"],
        ["layoutCollide", "collide", "collide_label"],
    ].forEach((d) => {
        let disable = interfaceSettings[d[0]] === false;
        window._elements[d[1]].disabled = disable;
        window._selectors[d[2]].classed("text-muted", disable);
    });
}

/**
 * updateLabel takes one required argument, the name of any given label to update. Depending on checkboxes, it may disable slider UI elements.
 * The return value is always true.
 * @param {string} name - The name of the label that needs updating.
 * @returns {boolean} - true
 */
const updateLabel = (name, interfaceSettings=undefined, callback=undefined) => {
    if (!interfaceSettings)
        interfaceSettings = refreshValues('updateLabel');

    let value = interfaceSettings[name];
    
    // special handling
    switch (name) {
        case "charge":
            console.log(`charge is set to ${value}`)
            value = ((+value + 5100) / 10).toFixed(0) + "%";
            break;

        // percentages
        case "collide":
        case "edgeMultiplier":
        case "nodeMultiplier":
        case "linkStrength":
            value = (value * 100).toFixed(0) + "%";
            break;

        default:
            // console.log('Unhandled name', name);
            break;
    }
    
    window._selectors[name+'_label'].html(`${name} (${value})`);

    if (callback)
        callback();

    return true;
};

/**
 * saveToStorage takes no arguments but saves two items to the user's `localStorage`: their current `transform` (zoom) and settings.
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const saveToStorage = (settings=undefined, zoom_event=undefined) => {    
    let output_msgs = ["Called"];

    if (zoom_event && zoom_event.transform) {
        // _output("Saving zoom settings", false, saveToStorage)
        output_msgs.push("Saving zoom settings");
        output_msgs.push(zoom_event.transform);
        localStorage.setItem("transform", JSON.stringify(zoom_event.transform));
        return true;
    }
    
    if (!settings)
        settings = settingsFromDashboard("saveToStorage");

    output_msgs.push("Saving settings");
    output_msgs.push(settings);
    
    localStorage.setItem("settings", JSON.stringify(settings));
    
    _output(output_msgs, false, saveToStorage)
    
    return true;
};

/**
 * fetchFromStorage takes one argument, which defines the name of the stored setting to load.
 * The return value is `undefined` in case no item can be found, and a (parsed) object if the item was stringified before it was saved (see `saveToStorage`).
 * @param {string} item - The name of the stored setting to load.
 * @returns {Object|string|undefined} - `undefined` in case no setting with the provided name can be found, and a (parsed) object if the item was stringified before it was saved. If no JSON data exists for the saved setting, a string is returned.
 */
const fetchFromStorage = (item, caller=undefined) => {
    let rawSetting = localStorage.getItem(item);
    let msg = `Called ${caller ? "from "+caller : ""} for \`${item}\``
    if (rawSetting) {
        if (rawSetting.includes("{")) {
            let parsed = JSON.parse(rawSetting);
            _output([msg, parsed], false, `fetchFromStorage - ${item}`)
            return parsed;
        } else {
            _output([msg, rawSetting], false, `fetchFromStorage - ${item}`)
            return rawSetting;
        }
    } else {
        _output([msg, `*** \`${item}\` does not exist in localStorage.`], false, `fetchFromStorage - ${item}`);
        return undefined;
    }
};

/**
 * resetLocalStorage takes no arguments, and removes all of the locally stored settings. It reloads the window after settings are deleted, to signal a change to the user.
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const resetLocalStorage = () => {
    ["theme", "transform", "settings"].forEach((item) => {
        localStorage.removeItem(item);
    });
    _output("Locally stored settings have been reset.", false, resetLocalStorage);
    window.location.reload();
    return true;
};


const refreshValues = (caller=undefined) => {
    _output(`Called ${caller ? "from "+caller : ""}`, false, refreshValues);
    _ = {}
    for (const [key, element] of Object.entries(window._elements)) {
        if (!element)
            continue;
        let value = undefined;
        switch (element.tagName.toLowerCase()) {
            case "input":
                switch (element.type) {
                    case "checkbox":
                        value = element.checked;
                        break;
                    
                    case "range":
                        value = element.value;
                        break;

                    default:
                        console.error("Unhandled type", element.type);
                        break;
                }
                break;

            case "select":
                value = element.value;
                break;

            default:
                // console.log("Unhandled tagname", element.tagName);
                break;
        }

        if (element.type === "checkbox" || value) {
            if (+element.value)
                value = +element.value;

            _[key] = value;
        }
    }
    return _;
}

/**
 * filterStore loops over all of the store's edges and nodes and ensures they all have a correct set of `passes` property object that will tell us whether the edge has passed the test for each of the key.
 * @param {object} interfaceSettings 
 * @returns true
 */
const filterStore = (settings=undefined, interfaceSettings=undefined) => {
    _output('Called', false, 'filterStore')

    if (!interfaceSettings)
        interfaceSettings = refreshValues('settingsFromDashboard');

    if (!settings)
        settings = settingsFromDashboard("filterStore");

    store.edges.forEach(edge=>{
        edge.passes = {}
        // set the correct `passes` for every edge
        edge.passes.startYear = edge.range.startYear > interfaceSettings.startYear ? true : false;
        edge.passes.endYear = edge.range.endYear < interfaceSettings.endYear ? true : false;
        edge.passes.minWeight = edge.weights.weight >= interfaceSettings.minWeight ? true : false;
        
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
    if (settings.nodes)
        minDegree = settings.nodes.minDegree
    else if (interfaceSettings.minDegree)
        minDegree = interfaceSettings.minDegree
    else
        console.warn('Could not load minDegree setting, so moving forward with 0.')
    
    store.nodes.forEach(n=>{
        // set the correct `passes` for every node
        n.passes = {}
        n.passes.minDegree = n.degrees.degree >= interfaceSettings.minDegree ? true : false;
        n.passes.unnamed = n.id.toLowerCase().includes('unnamed') ? false : true;
        
        // set the correct `inGraph` for every node
        if (!document.querySelector(`circle#${node.node_id}`)) {
            node.inGraph = false;
        } else {
            node.inGraph = true;
        }
    });

    return true;
}


/**
 * settingsFromDashboard takes no arguments but loads the current settings.
 * The return value is an object with all of the settings as property values.
 * @returns {Object} - All of the app's settings.
 */
const settingsFromDashboard = (caller=undefined) => {
    let output_msg = [`Called ${caller?"by "+caller:""}`];

    // if settings are not set up, set it all up!
    if (!store.settingsFinished) {
        setupSettingsInterface("settingsFromDashboard");
        store.settingsFinished = true;
    }

    let interfaceSettings = refreshValues('settingsFromDashboard');
    
    ["collide", "charge", "minDegree", "nodeMultiplier", "edgeMultiplier", "minWeight", "linkStrength"].forEach(label=>updateLabel(label, interfaceSettings));

    ensureDisabledLabels(interfaceSettings);

    filterStore(interfaceSettings);

    let mappedInterfaceSettings = {
        nodes: {
            minDegree: interfaceSettings.minDegree,
            nodeMultiplier: interfaceSettings.nodeMultiplier,
            autoClearNodes: interfaceSettings.autoClearNodes,
            autoClearUnnamed: interfaceSettings.autoClearUnnamed,
            stickyNodes: interfaceSettings.stickyNodes,
            //nodeSizeFromCurrent: interfaceSettings.nodeSizeFromCurrent,
            communityDetection: interfaceSettings.communityDetection,
            rFrom: interfaceSettings.rFrom,
            minR: window.autoSettings.nodes.minR,
            maxR: window.autoSettings.nodes.maxR
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
            "filename": interfaceSettings.datafile,
            "bipartite": false
        }
    }
    output_msg.push("Finished");
    output_msg.push(mappedInterfaceSettings);
    _output(output_msg, false, settingsFromDashboard);
    return mappedInterfaceSettings;
};


/**
 * setupSettingsInterface takes no arguments but sets up the settings box correctly, with all the max, min, and step values for UI elements,
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const setupSettingsInterface = (caller = undefined) => {
    _output(`Called ${caller ? "from "+caller : ""}`, false, setupSettingsInterface);
    
    let settings = fetchFromStorage("settings", "setupSettingsInterface");
    
    if (!settings) {
        _output(["Stored settings empty, so reloading from autoSettings.", window.autoSettings], false, setupSettingsInterface, console.warn);
        settings = window.autoSettings;
    }

    window._elements.minWeight.max = d3.max(store.ranges.edgeWidth);
    window._elements.minDegree.max = d3.max(store.ranges.nodeDegree);

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
    window._elements.linkStrength.min = 0.01;
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
    //window._elements.nodeSizeFromCurrent.checked = settings.nodes.nodeSizeFromCurrent;
    // window._elements.weightFromCurrent.checked = settings.edges.weightFromCurrent;
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

    if (window._elements.communityDetection.options.length == 0)
        _output("Warning", false, "Warning: No communityDetection options (setupSettingInteractivity)");
    if (!settings.nodes.communityDetection)
        settings.nodes.communityDetection = '';

    window._elements.communityDetection.value = settings.nodes.communityDetection;

    if (window._elements.startYear.options.length == 0)
        _output("Warning", false, "Warning: No startYear options (setupSettingInteractivity)");
    if (window._elements.endYear.options.length == 0)
        _output("Warning", false, "Warning: No endYear options (setupSettingInteractivity)");
    window._elements.startYear.value = settings.edges.startYear;
    window._elements.endYear.value = settings.edges.endYear;
    
    if (window._elements.weightFrom.options.length == 0)
        _output("Warning", false, "Warning: No weightFrom options (setupSettingInteractivity)");
    window._elements.weightFrom.value = settings.edges.weightFrom;

    if (window._elements.rFrom.options.length == 0)
        _output("Warning", false, "Warning: No rFrom options (setupSettingInteractivity)");
    window._elements.rFrom.value = settings.nodes.rFrom;

    return true;
};


const toggleSetting = (name) => {
    if (window._elements[name].type !== 'checkbox') {
        console.trace(`Cannot toggle ${window._elements[name].type}; must provide value.`)
        return false;
    }

    let currentSettings = refreshValues();
    
    if (!Object.keys(currentSettings).includes(name)) {
        console.trace(`Setting was not found.`);
        return false;
    }

    // console.log(currentSettings[name] === true);
    window._elements[name].click(); // no this is not what we want
}

const editSetting = (name, value) => {
    let currentSettings = refreshValues();

    switch (typeof(currentSettings[name])) {
        case "number":
            console.trace("Cannot toggle number; must provide value.")
            // console.log('number:', name, currentSettings[name]);
            // console.log(window._elements[name].type);
            break;
        case "string":
            // console.log('string:', name, currentSettings[name]);
            break;
        case "boolean":
            // console.log('boolean (checkbox):', name, currentSettings[name]);
            break;
        default:
            // console.log(typeof(currentSettings[name]))
            break;
    };
}

/**
 * changeSetting is a complex function that can change any given setting, and also makes sure to change the UI representation of that value in the settings box. It is also the function that is run every time a setting UI element is changed in the settings box.
 * The return value is always true.
 * @param {string} selector - A CSS selector to the object in question (preferably `#id` but can also be `.class` or `tag`).
 * @param {number|boolean} setTo - The value to set the selector to. Boolean if you want to change a checkbox or similar UI elements. Number if you're changing a number-based UI element.
 * @param {boolean} [_filter] - Set to `true` (default) if you want to end by running `filter()` again (node changes, predominantly).
 * @param {string} [type] - "checkbox" (default), "slider", "dropdown" are valid types.
 * @param {Array} additionalPreFunctions - Array of executables that you want to run _before_ the setting is changed.
 * @param {Array} additionalPostFunctions - Array of executables that you want to run _after_ the setting is changed.
 * @param {boolean} restartSim - Set to `true` (default) if you want to restart the simulation after the setting is updated.
 * @returns {boolean} - true
 */
const changeSetting = ( // TODO: #28 This function needs an overhaul
    selector,
    setTo,
    _filter = true,
    type = "checkbox",
    additionalPreFunctions = [],
    additionalPostFunctions = [],
    restartSim = true
) => {
    _output("Called", false, changeSetting);

    // console.log(selector);
    // console.log(typeof(selector));

    if (typeof selector === "object") {
        setTo = selector.setTo;
        _filter = selector._filter ? selector._filter : true;
        type = selector.type ? selector.type : "checkbox";
        additionalPreFunctions = selector.additionalPreFunctions
            ? selector.additionalPreFunctions
            : [];
        additionalPostFunctions = selector.additionalPostFunctions
            ? selector.additionalPostFunctions
            : [];
        selector = selector.selector;
    }

    let force = false;
    if (setTo === "force") {
        force = true;
        if (type === "checkbox") {
            setTo = d3.select(selector).node().checked;
        } else if (type === "slider") {
            setTo = d3.select(selector).node().value;
        } else if (type === "dropdown") {
            setTo = d3.select(selector).node().value;
        } else {
            console.error("cannot handle this input type yet!");
        }
    }
    if (
        force ||
        (type === "checkbox" && d3.select(selector).node().checked != setTo) ||
        (type === "slider" && d3.select(selector).node().value != setTo)
    ) {
        if (type === "checkbox") {
            d3.select(selector).node().checked = setTo;
        } else if (type === "slider") {
            let maxValue = +d3.select(selector).node().max;
            let minValue = +d3.select(selector).node().min;
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
        // console.log("already correctly set.");
        // console.log(type);
    }
    return true;
};

/**
 * setupSettingInteractivity takes no arguments but is part of the set up of the interactivity in the settings box.
 * The return value is always true.
 * @returns {boolean} - true
 */
const setupSettingInteractivity = () => {
    // dropdown interactivity
    window._selectors.weightFrom.on("change", () => {
        changeSetting("#weightFrom", "force", true, "dropdown");
    });
    window._selectors.rFrom.on("change", () => {
        // changeSetting("#rFrom", "force", true, "dropdown");
        changeSetting("#rFrom", "force", true, "dropdown", [], [], false);
        graph.simulation.restart().alpha(0.05) // just a nudge
    });
    window._selectors.startYear.on("change", () => {
        changeSetting("#startYear", "force", true, "dropdown");
    });
    window._selectors.endYear.on("change", () => {
        changeSetting("#endYear", "force", true, "dropdown");
    });
    window._selectors.datafile.on("change", () => {
        changeSetting("#datafile", "force", true, "dropdown", [], [location.reload()]); // TODO:
    });

    // slider interactivity
    window._selectors.minDegree.on("input", () => {
        updateLabel("minDegree");
        // console.log(filterNodes([], false), "possible nodes?")
    });
    window._selectors.minDegree.on("change", () => {
        changeSetting("#minDegree", "force", true, "slider");
    });
    window._selectors.minWeight.on("input", () => {
        updateLabel("minWeight");
    });
    window._selectors.minWeight.on("change", () => {
        changeSetting("#minWeight", "force", true, "slider");
        filterStore();
        filterEdges();
    });

    window._selectors.nodeMultiplier.on("input", () => {
        changeSetting("#nodeMultiplier", "force", false, "slider", [], [], false);
        graph.simulation.restart().alpha(0.05) // just a nudge
    });
    window._selectors.edgeMultiplier.on("input", () => {
        changeSetting("#edgeMultiplier", "force", false, "slider", [], [], false);
        graph.simulation.restart().alpha(0.05) // just a nudge
    });
    window._selectors.collide.on("input", () => {
        changeSetting("#collide", "force", false, "slider");
    });
    window._selectors.linkStrength.on("input", () => {
        changeSetting("#linkStrength", "force", false, "slider");
    });
    window._selectors.charge.on("input", () => {
        changeSetting("#charge", "force", false, "slider");
    });

    // checkbox interactivity
    window._selectors.autoClearNodes.on("change", () => {
        changeSetting("#autoClearNodes", "force", true);
    });
    window._selectors.autoClearUnnamed.on("change", () => {
        changeSetting("#autoClearUnnamed", "force", true, "checkbox", [], [location.reload()]); // TODO: remove reload here...
        // changeSetting("#autoClearUnnamed", "force", true);
    });
    /*
    window._selectors.weightFromCurrent.on("change", () => {
        changeSetting("#weightFromCurrent", "force", true, "checkbox", [], [], false);
    });
    */
    /*
    window._selectors.nodeSizeFromCurrent.on("change", () => {
        changeSetting("#nodeSizeFromCurrent", "force", true, "checkbox", [], [], false);
    });
    */
    window._selectors.communityDetection.on("change", () => {
        changeSetting("#communityDetection", "force", true, "dropdown", [], [styleGraphElements], false);
        // used to be: changeSetting("#communityDetection", "force", true, "checkbox", [], [styleGraphElements], false);
    });
    window._selectors.layoutCenter.on("change", () => {
        changeSetting("#layoutCenter", "force", false);
    });
    window._selectors.layoutClustering.on("change", () => {
        changeSetting("#layoutClustering", "force", false);
    });
    window._selectors.layoutForceX.on("change", () => {
        changeSetting("#layoutForceX", "force", false);
    });
    window._selectors.layoutForceY.on("change", () => {
        changeSetting("#layoutForceY", "force", false);
    });
    /*
    window._selectors.debugMessages.on("change", () => {
        saveToStorage();
    });
    */

    // checkboxes (special) interactivity
    window._selectors.stickyNodes.on("change", () => {
        changeSetting("#stickyNodes", "force", false, "checkbox", [
            "resetDraw()",
        ]);
    });
    window._selectors.layoutCollide.on("change", () => {
        changeSetting("#layoutCollide", "force", false, "checkbox", [
            "updateLabel('collide', undefined, ensureDisabledLabels)",
        ]);
    });
    window._selectors.layoutCharge.on("change", () => {
        changeSetting("#layoutCharge", "force", false, "checkbox", [
            "updateLabel('charge', undefined, ensureDisabledLabels)",
        ]);
    });

    // simple button interactivity
    window._selectors.switchMode.on("click", function (d) {
        toggleTheme();
    });
    window._selectors.showClusterInfo.on("click", function (d) {
        toggle("#nodeTable");
        if (isVisible("#nodeTable"))
            hide("#quickEdgeInfo");
    });
    window._selectors.nudgeNodes.on("click", function (d) {
        graph.simulation.restart().alpha(0.15);
    });
    window._selectors.resetLocalStorage.on("click", function (d) {
        resetLocalStorage();
    });
    window._selectors.clearUnconnected.on("click", function (d) {
        filterNodesWithoutEdge();
    });
    
    // set up settings containers
    window._selectors.settingsToggle.on("click", (evt) => {
        // console.log(evt)
        toggle("#settingsContainer");
    });
    window._selectors.infoToggle.on("click", () => {
        toggle("#infoToggleDiv");
    });

    // set up collideContainer and chargeContainer (special cases)
    window._selectors.collideContainer.on("click", (event) => {
        if (
            event.target.id === "collide" &&
            window._selectors.collide.attr("disabled") != null
        ) {
            window._elements.layoutCollide.checked = true;
            updateLabel("collide", undefined, ensureDisabledLabels);
        }
    });

    window._selectors.chargeContainer.on("click", (event) => {
        if (
            event.target.id === "charge" &&
            window._selectors.charge.attr("disabled") != null
        ) {
            window._elements.layoutCharge.checked = true;
            updateLabel("charge", undefined, ensureDisabledLabels);
        }
    });
    return true;
};


/**
 * setupKeyHandlers takes no arguments but sets up the key interaction with the network visualization.
 * The return value is always true.
 * @returns {boolean} - true
 */
const setupKeyHandlers = () => {
    // resetting on keyUp
    d3.select("html").on("keyup", (e) => {
        if (e.key === "Meta" || e.key === "Shift") {
            hide(".metaShow");
        }
        if (e.key === "Alt") {
            // toggleCommentedElements(); // moved to button instead
        }
    });

    let numbers = [];
    let years = [];
    let numberModal = new bootstrap.Modal(
        document.getElementById("numberModal"),
        {}
    );

    d3.select("html").on("keydown", (e) => {
        if (e.key === "Meta" || e.key === "Shift") {
            show(".metaShow");
        } else if (e.key === "Alt") {
            //toggleCommentedElements(); // moved to button instead
        } else if (e.key === "Escape" && window.egoNetwork) {
            // console.log("Escape 1 called!");
            egoNetworkOff();
            show("#settings");
            show("#infoContainer");
        } else if (e.key === "Escape" && isVisible("#popupNav")) {
            // console.log("Escape 2 called!");
            toggle("#popupNav");
        } else if (e.key === "Escape" && isVisible("#popup-info")) {
            // console.log("Escape 2 called!");
            hide("#popup-info");
        } else if (e.key === "Escape" && isVisible("#nodeEdgeInfo")) {
            // console.log("Escape 3 called!");
            window.edgeSelected = undefined;
            window.nodeSelected = undefined;
            resetDraw();
        } else if (e.key === "Escape" || e.key === " ") {
            // console.log("Escape 4 called!");
            UIToggleAllSettingBoxes();
        } else if (e.key === "c" && e.metaKey) {
            // console.log("command+c called");
            changeSetting("#autoClearNodes", !settingsFromDashboard("selectKeyDown1").nodes.autoClearNodes);
        } else if (e.key === "+") {
            changeSetting({selector: "#nodeMultiplier", type: "slider", setTo: settingsFromDashboard("selectKeyDown2").nodes.nodeMultiplier+0.25});
        } else if (e.key === "-") {
            changeSetting({selector: "#nodeMultiplier", type: "slider", setTo: settingsFromDashboard("selectKeyDown3").nodes.nodeMultiplier-0.25});
        }
        if (
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(
                e.key
            )
        ) {
            numbers.push(e.key);
            if (years.length === 1) {
                numberModal._element.querySelector("h5").innerText = "End year";
            } else {
                numberModal._element.querySelector("h5").innerText =
                    "Start year";
            }
            numberModal._element.querySelector(
                "h1"
            ).innerText = `${+numbers.join("")}`;
            numberModal.show();
            let t = setTimeout(() => {
                numberModal.hide();
            }, 750);
            if (numbers.length == 4) {
                let year = +numbers.join("");
                if (store.ranges.years.array.includes(year)) {
                    years.push(year);
                } else {
                    console.error(`${year} is not a year in the graph's range.`);
                    // TODO: Stop `t` from timing out, flash the numberModal red, and let the user know that nothing happened
                }
                numbers = [];
                // console.log(years);
                let startYear = undefined,
                    endYear = undefined;
                if (years.length == 2) {
                    startYear = years.slice(-2)[0];
                    endYear = years.slice(-2)[1];
                    // console.log(`setting year range: ${startYear}-${endYear}`);
                    years = [];
                } else if (years.slice(-2).length == 1) {
                    // console.log(`setting start year: ${years[0]}`);
                    startYear = years[0];
                }
                if (startYear)
                    changeSetting({
                        selector: "#startYear",
                        type: "slider",
                        setTo: startYear,
                        _filter: true,
                    });
                if (endYear)
                    changeSetting({
                        selector: "#endYear",
                        type: "slider",
                        setTo: endYear,
                        _filter: true,
                    });
            }
        }
        Object.keys(keyMapping).forEach((key) => {
            if (
                key === e.key &&
                keyMapping[key].noMeta &&
                e.shiftKey == false &&
                e.metaKey == false &&
                e.altKey == false &&
                e.ctrlKey == false
            ) {
                Function(keyMapping[key].noMeta)();
            } else if (
                key === e.key &&
                keyMapping[key].shiftKey &&
                e.shiftKey == true
            ) {
                Function(keyMapping[key].shiftKey)();
            }
        });
    });
    return true;
};


/**
 * setupMiscInteractivity takes no arguments but sets up the miscellaneous interaction with elements in the network visualization, and those UI elements that belong to it.
 * The return value is always true.
 * @returns {boolean} - true
 */
const setupMiscInteractivity = () => {
    d3.selectAll("[data-toggle]").on("click", (event) => {
        event.stopPropagation();
        if (event.target.classList.contains("toggled")) {
            event.target.classList.remove("toggled");
        } else {
            event.target.classList.add("toggled");
        }
        // console.log(event.target);
        toggle("#" + event.target.dataset.toggle);
    });

    d3.select(window).on("resize", transformToWindow);

    // set up clicking on html elements
    graph.svg.on("click", () => {
        if (isVisible("#popup-info")) {
            hide("#popup-info");
        }
    });

    return true;
};

const allSettingsElements = [...document.querySelector("#settings").querySelectorAll("input, select, .btn")].concat([...document.querySelector("#infoContainer").querySelectorAll("input, select, .btn")])

/**
 * disableSettings is called to disable settings.
 * The return value is always true.
 * @param {Array} exclude - identifiers (#ID) for settings to exclude from disabling can be included.
 * @returns {boolean} - true
 */
const disableSettings = (exclude=[]) => {
    let output_msgs = [];
    allSettingsElements.forEach(elem => {
        output_msgs = [`processing element ${elem.id}`]
        if (exclude.includes(elem.id)) {
            // do nothing
            output_msgs.push(`** Skipped ${elem.tagName} element with id ${elem.id}.`)
        } else {
            elem.disabled = true;
            elem.classList.add("disabled");
            output_msgs.push(`disabled ${elem.tagName} element with id ${elem.id}.`)
        }
        _output(output_msgs, false, disableSettings);
    })
}

const enableSettings = (exclude=[]) => {
    allSettingsElements.forEach(elem => {
        if (exclude.includes(elem.id)) {
            // do nothing
        } else {
            elem.disabled = false;
            elem.classList.remove("disabled");
        }
    })
}


const queryStringToSettings = (settings=undefined) => {
    _output("Called", false, queryStringToSettings);
    let output_msgs = [];

    if (!settings)
        settings = fetchFromStorage("settings", "queryStringToSettings");

    if (!settings)
        settings = window.autoSettings

    const urlParams = new URLSearchParams(window.location.search);

    output_msgs.push(`Got query string ${window.location.search}`);

    for (const [key, value] of urlParams) {
        if (!value)
            continue

        switch (key.toLowerCase()) {
            
            case "mindegree":
            case "min_degree":
            case "mindegrees":
                output_msgs.push(`--> set minDegree to ${value}`)
                if (+value) {
                    settings.nodes.minDegree = +value;
                } else {
                    settings.nodes.minDegree = window.autoSettings.nodes.minDegree;
                }
                break;
            
            case "minweight":
            case "min_weight":
            case "minweights":
                if (+value) {
                    settings.edges.minWeight = +value
                } else {
                    settings.edges.minWeight = window.autoSettings.edges.minWeight;
                }
                output_msgs.push(`--> minWeight has been set to ${settings.edges.minWeight}`)
                break;
            
            case "stickynodes":
                settings.nodes.stickyNodes = (value === "true" || value === "1");
                output_msgs.push(`--> stickyNodes has been set to ${settings.nodes.stickyNodes}`)
                break;
            
            /* // TODO #37
            case "community":
            case "communities":
            case "communitydetection":
            case "community-detection":
                settings.nodes.communityDetection = (value === "true" || value === "1");
                output_msgs.push(`--> communityDetection has been set to ${settings.nodes.communityDetection}`)
                break;
            */
        
            case "minzoom": // TODO: #20 The zoom can not be set through query string
            case "min-zoom":
                if (+value) {
                    settings.zoomMin = +value;
                } else {
                    settings.zoomMin = window.autoSettings.zoomMin;
                }
                output_msgs.push(`--> minZoom has been set to to ${settings.zoomMin}`)
                break;

            case "maxzoom": // TODO: #20 The zoom can not be set through query string
            case "max-zoom":
                if (+value) {
                    settings.zoomMax = +value;
                } else {
                    settings.zoomMax = window.autoSettings.zoomMax;
                }
                output_msgs.push(`--> maxZoom has been set to to ${settings.zoomMax}`)
                break;

            case "min-year":
            case "minyear":
            case "start-year":
            case "startyear":
                if (+value) {
                    settings.edges.startYear = +value;
                } else {
                    settings.edges.startYear = window.autoSettings.edges.startYear;
                }
                output_msgs.push(`--> startYear has been set to to ${settings.edges.startYear}`)
                break;

            case "max-year":
            case "maxyear":
            case "end-year":
            case "endyear":
                if (+value) {
                    settings.edges.endYear = +value;
                } else {
                    settings.edges.endYear = window.autoSettings.edges.endYear;
                }
                output_msgs.push(`--> endYear has been set to to ${settings.edges.endYear}`)
                break;


            default:
                _output(`no such setting found: "${key}"`, false, queryStringToSettings, console.error)
        }
    }
    _output(output_msgs, false, queryStringToSettings);
    
    saveToStorage(settings);

    return settings;
}