const store = {
    raw: undefined,
    performerData: {},
    projection: d3.geoAlbersUsa(),
    graticuleGenerator: d3.geoGraticule(),
    scale: d3.scaleLinear().range([3, 40]),
    tooltip: d3.select("div.tooltip"),
    helptip: d3.select("div.helptip"),
    citytip: d3.select("div.citytip"),
    modularitiesArray: [],
    clusters: {},
    currentTransform: undefined
};
store.path = d3.geoPath().projection(store.projection);
store.graticules = d3
    .select("g#mapObjects")
    .append("g")
    .attr("id", "graticules");
store.map = d3.select("g#mapObjects").append("g").attr("id", "map");
store.cities = d3.select("g#mapObjects").append("g").attr("id", "cities");
store.circles = d3.select("g#mapObjects").append("g").attr("id", "circles");
store.travels = d3.select("g#mapObjects").append("g").attr("id", "travels");
store.travelPaths = store.travels.append("g").attr("id", "travelPaths");
store.travelCircles = store.travels.append("g").attr("id", "travelCircles");

const graph = {
    locationsByYear: {},
    locationsCount: {},
    circleData: [],
};
