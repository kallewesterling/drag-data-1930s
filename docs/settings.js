let _autoSettings = {
    nodes: {
        minDegree: 6,
        autoClearNodes: true,
        stickyNodes: true,
        nodeSizeFromCurrent: false,
    },
    edges: {
        minWeight: 0,
        startYear: 1920,
        endYear: 1940,
        weightFromCurrent: false,
    },
    force: {
        charge: -320,
        collide: 0.5,
        layoutCenter: true,
        layoutCharge: true,
        layoutCollide: false,
        layoutForceX: true,
        layoutForceY: true,
    },
    zoom: 1.25,
    edgeMinStroke: 1,
    edgeMaxStroke: 7,
    debugMessages: false,
};

const updateLabel = (name) => {
    // console.log(`updating label ${name}`);
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

/// save settings to localStorage
const saveSettings = () => {
    // save zoom event transform
    if (d3.event && d3.event.transform) {
        localStorage.setItem("transform", JSON.stringify(d3.event.transform));
    }
    // console.log("save settings called...");
    //console.log("saving", { settings });
    settings = getSettings();
    localStorage.setItem("settings", JSON.stringify(settings));
};

const loadSettings = (item) => {
    _ = localStorage.getItem(item);
    if (_) {
        if (_.includes("{")) {
            return JSON.parse(_);
        } else {
            return _;
        }
    } else {
        return undefined;
    }
};

const resetLocalStorage = () => {
    ["theme", "transform", "settings"].forEach((item) => {
        localStorage.removeItem(item);
    });
    debugMessage("Locally stored settings have been reset.");
    window.location.reload();
};

const getSettings = () => {
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

    updateLabel("collide");
    updateLabel("charge");
    updateLabel("minDegree");
    updateLabel("minWeight");

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
        edgeMinStroke: _autoSettings.edgeMinStroke,
        edgeMaxStroke: _autoSettings.edgeMaxStroke,
        debugMessages: debugMessages,
    };
};

const setupSettings = () => {
    let _settings = loadSettings("settings");
    if (_settings) {
        // console.log("has saved settings:", _settings);
    } else {
        _settings = _autoSettings;
        //console.log("auto setup:", _settings);
    }
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
    // d3.select("#startYear").node().value = _settings.edges.startYear; // set up in the d3 load of the JSON
    // d3.select("#endYear").node().value = _settings.edges.endYear; // set up in the d3 load of the JSON
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

/// set up settings
setupSettings();

// dropdowns
d3.select("#startYear").on("change", () => {
    filter(); // since it affects the filtering
    saveSettings();
    restart();
    restartLayout();
});
d3.select("#endYear").on("change", () => {
    filter(); // since it affects the filtering
    saveSettings();
    restart();
    restartLayout();
});

// sliders
d3.select("#minDegree").on("input", () => {
    //updateLabel("minDegree");
    filter();
    saveSettings();
    restart();
    restartLayout();
});

d3.select("#minWeight").on("input", () => {
    //updateLabel("minWeight");
    filter(); // since it affects the filtering
    saveSettings();
    restart();
    restartLayout();
});

d3.select("#charge").on("input", () => {
    // filter();
    restart();
    restartLayout();
    saveSettings();
});
d3.select("#collide").on("input", () => {
    // filter();
    restart();
    restartLayout();
    saveSettings();
});

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
        // console.log(selector.setTo, setTo);
        _filter = selector._filter ? selector._filter : true;
        type = selector.type ? selector.type : "checkbox";
        additionalPreFunctions = selector.additionalPreFunctions
            ? selector.additionalPreFunctions
            : [];
        additionalPostFunctions = selector.additionalPostFunctions
            ? selector.additionalPostFunctions
            : [];
        selector = selector.selector;
        /*
        console.log(
            selector,
            setTo,
            _filter,
            type,
            additionalPreFunctions,
            additionalPostFunctions
        );
        */
    }
    let force = false;
    if (setTo === "force") {
        //console.log("force on: " + setTo);
        force = true;
        if (type === "checkbox") {
            setTo = d3.select(selector).node().checked;
        } else if (type === "slider") {
            setTo = d3.select(selector).node().value;
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
                /*console.log(
                    `${selector}'s setTo (${setTo}) is LARGER than maxValue (${maxValue})`
                );*/
            } else if (setTo <= minValue) {
                setTo = minValue;
                /*console.log(
                    `${selector}'s setTo (${setTo}) is SMALLER than minValue (${minValue})`
                );*/
            }
            d3.select(selector).node().value = setTo;
            updateLabel(selector.slice(1));
        }
        additionalPreFunctions.forEach((func) => {
            Function(func)();
        });
        if (_filter === true) filter();
        restart();
        restartLayout();
        saveSettings();
        additionalPostFunctions.forEach((func) => {
            runFunction(func)();
        });
    } else {
        // console.log("already correctly set.");
    }
};
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
d3.select("#stickyNodes").on("change", () => {
    changeSetting("#stickyNodes", "force", false, "checkbox", ["resetDraw()"]);
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
    // console.log("show all potential nodes...");
    d3.select("#startYear").node().value = Math.min.apply(
        Math,
        [...d3.select("#startYear").node().options].map((d) => d.value)
    );
    d3.select("#endYear").node().value = Math.max.apply(
        Math,
        [...d3.select("#endYear").node().options].map((d) => d.value)
    );
    changeSetting({ selector: "#autoClearNodes", setTo: false });
    d3.select("#minWeight").node().value = 0;
});

d3.select("#settingsToggle").on("click", () => {
    toggle("#settingsContainer");
});

d3.select("#infoToggle").on("click", () => {
    toggle("#infoToggleDiv");
});

const resetDraw = () => {
    // console.log("resetDraw called");
    d3.select("#nodeEdgeInfo").classed("d-none", true);
    deselectNodes();
    resetNodesAndEdges();
};

const UIToggleAllSettingBoxes = () => {
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
};

d3.select("svg").on("click", () => {
    resetDraw();
});

let keyMapping = {
    U: {
        noMeta:
            'changeSetting({selector: "#autoClearNodes", setTo: !getSettings().nodes.autoClearNodes})',
    },
    S: {
        noMeta:
            'changeSetting({selector: "#stickyNodes", setTo: !getSettings().nodes.stickyNodes})',
    },
    ArrowRight: {
        noMeta:
            'changeSetting({selector: "#minDegree", type: "slider", setTo: getSettings().nodes.minDegree+1})',
        shiftKey:
            'changeSetting({selector: "#minWeight", type: "slider", setTo: getSettings().edges.minWeight+1})',
    },
    ArrowLeft: {
        noMeta:
            'changeSetting({selector: "#minDegree", type: "slider", setTo: getSettings().nodes.minDegree-1})',
        shiftKey:
            'changeSetting({selector: "#minWeight", type: "slider", setTo: getSettings().edges.minWeight-1})',
    },
};
d3.select("html")
    .node()
    .addEventListener("keyup", (e) => {
        if (e.key === "Meta") {
            d3.selectAll(".metaShow").classed("d-none", true);
        }
    });
d3.select("html")
    .node()
    .addEventListener("keydown", (e) => {
        console.log(e);
        _ = isVisible("#nodeEdgeInfo");
        if (e.key === "Meta") {
            d3.selectAll(".metaShow").classed("d-none", false);
        }
        if (e.key === "Escape" && _) {
            console.log("Escape 1 called!");
            resetDraw();
        } else if (e.key === "Escape" || e.key === " ") {
            console.log("Escape 2 called!");
            UIToggleAllSettingBoxes();
        } else if (e.key === "c" && e.metaKey) {
            console.log("command+c called");
            changeSetting(
                "#autoClearNodes",
                !getSettings().nodes.autoClearNodes,
                true
            );
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
