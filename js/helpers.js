var Handlebars = require('handlebars')
var relativeDate = require('relative-date')
var marked = require('marked')
var moment = require('moment')

Handlebars.registerHelper('usefulDate', function (date) {
  return moment(date).format('MMM Do YY')
})

Handlebars.registerHelper('relativeDate', function (date) {
  return relativeDate(moment(date))
})

Handlebars.registerHelper('overview', function (passedString) {
  var endIndex = passedString.indexOf('<!-- more -->')
  if (endIndex === -1) endIndex = 200
  var theString = passedString.substring(0, endIndex)
  theString += '...'
  return new Handlebars.SafeString(theString)
})

Handlebars.registerHelper('markdown', function (string) {
  return new Handlebars.SafeString(marked(string))
})
