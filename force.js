var d3 = require('d3')

var width = 700,
    height = 200

var json = {
  nodes: [
    {name: 'karissa', group: 1, image: 'http://github.com/favicon.ico'},
    {name: 'karissamck', group: 1, image: 'http://twitter.com/favicon.ico'},
    {name: 'karissamck', group: 1, image: 'https://www.linkedin.com/favicon.ico'},
    {name: 'karissa.mckelvey', group: 1, image: 'https://www.facebook.com/favicon.ico'}
  ],
  links: [
    {source: 0, target: 1, value: 1},
    {source: 1, target: 2, value: 1},
    {source: 2, target: 3, value: 1},
    {source: 3, target: 2, value: 1},
    {source: 2, target: 0, value: 1},
    {source: 3, target: 0, value: 1},
    {source: 3, target: 1, value: 1}

  ]
}

module.exports = function () {
    console.log('yo')
  var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

  var force = d3.layout.force()
    .nodes(json.nodes)
    .links(json.links)
    .linkDistance(120)
    .gravity(.05)
    .theta(0.8)
    .alpha(0.1)
    .linkStrength(.20)
    .size([width, height])
    .start();

  var link = svg.selectAll(".link")
    .data(json.links)
    .enter().append("line")
    .attr("class", "link");

  var node = svg.selectAll(".node")
    .data(json.nodes)
    .enter().append("g")
    .attr("class", "node")
    .call(force.drag);

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
