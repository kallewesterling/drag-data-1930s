document.querySelector("body").addEventListener("show.bs.offcanvas", () => {
    d3.select('body').transition().style('left', '400px');
});

document.querySelector("body").addEventListener("hide.bs.offcanvas", () => {
    d3.select('body').transition().style('left', '0px');
});
