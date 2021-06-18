const store = {
    raw: undefined,
    performerData: {},
    projection: d3.geoAlbersUsa(),
    graticuleGenerator: d3.geoGraticule(),
    scale: d3.scaleLinear().range([3, 40]),
    tooltip: d3
        .select("body")
        .append("div")
        .attr("class", "tooltip shadow p-2")
        .style("opacity", 0),
    modularitiesArray: [],
    clusters: {},
};
store.path = d3.geoPath().projection(store.projection);
store.graticules = d3
    .select("g#mapObjects")
    .append("g")
    .attr("id", "graticules");
store.map = d3.select("g#mapObjects").append("g").attr("id", "map");
store.circles = d3.select("g#mapObjects").append("g").attr("id", "circles");
store.travels = d3.select("g#mapObjects").append("g").attr("id", "travels");

const graph = {
    locationsByYear: {},
    locationsCount: {},
    circleData: [],
};
