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
            if (thisCity === nextCity) {
                console.warn("Traveling from and to same city");
            } else {
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

const travelLineInfo = (line) => {
    document.body.dataset.clickedLine = true;

    resetTravelPaths();
    d3.select(`path#${line.id}`)
        .style("stroke", "red")
        .style("stroke-width", 5)
        .attr("marker-end", "none");
    d3.select(`circle[path-id=${line.id}]`).attr("fill", "red").attr("r", 10);
    //console.log(line);
    d3.select("#explanation").html(`
        <p style="color: var(--bs-primary)">${line.startCity}–${
        line.endCity
    }</p>
        <p style="color: var(--bs-secondary)">${line.start}${
        line.start !== line.end ? "–" + line.end : ""
    }</p>
    `);
};

const resetTravelPaths = () => {
    document.body.dataset.clickedLine = false;
    document.body.dataset.travels = true;
    d3.selectAll(`path.travelLine`)
        .style("stroke", "green")
        .attr("stroke-dashoffset", 0)
        .attr("marker-end", "url(#arrowhead)")
        .style("stroke-width", "1.5");
    d3.selectAll(`circle[path-id]`).attr("fill", "green").attr("r", 10);
};

const drawAllTravels = (performerName) => {
    document.body.dataset.travels = true;
    document.body.dataset.performerName = performerName;

    clearCircles();
    clearTravels();

    allLines = getLines(performerName);
    //console.log(allLines);
    allLines.forEach((line) => {
        id = line.path.replaceAll(".", "").replaceAll(",", "");
        line.id = id;
        route = store.travels
            .append("path")
            .attr("d", line.path)
            .style("stroke", "green")
            .style("stroke-width", "1")
            .attr("fill", "none")
            .attr("class", "travelLine")
            .attr("id", id)
            .attr("start", line.start)
            .attr("end", line.end)
            .attr("startCity", line.startCity)
            .attr("endCity", line.endCity)
            .on("click", () => {
                travelLineInfo(line);
            });

        store.travels.selectAll("path").each(function (d) {
            var totalLength = this.getTotalLength();
            d3.select(this)
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(4000)
                .attr("stroke-dashoffset", 0)
                .attr("marker-end", "url(#arrowhead)")
                .style("stroke-width", "1.5");
        });

        plane = store.travels
            .append("circle")
            .attr("r", 5)
            .attr("fill", "green")
            .attr("path-id", id)
            .on("click", () => {
                travelLineInfo(line);
            });

        transition(plane, route);
    });

    function transition(plane, route) {
        var l = route.node().getTotalLength();
        plane
            .transition()
            .duration(10000)
            .attrTween("transform", delta(route.node()))
            .attr("r", 10);
    }

    function delta(path) {
        var l = path.getTotalLength();
        return function (i) {
            return function (t) {
                var p = path.getPointAtLength(t * l);
                return "translate(" + p.x + "," + p.y + ")";
            };
        };
    }
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
    console.log(document.body.dataset);
    store.travels
        .selectAll("path")
        .transition()
        .style("stroke", "white")
        .style("stroke-width", "0");
    store.travels
        .selectAll("circle")
        .transition()
        .style("fill", "white")
        .style("r", "0");

    store.travels.selectAll("path").remove();
    store.travels.selectAll("circle").remove();
};

const clearCircles = () => {
    store.map.selectAll("path").attr("stroke-opacity", "1");

    if (document.body.dataset.travels === "true") {
        store.map.transition(10000).attr("stroke-opacity", "0.25");
        store.circles.transition().attr("fill", "white").attr("r", 0).remove();
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
    console.warn("Ambivalent result from `getCityFromLonLat`", testVal);
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
            if (thisCity === nextCity) {
                // console.warn("Traveling from and to same city");
            } else {
                travels.push([thisCity, nextCity]);
            }
        }
    });
    return travels;
};
