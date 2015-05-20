var templater = require('a-simple-templater');
var fs = require('fs')

var routes = [
  {
    url: '/post/:id',
    template: fs.readFileSync('templates/post.html').toString(),
    data: function (params, cb) {
      cb({
        post:
      })
    },
    onrender: function (params) {
      console.log('hello world', params)
    }
  },
  {
    url: '/',
    template: '<h1>{{title}}</h1>',
    data: function (params, cb)  {
      cb({
        title: 'hey whats up'
      })
    }
  }
]

templater('#content', routes)