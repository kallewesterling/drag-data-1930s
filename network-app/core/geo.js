/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

const processGeo = () => {
  const projection = d3
      .geoAlbersUsa()
      .scale(400)
      .translate([window.innerWidth / 2, window.innerHeight / 2]);
  d3.json(DATA_DIR + '/counties-albers-10m.json').then((data) => {
    const path = d3.geoPath();
    us = data;
    map = `<g fill="none"
              stroke="#000"
              stroke-linejoin="round"
              stroke-linecap="round">
        <path stroke="#aaa" stroke-width="0.5" d="${path(
      topojson.mesh(
          us,
          us.objects.counties,
          (a, b) =>
            a !== b &&
              ((a.id / 1000) | 0) === ((b.id / 1000) | 0),
      ),
  )}"></path>
        <path stroke-width="0.5" d="${path(
      topojson.mesh(us, us.objects.states, (a, b) => a !== b),
  )}"></path>
        <path d="${path(
      topojson.feature(us, us.objects.nation),
  )}"></path>
      </g>`;
    document.querySelector('svg#main').insertAdjacentHTML('beforeend', map);
  });

  window.graph.nodes.forEach((n) => {
    if (n.geodata) {
      coords = projection([n.geodata.lon, n.geodata.lat]);

      const [x, y] = coords;
      if (x && y) {
        console.log(x, y);
        n.fx = x;
        n.fy = y;
      }
    }
  });

  zoom.on('zoom', (event) => {
    window.graph.plot.attr('transform', event.transform);
    // window.graph.elements.selectAll("path").attr("d", path)
  });
};
