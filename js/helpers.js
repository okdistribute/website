var Handlebars = require('handlebars')
var relativeDate = require('relative-date')
var marked = require('marked')
require('useful-date')
require('useful-date/locale/en-GB.js')

Handlebars.registerHelper('usefulDate', function (date) {
  var d = new Date(date.replace(/-/g, '/'))
  return d.format('n F Y')
})

Handlebars.registerHelper('relativeDate', function (date) {
  return relativeDate(new Date(date))
})

Handlebars.registerHelper('overview', function (passedString) {
  var endIndex = passedString.indexOf('<!-- more -->')
  if (endIndex === -1) endIndex = 300
  var theString = passedString.substring(0, endIndex)
  theString += '...'
  return new Handlebars.SafeString(marked(theString))
})

Handlebars.registerHelper('markdown', function (string) {
  return new Handlebars.SafeString(marked(string))
})
