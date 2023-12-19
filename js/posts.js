var fs = require('fs')
// ids don't really matter, just don't change them!
module.exports = [
  { id: 'upwelling',
    title: "Upwelling: Combining real-time collaboration with version control for writers.",
    date: "2023-3-1 10:10",
    categories: [],
    text: fs.readFileSync("posts/2023-3-1-upwelling.md").toString()
  },
  { id: 'backchannel',
    title: "Backchannel: A relationship-based identity system",
    date: "2021-9-1 10:10",
    categories: [],
    text: fs.readFileSync("posts/2021-9-1-backchannel.md").toString()
  },
  { id: 'platforms',
    title: "Why Social Platforms Should Work More Like Email",
    date: "2021-2-1 10:10",
    categories: [],
    text: fs.readFileSync("posts/2021-2-1-platforms.md").toString()
  },
  { id: 'dots-report',
    title: "Introducing Decentralization Off The Shelf",
    date: "2020-9-1 10:10",
    categories: [],
    text: fs.readFileSync("posts/2020-9-1-decentpatterns.md").toString()
  },
  { id: 'mapeo',
    title: "One year of co-design",
    date: "2020-7-29 10:10",
    categories: [],
    text: fs.readFileSync("posts/2020-7-29-codesign.md").toString()
  },
  { id: 'dinesh',
    title: "Renarration and Accessiblity: T B Dinesh on Localized Knowledge in Rural India",
    date: "2020-6-22 10:10",
    categories: [],
    text: fs.readFileSync("posts/2020-6-22-renarration.md").toString()
  },
  { id: 'cc',
    title: "Color Coded: Building Technologies of Respect for Our Collective Liberation",
    date: "2020-6-17 10:10",
    categories: [],
    text: fs.readFileSync("posts/2020-6-17-color-coded.md").toString()
  },
  { id: 'andoas',
    title: "Reflecting on Bringing MAPEO to Northern Peru",
    date: "2020-2-26 10:10",
    categories: ["tech", "training", "field", "security", "solidarity"],
    text: fs.readFileSync("posts/2020-2-25-andoas.md").toString()
  },
  { id: 'surveillance',
    title: "Surveillance capitalism’s impact on social change efforts, with Allen Gunn",
    date: "2019-12-11 10:10",
    categories: ["tech", "interview", "surveillance", "non-profit", "data solidarity"],
    text: fs.readFileSync("posts/2019-12-12-aspirationinterview.md").toString()
  },
  { id: 'localfirst',
    title: "Local-first software for frontline communities",
    date: "2019-10-10 10:10",
    categories: ["tech", "architecture", "localfirst"],
    text: fs.readFileSync("posts/2019-10-10-localfirst.md").toString()
  },
  { id: 'aspen-tech',
    title: "Aspen Institute's Tech Policy Hub: Results of my fellowship",
    date: "2019-06-18 10:10",
    categories: ["fellowship", "report", "career"],
    text: fs.readFileSync("posts/2019-6-18-aspen-tech-hub.md").toString()
  },
  { id: 'job-changes',
    title: "Now a Board Member of Code for Science and Society",
    date: "2018-04-05 10:10",
    categories: ["tech", "dat", "career"],
    text: fs.readFileSync("posts/2018-3-5-board-member-css.md").toString()
  },
  {
    id: 'web-of-commons',
    title: 'The Web of Commons',
    date: "2017-09-22 10:10",
    categories: ["talk", "tech", "research", "science", "data", "dat"],
    text: fs.readFileSync("posts/2017-9-22-web-of-commons.md").toString()
  },
  {
    id: 'called-out',
    title: "Picking yourself up after being called out",
    date: "2017-03-27 15:10",
    categories: ["lessons-learned", "short"],
    text: fs.readFileSync("posts/2017-03-27-racism.md").toString()
  },
  {
    id: 'okf-de',
    title: "How to run a FOSS project",
    date: "2016-09-01 23:10",
    categories: ["prototype", "non-profit", "grant", "money", ""],
    text: fs.readFileSync("posts/2016-09-01-okf-de.md").toString()
  },
  {
    id: 'publicbits-knight-money',
    title: "We won the Knight News Challenge!",
    date: "2016-02-01 23:10",
    categories: ["dat", "data", "non-profit", "grant", "money", "big girl pants"],
    text: fs.readFileSync("posts/2016-02-01-knight-money.md").toString()
  },
  {
    id: 'new-startup-plans-to-hedge-uber',
    title: "New Startup Plans to Hedge Uber's Bets",
    date: "2015-10-01 23:10",
    categories: ["startup", "uber", "satire"],
    text: fs.readFileSync("posts/2015-10-02-new-startup.markdown").toString()
  },
  {
    id: 'what-the-department-should-have-done',
    title: "What the Department of Education Should Have Done Years Ago",
    date: "2015-07-06 11:31",
    categories: ["government", "tech", "education", "debt"],
    text: fs.readFileSync("posts/2015-07-06-civicist.markdown").toString()
  },
  {
    id: 'debt-closet',
    title: "Coming out of the debt closet",
    date: "2015-01-13 15:29",
    categories: ["story", "debt", "personal"],
    text: fs.readFileSync("posts/2015-01-13-coming-out-of-the-debt-closet.markdown").toString()
  },
  {
    id: 'dont-say-its-easy',
    title: "Why you shouldn't say it's easy when teaching",
    date: "2014-04-26 23:24",
    categories: ["tech", "people", "teaching", "advice"],
    text: fs.readFileSync("posts/2014-04-26-why-you-shouldnt-say-its-easy-when-teaching.markdown").toString()
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
    categories: ["academia", "tech", "programming", "education", "the future"],
    text: fs.readFileSync("posts/2013-07-17-data-science-is-engineering.markdown").toString(),
    disqus: "blog/2013/07/07/data-science-is-engineering/"
  },
  {
    id: 'dont-forget-to-reply-all',
    title: "Don't forget to reply-all: E-mail is a terrible collaboration tool",
    date: "2013-06-13 16:24",
    categories: ["collaboration", "tech"],
    text: fs.readFileSync("posts/2013-07-17-dont-forget-to-reply-all.markdown").toString()
  },
  {
    id: 'widespread-apathy',
    title: "Widespread Apathy and the NSA",
    date: "2013-06-13 00:37",
    categories: ["politics", "tech", "surveillance"],
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
