const clearAll = (e) => {
    if (!e.altKey && window.toggledCommentedElements) {
        toggleCommentedElements('true');
    }

    if (d3.select('#popup-info').classed('d-none')) {
        d3.select('#popup-info').classed('d-none', true);
    }
}

const loading = (message) => {
    // console.log(message);
    d3.select("#loading").classed('d-none', false);
    d3.select("#loadingMessage").html(message);
    setTimeout(() => {
        d3.select("#loading").classed('d-none', true);
    }, 1000);
    // console.log(message);
}

window.onmousemove = (e) => {
    clearAll(e);
}