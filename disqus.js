 // disqus junk
 module.exports = function (post) {
  if (typeof DISQUS === 'undefined') {
    var disqus_shortname = 'karissamck';
    window.disqus_identifier = post.disqus;
    (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript';
        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();
  } else {
    DISQUS.reset({
      reload: true,
      config: function () {
        this.page.identifier = 'post/' + post.id;
      }
    });
  }
}