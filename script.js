var templater = require('a-simple-templater')
var fs = require('fs')
var marked = require('marked')
var Handlebars = require('handlebars')

var disqus = require('./disqus.js')
var force = require('./force.js')
var posts = require('./posts.js')

var routes = [
  {
    url: '/post/:id',
    template: fs.readFileSync('templates/post.html').toString(),
    data: function (params, cb) {
      posts.forEach(function (post) {
        if (post.id === parseInt(params.id)) {
          post.disqus = post.disqus || '/post/' + post.id
          post.text = post.text
          return cb(post)
        }
      })
    },
    onrender: function (params, data) {
      disqus()
      force()
    }
  },
  {
    url: '/graph',
    template: fs.readFileSync('templates/graph.html').toString(),
    onrender: function () {
      force()
    }
  },
  {
    url: '/',
    template: fs.readFileSync('templates/blog.html').toString(),
    data: function (params, cb)  {
      cb({
        posts: posts
      })
    },
    onrender: function (params, data) {
      console.log('params', params)
      force()
    }
  }
]

Handlebars.registerHelper('overview', function(passedString) {
  var endIndex = passedString.indexOf('<!-- more -->')
  if (endIndex === -1) endIndex = 300
  var theString = passedString.substring(0, endIndex);
  theString += "..."
  return new Handlebars.SafeString(marked(theString))
});

Handlebars.registerHelper('markdown', function(string) {
  return new Handlebars.SafeString(marked(string));
});

templater('#content', routes, function (source, data) {
  var template = Handlebars.compile(source)
  return template(data)
})
