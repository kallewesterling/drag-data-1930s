let x = null,
    y = null;

preview = (store) => {
    var margin = { top: 20, right: 20, bottom: 20, left: 20 },
        width = 500 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    // Parse the date / time
    var x = d3.scaleBand().range([0, width]).padding(0.1);
    var y = d3.scaleLinear().range([height, 0]);

    var svg = d3
        .select("svg#preview")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("id", "preview_g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    cityCount = store.count.city.splice(0, 10);

    x.domain(cityCount.map((d) => d[0]));
    y.domain([
        0,
        Math.max.apply(
            Math,
            cityCount.map(function (o) {
                return o[1];
            })
        ),
    ]);

    let bar = svg
        .selectAll(".bar")
        .data(cityCount, (d) => d[0])
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d[0]))
        .attr("width", x.bandwidth())
        .attr("y", (d) => y(d[1]))
        .attr("height", (d) => {
            // console.log(height);
            // console.log(-y(d[1]));
            return height - y(d[1]);
        });

    bar.on("click", (d) => {
        console.log(d);
    });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g").call(d3.axisLeft(y));

    return {
        x: x.domain(),
        y: y.domain(),
        bar: bar,
    };
};
