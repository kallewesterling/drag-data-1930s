const getTravelingPerformers = (onlyNames = false) => {
    performerNames = getPerformers().filter(
        (performer) => getPerformer(performer).length > 2
    );
    if (onlyNames) return performerNames;

    return performerNames.map((performer) => getPerformer(performer));
};

const getPerformer = (name) => {
    return store.raw.filter((p) => p.performer === name);
};

const getLineData = (performerName) => {
    return getPerformer(performerName).map((n) => [
        n.lat,
        n.lon,
        +n.year,
        n.city,
    ]);
};

const getLines = (performerName) => {
    allLines = [];
    allData = getLineData(performerName);
    allData.forEach((thisPoint, ix) => {
        nextPoint = allData[ix + 1];
        if (nextPoint) {
            [thisLat, thisLon, thisYear, thisCity] = thisPoint;
            [nextLat, nextLon, nextYear, nextCity] = nextPoint;
            if (thisCity !== nextCity) {
                allLines.push({
                    start: thisYear,
                    end: nextYear,
                    startCity: thisCity,
                    endCity: nextCity,
                    startLat: thisLat,
                    startLon: thisLon,
                    endLat: nextLat,
                    endLon: nextLon,
                    path: getPath([thisLon, thisLat], [nextLon, nextLat]),
                });
            }
        }
    });
    return allLines;
};

const drawAllTravels = (performerName, skipClearTravel) => {
    const transition = (travelCircle, route) => {
        var l = route.node().getTotalLength();
        travelCircle
            .transition()
            .duration(durations.travelCircle)
            .attrTween("transform", delta(route.node(), "translate"))
            //.attrTween("cy", delta(route.node(), "dy"))
            .attr("r", () => sizes.endTravelNode)
            .on("start", () => {
                d3.select("body").classed("no-zoom", true);
                d3.select("#loadingDot").attr("data-running", true);
            })
            .on("end", () => {
                // fix the cx, cy, and reset transform when the transition is finished
                // var p = route.node().getPointAtLength(1 * l);
                // console.log(p)
                //
                //console.log(store.currentTransform)
                //[cx, cy] = store.projection([travelCircle.attr("data-lon"), travelCircle.attr("data-lat")]);
                //travelCircle.attr("cx", store.currentTransform.x ? cx - store.currentTransform.x : cx);
                //travelCircle.attr("cy", store.currentTransform.y ? cy - store.currentTransform.y : cy);
                //if (store.currentTransform) travelCircle.attr("transform", store.currentTransform);
                //console.log(d3.select(`path#${travelCircle.attr("path-id")}`))
                d3.select("body").classed("no-zoom", false);
                d3.select("#loadingDot").attr("data-running", false);
            });
    };

    const delta = (path, returnVal = "translate") => {
        var l = path.getTotalLength();
        return () => {
            return (t) => {
                var p = path.getPointAtLength(t * l);
                let x = p.x,
                    y = p.y;
                if (returnVal === "translate") {
                    if (store.currentTransform) {
                        (x = p.x + store.currentTransform.x),
                            (y = p.y + store.currentTransform.y);
                    }

                    return "translate(" + p.x + "," + p.y + ")";
                } else if (returnVal === "dx") {
                    return p.x;
                } else if (returnVal === "dy") {
                    return p.y;
                }
            };
        };
    };

    const mouseoverInfo = (evt, line) => {
        cityRange =
            line.endCity !== line.startCity
                ? line.startCity + "–" + line.endCity
                : line.startCity;
        yearRange =
            line.end !== line.start ? line.start + "–" + line.end : line.start;

        store.tooltip.html(
            `<p class="small m-0 fw-bolder">${performerName}</p>
                <p class="small m-0">${cityRange}</p>
                <p class="small m-0">${yearRange}</p>`
        );

        showTooltip(evt.pageX, evt.pageY - 28);
    };

    if (skipClearTravel === undefined || skipClearTravel === false) {
        console.log("clearing travel...");
        clearTravels();
    }
    document.body.dataset.travels = true;
    document.body.dataset.performerName = performerName;
    clearCircles();

    allLines = getLines(performerName);

    allLines.forEach((line) => {
        id = line.path.replaceAll(".", "").replaceAll(",", "");
        line.id = id;
        route = store.travelPaths
            .append("path")
            .attr("d", line.path)
            .attr("fill", "none")
            .attr("class", "travelLine")
            .attr("id", id)
            .attr("start", line.start)
            .attr("end", line.end)
            .attr("startCity", line.startCity)
            .attr("endCity", line.endCity)
            .on("mouseover", (evt) => {
                mouseoverInfo(evt, line);
            })
            .on("mouseout", hideTooltip);

        if (store.currentTransform) {
            route.attr("transform", store.currentTransform);
        }

        store.travelPaths.selectAll("path").each(function (d) {
            var totalLength = this.getTotalLength();
            d3.select(this)
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(durations.travelPath)
                .attr("stroke-dashoffset", 0)
                .style("stroke-width", "1.5");
        });

        travelCircle = store.travelCircles
            .append("circle")
            .attr("r", () => {
                return sizes.startTravelNode;
            })
            .attr("class", "travelCircle")
            .attr("path-id", id)
            .attr("data-lat", () => line.endLat)
            .attr("data-lon", () => line.endLon)
            .on("mouseover", (evt) => {
                mouseoverInfo(evt, line);
            })
            .on("mouseout", hideTooltip);

        transition(travelCircle, route);
    });
};

const getPath = (longLatFrom, longLatTo) => {
    return store.path({
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: [longLatFrom, longLatTo],
        },
    });
};

const clearTravels = () => {
    document.body.dataset.travels = false;
    document.body.dataset.performerName = undefined;
    store.travels
        .selectAll("path")
        .transition()
        .style("stroke", "white")
        .style("stroke-width", "0")
        //.delay(2000)
        .remove();
    store.travels
        .selectAll("circle")
        .transition()
        .style("fill", "white")
        .style("r", "0")
        //.delay(2000)
        .remove();

    store.travels.selectAll("path").data([]).exit().remove();
    store.travels.selectAll("circle").data([]).exit().remove();
};

const clearCircles = () => {
    store.map.selectAll("path").attr("stroke-opacity", "1");

    if (document.body.dataset.travels === "true") {
        store.map.transition(10000).attr("stroke-opacity", "0.25");
        store.circles
            .selectAll("circle")
            .data([])
            .exit()
            .transition()
            .attr("r", 0)
            .remove();
        // store.circles.transition().attr("fill", "white").attr("r", 0).remove();
    } else {
        console.log("not in travel...");
        console.log(document.body.dataset);
    }
};

const getCityFromLonLat = (lon, lat) => {
    testVal = [
        ...new Set(
            store.raw
                .map((d) => [`${d.lon}, ${d.lat}`, d.city])
                .filter((d) => d[0] === `${lon}, ${lat}`)
                .map((d) => d[1])
        ),
    ];
    if (testVal.length === 1) return testVal[0];
    warning("Ambivalent result from `getCityFromLonLat`", testVal);
    return false;
};

const getTravels = (performerName) => {
    travels = [];
    allData = getLineData(performerName);
    allData.forEach((thisPoint, ix) => {
        nextPoint = allData[ix + 1];
        if (nextPoint) {
            [thisLat, thisLon, thisYear, thisCity] = thisPoint;
            [nextLat, nextLon, nextYear, nextCity] = nextPoint;
            if (thisCity !== nextCity) {
                travels.push([thisCity, nextCity]);
            }
        }
    });
    return travels;
};

const getModularity = (performerName) => {
    finding = store.modularitiesArray.findIndex((d) => d[0] === performerName);
    if (finding !== -1) return store.modularitiesArray[finding][1];
    return -1;
};
