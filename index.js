var templater = require('page-router')
var fs = require('fs')
var Handlebars = require('handlebars')

var disqus = require('./js/disqus.js')
var force = require('./js/force.js')
var posts = require('./js/posts.js')
var helpers = require('./js/helpers')

var routes = [
  {
    url: '/post/:id',
    template: fs.readFileSync('templates/post.html').toString(),
    data: function (params, cb) {
      var post = null
      var filtered = posts.filter(function (p) {
        if (p.id === params.id) {
          post = p
          return false
        }
        return true
      })
      disqus(post)
      return cb({
        posts: filtered.slice(0, 6),
        post: post
      })
    },
    onrender: function (params, data) {
      force(250)
    }
  },
  {
    url: '/stalkme',
    template: fs.readFileSync('templates/graph.html').toString(),
    onrender: function () {
      force(400)
    }
  },
  {
    url: '/projects',
    template: fs.readFileSync('templates/projects.html').toString(),
    onrender: function () {
      force(250)
    }
  },
  {
    url: '/',
    template: fs.readFileSync('templates/home.html').toString(),
    data: function (params, cb) {
      cb({
        posts: posts.slice(0, 4)
      })
    },
    onrender: function (params, data) {
      force(250)
    }
  },
  {
    url: '/blog',
    template: fs.readFileSync('templates/blog.html').toString(),
    data: function (params, cb) {
      cb({
        posts: posts
      })
    },
    onrender: function (params, data) {
      force(250)
    }
  }
]

console.log('if not us, who?')

templater('#content', routes, function (source, data) {
  var template = Handlebars.compile(source)
  return template(data)
})
