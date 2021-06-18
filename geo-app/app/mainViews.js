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
        store.tooltip.transition().duration(200).style("opacity", 0.9);
        store.tooltip
            .html(
                `<p class="small m-0 fw-bolder">${circle.label}</p>
                <p class="small m-0">${circle.count}</p>`
            )
            .style("left", evt.pageX + "px")
            .style("top", evt.pageY - 28 + "px");
    };

    store.circles
        .selectAll("circle")
        .data(Object.values(graph.cityData), (d) => d.label)
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
                    .attr("fill", colors.circles),
            (update) =>
                update.attr("data-currentCount", (circle) => circle.count),
            (exit) => exit.remove()
        )
        .transition()
        .attr("r", (circle) => getCircleSize(circle));

    store.circles.selectAll("circle").each(function (circle) {
        // console.log(circle.city);
        // console.log(circle.count);
        //console.log(this);
        d3.select(this)
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
