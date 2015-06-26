 // disqus junk
 module.exports = function (post) {
  var identifier = '/post/' + post.id
  if (typeof DISQUS === 'undefined') {
    var disqus_shortname = 'karissamck';
    var disqus_identifier = identifier;
    (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript';
        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();
  } else {
    DISQUS.reset({
      reload: true,
      config: function () {
        this.page.identifier = identifier;
        this.page.url = 'http://karissa.github.io' + identifier
      }
    });
  }
}