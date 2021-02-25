"use strict";

/**
 * resetDraw takes no arguments, but has the purpose of running subordinate functions in the correct order, for resetting the graph to its original look.
 * The return value is always true.
 * @returns {boolean} - true
 */
const resetDraw = () => {
    hide("#nodeEdgeInfo");
    deselectNodes();
    updateGraphElements();
    return true;
};

/**
 * UIToggleAllSettingBoxes takes no arguments, but ensures that all the settings containers on the screen are in/visible to the user when appropriate.
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const UIToggleAllSettingBoxes = () => {
    // if #rationale is visible, just hide that!
    if (bootstrap.Modal.getInstance(document.querySelector('#rationale')) && bootstrap.Modal.getInstance(document.querySelector('#rationale'))._isShown) {
        bootstrap.Modal.getInstance(document.querySelector('#rationale')).hide();
        return true;
    }

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


/**
 * updateLabel takes one required argument, the name of any given label to update. Depending on checkboxes, it may disable slider UI elements.
 * The return value is always true.
 * @param {string} name - The name of the label that needs updating.
 * @returns {boolean} - true
 */
const updateLabel = (name) => {
    [
        ["layoutCharge", "charge", "charge_label"],
        ["layoutCollide", "collide", "collide_label"],
    ].forEach((d) => {
        let disable = d3.select(`#${d[0]}`).node().checked === false;
        d3.select(`#${d[1]}`).node().disabled = disable;
        d3.select(`#${d[2]}`).classed("text-muted", disable);
    });
    let value = d3.select(`#${name}`).node().value;
    
    // special handling
    if (name === 'collide') {
        value = value * 100 + "%";
    } else if (name === 'charge') {
        value = (+value + 1000);
    } else if (name === 'edgeMultiplier') {
        value = value * 100 + "%";
    }
    d3.select(`#${name}_label`).html(`${name} (${value})`);
    return true;
};

/**
 * saveSettings takes no arguments but saves two items to the user's `localStorage`: their current `transform` (zoom) and settings.
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const saveSettings = () => {
    if (d3.event && d3.event.transform) {
        // console.log('saveSettings called - for zoom data...')
        localStorage.setItem("transform", JSON.stringify(d3.event.transform));
        return true;
    }
    let settings = getSettings();
    localStorage.setItem("settings", JSON.stringify(settings));
    return true;
};

/**
 * loadSettings takes one argument, which defines the name of the stored setting to load.
 * The return value is `undefined` in case no item can be found, and a (parsed) object if the item was stringified before it was saved (see `saveSettings`).
 * @param {string} item - The name of the stored setting to load.
 * @returns {Object|string|undefined} - `undefined` in case no setting with the provided name can be found, and a (parsed) object if the item was stringified before it was saved. If no JSON data exists for the saved setting, a string is returned.
 */
const loadSettings = (item) => {
    let rawSetting = localStorage.getItem(item);
    if (rawSetting) {
        if (rawSetting.includes("{")) {
            return JSON.parse(rawSetting);
        } else {
            return rawSetting;
        }
    } else {
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
    debugMessage("Locally stored settings have been reset.");
    window.location.reload();
    return true;
};

/**
 * getSettings takes no arguments but loads the current settings.
 * The return value is an object with all of the settings as property values.
 * @returns {Object} - All of the app's settings.
 */
const getSettings = () => {
    // if settings are not set up, set it all up!
    if (!store.settingsFinished) {
        setupSettings();
        store.settingsFinished = true;
    }

    let charge = +d3.select("#charge").node().value;
    let collide = +d3.select("#collide").node().value;
    let linkStrength = +d3.select("#linkStrength").node().value;
    let minDegree = +d3.select("#minDegree").node().value;
    let nodeMultiplier = +d3.select("#nodeMultiplier").node().value;
    let edgeMultiplier = +d3.select("#edgeMultiplier").node().value;
    let minWeight = +d3.select("#minWeight").node().value;
    let datafile = d3.select("#datafile").node().value;
    let startYear = +d3.select("#startYear").node().value;
    let endYear = +d3.select("#endYear").node().value;
    let autoClearNodes = d3.select("#autoClearNodes").node().checked;
    let nodeSizeFromCurrent = d3.select("#nodeSizeFromCurrent").node().checked;
    let communityDetection = d3.select("#communityDetection").node().checked;
    let weightFromCurrent = d3.select("#weightFromCurrent").node().checked;
    let layoutCenter = d3.select("#layoutCenter").node().checked;
    let layoutClustering = d3.select("#layoutClustering").node().checked;
    let layoutForceX = d3.select("#layoutForceX").node().checked;
    let layoutForceY = d3.select("#layoutForceY").node().checked;
    let layoutCollide = d3.select("#layoutCollide").node().checked;
    let layoutCharge = d3.select("#layoutCharge").node().checked;
    let stickyNodes = d3.select("#stickyNodes").node().checked;
    let debugMessages = d3.select("#debugMessages").node().checked;

    if (!startYear) {
        startYear = _autoSettings.edges.startYear;
    }
    if (!endYear) {
        endYear = _autoSettings.edges.endYear;
    }

    ["collide", "charge", "minDegree", "nodeMultiplier", "edgeMultiplier", "minWeight", "linkStrength"].forEach((label) =>
        updateLabel(label)
    );

    if (!datafile) {
        datafile = _autoSettings.datafile.filename;
    }

    return {
        nodes: {
            minDegree: minDegree,
            nodeMultiplier: nodeMultiplier,
            autoClearNodes: autoClearNodes,
            stickyNodes: stickyNodes,
            nodeSizeFromCurrent: nodeSizeFromCurrent,
            communityDetection: communityDetection
        },
        edges: {
            minWeight: minWeight,
            edgeMultiplier: edgeMultiplier,
            startYear: startYear,
            endYear: endYear,
            weightFromCurrent: weightFromCurrent,
        },
        force: {
            layoutCenter: layoutCenter,
            layoutClustering: layoutClustering,
            layoutForceX: layoutForceX,
            layoutForceY: layoutForceY,
            layoutCharge: layoutCharge,
            layoutCollide: layoutCollide,
            linkStrength: linkStrength,
            charge: charge,
            collide: collide,
        },
        zoom: _autoSettings.zoom,
        zoomMin: _autoSettings.zoomMin,
        zoomMax: _autoSettings.zoomMax,
        edgeMinStroke: _autoSettings.edgeMinStroke,
        edgeMaxStroke: _autoSettings.edgeMaxStroke,
        debugMessages: debugMessages,
        datafile: {
            'filename': datafile,
            'bipartite': false
        }
    };
};

const settingsSetupYearRange = (startYear=undefined, endYear=undefined, do_filter=true) => {
    if (!store.ranges.years.array.length) {
        console.error('Node store ranges need to be loaded before setupSettings is run.');
    } else {
        var options = [];
        store.ranges.years.array.forEach((year) => {
            options.push(`<option value="${year}">${year}</option>`);
        });
    }
    d3.select("#startYear").node().innerHTML = options;
    d3.select("#endYear").node().innerHTML = options;

    if (!startYear)
        startYear = _autoSettings.edges.startYear;

    if (!endYear)
        endYear = _autoSettings.edges.endYear;
    
    let startVal = +d3.select("#startYear").node().value
    let endVal = +d3.select("#endYear").node().value

    d3.select("#startYear").node().value = startYear;
    d3.select("#endYear").node().value = endYear;
    
    if (do_filter && (startVal !== startYear || endVal !== endYear)) {
        filter();
        updateElements();
        updateGraphElements();
        restartSimulation();
    }
}

/**
 * setupSettings takes no arguments but sets up the settings box correctly, with all the max, min, and step values for UI elements,
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const setupSettings = () => {
    let settings = loadSettings("settings") ? loadSettings("settings") : _autoSettings;

    d3.select("#minWeight").node().max = d3.max(store.ranges.edgeWidth);
    d3.select("#minDegree").node().max = d3.max(store.ranges.nodeDegree);

    // set range for nodeMultiplier
    d3.select("#nodeMultiplier").node().min = 1;
    d3.select("#nodeMultiplier").node().max = 5;
    d3.select("#nodeMultiplier").node().step = 0.25;

    // set range for edgeMultiplier
    d3.select("#edgeMultiplier").node().min = 0.05;
    d3.select("#edgeMultiplier").node().max = 5;
    d3.select("#edgeMultiplier").node().step = 0.05;

    // set range for charge
    d3.select("#charge").node().min = -1000;
    d3.select("#charge").node().max = 0;
    d3.select("#charge").node().step = 100;

    // set range for collide
    d3.select("#collide").node().min = 0.05;
    d3.select("#collide").node().max = 1;
    d3.select("#collide").node().step = 0.05;

    // set range for collide
    d3.select("#linkStrength").node().min = 0.05;
    d3.select("#linkStrength").node().max = 1;
    d3.select("#linkStrength").node().step = 0.05;

    // set range for minWeight
    d3.select("#minDegree").node().min = 0;
    d3.select("#minDegree").node().step = 1;

    // set range for minWeight
    d3.select("#minWeight").node().min = 0;
    d3.select("#minWeight").node().step = 1;

    // set auto values
    d3.select("#minDegree").node().value = settings.nodes.minDegree;
    d3.select("#nodeMultiplier").node().value = settings.nodes.nodeMultiplier;
    d3.select("#minWeight").node().value = settings.edges.minWeight;
    d3.select("#startYear").node().value = settings.edges.startYear; // set up in the d3 load of the JSON
    d3.select("#endYear").node().value = settings.edges.endYear; // set up in the d3 load of the JSON
    d3.select("#autoClearNodes").node().checked = settings.nodes.autoClearNodes;
    d3.select("#nodeSizeFromCurrent").node().checked =
        settings.nodes.nodeSizeFromCurrent;
    d3.select("#communityDetection").node().checked =
        settings.nodes.communityDetection;
    d3.select("#weightFromCurrent").node().checked =
        settings.edges.weightFromCurrent;
    d3.select("#charge").node().value = settings.force.charge;
    d3.select("#collide").node().value = settings.force.collide;
    d3.select("#linkStrength").node().value = settings.force.linkStrength;
    d3.select("#layoutCenter").node().checked = settings.force.layoutCenter;
    d3.select("#layoutClustering").node().checked = settings.force.layoutClustering;
    d3.select("#layoutForceX").node().checked = settings.force.layoutForceX;
    d3.select("#layoutForceY").node().checked = settings.force.layoutForceY;
    d3.select("#layoutCharge").node().checked = settings.force.layoutCharge;
    d3.select("#layoutCollide").node().checked = settings.force.layoutCollide;

    d3.select("#stickyNodes").node().checked = settings.nodes.stickyNodes;
    d3.select("#debugMessages").node().checked = settings.debugMessages;
    d3.select("#datafile").node().value = settings.datafile.filename;

    return true;
};

const loadStoreRanges = () => {
    console.info('loadStoreRanges called');
    store.ranges.nodeDegree = d3.extent(store.nodes, (d) => d.degree);
    store.ranges.edgeWidth = d3.extent(store.edges, (d) => d.weight);

    store.ranges.years = {
        min: d3.min(store.edges.map((d) => d.range.start? +d.range.start.substring(0, 4):1930)),
        max: d3.max(store.edges.map((d) => d.range.end? +d.range.end.substring(0, 4):1930 )),
    };
    
    store.ranges.years.array = range(
        store.ranges.years.min,
        store.ranges.years.max,
        1
    );
    
    if (!store.ranges.years.array) {
        console.error('Node store ranges need to be loaded before setupSettings is run.');
    } else {
        var options = [];
        store.ranges.years.array.forEach((year) => {
            options.push(`<option value="${year}">${year}</option>`);
        });
    }

    return store.ranges;
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
const changeSetting = (
    selector,
    setTo,
    _filter = true,
    type = "checkbox",
    additionalPreFunctions = [],
    additionalPostFunctions = [],
    restartSim = true
) => {
    loading("changeSetting called...");
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
        updateElements();
        updateGraphElements();
        if (restartSim) restartSimulation();
        saveSettings();
        additionalPostFunctions.forEach((func) => {
            Function(func)();
        });
    } else {
        console.log("already correctly set.");
        console.log(type);
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
    d3.select("#startYear").on("change", () => {
        changeSetting("#startYear", "force", true, "dropdown");
    });
    d3.select("#endYear").on("change", () => {
        changeSetting("#endYear", "force", true, "dropdown");
    });
    d3.select("#datafile").on("change", () => {
        TODO: changeSetting("#datafile", "force", true, "dropdown", [], [location.reload()]);
    });

    // slider interactivity
    d3.select("#minDegree").on("input", () => {
        updateLabel("minDegree");
        //console.log(filterNodes([], false), "possible nodes?")
    });
    d3.select("#minDegree").on("change", () => {
        changeSetting("#minDegree", "force", true, "slider");
    });
    d3.select("#minWeight").on("input", () => {
        updateLabel('minWeight');
    });
    d3.select("#minWeight").on("change", () => {
        changeSetting("#minWeight", "force", true, "slider");
    });

    d3.select("#nodeMultiplier").on("input", () => {
        changeSetting("#nodeMultiplier", "force", false, "slider", [], [], false);
    });
    d3.select("#edgeMultiplier").on("input", () => {
        changeSetting("#edgeMultiplier", "force", false, "slider", [], [], false);
    });
    d3.select("#collide").on("input", () => {
        changeSetting("#collide", "force", false, "slider");
    });
    d3.select("#linkStrength").on("input", () => {
        changeSetting("#linkStrength", "force", false, "slider");
    });
    d3.select("#charge").on("input", () => {
        changeSetting("#charge", "force", false, "slider");
    });

    // checkbox interactivity
    d3.select("#autoClearNodes").on("change", () => {
        changeSetting("#autoClearNodes", "force", true);
    });
    d3.select("#weightFromCurrent").on("change", () => {
        changeSetting("#weightFromCurrent", "force", true, "checkbox", [], [], false);
    });
    d3.select("#nodeSizeFromCurrent").on("change", () => {
        changeSetting("#nodeSizeFromCurrent", "force", true, "checkbox", [], [], false);
    });
    d3.select("#communityDetection").on("change", () => {
        changeSetting("#communityDetection", "force", true, "checkbox", [], [updateGraphElements], false);
    });
    d3.select("#layoutCenter").on("change", () => {
        changeSetting("#layoutCenter", "force", false);
    });
    d3.select("#layoutClustering").on("change", () => {
        changeSetting("#layoutClustering", "force", false);
    });
    d3.select("#layoutForceX").on("change", () => {
        changeSetting("#layoutForceX", "force", false);
    });
    d3.select("#layoutForceY").on("change", () => {
        changeSetting("#layoutForceY", "force", false);
    });
    d3.select("#debugMessages").on("change", () => {
        saveSettings();
    });

    // checkboxes (special) interactivity
    d3.select("#stickyNodes").on("change", () => {
        changeSetting("#stickyNodes", "force", false, "checkbox", [
            "resetDraw()",
        ]);
    });
    d3.select("#layoutCollide").on("change", () => {
        changeSetting("#layoutCollide", "force", false, "checkbox", [
            'updateLabel("collide")',
        ]);
    });
    d3.select("#layoutCharge").on("change", () => {
        changeSetting("#layoutCharge", "force", false, "checkbox", [
            'updateLabel("charge")',
        ]);
    });

    // simple button interactivity
    d3.select("#switchMode").on("click", function (d) {
        toggleTheme();
    });
    d3.select("#resetLocalStorage").on("click", function (d) {
        resetLocalStorage();
    });
    d3.select("#clearUnconnected").on("click", function (d) {
        filterNodesWithoutEdge();
    });
    d3.select("#showAllPotentialNodes").on("click", function (d) {
        d3.select("#startYear").node().value = store.ranges.years.min;
        d3.select("#endYear").node().value = store.ranges.years.max;
        d3.select("#minWeight").node().value = d3
            .select("#minWeight")
            .node().min;
        changeSetting({ selector: "#autoClearNodes", setTo: false });
    });

    // set up settings containers
    d3.select("#settingsToggle").on("click", () => {
        toggle("#settingsContainer");
    });
    d3.select("#infoToggle").on("click", () => {
        toggle("#infoToggleDiv");
    });

    // set up collideContainer and chargeContainer (special cases)
    d3.select("#collideContainer").on("click", () => {
        if (
            d3.event.target.id === "collide" &&
            d3.select("#collide").attr("disabled") != null
        ) {
            d3.select("#layoutCollide").node().checked = true;
            updateLabel("collide");
        }
    });

    d3.select("#chargeContainer").on("click", () => {
        if (
            d3.event.target.id === "charge" &&
            d3.select("#charge").attr("disabled") != null
        ) {
            d3.select("#layoutCharge").node().checked = true;
            updateLabel("charge");
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
    d3.select("html").on("keyup", () => {
        if (d3.event.key === "Meta" || d3.event.key === "Shift") {
            hide(".metaShow");
        }
        if (d3.event.key === "Alt") {
            // toggleCommentedElements(); // moved to button instead
        }
    });

    let numbers = [];
    let years = [];
    let numberModal = new bootstrap.Modal(
        document.getElementById("numberModal"),
        {}
    );

    d3.select("html").on("keydown", () => {
        let e = d3.event;
        
        if (e.key === "Meta" || e.key === "Shift") {
            show(".metaShow");
        } else if (e.key === "Alt") {
            //toggleCommentedElements(); // moved to button instead
        } else if (e.key === "Escape" && window.egoNetwork) {
            //console.log("Escape 1 called!");
            egoNetworkOff();
            show("#settings");
            show("#infoContainer");
        } else if (e.key === "Escape" && isVisible("#popup-info")) {
            //console.log("Escape 2 called!");
            hide("#popup-info");
        } else if (e.key === "Escape" && isVisible("#nodeEdgeInfo")) {
            //console.log("Escape 3 called!");
            resetDraw();
        } else if (e.key === "Escape" || e.key === " ") {
            //console.log("Escape 4 called!");
            UIToggleAllSettingBoxes();
        } else if (e.key === "c" && e.metaKey) {
            //console.log("command+c called");
            changeSetting(
                "#autoClearNodes",
                !getSettings().nodes.autoClearNodes
            );
        } else if (e.key === "+") {
            changeSetting({selector: "#nodeMultiplier", type: "slider", setTo: getSettings().nodes.nodeMultiplier+0.25});
        } else if (e.key === "-") {
            changeSetting({selector: "#nodeMultiplier", type: "slider", setTo: getSettings().nodes.nodeMultiplier-0.25});
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
                    console.log(`${year} is not a year in the graph's range.`);
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
    d3.selectAll("[data-toggle]").on("click", () => {
        d3.event.stopPropagation();
        if (d3.event.target.classList.contains("toggled")) {
            d3.event.target.classList.remove("toggled");
        } else {
            d3.event.target.classList.add("toggled");
        }
        toggle("#" + d3.event.target.dataset.toggle);
    });

    /*
    d3.select("#toggleInfoBox").on("click", () => {
        toggle("#info-box");
    });
    */

    /*
    d3.select("#info-box").on("click", () => {
        if (d3.event.target.id === "info-box") {
            //console.log("closing info box!");
            toggle("#info-box");
        }
    });
    */

    d3.select(window).on("resize", transformToWindow);

    // set up clicking on html elements
    graph.svg.on("click", () => {
        if (isVisible("#popup-info")) {
            hide("#popup-info");
        }
    });

    return true;
};

const allSettingsElements = [...document.querySelector('#settings').querySelectorAll('input, select, .btn')].concat([...document.querySelector('#infoContainer').querySelectorAll('input, select, .btn')])

/**
 * disableSettings is called to disable settings.
 * The return value is always true.
 * @param {Array} exclude - identifiers (#ID) for settings to exclude from disabling can be included.
 * @returns {boolean} - true
 */
const disableSettings = (exclude=[]) => {
    allSettingsElements.forEach(elem => {
        console.log(`processing element ${elem.id}`)
        if (exclude.includes(elem.id)) {
            // do nothing
            console.info(`** Skipped ${elem.tagName} element with id ${elem.id}.`)
        } else {
            elem.disabled = true;
            elem.classList.add('disabled');
            console.info(`disabled ${elem.tagName} element with id ${elem.id}.`)
        }
    })
}

const enableSettings = (exclude=[]) => {
    allSettingsElements.forEach(elem => {
        if (exclude.includes(elem.id)) {
            // do nothing
        } else {
            elem.disabled = false;
            elem.classList.remove('disabled');
        }
    })
}