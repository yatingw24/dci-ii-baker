const drawMapTwo = () => {
  let mapMargin = { top: 0, left: 0, right: 0, bottom: 0 };

  let mapHeight = 500;
  let mapWidth = 800;

  let mapChartHeight = mapHeight - mapMargin.top - mapMargin.bottom;
  let mapChartWidth = mapWidth - mapMargin.left - mapMargin.right;
  let mapContainer = d3.select('#map-2');

  let mapSvg = d3
    .select('#map-2')
    .append('svg')
    .attr('height', mapHeight)
    .attr('width', mapWidth)
    .append('g')
    .attr('transform', `translate(${mapMargin.left},${mapMargin.top})`);

  let mapColorScale = d3.scaleOrdinal().range(['#F5F5DC']);

  // Color scale for school types
  let schoolColorScale = d3
    .scaleOrdinal()
    .domain(['Public', 'Private'])
    .range(['#FF7F50', '#6495ED']);

  let sizeScale = d3.scaleLinear().domain([14000, 42000]).range([3, 8]);

  let mapProjection = d3.geoAlbersUsa();
  let mapPath = d3.geoPath().projection(mapProjection);

  // Mouse hover handlers using SVG text elements
  function handleMouseOver(event, d) {
    // Get school information
    let institution = d.Institution;
    let stipend = d.Amount;
    let schoolType = d.Type;

    // Institution name
    mapSvg
      .append('text')
      .html(institution)
      .attr('x', mapChartWidth - 100)
      .attr('y', 30)
      .attr('class', 'tooltip institution')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .attr('fill', 'black')
      .attr('text-anchor', 'end');

    // Stipend amount
    mapSvg
      .append('text')
      .html('Stipend: ' + stipend)
      .attr('x', mapChartWidth - 100)
      .attr('y', 50)
      .attr('class', 'tooltip')
      .attr('font-size', '12px')
      .attr('fill', 'black')
      .attr('text-anchor', 'end');

    // School type
    mapSvg
      .append('text')
      .html('Type: ' + schoolType)
      .attr('x', mapChartWidth - 100)
      .attr('y', 70)
      .attr('class', 'tooltip')
      .attr('font-size', '12px')
      .attr('fill', 'black')
      .attr('text-anchor', 'end');

    // Highlight the hovered circle
    d3.select(this).attr('stroke-width', 2).attr('opacity', 1);
  }

  function handleMouseOut(event, d) {
    // Remove all tooltip text elements
    mapSvg.selectAll('.tooltip').remove();

    // Reset circle appearance
    d3.select(this).attr('stroke-width', 0.5).attr('opacity', 0.8);
  }

  // Load both datasets
  Promise.all([
    d3.json('./_data/us_states.topojson'),
    d3.json('./_data/school_coor.json'),
  ])
    .then(([mapJson, schoolData]) => {
      ready(mapJson, schoolData);
    })
    .catch((err) => console.log('Failed to load data:', err));

  function ready(json, schoolData) {
    console.log('JSON loaded successfully:', json);
    console.log('School data loaded:', schoolData);

    let mapStates = topojson.feature(json, json.objects.us_states);

    mapProjection.fitSize([mapChartWidth, mapChartHeight], mapStates);

    // Draw states
    let mapPaths = mapSvg
      .selectAll('.state')
      .data(mapStates.features)
      .enter()
      .append('path')
      .attr('class', 'state')
      .attr('d', mapPath)
      .attr('stroke', 'white')
      .attr('fill', (d) => {
        console.log('State data:', d.properties);
        return mapColorScale(d.properties.region);
      });

    // State labels
    mapSvg
      .selectAll('.state-label')
      .data(mapStates.features)
      .enter()
      .append('text')
      .attr('class', 'state-label')
      .text(function (d) {
        return d.properties.postal;
      })
      .attr('transform', function (d) {
        let coords = mapProjection(d3.geoCentroid(d));
        return `translate(${coords})`;
      })
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 10);

    // Function to parse amount strings (handles ranges like "$24,200–$31,800")
    function parseAmount(amountStr) {
      let cleanStr = amountStr.replace(/\$|,/g, '');
      let firstAmount = cleanStr.split('–')[0].split('-')[0];
      return parseFloat(firstAmount);
    }

    // Add school points
    mapSvg
      .selectAll('.school')
      .data(schoolData)
      .enter()
      .append('circle')
      .attr('class', 'school')
      .attr('cx', (d) => {
        let coords = mapProjection([d.Longitude, d.Latitude]);
        return coords ? coords[0] : null;
      })
      .attr('cy', (d) => {
        let coords = mapProjection([d.Longitude, d.Latitude]);
        return coords ? coords[1] : null;
      })
      .attr('r', (d) => sizeScale(parseAmount(d.Amount)))
      .attr('fill', (d) => schoolColorScale(d.Type))
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.8)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);

    // Add a simple legend
    let legend = mapSvg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(10, 20)`);

    // School type legend
    let legendData = [
      { type: 'Public', color: '#FF7F50' },
      { type: 'Private', color: '#6495ED' },
    ];

    legend
      .selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .each(function (d) {
        let item = d3.select(this);
        item
          .append('circle')
          .attr('r', 5)
          .attr('fill', d.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 0.5);

        item
          .append('text')
          .attr('x', 12)
          .attr('y', 4)
          .text(d.type)
          .attr('font-size', 12)
          .attr('fill', 'black');
      });
  }
};

drawMapTwo();
document.addEventListener('DOMContentLoaded', drawMapTwo);
