"use strict";

/**
 * resetDraw takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const resetDraw = () => {
    d3.select("#nodeEdgeInfo").classed("d-none", true);
    deselectNodes();
    resetNodesAndEdges();
};

/**
 * UIToggleAllSettingBoxes takes no arguments, but ensures that all the settings containers on the screen are in/visible to the user when appropriate.
 * The return value is true in all cases.
 */
const UIToggleAllSettingBoxes = () => {
    // if #info-box is visible, just hide that!
    if (isVisible("#info-box")) {
        toggle("#info-box");
        return true;
    }

    // toggle all the settings containers to the correct state!
    if (isVisible("#settingsContainer") && !isVisible("#infoToggleDiv")) {
        toggle("#settingsContainer");
    } else if (
        !isVisible("#settingsContainer") &&
        isVisible("#infoToggleDiv")
    ) {
        toggle("#infoToggleDiv");
    } else {
        toggle("#settingsContainer");
        toggle("#infoToggleDiv");
    }
    return true;
};

/**
 * transformToWindow takes no arguments but sets the `transform` attribute on the `plot` property in the `g` object to the height and width of the user's viewport.
 * The return value is true in all cases.
 */
const transformToWindow = () => {
    graph.plot.attr(
        "transform",
        `translate(${window.innerWidth / 2}, ${window.innerHeight / 2})`
    );
    return true;
};

/**
 * updateLabel takes X argument/s... TODO: Finish this.
 * The return value is ...
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
    let value = d3.select("#" + name).node().value;
    d3.select("#" + name + "_label").html(name + ` (${value})`);
};

/**
 * saveSettings takes no arguments but saves two items to the user's `localStorage`: their current `transform` (zoom) and settings.
 * The return value is true in all cases.
 */
const saveSettings = () => {
    if (d3.event && d3.event.transform) {
        localStorage.setItem("transform", JSON.stringify(d3.event.transform));
    }
    let settings = getSettings();
    localStorage.setItem("settings", JSON.stringify(settings));
    return true;
};

/**
 * loadSettings takes one argument, which defines the name of the stored setting to load.
 * The return value is `undefined` in case no item can be found, and a (parsed) object if the item was stringified before it was saved (see `saveSettings`).
 * @param {string} item - The name of the stored setting to load
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
 * resetLocalStorage takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const resetLocalStorage = () => {
    ["theme", "transform", "settings"].forEach((item) => {
        localStorage.removeItem(item);
    });
    debugMessage("Locally stored settings have been reset.");
    return window.location.reload();
};

/**
 * getSettings takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const getSettings = () => {
    // if settings are not set up, set it all up!
    if (!store.settingsFinished) {
        setupSettings();
        store.settingsFinished = true;
    }

    let charge = +d3.select("#charge").node().value;
    let collide = +d3.select("#collide").node().value;
    let minDegree = +d3.select("#minDegree").node().value;
    let minWeight = +d3.select("#minWeight").node().value;
    let startYear = +d3.select("#startYear").node().value;
    let endYear = +d3.select("#endYear").node().value;
    let autoClearNodes = d3.select("#autoClearNodes").node().checked;
    let nodeSizeFromCurrent = d3.select("#nodeSizeFromCurrent").node().checked;
    let weightFromCurrent = d3.select("#weightFromCurrent").node().checked;
    let layoutCenter = d3.select("#layoutCenter").node().checked;
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

    ["collide", "charge", "minDegree", "minWeight"].forEach((label) =>
        updateLabel(label)
    );

    return {
        nodes: {
            minDegree: minDegree,
            autoClearNodes: autoClearNodes,
            stickyNodes: stickyNodes,
            nodeSizeFromCurrent: nodeSizeFromCurrent,
        },
        edges: {
            minWeight: minWeight,
            startYear: startYear,
            endYear: endYear,
            weightFromCurrent: weightFromCurrent,
        },
        force: {
            layoutCenter: layoutCenter,
            layoutForceX: layoutForceX,
            layoutForceY: layoutForceY,
            layoutCharge: layoutCharge,
            layoutCollide: layoutCollide,
            charge: charge,
            collide: collide,
        },
        zoom: _autoSettings.zoom,
        zoomMin: _autoSettings.zoomMin,
        zoomMax: _autoSettings.zoomMax,
        edgeMinStroke: _autoSettings.edgeMinStroke,
        edgeMaxStroke: _autoSettings.edgeMaxStroke,
        debugMessages: debugMessages,
    };
};

/**
 * setupSettings takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const setupSettings = () => {
    let _settings = loadSettings("settings")
        ? loadSettings("settings")
        : _autoSettings;

    d3.select("#minWeight").node().max = store.ranges.edgeWidth[1];
    d3.select("#minDegree").node().max = store.ranges.nodeDegree[1];

    var options = [];
    store.ranges.years.array.forEach((year) => {
        options.push(`<option value="${year}">${year}</option>`);
    });
    d3.select("#startYear").node().innerHTML = options;
    d3.select("#endYear").node().innerHTML = options;

    // set range for charge
    d3.select("#charge").node().min = -500;
    d3.select("#charge").node().max = 0;

    // set range for collide
    d3.select("#collide").node().min = 0;
    d3.select("#collide").node().max = 1;
    d3.select("#collide").node().step = 0.1;

    // set range for minWeight
    d3.select("#minDegree").node().min = 0;
    d3.select("#minDegree").node().step = 1;

    // set range for minWeight
    d3.select("#minWeight").node().min = 0;
    d3.select("#minWeight").node().step = 1;

    // set auto values
    d3.select("#minDegree").node().value = _settings.nodes.minDegree;
    d3.select("#minWeight").node().value = _settings.edges.minWeight;
    d3.select("#startYear").node().value = _settings.edges.startYear; // set up in the d3 load of the JSON
    d3.select("#endYear").node().value = _settings.edges.endYear; // set up in the d3 load of the JSON
    d3.select("#autoClearNodes").node().checked =
        _settings.nodes.autoClearNodes;
    d3.select("#nodeSizeFromCurrent").node().checked =
        _settings.nodes.nodeSizeFromCurrent;
    d3.select("#weightFromCurrent").node().checked =
        _settings.edges.weightFromCurrent;
    d3.select("#charge").node().value = _settings.force.charge;
    d3.select("#collide").node().value = _settings.force.collide;
    d3.select("#layoutCenter").node().checked = _settings.force.layoutCenter;
    d3.select("#layoutForceX").node().checked = _settings.force.layoutForceX;
    d3.select("#layoutForceY").node().checked = _settings.force.layoutForceY;
    d3.select("#layoutCharge").node().checked = _settings.force.layoutCharge;
    d3.select("#layoutCollide").node().checked = _settings.force.layoutCollide;

    d3.select("#stickyNodes").node().checked = _settings.nodes.stickyNodes;
    d3.select("#debugMessages").node().checked = _settings.debugMessages;
};

/**
 * changeSetting takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const changeSetting = (
    selector,
    setTo,
    _filter = true,
    type = "checkbox",
    additionalPreFunctions = [],
    additionalPostFunctions = []
) => {
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
        restart();
        restartLayout();
        saveSettings();
        additionalPostFunctions.forEach((func) => {
            runFunction(func)();
        });
    } else {
        console.log("already correctly set.");
    }
};

/**
 * setEventHandlers takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const setEventHandlers = () => {
    // set change event handlers - for dropdowns
    d3.select("#startYear").on("change", () => {
        changeSetting("#startYear", "force", true, "dropdown");
    });
    d3.select("#endYear").on("change", () => {
        changeSetting("#endYear", "force", true, "dropdown");
    });

    // set change event handlers - for sliders
    d3.select("#minDegree").on("input", () => {
        changeSetting("#minDegree", "force", true, "slider");
    });
    d3.select("#minWeight").on("input", () => {
        changeSetting("#minWeight", "force", true, "slider");
    });
    d3.select("#collide").on("input", () => {
        changeSetting("#collide", "force", false, "slider");
    });
    d3.select("#charge").on("input", () => {
        changeSetting("#charge", "force", false, "slider");
    });

    // set change event handlers - for checkboxes
    d3.select("#autoClearNodes").on("change", () => {
        changeSetting("#autoClearNodes", "force", true);
    });
    d3.select("#weightFromCurrent").on("change", () => {
        changeSetting("#weightFromCurrent", "force", true);
    });
    d3.select("#nodeSizeFromCurrent").on("change", () => {
        changeSetting("#nodeSizeFromCurrent", "force", true);
    });
    d3.select("#layoutCenter").on("change", () => {
        changeSetting("#layoutCenter", "force", false);
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

    // set change event handlers - for checkboxes with special functions
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

    // set change handlers for simple buttons
    d3.select("#switchMode").on("click", function (d) {
        toggleTheme();
    });
    d3.select("#resetLocalStorage").on("click", function (d) {
        resetLocalStorage();
    });
    d3.select("#clearUnconnected").on("click", function (d) {
        dropNodesWithNoEdges();
    });
    d3.select("#showAllPotentialNodes").on("click", function (d) {
        d3.select("#startYear").node().value = store.ranges.years.min;
        d3.select("#endYear").node().value = store.ranges.years.max;
        d3.select("#minWeight").node().value = d3
            .select("#minWeight")
            .node().min;
        changeSetting({ selector: "#autoClearNodes", setTo: false });
    });

    // set up clicking on html elements
    graph.svg.on("click", () => {
        if (isVisible("#popup-info")) {
            hide("#popup-info");
        }
    });

    // set up settings containers
    d3.select("#settingsToggle").on("click", () => {
        toggle("#settingsContainer");
    });
    d3.select("#infoToggle").on("click", () => {
        toggle("#infoToggleDiv");
    });
};

/**
 * setCommentVisibilityForNodesAndEdges takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const setCommentVisibilityForNodesAndEdges = () => {
    const isSourceOrTarget = (n) => {
        let commentedEdges = graph.edges.filter(d=>d.has_comments || d.has_general_comments)
        let isSource = commentedEdges.map(d=>d.source.node_id).includes(n.node_id)
        let isTarget = commentedEdges.map(d=>d.target.node_id).includes(n.node_id)
        return isSource || isTarget;
    }

    // Nodes with comments
    d3.selectAll("circle.has-comments")
        .transition()
        .attr("r", (n) => {
            return Math.sqrt(n.comments.length) * 5;
        });
    
    // Nodes with no comments
    d3.selectAll(
        "circle:not(.has-comments)"
    )
        .transition()
        .attr("r", (n) => {
            if (isSourceOrTarget(n)) {
                return 3; // make small circles for those that are connected to edges with comment
            } else {
                return 0; // hide circles with no comments
            }
        })
        .attr('class', (n) => {
            if (isSourceOrTarget(n)) {
                return 'node disabled'; // change class for these
            } else {
                return getNodeClass(n); // don't change class for others
            }
        });

    // Text with comments
    d3.selectAll("text.label.has-comments")
        .transition()
        .attr("font-size", 10);

    // Text with no comments
    d3.selectAll("text.label:not(.has-comments)")
        .transition().attr('opacity', (n) => {
            if (isSourceOrTarget(n)) {
                return 0.1;
            } else {
                return 0.01;
            }
            })
        .attr('font-size', (n) => {
            if (isSourceOrTarget(n)) {
                return 6;
            } else {
                return 0;
            }
        });
    
    // Edges with no comments
    d3.selectAll("line:not(.has-comments)")
        .classed('disabled', true)
        .transition()
        .attr("stroke-opacity", 0.01);

}

/**
 * setKeyHandlers takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const setKeyHandlers = () => {
    d3.select("html")
        .node()
        .addEventListener("keyup", (e) => {
            if (e.key === "Meta" || e.key === "Shift") {
                d3.selectAll(".metaShow").classed("d-none", true);
            }
            if (e.key === "Alt") {
                if (!window.egoNetwork) {
                    resetDraw();
                    // hide("#popup-info");
                } else {
                    console.log('window has ego network...')
                    // TODO: If ego network is open, and alt key is pressed and then released, we want to reset view?
                }
            }
        });

    let numbers = [];
    let years = [];
    let numberModal = new bootstrap.Modal(
        document.getElementById("numberModal"),
        {}
    );

    d3.select("html")
        .node()
        .addEventListener("keydown", (e) => {
            if (e.key === "Meta" || e.key === "Shift") {
                d3.selectAll(".metaShow").classed("d-none", false);
            }
            if (e.key === "Alt") {
                setCommentVisibilityForNodesAndEdges();
            }
            if (e.key === "Escape" && isVisible("#popup-info")) {
                //console.log("Escape 1 called!");
                hide("#popup-info");
            } else if (e.key === "Escape" && isVisible("#nodeEdgeInfo")) {
                //console.log("Escape 2 called!");
                resetDraw();
            } else if (e.key === "Escape" || e.key === " ") {
                //console.log("Escape 3 called!");
                UIToggleAllSettingBoxes();
            } else if (e.key === "c" && e.metaKey) {
                //console.log("command+c called");
                changeSetting(
                    "#autoClearNodes",
                    !getSettings().nodes.autoClearNodes,
                    true
                );
            }
            if (
                [
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "0",
                    "-",
                ].includes(e.key)
            ) {
                numbers.push(e.key);
                if (years.length === 1) {
                    numberModal._element.querySelector("h5").innerText =
                        "End year";
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
                        console.log(
                            `${year} is not a year in the graph's range.`
                        );
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
};

/**
 * setMiscHandlers takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const setMiscHandlers = () => {
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

    d3.selectAll("[data-toggle]").on("click", () => {
        d3.event.stopPropagation();
        if (d3.event.target.classList.contains("toggled")) {
            d3.event.target.classList.remove("toggled");
        } else {
            d3.event.target.classList.add("toggled");
        }
        toggle("#" + d3.event.target.dataset.toggle);
    });

    d3.select("#toggleInfoBox").on("click", () => {
        toggle("#info-box");
    });

    d3.select("#info-box").on("click", () => {
        if (d3.event.target.id === "info-box") {
            //console.log("closing info box!");
            toggle("#info-box");
        }
    });

    d3.select(window).on("resize", transformToWindow);
};
