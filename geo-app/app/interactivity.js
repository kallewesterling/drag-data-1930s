d3.select("#stepButtonInclude").on("click", () => {
    clearTravels();
    allYears = [...new Set(store.raw.map((d) => +d.year))].sort();
    setTo = undefined;
    if (d3.select("#stepButtonInclude").node().dataset.currentYear) {
        if (
            d3.max(allYears) ==
            d3.select("#stepButtonInclude").node().dataset.currentYear
        ) {
            setTo = d3.min(allYears);
        } else {
            setTo =
                +d3.select("#stepButtonInclude").node().dataset.currentYear + 1;
        }
    } else {
        setTo = d3.min(allYears);
    }
    d3.select("#stepButtonInclude").node().dataset.currentYear = setTo;
    slider.noUiSlider.set([d3.min(allYears), setTo]);
});
d3.select("#stepButton").on("click", () => {
    clearTravels();
    allYears = [...new Set(store.raw.map((d) => +d.year))].sort();
    setTo = undefined;
    if (d3.select("#stepButton").node().dataset.currentYear) {
        if (
            d3.max(allYears) ==
            d3.select("#stepButton").node().dataset.currentYear
        ) {
            setTo = d3.min(allYears);
        } else {
            setTo = +d3.select("#stepButton").node().dataset.currentYear + 1;
        }
    } else {
        setTo = d3.min(allYears);
    }
    d3.select("#stepButton").node().dataset.currentYear = setTo;
    slider.noUiSlider.set([setTo, setTo]);
});
d3.select("#nodeSize").on("change", () => {
    clearTravels();
    currentValues = slider.noUiSlider.get();
    renderCircles();
});

const SVGClicked = () => {
    console.log("SVG clicked.");
};
const MapClicked = () => {
    console.log("Map clicked.");
    if (document.body.dataset.travels && document.body.dataset.clickedLine) {
        resetTravelPaths();
    } else if (document.body.dataset.travels) {
        console.log("probably a line clicked here...");
    } else {
        console.log("no travels shown and no clicked line");
    }
};
