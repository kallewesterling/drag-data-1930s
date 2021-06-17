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

const getPerformers = () => {
    return [...new Set(store.raw.map((p) => p.performer))].sort();
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
                    path: getPath([thisLon, thisLat], [nextLon, nextLat]),
                });
            }
        }
    });
    return allLines;
};

const drawAllTravels = (performerName, skipClearTravel, specialColor) => {
    const transition = (travelCircle, route) => {
        var l = route.node().getTotalLength();
        travelCircle
            .transition()
            .duration(durations.travelCircle)
            .attrTween("transform", delta(route.node()))
            .attr("r", () => {
                // console.log(sizes.endTravelNode);
                return sizes.endTravelNode;
            });
    };

    const delta = (path) => {
        var l = path.getTotalLength();
        return function (i) {
            return function (t) {
                var p = path.getPointAtLength(t * l);
                return "translate(" + p.x + "," + p.y + ")";
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
        store.tooltip.transition().duration(200).style("opacity", 0.9);
        store.tooltip
            .html(
                `<p class="small m-0 fw-bolder">${performerName}</p>
                <p class="small m-0">${cityRange}</p>
                <p class="small m-0">${yearRange}</p>`
            )
            .style("left", evt.pageX + "px")
            .style("top", evt.pageY - 28 + "px");
    };

    const hideTooltip = () => {
        store.tooltip
            .transition()
            .delay(1000)
            .duration(1000)
            .style("opacity", 0);
    };

    if (skipClearTravel === undefined || skipClearTravel === false) {
        console.log("clearing travel...");
        clearTravels();
    }
    document.body.dataset.travels = true;
    document.body.dataset.performerName = performerName;
    clearCircles();

    allLines = getLines(performerName);
    //console.log(allLines);
    allLines.forEach((line) => {
        id = line.path.replaceAll(".", "").replaceAll(",", "");
        line.id = id;
        route = store.travels
            .append("path")
            .attr("d", line.path)
            .style("stroke", colors.travelGreenTransparency)
            .style("stroke-width", "1")
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

        store.travels.selectAll("path").each(function (d) {
            var totalLength = this.getTotalLength();
            d3.select(this)
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(durations.travelPath)
                .attr("stroke-dashoffset", 0)
                // .attr("marker-end", "url(#arrowhead)")
                .style("stroke-width", "1.5");
        });

        travelCircle = store.travels
            .append("circle")
            .attr("r", () => {
                return sizes.startTravelNode;
            })
            .attr("fill", specialColor ? specialColor : colors.travelGreen)
            .attr("path-id", id)
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

const getBoundingBox = (performerName, project) => {
    lats = getLineData(performerName).map((n) => n[0]);
    longs = getLineData(performerName).map((n) => n[1]);
    maxLat = d3.max(lats);
    minLat = d3.min(lats);
    maxLon = d3.max(longs);
    minLon = d3.min(longs);

    ([projectedMaxLon, projectedMaxLat] = store.projection([minLon, minLat])),
        ([projectedMinLon, projectedMinLat] = store.projection([
            maxLon,
            maxLat,
        ]));

    store.svg
        .append("rect")
        .attr("y", projectedMinLon)
        .attr("x", projectedMinLat)
        .attr("height", 10)
        .attr("width", 10);

    store.svg
        .append("rect")
        .attr("y", projectedMaxLon)
        .attr("x", projectedMaxLat)
        .attr("height", 10)
        .attr("width", 10);

    store.svg
        .append("line")
        .attr("x1", 47)
        .attr("x2", 47)
        .attr("y1", 0)
        .attr("y2", 200)
        .attr("stroke", "black");

    if (!project)
        return {
            maxLon: maxLon,
            minLon: minLon,
            minLat: minLat,
            maxLat: maxLat,
        };

    return {
        maxLon: projectedMaxLon,
        minLon: projectedMinLon,
        minLat: projectedMinLat,
        maxLat: projectedMaxLat,
    };
    /*
            minLon, minLat],
        [, maxLat],
        store.projection([minLon, minLat]),
        store.projection([maxLon, maxLat]),
    ];
    */
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
