var fs = require('fs')
// numbers don't really matter, just don't change them!
module.exports = [
  {
    id: 'debt-closet',
    title: "Coming out of the debt closet",
    date: "2015-01-13 15:29",
    categories: ["story", "debt", "personal"],
    text: fs.readFileSync("posts/2015-01-13-coming-out-of-the-debt-closet.markdown").toString(),
    disqus: "blog/2015/01/13/coming-out-of-the-debt-closet/"
  },
  {
    id: 'dont-say-its-easy',
    title: "Why you shouldn't say it's easy when teaching",
    date: "2014-04-26 23:24",
    categories: ["development", "people", "teaching", "advice"],
    text: fs.readFileSync("posts/2014-04-26-why-you-shouldnt-say-its-easy-when-teaching.markdown").toString(),
    disqus: "blog/2014/04/26/why-you-shouldnt-say-its-easy-when-teaching"
  },
  {
    id: 'no-cages',
    title: "No cages.",
    date: "2014-02-17 13:33",
    categories: ["life"],
    text: fs.readFileSync("posts/2014-02-17-no-cages-for-me.markdown").toString()
  },
  {
    id: 'where-no-google-bus-commentary-goes',
    title: "Where no Google bus commentary goes",
    date: "2013-12-23 03:56",
    categories: ["movements", "politics", "opinion", "urban planning"],
    text: fs.readFileSync("posts/2013-12-23-where-no-google-bus-commentary-goes.markdown").toString()
  },
  {
    id: 'my-data-is-big-because',
    title: "'My data is Big because it doesn't load'",
    date: "2013-10-30 12:59",
    categories: ["academia", "research", "observations"],
    text: fs.readFileSync("posts/2013-10-30-big-data-is-big-because-it-doesnt-load-into-r.markdown").toString(),
  },
  {
    id: 'two-weeks-in-austin',
    title: "Two weeks in Austin",
    date: "2013-09-28 18:13",
    categories: ['personal', 'social', 'observations'],
    text: fs.readFileSync("posts/2013-08-12-coverage-of-more-tweets.markdown").toString()
  },
  {
    id: 'twitter-doesnt-matter-election',
    title: "Why it doesn't matter if Twitter will predict an election",
    date: "2013-08-23 23:24",
    categories: ["academia", "politics", "research"],
    text: fs.readFileSync("posts/2013-08-23-why-it-doesnt-matter-if-twitter-will.markdown").toString(),
  },
  {
    id: 'more-tweets-more-votes',
    title: "Coverage of More Tweets, More Votes",
    date: "2013-08-12 16:14",
    categories: ["news", "research"],
    text: fs.readFileSync("posts/2013-08-12-coverage-of-more-tweets.markdown").toString()
  },
  {
    id: 'data-science-is-engineering',
    title: "Data Science is Engineering",
    date: "2013-07-07 16:18",
    categories: ["academia", "programming", "education", "the future"],
    text: fs.readFileSync("posts/2013-07-17-data-science-is-engineering.markdown").toString(),
    disqus: "blog/2013/07/07/data-science-is-engineering/"
  },
  {
    id: 'dont-forget-to-reply-all',
    title: "Don't forget to reply-all: E-mail is a terrible collaboration tool",
    date: "2013-06-13 16:24",
    categories: ["collaboration", "technology"],
    text: fs.readFileSync("posts/2013-07-17-dont-forget-to-reply-all.markdown").toString()
  },
  {
    id: 'widespread-apathy',
    title: "Widespread Apathy and the NSA",
    date: "2013-06-13 00:37",
    categories: ["politics", "technology", "surveillance"],
    text: fs.readFileSync("posts/2013-07-30-widespread-apathy-and-the-nsa.markdown").toString()
  },
  {
    id: 'learning-to-code',
    title: "Expanded Best Practices when Learning to Code",
    date: "2013-06-01 00:43",
    categories: ["tutorials", "programming", "education"],
    text: fs.readFileSync("posts/2013-07-30-expanded-best-practices.markdown").toString()
  }
]