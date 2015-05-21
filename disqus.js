 // disqus junk
 module.exports = function () {
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