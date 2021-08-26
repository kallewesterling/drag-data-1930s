const started = (evt, selector) => {
    style = getComputedStyle(document.querySelector(selector));
    elemX = style.left.replace('px', '');
    elemY = style.top.replace('px', '');
    window._offsetX = evt.x-elemX;
    window._offsetY = evt.y-elemY;
}

const dragged = (evt, selector) => {
    elem = document.querySelector(selector);
    elem.style.left = `${evt.x-window._offsetX}px`;
    elem.style.top = `${evt.y-window._offsetY}px`;
}

const ended = (evt, selector) => {
    window._offsetX = undefined;
    window._offsetY = undefined;
}

const func = (evt) => {
    return !evt.path.map(elem=>elem.tagName).includes('INPUT');
}

d3.select("#settings").call(d3.drag().filter(func).on("start", evt => started(evt, '#settings')).on("drag", evt => dragged(evt, '#settings')).on("end", evt => ended(evt, '#settings')));
d3.select("#quickEdgeInfo").call(d3.drag().filter(func).on("start", evt => started(evt, '#quickEdgeInfo')).on("drag", evt => dragged(evt, '#quickEdgeInfo')).on("end", evt => ended(evt, '#quickEdgeInfo')));
d3.select("#nodeEdgeInfo").call(d3.drag().filter(func).on("start", evt => started(evt, '#nodeEdgeInfo')).on("drag", evt => dragged(evt, '#nodeEdgeInfo')).on("end", evt => ended(evt, '#nodeEdgeInfo')));
