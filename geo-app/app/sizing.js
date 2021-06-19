const getMapSize = () => {
    /*
    width = window
        .getComputedStyle(document.querySelector("#mapContainer"))
        .width.replace("px", "");
    height = size.multiplier * +width;
    return [width, height];
    */
    let width = window.innerWidth;
    let height =
        window.innerHeight -
        window
            .getComputedStyle(document.querySelector("nav"))
            .height.replace("px", "");
    return [width, height];
};

[width, height] = getMapSize();
centerX = width / 2;
centerY = height / 2;

d3.select("svg#map")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMinYMin");

store.projection
    .translate([width / 2, height / 2]) // translate to center of screen
    .scale([2000]); // scale things down so see entire US
