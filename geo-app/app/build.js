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
store.graticules = store.svg.append("g").attr("id", "graticules");
store.map = store.svg.append("g").attr("id", "map");
store.circles = store.svg.append("g").attr("id", "circles");
store.travels = store.svg.append("g").attr("id", "travels");

const graph = {
    locationsByYear: {},
    locationsCount: {},
    circleData: [],
};
