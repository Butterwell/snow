// Generate unique map ids, starting with "map1"
var get_next_map_id = function() {
	var next_id = 1
	return function () { return "map"+next_id++ }
}()

// Standard globe projection for these maps

var projection = d3.geo.sinuMollweide()
// scale: size of map; rotate: map centered on long, lat; center: shift in svg frame
projection.scale(140).rotate([0, 0]).center([38, -18]);

var path = d3.geo.path()
    .projection(projection);

path.pointRadius(3)

var graticule = d3.geo.graticule();

// Needs options.selectee, options.width, options.height
function create_svg(options) {
	var map_id = get_next_map_id()
	var sphere_id = map_id+"_sphere"
	var overlay_id = map_id+"_overlay"
	var svg = d3.select(options.selectee).append("svg")
		.attr("width", options.width)
		.attr("height", options.height);

	svg.append("defs").append("path")
		.datum({type: "Sphere"})
		.attr("id", sphere_id)
		.attr("d", path);

	svg.append("use")
		.attr("class", "stroke")
		.attr("xlink:href", "#"+sphere_id);

	svg.append("use")
		.attr("class", "fill")
		.attr("xlink:href", "#"+sphere_id);

	svg.append("path")
		.datum(graticule)
		.attr("class", "graticule")
		.attr("d", path);

	// Container to preserve write (overlay) order
	svg.append("g")
		.attr("id", overlay_id)

	return {
		svg: svg,
		sphere_id: sphere_id,
		overlay_id: overlay_id
	}
}

function hex_update(options, data) {
  var hexes = options.svg.select("#"+options.container_id).selectAll(".hexagons")
      .data(options.hexbin(data))

  hexes.enter().append("path")
      .attr("class", "hexagons")

  hexes.attr("class", options.child_class)
      .attr("d", options.hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .style("fill", function(d) { return options.color(d.length); })
  
  hexes.exit()
      .remove();
}

var map_points = function(options, plotable_stations) {
	
	var geojson_points = plotable_stations.map( function(d){ return { 
		"type": "Point",
		"coordinates": [d.longitude, d.latitude]
	} })

    var map = create_svg(options)
	
	d3.json("world-110m.json", function(error, world) {
		map.svg.insert("path", ".graticule")
			.datum(topojson.feature(world, world.objects.land))
			.attr("class", "land")
			.attr("d", path);

		map.svg.select("#"+map.overlay_id).selectAll(".point")
			.data(geojson_points)
			.enter().insert("path")
			.attr("class", "point")
			.attr("d", path);
	});
}

var hex_map = function(options, plotable_stations) {

	var hexbin_points = plotable_stations.map( function(d){ return [d.longitude, d.latitude] } )

    var map = create_svg(options)

	var color = d3.scale.linear()
		.domain([0, 20])
		.range(["white", "steelblue"])
		.interpolate(d3.interpolateLab);

	var hexbin = d3.hexbin()
		.size([options.width, options.height])
		.radius(8);

	hexbin_points.forEach(function(d) {
		var p = projection(d);
		d[0] = p[0], d[1] = p[1];
	});

	d3.json("world-110m.json", function(error, world) {
		map.svg.insert("path", ".graticule")
			.datum(topojson.feature(world, world.objects.land))
			.attr("class", "land")
			.attr("d", path);

		map.svg.select("#"+map.overlay_id).selectAll(".hexagons")
			.data(hexbin(hexbin_points))
		.enter().insert("path")
			.attr("class", "hexagons")
			.attr("d", hexbin.hexagon())
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			.style("fill", function(d) { return color(d.length); });

	});

}

var dynamic_hex_map = function(options, plotable_stations) {

	var hexbin_points = plotable_stations
		.map( function(d) { return [d.longitude, d.latitude, parseInt(d.mindate.substr(0,4))] })
		.sort( function(a,b) { return a[2]-b[2] } )
		
	var map = create_svg(options)

	var color = d3.scale.linear()
		.domain([0, 20])
		.range(["white", "steelblue"])
		.interpolate(d3.interpolateLab);

	var hexbin = d3.hexbin()
		.size([options.width, options.height])
		.radius(8);

	hexbin_points.forEach(function(d) {
		var p = projection(d);
		d[0] = p[0], d[1] = p[1];
	});

	var h_p = []
	var last_year = 0
	hexbin_points.forEach(function(d) {
		if (d[2] > last_year) {
			last_year = d[2]
			h_p.push([])
		}
		h_p[h_p.length-1].push(d)
	});

	d3.json("world-110m.json", function(error, world) {
		map.svg.insert("path", ".graticule")
			.datum(topojson.feature(world, world.objects.land))
			.attr("class", "land")
			.attr("d", path);

		// The initial display.
		var element_options = {
			color: color,
			hexbin: hexbin,
			svg: map.svg,
			container_id: map.overlay_id
		}

		var dynamic = []
		var chunk = 0
		hex_update(element_options, dynamic);

		setInterval(function() {
			chunk = chunk % h_p.length
			if (chunk === 0) { dynamic = [] }
			dynamic = dynamic.concat(h_p[chunk])
			chunk++
			hex_update(element_options, dynamic);
		}, 500);
	});
}


var snow_hex_map = function(options, plotable_stations, snow_data) {

	var stations = {}

	plotable_stations.forEach( function(d) {
		stations[d.id] = d
	})

	var plotable = snow_data.map( function(d) { return [
		stations[d.station].longitude,
		stations[d.station].latitude,
		d.value,
		d.station,
		d.date
	]})

	var color = d3.scale.linear()
		.domain([0, 80])
		.range(["white", "steelblue"])
		.interpolate(d3.interpolateLab);
		
	var hexbin = d3.hexbin()
		.size([options.width, options.height])
		.radius(8);

	plotable.forEach(function(d) {
		var p = projection(d);
		d[0] = p[0], d[1] = p[1];
	});

	var map = create_svg(options)

	var element_options = {
		color: color,
		hexbin: hexbin,
		svg: map.svg,
		container_id: map.overlay_id
	}

	d3.json("world-110m.json", function(error, world) {
		map.svg.insert("path", ".graticule")
			.datum(topojson.feature(world, world.objects.land))
			.attr("class", "land")
			.attr("d", path);

		// The initial display.

		var dynamic = []
		var chunk = 0
		hex_update(element_options, dynamic)

		setInterval(function() {
			chunk = chunk % plotable.length
			if (chunk === 0) { dynamic = [] }
			dynamic.push(plotable[chunk])
			chunk++
			while (plotable[chunk][4] == (plotable[chunk+1] || [])[4]) {
				dynamic.push(plotable[chunk])
				chunk++
			}
			hex_update(element_options, dynamic)
		}, 100);

	});

/*
Do we want use the average snowfall for 
If we had measurements every day, then the value for a particular day would be the average measurement all the stations on that day.

The measurement for a particular day is the average value of all the measurements for that day.

*/
	function value(measures) {
		var station_counts = {}
		measures.forEach(function(d) {
			if (station_counts[d[3]] == undefined) { station_counts[d[3]] = {} }
			station_counts[d[3]] = {
				value: (station_counts[d[3]].value || 0) + d[2],
				measures : (station_counts[d[3]].measures || 0) + 1
			}
		})
		var v = 0
		for (var key in station_counts) {
			if (station_counts.hasOwnProperty(key)) {
				v = v + (station_counts[key].value/station_counts[key].measures);
			}
		}
		return v
	}
}

