_autoSettings = {
    nodes: {
        minDegree: 6,
        autoClearNodes: true,
    },
    edges: {
        minWeight: 0,
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
};

/// save settings to localStorage
const saveSettings = () => {
    // save zoom event transform
    if (d3.event.transform) {
        localStorage.setItem("transform", JSON.stringify(d3.event.transform));
    }
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
    let autoClearNodes = d3.select("#autoClearNodes").node().checked;
    let layoutCenter = d3.select("#layoutCenter").node().checked;
    let layoutForceX = d3.select("#layoutForceX").node().checked;
    let layoutForceY = d3.select("#layoutForceY").node().checked;
    let layoutCollide = d3.select("#layoutCollide").node().checked;
    let layoutCharge = d3.select("#layoutCharge").node().checked;

    updateLabel("collide");
    updateLabel("charge");
    updateLabel("minDegree");
    updateLabel("minWeight");

    return {
        nodes: {
            minDegree: minDegree,
            autoClearNodes: autoClearNodes,
        },
        edges: { minWeight: minWeight },
        force: {
            layoutCenter: layoutCenter,
            layoutForceX: layoutForceX,
            layoutForceY: layoutForceY,
            layoutCharge: layoutCharge,
            layoutCollide: layoutCollide,
            charge: charge,
            collide: collide,
        },
    };
};

const setupSettings = () => {
    let _settings = loadSettings("settings");
    if (_settings) {
        // console.log("has saved settings:", _settings);
    } else {
        _settings = _autoSettings;
        // console.log("auto setup:", _settings);
    }
    // set range for charge
    d3.select("#charge").node().min = -500;
    d3.select("#charge").node().max = 0;

    // set range for collide
    d3.select("#collide").node().min = 0;
    d3.select("#collide").node().max = 1;
    d3.select("#collide").node().step = 0.1;

    // set range for minWeight
    d3.select("#minWeight").node().min = 0;
    d3.select("#minWeight").node().step = 1;

    // set auto values
    d3.select("#minDegree").node().value = _settings.nodes.minDegree;
    d3.select("#minWeight").node().value = _settings.edges.minWeight;
    d3.select("#autoClearNodes").node().checked =
        _settings.nodes.autoClearNodes;
    d3.select("#charge").node().value = _settings.force.charge;
    d3.select("#collide").node().value = _settings.force.collide;
    d3.select("#layoutCenter").node().checked = _settings.force.layoutCenter;
    d3.select("#layoutForceX").node().checked = _settings.force.layoutForceX;
    d3.select("#layoutForceY").node().checked = _settings.force.layoutForceY;
    d3.select("#layoutCharge").node().checked = _settings.force.layoutCharge;
    d3.select("#layoutCollide").node().checked = _settings.force.layoutCollide;
};

/// set up settings
setupSettings();

d3.select("#minDegree").on("input", () => {
    updateLabel("minDegree");
});
d3.select("#minDegree").on("change", () => {
    updateLabel("minDegree");
    filter(); // since it affects the filtering
    saveSettings();
    restart();
    restartLayout();
});
d3.select("#minWeight").on("input", () => {
    updateLabel("minWeight");
});
d3.select("#minWeight").on("change", () => {
    updateLabel("minWeight");
    filter(); // since it affects the filtering
    saveSettings();
    restart();
    restartLayout();
});
d3.select("#charge").on("input", () => {
    updateLabel("charge");
});
d3.select("#charge").on("change", () => {
    // filter();
    restart();
    restartLayout();
    saveSettings();
});
d3.select("#collide").on("input", () => {
    updateLabel("collide");
});
d3.select("#collide").on("change", () => {
    // filter();
    restart();
    restartLayout();
    saveSettings();
});
d3.select("#autoClearNodes").on("change", () => {
    filter();
    restart();
    restartLayout();
    saveSettings();
});
d3.select("#layoutCenter").on("change", () => {
    // console.log("center");
    restart();
    restartLayout();
    saveSettings();
});
d3.select("#layoutForceX").on("change", () => {
    // console.log("forceX");
    restart();
    restartLayout();
    saveSettings();
});
d3.select("#layoutForceY").on("change", () => {
    restart();
    restartLayout();
    saveSettings();
});
d3.select("#layoutCollide").on("change", () => {
    // console.log("collide");
    updateLabel("collide");
    restart();
    restartLayout();
    saveSettings();
});
d3.select("#layoutCharge").on("change", () => {
    // console.log("charge");
    updateLabel("charge");
    restart();
    restartLayout();
    saveSettings();
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

d3.select("#settingsToggle").on("click", () => {
    toggle("#settingsContainer");
});

d3.select("svg").on("click", () => {
    d3.select("#nodeEdgeInfo").classed("d-none", true);
    deselectNodes();
    resetNodesAndEdges();
});

// d3 does not have support for esc in their listener, so adding ES6 here
d3.select("html")
    .node()
    .addEventListener("keydown", (e) => {
        _ = isVisible("#nodeEdgeInfo");
        if (e.key === "Escape" && _) {
            toggle("#nodeEdgeInfo");
            deselectNodes();
            resetNodesAndEdges();
        } else if (e.key === "Escape") {
            toggle("#settingsContainer");
            toggle("#infoContainer");
        }
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
