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

    const getCircleSize = (circle) => {
        if (
            d3.select("#nodeSizeFrom").node().value === "relativeCount" ||
            d3.select("#nodeSizeFrom").node().value === "absoluteCount"
        )
            return store.scale(circle.count);
        return sizes.noneSizedCircle;
    };

    const mouseoverInfo = (evt, circle) => {
        if (evt.buttons > 0) return true;
        store.tooltip.transition().duration(200).style("opacity", 0.9);
        [startYear, endYear] = slider.noUiSlider.get();
        store.tooltip
            .html(
                `<p class="small m-0 fw-bolder">${circle.label}<span class="text-white-muted ms-1">${startYear}–${endYear}</span></p>
                <p class="small m-0">${circle.count} times a performer traveled to/from</p>
                <p class="small m-0">${circle.performers.length} performers associated</p>`
            )
            .style("left", evt.pageX + "px")
            .style("top", evt.pageY - 28 + "px");
    };

    cities = getCities();
    years = d3.range(
        slider.noUiSlider.get()[0],
        slider.noUiSlider.get()[1] + 1
    );

    data = [];
    cities.forEach((city) => {
        d = {
            label: city,
            lat: getLat(city),
            lon: getLon(city),
            count: 0,
            performers: getPerformerNamesByGeo(city),
        };
        years.forEach((year) => {
            d.count += getPerformerCount(city, year);
        });
        if (d.count > 0) {
            data.push(d);
        }
    });
    data.sort((a, b) => {
        if (a.count > b.count) {
            return -1;
        } else if (b.count > a.count) {
            return 1;
        }
        return 0;
    });

    store.circles
        .selectAll("circle")
        .data(data, (d) => d.label)
        .join(
            (enter) =>
                enter
                    .append("circle")
                    .attr("cx", (circle) => {
                        projected = store.projection([circle.lon, circle.lat]);
                        if (projected) return projected[0];
                        return -1000;
                    })
                    .attr("cy", (circle) => {
                        projected = store.projection([circle.lon, circle.lat]);
                        if (projected) return projected[1];
                        return -1000;
                    })
                    .attr("data-name", (circle) => circle.city)
                    .attr("data-lat", (circle) => circle.lat)
                    .attr("data-lon", (circle) => circle.lon)
                    .classed("cityCircle", true),
            (update) =>
                update.attr("data-currentCount", (circle) => circle.count),
            (exit) => exit.remove()
        )
        .transition()
        .attr("r", (circle) => getCircleSize(circle));

    store.circles.selectAll("circle").each(function (circle) {
        d3.select(this)
            .on("click", (evt) => {
                console.log(circle);
            })
            .on("mouseover", (evt) => {
                mouseoverInfo(evt, circle);
            })
            .on("mouseout", hideTooltip);
    });
};

const renderMap = (json) => {
    store.graticules
        .append("path")
        .attr("d", store.path(store.graticuleGenerator()))
        .style("stroke", "#0000000d")
        .style("stroke-width", "1")
        .attr("fill", "none");

    store.map
        .append("path")
        .attr("d", store.path(topojson.feature(json, json.objects.land)))
        .style("stroke", "#0000000d")
        .style("stroke-width", "1")
        .attr("class", "land")
        .attr("filter", "url(#shadow)");

    store.map
        .append("path")
        .attr("d", store.path(topojson.feature(json, json.objects.states)))
        .attr("class", "state");

    store.map
        .append("path")
        .attr("d", store.path(topojson.feature(json, json.objects.counties)))
        .attr("class", "county");
};
