var d3 = require('d3')

var width = 1400,
    height = 250

var json = {
  nodes: [
    {name: 'karissa', image: 'http://github.com/favicon.ico'},
    {name: '@karissamck', image: 'http://twitter.com/favicon.ico'},
    {name: 'karissamck', image: 'https://www.linkedin.com/favicon.ico'},
    {name: 'karissa.mckelvey', image: 'https://www.facebook.com/favicon.ico'},

    {name: 'indiana', image: 'http://indiana.edu/favicon.ico'},
    {name: 'usopendata', image: 'http://usopendata.org/favicon.ico'},
    {name: 'dat', image: 'http://dat-data.com/static/img/dat-hex-small.png'},

    {name: 'taskforce.is', image: 'https://taskforce.is/favicon.ico'},
    {name: 'brassliberation', image: 'http://brassliberation.org/img/blo_logo.gif'},
    {name: 'debtcollective', image: 'https://debtcollective.org/static/img/RedSquare_favicon.png'},
    {name: 'keybase', image: "https://keybase.io/favicon.ico"},

    {name: 'oakland', image: '/images/oaktree.png'},
    {name: 'you', image: '/images/laptop.png', cl: 'you'},
    {name: 'thewyattact', image: '/images/hat-purple.png'}
  ],
  links: [
    {source: 1, target: 2, value: 1},
    {source: 2, target: 3, value: 1},
    {source: 3, target: 2, value: 1},
    {source: 3, target: 4, value: 1},
    {source: 4, target: 1, value: 1},
    {source: 10, target: 0, value: 1},

    {source: 7, target: 9, value: 1},
    {source: 6, target: 0, value: 1},
    {source: 6, target: 5, value: 10},

    {source: 8, target: 11, value: 1},

    {source: 1, target: 9, value: 5},
    {source: 2, target: 4, value: 1},
    {source: 2, target: 5, value: 2},

    {source: 3, target: 11, value: 2},
    {source: 7, target: 11, value: 2},
    {source: 12, target: 0, value: 1},
    {source: 13, target: 11, value: 10}

  ]
}

var clicks = 0
var force_rendered = false

module.exports = function () {
  if (force_rendered) return
  force_rendered = true
  var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

  var force = d3.layout.force()
    .nodes(json.nodes)
    .links(json.links)
    .linkDistance(120)
    .gravity(0.002)
    .friction(0.1)
    .charge(-100)
    .linkStrength(.75)
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
    .attr("class", function (d) { return d.cl })
    .call(force.drag)
    .on('click', function () {
      clicks += 1
      if (clicks > 8) {
        d3.select("body")
        .attr("class", "burnout")
        .append("text").text()
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

  d3.select('.you').on('click', function () {
    clicks += 1
    if (clicks > 1) {
      d3.select("body")
      .attr("class", "burnout")
    }
  })

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  })
}
