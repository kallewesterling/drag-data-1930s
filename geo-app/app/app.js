const load = () => {
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

    const setupMap = () => {
        d3.json("data/us.json").then((json) => {
            renderMap(json);
        });
    };

    const setupNetworkData = () => {
        d3.json(
            "../network-app/data/co-occurrence-grouped-by-14-days-no-unnamed-performers.json"
        )
            .then((data) => {
                store.networkData = data;
            })
            .then(() => {
                store.modularitiesArray = store.networkData.nodes.map(
                    (node) => [node.id, node.modularities.Louvain]
                );
                clusters = [
                    ...new Set(store.modularitiesArray.map((n) => n[1])),
                ];
                store.clusterColors = {};
                colorScale = d3.scaleLinear().domain([0, clusters.length]);
                clusters.forEach((cluster) => {
                    color = d3.interpolateYlGnBu(colorScale(cluster));
                    color = d3.rgb(color).darker(0.3);
                    store.clusterColors[cluster] = color;
                    store.clusters[cluster + 1] = store.modularitiesArray
                        .filter((n) => n[1] == cluster)
                        .map((n) => n[0]);
                });
                setupClusterNav();
            });
    };
    setupNetworkData();

    const setupStore = (data) => {
        store.raw = data;
        store.minYear = +d3.min(store.raw, (d) => d.year);
        store.maxYear = +d3.max(store.raw, (d) => d.year);
        store.locationsByYear = getLocationsByYear();

        store.locationsCount = {};
        d3.range(store.minYear, store.maxYear + 1).forEach((year) => {
            store.locationsByYear[year] = store.locationsByYear[year];
            Object.keys(store.locationsByYear).map((key, outer_ix) => {
                Object.keys(store.locationsByYear[key]).map(
                    (lonLat, inner_ix) => {
                        locationCount = store.locationsByYear[key][lonLat];
                        if (!hasKey(lonLat, store.locationsCount))
                            store.locationsCount[lonLat] = 0;

                        store.locationsCount[lonLat] += locationCount;
                    }
                );
            });
        });

        store.locationYearPair = {};
        Object.entries(store.locationsByYear).forEach((entry) => {
            [year, data] = entry;
            if (!hasKey(year, store.locationYearPair))
                store.locationYearPair[year] = {};
            Object.entries(data).forEach((entry) => {
                [lonLat, count] = entry;
                store.locationYearPair[year][lonLat] = count;
            });
        });
    };

    d3.csv("data/geolocated_performers.csv")
        .then((data) => {
            setupStore(data);
        })
        .then(() => {
            setupMap();
            setupSlider();
            setupDropdown();
            renderCircles();
        });
};

const getMaxYearMinYear = () => {
    testSlider = slider.noUiSlider.get();
    if (testSlider) {
        [minYear, maxYear] = testSlider;
    } else {
        console.warn("No minYear and maxYear so setting to extremes");
        minYear = store.minYear;
        maxYear = store.maxYear;
    }
    return [minYear, maxYear];
};

const renderCircles = () => {
    const filterData = (minYear, maxYear) => {
        // console.warn("in filterData");
        // make sure we have minYear and maxYear
        if (!minYear && !maxYear) {
            [minYear, maxYear] = getMaxYearMinYear();
        }

        validYears = d3.range(minYear, maxYear + 1);

        Object.entries(store.locationYearPair).forEach((meta) => {
            const [year, values] = meta;
            if (validYears.includes(+year)) {
                Object.entries(values).forEach((locInfo) => {
                    [lonLat, count] = locInfo;
                    currentIndex = graph.circleData.findIndex(
                        (obj) =>
                            obj.year === `${year}` && obj.lonLat === `${lonLat}`
                    );
                    if (currentIndex !== -1) {
                        // found, no need to add it? or should we verify count here?
                    } else {
                        [lon, lat] = lonLat.split(", ");
                        city = getCityFromLonLat(lon, lat);
                        graph.circleData.push({
                            year: year,
                            lonLat: lonLat,
                            count: count,
                            lon: lon,
                            lat: lat,
                            city: city,
                        });
                    }
                });
            } else {
                Object.entries(values).forEach((locInfo) => {
                    [lonLat, count] = locInfo;
                    currentIndex = graph.circleData.findIndex(
                        (obj) =>
                            obj.year === `${year}` && obj.lonLat === `${lonLat}`
                    );
                    if (currentIndex !== -1) {
                        graph.circleData.splice(currentIndex, 1);
                    } else {
                    }
                });
            }
        });

        collected = [];
        graph.cityData = {};
        graph.circleData
            .map((d) => d.city)
            .forEach((city) => {
                graph.circleData
                    .filter((c) => c.city === city)
                    .forEach((c) => {
                        if (!collected.includes(`${city}, ${c.year}`)) {
                            graph.cityData[city] = graph.cityData[city]
                                ? graph.cityData[city]
                                : {
                                      lat: c.lat,
                                      lon: c.lon,
                                      lonLat: c.lonLat,
                                      label: c.city,
                                  };
                            graph.cityData[city].count = graph.cityData[city]
                                .count
                                ? graph.cityData[city].count + c.count
                                : c.count;
                            collected.push(`${city}, ${c.year}`);
                        }
                    });
            });

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

        return graph;
    };

    document.body.dataset.travels = false;

    filterData();

    if (d3.select("#nodeSizeFrom").node().value === "relativeCount") {
        store.scale.domain([
            d3.min(graph.locations, (l) => l.total),
            d3.max(graph.locations, (l) => l.total),
        ]);
    } else if (d3.select("#nodeSizeFrom").node().value === "absoluteCount") {
        console.log("absolute count... TODO");
        store.scale.domain([0, 1000]);
    } else {
        console.log("none count...");
        store.scale.domain([0.1, 0.1]);
    }

    const getR = (p) => {
        if (
            d3.select("#nodeSizeFrom").node().value === "relativeCount" ||
            d3.select("#nodeSizeFrom").node().value === "absoluteCount"
        )
            return store.scale(p.count);
        return sizes.noneSizedCircle;
    };

    store.circles
        .selectAll("circle")
        .data(Object.values(graph.cityData), (d) => d.label)
        .join(
            (enter) =>
                enter
                    .append("circle")
                    .attr("cx", (p) => {
                        projected = store.projection([p.lon, p.lat]);
                        if (projected) return projected[0];
                        return -1000;
                    })
                    .attr("cy", (p) => {
                        projected = store.projection([p.lon, p.lat]);
                        if (projected) return projected[1];
                        return -1000;
                    })
                    .attr("data-name", (p) => p.city)
                    .attr("data-lat", (p) => p.lat)
                    .attr("data-lon", (p) => p.lon)
                    .attr("fill", colors.circles),
            (update) => update.attr("data-currentCount", (p) => p.count),
            (exit) => exit.remove()
        )
        .transition()
        .attr("r", (p) => getR(p));
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
                // TODO: Because this state isn't a closed path, I believe, it does not render correctly. Therefore, VA is excluded from fill...
                return "none";
            } else {
                return colors.fillMap;
            }
        })
        .attr("data-id", (d) => d.id);
};

load();

const hasKey = (key, object) => {
    return Object.keys(object).includes(key);
};
