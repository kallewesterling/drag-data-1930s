const store = {
    raw: undefined,
    svg: d3.select("svg"),
    performerData: {},
    projection: d3
        .geoAlbersUsa()
        .translate([960 / 2, 500 / 2]) // translate to center of screen
        .scale([1000]), // scale things down so see entire US
    // circleGenerator: d3.geoCircle(),
    graticuleGenerator: d3.geoGraticule(),
};
store.path = d3.geoPath().projection(store.projection);
store.graticules = store.svg.append("g").attr("id", "graticules");
store.map = store.svg.append("g").attr("id", "map");
store.circles = store.svg.append("g").attr("id", "circles");
store.travels = store.svg.append("g").attr("id", "travels");
store.svg.on("click", () => SVGClicked());
store.map.on("click", () => MapClicked());

const graph = {
    locationsByYear: {},
    locationsCount: {},
};

const load = () => {
    d3.json("data/us.json").then((json) => {
        renderMap(json);
    });

    d3.csv("data/geolocated_performers.csv")
        .then((data) => {
            setupStore(data);
        })
        .then(() => {
            setupSlider();
            setupDropdown();
            renderCircles();
        });

    const setupStore = (data) => {
        store.raw = data;
        store.minYear = +d3.min(store.raw, (d) => d.year);
        store.maxYear = +d3.max(store.raw, (d) => d.year);
        store.locationsByYear = getLocationsByYear();

        const hasKey = (key, object) => {
            return Object.keys(object).includes(key);
        };

        store.locationsCount = {};
        d3.range(store.minYear, store.maxYear + 1).forEach((year) => {
            store.locationsByYear[year] = store.locationsByYear[year];
            Object.keys(store.locationsByYear).map((key, outer_ix) => {
                Object.keys(store.locationsByYear[key]).map(
                    (lonlat, inner_ix) => {
                        locationCount = store.locationsByYear[key][lonlat];
                        //console.log(locationCount)
                        if (!hasKey(lonlat, store.locationsCount))
                            store.locationsCount[lonlat] = 0;

                        store.locationsCount[lonlat] += locationCount;
                    }
                );
            });
        });
    };
};

const filterData = (minYear, maxYear) => {
    // console.warn("in filterData");
    // make sure we have minYear and maxYear
    if (!minYear && !maxYear) {
        testSlider = slider.noUiSlider.get();
        if (testSlider) {
            [minYear, maxYear] = testSlider;
        } else {
            console.warn("No minYear and maxYear so setting to extremes");
            minYear = store.minYear;
            maxYear = store.maxYear;
        }
    }

    //console.log(graph);

    d3.range(minYear, maxYear + 1).forEach((year) => {
        graph.locationsByYear[year] = store.locationsByYear[year];
    });

    // reset
    Object.keys(store.locationsCount).forEach((key) => {
        graph.locationsCount[key] = {
            longLat: key,
            total: 0,
        };
    });

    d3.range(minYear, maxYear + 1).forEach((year) => {
        for (const [location, count] of Object.entries(
            graph.locationsByYear[year]
        )) {
            graph.locationsCount[location].total += count;
        }
    });

    graph.locations = Object.values(graph.locationsCount);

    /*
    store.svg.on("click", (evt) => {
        d3.select("#explanation").html(`
            clientX: ${evt.clientX}
            clientY: ${evt.clientY}
            screenX: ${evt.screenX}
            screenY: ${evt.screenY}`);
        console.log(d3.pointer(evt));
    });
    */

    return graph;
};

const renderCircles = () => {
    document.body.dataset.travels = false;

    filterData();

    scale = d3
        .scaleLinear()
        .range([3, 40])
        .domain([
            d3.min(graph.locations, (l) => l.total),
            d3.max(graph.locations, (l) => l.total),
        ]);
    nodeSize = d3.select("#nodeSize").node().checked;

    store.circles
        .selectAll("circle")
        .data(graph.locations, (p) => {
            [lon, lat] = p.longLat.split(", ");
            return getCityFromLonLat(lon, lat);
        })
        .join(
            (enter) =>
                enter
                    .append("circle")
                    .attr("cx", (p) => {
                        projected = store.projection(p.longLat.split(", "));
                        if (projected) return projected[0];
                        return 0;
                    })
                    .attr("cy", (p) => {
                        projected = store.projection(p.longLat.split(", "));
                        if (projected) return projected[1];
                        return 0;
                    })
                    .attr("data-name", (p) => {
                        [lon, lat] = p.longLat.split(", ");
                        return getCityFromLonLat(lon, lat);
                    })
                    .attr("data-lat", (p) => {
                        [lon, lat] = p.longLat.split(", ");
                        return lat;
                    })
                    .attr("data-lon", (p) => {
                        [lon, lat] = p.longLat.split(", ");
                        return lon;
                    })
                    .attr("r", (p) => {
                        if (nodeSize) return scale(p.total);
                        return 5;
                    })
                    .attr("fill", "#ff00006b"),
            (update) =>
                update
                    .transition()
                    .attr("r", (p) => {
                        if (nodeSize) return scale(p.total);
                        return 5;
                    })
                    .attr("data-currentCount", (p) => p.total),
            (exit) => exit.remove()
        );
};

const renderMap = (json) => {
    store.graticules
        .append("path")
        .attr("d", store.path(store.graticuleGenerator()))
        .style("stroke", "#0000000d")
        .style("stroke-width", "1")
        .attr("fill", "none");

    store.map
        .selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", store.path)
        .style("stroke", "#000")
        .style("stroke-width", "1")
        .attr("fill", (d) => {
            if (d.id === "VA") {
                console.log("VA!");
                return "none";
            } else {
                return "#0000000d";
            }
        })
        .attr("data-id", (d) => d.id);
};

const setupDropdown = () => {
    options = '<option value=""></option>';
    getTravelingPerformers(true).forEach((performer) => {
        numTravels = getTravels(performer).length;
        if (numTravels > 0)
            options += `<option value='${performer}'>${performer} (${numTravels})</option>`;
    });
    //console.log(options);
    d3.select("#selectPerformer").node().innerHTML = options;
    d3.select("#selectPerformer").on("change", () => {
        if (d3.select("#selectPerformer").node().value == "") {
            clearTravels();
        } else {
            drawAllTravels(d3.select("#selectPerformer").node().value);
        }
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

const getLocationsByYear = () => {
    let _ = {};
    [...new Set(store.raw.map((d) => d.year))].forEach((year) => {
        _[year] = store.raw
            .filter((d) => d.year == year)
            .map((d) => `${d.lon}, ${d.lat}`);
    });

    let returnVal = {};
    for (const [year, locations] of Object.entries(_)) {
        returnVal[year] = locations.reduce(function (acc, curr) {
            if (typeof acc[curr] == "undefined") {
                acc[curr] = 1;
            } else {
                acc[curr] += 1;
            }

            return acc;
        }, {});
    }

    return returnVal;
};

load();
