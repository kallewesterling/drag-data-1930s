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
    if (name === "collide") {
        value = value * 100 + "%";
    } else if (name === "charge") {
        value = (+value + 1000);
    } else if (name === "edgeMultiplier") {
        value = value * 100 + "%";
    }
    d3.select(`#${name}_label`).html(`${name} (${value})`);
    return true;
};

/**
 * saveToStorage takes no arguments but saves two items to the user's `localStorage`: their current `transform` (zoom) and settings.
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const saveToStorage = (settings=undefined) => {    
    let output_msgs = ["Called"];

    if (d3.event && d3.event.transform) {
        // output("Saving zoom settings", false, saveToStorage)
        output_msgs.push("Saving zoom settings");
        output_msgs.push(d3.event.transform);
        localStorage.setItem("transform", JSON.stringify(d3.event.transform));
        return true;
    }
    
    if (!settings)
        settings = settingsFromDashboard("saveToStorage");

    output_msgs.push("Saving settings");
    output_msgs.push(settings);
    
    localStorage.setItem("settings", JSON.stringify(settings));
    
    output(output_msgs, false, saveToStorage)
    
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
            output([msg, parsed], false, `fetchFromStorage - ${item}`)
            return parsed;
        } else {
            output([msg, rawSetting], false, `fetchFromStorage - ${item}`)
            return rawSetting;
        }
    } else {
        output([msg, `*** \`${item}\` does not exist in localStorage.`], false, `fetchFromStorage - ${item}`);
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


const refreshValues = () => { // TODO: #25 Build into the settings framework...
    output(`Called`, false, refreshValues);
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
                        
                        if (+element.value)
                            value = +element.value;

                        break;

                    default:
                        console.log("Unhandled type", element.type);
                        break;
                }
                break;

            case "select":
                value = element.value;
                if (+element.value)
                    value = +element.value;
                break;

            default:
                //console.log("Unhandled tagname", element.tagName);
                break;
        }

        if (value || element.type === "checkbox")
            _[key] = value;
    }
    return _;
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

    // TODO: #25 Add the refreshValues() here...

    let charge = +window._elements.charge.value;
    let collide = +window._elements.collide.value;
    let linkStrength = +window._elements.linkStrength.value;
    let minDegree = +window._elements.minDegree.value;
    let nodeMultiplier = +window._elements.nodeMultiplier.value;
    let edgeMultiplier = +window._elements.edgeMultiplier.value;
    let minWeight = +window._elements.minWeight.value;
    let datafile = window._elements.datafile.value;
    let startYear = +window._elements.startYear.value;
    let endYear = +window._elements.endYear.value;
    let autoClearNodes = window._elements.autoClearNodes.checked;
    let nodeSizeFromCurrent = window._elements.nodeSizeFromCurrent.checked;
    let communityDetection = window._elements.communityDetection.checked;
    let weightFromCurrent = window._elements.weightFromCurrent.checked;
    let layoutCenter = window._elements.layoutCenter.checked;
    let layoutClustering = window._elements.layoutClustering.checked;
    let layoutForceX = window._elements.layoutForceX.checked;
    let layoutForceY = window._elements.layoutForceY.checked;
    let layoutCollide = window._elements.layoutCollide.checked;
    let layoutCharge = window._elements.layoutCharge.checked;
    let stickyNodes = window._elements.stickyNodes.checked;
    let debugMessages = window._elements.debugMessages.checked;

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

    store.edges.forEach(e=>{
        e.passes = {}
        e.passes.startYear = e.range.startYear > startYear ? true : false;
        e.passes.endYear = e.range.endYear < endYear ? true : false;
        e.passes.minWeight = e.weight >= minWeight ? true : false;
    });

    store.nodes.forEach(n=>{
        n.passes = {}
        n.passes.minDegree = n.degree > minDegree ? true : false;
    });

    let d = {
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
            "filename": datafile,
            "bipartite": false
        }
    }
    output_msg.push("Finished");
    output_msg.push(d);
    output(output_msg, false, settingsFromDashboard);
    return d;
};

const settingsSetupYearRange = (startYear=undefined, endYear=undefined, do_filter=true) => {

    if (!startYear)
        startYear = _autoSettings.edges.startYear;

    if (!endYear)
        endYear = _autoSettings.edges.endYear;
    
    let startVal = +window._elements.startYear.value
    let endVal = +window._elements.endYear.value

    window._elements.startYear.value = startYear;
    window._elements.endYear.value = endYear;
    
    if (do_filter && (startVal !== startYear || endVal !== endYear)) {
        filter();
        setupFilteredElements();
        styleGraphElements();
        restartSimulation();
    }
}

/**
 * setupSettingsInterface takes no arguments but sets up the settings box correctly, with all the max, min, and step values for UI elements,
 * The return value is true in all cases.
 * @returns {boolean} - true
 */
const setupSettingsInterface = (caller = undefined) => {
    output(`Called ${caller ? "from "+caller : ""}`, false, setupSettingsInterface);
    
    let settings = fetchFromStorage("settings", "setupSettingsInterface");
    
    if (!settings) {
        output(["Stored settings empty, so reloading from autoSettings.", _autoSettings], false, setupSettingsInterface, console.warn);
        settings = _autoSettings;
    }

    window._elements.minWeight.max = d3.max(store.ranges.edgeWidth);
    window._elements.minDegree.max = d3.max(store.ranges.nodeDegree);

    // set range for nodeMultiplier
    window._elements.nodeMultiplier.min = 1;
    window._elements.nodeMultiplier.max = 5;
    window._elements.nodeMultiplier.step = 0.25;

    // set range for edgeMultiplier
    window._elements.edgeMultiplier.min = 0.05;
    window._elements.edgeMultiplier.max = 5;
    window._elements.edgeMultiplier.step = 0.05;

    // set range for charge
    window._elements.charge.min = -1000;
    window._elements.charge.max = 0;
    window._elements.charge.step = 100;

    // set range for collide
    window._elements.collide.min = 0.05;
    window._elements.collide.max = 1;
    window._elements.collide.step = 0.05;

    // set range for collide
    window._elements.linkStrength.min = 0.05;
    window._elements.linkStrength.max = 1;
    window._elements.linkStrength.step = 0.05;

    // set range for minWeight
    window._elements.minDegree.min = 0;
    window._elements.minDegree.step = 1;

    // set range for minWeight
    window._elements.minWeight.min = 0;
    window._elements.minWeight.step = 1;

    // set auto values
    window._elements.minDegree.value = settings.nodes.minDegree;
    window._elements.nodeMultiplier.value = settings.nodes.nodeMultiplier;
    window._elements.minWeight.value = settings.edges.minWeight;
    window._elements.autoClearNodes.checked = settings.nodes.autoClearNodes;
    window._elements.nodeSizeFromCurrent.checked =
        settings.nodes.nodeSizeFromCurrent;
    window._elements.communityDetection.checked =
        settings.nodes.communityDetection;
    window._elements.weightFromCurrent.checked =
        settings.edges.weightFromCurrent;
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
    window._elements.debugMessages.checked = settings.debugMessages;
    window._elements.datafile.value = settings.datafile.filename;

    if (window._elements.startYear.options.length == 0)
        output("Warning", false, "Warning: No startYear options (setupSettingInteractivity)");
    if (window._elements.endYear.options.length == 0)
        output("Warning", false, "Warning: No endYear options (setupSettingInteractivity)");
    window._elements.startYear.value = settings.edges.startYear;
    window._elements.endYear.value = settings.edges.endYear;
    
    return true;
};


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
    output("Called", false, changeSetting);
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
    window._elements.startYear.addEventListener("change", () => {
        changeSetting("#startYear", "force", true, "dropdown");
    });
    window._elements.endYear.addEventListener("change", () => {
        changeSetting("#endYear", "force", true, "dropdown");
    });
    window._selectors["datafile"].on("change", () => {
        TODO: changeSetting("#datafile", "force", true, "dropdown", [], [location.reload()]);
    });

    // slider interactivity
    window._elements.minDegree.addEventListener("input", () => {
        updateLabel("minDegree");
        //console.log(filterNodes([], false), "possible nodes?")
    });
    window._elements.minDegree.addEventListener("change", () => {
        changeSetting("#minDegree", "force", true, "slider");
    });
    window._selectors["minWeight"].on("input", () => {
        updateLabel("minWeight");
    });
    window._selectors["minWeight"].on("change", () => {
        changeSetting("#minWeight", "force", true, "slider");
    });

    window._selectors["nodeMultiplier"].on("input", () => {
        changeSetting("#nodeMultiplier", "force", false, "slider", [], [], false);
        graph.simulation.restart().alpha(0.05) // just a nudge
    });
    window._selectors["edgeMultiplier"].on("input", () => {
        changeSetting("#edgeMultiplier", "force", false, "slider", [], [], false);
        graph.simulation.restart().alpha(0.05) // just a nudge
    });
    window._selectors["collide"].on("input", () => {
        changeSetting("#collide", "force", false, "slider");
    });
    window._selectors["linkStrength"].on("input", () => {
        changeSetting("#linkStrength", "force", false, "slider");
    });
    window._elements.charge.addEventListener("input", () => {
        changeSetting("#charge", "force", false, "slider");
    });

    // checkbox interactivity
    window._selectors["autoClearNodes"].on("change", () => {
        changeSetting("#autoClearNodes", "force", true);
    });
    window._selectors["weightFromCurrent"].on("change", () => {
        changeSetting("#weightFromCurrent", "force", true, "checkbox", [], [], false);
    });
    window._selectors["nodeSizeFromCurrent"].on("change", () => {
        changeSetting("#nodeSizeFromCurrent", "force", true, "checkbox", [], [], false);
    });
    window._selectors["communityDetection"].on("change", () => {
        changeSetting("#communityDetection", "force", true, "checkbox", [], [styleGraphElements], false);
    });
    window._selectors["layoutCenter"].on("change", () => {
        changeSetting("#layoutCenter", "force", false);
    });
    window._selectors["layoutClustering"].on("change", () => {
        changeSetting("#layoutClustering", "force", false);
    });
    window._selectors["layoutForceX"].on("change", () => {
        changeSetting("#layoutForceX", "force", false);
    });
    window._selectors["layoutForceY"].on("change", () => {
        changeSetting("#layoutForceY", "force", false);
    });
    window._selectors["debugMessages"].on("change", () => {
        saveToStorage();
    });

    // checkboxes (special) interactivity
    window._selectors["stickyNodes"].on("change", () => {
        changeSetting("#stickyNodes", "force", false, "checkbox", [
            "resetDraw()",
        ]);
    });
    window._selectors["layoutCollide"].on("change", () => {
        changeSetting("#layoutCollide", "force", false, "checkbox", [
            "updateLabel('collide')",
        ]);
    });
    window._selectors["layoutCharge"].on("change", () => {
        changeSetting("#layoutCharge", "force", false, "checkbox", [
            "updateLabel('charge')",
        ]);
    });

    // simple button interactivity
    window._selectors["switchMode"].on("click", function (d) {
        toggleTheme();
    });
    window._selectors["showClusterInfo"].on("click", function (d) {
        toggle("#nodeTable");
    });
    window._selectors["nudgeNodes"].on("click", function (d) {
        graph.simulation.restart().alpha(0.15);
    });
    window._selectors["resetLocalStorage"].on("click", function (d) {
        resetLocalStorage();
    });
    window._selectors["clearUnconnected"].on("click", function (d) {
        filterNodesWithoutEdge();
    });
    
    // set up settings containers
    window._selectors["settingsToggle"].on("click", () => {
        toggle("#settingsContainer");
    });
    window._selectors["infoToggle"].on("click", () => {
        toggle("#infoToggleDiv");
    });

    // set up collideContainer and chargeContainer (special cases)
    window._selectors["collideContainer"].on("click", () => {
        if (
            d3.event.target.id === "collide" &&
            window._selectors["collide"].attr("disabled") != null
        ) {
            window._elements.layoutCollide.checked = true;
            updateLabel("collide");
        }
    });

    window._selectors["chargeContainer"].on("click", () => {
        if (
            d3.event.target.id === "charge" &&
            window._elements.charge.attr("disabled") != null
        ) {
            window._elements.layoutCharge.checked = true;
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
                !settingsFromDashboard("selectKeyDown1").nodes.autoClearNodes
            );
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
        console.log(d3.event.target);
        toggle("#" + d3.event.target.dataset.toggle);
    });

    /*
    window._selectors["toggleInfoBox"].on("click", () => {
        toggle("#info-box");
    });
    */

    /*
    window._selectors["info-box"].on("click", () => {
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
        output(output_msgs, false, disableSettings);
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
    output("Called", false, queryStringToSettings);
    let output_msgs = [];

    if (!settings)
        settings = fetchFromStorage("settings", "queryStringToSettings");

    if (!settings)
        settings = _autoSettings

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
                    settings.nodes.minDegree = _autoSettings.nodes.minDegree;
                }
                break;
            
            case "minweight":
            case "min_weight":
            case "minweights":
                if (+value) {
                    settings.edges.minWeight = +value
                } else {
                    settings.edges.minWeight = _autoSettings.edges.minWeight;
                }
                output_msgs.push(`--> minWeight has been set to ${settings.edges.minWeight}`)
                break;
            
            case "stickynodes":
                settings.nodes.stickyNodes = (value === "true" || value === "1");
                output_msgs.push(`--> stickyNodes has been set to ${settings.nodes.stickyNodes}`)
                break;
            
            case "community":
            case "communities":
            case "communitydetection":
            case "community-detection":
                settings.nodes.communityDetection = (value === "true" || value === "1");
                output_msgs.push(`--> communityDetection has been set to ${settings.nodes.communityDetection}`)
                break;
        
            case "minzoom": // TODO: #20 The zoom can not be set through query string
            case "min-zoom":
                if (+value) {
                    settings.zoomMin = +value;
                } else {
                    settings.zoomMin = _autoSettings.zoomMin;
                }
                output_msgs.push(`--> minZoom has been set to to ${settings.zoomMin}`)
                break;

            case "maxzoom": // TODO: #20 The zoom can not be set through query string
            case "max-zoom":
                if (+value) {
                    settings.zoomMax = +value;
                } else {
                    settings.zoomMax = _autoSettings.zoomMax;
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
                    settings.edges.startYear = _autoSettings.edges.startYear;
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
                    settings.edges.endYear = _autoSettings.edges.endYear;
                }
                output_msgs.push(`--> endYear has been set to to ${settings.edges.endYear}`)
                break;


            default:
                output(`no such setting found: "${key}"`, false, queryStringToSettings, console.error)
        }
    }
    output(output_msgs, false, queryStringToSettings);
    
    saveToStorage(settings);

    return settings;
}