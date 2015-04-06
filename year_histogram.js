// TODO Make into Github Gist
var year_histogram = function( options, values ) {

// A formatter for counts.
var formatCount = d3.format(",.0f");

var margin = {top: 10, right: 60, bottom: 30, left: 30}
var width = options.width - margin.left - margin.right
var height = options.height - margin.top - margin.bottom

var x_min = d3.min(values)-1
var x_max = d3.max(values)+1

var x = d3.scale.linear()
    .domain([x_min, x_max])
    .range([0, width]);

var bins = (x_max - x_min) / 1 // 1 year bins, 5 for 5 year bins, etc.
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

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("right");

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

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)")
    .call(yAxis);
}
