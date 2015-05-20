var templater = require('a-simple-templater')
var fs = require('fs')
var marked = require('marked')
var Handlebars = require('handlebars')

var posts = {
  1: {
    id: 1,
    "title": "Data Science is Engineering",
    "date": "2013-07-07 16:18",
    "comments": true,
    "categories": ["academia", "programming", "education", "the future"],
    "text": fs.readFileSync("posts/2013-07-17-data-science-is-engineering.markdown").toString()
  },
  2: {
    id: 2,
    "title": "Don't forget to reply-all: E-mail is a terrible collaboration tool",
    "date": "2013-06-13 16:24",
    "comments": true,
    "categories": ["collaboration", "technology"],
    "text": fs.readFileSync("posts/2013-07-17-dont-forget-to-reply-all.markdown").toString()
  },
  3: {
    id: 3,
    "title": "Expanded Best Practices when Learning to Code",
    "date": "2013-06-01 00:43",
    "comments": true,
    "categories": ["tutorials", "programming", "education"],
    "text": fs.readFileSync("posts/2013-07-30-expanded-best-practices.markdown").toString()
  }
}
var routes = [
  {
    url: '/post/:id',
    template: fs.readFileSync('templates/post.html').toString(),
    data: function (params, cb) {
      var thing = posts[params.id]
      thing.text = thing.text
      cb(thing)
    },
    onrender: function (params) {
    }
  },
  {
    url: '/',
    template: fs.readFileSync('templates/blog.html').toString(),
    data: function (params, cb)  {
      cb({
        posts: posts
      })
    }
  }
]

Handlebars.registerHelper('overview', function(passedString) {
    var theString = passedString.substring(0,300);
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
