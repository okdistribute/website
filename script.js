var templater = require('a-simple-templater')
var fs = require('fs')
var marked = require('marked')
var Handlebars = require('handlebars')

var posts = require('./posts.js')

var routes = [
  {
    url: '/post/:id',
    template: fs.readFileSync('templates/post.html').toString(),
    data: function (params, cb) {
      var post = posts[params.id]
      post.disqus = post.disqus || '/post/' + post.id
      post.text = post.text
      cb(post)
    },
    onrender: function (params, data) {
      if (typeof DISQUS === 'undefined') {
        var disqus_shortname = 'karissamck';
        window.disqus_identifier = data.disqus;
        (function() {
            var dsq = document.createElement('script'); dsq.type = 'text/javascript';
            dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
        })();
      } else {
        var shortname = data.disqus || 'post/' + data.id
        DISQUS.reset({
          reload: true,
          config: function () {
            this.page.identifier = shortname;
            this.page.url = "http://karissamck.com/" + shortname;
          }
        });
      }
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
