var d3 = require('d3')

var json = {
  nodes: [
    {name: '@okdistribute', image: '/images/twitter.ico', url: 'http://twitter.com/okdistribute'},
    {name: 'okdistribute', image: '/images/github.ico', url: 'http://github.com/okdistribute'},
    {name: 'karissamck', image: '/images/linkedin.ico', url: 'https://www.linkedin.com/in/krmckelv'},
    {name: 'karissa.mckelvey', image: '/images/facebook.ico'},
    {name: 'oakland', image: '/images/oaktree.png', url: 'https://en.wikipedia.org/wiki/Oakland,_California'},
    {name: 'you', image: '/images/laptop.png', cl: 'you'},
    {name: 'debt collective', image: '/images/dc.png'},
    {name: 'ink & switch', image: '/images/is.png'}
  ],
  links: [
    {source: 1, target: 5, value: 1},
    {source: 2, target: 3, value: 1},
    {source: 3, target: 2, value: 6},
    {source: 1, target: 0, value: 4},
    {source: 2, target: 4, value: 2},
    {source: 2, target: 1, value: 2},
	{source: 0, target: 6, value: 5},
	{source: 1, target: 7, value: 5}

  ]
}

var clicks = 0
var graph = null
var svg = null
var force = null
var rendered = false

module.exports = function (height) {
  if (!graph) graph = d3.select("#graph")
  if (!svg) svg = graph.append("svg")
  if (!force) force = d3.layout.force()
    .nodes(json.nodes)
    .links(json.links)
    .linkDistance(120)
    .gravity(0.002)
    .friction(0.1)
    .charge(-100)
    .linkStrength(.75)

  var width = window.innerWidth
  graph.style({'height': height})
  svg.attr("width", width)
    .attr("height", height);
  force.size([width, height])
    .start();

  if (rendered) return
  rendered = true

  var link = svg.selectAll(".link")
    .data(json.links)
    .enter().append("line")
    .attr("class", "link");

  var node = svg.selectAll(".node")
    .data(json.nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("class", function (d) { return d.cl })
    .call(force.drag)
    .on('dblclick', function (d) {
      window.open(d.url)
    })
    .on('click', function (d) {
      clicks += 1
      if (clicks > 3) {
        d3.select("body")
        .attr("class", "burnout")
      }
    });

  node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });

  node.append("image")
      .attr("xlink:href", function (d) { return d.image })
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 16)
      .attr("height", 16);

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  })
}
