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
    var shortname = post.disqus || 'post/' + post.id
    DISQUS.reset({
      reload: true,
      config: function () {
        this.page.identifier = shortname;
        this.page.url = "http://karissamck.com/" + shortname;
      }
    });
  }
}