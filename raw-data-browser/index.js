
let store = {
    continuousPerformanceData: {},
    rawData: {},
    oneMonth: 0,
    scales: {}
};

// parse the date / time
var dateParser = d3.timeParse("%Y-%m-%d");
popup = d3.select('div#popup')
display_num = popup.select('div#displayNum')

// setup standard sizes for the svgs
var margin = {top: 20, right: 20, bottom: 50, left: 70},
    width = 1200 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

[0, 1, 2, 3].forEach(tolerance => {
    store.scales[`tolerance${tolerance}`] = {};
    store.scales[`tolerance${tolerance}`].xScale = d3.scaleTime().range([0, width]);
    store.scales[`tolerance${tolerance}`].yScale = yScale = d3.scaleLinear().range([height, 0]);
})

const renderContinousPerformanceData = (tolerance=0) => {
    console.log(`renderContinuousPerformanceData called with tolerance=${tolerance}`)

    const makeLegend = (tolerance) => {
        const getLegend = (tolerance) => {
            console.log(tolerance)
            switch (tolerance) {
                case "0":
                    return 'Number of performers performing within a given month'
                case "1":
                    return 'Number of performers performing within a given 3-month period (± 1mo)'
                case "2":
                    return 'Number of performers performing within a given 5-month period (± 2mo)'
                case "3":
                    return 'Number of performers performing within a given 7-month period (± 3mo)'
            }
            return 'undefined'
        }

        svg = d3.select(`svg#tolerance${tolerance} g#tolerance-${tolerance}`);

        if (svg.select('g.legend').node()) {
            console.log('legend already exists')
            return true;
        }

        var legend = svg
            .append('g')
            .attr('class', 'legend');
        
        legend.append('rect')
            .attr('x', 30)
            .attr('y', (d, i) => i * 20)
            .attr('width', 10)
            .attr('height', 10)
            .style('fill', 'steelblue');

        legend.append('text')
            .attr('x', 45)
            .attr('y', function(d, i) {
                return (i * 20) + 9;
            })
            .text(() => getLegend(tolerance))
            .attr('class', 'legendText');
    };

    const makeAxes = (tolerance) => {
        svg = d3.select(`svg#tolerance${tolerance} g#tolerance-${tolerance}`);

        if (!svg.select(`g.xScale-${tolerance}`).node()) {
            svg.append("g")
                .attr("class", `xScale-${tolerance}`)
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale));
        }

        // add y Axis
        if (!svg.select(`g.yScale-${tolerance}`).node()) {
            svg.append("g")
                .attr("class", `yScale-${tolerance}`)
                .call(d3.axisLeft(yScale));
        }
    }

    const makeMouseLine = (tolerance) => {
        svg = d3.select(`svg#tolerance${tolerance} g#tolerance-${tolerance}`);

        if (svg.select(`g.mouse-over-effects-${tolerance}`).node()) {
            return true;
        }

        svg.append("g")
            .attr("class", `mouse-over-effects-${tolerance}`);
        
        switch (tolerance) {
            case "0":
                months = 1;
                break;
            case "1":
                months = 3;
                break;
            case "2":
                months = 5;
                break;
            case "3":
                months = 7;
                break;
        }
        
        d3.select(`g.mouse-over-effects-${tolerance}`)
            .append("path") // this is the black vertical line to follow mouse
            .attr("class", `mouse-line-${tolerance}`)
            .style("stroke-width", `${store.oneMonth * months}px`)
            .style("opacity", "0");

        d3.select(`g.mouse-over-effects-${tolerance}`)
            .append('svg:rect') // append a rect to catch mouse movements on canvas
            .attr('width', width) // can't catch mouse events on a g element
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
    }
        
    if (d3.select(`svg#tolerance${tolerance} g#tolerance-${tolerance}`).node()) {
        console.log('found existing svg with tolerance', tolerance)
        svg = d3.select(`svg#tolerance${tolerance} g#tolerance-${tolerance}`)
    } else {
        var svg = d3.select(`svg#tolerance${tolerance}`)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("id", `tolerance-${tolerance}`)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    data = store.continuousPerformanceData[`tolerance${tolerance}`];
    data.forEach(d=>{if (typeof d.date === 'string') { d.date = dateParser(d.date) } }); // fix dates
    data = data.filter(d=>d.date.getFullYear() >= 1930 && d.date.getFullYear() < 1940)

    // set the ranges
    xScale = store.scales[`tolerance${tolerance}`].xScale;
    yScale = store.scales[`tolerance${tolerance}`].yScale;

    xScale.domain(d3.extent(data, d=>d.date));
    yScale.domain([0, d3.max(data, d=>d.num_artists)]);

    store.oneMonth = xScale(dateParser('1930-02-01')) - xScale(dateParser('1930-01-01'))

    // define the line
    var valueline = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.num_artists));

    // draw our two main lines
    pathGroup = svg
        .selectAll("g.paths")
        .data([data])
        .join(enter=>enter.append('g')
        .attr('class', 'paths'))

    line = pathGroup
        .selectAll("path.line")
        .data([data])
        .join(
            enter => enter.append('path')
                .attr("d", valueline),
            update => update
                .attr("d", valueline)
        )
    
    line
        .attr("class", "line");
    
    shadowLine = pathGroup
        .selectAll("path.shadowLine")
        .data([data])
        .join(
            enter => enter
                .append('path')
                .attr("d", valueline),
            update => update
                .attr("d", valueline)
        )
    
    shadowLine
        .attr("class", "shadowLine")
        .attr('transform', 'translate(2 2)');
    
    // add circles
    circleGroup = svg
        .selectAll("g.circles")
        .data([data])
        .join(
            enter=>enter
                .append('g')
                .attr('class', 'circles')
        )
    
    circle = circleGroup
        .selectAll("circle")
        .data(data)
        .join(
            enter => enter
                .append("circle"),
            update => update
        );
    
    circle
        .attr('class', 'node')
        .attr("r", 1.5)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.num_artists))

    // make both axes
    makeAxes(tolerance);

    // make legend
    makeLegend(tolerance);

    makeMouseLine(tolerance);
};

const setupInteractivity = (tolerance) => {

    const getText = (dataPoint) => {

        const getMonthRange = (month, year, range) => {
            switch (month) {
                case 'Jan':
                    switch (range) {
                        case 0:
                            return `Jan 1–31, ${year}`
                        case 1:
                            return `Dec ${year-1}–Feb ${year}`
                        case 2:
                            return `Nov ${year-1}–Mar ${year}`
                        case 3:
                            return `Oct ${year-1}–Apr ${year}`
                    }
                case 'Feb':
                    switch (range) {
                        case 0:
                            return `Feb 1–28, ${year}`
                        case 1:
                            return `Jan–Mar ${year}`
                        case 2:
                            return `Dec ${year-1}–Apr ${year}`
                        case 3:
                            return `Nov ${year-1}–May ${year}`
                    }
                case 'Mar':
                    switch (range) {
                        case 0:
                            return `Mar 1–31, ${year}`
                        case 1:
                            return `Feb–Apr ${year}`
                        case 2:
                            return `Jan–May ${year}`
                        case 3:
                            return `Dec ${year-1}–Jun ${year}`
                    }
                case 'Apr':
                    switch (range) {
                        case 0:
                            return `Apr 1–30, ${year}`
                        case 1:
                            return `Mar–May ${year}`
                        case 2:
                            return `Feb–Jun ${year}`
                        case 3:
                            return `Jan–Jul ${year}`
                    }
                case 'May':
                    switch (range) {
                        case 0:
                            return `May 1–31, ${year}`
                        case 1:
                            return `Apr–Jun ${year}`
                        case 2:
                            return `Mar–Jul ${year}`
                        case 3:
                            return `Feb–Aug ${year}`
                    }
                case 'Jun':
                    switch (range) {
                        case 0:
                            return `Jun 1–30, ${year}`
                        case 1:
                            return `May–Jul ${year}`
                        case 2:
                            return `Apr–Aug ${year}`
                        case 3:
                            return `Mar–Sep ${year}`
                    }
                case 'Jul':
                    switch (range) {
                        case 0:
                            return `Jul 1–31, ${year}`
                        case 1:
                            return `Jun–Aug ${year}`
                        case 2:
                            return `May–Sep ${year}`
                        case 3:
                            return `Apr–Oct ${year}`
                    }
                case 'Aug':
                    switch (range) {
                        case 0:
                            return `Aug 1–31, ${year}`
                        case 1:
                            return `Jul–Sep ${year}`
                        case 2:
                            return `Jun–Mar ${year}`
                        case 3:
                            return `May–Apr ${year}`
                    }
                case 'Sep':
                    switch (range) {
                        case 0:
                            return `Sep 1–30, ${year}`
                        case 1:
                            return `Aug–Oct ${year}`
                        case 2:
                            return `Jul–Nov ${year}`
                        case 3:
                            return `Jun–Dec ${year}`
                    }
                case 'Oct':
                    switch (range) {
                        case 0:
                            return `Oct 1–31, ${year}`
                        case 1:
                            return `Sep–Nov ${year}`
                        case 2:
                            return `Aug–Dec ${year}`
                        case 3:
                            return `Jul ${year}–Jan ${year+1}`
                    }
                case 'Nov':
                    switch (range) {
                        case 0:
                            return `Nov 1–30, ${year}`
                        case 1:
                            return `Oct–Dec ${year}`
                        case 2:
                            return `Sep ${year}–Jan ${year+1}`
                        case 3:
                            return `Aug ${year}–Feb ${year+1}`
                    }
                case 'Dec':
                    switch (range) {
                        case 0:
                            return `Dec 1–31, ${year}`
                        case 1:
                            return `Nov ${year}–Jan ${year+1}`
                        case 2:
                            return `Oct ${year}–Feb ${year+1}`
                        case 3:
                            return `Sep ${year}–Mar ${year+1}`
                    }
            }
        }
        if (tolerance == 0)
            return `<strong>${getMonthRange(dataPoint.month, dataPoint.year, 0)}</strong>: ${dataPoint.num_artists}`
        
        if (tolerance == 1)
            return `<strong>${getMonthRange(dataPoint.month, dataPoint.year, 1)}</strong>: ${dataPoint.num_artists}`
        
        if (tolerance == 2)
            return `<strong>${getMonthRange(dataPoint.month, dataPoint.year, 2)}</strong>: ${dataPoint.num_artists}`

        if (tolerance == 3)
            return `<strong>${getMonthRange(dataPoint.month, dataPoint.year, 3)}</strong>: ${dataPoint.num_artists}`
    }

    const reverseData = (localData, datePoint) => {
        var bisect = d3.bisector(function(d) { return d.date; }).right;
        let ix = bisect(localData, datePoint);
        return localData[ix];
    }

    const mouseEvent = (onOff) => {
        if (onOff) {
            d3.select(`.mouse-line-${tolerance}`)
                .style("opacity", "1");
            popup.classed('d-none', false);
        } else {
            d3.select(`.mouse-line-${tolerance}`)
                .style("opacity", "0");
            popup.classed('d-none', true);
        }
    }
    
    const mouseMove = (loc, event, snap=false) => {
        data = store.continuousPerformanceData[`tolerance${tolerance}`]
        let [xLoc, yLoc] = loc;
        datePoint = xScale.invert(xLoc);
        dataPoint = reverseData(data, datePoint);

        xLocSnap = xScale(dataPoint.date);
        if (snap) {
            d3.select(`.mouse-line-${tolerance}`).attr("d", `M${xLocSnap},${height} ${xLocSnap},0`); // set correct X on mouseline
        } else {
            d3.select(`.mouse-line-${tolerance}`).attr("d", `M${xLoc},${height} ${xLoc},0`); // set correct X on mouseline
        }

        if (dataPoint.num_artists) {
            display_num.html(getText(dataPoint));
            popup.classed('d-none', false);

            xOffset = getComputedStyle(d3.select('#popup').node()).width.replace('px', '')/2;
            yLoc = d3.select(`svg#tolerance${tolerance} g.xScale-${tolerance}`).node().getBoundingClientRect().top
            
            popup.attr('style', `left: ${event.clientX-xOffset}px; top: ${yLoc}px`);
        }
    }

    d3.select(`g .mouse-over-effects-${tolerance} rect`)
        .on('mouseout', () => mouseEvent(false))
        .on('mouseover', () => mouseEvent(true))
        .on('mousemove', (evt) => mouseMove(d3.pointer(evt), evt, true));

}

loader = [];
[0, 1, 2, 3].forEach(tolerance=>{
    loader.push(d3.json(`../network-app/data/continuous-performances-tolerance-${tolerance}.json`))
});

Promise.all(loader).then(function(files) {
    [0, 1, 2, 3].forEach(tolerance => {
        store.continuousPerformanceData[`tolerance${tolerance}`] = files[tolerance];
    })

    Object.keys(store.continuousPerformanceData).forEach(key=>{
        tolerance = key.replace('tolerance', '')
        renderContinousPerformanceData(tolerance);
        setupInteractivity(tolerance);
    });
}).catch(function(err) {
    console.error(err)
})

