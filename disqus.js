 // disqus junk
 module.exports = function (post) {
  var disqus_shortname = 'karissamck';
  var disqus_identifier = '/post/' + post.id;
  (function() {
      var dsq = document.createElement('script'); dsq.type = 'text/javascript';
      dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  })();
}