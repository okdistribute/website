var Handlebars = require('handlebars')
var relativeDate = require('relative-date')
var marked = require('marked')
require('useful-date')
require('useful-date/locale/en-GB.js')

function newDate (date) {
  return new Date(date.replace(/-g/, '/'))
}

Handlebars.registerHelper('usefulDate', function (date) {
  return newDate(date).format('n F Y')
})

Handlebars.registerHelper('relativeDate', function (date) {
  return relativeDate(newDate(date))
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
