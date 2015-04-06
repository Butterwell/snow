// TODO Make into Github Gist
var year_histogram = function( options, values ) {

// A formatter for counts.
var formatCount = d3.format(",.0f");

var margin = {top: 10, right: 30, bottom: 30, left: 30}
var width = options.width - margin.left - margin.right
var height = options.height - margin.top - margin.bottom

// Align with decade
var x_min = Math.floor((d3.min(values))/10)*10
var x_max = Math.ceil((d3.max(values))/10)*10

var x = d3.scale.linear()
    .domain([x_min, x_max])
    .range([0, width]);

var bins = (x_max - x_min) / 5 // 10 year bins
var bar_width = width/bins

var data = d3.layout.histogram()
    .bins(x.ticks(bins))
    (values);

// Create running total (kludge)
if ( options.running_total ) {
  var total = []
  data = data.map(function(d) {
    total = total.concat(d)
    total.x = d.x
    total.y = total.length
    total.dx = d.dx
    return total
  })
}

var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.y; })])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(function(d) { return !(d % 10)?d:""; }) // Only label decades

var svg = d3.select(options.selectee).append("svg")
    .attr("width", options.width)
    .attr("height", options.height)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var bar = svg.selectAll(".bar")
    .data(data)
  .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d,i) { return "translate(" + (i*bar_width - 1) + "," + y(d.y) + ")"; });

bar.append("rect")
    .attr("x", 1)
    .attr("width", bar_width )
    .attr("height", function(d) { return height - y(d.y); });

bar.append("text")
    .attr("dy", ".75em")
    .attr("y", 6)
    .attr("x", bar_width / 2)
    .attr("text-anchor", "middle")
    .text(function(d) { return formatCount(d.y); });

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
}
