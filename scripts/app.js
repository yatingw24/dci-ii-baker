// Write your code!
console.log('Hello bakers');

const drawMapOne = () => {
  let margin = { top: 0, left: 0, right: 0, bottom: 0 };

  let height = 600;
  let width = 800;

  let chartHeight = height - margin.top - margin.bottom;
  let chartWidth = width - margin.left - margin.right;

  let svg = d3
    .select('#neighborhood-map')
    .append('svg')
    .attr('height', height)
    .attr('width', width)
    .append('g')
    .attr('transform', `translate(" + ${margin.left},${margin.top})`);

  let projection = d3.geoMercator();
  // You can set center/scale manually as well
  // Here are some values you can try for NYC specifically
  // .center([-73.96667, 40.78333]).scale(80000)

  let path = d3.geoPath().projection(projection);

  let boroughNames = [
    'Harlem',
    'Brooklyn',
    'Manhattan',
    'Queens',
    'Staten Island',
  ];
  let boroughColors = d3
    .scaleOrdinal()
    .domain(boroughNames)
    .range(d3.schemePastel2);

  d3.json('./_data/nyc_neighborhoods.json')
    .then(ready)
    .catch((err) => console.log('Failed on', err));

  function ready(json) {
    let nyc = topojson.feature(json, json.objects.nyc);
    projection.fitSize([chartWidth, chartHeight], nyc);

    // Give our map a background
    svg
      .append('rect')
      .attr('height', height)
      .attr('width', width)
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', 'aliceblue');

    svg
      .selectAll('.neighborhood')
      .data(nyc.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'neighborhood')
      .attr('fill', function (d) {
        // How would we use the boroughColors() scale?
        // console.log()
        return boroughColors(d.properties.borough);
      })
      .style('stroke', '#000')
      .style('stroke-width', 0.3)
      .attr('id', 'nycPath')
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);

    function handleMouseOver(event, d) {
      // Add a tooltip here
      svg
        .append('text')
        .attr('x', 100)
        .attr('y', 100)
        .attr('class', 'tooltip')
        .text(d.properties.neighborhood);

      // Change the fill of the borough here
      d3.select(this).attr('fill', 'yellow');
    }

    function handleMouseOut(event, d) {
      // Remove the tooltip and borough styling
      svg.selectAll('.tooltip').remove();

      d3.select(this).attr('fill', function (d) {
        return boroughColors(d.properties.borough);
      });
    }
  }
};

drawMapOne();
