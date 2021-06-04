document.querySelector("body").addEventListener("shown.bs.offcanvas", (d) => {
    document.querySelector("body").style.left = "400px";
});

document.querySelector("body").addEventListener("hidden.bs.offcanvas", (d) => {
    document.querySelector("body").style.left = "0px";
});
