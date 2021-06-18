const setupDropdown = (sort = "alpha") => {
    console.log("setupDrodown running", sort);
    options = '<option value=""></option>';
    if (sort === "alpha") {
        performerNames = getTravelingPerformers(true).sort();
    } else if (sort === "numeric") {
        compare = (a, b) => {
            at = getTravels(a).length;
            bt = getTravels(b).length;
            if (at > bt) {
                return -1;
            }
            if (at < bt) {
                return 1;
            }
            // a must be equal to b
            return 0;
        };
        performerNames = getTravelingPerformers(true).sort(compare);
    } else {
        throw new Error(
            "Not implemented: You must use alpha or numeric sorting."
        );
    }
    performerNames.forEach((performer) => {
        numTravels = getTravels(performer).length;
        if (numTravels > 0)
            options += `<option value='${performer}'>${performer} (${numTravels})</option>`;
    });
    //console.log(options);
    d3.select("#selectPerformer").node().innerHTML = options;
};

const setupClusterNav = () => {
    d3.select("#clusterList")
        .selectAll("span")
        .data(Object.values(store.clusters))
        .enter()
        .append("span")
        .attr("class", "badge me-1")
        .attr("data-cluster-id", (_, ix) => ix + 1)
        .style("background-color", (_, ix) => store.clusterColors[ix + 1])
        .html((_, ix) => ix + 1);

    d3.select("#clusterList")
        .selectAll("span")
        .each(function (d, ix) {
            d3.select(this).on("click", (evt) => {
                performerNames = store.clusters[this.dataset.clusterId];
                inClusterWithTravel = performerNames.filter(
                    (performerName) => getTravels(performerName).length
                );
                inClusterWithNoTravel = performerNames.filter(
                    (performerName) => getTravels(performerName).length === 0
                );
                if (
                    inClusterWithNoTravel.length ||
                    inClusterWithTravel.length === 0
                ) {
                    if (inClusterWithTravel.length === 0) {
                        warning(
                            `None of the ${
                                performerNames.length
                            } performers in the cluster have registered travels in the dataset${
                                inClusterWithNoTravel.length < 10
                                    ? ": <ul class='mb-0'><li>" +
                                      inClusterWithNoTravel.join("<li>") +
                                      "</ul>"
                                    : "."
                            }`,
                            "alert"
                        );
                    } else {
                        warning(
                            `${inClusterWithNoTravel.length} of the ${
                                performerNames.length
                            } performers in the cluster have no registered travels in the dataset${
                                inClusterWithNoTravel.length < 10
                                    ? ": <ul class='mb-0'><li>" +
                                      inClusterWithNoTravel.join("<li>") +
                                      "</ul>"
                                    : "."
                            }`
                        );
                    }
                }
                if (inClusterWithTravel.length > 40) {
                    console.error("Could not render - too many names");
                    console.log(inClusterWithTravel);
                } else {
                    clearTravels();
                    inClusterWithTravel.forEach((performerName) => {
                        drawAllTravels(
                            performerName,
                            true,
                            store.clusterColors[
                                this.dataset.clusterId
                            ].toString()
                        );
                    });
                }
            });
        });
};

const setupSlider = () => {
    var slider = document.getElementById("slider");

    noUiSlider.create(slider, {
        start: [store.minYear, store.maxYear],
        connect: true,
        step: 1,
        range: {
            min: store.minYear,
            max: store.maxYear,
        },
        pips: {
            mode: "count",
            values: 5,
            density: 5,
        },
        format: {
            // 'to' the formatted value. Receives a number.
            to: function (value) {
                return value;
            },
            from: function (value) {
                return +value;
            },
        },
    });

    slider.noUiSlider.on("slide", (evt) => {
        d3.select("#rangeSpan").html(`${evt[0]}–${evt[1]}`);
        renderCircles();
    });
    slider.noUiSlider.on("set", (evt) => {
        d3.select("#rangeSpan").html(`${evt[0]}–${evt[1]}`);
        renderCircles();
    });
};

const stepButtonClicked = (btnID = "#stepButton", startMin) => {
    clearTravels();
    allYears = [...new Set(store.raw.map((d) => +d.year))].sort();
    setTo = undefined;
    if (d3.select(btnID).node().dataset.currentYear) {
        if (d3.max(allYears) == d3.select(btnID).node().dataset.currentYear) {
            setTo = d3.min(allYears);
        } else {
            setTo = +d3.select(btnID).node().dataset.currentYear + 1;
        }
    } else {
        setTo = d3.min(allYears);
    }
    d3.select(btnID).node().dataset.currentYear = setTo;
    if (startMin) {
        slider.noUiSlider.set([d3.min(allYears), setTo]);
    } else {
        slider.noUiSlider.set([setTo, setTo]);
    }
};

const nodeSizeClicked = () => {
    clearTravels();
    renderCircles();
};

const SVGClicked = () => {
    // console.log("SVG clicked.");
};

const MapClicked = () => {
    // console.log("Map clicked.");
};

d3.select("#stepButtonInclude").on("click", () =>
    stepButtonClicked("#stepButtonInclude", true)
);
d3.select("#stepButton").on("click", () => stepButtonClicked("#stepButton"));

d3.select("#nodeSizeFrom").on("change", nodeSizeClicked);
document.addEventListener("mouseover", () => {
    if (document.body.dataset.travels === "true") {
        slider.setAttribute("disabled", true);
    } else {
        slider.removeAttribute("disabled");
    }
});
d3.select("svg#map").on("click", () => SVGClicked());
store.map.on("click", () => MapClicked());

d3.select("#selectPerformer").on("change", () => {
    if (d3.select("#selectPerformer").node().value == "") {
        clearTravels();
        renderCircles();
    } else {
        drawAllTravels(d3.select("#selectPerformer").node().value);
    }
});
d3.select("#switchMode").on("click", function (d) {
    toggleTheme();
});

document.querySelectorAll(".sortPerformerNames").forEach((element) => {
    d3.select(element).on("click", (evt) => {
        setupDropdown(evt.srcElement.dataset.sort);
    });
});

d3.select(window).on("resize", (evt) => {
    [width, height] = getMapSize();
    centerX = width / 2;
    centerY = height / 2;

    d3.select("svg#map").attr("width", width).attr("height", height);
    store.projection
        .translate([centerX, centerY]) // translate to center of screen
        .scale([2000]); // scale things down so see entire US

    // check if settings is outside
    settingsOutsideWindow =
        +window
            .getComputedStyle(document.querySelector("#settings"))
            .left.replace("px", "") > window.innerWidth;

    if (settingsOutsideWindow) {
        createPopBackSettings();
    }
});

d3.select("#settingsToggle").on("click", (evt) => {
    console.log("clickhandler");
    toggle("#settingsContent");
    evt.stopPropagation();
});

zooming = (event) => {
    if (d3.select("body").classed("no-zoom")) {
        event.sourceEvent.preventDefault();
        event.sourceEvent.stopPropagation();
        return false;
    } else {
        console.log("zoom called..");
        d3.select("g#mapObjects")
            .selectAll("path")
            .attr("transform", event.transform);

        d3.select("g#mapObjects")
            .selectAll("circle")
            .attr("transform", (circle) => {
                return event.transform;
            });

        // change scale of projection
        currentScale = store.projection.scale();
        newScale = event.transform.k * 2000;
        /*
        console.log(
            `Changed scale from ${currentScale.toFixed(
                0
            )} to ${newScale.toFixed(0)}.`
        );
        */
        store.projection.scale(newScale);

        // change offset...
        newX = centerX + event.transform.x;
        newY = centerY + event.transform.y;
        // console.log(newX.toFixed(0), newY.toFixed(0));

        store.projection.translate([newX, newY]);
    }
};

var zoom = d3.zoom().scaleExtent([1, 8]);

zoom.on("zoom", zooming);

d3.select("svg#map").call(zoom);
