var templater = require('page-router')
var path = require('path')
var fs = require('fs')
var Handlebars = require('handlebars')
var csvjson = require('csvjson')
var Handlebars = require('handlebars')
var relativeDate = require('relative-date')
var marked = require('marked')
var moment = require('moment')

var talks = csvjson.toObject(
  fs.readFileSync(path.join(__dirname, 'talks.csv')).toString(), { delimiter: ',', quote: '"' }
)

var force = require('./js/force.js')
var posts = require('./js/posts.js')

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
      // disqus(post)
      return cb({
        posts: filtered.slice(0, 6),
        post: post
      })
    },
    onrender: function (params, data) {
      force(350)
    }
  },
  {
    url: '/about',
    template: fs.readFileSync('templates/about.html').toString(),
    onrender: function () {
      force(350)
    }
  },
  {
    url: '/stalkme',
    template: fs.readFileSync('templates/graph.html').toString(),
    onrender: function () {
      force(350)
    }
  },
  {
    url: '/projects',
    template: fs.readFileSync('templates/projects.html').toString(),
    onrender: function () {
      force(350)
    }
  },
  {
    url: '/talks',
    template: fs.readFileSync('templates/talks.html').toString(),
    data: function (params, cb) {
      cb({ talks })
    },
    onrender: function (params, data) {
      force(350)
    }
  },
  {
    url: '/',
    template: fs.readFileSync('templates/about.html').toString(),
    data: function (params, cb) {
      cb({ posts })
    },
    onrender: function (params, data) {
      force(350)
    }
  },
  {
    url: '/blog',
    template: fs.readFileSync('templates/blog.html').toString(),
    data: function (params, cb) {
      cb({ posts })
    },
    onrender: function (params, data) {
      blog()
      force(350)
    }
  }
]

Handlebars.registerHelper('usefulDate', function (date) {
  return moment(date).format('MMM Do YY')
})

Handlebars.registerHelper('relativeDate', function (date) {
  return relativeDate(moment(date))
})

Handlebars.registerHelper('overview', function (passedString) {
  var endIndex = passedString.indexOf('<!-- more -->')
  if (endIndex === -1) endIndex = 200
  var theString = passedString.substring(0, endIndex)
  theString += '...'
  return new Handlebars.SafeString(marked(theString))
})

Handlebars.registerHelper('markdown', function (string) {
  return new Handlebars.SafeString(marked(string))
})

console.log('if not us, who?')

templater('#content', routes, function (source, data) {
  var template = Handlebars.compile(source)
  return template(data)
})


function blog () {
  var list = document.getElementsByClassName('post-list')
  Array.from(list).forEach((el) => {
    console.log('el', el)
    var onclick = () => {
      console.log('poop')
      window.location.href = '/post/' + el.getAttribute('id')
    }
    el.addEventListener('click', onclick)
  })
}
