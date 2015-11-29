var templater = require('page-router')
var fs = require('fs')
var usefulDate = require('useful-date')
require( 'useful-date/locale/en-GB.js' )
var relativeDate = require('relative-date')
var marked = require('marked')
var Handlebars = require('handlebars')

var force = require('./force.js')
var posts = require('./posts.js')

var routes = [
  {
    url: '/post/:id',
    template: fs.readFileSync('templates/post.html').toString(),
    data: function (params, cb) {
      posts.forEach(function (post) {
        if (post.id === params.id) {
          return cb({
            posts: posts,
            post: post
          })
        }
      })
    },
    onrender: function (params, data) {
      force(175)
    }
  },
  {
    url: '/graph',
    template: fs.readFileSync('templates/graph.html').toString(),
    onrender: function () {
      force(500)
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
      force(175)
    }
  }
]

console.log('if not us, who?')

Handlebars.registerHelper('usefulDate', function (date) {
  return new Date(date).format('n F Y')
})

Handlebars.registerHelper('relativeDate', function (date) {
  return relativeDate(new Date(date))
})

Handlebars.registerHelper('overview', function (passedString) {
  var endIndex = passedString.indexOf('<!-- more -->')
  if (endIndex === -1) endIndex = 300
  var theString = passedString.substring(0, endIndex)
  theString += '...'
  return new Handlebars.SafeString(marked(theString))
})

Handlebars.registerHelper('markdown', function (string) {
  return new Handlebars.SafeString(marked(string))
})

templater('#content', routes, function (source, data) {
  var template = Handlebars.compile(source)
  return template(data)
})
