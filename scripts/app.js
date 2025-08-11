console.log('Hello bakers');

const drawMultiline = () => {
  let margin = { top: 20, right: 200, bottom: 80, left: 60 };
  let width = 850;
  let height = 500;
  let chartWidth = width - margin.left - margin.right;
  let chartHeight = height - margin.top - margin.bottom;

  let svg = d3
    .select('#phd_stipends')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  function handleMouseOver(event, d) {
    d3.select(this);
    let dotX = xPositionScale(d['Academic Year']);
    let dotY = yPositionScale(d.median_pay);

    // Add tooltip
    svg
      .append('text')
      .html(`$${d3.format(',')(d.median_pay)}`)
      .attr('x', dotX)
      .attr('y', dotY - 15)
      .attr('class', 'tooltip')
      .attr('font-size', '12px')
      .attr('fill', 'black')
      .attr('text-anchor', 'middle');
  }

  function handleMouseOut(event, d) {
    d3.select(this).attr('r', 3.5).attr('stroke', 'none');
    svg.selectAll('.tooltip').remove();
  }

  // Scales
  let xPositionScale = d3.scalePoint().range([0, chartWidth]);
  let yPositionScale = d3.scaleLinear().range([chartHeight, 0]);
  let colorScale = d3
    .scaleOrdinal()
    .domain(['Business', 'STEM', 'Social Science', 'Humanities'])
    .range(['#7fb3d3', '#2c3e50', '#b19cd9', '#FFB6C1']);

  let line = d3
    .line()
    .x((d) => xPositionScale(d['Academic Year']))
    .y((d) => yPositionScale(d.median_pay));

  d3.json('./_data/linechart.json')
    .then(ready)
    .catch(function (error) {
      console.log('Failed with', error);
    });

  function ready(datapoints) {
    console.log('Data loaded:', datapoints);

    // Convert pay to numbers
    datapoints.forEach(function (d) {
      d.median_pay = +d.median_pay;
    });

    // Update scales
    let years = [...new Set(datapoints.map((d) => d['Academic Year']))].sort();
    let maxPay = d3.max(datapoints, (d) => d.median_pay);

    xPositionScale.domain(years);
    yPositionScale.domain([20000, maxPay + 2000]);

    // Group rows by field
    let grouped = d3.groups(datapoints, (d) => d.Field);
    console.log('Grouped:', grouped);

    // Draw lines
    svg
      .selectAll('.field-line')
      .data(grouped)
      .enter()
      .append('path')
      .attr('class', 'field-line')
      .attr('stroke', (group) => colorScale(group[0]))
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('d', (group) => line(group[1]));

    // Add dots for each data point
    svg
      .selectAll('.field-dot')
      .data(datapoints)
      .enter()
      .append('circle')
      .attr('class', (d) => `dot-${d.Field.replace(/\s+/g, '-')}`)
      .attr('cx', (d) => xPositionScale(d['Academic Year']))
      .attr('cy', (d) => yPositionScale(d.median_pay))
      .attr('r', 3.5)
      .attr('fill', (d) => colorScale(d.Field))
      .style('cursor', 'pointer')
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);

    // Draw axes
    let yAxisGenerator = d3
      .axisLeft(yPositionScale)
      .tickFormat((d) => `${d3.format(',')(d)}`)
      .ticks(6);

    let yAxis = svg
      .append('g')
      .attr('class', 'axis y-axis')
      .call(yAxisGenerator);

    let xAxisGenerator = d3.axisBottom(xPositionScale);
    let xAxis = svg
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxisGenerator);

    xAxis
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('transform', 'rotate(-45)');

    xAxis
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', margin.bottom - 10)
      .attr('fill', 'black')
      .style('font-size', '12px')
      .text('Academic Year');

    yAxis.selectAll('text').style('text-anchor', 'end');

    yAxis
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -margin.left + 10)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Median Pay ($)');

    // Add annotation
    let annotationX = chartWidth - 20;
    let annotationY = chartHeight - 20;

    let socialScienceData = datapoints.filter(
      (d) => d.Field === 'Social Science'
    );
    let humanitiesData = datapoints.filter((d) => d.Field === 'Humanities');

    let targetX =
      (xPositionScale('2019-2020') + xPositionScale('2020-2021')) / 2;
    let targetY = yPositionScale(25000);

    // Add annotation group
    let annotationGroup = svg.append('g').attr('class', 'annotation-group');

    let textStartX = annotationX - 180;
    let annotationText = annotationGroup
      .append('text')
      .attr('x', textStartX)
      .attr('y', annotationY - 30)
      .attr('font-size', '11px')
      .style('text-anchor', 'start');

    annotationText
      .append('tspan')
      .attr('x', textStartX)
      .attr('dy', '0')
      .text('The pandemic also hurt PhD students');

    annotationText
      .append('tspan')
      .attr('x', textStartX)
      .attr('dy', '12')
      .text('in Humanities and Social Sciences');

    annotationText
      .append('tspan')
      .attr('x', textStartX)
      .attr('dy', '12')
      .text('the most.');

    // add arrowhead
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 5 10')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');

    let curveEndX = textStartX - 10;
    let curveEndY = annotationY - 30;

    let controlX = (targetX + curveEndX) / 2;
    let controlY = (targetY + curveEndY) / 2 + 20;

    let curvePath = `M ${targetX} ${targetY} Q ${controlX} ${controlY} ${curveEndX} ${curveEndY}`;

    annotationGroup
      .append('path')
      .attr('d', curvePath)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)');

    // Add legend
    let legend = svg
      .append('g')
      .attr('transform', `translate(${chartWidth + 50}, 50)`);

    let legendOrder = ['Business', 'STEM', 'Humanities', 'Social Science'];

    legendOrder.forEach((fieldName, i) => {
      let legendItem = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem
        .append('circle')
        .attr('r', 6)
        .attr('fill', colorScale(fieldName));

      legendItem
        .append('text')
        .attr('x', 15)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .text(fieldName);
    });
  }
};

drawMultiline();
