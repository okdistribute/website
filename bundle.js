(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var page = require('page')
var dom = require('dom')
var mustache = require('mustache').render

module.exports = templater

function templater (contentSelector, routes, renderer) {
  if (!renderer) renderer = mustache
  if (!contentSelector) throw new Error('contentSelector required')
  if (!routes || !routes.length) throw new Error('routes should be a list of route objects')

  page('*', index)
  createRoutes(0)
  page('*', render)

  function index (ctx, next) {
    // default for all pages
    ctx.onrender = function () {}
    ctx.data = {}
    next()
  }

  function render (ctx, next) {
    var target = dom(contentSelector)
    var compiled = renderer(ctx.template, ctx.data)
    target.html(compiled)
    ctx.onrender(ctx.params, ctx.data)
  }

  function createRoutes (i) {
    if (i === routes.length) return
    else makePage(routes[i], function () {
      createRoutes(i+1)
    })
  }
  page()
}

function makePage (route, cb) {
  page(route.url, function (ctx, next) {
    if (!route.data) route.data = function (params, cb) { cb({}) }

    route.data(ctx.params, function (data) {
      ctx.template = route.template
      ctx.data = data
      if (route.onrender) ctx.onrender = route.onrender
      next()
    })
  })
  cb()
}

},{"dom":2,"mustache":10,"page":11}],2:[function(require,module,exports){

var domify = require('./lib/domify');
var classes = require('./lib/classes');
var matches = require('./lib/matches');
var event = require('./lib/event');
var mutation = require('./lib/mutation');

/**
 * Expose `dom()`.
 */

exports = module.exports = dom;

/**
 * Return a dom `List` for the given
 * `html`, selector, or element.
 *
 * @param {String|Element|List}
 * @return {List}
 * @api public
 */

function dom(selector, context) {

  // user must specify a selector
  if (!selector) {
    throw new Error('no selector specified');
  }

  // array
  if (selector instanceof Array) {
    return new List(selector);
  }

  var ctx = context;

  // if no context, then use document
  if (!ctx) {
    ctx = document;
  }
  // if context is another list, use the first element
  else if (ctx instanceof List) {
    ctx = context[0];
  }

  // flatten out a nodelist into regular array
  if (selector instanceof NodeList) {
    var arr = [];
    for (var i=0; i<selector.length ; ++i) {
      arr.push(selector[i]);
    }
    return new List(arr, selector);
  }

  // List
  if (selector instanceof List) {
    return selector;
  }

  // node
  if (selector.nodeName) {
    return new List([selector]);
  }

  // if selector is a string, trim off leading and trailing whitespace
  if (typeof selector === 'string') {
    selector = selector.trim();
  }

  // html
  if ('<' == selector.charAt(0)) {
    return dom(domify(selector));
  }

  // selector
  if ('string' == typeof selector) {
    return dom(ctx.querySelectorAll(selector), selector);
  }
}

/**
 * Expose `List` constructor.
 */

exports.List = List;

/**
 * Initialize a new `List` with the
 * given array-ish of `els` and `selector`
 * string.
 *
 * @param {Mixed} els
 * @param {String} selector
 * @api private
 */

function List(els, selector) {
  Array.prototype.push.apply(this, els);
  this.selector = selector;
}

// for minifying
var proto = List.prototype;

/**
 * Set attribute `name` to `val`, or get attr `name`.
 *
 * @param {String} name
 * @param {String} [val]
 * @return {String|List} self
 * @api public
 */

proto.attr = function(name, val) {
  if (val === undefined) {
    return this[0].getAttribute(name);
  }

  this[0].setAttribute(name, val);
  return this;
};

proto.removeAttr = function(name) {
  this[0].removeAttribute(name);
  return this;
};

// set or get the data attribute for the first element in the list
proto.data = function(key, value) {
  return this.attr('data-' + key, value);
};

/**
 * Return a cloned `List` with all elements cloned.
 *
 * @return {List}
 * @api public
 */

proto.clone = function(){
  var arr = [];
  for (var i = 0, len = this.length; i < len; ++i) {
    arr.push(this[i].cloneNode(true));
  }
  return new List(arr);
};

/**
 * Return a `List` containing the element at `i`.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

proto.at = function(i){
  return new List([this[i]], this.selector);
};

/**
 * Return a `List` containing the first element.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

proto.first = function(){
  return new List([this[0]], this.selector);
};

/**
 * Return a `List` containing the last element.
 *
 * @param {Number} i
 * @return {List}
 * @api public
 */

proto.last = function(){
  return new List([this[this.length - 1]], this.selector);
};

/**
 * Return list length.
 *
 * @return {Number}
 * @api public
 */

proto.length = function() {
  return this.length;
};

/**
 * Return element text.
 *
 * @return {String}
 * @api public
 */

proto.text = function(val) {
  if (val !== undefined) {
    this[0].textContent = val;
    return this;
  }

  var str = '';
  for (var i = 0; i < this.length; ++i) {
    str += this[i].textContent;
  }
  return str;
};

/**
 * Return element html.
 *
 * @return {String}
 * @api public
 */

proto.html = function(val){
  var el = this[0];

  if (val) {
    if (typeof(val) !== 'string') {
      throw new Error('.html() requires a string');
    }

    el.innerHTML = val;
    return this;
  }

  return el.innerHTML;
};

/**
 * Bind to `event` and invoke `fn(e)`. When
 * a `selector` is given then events are delegated.
 *
 * @param {String} event
 * @param {String} [selector]
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {List}
 * @api public
 */

proto.on = function(name, selector, fn, capture) {
  if ('string' == typeof selector) {

    var el = this[0];
    var deleg = function(e) {
      var target = e.target;
      do {
        if (matches(target, selector)) {

          var Event = function(e) {
            for (var k in e) {
              this[k] = e[k];
            }
          };

          // craete a new 'event' object
          // so we can replace the 'currentTarget' field
          var new_ev = new Event(e);

          // replace the current target
          new_ev.currentTarget = target;

          return fn.call(target, new_ev);
        }
        target = target.parentElement;
      } while (target && target !== el);
    }

    // TODO(shtylman) synthesize this event
    if (name === 'mouseenter') {
      name = 'mouseover';
    }

    for (var i = 0; i < this.length; ++i) {
      fn._delegate = deleg;
      event.bind(this[i], name, deleg, capture);
    }
    return this;
  }

  //TODO(shtylman) why not just override the fn and bind that?

  capture = fn;
  fn = selector;

  for (var i = 0; i < this.length; ++i) {
    event.bind(this[i], name, fn, capture);
  }

  return this;
};

/**
 * Unbind to `event` and invoke `fn(e)`. When
 * a `selector` is given then delegated event
 * handlers are unbound.
 *
 * @param {String} event
 * @param {String} [selector]
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {List}
 * @api public
 */

proto.off = function(name, selector, fn, capture){
  if ('string' == typeof selector) {
    for (var i = 0; i < this.length; ++i) {
      // TODO: add selector support back
      delegate.unbind(this[i], name, fn._delegate, capture);
    }
    return this;
  }

  capture = fn;
  fn = selector;

  for (var i = 0; i < this.length; ++i) {
    event.unbind(this[i], name, fn, capture);
  }
  return this;
};

/**
 * Iterate elements and invoke `fn(list, i)`.
 *
 * @param {Function} fn
 * @return {List} self
 * @api public
 */

proto.each = function(fn) {
  for (var i = 0; i < this.length; ++i) {
    fn(new List([this[i]], this.selector), i);
  }
  return this;
};

/**
 * Iterate elements and invoke `fn(el, i)`.
 *
 * @param {Function} fn
 * @return {List} self
 * @api public
 */

proto.forEach = function(fn) {
  Array.prototype.forEach.call(this, fn);
  return this;
};

/**
 * Map elements invoking `fn(list, i)`.
 *
 * @param {Function} fn
 * @return {Array}
 * @api public
 */

proto.map = function(fn){
  return Array.prototype.map.call(this, fn);
};

proto.select = function() {
  for (var i=0; i<this.length ; ++i) {
    var el = this[i];
    el.select();
  };

  return this;
};

/**
 * Filter elements invoking `fn(list, i)`, returning
 * a new `List` of elements when a truthy value is returned.
 *
 * @param {Function} fn
 * @return {List}
 * @api public
 */

proto.filter = function(fn) {
  var els = Array.prototype.filter.call(this, function(el) {
    return fn(new List([el], this.selector));
  });
  return new List(els, this.selector);
};

proto.value = function(val) {
  var el = this[0];
  if (val) {
    el.value = val;
    return this
  }

  return el.value;
};

proto.offset = function() {
  var el = this[0];
  var curleft = 0;
  var curtop = 0;

  if (el.offsetParent) {
    do {
      curleft += el.offsetLeft;
      curtop += el.offsetTop;
    } while (el = el.offsetParent);
  }

  return {
    left: curleft,
    top: curtop
  }
};

proto.position = function() {
  var el = this[0];
  return {
    top: el.offsetTop,
    left: el.offsetLeft
  }
};

/// includes border
proto.outerHeight = function() {
  return this[0].offsetHeight;
};

/// no border, includes padding
proto.innerHeight = function() {
  return this[0].clientHeight;
};

/// no border, no padding
/// this is slower than the others because it must get computed style values
proto.contentHeight = function() {
  var style = window.getComputedStyle(this[0], null);
  var ptop = style.getPropertyValue('padding-top').replace('px', '') - 0;
  var pbot = style.getPropertyValue('padding-bottom').replace('px', '') - 0;

  return this.innerHeight() - ptop - pbot;
};

proto.scrollHeight = function() {
  return this[0].scrollHeight;
};

/// includes border
proto.outerWidth = function() {
  return this[0].offsetWidth;
};

/// no border, includes padding
proto.innerWidth = function() {
  return this[0].clientWidth;
};

/// no border, no padding
/// this is slower than the others because it must get computed style values
proto.contentWidth = function() {
  var style = window.getComputedStyle(this[0], null);
  var pleft = style.getPropertyValue('padding-left').replace('px', '') - 0;
  var pright = style.getPropertyValue('padding-right').replace('px', '') - 0;

  return this.innerWidth() - pleft - pright;
};

proto.scrollWidth = function() {
  return this[0].scrollWidth;
};

/**
 * Add the given class `name`.
 *
 * @param {String} name
 * @return {List} self
 * @api public
 */

proto.addClass = function(name){
  var el;
  for (var i = 0; i < this.length; ++i) {
    el = this[i];
    el._classes = el._classes || classes(el);
    el._classes.add(name);
  }
  return this;
};

/**
 * Remove the given class `name`.
 *
 * @param {String} name
 * @return {List} self
 * @api public
 */

proto.removeClass = function(name){
  var el;
  for (var i = 0; i < this.length; ++i) {
    el = this[i];
    el._classes = el._classes || classes(el);
    el._classes.remove(name);
  }
  return this;
};

/**
 * Toggle the given class `name`.
 *
 * @param {String} name
 * @return {List} self
 * @api public
 */

proto.toggleClass = function(name){
  var el;
  for (var i = 0; i < this.length; ++i) {
    el = this[i];
    el._classes = el._classes || classes(el);
    el._classes.toggle(name);
  }
  return this;
};

/**
 * Check if the given class `name` is present.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

proto.hasClass = function(name){
  var el;
  for (var i = 0; i < this.length; ++i) {
    el = this[i];
    el._classes = el._classes || classes(el);
    if (el._classes.has(name)) return true;
  }
  return false;
};

/**
 * Set CSS `prop` to `val` or get `prop` value.
 *
 * @param {String} prop
 * @param {Mixed} val
 * @return {List|String}
 * @api public
 */

proto.css = function(prop, val){
  if (prop instanceof Object) {
    for(var p in prop) {
      this.setStyle(p, prop[p]);
    }
  }

  if (2 == arguments.length) {
    return this.setStyle(prop, val);
  }

  return this.getStyle(prop);
};

/**
 * Set CSS `prop` to `val`.
 *
 * @param {String} prop
 * @param {Mixed} val
 * @return {List} self
 * @api private
 */

proto.setStyle = function(prop, val){
  for (var i = 0; i < this.length; ++i) {
    this[i].style[prop] = val;
  }
  return this;
};

/**
 * Get CSS `prop` value.
 *
 * @param {String} prop
 * @return {String}
 * @api private
 */

proto.getStyle = function(prop) {
  var el = this[0];
  if (el) return el.style[prop];
};

/**
 * Find children matching the given `selector`.
 *
 * @param {String} selector
 * @return {List}
 * @api public
 */

proto.find = function(selector) {
  return dom(selector, this);
};

proto.next = function() {
  var els = [];
  for (var i=0 ; i<this.length ; ++i) {
    var next = this[i].nextElementSibling;
    // if no more siblings then don't push
    if (next) {
      els.push(next);
    }
  }

  return new List(els);
};

proto.prev = function() {
  var els = [];
  for (var i=0 ; i<this.length ; ++i) {
    var next = this[i].previousElementSibling;
    // if no more siblings then don't push
    if (next) {
      els.push(next);
    }
  }
  return new List(els);
};

proto.emit = function(name, opt) {
  event.emit(this[0], name, opt);
  return this;
};

proto.parent = function() {
  var els = [];
  for (var i=0 ; i<this.length ; ++i) {
    els.push(this[i].parentNode);
  }

  return new List(els);
};

/// mutation

proto.prepend = function(what) {
  for (var i=0 ; i<this.length ; ++i) {
    mutation.prepend(this[i], dom(what));
  }
  return this;
};

proto.append = function(what) {
  for (var i=0 ; i<this.length ; ++i) {
    mutation.append(this[i], dom(what));
  }
  return this;
};

proto.before = function(what) {
  for (var i=0 ; i<this.length ; ++i) {
    mutation.before(this[i], dom(what));
  }
  return this;
};

proto.after = function(what) {
  for (var i=0 ; i<this.length ; ++i) {
    mutation.after(this[i], dom(what));
  }
  return this;
};

proto.remove = function() {
  for (var i=0 ; i<this.length ; ++i) {
    mutation.remove(this[i]);
  }
};

proto.replace = function(what) {
  for (var i=0 ; i<this.length ; ++i) {
    mutation.replace(this[i], dom(what));
  }
  return this;
};

// note, we don't do .find('*').remove() here for efficiency
proto.empty = function() {
  for (var i=0 ; i<this.length ; ++i) {
    mutation.empty(this[i]);
  }
  return this;
};


},{"./lib/classes":3,"./lib/domify":4,"./lib/event":5,"./lib/matches":7,"./lib/mutation":8}],3:[function(require,module,exports){

// whitespace regex to avoid creating every time
var re = /\s+/;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = arr.indexOf(name);
  if (!~i) {
    arr.push(name);
  }
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = arr.indexOf(name);
  if (~i) {
    arr.splice(i, 1);
  }
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    return this.remove(name);
  }

  return this.add(name);
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var arr = this.el.className.split(re);
  if ('' === arr[0]) {
    arr.pop();
  }
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~this.array().indexOf(name);
};

},{}],4:[function(require,module,exports){

/**
 * Wrap map from jquery.
 */

var map = {
    option: [1, '<select multiple="multiple">', '</select>'],
    optgroup: [1, '<select multiple="multiple">', '</select>'],
    legend: [1, '<fieldset>', '</fieldset>'],
    thead: [1, '<table>', '</table>'],
    tbody: [1, '<table>', '</table>'],
    tfoot: [1, '<table>', '</table>'],
    colgroup: [1, '<table>', '</table>'],
    caption: [1, '<table>', '</table>'],
    tr: [2, '<table><tbody>', '</tbody></table>'],
    td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
    th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
    col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
    _default: [0, '', '']
};

/**
 * Convert the given `html` into DOM elements.
 * @return {Array} of html elements
 *
 * @api public
 */

module.exports = function(html){
    if (typeof html !== 'string') {
        throw new TypeError('String expected');
    }

    // tag name
    var m = /<([\w:]+)/.exec(html);
    if (!m) throw new Error('No elements were generated.');
    var tag = m[1];

    // body support
    if (tag == 'body') {
        var el = document.createElement('html');
        el.innerHTML = html;
        return [el.removeChild(el.lastChild)];
    }

    var elements = [];

    // wrap map
    var wrap = map[tag] || map._default;
    var depth = wrap[0];
    var prefix = wrap[1];
    var suffix = wrap[2];
    var el = document.createElement('div');
    el.innerHTML = prefix + html + suffix;

    // trim away wrapper elements
    while (depth--) {
        el = el.lastChild;
    };

    var els = [];

    var child = el.firstChild;
    do {
        els.push(child);
    } while (child = child.nextElementSibling);

    for (var i=0 ; i<els.length ; ++i) {
        el.removeChild(els[i]);
    }

    return els;
};

},{}],5:[function(require,module,exports){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
*/

exports.bind = function(el, type, fn, capture) {
    if (el.addEventListener) {
        el.addEventListener(type, fn, capture || false);
    } else {
        el.attachEvent('on' + type, fn);
    }

    return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
*/

exports.unbind = function(el, type, fn, capture) {
    if (el.removeEventListener) {
        el.removeEventListener(type, fn, capture || false);
    } else {
        el.detachEvent('on' + type, fn);
    }
    return fn;
};

exports.emit = function(el, name, opts) {
    opts = opts || {};
    var type = typeOf(name);

    var ev = document.createEvent(type + 's');

    // initKeyEvent in firefox
    // initKeyboardEvent in chrome

    var init = typeof ev['init' + type] === 'function'
      ? 'init' + type : 'initEvent';

    var sig = initSignatures[init];
    var args = [];
    var used = {};

    opts.type = name;

    for (var i = 0; i < sig.length; ++i) {
        var key = sig[i];
        var val = opts[key];
        // if no user specified value, then use event default
        if (val === undefined) {
            val = ev[key];
        }
        args.push(val);
    }
    ev[init].apply(ev, args);

    // attach remaining unused options to the object
    for (var key in opts) {
        if (!used[key]) {
            ev[key] = opts[key];
        }
    }

    return el.dispatchEvent(ev);
};

var initSignatures = require('./init.json');
var types = require('./types.json');
var typeOf = (function () {
    var typs = {};
    for (var key in types) {
        var ts = types[key];
        for (var i = 0; i < ts.length; i++) {
            typs[ts[i]] = key;
        }
    }

    return function (name) {
        return typs[name] || 'Event';
    };
})();

},{"./init.json":6,"./types.json":9}],6:[function(require,module,exports){
module.exports={
  "initEvent" : [
    "type",
    "bubbles",
    "cancelable"
  ],
  "initUIEvent" : [
    "type",
    "bubbles",
    "cancelable",
    "view",
    "detail"
  ],
  "initMouseEvent" : [
    "type",
    "bubbles",
    "cancelable",
    "view",
    "detail",
    "screenX",
    "screenY",
    "clientX",
    "clientY",
    "ctrlKey",
    "altKey",
    "shiftKey",
    "metaKey",
    "button",
    "relatedTarget"
  ],
  "initMutationEvent" : [
    "type",
    "bubbles",
    "cancelable",
    "relatedNode",
    "prevValue",
    "newValue",
    "attrName",
    "attrChange"
  ],
  "initKeyEvent" : [
    "type",
    "bubbles",
    "cancelable",
    "view",
    "ctrlKey",
    "altKey",
    "shiftKey",
    "metaKey",
    "keyCode",
    "charCode"
  ]
}

},{}],7:[function(require,module,exports){

var proto = Element.prototype;

var vendor = proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = function match(el, selector) {
    if (vendor) {
        return vendor.call(el, selector);
    }

    var nodes = el.parentNode.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; ++i) {
        if (nodes[i] == el) {
            return true;
        }
    }

    return false;
};

},{}],8:[function(require,module,exports){

function mkfragment(elements) {
    var frag = document.createDocumentFragment();

    for (var i=0 ; i<elements.length ; ++i) {
        frag.appendChild(elements[i]);
    }

    return frag;
};

module.exports.remove = function(el) {
    if (!el.parentNode) {
        return;
    }
    return el.parentNode.removeChild(el);
};

module.exports.replace = function(el, what) {
    if (!el.parentNode) {
        return;
    }
    return el.parentNode.replaceChild(mkfragment(what), el);
};

module.exports.prepend = function(el, what) {
    return el.insertBefore(mkfragment(what), el.firstChild);
};

module.exports.append = function(el, what) {
    var frag = document.createDocumentFragment();
    return el.appendChild(mkfragment(what));
};

// returns newly inserted element
module.exports.after = function(el, what) {
    if (!el.parentNode) {
        return;
    }

    // ie9 doesn't like null for insertBefore
    if (!el.nextSilbling) {
        return el.parentNode.appendChild(mkfragment(what));
    }

    return el.parentNode.insertBefore(mkfragment(what), el.nextSilbling);
};

module.exports.before = function(el, what) {
    if (!el.parentNode) {
        return;
    }
    return el.parentNode.insertBefore(mkfragment(what), el);
};

module.exports.empty = function(parent) {
    // cheap way to remove all children
    parent.innerHTML = '';
};


},{}],9:[function(require,module,exports){
module.exports={
  "MouseEvent" : [
    "click",
    "mousedown",
    "mouseup",
    "mouseover",
    "mousemove",
    "mouseout"
  ],
  "KeyEvent" : [
    "keydown",
    "keyup",
    "keypress"
  ],
  "MutationEvent" : [
    "DOMSubtreeModified",
    "DOMNodeInserted",
    "DOMNodeRemoved",
    "DOMNodeRemovedFromDocument",
    "DOMNodeInsertedIntoDocument",
    "DOMAttrModified",
    "DOMCharacterDataModified"
  ],
  "HTMLEvent" : [
    "load",
    "unload",
    "abort",
    "error",
    "select",
    "change",
    "submit",
    "reset",
    "focus",
    "blur",
    "resize",
    "scroll"
  ],
  "UIEvent" : [
    "DOMFocusIn",
    "DOMFocusOut",
    "DOMActivate"
  ]
}

},{}],10:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (global, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports); // CommonJS
  } else if (typeof define === "function" && define.amd) {
    define(['exports'], factory); // AMD
  } else {
    factory(global.Mustache = {}); // <script>
  }
}(this, function (mustache) {

  var Object_toString = Object.prototype.toString;
  var isArray = Array.isArray || function (object) {
    return Object_toString.call(object) === '[object Array]';
  };

  function isFunction(object) {
    return typeof object === 'function';
  }

  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var RegExp_test = RegExp.prototype.test;
  function testRegExp(re, string) {
    return RegExp_test.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate(template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags(tags) {
      if (typeof tags === 'string')
        tags = tags.split(spaceRe, 2);

      if (!isArray(tags) || tags.length !== 2)
        throw new Error('Invalid tags: ' + tags);

      openingTagRe = new RegExp(escapeRegExp(tags[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tags[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tags[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
      case '^':
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case '/':
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var index = this.tail.search(re), match;

    switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context(view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function (name) {
    var cache = this.cache;

    var value;
    if (name in cache) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1 && value != null)
              lookupHit = (typeof value === 'object') &&
                value.hasOwnProperty(names[index]);
            value = value[names[index++]];
          }
        } else if (context.view != null && typeof context.view === 'object') {
          value = context.view[name];
          lookupHit = context.view.hasOwnProperty(name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer() {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null)
      tokens = cache[template] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this._renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this._renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this._renderPartial(token, context, partials, originalTemplate);
      else if (symbol === '&') value = this._unescapedValue(token, context);
      else if (symbol === 'name') value = this._escapedValue(token, context);
      else if (symbol === 'text') value = this._rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype._renderSection = function (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender(template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

  Writer.prototype._renderInverted = function(token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

  Writer.prototype._renderPartial = function(token, context, partials) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

  Writer.prototype._unescapedValue = function(token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

  Writer.prototype._escapedValue = function(token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

  Writer.prototype._rawValue = function(token) {
    return token[1];
  };

  mustache.name = "mustache.js";
  mustache.version = "2.0.0";
  mustache.tags = [ "{{", "}}" ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function (template, view, partials) {
    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  mustache.to_html = function (template, view, partials, send) {
    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

}));

},{}],11:[function(require,module,exports){
(function (process){
  /* globals require, module */

  'use strict';

  /**
   * Module dependencies.
   */

  var pathtoRegexp = require('path-to-regexp');

  /**
   * Module exports.
   */

  module.exports = page;

  /**
   * Detect click event
   */
  var clickEvent = ('undefined' !== typeof document) && document.ontouchstart ? 'touchstart' : 'click';

  /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */

  var location = ('undefined' !== typeof window) && (window.history.location || window.location);

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;


  /**
   * Decode URL components (query string, pathname, hash).
   * Accommodates both regular percent encoding and x-www-form-urlencoded format.
   */
  var decodeURLComponents = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * HashBang option
   */

  var hashbang = false;

  /**
   * Previous context, for capturing
   * page exit events.
   */

  var prevContext;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' === typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' === typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
      // show <path> with [state]
    } else if ('string' === typeof path) {
      page['string' === typeof fn ? 'redirect' : 'show'](path, fn);
      // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];
  page.exits = [];

  /**
   * Current path being processed
   * @type {String}
   */
  page.current = '';

  /**
   * Number of pages navigated to.
   * @type {number}
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */

  page.len = 0;

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path) {
    if (0 === arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options) {
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false === options.decodeURLComponents) decodeURLComponents = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) {
      document.addEventListener(clickEvent, onclick, false);
    }
    if (true === options.hashbang) hashbang = true;
    if (!dispatch) return;
    var url = (hashbang && ~location.hash.indexOf('#!')) ? location.hash.substr(2) + location.search : location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function() {
    if (!running) return;
    page.current = '';
    page.len = 0;
    running = false;
    document.removeEventListener(clickEvent, onclick, false);
    window.removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch, push) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    if (false !== dispatch) page.dispatch(ctx);
    if (false !== ctx.handled && false !== push) ctx.pushState();
    return ctx;
  };

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {String} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object} [state]
   * @api public
   */

  page.back = function(path, state) {
    if (page.len > 0) {
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      history.back();
      page.len--;
    } else if (path) {
      setTimeout(function() {
        page.show(path, state);
      });
    }else{
      setTimeout(function() {
        page.show(base, state);
      });
    }
  };


  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {String} from - if param 'to' is undefined redirects to 'from'
   * @param {String} [to]
   * @api public
   */
  page.redirect = function(from, to) {
    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      page(from, function(e) {
        setTimeout(function() {
          page.replace(to);
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(function() {
        page.replace(from);
      }, 0);
    }
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */


  page.replace = function(path, state, init, dispatch) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) page.dispatch(ctx);
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx) {
    var prev = prevContext,
      i = 0,
      j = 0;

    prevContext = ctx;

    function nextExit() {
      var fn = page.exits[j++];
      if (!fn) return nextEnter();
      fn(prev, nextExit);
    }

    function nextEnter() {
      var fn = page.callbacks[i++];

      if (ctx.path !== page.current) {
        ctx.handled = false;
        return;
      }
      if (!fn) return unhandled(ctx);
      fn(ctx, nextEnter);
    }

    if (prev) {
      nextExit();
    } else {
      nextEnter();
    }
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    if (ctx.handled) return;
    var current;

    if (hashbang) {
      current = base + location.hash.replace('#!', '');
    } else {
      current = location.pathname + location.search;
    }

    if (current === ctx.canonicalPath) return;
    page.stop();
    ctx.handled = false;
    location.href = ctx.canonicalPath;
  }

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */
  page.exit = function(path, fn) {
    if (typeof path === 'function') {
      return page.exit('*', path);
    }

    var route = new Route(path);
    for (var i = 1; i < arguments.length; ++i) {
      page.exits.push(route.middleware(arguments[i]));
    }
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {str} URL component to decode
   */
  function decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') { return val; }
    return decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' === path[0] && 0 !== path.indexOf(base)) path = base + (hashbang ? '#!' : '') + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';
    if (hashbang) this.path = this.path.replace('#!', '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    this.params = {};

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) return;
      var parts = this.path.split('#');
      this.path = parts[0];
      this.hash = decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function() {
    page.len++;
    history.pushState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function() {
    history.replaceState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(this.path,
      this.keys = [],
      options.sensitive,
      options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Object} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params) {
    var keys = this.keys,
      qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
      m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };


  /**
   * Handle "populate" events.
   */

  var onpopstate = (function () {
    var loaded = false;
    if ('undefined' === typeof window) {
      return;
    }
    if (document.readyState === 'complete') {
      loaded = true;
    } else {
      window.addEventListener('load', function() {
        setTimeout(function() {
          loaded = true;
        }, 0);
      });
    }
    return function onpopstate(e) {
      if (!loaded) return;
      if (e.state) {
        var path = e.state.path;
        page.replace(path, e.state);
      } else {
        page.show(location.pathname + location.hash, undefined, undefined, false);
      }
    };
  })();
  /**
   * Handle "click" events.
   */

  function onclick(e) {

    if (1 !== which(e)) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;



    // ensure link
    var el = e.target;
    while (el && 'A' !== el.nodeName) el = el.parentNode;
    if (!el || 'A' !== el.nodeName) return;



    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (!hashbang && el.pathname === location.pathname && (el.hash || '#' === link)) return;



    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;



    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (typeof process !== 'undefined' && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    // same page
    var orig = path;

    if (path.indexOf(base) === 0) {
      path = path.substr(base.length);
    }

    if (hashbang) path = path.replace('#!', '');

    if (base && orig === path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null === e.which ? e.button : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return (href && (0 === href.indexOf(origin)));
  }

  page.sameOrigin = sameOrigin;

}).call(this,require('_process'))
},{"_process":20,"path-to-regexp":12}],12:[function(require,module,exports){
var isArray = require('isarray');

/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
  // Match regexp special characters that are always escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re;
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */
function flags (options) {
  return options.sensitive ? '' : 'i';
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name:      i,
        delimiter: null,
        optional:  false,
        repeat:    false
      });
    }
  }

  return attachKeys(path, keys);
}

/**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));
  return attachKeys(regexp, keys);
}

/**
 * Replace the specific tags with regexp strings.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @return {String}
 */
function replacePath (path, keys) {
  var index = 0;

  function replace (_, escaped, prefix, key, capture, group, suffix, escape) {
    if (escaped) {
      return escaped;
    }

    if (escape) {
      return '\\' + escape;
    }

    var repeat   = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';

    keys.push({
      name:      key || index++,
      delimiter: prefix || '/',
      optional:  optional,
      repeat:    repeat
    });

    prefix = prefix ? ('\\' + prefix) : '';
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

    if (repeat) {
      capture = capture + '(?:' + prefix + capture + ')*';
    }

    if (optional) {
      return '(?:' + prefix + '(' + capture + '))?';
    }

    // Basic parameter support.
    return prefix + '(' + capture + ')';
  }

  return path.replace(PATH_REGEXP, replace);
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || [];

  if (!isArray(keys)) {
    options = keys;
    keys = [];
  } else if (!options) {
    options = {};
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys, options);
  }

  if (isArray(path)) {
    return arrayToRegexp(path, keys, options);
  }

  var strict = options.strict;
  var end = options.end !== false;
  var route = replacePath(path, keys);
  var endsWithSlash = path.charAt(path.length - 1) === '/';

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return attachKeys(new RegExp('^' + route, flags(options)), keys);
}

},{"isarray":13}],13:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],14:[function(require,module,exports){

},{}],15:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined' && object.buffer instanceof ArrayBuffer) {
    return fromTypedArray(that, object)
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = String(string)

  if (string.length === 0) return 0

  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      return string.length
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return string.length * 2
    case 'hex':
      return string.length >>> 1
    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(string).length
    case 'base64':
      return base64ToBytes(string).length
    default:
      return string.length
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function toString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":16,"ieee754":17,"is-array":18}],16:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],17:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],18:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],19:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":20}],20:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],21:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;

var _runtime = require('./handlebars.runtime');

var _runtime2 = _interopRequireWildcard(_runtime);

// Compiler imports

var _AST = require('./handlebars/compiler/ast');

var _AST2 = _interopRequireWildcard(_AST);

var _Parser$parse = require('./handlebars/compiler/base');

var _Compiler$compile$precompile = require('./handlebars/compiler/compiler');

var _JavaScriptCompiler = require('./handlebars/compiler/javascript-compiler');

var _JavaScriptCompiler2 = _interopRequireWildcard(_JavaScriptCompiler);

var _Visitor = require('./handlebars/compiler/visitor');

var _Visitor2 = _interopRequireWildcard(_Visitor);

var _noConflict = require('./handlebars/no-conflict');

var _noConflict2 = _interopRequireWildcard(_noConflict);

var _create = _runtime2['default'].create;
function create() {
  var hb = _create();

  hb.compile = function (input, options) {
    return _Compiler$compile$precompile.compile(input, options, hb);
  };
  hb.precompile = function (input, options) {
    return _Compiler$compile$precompile.precompile(input, options, hb);
  };

  hb.AST = _AST2['default'];
  hb.Compiler = _Compiler$compile$precompile.Compiler;
  hb.JavaScriptCompiler = _JavaScriptCompiler2['default'];
  hb.Parser = _Parser$parse.parser;
  hb.parse = _Parser$parse.parse;

  return hb;
}

var inst = create();
inst.create = create;

_noConflict2['default'](inst);

inst.Visitor = _Visitor2['default'];

inst['default'] = inst;

exports['default'] = inst;
module.exports = exports['default'];
},{"./handlebars.runtime":22,"./handlebars/compiler/ast":24,"./handlebars/compiler/base":25,"./handlebars/compiler/compiler":27,"./handlebars/compiler/javascript-compiler":29,"./handlebars/compiler/visitor":32,"./handlebars/no-conflict":35}],22:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;

var _import = require('./handlebars/base');

var base = _interopRequireWildcard(_import);

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)

var _SafeString = require('./handlebars/safe-string');

var _SafeString2 = _interopRequireWildcard(_SafeString);

var _Exception = require('./handlebars/exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _import2 = require('./handlebars/utils');

var Utils = _interopRequireWildcard(_import2);

var _import3 = require('./handlebars/runtime');

var runtime = _interopRequireWildcard(_import3);

var _noConflict = require('./handlebars/no-conflict');

var _noConflict2 = _interopRequireWildcard(_noConflict);

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = _SafeString2['default'];
  hb.Exception = _Exception2['default'];
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function (spec) {
    return runtime.template(spec, hb);
  };

  return hb;
}

var inst = create();
inst.create = create;

_noConflict2['default'](inst);

inst['default'] = inst;

exports['default'] = inst;
module.exports = exports['default'];
},{"./handlebars/base":23,"./handlebars/exception":34,"./handlebars/no-conflict":35,"./handlebars/runtime":36,"./handlebars/safe-string":37,"./handlebars/utils":38}],23:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.HandlebarsEnvironment = HandlebarsEnvironment;
exports.createFrame = createFrame;

var _import = require('./utils');

var Utils = _interopRequireWildcard(_import);

var _Exception = require('./exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var VERSION = '3.0.1';
exports.VERSION = VERSION;
var COMPILER_REVISION = 6;

exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1'
};

exports.REVISION_CHANGES = REVISION_CHANGES;
var isArray = Utils.isArray,
    isFunction = Utils.isFunction,
    toString = Utils.toString,
    objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials) {
  this.helpers = helpers || {};
  this.partials = partials || {};

  registerDefaultHelpers(this);
}

HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: logger,
  log: log,

  registerHelper: function registerHelper(name, fn) {
    if (toString.call(name) === objectType) {
      if (fn) {
        throw new _Exception2['default']('Arg not supported with multiple helpers');
      }
      Utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function unregisterHelper(name) {
    delete this.helpers[name];
  },

  registerPartial: function registerPartial(name, partial) {
    if (toString.call(name) === objectType) {
      Utils.extend(this.partials, name);
    } else {
      if (typeof partial === 'undefined') {
        throw new _Exception2['default']('Attempting to register a partial as undefined');
      }
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function unregisterPartial(name) {
    delete this.partials[name];
  }
};

function registerDefaultHelpers(instance) {
  instance.registerHelper('helperMissing', function () {
    if (arguments.length === 1) {
      // A missing field in a {{foo}} constuct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new _Exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');
    }
  });

  instance.registerHelper('blockHelperMissing', function (context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if (context === true) {
      return fn(this);
    } else if (context === false || context == null) {
      return inverse(this);
    } else if (isArray(context)) {
      if (context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
        options = { data: data };
      }

      return fn(context, options);
    }
  });

  instance.registerHelper('each', function (context, options) {
    if (!options) {
      throw new _Exception2['default']('Must pass iterator to #each');
    }

    var fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = '',
        data = undefined,
        contextPath = undefined;

    if (options.data && options.ids) {
      contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (isFunction(context)) {
      context = context.call(this);
    }

    if (options.data) {
      data = createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;

        if (contextPath) {
          data.contextPath = contextPath + field;
        }
      }

      ret = ret + fn(context[field], {
        data: data,
        blockParams: Utils.blockParams([context[field], field], [contextPath + field, null])
      });
    }

    if (context && typeof context === 'object') {
      if (isArray(context)) {
        for (var j = context.length; i < j; i++) {
          execIteration(i, i, i === context.length - 1);
        }
      } else {
        var priorKey = undefined;

        for (var key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey) {
              execIteration(priorKey, i - 1);
            }
            priorKey = key;
            i++;
          }
        }
        if (priorKey) {
          execIteration(priorKey, i - 1, true);
        }
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  });

  instance.registerHelper('if', function (conditional, options) {
    if (isFunction(conditional)) {
      conditional = conditional.call(this);
    }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if (!options.hash.includeZero && !conditional || Utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function (conditional, options) {
    return instance.helpers['if'].call(this, conditional, { fn: options.inverse, inverse: options.fn, hash: options.hash });
  });

  instance.registerHelper('with', function (context, options) {
    if (isFunction(context)) {
      context = context.call(this);
    }

    var fn = options.fn;

    if (!Utils.isEmpty(context)) {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
        options = { data: data };
      }

      return fn(context, options);
    } else {
      return options.inverse(this);
    }
  });

  instance.registerHelper('log', function (message, options) {
    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
    instance.log(level, message);
  });

  instance.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
  });
}

var logger = {
  methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

  // State enum
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  level: 1,

  // Can be overridden in the host environment
  log: function log(level, message) {
    if (typeof console !== 'undefined' && logger.level <= level) {
      var method = logger.methodMap[level];
      (console[method] || console.log).call(console, message); // eslint-disable-line no-console
    }
  }
};

exports.logger = logger;
var log = logger.log;

exports.log = log;

function createFrame(object) {
  var frame = Utils.extend({}, object);
  frame._parent = object;
  return frame;
}

/* [args, ]options */
},{"./exception":34,"./utils":38}],24:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var AST = {
  Program: function Program(statements, blockParams, strip, locInfo) {
    this.loc = locInfo;
    this.type = 'Program';
    this.body = statements;

    this.blockParams = blockParams;
    this.strip = strip;
  },

  MustacheStatement: function MustacheStatement(path, params, hash, escaped, strip, locInfo) {
    this.loc = locInfo;
    this.type = 'MustacheStatement';

    this.path = path;
    this.params = params || [];
    this.hash = hash;
    this.escaped = escaped;

    this.strip = strip;
  },

  BlockStatement: function BlockStatement(path, params, hash, program, inverse, openStrip, inverseStrip, closeStrip, locInfo) {
    this.loc = locInfo;
    this.type = 'BlockStatement';

    this.path = path;
    this.params = params || [];
    this.hash = hash;
    this.program = program;
    this.inverse = inverse;

    this.openStrip = openStrip;
    this.inverseStrip = inverseStrip;
    this.closeStrip = closeStrip;
  },

  PartialStatement: function PartialStatement(name, params, hash, strip, locInfo) {
    this.loc = locInfo;
    this.type = 'PartialStatement';

    this.name = name;
    this.params = params || [];
    this.hash = hash;

    this.indent = '';
    this.strip = strip;
  },

  ContentStatement: function ContentStatement(string, locInfo) {
    this.loc = locInfo;
    this.type = 'ContentStatement';
    this.original = this.value = string;
  },

  CommentStatement: function CommentStatement(comment, strip, locInfo) {
    this.loc = locInfo;
    this.type = 'CommentStatement';
    this.value = comment;

    this.strip = strip;
  },

  SubExpression: function SubExpression(path, params, hash, locInfo) {
    this.loc = locInfo;

    this.type = 'SubExpression';
    this.path = path;
    this.params = params || [];
    this.hash = hash;
  },

  PathExpression: function PathExpression(data, depth, parts, original, locInfo) {
    this.loc = locInfo;
    this.type = 'PathExpression';

    this.data = data;
    this.original = original;
    this.parts = parts;
    this.depth = depth;
  },

  StringLiteral: function StringLiteral(string, locInfo) {
    this.loc = locInfo;
    this.type = 'StringLiteral';
    this.original = this.value = string;
  },

  NumberLiteral: function NumberLiteral(number, locInfo) {
    this.loc = locInfo;
    this.type = 'NumberLiteral';
    this.original = this.value = Number(number);
  },

  BooleanLiteral: function BooleanLiteral(bool, locInfo) {
    this.loc = locInfo;
    this.type = 'BooleanLiteral';
    this.original = this.value = bool === 'true';
  },

  UndefinedLiteral: function UndefinedLiteral(locInfo) {
    this.loc = locInfo;
    this.type = 'UndefinedLiteral';
    this.original = this.value = undefined;
  },

  NullLiteral: function NullLiteral(locInfo) {
    this.loc = locInfo;
    this.type = 'NullLiteral';
    this.original = this.value = null;
  },

  Hash: function Hash(pairs, locInfo) {
    this.loc = locInfo;
    this.type = 'Hash';
    this.pairs = pairs;
  },
  HashPair: function HashPair(key, value, locInfo) {
    this.loc = locInfo;
    this.type = 'HashPair';
    this.key = key;
    this.value = value;
  },

  // Public API used to evaluate derived attributes regarding AST nodes
  helpers: {
    // a mustache is definitely a helper if:
    // * it is an eligible helper, and
    // * it has at least one parameter or hash segment
    helperExpression: function helperExpression(node) {
      return !!(node.type === 'SubExpression' || node.params.length || node.hash);
    },

    scopedId: function scopedId(path) {
      return /^\.|this\b/.test(path.original);
    },

    // an ID is simple if it only has one part, and that part is not
    // `..` or `this`.
    simpleId: function simpleId(path) {
      return path.parts.length === 1 && !AST.helpers.scopedId(path) && !path.depth;
    }
  }
};

// Must be exported as an object rather than the root of the module as the jison lexer
// must modify the object to operate properly.
exports['default'] = AST;
module.exports = exports['default'];
},{}],25:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.parse = parse;

var _parser = require('./parser');

var _parser2 = _interopRequireWildcard(_parser);

var _AST = require('./ast');

var _AST2 = _interopRequireWildcard(_AST);

var _WhitespaceControl = require('./whitespace-control');

var _WhitespaceControl2 = _interopRequireWildcard(_WhitespaceControl);

var _import = require('./helpers');

var Helpers = _interopRequireWildcard(_import);

var _extend = require('../utils');

exports.parser = _parser2['default'];

var yy = {};
_extend.extend(yy, Helpers, _AST2['default']);

function parse(input, options) {
  // Just return if an already-compiled AST was passed in.
  if (input.type === 'Program') {
    return input;
  }

  _parser2['default'].yy = yy;

  // Altering the shared object here, but this is ok as parser is a sync operation
  yy.locInfo = function (locInfo) {
    return new yy.SourceLocation(options && options.srcName, locInfo);
  };

  var strip = new _WhitespaceControl2['default']();
  return strip.accept(_parser2['default'].parse(input));
}
},{"../utils":38,"./ast":24,"./helpers":28,"./parser":30,"./whitespace-control":33}],26:[function(require,module,exports){
'use strict';

exports.__esModule = true;
/*global define */

var _isArray = require('../utils');

var SourceNode = undefined;

try {
  /* istanbul ignore next */
  if (typeof define !== 'function' || !define.amd) {
    // We don't support this in AMD environments. For these environments, we asusme that
    // they are running on the browser and thus have no need for the source-map library.
    var SourceMap = require('source-map');
    SourceNode = SourceMap.SourceNode;
  }
} catch (err) {}

/* istanbul ignore if: tested but not covered in istanbul due to dist build  */
if (!SourceNode) {
  SourceNode = function (line, column, srcFile, chunks) {
    this.src = '';
    if (chunks) {
      this.add(chunks);
    }
  };
  /* istanbul ignore next */
  SourceNode.prototype = {
    add: function add(chunks) {
      if (_isArray.isArray(chunks)) {
        chunks = chunks.join('');
      }
      this.src += chunks;
    },
    prepend: function prepend(chunks) {
      if (_isArray.isArray(chunks)) {
        chunks = chunks.join('');
      }
      this.src = chunks + this.src;
    },
    toStringWithSourceMap: function toStringWithSourceMap() {
      return { code: this.toString() };
    },
    toString: function toString() {
      return this.src;
    }
  };
}

function castChunk(chunk, codeGen, loc) {
  if (_isArray.isArray(chunk)) {
    var ret = [];

    for (var i = 0, len = chunk.length; i < len; i++) {
      ret.push(codeGen.wrap(chunk[i], loc));
    }
    return ret;
  } else if (typeof chunk === 'boolean' || typeof chunk === 'number') {
    // Handle primitives that the SourceNode will throw up on
    return chunk + '';
  }
  return chunk;
}

function CodeGen(srcFile) {
  this.srcFile = srcFile;
  this.source = [];
}

CodeGen.prototype = {
  prepend: function prepend(source, loc) {
    this.source.unshift(this.wrap(source, loc));
  },
  push: function push(source, loc) {
    this.source.push(this.wrap(source, loc));
  },

  merge: function merge() {
    var source = this.empty();
    this.each(function (line) {
      source.add(['  ', line, '\n']);
    });
    return source;
  },

  each: function each(iter) {
    for (var i = 0, len = this.source.length; i < len; i++) {
      iter(this.source[i]);
    }
  },

  empty: function empty() {
    var loc = arguments[0] === undefined ? this.currentLocation || { start: {} } : arguments[0];

    return new SourceNode(loc.start.line, loc.start.column, this.srcFile);
  },
  wrap: function wrap(chunk) {
    var loc = arguments[1] === undefined ? this.currentLocation || { start: {} } : arguments[1];

    if (chunk instanceof SourceNode) {
      return chunk;
    }

    chunk = castChunk(chunk, this, loc);

    return new SourceNode(loc.start.line, loc.start.column, this.srcFile, chunk);
  },

  functionCall: function functionCall(fn, type, params) {
    params = this.generateList(params);
    return this.wrap([fn, type ? '.' + type + '(' : '(', params, ')']);
  },

  quotedString: function quotedString(str) {
    return '"' + (str + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028') // Per Ecma-262 7.3 + 7.8.4
    .replace(/\u2029/g, '\\u2029') + '"';
  },

  objectLiteral: function objectLiteral(obj) {
    var pairs = [];

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = castChunk(obj[key], this);
        if (value !== 'undefined') {
          pairs.push([this.quotedString(key), ':', value]);
        }
      }
    }

    var ret = this.generateList(pairs);
    ret.prepend('{');
    ret.add('}');
    return ret;
  },

  generateList: function generateList(entries, loc) {
    var ret = this.empty(loc);

    for (var i = 0, len = entries.length; i < len; i++) {
      if (i) {
        ret.add(',');
      }

      ret.add(castChunk(entries[i], this, loc));
    }

    return ret;
  },

  generateArray: function generateArray(entries, loc) {
    var ret = this.generateList(entries, loc);
    ret.prepend('[');
    ret.add(']');

    return ret;
  }
};

exports['default'] = CodeGen;
module.exports = exports['default'];

/* NOP */
},{"../utils":38,"source-map":40}],27:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.Compiler = Compiler;
exports.precompile = precompile;
exports.compile = compile;

var _Exception = require('../exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _isArray$indexOf = require('../utils');

var _AST = require('./ast');

var _AST2 = _interopRequireWildcard(_AST);

var slice = [].slice;

function Compiler() {}

// the foundHelper register will disambiguate helper lookup from finding a
// function in a context. This is necessary for mustache compatibility, which
// requires that context functions in blocks are evaluated by blockHelperMissing,
// and then proceed as if the resulting value was provided to blockHelperMissing.

Compiler.prototype = {
  compiler: Compiler,

  equals: function equals(other) {
    var len = this.opcodes.length;
    if (other.opcodes.length !== len) {
      return false;
    }

    for (var i = 0; i < len; i++) {
      var opcode = this.opcodes[i],
          otherOpcode = other.opcodes[i];
      if (opcode.opcode !== otherOpcode.opcode || !argEquals(opcode.args, otherOpcode.args)) {
        return false;
      }
    }

    // We know that length is the same between the two arrays because they are directly tied
    // to the opcode behavior above.
    len = this.children.length;
    for (var i = 0; i < len; i++) {
      if (!this.children[i].equals(other.children[i])) {
        return false;
      }
    }

    return true;
  },

  guid: 0,

  compile: function compile(program, options) {
    this.sourceNode = [];
    this.opcodes = [];
    this.children = [];
    this.options = options;
    this.stringParams = options.stringParams;
    this.trackIds = options.trackIds;

    options.blockParams = options.blockParams || [];

    // These changes will propagate to the other compiler components
    var knownHelpers = options.knownHelpers;
    options.knownHelpers = {
      helperMissing: true,
      blockHelperMissing: true,
      each: true,
      'if': true,
      unless: true,
      'with': true,
      log: true,
      lookup: true
    };
    if (knownHelpers) {
      for (var _name in knownHelpers) {
        if (_name in knownHelpers) {
          options.knownHelpers[_name] = knownHelpers[_name];
        }
      }
    }

    return this.accept(program);
  },

  compileProgram: function compileProgram(program) {
    var childCompiler = new this.compiler(),
        // eslint-disable-line new-cap
    result = childCompiler.compile(program, this.options),
        guid = this.guid++;

    this.usePartial = this.usePartial || result.usePartial;

    this.children[guid] = result;
    this.useDepths = this.useDepths || result.useDepths;

    return guid;
  },

  accept: function accept(node) {
    this.sourceNode.unshift(node);
    var ret = this[node.type](node);
    this.sourceNode.shift();
    return ret;
  },

  Program: function Program(program) {
    this.options.blockParams.unshift(program.blockParams);

    var body = program.body,
        bodyLength = body.length;
    for (var i = 0; i < bodyLength; i++) {
      this.accept(body[i]);
    }

    this.options.blockParams.shift();

    this.isSimple = bodyLength === 1;
    this.blockParams = program.blockParams ? program.blockParams.length : 0;

    return this;
  },

  BlockStatement: function BlockStatement(block) {
    transformLiteralToPath(block);

    var program = block.program,
        inverse = block.inverse;

    program = program && this.compileProgram(program);
    inverse = inverse && this.compileProgram(inverse);

    var type = this.classifySexpr(block);

    if (type === 'helper') {
      this.helperSexpr(block, program, inverse);
    } else if (type === 'simple') {
      this.simpleSexpr(block);

      // now that the simple mustache is resolved, we need to
      // evaluate it by executing `blockHelperMissing`
      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);
      this.opcode('emptyHash');
      this.opcode('blockValue', block.path.original);
    } else {
      this.ambiguousSexpr(block, program, inverse);

      // now that the simple mustache is resolved, we need to
      // evaluate it by executing `blockHelperMissing`
      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);
      this.opcode('emptyHash');
      this.opcode('ambiguousBlockValue');
    }

    this.opcode('append');
  },

  PartialStatement: function PartialStatement(partial) {
    this.usePartial = true;

    var params = partial.params;
    if (params.length > 1) {
      throw new _Exception2['default']('Unsupported number of partial arguments: ' + params.length, partial);
    } else if (!params.length) {
      params.push({ type: 'PathExpression', parts: [], depth: 0 });
    }

    var partialName = partial.name.original,
        isDynamic = partial.name.type === 'SubExpression';
    if (isDynamic) {
      this.accept(partial.name);
    }

    this.setupFullMustacheParams(partial, undefined, undefined, true);

    var indent = partial.indent || '';
    if (this.options.preventIndent && indent) {
      this.opcode('appendContent', indent);
      indent = '';
    }

    this.opcode('invokePartial', isDynamic, partialName, indent);
    this.opcode('append');
  },

  MustacheStatement: function MustacheStatement(mustache) {
    this.SubExpression(mustache); // eslint-disable-line new-cap

    if (mustache.escaped && !this.options.noEscape) {
      this.opcode('appendEscaped');
    } else {
      this.opcode('append');
    }
  },

  ContentStatement: function ContentStatement(content) {
    if (content.value) {
      this.opcode('appendContent', content.value);
    }
  },

  CommentStatement: function CommentStatement() {},

  SubExpression: function SubExpression(sexpr) {
    transformLiteralToPath(sexpr);
    var type = this.classifySexpr(sexpr);

    if (type === 'simple') {
      this.simpleSexpr(sexpr);
    } else if (type === 'helper') {
      this.helperSexpr(sexpr);
    } else {
      this.ambiguousSexpr(sexpr);
    }
  },
  ambiguousSexpr: function ambiguousSexpr(sexpr, program, inverse) {
    var path = sexpr.path,
        name = path.parts[0],
        isBlock = program != null || inverse != null;

    this.opcode('getContext', path.depth);

    this.opcode('pushProgram', program);
    this.opcode('pushProgram', inverse);

    this.accept(path);

    this.opcode('invokeAmbiguous', name, isBlock);
  },

  simpleSexpr: function simpleSexpr(sexpr) {
    this.accept(sexpr.path);
    this.opcode('resolvePossibleLambda');
  },

  helperSexpr: function helperSexpr(sexpr, program, inverse) {
    var params = this.setupFullMustacheParams(sexpr, program, inverse),
        path = sexpr.path,
        name = path.parts[0];

    if (this.options.knownHelpers[name]) {
      this.opcode('invokeKnownHelper', params.length, name);
    } else if (this.options.knownHelpersOnly) {
      throw new _Exception2['default']('You specified knownHelpersOnly, but used the unknown helper ' + name, sexpr);
    } else {
      path.falsy = true;

      this.accept(path);
      this.opcode('invokeHelper', params.length, path.original, _AST2['default'].helpers.simpleId(path));
    }
  },

  PathExpression: function PathExpression(path) {
    this.addDepth(path.depth);
    this.opcode('getContext', path.depth);

    var name = path.parts[0],
        scoped = _AST2['default'].helpers.scopedId(path),
        blockParamId = !path.depth && !scoped && this.blockParamIndex(name);

    if (blockParamId) {
      this.opcode('lookupBlockParam', blockParamId, path.parts);
    } else if (!name) {
      // Context reference, i.e. `{{foo .}}` or `{{foo ..}}`
      this.opcode('pushContext');
    } else if (path.data) {
      this.options.data = true;
      this.opcode('lookupData', path.depth, path.parts);
    } else {
      this.opcode('lookupOnContext', path.parts, path.falsy, scoped);
    }
  },

  StringLiteral: function StringLiteral(string) {
    this.opcode('pushString', string.value);
  },

  NumberLiteral: function NumberLiteral(number) {
    this.opcode('pushLiteral', number.value);
  },

  BooleanLiteral: function BooleanLiteral(bool) {
    this.opcode('pushLiteral', bool.value);
  },

  UndefinedLiteral: function UndefinedLiteral() {
    this.opcode('pushLiteral', 'undefined');
  },

  NullLiteral: function NullLiteral() {
    this.opcode('pushLiteral', 'null');
  },

  Hash: function Hash(hash) {
    var pairs = hash.pairs,
        i = 0,
        l = pairs.length;

    this.opcode('pushHash');

    for (; i < l; i++) {
      this.pushParam(pairs[i].value);
    }
    while (i--) {
      this.opcode('assignToHash', pairs[i].key);
    }
    this.opcode('popHash');
  },

  // HELPERS
  opcode: function opcode(name) {
    this.opcodes.push({ opcode: name, args: slice.call(arguments, 1), loc: this.sourceNode[0].loc });
  },

  addDepth: function addDepth(depth) {
    if (!depth) {
      return;
    }

    this.useDepths = true;
  },

  classifySexpr: function classifySexpr(sexpr) {
    var isSimple = _AST2['default'].helpers.simpleId(sexpr.path);

    var isBlockParam = isSimple && !!this.blockParamIndex(sexpr.path.parts[0]);

    // a mustache is an eligible helper if:
    // * its id is simple (a single part, not `this` or `..`)
    var isHelper = !isBlockParam && _AST2['default'].helpers.helperExpression(sexpr);

    // if a mustache is an eligible helper but not a definite
    // helper, it is ambiguous, and will be resolved in a later
    // pass or at runtime.
    var isEligible = !isBlockParam && (isHelper || isSimple);

    // if ambiguous, we can possibly resolve the ambiguity now
    // An eligible helper is one that does not have a complex path, i.e. `this.foo`, `../foo` etc.
    if (isEligible && !isHelper) {
      var _name2 = sexpr.path.parts[0],
          options = this.options;

      if (options.knownHelpers[_name2]) {
        isHelper = true;
      } else if (options.knownHelpersOnly) {
        isEligible = false;
      }
    }

    if (isHelper) {
      return 'helper';
    } else if (isEligible) {
      return 'ambiguous';
    } else {
      return 'simple';
    }
  },

  pushParams: function pushParams(params) {
    for (var i = 0, l = params.length; i < l; i++) {
      this.pushParam(params[i]);
    }
  },

  pushParam: function pushParam(val) {
    var value = val.value != null ? val.value : val.original || '';

    if (this.stringParams) {
      if (value.replace) {
        value = value.replace(/^(\.?\.\/)*/g, '').replace(/\//g, '.');
      }

      if (val.depth) {
        this.addDepth(val.depth);
      }
      this.opcode('getContext', val.depth || 0);
      this.opcode('pushStringParam', value, val.type);

      if (val.type === 'SubExpression') {
        // SubExpressions get evaluated and passed in
        // in string params mode.
        this.accept(val);
      }
    } else {
      if (this.trackIds) {
        var blockParamIndex = undefined;
        if (val.parts && !_AST2['default'].helpers.scopedId(val) && !val.depth) {
          blockParamIndex = this.blockParamIndex(val.parts[0]);
        }
        if (blockParamIndex) {
          var blockParamChild = val.parts.slice(1).join('.');
          this.opcode('pushId', 'BlockParam', blockParamIndex, blockParamChild);
        } else {
          value = val.original || value;
          if (value.replace) {
            value = value.replace(/^\.\//g, '').replace(/^\.$/g, '');
          }

          this.opcode('pushId', val.type, value);
        }
      }
      this.accept(val);
    }
  },

  setupFullMustacheParams: function setupFullMustacheParams(sexpr, program, inverse, omitEmpty) {
    var params = sexpr.params;
    this.pushParams(params);

    this.opcode('pushProgram', program);
    this.opcode('pushProgram', inverse);

    if (sexpr.hash) {
      this.accept(sexpr.hash);
    } else {
      this.opcode('emptyHash', omitEmpty);
    }

    return params;
  },

  blockParamIndex: function blockParamIndex(name) {
    for (var depth = 0, len = this.options.blockParams.length; depth < len; depth++) {
      var blockParams = this.options.blockParams[depth],
          param = blockParams && _isArray$indexOf.indexOf(blockParams, name);
      if (blockParams && param >= 0) {
        return [depth, param];
      }
    }
  }
};

function precompile(input, options, env) {
  if (input == null || typeof input !== 'string' && input.type !== 'Program') {
    throw new _Exception2['default']('You must pass a string or Handlebars AST to Handlebars.precompile. You passed ' + input);
  }

  options = options || {};
  if (!('data' in options)) {
    options.data = true;
  }
  if (options.compat) {
    options.useDepths = true;
  }

  var ast = env.parse(input, options),
      environment = new env.Compiler().compile(ast, options);
  return new env.JavaScriptCompiler().compile(environment, options);
}

function compile(input, _x, env) {
  var options = arguments[1] === undefined ? {} : arguments[1];

  if (input == null || typeof input !== 'string' && input.type !== 'Program') {
    throw new _Exception2['default']('You must pass a string or Handlebars AST to Handlebars.compile. You passed ' + input);
  }

  if (!('data' in options)) {
    options.data = true;
  }
  if (options.compat) {
    options.useDepths = true;
  }

  var compiled = undefined;

  function compileInput() {
    var ast = env.parse(input, options),
        environment = new env.Compiler().compile(ast, options),
        templateSpec = new env.JavaScriptCompiler().compile(environment, options, undefined, true);
    return env.template(templateSpec);
  }

  // Template is only compiled on first use and cached after that point.
  function ret(context, execOptions) {
    if (!compiled) {
      compiled = compileInput();
    }
    return compiled.call(this, context, execOptions);
  }
  ret._setup = function (setupOptions) {
    if (!compiled) {
      compiled = compileInput();
    }
    return compiled._setup(setupOptions);
  };
  ret._child = function (i, data, blockParams, depths) {
    if (!compiled) {
      compiled = compileInput();
    }
    return compiled._child(i, data, blockParams, depths);
  };
  return ret;
}

function argEquals(a, b) {
  if (a === b) {
    return true;
  }

  if (_isArray$indexOf.isArray(a) && _isArray$indexOf.isArray(b) && a.length === b.length) {
    for (var i = 0; i < a.length; i++) {
      if (!argEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
}

function transformLiteralToPath(sexpr) {
  if (!sexpr.path.parts) {
    var literal = sexpr.path;
    // Casting to string here to make false and 0 literal values play nicely with the rest
    // of the system.
    sexpr.path = new _AST2['default'].PathExpression(false, 0, [literal.original + ''], literal.original + '', literal.loc);
  }
}
},{"../exception":34,"../utils":38,"./ast":24}],28:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.SourceLocation = SourceLocation;
exports.id = id;
exports.stripFlags = stripFlags;
exports.stripComment = stripComment;
exports.preparePath = preparePath;
exports.prepareMustache = prepareMustache;
exports.prepareRawBlock = prepareRawBlock;
exports.prepareBlock = prepareBlock;

var _Exception = require('../exception');

var _Exception2 = _interopRequireWildcard(_Exception);

function SourceLocation(source, locInfo) {
  this.source = source;
  this.start = {
    line: locInfo.first_line,
    column: locInfo.first_column
  };
  this.end = {
    line: locInfo.last_line,
    column: locInfo.last_column
  };
}

function id(token) {
  if (/^\[.*\]$/.test(token)) {
    return token.substr(1, token.length - 2);
  } else {
    return token;
  }
}

function stripFlags(open, close) {
  return {
    open: open.charAt(2) === '~',
    close: close.charAt(close.length - 3) === '~'
  };
}

function stripComment(comment) {
  return comment.replace(/^\{\{~?\!-?-?/, '').replace(/-?-?~?\}\}$/, '');
}

function preparePath(data, parts, locInfo) {
  locInfo = this.locInfo(locInfo);

  var original = data ? '@' : '',
      dig = [],
      depth = 0,
      depthString = '';

  for (var i = 0, l = parts.length; i < l; i++) {
    var part = parts[i].part,

    // If we have [] syntax then we do not treat path references as operators,
    // i.e. foo.[this] resolves to approximately context.foo['this']
    isLiteral = parts[i].original !== part;
    original += (parts[i].separator || '') + part;

    if (!isLiteral && (part === '..' || part === '.' || part === 'this')) {
      if (dig.length > 0) {
        throw new _Exception2['default']('Invalid path: ' + original, { loc: locInfo });
      } else if (part === '..') {
        depth++;
        depthString += '../';
      }
    } else {
      dig.push(part);
    }
  }

  return new this.PathExpression(data, depth, dig, original, locInfo);
}

function prepareMustache(path, params, hash, open, strip, locInfo) {
  // Must use charAt to support IE pre-10
  var escapeFlag = open.charAt(3) || open.charAt(2),
      escaped = escapeFlag !== '{' && escapeFlag !== '&';

  return new this.MustacheStatement(path, params, hash, escaped, strip, this.locInfo(locInfo));
}

function prepareRawBlock(openRawBlock, content, close, locInfo) {
  if (openRawBlock.path.original !== close) {
    var errorNode = { loc: openRawBlock.path.loc };

    throw new _Exception2['default'](openRawBlock.path.original + ' doesn\'t match ' + close, errorNode);
  }

  locInfo = this.locInfo(locInfo);
  var program = new this.Program([content], null, {}, locInfo);

  return new this.BlockStatement(openRawBlock.path, openRawBlock.params, openRawBlock.hash, program, undefined, {}, {}, {}, locInfo);
}

function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
  // When we are chaining inverse calls, we will not have a close path
  if (close && close.path && openBlock.path.original !== close.path.original) {
    var errorNode = { loc: openBlock.path.loc };

    throw new _Exception2['default'](openBlock.path.original + ' doesn\'t match ' + close.path.original, errorNode);
  }

  program.blockParams = openBlock.blockParams;

  var inverse = undefined,
      inverseStrip = undefined;

  if (inverseAndProgram) {
    if (inverseAndProgram.chain) {
      inverseAndProgram.program.body[0].closeStrip = close.strip;
    }

    inverseStrip = inverseAndProgram.strip;
    inverse = inverseAndProgram.program;
  }

  if (inverted) {
    inverted = inverse;
    inverse = program;
    program = inverted;
  }

  return new this.BlockStatement(openBlock.path, openBlock.params, openBlock.hash, program, inverse, openBlock.strip, inverseStrip, close && close.strip, this.locInfo(locInfo));
}
},{"../exception":34}],29:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;

var _COMPILER_REVISION$REVISION_CHANGES = require('../base');

var _Exception = require('../exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _isArray = require('../utils');

var _CodeGen = require('./code-gen');

var _CodeGen2 = _interopRequireWildcard(_CodeGen);

function Literal(value) {
  this.value = value;
}

function JavaScriptCompiler() {}

JavaScriptCompiler.prototype = {
  // PUBLIC API: You can override these methods in a subclass to provide
  // alternative compiled forms for name lookup and buffering semantics
  nameLookup: function nameLookup(parent, name /* , type*/) {
    if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
      return [parent, '.', name];
    } else {
      return [parent, '[\'', name, '\']'];
    }
  },
  depthedLookup: function depthedLookup(name) {
    return [this.aliasable('this.lookup'), '(depths, "', name, '")'];
  },

  compilerInfo: function compilerInfo() {
    var revision = _COMPILER_REVISION$REVISION_CHANGES.COMPILER_REVISION,
        versions = _COMPILER_REVISION$REVISION_CHANGES.REVISION_CHANGES[revision];
    return [revision, versions];
  },

  appendToBuffer: function appendToBuffer(source, location, explicit) {
    // Force a source as this simplifies the merge logic.
    if (!_isArray.isArray(source)) {
      source = [source];
    }
    source = this.source.wrap(source, location);

    if (this.environment.isSimple) {
      return ['return ', source, ';'];
    } else if (explicit) {
      // This is a case where the buffer operation occurs as a child of another
      // construct, generally braces. We have to explicitly output these buffer
      // operations to ensure that the emitted code goes in the correct location.
      return ['buffer += ', source, ';'];
    } else {
      source.appendToBuffer = true;
      return source;
    }
  },

  initializeBuffer: function initializeBuffer() {
    return this.quotedString('');
  },
  // END PUBLIC API

  compile: function compile(environment, options, context, asObject) {
    this.environment = environment;
    this.options = options;
    this.stringParams = this.options.stringParams;
    this.trackIds = this.options.trackIds;
    this.precompile = !asObject;

    this.name = this.environment.name;
    this.isChild = !!context;
    this.context = context || {
      programs: [],
      environments: []
    };

    this.preamble();

    this.stackSlot = 0;
    this.stackVars = [];
    this.aliases = {};
    this.registers = { list: [] };
    this.hashes = [];
    this.compileStack = [];
    this.inlineStack = [];
    this.blockParams = [];

    this.compileChildren(environment, options);

    this.useDepths = this.useDepths || environment.useDepths || this.options.compat;
    this.useBlockParams = this.useBlockParams || environment.useBlockParams;

    var opcodes = environment.opcodes,
        opcode = undefined,
        firstLoc = undefined,
        i = undefined,
        l = undefined;

    for (i = 0, l = opcodes.length; i < l; i++) {
      opcode = opcodes[i];

      this.source.currentLocation = opcode.loc;
      firstLoc = firstLoc || opcode.loc;
      this[opcode.opcode].apply(this, opcode.args);
    }

    // Flush any trailing content that might be pending.
    this.source.currentLocation = firstLoc;
    this.pushSource('');

    /* istanbul ignore next */
    if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
      throw new _Exception2['default']('Compile completed with content left on stack');
    }

    var fn = this.createFunctionContext(asObject);
    if (!this.isChild) {
      var ret = {
        compiler: this.compilerInfo(),
        main: fn
      };
      var programs = this.context.programs;
      for (i = 0, l = programs.length; i < l; i++) {
        if (programs[i]) {
          ret[i] = programs[i];
        }
      }

      if (this.environment.usePartial) {
        ret.usePartial = true;
      }
      if (this.options.data) {
        ret.useData = true;
      }
      if (this.useDepths) {
        ret.useDepths = true;
      }
      if (this.useBlockParams) {
        ret.useBlockParams = true;
      }
      if (this.options.compat) {
        ret.compat = true;
      }

      if (!asObject) {
        ret.compiler = JSON.stringify(ret.compiler);

        this.source.currentLocation = { start: { line: 1, column: 0 } };
        ret = this.objectLiteral(ret);

        if (options.srcName) {
          ret = ret.toStringWithSourceMap({ file: options.destName });
          ret.map = ret.map && ret.map.toString();
        } else {
          ret = ret.toString();
        }
      } else {
        ret.compilerOptions = this.options;
      }

      return ret;
    } else {
      return fn;
    }
  },

  preamble: function preamble() {
    // track the last context pushed into place to allow skipping the
    // getContext opcode when it would be a noop
    this.lastContext = 0;
    this.source = new _CodeGen2['default'](this.options.srcName);
  },

  createFunctionContext: function createFunctionContext(asObject) {
    var varDeclarations = '';

    var locals = this.stackVars.concat(this.registers.list);
    if (locals.length > 0) {
      varDeclarations += ', ' + locals.join(', ');
    }

    // Generate minimizer alias mappings
    //
    // When using true SourceNodes, this will update all references to the given alias
    // as the source nodes are reused in situ. For the non-source node compilation mode,
    // aliases will not be used, but this case is already being run on the client and
    // we aren't concern about minimizing the template size.
    var aliasCount = 0;
    for (var alias in this.aliases) {
      // eslint-disable-line guard-for-in
      var node = this.aliases[alias];

      if (this.aliases.hasOwnProperty(alias) && node.children && node.referenceCount > 1) {
        varDeclarations += ', alias' + ++aliasCount + '=' + alias;
        node.children[0] = 'alias' + aliasCount;
      }
    }

    var params = ['depth0', 'helpers', 'partials', 'data'];

    if (this.useBlockParams || this.useDepths) {
      params.push('blockParams');
    }
    if (this.useDepths) {
      params.push('depths');
    }

    // Perform a second pass over the output to merge content when possible
    var source = this.mergeSource(varDeclarations);

    if (asObject) {
      params.push(source);

      return Function.apply(this, params);
    } else {
      return this.source.wrap(['function(', params.join(','), ') {\n  ', source, '}']);
    }
  },
  mergeSource: function mergeSource(varDeclarations) {
    var isSimple = this.environment.isSimple,
        appendOnly = !this.forceBuffer,
        appendFirst = undefined,
        sourceSeen = undefined,
        bufferStart = undefined,
        bufferEnd = undefined;
    this.source.each(function (line) {
      if (line.appendToBuffer) {
        if (bufferStart) {
          line.prepend('  + ');
        } else {
          bufferStart = line;
        }
        bufferEnd = line;
      } else {
        if (bufferStart) {
          if (!sourceSeen) {
            appendFirst = true;
          } else {
            bufferStart.prepend('buffer += ');
          }
          bufferEnd.add(';');
          bufferStart = bufferEnd = undefined;
        }

        sourceSeen = true;
        if (!isSimple) {
          appendOnly = false;
        }
      }
    });

    if (appendOnly) {
      if (bufferStart) {
        bufferStart.prepend('return ');
        bufferEnd.add(';');
      } else if (!sourceSeen) {
        this.source.push('return "";');
      }
    } else {
      varDeclarations += ', buffer = ' + (appendFirst ? '' : this.initializeBuffer());

      if (bufferStart) {
        bufferStart.prepend('return buffer + ');
        bufferEnd.add(';');
      } else {
        this.source.push('return buffer;');
      }
    }

    if (varDeclarations) {
      this.source.prepend('var ' + varDeclarations.substring(2) + (appendFirst ? '' : ';\n'));
    }

    return this.source.merge();
  },

  // [blockValue]
  //
  // On stack, before: hash, inverse, program, value
  // On stack, after: return value of blockHelperMissing
  //
  // The purpose of this opcode is to take a block of the form
  // `{{#this.foo}}...{{/this.foo}}`, resolve the value of `foo`, and
  // replace it on the stack with the result of properly
  // invoking blockHelperMissing.
  blockValue: function blockValue(name) {
    var blockHelperMissing = this.aliasable('helpers.blockHelperMissing'),
        params = [this.contextName(0)];
    this.setupHelperArgs(name, 0, params);

    var blockName = this.popStack();
    params.splice(1, 0, blockName);

    this.push(this.source.functionCall(blockHelperMissing, 'call', params));
  },

  // [ambiguousBlockValue]
  //
  // On stack, before: hash, inverse, program, value
  // Compiler value, before: lastHelper=value of last found helper, if any
  // On stack, after, if no lastHelper: same as [blockValue]
  // On stack, after, if lastHelper: value
  ambiguousBlockValue: function ambiguousBlockValue() {
    // We're being a bit cheeky and reusing the options value from the prior exec
    var blockHelperMissing = this.aliasable('helpers.blockHelperMissing'),
        params = [this.contextName(0)];
    this.setupHelperArgs('', 0, params, true);

    this.flushInline();

    var current = this.topStack();
    params.splice(1, 0, current);

    this.pushSource(['if (!', this.lastHelper, ') { ', current, ' = ', this.source.functionCall(blockHelperMissing, 'call', params), '}']);
  },

  // [appendContent]
  //
  // On stack, before: ...
  // On stack, after: ...
  //
  // Appends the string value of `content` to the current buffer
  appendContent: function appendContent(content) {
    if (this.pendingContent) {
      content = this.pendingContent + content;
    } else {
      this.pendingLocation = this.source.currentLocation;
    }

    this.pendingContent = content;
  },

  // [append]
  //
  // On stack, before: value, ...
  // On stack, after: ...
  //
  // Coerces `value` to a String and appends it to the current buffer.
  //
  // If `value` is truthy, or 0, it is coerced into a string and appended
  // Otherwise, the empty string is appended
  append: function append() {
    if (this.isInline()) {
      this.replaceStack(function (current) {
        return [' != null ? ', current, ' : ""'];
      });

      this.pushSource(this.appendToBuffer(this.popStack()));
    } else {
      var local = this.popStack();
      this.pushSource(['if (', local, ' != null) { ', this.appendToBuffer(local, undefined, true), ' }']);
      if (this.environment.isSimple) {
        this.pushSource(['else { ', this.appendToBuffer('\'\'', undefined, true), ' }']);
      }
    }
  },

  // [appendEscaped]
  //
  // On stack, before: value, ...
  // On stack, after: ...
  //
  // Escape `value` and append it to the buffer
  appendEscaped: function appendEscaped() {
    this.pushSource(this.appendToBuffer([this.aliasable('this.escapeExpression'), '(', this.popStack(), ')']));
  },

  // [getContext]
  //
  // On stack, before: ...
  // On stack, after: ...
  // Compiler value, after: lastContext=depth
  //
  // Set the value of the `lastContext` compiler value to the depth
  getContext: function getContext(depth) {
    this.lastContext = depth;
  },

  // [pushContext]
  //
  // On stack, before: ...
  // On stack, after: currentContext, ...
  //
  // Pushes the value of the current context onto the stack.
  pushContext: function pushContext() {
    this.pushStackLiteral(this.contextName(this.lastContext));
  },

  // [lookupOnContext]
  //
  // On stack, before: ...
  // On stack, after: currentContext[name], ...
  //
  // Looks up the value of `name` on the current context and pushes
  // it onto the stack.
  lookupOnContext: function lookupOnContext(parts, falsy, scoped) {
    var i = 0;

    if (!scoped && this.options.compat && !this.lastContext) {
      // The depthed query is expected to handle the undefined logic for the root level that
      // is implemented below, so we evaluate that directly in compat mode
      this.push(this.depthedLookup(parts[i++]));
    } else {
      this.pushContext();
    }

    this.resolvePath('context', parts, i, falsy);
  },

  // [lookupBlockParam]
  //
  // On stack, before: ...
  // On stack, after: blockParam[name], ...
  //
  // Looks up the value of `parts` on the given block param and pushes
  // it onto the stack.
  lookupBlockParam: function lookupBlockParam(blockParamId, parts) {
    this.useBlockParams = true;

    this.push(['blockParams[', blockParamId[0], '][', blockParamId[1], ']']);
    this.resolvePath('context', parts, 1);
  },

  // [lookupData]
  //
  // On stack, before: ...
  // On stack, after: data, ...
  //
  // Push the data lookup operator
  lookupData: function lookupData(depth, parts) {
    if (!depth) {
      this.pushStackLiteral('data');
    } else {
      this.pushStackLiteral('this.data(data, ' + depth + ')');
    }

    this.resolvePath('data', parts, 0, true);
  },

  resolvePath: function resolvePath(type, parts, i, falsy) {
    var _this = this;

    if (this.options.strict || this.options.assumeObjects) {
      this.push(strictLookup(this.options.strict, this, parts, type));
      return;
    }

    var len = parts.length;
    for (; i < len; i++) {
      /*eslint-disable no-loop-func */
      this.replaceStack(function (current) {
        var lookup = _this.nameLookup(current, parts[i], type);
        // We want to ensure that zero and false are handled properly if the context (falsy flag)
        // needs to have the special handling for these values.
        if (!falsy) {
          return [' != null ? ', lookup, ' : ', current];
        } else {
          // Otherwise we can use generic falsy handling
          return [' && ', lookup];
        }
      });
      /*eslint-enable no-loop-func */
    }
  },

  // [resolvePossibleLambda]
  //
  // On stack, before: value, ...
  // On stack, after: resolved value, ...
  //
  // If the `value` is a lambda, replace it on the stack by
  // the return value of the lambda
  resolvePossibleLambda: function resolvePossibleLambda() {
    this.push([this.aliasable('this.lambda'), '(', this.popStack(), ', ', this.contextName(0), ')']);
  },

  // [pushStringParam]
  //
  // On stack, before: ...
  // On stack, after: string, currentContext, ...
  //
  // This opcode is designed for use in string mode, which
  // provides the string value of a parameter along with its
  // depth rather than resolving it immediately.
  pushStringParam: function pushStringParam(string, type) {
    this.pushContext();
    this.pushString(type);

    // If it's a subexpression, the string result
    // will be pushed after this opcode.
    if (type !== 'SubExpression') {
      if (typeof string === 'string') {
        this.pushString(string);
      } else {
        this.pushStackLiteral(string);
      }
    }
  },

  emptyHash: function emptyHash(omitEmpty) {
    if (this.trackIds) {
      this.push('{}'); // hashIds
    }
    if (this.stringParams) {
      this.push('{}'); // hashContexts
      this.push('{}'); // hashTypes
    }
    this.pushStackLiteral(omitEmpty ? 'undefined' : '{}');
  },
  pushHash: function pushHash() {
    if (this.hash) {
      this.hashes.push(this.hash);
    }
    this.hash = { values: [], types: [], contexts: [], ids: [] };
  },
  popHash: function popHash() {
    var hash = this.hash;
    this.hash = this.hashes.pop();

    if (this.trackIds) {
      this.push(this.objectLiteral(hash.ids));
    }
    if (this.stringParams) {
      this.push(this.objectLiteral(hash.contexts));
      this.push(this.objectLiteral(hash.types));
    }

    this.push(this.objectLiteral(hash.values));
  },

  // [pushString]
  //
  // On stack, before: ...
  // On stack, after: quotedString(string), ...
  //
  // Push a quoted version of `string` onto the stack
  pushString: function pushString(string) {
    this.pushStackLiteral(this.quotedString(string));
  },

  // [pushLiteral]
  //
  // On stack, before: ...
  // On stack, after: value, ...
  //
  // Pushes a value onto the stack. This operation prevents
  // the compiler from creating a temporary variable to hold
  // it.
  pushLiteral: function pushLiteral(value) {
    this.pushStackLiteral(value);
  },

  // [pushProgram]
  //
  // On stack, before: ...
  // On stack, after: program(guid), ...
  //
  // Push a program expression onto the stack. This takes
  // a compile-time guid and converts it into a runtime-accessible
  // expression.
  pushProgram: function pushProgram(guid) {
    if (guid != null) {
      this.pushStackLiteral(this.programExpression(guid));
    } else {
      this.pushStackLiteral(null);
    }
  },

  // [invokeHelper]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of helper invocation
  //
  // Pops off the helper's parameters, invokes the helper,
  // and pushes the helper's return value onto the stack.
  //
  // If the helper is not found, `helperMissing` is called.
  invokeHelper: function invokeHelper(paramSize, name, isSimple) {
    var nonHelper = this.popStack(),
        helper = this.setupHelper(paramSize, name),
        simple = isSimple ? [helper.name, ' || '] : '';

    var lookup = ['('].concat(simple, nonHelper);
    if (!this.options.strict) {
      lookup.push(' || ', this.aliasable('helpers.helperMissing'));
    }
    lookup.push(')');

    this.push(this.source.functionCall(lookup, 'call', helper.callParams));
  },

  // [invokeKnownHelper]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of helper invocation
  //
  // This operation is used when the helper is known to exist,
  // so a `helperMissing` fallback is not required.
  invokeKnownHelper: function invokeKnownHelper(paramSize, name) {
    var helper = this.setupHelper(paramSize, name);
    this.push(this.source.functionCall(helper.name, 'call', helper.callParams));
  },

  // [invokeAmbiguous]
  //
  // On stack, before: hash, inverse, program, params..., ...
  // On stack, after: result of disambiguation
  //
  // This operation is used when an expression like `{{foo}}`
  // is provided, but we don't know at compile-time whether it
  // is a helper or a path.
  //
  // This operation emits more code than the other options,
  // and can be avoided by passing the `knownHelpers` and
  // `knownHelpersOnly` flags at compile-time.
  invokeAmbiguous: function invokeAmbiguous(name, helperCall) {
    this.useRegister('helper');

    var nonHelper = this.popStack();

    this.emptyHash();
    var helper = this.setupHelper(0, name, helperCall);

    var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');

    var lookup = ['(', '(helper = ', helperName, ' || ', nonHelper, ')'];
    if (!this.options.strict) {
      lookup[0] = '(helper = ';
      lookup.push(' != null ? helper : ', this.aliasable('helpers.helperMissing'));
    }

    this.push(['(', lookup, helper.paramsInit ? ['),(', helper.paramsInit] : [], '),', '(typeof helper === ', this.aliasable('"function"'), ' ? ', this.source.functionCall('helper', 'call', helper.callParams), ' : helper))']);
  },

  // [invokePartial]
  //
  // On stack, before: context, ...
  // On stack after: result of partial invocation
  //
  // This operation pops off a context, invokes a partial with that context,
  // and pushes the result of the invocation back.
  invokePartial: function invokePartial(isDynamic, name, indent) {
    var params = [],
        options = this.setupParams(name, 1, params, false);

    if (isDynamic) {
      name = this.popStack();
      delete options.name;
    }

    if (indent) {
      options.indent = JSON.stringify(indent);
    }
    options.helpers = 'helpers';
    options.partials = 'partials';

    if (!isDynamic) {
      params.unshift(this.nameLookup('partials', name, 'partial'));
    } else {
      params.unshift(name);
    }

    if (this.options.compat) {
      options.depths = 'depths';
    }
    options = this.objectLiteral(options);
    params.push(options);

    this.push(this.source.functionCall('this.invokePartial', '', params));
  },

  // [assignToHash]
  //
  // On stack, before: value, ..., hash, ...
  // On stack, after: ..., hash, ...
  //
  // Pops a value off the stack and assigns it to the current hash
  assignToHash: function assignToHash(key) {
    var value = this.popStack(),
        context = undefined,
        type = undefined,
        id = undefined;

    if (this.trackIds) {
      id = this.popStack();
    }
    if (this.stringParams) {
      type = this.popStack();
      context = this.popStack();
    }

    var hash = this.hash;
    if (context) {
      hash.contexts[key] = context;
    }
    if (type) {
      hash.types[key] = type;
    }
    if (id) {
      hash.ids[key] = id;
    }
    hash.values[key] = value;
  },

  pushId: function pushId(type, name, child) {
    if (type === 'BlockParam') {
      this.pushStackLiteral('blockParams[' + name[0] + '].path[' + name[1] + ']' + (child ? ' + ' + JSON.stringify('.' + child) : ''));
    } else if (type === 'PathExpression') {
      this.pushString(name);
    } else if (type === 'SubExpression') {
      this.pushStackLiteral('true');
    } else {
      this.pushStackLiteral('null');
    }
  },

  // HELPERS

  compiler: JavaScriptCompiler,

  compileChildren: function compileChildren(environment, options) {
    var children = environment.children,
        child = undefined,
        compiler = undefined;

    for (var i = 0, l = children.length; i < l; i++) {
      child = children[i];
      compiler = new this.compiler(); // eslint-disable-line new-cap

      var index = this.matchExistingProgram(child);

      if (index == null) {
        this.context.programs.push(''); // Placeholder to prevent name conflicts for nested children
        index = this.context.programs.length;
        child.index = index;
        child.name = 'program' + index;
        this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
        this.context.environments[index] = child;

        this.useDepths = this.useDepths || compiler.useDepths;
        this.useBlockParams = this.useBlockParams || compiler.useBlockParams;
      } else {
        child.index = index;
        child.name = 'program' + index;

        this.useDepths = this.useDepths || child.useDepths;
        this.useBlockParams = this.useBlockParams || child.useBlockParams;
      }
    }
  },
  matchExistingProgram: function matchExistingProgram(child) {
    for (var i = 0, len = this.context.environments.length; i < len; i++) {
      var environment = this.context.environments[i];
      if (environment && environment.equals(child)) {
        return i;
      }
    }
  },

  programExpression: function programExpression(guid) {
    var child = this.environment.children[guid],
        programParams = [child.index, 'data', child.blockParams];

    if (this.useBlockParams || this.useDepths) {
      programParams.push('blockParams');
    }
    if (this.useDepths) {
      programParams.push('depths');
    }

    return 'this.program(' + programParams.join(', ') + ')';
  },

  useRegister: function useRegister(name) {
    if (!this.registers[name]) {
      this.registers[name] = true;
      this.registers.list.push(name);
    }
  },

  push: function push(expr) {
    if (!(expr instanceof Literal)) {
      expr = this.source.wrap(expr);
    }

    this.inlineStack.push(expr);
    return expr;
  },

  pushStackLiteral: function pushStackLiteral(item) {
    this.push(new Literal(item));
  },

  pushSource: function pushSource(source) {
    if (this.pendingContent) {
      this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent), this.pendingLocation));
      this.pendingContent = undefined;
    }

    if (source) {
      this.source.push(source);
    }
  },

  replaceStack: function replaceStack(callback) {
    var prefix = ['('],
        stack = undefined,
        createdStack = undefined,
        usedLiteral = undefined;

    /* istanbul ignore next */
    if (!this.isInline()) {
      throw new _Exception2['default']('replaceStack on non-inline');
    }

    // We want to merge the inline statement into the replacement statement via ','
    var top = this.popStack(true);

    if (top instanceof Literal) {
      // Literals do not need to be inlined
      stack = [top.value];
      prefix = ['(', stack];
      usedLiteral = true;
    } else {
      // Get or create the current stack name for use by the inline
      createdStack = true;
      var _name = this.incrStack();

      prefix = ['((', this.push(_name), ' = ', top, ')'];
      stack = this.topStack();
    }

    var item = callback.call(this, stack);

    if (!usedLiteral) {
      this.popStack();
    }
    if (createdStack) {
      this.stackSlot--;
    }
    this.push(prefix.concat(item, ')'));
  },

  incrStack: function incrStack() {
    this.stackSlot++;
    if (this.stackSlot > this.stackVars.length) {
      this.stackVars.push('stack' + this.stackSlot);
    }
    return this.topStackName();
  },
  topStackName: function topStackName() {
    return 'stack' + this.stackSlot;
  },
  flushInline: function flushInline() {
    var inlineStack = this.inlineStack;
    this.inlineStack = [];
    for (var i = 0, len = inlineStack.length; i < len; i++) {
      var entry = inlineStack[i];
      /* istanbul ignore if */
      if (entry instanceof Literal) {
        this.compileStack.push(entry);
      } else {
        var stack = this.incrStack();
        this.pushSource([stack, ' = ', entry, ';']);
        this.compileStack.push(stack);
      }
    }
  },
  isInline: function isInline() {
    return this.inlineStack.length;
  },

  popStack: function popStack(wrapped) {
    var inline = this.isInline(),
        item = (inline ? this.inlineStack : this.compileStack).pop();

    if (!wrapped && item instanceof Literal) {
      return item.value;
    } else {
      if (!inline) {
        /* istanbul ignore next */
        if (!this.stackSlot) {
          throw new _Exception2['default']('Invalid stack pop');
        }
        this.stackSlot--;
      }
      return item;
    }
  },

  topStack: function topStack() {
    var stack = this.isInline() ? this.inlineStack : this.compileStack,
        item = stack[stack.length - 1];

    /* istanbul ignore if */
    if (item instanceof Literal) {
      return item.value;
    } else {
      return item;
    }
  },

  contextName: function contextName(context) {
    if (this.useDepths && context) {
      return 'depths[' + context + ']';
    } else {
      return 'depth' + context;
    }
  },

  quotedString: function quotedString(str) {
    return this.source.quotedString(str);
  },

  objectLiteral: function objectLiteral(obj) {
    return this.source.objectLiteral(obj);
  },

  aliasable: function aliasable(name) {
    var ret = this.aliases[name];
    if (ret) {
      ret.referenceCount++;
      return ret;
    }

    ret = this.aliases[name] = this.source.wrap(name);
    ret.aliasable = true;
    ret.referenceCount = 1;

    return ret;
  },

  setupHelper: function setupHelper(paramSize, name, blockHelper) {
    var params = [],
        paramsInit = this.setupHelperArgs(name, paramSize, params, blockHelper);
    var foundHelper = this.nameLookup('helpers', name, 'helper');

    return {
      params: params,
      paramsInit: paramsInit,
      name: foundHelper,
      callParams: [this.contextName(0)].concat(params)
    };
  },

  setupParams: function setupParams(helper, paramSize, params) {
    var options = {},
        contexts = [],
        types = [],
        ids = [],
        param = undefined;

    options.name = this.quotedString(helper);
    options.hash = this.popStack();

    if (this.trackIds) {
      options.hashIds = this.popStack();
    }
    if (this.stringParams) {
      options.hashTypes = this.popStack();
      options.hashContexts = this.popStack();
    }

    var inverse = this.popStack(),
        program = this.popStack();

    // Avoid setting fn and inverse if neither are set. This allows
    // helpers to do a check for `if (options.fn)`
    if (program || inverse) {
      options.fn = program || 'this.noop';
      options.inverse = inverse || 'this.noop';
    }

    // The parameters go on to the stack in order (making sure that they are evaluated in order)
    // so we need to pop them off the stack in reverse order
    var i = paramSize;
    while (i--) {
      param = this.popStack();
      params[i] = param;

      if (this.trackIds) {
        ids[i] = this.popStack();
      }
      if (this.stringParams) {
        types[i] = this.popStack();
        contexts[i] = this.popStack();
      }
    }

    if (this.trackIds) {
      options.ids = this.source.generateArray(ids);
    }
    if (this.stringParams) {
      options.types = this.source.generateArray(types);
      options.contexts = this.source.generateArray(contexts);
    }

    if (this.options.data) {
      options.data = 'data';
    }
    if (this.useBlockParams) {
      options.blockParams = 'blockParams';
    }
    return options;
  },

  setupHelperArgs: function setupHelperArgs(helper, paramSize, params, useRegister) {
    var options = this.setupParams(helper, paramSize, params, true);
    options = this.objectLiteral(options);
    if (useRegister) {
      this.useRegister('options');
      params.push('options');
      return ['options=', options];
    } else {
      params.push(options);
      return '';
    }
  }
};

(function () {
  var reservedWords = ('break else new var' + ' case finally return void' + ' catch for switch while' + ' continue function this with' + ' default if throw' + ' delete in try' + ' do instanceof typeof' + ' abstract enum int short' + ' boolean export interface static' + ' byte extends long super' + ' char final native synchronized' + ' class float package throws' + ' const goto private transient' + ' debugger implements protected volatile' + ' double import public let yield await' + ' null true false').split(' ');

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for (var i = 0, l = reservedWords.length; i < l; i++) {
    compilerWords[reservedWords[i]] = true;
  }
})();

JavaScriptCompiler.isValidJavaScriptVariableName = function (name) {
  return !JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
};

function strictLookup(requireTerminal, compiler, parts, type) {
  var stack = compiler.popStack(),
      i = 0,
      len = parts.length;
  if (requireTerminal) {
    len--;
  }

  for (; i < len; i++) {
    stack = compiler.nameLookup(stack, parts[i], type);
  }

  if (requireTerminal) {
    return [compiler.aliasable('this.strict'), '(', stack, ', ', compiler.quotedString(parts[i]), ')'];
  } else {
    return stack;
  }
}

exports['default'] = JavaScriptCompiler;
module.exports = exports['default'];
},{"../base":23,"../exception":34,"../utils":38,"./code-gen":26}],30:[function(require,module,exports){
"use strict";

exports.__esModule = true;
/* istanbul ignore next */
/* Jison generated parser */
var handlebars = (function () {
    var parser = { trace: function trace() {},
        yy: {},
        symbols_: { error: 2, root: 3, program: 4, EOF: 5, program_repetition0: 6, statement: 7, mustache: 8, block: 9, rawBlock: 10, partial: 11, content: 12, COMMENT: 13, CONTENT: 14, openRawBlock: 15, END_RAW_BLOCK: 16, OPEN_RAW_BLOCK: 17, helperName: 18, openRawBlock_repetition0: 19, openRawBlock_option0: 20, CLOSE_RAW_BLOCK: 21, openBlock: 22, block_option0: 23, closeBlock: 24, openInverse: 25, block_option1: 26, OPEN_BLOCK: 27, openBlock_repetition0: 28, openBlock_option0: 29, openBlock_option1: 30, CLOSE: 31, OPEN_INVERSE: 32, openInverse_repetition0: 33, openInverse_option0: 34, openInverse_option1: 35, openInverseChain: 36, OPEN_INVERSE_CHAIN: 37, openInverseChain_repetition0: 38, openInverseChain_option0: 39, openInverseChain_option1: 40, inverseAndProgram: 41, INVERSE: 42, inverseChain: 43, inverseChain_option0: 44, OPEN_ENDBLOCK: 45, OPEN: 46, mustache_repetition0: 47, mustache_option0: 48, OPEN_UNESCAPED: 49, mustache_repetition1: 50, mustache_option1: 51, CLOSE_UNESCAPED: 52, OPEN_PARTIAL: 53, partialName: 54, partial_repetition0: 55, partial_option0: 56, param: 57, sexpr: 58, OPEN_SEXPR: 59, sexpr_repetition0: 60, sexpr_option0: 61, CLOSE_SEXPR: 62, hash: 63, hash_repetition_plus0: 64, hashSegment: 65, ID: 66, EQUALS: 67, blockParams: 68, OPEN_BLOCK_PARAMS: 69, blockParams_repetition_plus0: 70, CLOSE_BLOCK_PARAMS: 71, path: 72, dataName: 73, STRING: 74, NUMBER: 75, BOOLEAN: 76, UNDEFINED: 77, NULL: 78, DATA: 79, pathSegments: 80, SEP: 81, $accept: 0, $end: 1 },
        terminals_: { 2: "error", 5: "EOF", 13: "COMMENT", 14: "CONTENT", 16: "END_RAW_BLOCK", 17: "OPEN_RAW_BLOCK", 21: "CLOSE_RAW_BLOCK", 27: "OPEN_BLOCK", 31: "CLOSE", 32: "OPEN_INVERSE", 37: "OPEN_INVERSE_CHAIN", 42: "INVERSE", 45: "OPEN_ENDBLOCK", 46: "OPEN", 49: "OPEN_UNESCAPED", 52: "CLOSE_UNESCAPED", 53: "OPEN_PARTIAL", 59: "OPEN_SEXPR", 62: "CLOSE_SEXPR", 66: "ID", 67: "EQUALS", 69: "OPEN_BLOCK_PARAMS", 71: "CLOSE_BLOCK_PARAMS", 74: "STRING", 75: "NUMBER", 76: "BOOLEAN", 77: "UNDEFINED", 78: "NULL", 79: "DATA", 81: "SEP" },
        productions_: [0, [3, 2], [4, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [12, 1], [10, 3], [15, 5], [9, 4], [9, 4], [22, 6], [25, 6], [36, 6], [41, 2], [43, 3], [43, 1], [24, 3], [8, 5], [8, 5], [11, 5], [57, 1], [57, 1], [58, 5], [63, 1], [65, 3], [68, 3], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [54, 1], [54, 1], [73, 2], [72, 1], [80, 3], [80, 1], [6, 0], [6, 2], [19, 0], [19, 2], [20, 0], [20, 1], [23, 0], [23, 1], [26, 0], [26, 1], [28, 0], [28, 2], [29, 0], [29, 1], [30, 0], [30, 1], [33, 0], [33, 2], [34, 0], [34, 1], [35, 0], [35, 1], [38, 0], [38, 2], [39, 0], [39, 1], [40, 0], [40, 1], [44, 0], [44, 1], [47, 0], [47, 2], [48, 0], [48, 1], [50, 0], [50, 2], [51, 0], [51, 1], [55, 0], [55, 2], [56, 0], [56, 1], [60, 0], [60, 2], [61, 0], [61, 1], [64, 1], [64, 2], [70, 1], [70, 2]],
        performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {

            var $0 = $$.length - 1;
            switch (yystate) {
                case 1:
                    return $$[$0 - 1];
                    break;
                case 2:
                    this.$ = new yy.Program($$[$0], null, {}, yy.locInfo(this._$));
                    break;
                case 3:
                    this.$ = $$[$0];
                    break;
                case 4:
                    this.$ = $$[$0];
                    break;
                case 5:
                    this.$ = $$[$0];
                    break;
                case 6:
                    this.$ = $$[$0];
                    break;
                case 7:
                    this.$ = $$[$0];
                    break;
                case 8:
                    this.$ = new yy.CommentStatement(yy.stripComment($$[$0]), yy.stripFlags($$[$0], $$[$0]), yy.locInfo(this._$));
                    break;
                case 9:
                    this.$ = new yy.ContentStatement($$[$0], yy.locInfo(this._$));
                    break;
                case 10:
                    this.$ = yy.prepareRawBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
                    break;
                case 11:
                    this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1] };
                    break;
                case 12:
                    this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], false, this._$);
                    break;
                case 13:
                    this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], true, this._$);
                    break;
                case 14:
                    this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                    break;
                case 15:
                    this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                    break;
                case 16:
                    this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                    break;
                case 17:
                    this.$ = { strip: yy.stripFlags($$[$0 - 1], $$[$0 - 1]), program: $$[$0] };
                    break;
                case 18:
                    var inverse = yy.prepareBlock($$[$0 - 2], $$[$0 - 1], $$[$0], $$[$0], false, this._$),
                        program = new yy.Program([inverse], null, {}, yy.locInfo(this._$));
                    program.chained = true;

                    this.$ = { strip: $$[$0 - 2].strip, program: program, chain: true };

                    break;
                case 19:
                    this.$ = $$[$0];
                    break;
                case 20:
                    this.$ = { path: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 2], $$[$0]) };
                    break;
                case 21:
                    this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
                    break;
                case 22:
                    this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
                    break;
                case 23:
                    this.$ = new yy.PartialStatement($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], yy.stripFlags($$[$0 - 4], $$[$0]), yy.locInfo(this._$));
                    break;
                case 24:
                    this.$ = $$[$0];
                    break;
                case 25:
                    this.$ = $$[$0];
                    break;
                case 26:
                    this.$ = new yy.SubExpression($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], yy.locInfo(this._$));
                    break;
                case 27:
                    this.$ = new yy.Hash($$[$0], yy.locInfo(this._$));
                    break;
                case 28:
                    this.$ = new yy.HashPair(yy.id($$[$0 - 2]), $$[$0], yy.locInfo(this._$));
                    break;
                case 29:
                    this.$ = yy.id($$[$0 - 1]);
                    break;
                case 30:
                    this.$ = $$[$0];
                    break;
                case 31:
                    this.$ = $$[$0];
                    break;
                case 32:
                    this.$ = new yy.StringLiteral($$[$0], yy.locInfo(this._$));
                    break;
                case 33:
                    this.$ = new yy.NumberLiteral($$[$0], yy.locInfo(this._$));
                    break;
                case 34:
                    this.$ = new yy.BooleanLiteral($$[$0], yy.locInfo(this._$));
                    break;
                case 35:
                    this.$ = new yy.UndefinedLiteral(yy.locInfo(this._$));
                    break;
                case 36:
                    this.$ = new yy.NullLiteral(yy.locInfo(this._$));
                    break;
                case 37:
                    this.$ = $$[$0];
                    break;
                case 38:
                    this.$ = $$[$0];
                    break;
                case 39:
                    this.$ = yy.preparePath(true, $$[$0], this._$);
                    break;
                case 40:
                    this.$ = yy.preparePath(false, $$[$0], this._$);
                    break;
                case 41:
                    $$[$0 - 2].push({ part: yy.id($$[$0]), original: $$[$0], separator: $$[$0 - 1] });this.$ = $$[$0 - 2];
                    break;
                case 42:
                    this.$ = [{ part: yy.id($$[$0]), original: $$[$0] }];
                    break;
                case 43:
                    this.$ = [];
                    break;
                case 44:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 45:
                    this.$ = [];
                    break;
                case 46:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 53:
                    this.$ = [];
                    break;
                case 54:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 59:
                    this.$ = [];
                    break;
                case 60:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 65:
                    this.$ = [];
                    break;
                case 66:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 73:
                    this.$ = [];
                    break;
                case 74:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 77:
                    this.$ = [];
                    break;
                case 78:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 81:
                    this.$ = [];
                    break;
                case 82:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 85:
                    this.$ = [];
                    break;
                case 86:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 89:
                    this.$ = [$$[$0]];
                    break;
                case 90:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 91:
                    this.$ = [$$[$0]];
                    break;
                case 92:
                    $$[$0 - 1].push($$[$0]);
                    break;
            }
        },
        table: [{ 3: 1, 4: 2, 5: [2, 43], 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 1: [3] }, { 5: [1, 4] }, { 5: [2, 2], 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10, 13: [1, 11], 14: [1, 18], 15: 16, 17: [1, 21], 22: 14, 25: 15, 27: [1, 19], 32: [1, 20], 37: [2, 2], 42: [2, 2], 45: [2, 2], 46: [1, 12], 49: [1, 13], 53: [1, 17] }, { 1: [2, 1] }, { 5: [2, 44], 13: [2, 44], 14: [2, 44], 17: [2, 44], 27: [2, 44], 32: [2, 44], 37: [2, 44], 42: [2, 44], 45: [2, 44], 46: [2, 44], 49: [2, 44], 53: [2, 44] }, { 5: [2, 3], 13: [2, 3], 14: [2, 3], 17: [2, 3], 27: [2, 3], 32: [2, 3], 37: [2, 3], 42: [2, 3], 45: [2, 3], 46: [2, 3], 49: [2, 3], 53: [2, 3] }, { 5: [2, 4], 13: [2, 4], 14: [2, 4], 17: [2, 4], 27: [2, 4], 32: [2, 4], 37: [2, 4], 42: [2, 4], 45: [2, 4], 46: [2, 4], 49: [2, 4], 53: [2, 4] }, { 5: [2, 5], 13: [2, 5], 14: [2, 5], 17: [2, 5], 27: [2, 5], 32: [2, 5], 37: [2, 5], 42: [2, 5], 45: [2, 5], 46: [2, 5], 49: [2, 5], 53: [2, 5] }, { 5: [2, 6], 13: [2, 6], 14: [2, 6], 17: [2, 6], 27: [2, 6], 32: [2, 6], 37: [2, 6], 42: [2, 6], 45: [2, 6], 46: [2, 6], 49: [2, 6], 53: [2, 6] }, { 5: [2, 7], 13: [2, 7], 14: [2, 7], 17: [2, 7], 27: [2, 7], 32: [2, 7], 37: [2, 7], 42: [2, 7], 45: [2, 7], 46: [2, 7], 49: [2, 7], 53: [2, 7] }, { 5: [2, 8], 13: [2, 8], 14: [2, 8], 17: [2, 8], 27: [2, 8], 32: [2, 8], 37: [2, 8], 42: [2, 8], 45: [2, 8], 46: [2, 8], 49: [2, 8], 53: [2, 8] }, { 18: 22, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 33, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 4: 34, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 37: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 4: 35, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 12: 36, 14: [1, 18] }, { 18: 38, 54: 37, 58: 39, 59: [1, 40], 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 9], 13: [2, 9], 14: [2, 9], 16: [2, 9], 17: [2, 9], 27: [2, 9], 32: [2, 9], 37: [2, 9], 42: [2, 9], 45: [2, 9], 46: [2, 9], 49: [2, 9], 53: [2, 9] }, { 18: 41, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 42, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 43, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 31: [2, 73], 47: 44, 59: [2, 73], 66: [2, 73], 74: [2, 73], 75: [2, 73], 76: [2, 73], 77: [2, 73], 78: [2, 73], 79: [2, 73] }, { 21: [2, 30], 31: [2, 30], 52: [2, 30], 59: [2, 30], 62: [2, 30], 66: [2, 30], 69: [2, 30], 74: [2, 30], 75: [2, 30], 76: [2, 30], 77: [2, 30], 78: [2, 30], 79: [2, 30] }, { 21: [2, 31], 31: [2, 31], 52: [2, 31], 59: [2, 31], 62: [2, 31], 66: [2, 31], 69: [2, 31], 74: [2, 31], 75: [2, 31], 76: [2, 31], 77: [2, 31], 78: [2, 31], 79: [2, 31] }, { 21: [2, 32], 31: [2, 32], 52: [2, 32], 59: [2, 32], 62: [2, 32], 66: [2, 32], 69: [2, 32], 74: [2, 32], 75: [2, 32], 76: [2, 32], 77: [2, 32], 78: [2, 32], 79: [2, 32] }, { 21: [2, 33], 31: [2, 33], 52: [2, 33], 59: [2, 33], 62: [2, 33], 66: [2, 33], 69: [2, 33], 74: [2, 33], 75: [2, 33], 76: [2, 33], 77: [2, 33], 78: [2, 33], 79: [2, 33] }, { 21: [2, 34], 31: [2, 34], 52: [2, 34], 59: [2, 34], 62: [2, 34], 66: [2, 34], 69: [2, 34], 74: [2, 34], 75: [2, 34], 76: [2, 34], 77: [2, 34], 78: [2, 34], 79: [2, 34] }, { 21: [2, 35], 31: [2, 35], 52: [2, 35], 59: [2, 35], 62: [2, 35], 66: [2, 35], 69: [2, 35], 74: [2, 35], 75: [2, 35], 76: [2, 35], 77: [2, 35], 78: [2, 35], 79: [2, 35] }, { 21: [2, 36], 31: [2, 36], 52: [2, 36], 59: [2, 36], 62: [2, 36], 66: [2, 36], 69: [2, 36], 74: [2, 36], 75: [2, 36], 76: [2, 36], 77: [2, 36], 78: [2, 36], 79: [2, 36] }, { 21: [2, 40], 31: [2, 40], 52: [2, 40], 59: [2, 40], 62: [2, 40], 66: [2, 40], 69: [2, 40], 74: [2, 40], 75: [2, 40], 76: [2, 40], 77: [2, 40], 78: [2, 40], 79: [2, 40], 81: [1, 45] }, { 66: [1, 32], 80: 46 }, { 21: [2, 42], 31: [2, 42], 52: [2, 42], 59: [2, 42], 62: [2, 42], 66: [2, 42], 69: [2, 42], 74: [2, 42], 75: [2, 42], 76: [2, 42], 77: [2, 42], 78: [2, 42], 79: [2, 42], 81: [2, 42] }, { 50: 47, 52: [2, 77], 59: [2, 77], 66: [2, 77], 74: [2, 77], 75: [2, 77], 76: [2, 77], 77: [2, 77], 78: [2, 77], 79: [2, 77] }, { 23: 48, 36: 50, 37: [1, 52], 41: 51, 42: [1, 53], 43: 49, 45: [2, 49] }, { 26: 54, 41: 55, 42: [1, 53], 45: [2, 51] }, { 16: [1, 56] }, { 31: [2, 81], 55: 57, 59: [2, 81], 66: [2, 81], 74: [2, 81], 75: [2, 81], 76: [2, 81], 77: [2, 81], 78: [2, 81], 79: [2, 81] }, { 31: [2, 37], 59: [2, 37], 66: [2, 37], 74: [2, 37], 75: [2, 37], 76: [2, 37], 77: [2, 37], 78: [2, 37], 79: [2, 37] }, { 31: [2, 38], 59: [2, 38], 66: [2, 38], 74: [2, 38], 75: [2, 38], 76: [2, 38], 77: [2, 38], 78: [2, 38], 79: [2, 38] }, { 18: 58, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 28: 59, 31: [2, 53], 59: [2, 53], 66: [2, 53], 69: [2, 53], 74: [2, 53], 75: [2, 53], 76: [2, 53], 77: [2, 53], 78: [2, 53], 79: [2, 53] }, { 31: [2, 59], 33: 60, 59: [2, 59], 66: [2, 59], 69: [2, 59], 74: [2, 59], 75: [2, 59], 76: [2, 59], 77: [2, 59], 78: [2, 59], 79: [2, 59] }, { 19: 61, 21: [2, 45], 59: [2, 45], 66: [2, 45], 74: [2, 45], 75: [2, 45], 76: [2, 45], 77: [2, 45], 78: [2, 45], 79: [2, 45] }, { 18: 65, 31: [2, 75], 48: 62, 57: 63, 58: 66, 59: [1, 40], 63: 64, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 66: [1, 70] }, { 21: [2, 39], 31: [2, 39], 52: [2, 39], 59: [2, 39], 62: [2, 39], 66: [2, 39], 69: [2, 39], 74: [2, 39], 75: [2, 39], 76: [2, 39], 77: [2, 39], 78: [2, 39], 79: [2, 39], 81: [1, 45] }, { 18: 65, 51: 71, 52: [2, 79], 57: 72, 58: 66, 59: [1, 40], 63: 73, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 24: 74, 45: [1, 75] }, { 45: [2, 50] }, { 4: 76, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 37: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 45: [2, 19] }, { 18: 77, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 4: 78, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 24: 79, 45: [1, 75] }, { 45: [2, 52] }, { 5: [2, 10], 13: [2, 10], 14: [2, 10], 17: [2, 10], 27: [2, 10], 32: [2, 10], 37: [2, 10], 42: [2, 10], 45: [2, 10], 46: [2, 10], 49: [2, 10], 53: [2, 10] }, { 18: 65, 31: [2, 83], 56: 80, 57: 81, 58: 66, 59: [1, 40], 63: 82, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 59: [2, 85], 60: 83, 62: [2, 85], 66: [2, 85], 74: [2, 85], 75: [2, 85], 76: [2, 85], 77: [2, 85], 78: [2, 85], 79: [2, 85] }, { 18: 65, 29: 84, 31: [2, 55], 57: 85, 58: 66, 59: [1, 40], 63: 86, 64: 67, 65: 68, 66: [1, 69], 69: [2, 55], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 65, 31: [2, 61], 34: 87, 57: 88, 58: 66, 59: [1, 40], 63: 89, 64: 67, 65: 68, 66: [1, 69], 69: [2, 61], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 65, 20: 90, 21: [2, 47], 57: 91, 58: 66, 59: [1, 40], 63: 92, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 31: [1, 93] }, { 31: [2, 74], 59: [2, 74], 66: [2, 74], 74: [2, 74], 75: [2, 74], 76: [2, 74], 77: [2, 74], 78: [2, 74], 79: [2, 74] }, { 31: [2, 76] }, { 21: [2, 24], 31: [2, 24], 52: [2, 24], 59: [2, 24], 62: [2, 24], 66: [2, 24], 69: [2, 24], 74: [2, 24], 75: [2, 24], 76: [2, 24], 77: [2, 24], 78: [2, 24], 79: [2, 24] }, { 21: [2, 25], 31: [2, 25], 52: [2, 25], 59: [2, 25], 62: [2, 25], 66: [2, 25], 69: [2, 25], 74: [2, 25], 75: [2, 25], 76: [2, 25], 77: [2, 25], 78: [2, 25], 79: [2, 25] }, { 21: [2, 27], 31: [2, 27], 52: [2, 27], 62: [2, 27], 65: 94, 66: [1, 95], 69: [2, 27] }, { 21: [2, 89], 31: [2, 89], 52: [2, 89], 62: [2, 89], 66: [2, 89], 69: [2, 89] }, { 21: [2, 42], 31: [2, 42], 52: [2, 42], 59: [2, 42], 62: [2, 42], 66: [2, 42], 67: [1, 96], 69: [2, 42], 74: [2, 42], 75: [2, 42], 76: [2, 42], 77: [2, 42], 78: [2, 42], 79: [2, 42], 81: [2, 42] }, { 21: [2, 41], 31: [2, 41], 52: [2, 41], 59: [2, 41], 62: [2, 41], 66: [2, 41], 69: [2, 41], 74: [2, 41], 75: [2, 41], 76: [2, 41], 77: [2, 41], 78: [2, 41], 79: [2, 41], 81: [2, 41] }, { 52: [1, 97] }, { 52: [2, 78], 59: [2, 78], 66: [2, 78], 74: [2, 78], 75: [2, 78], 76: [2, 78], 77: [2, 78], 78: [2, 78], 79: [2, 78] }, { 52: [2, 80] }, { 5: [2, 12], 13: [2, 12], 14: [2, 12], 17: [2, 12], 27: [2, 12], 32: [2, 12], 37: [2, 12], 42: [2, 12], 45: [2, 12], 46: [2, 12], 49: [2, 12], 53: [2, 12] }, { 18: 98, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 36: 50, 37: [1, 52], 41: 51, 42: [1, 53], 43: 100, 44: 99, 45: [2, 71] }, { 31: [2, 65], 38: 101, 59: [2, 65], 66: [2, 65], 69: [2, 65], 74: [2, 65], 75: [2, 65], 76: [2, 65], 77: [2, 65], 78: [2, 65], 79: [2, 65] }, { 45: [2, 17] }, { 5: [2, 13], 13: [2, 13], 14: [2, 13], 17: [2, 13], 27: [2, 13], 32: [2, 13], 37: [2, 13], 42: [2, 13], 45: [2, 13], 46: [2, 13], 49: [2, 13], 53: [2, 13] }, { 31: [1, 102] }, { 31: [2, 82], 59: [2, 82], 66: [2, 82], 74: [2, 82], 75: [2, 82], 76: [2, 82], 77: [2, 82], 78: [2, 82], 79: [2, 82] }, { 31: [2, 84] }, { 18: 65, 57: 104, 58: 66, 59: [1, 40], 61: 103, 62: [2, 87], 63: 105, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 30: 106, 31: [2, 57], 68: 107, 69: [1, 108] }, { 31: [2, 54], 59: [2, 54], 66: [2, 54], 69: [2, 54], 74: [2, 54], 75: [2, 54], 76: [2, 54], 77: [2, 54], 78: [2, 54], 79: [2, 54] }, { 31: [2, 56], 69: [2, 56] }, { 31: [2, 63], 35: 109, 68: 110, 69: [1, 108] }, { 31: [2, 60], 59: [2, 60], 66: [2, 60], 69: [2, 60], 74: [2, 60], 75: [2, 60], 76: [2, 60], 77: [2, 60], 78: [2, 60], 79: [2, 60] }, { 31: [2, 62], 69: [2, 62] }, { 21: [1, 111] }, { 21: [2, 46], 59: [2, 46], 66: [2, 46], 74: [2, 46], 75: [2, 46], 76: [2, 46], 77: [2, 46], 78: [2, 46], 79: [2, 46] }, { 21: [2, 48] }, { 5: [2, 21], 13: [2, 21], 14: [2, 21], 17: [2, 21], 27: [2, 21], 32: [2, 21], 37: [2, 21], 42: [2, 21], 45: [2, 21], 46: [2, 21], 49: [2, 21], 53: [2, 21] }, { 21: [2, 90], 31: [2, 90], 52: [2, 90], 62: [2, 90], 66: [2, 90], 69: [2, 90] }, { 67: [1, 96] }, { 18: 65, 57: 112, 58: 66, 59: [1, 40], 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 22], 13: [2, 22], 14: [2, 22], 17: [2, 22], 27: [2, 22], 32: [2, 22], 37: [2, 22], 42: [2, 22], 45: [2, 22], 46: [2, 22], 49: [2, 22], 53: [2, 22] }, { 31: [1, 113] }, { 45: [2, 18] }, { 45: [2, 72] }, { 18: 65, 31: [2, 67], 39: 114, 57: 115, 58: 66, 59: [1, 40], 63: 116, 64: 67, 65: 68, 66: [1, 69], 69: [2, 67], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 23], 13: [2, 23], 14: [2, 23], 17: [2, 23], 27: [2, 23], 32: [2, 23], 37: [2, 23], 42: [2, 23], 45: [2, 23], 46: [2, 23], 49: [2, 23], 53: [2, 23] }, { 62: [1, 117] }, { 59: [2, 86], 62: [2, 86], 66: [2, 86], 74: [2, 86], 75: [2, 86], 76: [2, 86], 77: [2, 86], 78: [2, 86], 79: [2, 86] }, { 62: [2, 88] }, { 31: [1, 118] }, { 31: [2, 58] }, { 66: [1, 120], 70: 119 }, { 31: [1, 121] }, { 31: [2, 64] }, { 14: [2, 11] }, { 21: [2, 28], 31: [2, 28], 52: [2, 28], 62: [2, 28], 66: [2, 28], 69: [2, 28] }, { 5: [2, 20], 13: [2, 20], 14: [2, 20], 17: [2, 20], 27: [2, 20], 32: [2, 20], 37: [2, 20], 42: [2, 20], 45: [2, 20], 46: [2, 20], 49: [2, 20], 53: [2, 20] }, { 31: [2, 69], 40: 122, 68: 123, 69: [1, 108] }, { 31: [2, 66], 59: [2, 66], 66: [2, 66], 69: [2, 66], 74: [2, 66], 75: [2, 66], 76: [2, 66], 77: [2, 66], 78: [2, 66], 79: [2, 66] }, { 31: [2, 68], 69: [2, 68] }, { 21: [2, 26], 31: [2, 26], 52: [2, 26], 59: [2, 26], 62: [2, 26], 66: [2, 26], 69: [2, 26], 74: [2, 26], 75: [2, 26], 76: [2, 26], 77: [2, 26], 78: [2, 26], 79: [2, 26] }, { 13: [2, 14], 14: [2, 14], 17: [2, 14], 27: [2, 14], 32: [2, 14], 37: [2, 14], 42: [2, 14], 45: [2, 14], 46: [2, 14], 49: [2, 14], 53: [2, 14] }, { 66: [1, 125], 71: [1, 124] }, { 66: [2, 91], 71: [2, 91] }, { 13: [2, 15], 14: [2, 15], 17: [2, 15], 27: [2, 15], 32: [2, 15], 42: [2, 15], 45: [2, 15], 46: [2, 15], 49: [2, 15], 53: [2, 15] }, { 31: [1, 126] }, { 31: [2, 70] }, { 31: [2, 29] }, { 66: [2, 92], 71: [2, 92] }, { 13: [2, 16], 14: [2, 16], 17: [2, 16], 27: [2, 16], 32: [2, 16], 37: [2, 16], 42: [2, 16], 45: [2, 16], 46: [2, 16], 49: [2, 16], 53: [2, 16] }],
        defaultActions: { 4: [2, 1], 49: [2, 50], 51: [2, 19], 55: [2, 52], 64: [2, 76], 73: [2, 80], 78: [2, 17], 82: [2, 84], 92: [2, 48], 99: [2, 18], 100: [2, 72], 105: [2, 88], 107: [2, 58], 110: [2, 64], 111: [2, 11], 123: [2, 70], 124: [2, 29] },
        parseError: function parseError(str, hash) {
            throw new Error(str);
        },
        parse: function parse(input) {
            var self = this,
                stack = [0],
                vstack = [null],
                lstack = [],
                table = this.table,
                yytext = "",
                yylineno = 0,
                yyleng = 0,
                recovering = 0,
                TERROR = 2,
                EOF = 1;
            this.lexer.setInput(input);
            this.lexer.yy = this.yy;
            this.yy.lexer = this.lexer;
            this.yy.parser = this;
            if (typeof this.lexer.yylloc == "undefined") this.lexer.yylloc = {};
            var yyloc = this.lexer.yylloc;
            lstack.push(yyloc);
            var ranges = this.lexer.options && this.lexer.options.ranges;
            if (typeof this.yy.parseError === "function") this.parseError = this.yy.parseError;
            function popStack(n) {
                stack.length = stack.length - 2 * n;
                vstack.length = vstack.length - n;
                lstack.length = lstack.length - n;
            }
            function lex() {
                var token;
                token = self.lexer.lex() || 1;
                if (typeof token !== "number") {
                    token = self.symbols_[token] || token;
                }
                return token;
            }
            var symbol,
                preErrorSymbol,
                state,
                action,
                a,
                r,
                yyval = {},
                p,
                len,
                newState,
                expected;
            while (true) {
                state = stack[stack.length - 1];
                if (this.defaultActions[state]) {
                    action = this.defaultActions[state];
                } else {
                    if (symbol === null || typeof symbol == "undefined") {
                        symbol = lex();
                    }
                    action = table[state] && table[state][symbol];
                }
                if (typeof action === "undefined" || !action.length || !action[0]) {
                    var errStr = "";
                    if (!recovering) {
                        expected = [];
                        for (p in table[state]) if (this.terminals_[p] && p > 2) {
                            expected.push("'" + this.terminals_[p] + "'");
                        }
                        if (this.lexer.showPosition) {
                            errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                        } else {
                            errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                        }
                        this.parseError(errStr, { text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected });
                    }
                }
                if (action[0] instanceof Array && action.length > 1) {
                    throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
                }
                switch (action[0]) {
                    case 1:
                        stack.push(symbol);
                        vstack.push(this.lexer.yytext);
                        lstack.push(this.lexer.yylloc);
                        stack.push(action[1]);
                        symbol = null;
                        if (!preErrorSymbol) {
                            yyleng = this.lexer.yyleng;
                            yytext = this.lexer.yytext;
                            yylineno = this.lexer.yylineno;
                            yyloc = this.lexer.yylloc;
                            if (recovering > 0) recovering--;
                        } else {
                            symbol = preErrorSymbol;
                            preErrorSymbol = null;
                        }
                        break;
                    case 2:
                        len = this.productions_[action[1]][1];
                        yyval.$ = vstack[vstack.length - len];
                        yyval._$ = { first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column };
                        if (ranges) {
                            yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                        }
                        r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                        if (typeof r !== "undefined") {
                            return r;
                        }
                        if (len) {
                            stack = stack.slice(0, -1 * len * 2);
                            vstack = vstack.slice(0, -1 * len);
                            lstack = lstack.slice(0, -1 * len);
                        }
                        stack.push(this.productions_[action[1]][0]);
                        vstack.push(yyval.$);
                        lstack.push(yyval._$);
                        newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                        stack.push(newState);
                        break;
                    case 3:
                        return true;
                }
            }
            return true;
        }
    };
    /* Jison generated lexer */
    var lexer = (function () {
        var lexer = { EOF: 1,
            parseError: function parseError(str, hash) {
                if (this.yy.parser) {
                    this.yy.parser.parseError(str, hash);
                } else {
                    throw new Error(str);
                }
            },
            setInput: function setInput(input) {
                this._input = input;
                this._more = this._less = this.done = false;
                this.yylineno = this.yyleng = 0;
                this.yytext = this.matched = this.match = "";
                this.conditionStack = ["INITIAL"];
                this.yylloc = { first_line: 1, first_column: 0, last_line: 1, last_column: 0 };
                if (this.options.ranges) this.yylloc.range = [0, 0];
                this.offset = 0;
                return this;
            },
            input: function input() {
                var ch = this._input[0];
                this.yytext += ch;
                this.yyleng++;
                this.offset++;
                this.match += ch;
                this.matched += ch;
                var lines = ch.match(/(?:\r\n?|\n).*/g);
                if (lines) {
                    this.yylineno++;
                    this.yylloc.last_line++;
                } else {
                    this.yylloc.last_column++;
                }
                if (this.options.ranges) this.yylloc.range[1]++;

                this._input = this._input.slice(1);
                return ch;
            },
            unput: function unput(ch) {
                var len = ch.length;
                var lines = ch.split(/(?:\r\n?|\n)/g);

                this._input = ch + this._input;
                this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
                //this.yyleng -= len;
                this.offset -= len;
                var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                this.match = this.match.substr(0, this.match.length - 1);
                this.matched = this.matched.substr(0, this.matched.length - 1);

                if (lines.length - 1) this.yylineno -= lines.length - 1;
                var r = this.yylloc.range;

                this.yylloc = { first_line: this.yylloc.first_line,
                    last_line: this.yylineno + 1,
                    first_column: this.yylloc.first_column,
                    last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
                };

                if (this.options.ranges) {
                    this.yylloc.range = [r[0], r[0] + this.yyleng - len];
                }
                return this;
            },
            more: function more() {
                this._more = true;
                return this;
            },
            less: function less(n) {
                this.unput(this.match.slice(n));
            },
            pastInput: function pastInput() {
                var past = this.matched.substr(0, this.matched.length - this.match.length);
                return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
            },
            upcomingInput: function upcomingInput() {
                var next = this.match;
                if (next.length < 20) {
                    next += this._input.substr(0, 20 - next.length);
                }
                return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
            },
            showPosition: function showPosition() {
                var pre = this.pastInput();
                var c = new Array(pre.length + 1).join("-");
                return pre + this.upcomingInput() + "\n" + c + "^";
            },
            next: function next() {
                if (this.done) {
                    return this.EOF;
                }
                if (!this._input) this.done = true;

                var token, match, tempMatch, index, col, lines;
                if (!this._more) {
                    this.yytext = "";
                    this.match = "";
                }
                var rules = this._currentRules();
                for (var i = 0; i < rules.length; i++) {
                    tempMatch = this._input.match(this.rules[rules[i]]);
                    if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                        match = tempMatch;
                        index = i;
                        if (!this.options.flex) break;
                    }
                }
                if (match) {
                    lines = match[0].match(/(?:\r\n?|\n).*/g);
                    if (lines) this.yylineno += lines.length;
                    this.yylloc = { first_line: this.yylloc.last_line,
                        last_line: this.yylineno + 1,
                        first_column: this.yylloc.last_column,
                        last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length };
                    this.yytext += match[0];
                    this.match += match[0];
                    this.matches = match;
                    this.yyleng = this.yytext.length;
                    if (this.options.ranges) {
                        this.yylloc.range = [this.offset, this.offset += this.yyleng];
                    }
                    this._more = false;
                    this._input = this._input.slice(match[0].length);
                    this.matched += match[0];
                    token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
                    if (this.done && this._input) this.done = false;
                    if (token) {
                        return token;
                    } else {
                        return;
                    }
                }
                if (this._input === "") {
                    return this.EOF;
                } else {
                    return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), { text: "", token: null, line: this.yylineno });
                }
            },
            lex: function lex() {
                var r = this.next();
                if (typeof r !== "undefined") {
                    return r;
                } else {
                    return this.lex();
                }
            },
            begin: function begin(condition) {
                this.conditionStack.push(condition);
            },
            popState: function popState() {
                return this.conditionStack.pop();
            },
            _currentRules: function _currentRules() {
                return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
            },
            topState: function topState() {
                return this.conditionStack[this.conditionStack.length - 2];
            },
            pushState: function begin(condition) {
                this.begin(condition);
            } };
        lexer.options = {};
        lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

            function strip(start, end) {
                return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng - end);
            }

            var YYSTATE = YY_START;
            switch ($avoiding_name_collisions) {
                case 0:
                    if (yy_.yytext.slice(-2) === "\\\\") {
                        strip(0, 1);
                        this.begin("mu");
                    } else if (yy_.yytext.slice(-1) === "\\") {
                        strip(0, 1);
                        this.begin("emu");
                    } else {
                        this.begin("mu");
                    }
                    if (yy_.yytext) {
                        return 14;
                    }break;
                case 1:
                    return 14;
                    break;
                case 2:
                    this.popState();
                    return 14;

                    break;
                case 3:
                    yy_.yytext = yy_.yytext.substr(5, yy_.yyleng - 9);
                    this.popState();
                    return 16;

                    break;
                case 4:
                    return 14;
                    break;
                case 5:
                    this.popState();
                    return 13;

                    break;
                case 6:
                    return 59;
                    break;
                case 7:
                    return 62;
                    break;
                case 8:
                    return 17;
                    break;
                case 9:
                    this.popState();
                    this.begin("raw");
                    return 21;

                    break;
                case 10:
                    return 53;
                    break;
                case 11:
                    return 27;
                    break;
                case 12:
                    return 45;
                    break;
                case 13:
                    this.popState();return 42;
                    break;
                case 14:
                    this.popState();return 42;
                    break;
                case 15:
                    return 32;
                    break;
                case 16:
                    return 37;
                    break;
                case 17:
                    return 49;
                    break;
                case 18:
                    return 46;
                    break;
                case 19:
                    this.unput(yy_.yytext);
                    this.popState();
                    this.begin("com");

                    break;
                case 20:
                    this.popState();
                    return 13;

                    break;
                case 21:
                    return 46;
                    break;
                case 22:
                    return 67;
                    break;
                case 23:
                    return 66;
                    break;
                case 24:
                    return 66;
                    break;
                case 25:
                    return 81;
                    break;
                case 26:
                    // ignore whitespace
                    break;
                case 27:
                    this.popState();return 52;
                    break;
                case 28:
                    this.popState();return 31;
                    break;
                case 29:
                    yy_.yytext = strip(1, 2).replace(/\\"/g, "\"");return 74;
                    break;
                case 30:
                    yy_.yytext = strip(1, 2).replace(/\\'/g, "'");return 74;
                    break;
                case 31:
                    return 79;
                    break;
                case 32:
                    return 76;
                    break;
                case 33:
                    return 76;
                    break;
                case 34:
                    return 77;
                    break;
                case 35:
                    return 78;
                    break;
                case 36:
                    return 75;
                    break;
                case 37:
                    return 69;
                    break;
                case 38:
                    return 71;
                    break;
                case 39:
                    return 66;
                    break;
                case 40:
                    return 66;
                    break;
                case 41:
                    return "INVALID";
                    break;
                case 42:
                    return 5;
                    break;
            }
        };
        lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/, /^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/, /^(?:[^\x00]*?(?=(\{\{\{\{\/)))/, /^(?:[\s\S]*?--(~)?\}\})/, /^(?:\()/, /^(?:\))/, /^(?:\{\{\{\{)/, /^(?:\}\}\}\})/, /^(?:\{\{(~)?>)/, /^(?:\{\{(~)?#)/, /^(?:\{\{(~)?\/)/, /^(?:\{\{(~)?\^\s*(~)?\}\})/, /^(?:\{\{(~)?\s*else\s*(~)?\}\})/, /^(?:\{\{(~)?\^)/, /^(?:\{\{(~)?\s*else\b)/, /^(?:\{\{(~)?\{)/, /^(?:\{\{(~)?&)/, /^(?:\{\{(~)?!--)/, /^(?:\{\{(~)?![\s\S]*?\}\})/, /^(?:\{\{(~)?)/, /^(?:=)/, /^(?:\.\.)/, /^(?:\.(?=([=~}\s\/.)|])))/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}(~)?\}\})/, /^(?:(~)?\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=([~}\s)])))/, /^(?:false(?=([~}\s)])))/, /^(?:undefined(?=([~}\s)])))/, /^(?:null(?=([~}\s)])))/, /^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/, /^(?:as\s+\|)/, /^(?:\|)/, /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/, /^(?:\[[^\]]*\])/, /^(?:.)/, /^(?:$)/];
        lexer.conditions = { mu: { rules: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42], inclusive: false }, emu: { rules: [2], inclusive: false }, com: { rules: [5], inclusive: false }, raw: { rules: [3, 4], inclusive: false }, INITIAL: { rules: [0, 1, 42], inclusive: true } };
        return lexer;
    })();
    parser.lexer = lexer;
    function Parser() {
        this.yy = {};
    }Parser.prototype = parser;parser.Parser = Parser;
    return new Parser();
})();exports["default"] = handlebars;
module.exports = exports["default"];
},{}],31:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.print = print;
exports.PrintVisitor = PrintVisitor;
/*eslint-disable new-cap */

var _Visitor = require('./visitor');

var _Visitor2 = _interopRequireWildcard(_Visitor);

function print(ast) {
  return new PrintVisitor().accept(ast);
}

function PrintVisitor() {
  this.padding = 0;
}

PrintVisitor.prototype = new _Visitor2['default']();

PrintVisitor.prototype.pad = function (string) {
  var out = '';

  for (var i = 0, l = this.padding; i < l; i++) {
    out = out + '  ';
  }

  out = out + string + '\n';
  return out;
};

PrintVisitor.prototype.Program = function (program) {
  var out = '',
      body = program.body,
      i = undefined,
      l = undefined;

  if (program.blockParams) {
    var blockParams = 'BLOCK PARAMS: [';
    for (i = 0, l = program.blockParams.length; i < l; i++) {
      blockParams += ' ' + program.blockParams[i];
    }
    blockParams += ' ]';
    out += this.pad(blockParams);
  }

  for (i = 0, l = body.length; i < l; i++) {
    out = out + this.accept(body[i]);
  }

  this.padding--;

  return out;
};

PrintVisitor.prototype.MustacheStatement = function (mustache) {
  return this.pad('{{ ' + this.SubExpression(mustache) + ' }}');
};

PrintVisitor.prototype.BlockStatement = function (block) {
  var out = '';

  out = out + this.pad('BLOCK:');
  this.padding++;
  out = out + this.pad(this.SubExpression(block));
  if (block.program) {
    out = out + this.pad('PROGRAM:');
    this.padding++;
    out = out + this.accept(block.program);
    this.padding--;
  }
  if (block.inverse) {
    if (block.program) {
      this.padding++;
    }
    out = out + this.pad('{{^}}');
    this.padding++;
    out = out + this.accept(block.inverse);
    this.padding--;
    if (block.program) {
      this.padding--;
    }
  }
  this.padding--;

  return out;
};

PrintVisitor.prototype.PartialStatement = function (partial) {
  var content = 'PARTIAL:' + partial.name.original;
  if (partial.params[0]) {
    content += ' ' + this.accept(partial.params[0]);
  }
  if (partial.hash) {
    content += ' ' + this.accept(partial.hash);
  }
  return this.pad('{{> ' + content + ' }}');
};

PrintVisitor.prototype.ContentStatement = function (content) {
  return this.pad('CONTENT[ \'' + content.value + '\' ]');
};

PrintVisitor.prototype.CommentStatement = function (comment) {
  return this.pad('{{! \'' + comment.value + '\' }}');
};

PrintVisitor.prototype.SubExpression = function (sexpr) {
  var params = sexpr.params,
      paramStrings = [],
      hash = undefined;

  for (var i = 0, l = params.length; i < l; i++) {
    paramStrings.push(this.accept(params[i]));
  }

  params = '[' + paramStrings.join(', ') + ']';

  hash = sexpr.hash ? ' ' + this.accept(sexpr.hash) : '';

  return this.accept(sexpr.path) + ' ' + params + hash;
};

PrintVisitor.prototype.PathExpression = function (id) {
  var path = id.parts.join('/');
  return (id.data ? '@' : '') + 'PATH:' + path;
};

PrintVisitor.prototype.StringLiteral = function (string) {
  return '"' + string.value + '"';
};

PrintVisitor.prototype.NumberLiteral = function (number) {
  return 'NUMBER{' + number.value + '}';
};

PrintVisitor.prototype.BooleanLiteral = function (bool) {
  return 'BOOLEAN{' + bool.value + '}';
};

PrintVisitor.prototype.UndefinedLiteral = function () {
  return 'UNDEFINED';
};

PrintVisitor.prototype.NullLiteral = function () {
  return 'NULL';
};

PrintVisitor.prototype.Hash = function (hash) {
  var pairs = hash.pairs,
      joinedPairs = [];

  for (var i = 0, l = pairs.length; i < l; i++) {
    joinedPairs.push(this.accept(pairs[i]));
  }

  return 'HASH{' + joinedPairs.join(', ') + '}';
};
PrintVisitor.prototype.HashPair = function (pair) {
  return pair.key + '=' + this.accept(pair.value);
};
/*eslint-enable new-cap */
},{"./visitor":32}],32:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;

var _Exception = require('../exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _AST = require('./ast');

var _AST2 = _interopRequireWildcard(_AST);

function Visitor() {
  this.parents = [];
}

Visitor.prototype = {
  constructor: Visitor,
  mutating: false,

  // Visits a given value. If mutating, will replace the value if necessary.
  acceptKey: function acceptKey(node, name) {
    var value = this.accept(node[name]);
    if (this.mutating) {
      // Hacky sanity check:
      if (value && (!value.type || !_AST2['default'][value.type])) {
        throw new _Exception2['default']('Unexpected node type "' + value.type + '" found when accepting ' + name + ' on ' + node.type);
      }
      node[name] = value;
    }
  },

  // Performs an accept operation with added sanity check to ensure
  // required keys are not removed.
  acceptRequired: function acceptRequired(node, name) {
    this.acceptKey(node, name);

    if (!node[name]) {
      throw new _Exception2['default'](node.type + ' requires ' + name);
    }
  },

  // Traverses a given array. If mutating, empty respnses will be removed
  // for child elements.
  acceptArray: function acceptArray(array) {
    for (var i = 0, l = array.length; i < l; i++) {
      this.acceptKey(array, i);

      if (!array[i]) {
        array.splice(i, 1);
        i--;
        l--;
      }
    }
  },

  accept: function accept(object) {
    if (!object) {
      return;
    }

    if (this.current) {
      this.parents.unshift(this.current);
    }
    this.current = object;

    var ret = this[object.type](object);

    this.current = this.parents.shift();

    if (!this.mutating || ret) {
      return ret;
    } else if (ret !== false) {
      return object;
    }
  },

  Program: function Program(program) {
    this.acceptArray(program.body);
  },

  MustacheStatement: function MustacheStatement(mustache) {
    this.acceptRequired(mustache, 'path');
    this.acceptArray(mustache.params);
    this.acceptKey(mustache, 'hash');
  },

  BlockStatement: function BlockStatement(block) {
    this.acceptRequired(block, 'path');
    this.acceptArray(block.params);
    this.acceptKey(block, 'hash');

    this.acceptKey(block, 'program');
    this.acceptKey(block, 'inverse');
  },

  PartialStatement: function PartialStatement(partial) {
    this.acceptRequired(partial, 'name');
    this.acceptArray(partial.params);
    this.acceptKey(partial, 'hash');
  },

  ContentStatement: function ContentStatement() {},
  CommentStatement: function CommentStatement() {},

  SubExpression: function SubExpression(sexpr) {
    this.acceptRequired(sexpr, 'path');
    this.acceptArray(sexpr.params);
    this.acceptKey(sexpr, 'hash');
  },

  PathExpression: function PathExpression() {},

  StringLiteral: function StringLiteral() {},
  NumberLiteral: function NumberLiteral() {},
  BooleanLiteral: function BooleanLiteral() {},
  UndefinedLiteral: function UndefinedLiteral() {},
  NullLiteral: function NullLiteral() {},

  Hash: function Hash(hash) {
    this.acceptArray(hash.pairs);
  },
  HashPair: function HashPair(pair) {
    this.acceptRequired(pair, 'value');
  }
};

exports['default'] = Visitor;
module.exports = exports['default'];
/* content */ /* comment */ /* path */ /* string */ /* number */ /* bool */ /* literal */ /* literal */
},{"../exception":34,"./ast":24}],33:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;

var _Visitor = require('./visitor');

var _Visitor2 = _interopRequireWildcard(_Visitor);

function WhitespaceControl() {}
WhitespaceControl.prototype = new _Visitor2['default']();

WhitespaceControl.prototype.Program = function (program) {
  var isRoot = !this.isRootSeen;
  this.isRootSeen = true;

  var body = program.body;
  for (var i = 0, l = body.length; i < l; i++) {
    var current = body[i],
        strip = this.accept(current);

    if (!strip) {
      continue;
    }

    var _isPrevWhitespace = isPrevWhitespace(body, i, isRoot),
        _isNextWhitespace = isNextWhitespace(body, i, isRoot),
        openStandalone = strip.openStandalone && _isPrevWhitespace,
        closeStandalone = strip.closeStandalone && _isNextWhitespace,
        inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;

    if (strip.close) {
      omitRight(body, i, true);
    }
    if (strip.open) {
      omitLeft(body, i, true);
    }

    if (inlineStandalone) {
      omitRight(body, i);

      if (omitLeft(body, i)) {
        // If we are on a standalone node, save the indent info for partials
        if (current.type === 'PartialStatement') {
          // Pull out the whitespace from the final line
          current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
        }
      }
    }
    if (openStandalone) {
      omitRight((current.program || current.inverse).body);

      // Strip out the previous content node if it's whitespace only
      omitLeft(body, i);
    }
    if (closeStandalone) {
      // Always strip the next node
      omitRight(body, i);

      omitLeft((current.inverse || current.program).body);
    }
  }

  return program;
};
WhitespaceControl.prototype.BlockStatement = function (block) {
  this.accept(block.program);
  this.accept(block.inverse);

  // Find the inverse program that is involed with whitespace stripping.
  var program = block.program || block.inverse,
      inverse = block.program && block.inverse,
      firstInverse = inverse,
      lastInverse = inverse;

  if (inverse && inverse.chained) {
    firstInverse = inverse.body[0].program;

    // Walk the inverse chain to find the last inverse that is actually in the chain.
    while (lastInverse.chained) {
      lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
    }
  }

  var strip = {
    open: block.openStrip.open,
    close: block.closeStrip.close,

    // Determine the standalone candiacy. Basically flag our content as being possibly standalone
    // so our parent can determine if we actually are standalone
    openStandalone: isNextWhitespace(program.body),
    closeStandalone: isPrevWhitespace((firstInverse || program).body)
  };

  if (block.openStrip.close) {
    omitRight(program.body, null, true);
  }

  if (inverse) {
    var inverseStrip = block.inverseStrip;

    if (inverseStrip.open) {
      omitLeft(program.body, null, true);
    }

    if (inverseStrip.close) {
      omitRight(firstInverse.body, null, true);
    }
    if (block.closeStrip.open) {
      omitLeft(lastInverse.body, null, true);
    }

    // Find standalone else statments
    if (isPrevWhitespace(program.body) && isNextWhitespace(firstInverse.body)) {
      omitLeft(program.body);
      omitRight(firstInverse.body);
    }
  } else if (block.closeStrip.open) {
    omitLeft(program.body, null, true);
  }

  return strip;
};

WhitespaceControl.prototype.MustacheStatement = function (mustache) {
  return mustache.strip;
};

WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function (node) {
  /* istanbul ignore next */
  var strip = node.strip || {};
  return {
    inlineStandalone: true,
    open: strip.open,
    close: strip.close
  };
};

function isPrevWhitespace(body, i, isRoot) {
  if (i === undefined) {
    i = body.length;
  }

  // Nodes that end with newlines are considered whitespace (but are special
  // cased for strip operations)
  var prev = body[i - 1],
      sibling = body[i - 2];
  if (!prev) {
    return isRoot;
  }

  if (prev.type === 'ContentStatement') {
    return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(prev.original);
  }
}
function isNextWhitespace(body, i, isRoot) {
  if (i === undefined) {
    i = -1;
  }

  var next = body[i + 1],
      sibling = body[i + 2];
  if (!next) {
    return isRoot;
  }

  if (next.type === 'ContentStatement') {
    return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(next.original);
  }
}

// Marks the node to the right of the position as omitted.
// I.e. {{foo}}' ' will mark the ' ' node as omitted.
//
// If i is undefined, then the first child will be marked as such.
//
// If mulitple is truthy then all whitespace will be stripped out until non-whitespace
// content is met.
function omitRight(body, i, multiple) {
  var current = body[i == null ? 0 : i + 1];
  if (!current || current.type !== 'ContentStatement' || !multiple && current.rightStripped) {
    return;
  }

  var original = current.value;
  current.value = current.value.replace(multiple ? /^\s+/ : /^[ \t]*\r?\n?/, '');
  current.rightStripped = current.value !== original;
}

// Marks the node to the left of the position as omitted.
// I.e. ' '{{foo}} will mark the ' ' node as omitted.
//
// If i is undefined then the last child will be marked as such.
//
// If mulitple is truthy then all whitespace will be stripped out until non-whitespace
// content is met.
function omitLeft(body, i, multiple) {
  var current = body[i == null ? body.length - 1 : i - 1];
  if (!current || current.type !== 'ContentStatement' || !multiple && current.leftStripped) {
    return;
  }

  // We omit the last node if it's whitespace only and not preceeded by a non-content node.
  var original = current.value;
  current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, '');
  current.leftStripped = current.value !== original;
  return current.leftStripped;
}

exports['default'] = WhitespaceControl;
module.exports = exports['default'];
},{"./visitor":32}],34:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var loc = node && node.loc,
      line = undefined,
      column = undefined;
  if (loc) {
    line = loc.start.line;
    column = loc.start.column;

    message += ' - ' + line + ':' + column;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception);
  }

  if (loc) {
    this.lineNumber = line;
    this.column = column;
  }
}

Exception.prototype = new Error();

exports['default'] = Exception;
module.exports = exports['default'];
},{}],35:[function(require,module,exports){
(function (global){
'use strict';

exports.__esModule = true;
/*global window */

exports['default'] = function (Handlebars) {
  /* istanbul ignore next */
  var root = typeof global !== 'undefined' ? global : window,
      $Handlebars = root.Handlebars;
  /* istanbul ignore next */
  Handlebars.noConflict = function () {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars;
    }
  };
};

module.exports = exports['default'];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],36:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.checkRevision = checkRevision;

// TODO: Remove this line and break up compilePartial

exports.template = template;
exports.wrapProgram = wrapProgram;
exports.resolvePartial = resolvePartial;
exports.invokePartial = invokePartial;
exports.noop = noop;

var _import = require('./utils');

var Utils = _interopRequireWildcard(_import);

var _Exception = require('./exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _COMPILER_REVISION$REVISION_CHANGES$createFrame = require('./base');

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = _COMPILER_REVISION$REVISION_CHANGES$createFrame.COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = _COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[currentRevision],
          compilerVersions = _COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[compilerRevision];
      throw new _Exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new _Exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
    }
  }
}

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new _Exception2['default']('No environment passed to template');
  }
  if (!templateSpec || !templateSpec.main) {
    throw new _Exception2['default']('Unknown template object: ' + typeof templateSpec);
  }

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  function invokePartialWrapper(partial, context, options) {
    if (options.hash) {
      context = Utils.extend({}, context, options.hash);
    }

    partial = env.VM.resolvePartial.call(this, partial, context, options);
    var result = env.VM.invokePartial.call(this, partial, context, options);

    if (result == null && env.compile) {
      options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
      result = options.partials[options.name](context, options);
    }
    if (result != null) {
      if (options.indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = options.indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new _Exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
    }
  }

  // Just add water
  var container = {
    strict: function strict(obj, name) {
      if (!(name in obj)) {
        throw new _Exception2['default']('"' + name + '" not defined in ' + obj);
      }
      return obj[name];
    },
    lookup: function lookup(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function lambda(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function fn(i) {
      return templateSpec[i];
    },

    programs: [],
    program: function program(i, data, declaredBlockParams, blockParams, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths || blockParams || declaredBlockParams) {
        programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
      }
      return programWrapper;
    },

    data: function data(value, depth) {
      while (value && depth--) {
        value = value._parent;
      }
      return value;
    },
    merge: function merge(param, common) {
      var obj = param || common;

      if (param && common && param !== common) {
        obj = Utils.extend({}, common, param);
      }

      return obj;
    },

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  function ret(context) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths = undefined,
        blockParams = templateSpec.useBlockParams ? [] : undefined;
    if (templateSpec.useDepths) {
      depths = options.depths ? [context].concat(options.depths) : [context];
    }

    return templateSpec.main.call(container, context, container.helpers, container.partials, data, blockParams, depths);
  }
  ret.isTop = true;

  ret._setup = function (options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
    }
  };

  ret._child = function (i, data, blockParams, depths) {
    if (templateSpec.useBlockParams && !blockParams) {
      throw new _Exception2['default']('must pass block params');
    }
    if (templateSpec.useDepths && !depths) {
      throw new _Exception2['default']('must pass parent depths');
    }

    return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
  };
  return ret;
}

function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
  function prog(context) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    return fn.call(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), depths && [context].concat(depths));
  }
  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  prog.blockParams = declaredBlockParams || 0;
  return prog;
}

function resolvePartial(partial, context, options) {
  if (!partial) {
    partial = options.partials[options.name];
  } else if (!partial.call && !options.name) {
    // This is a dynamic partial that returned a string
    options.name = partial;
    partial = options.partials[partial];
  }
  return partial;
}

function invokePartial(partial, context, options) {
  options.partial = true;

  if (partial === undefined) {
    throw new _Exception2['default']('The partial ' + options.name + ' could not be found');
  } else if (partial instanceof Function) {
    return partial(context, options);
  }
}

function noop() {
  return '';
}

function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? _COMPILER_REVISION$REVISION_CHANGES$createFrame.createFrame(data) : {};
    data.root = context;
  }
  return data;
}
},{"./base":23,"./exception":34,"./utils":38}],37:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports['default'] = SafeString;
module.exports = exports['default'];
},{}],38:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.extend = extend;

// Older IE versions do not directly support indexOf so we must implement our own, sadly.
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '`': '&#x60;'
};

var badChars = /[&<>"'`]/g,
    possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/*eslint-disable func-style, no-var */
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
/*eslint-enable func-style, no-var */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};exports.isArray = isArray;

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}
},{}],39:[function(require,module,exports){
// USAGE:
// var handlebars = require('handlebars');
/* eslint-disable no-var */

// var local = handlebars.create();

var handlebars = require('../dist/cjs/handlebars')['default'];

var printer = require('../dist/cjs/handlebars/compiler/printer');
handlebars.PrintVisitor = printer.PrintVisitor;
handlebars.print = printer.print;

module.exports = handlebars;

// Publish a Node.js require() handler for .handlebars and .hbs files
function extension(module, filename) {
  var fs = require('fs');
  var templateString = fs.readFileSync(filename, 'utf8');
  module.exports = handlebars.compile(templateString);
}
/* istanbul ignore else */
if (typeof require !== 'undefined' && require.extensions) {
  require.extensions['.handlebars'] = extension;
  require.extensions['.hbs'] = extension;
}

},{"../dist/cjs/handlebars":21,"../dist/cjs/handlebars/compiler/printer":31,"fs":14}],40:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./source-map/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./source-map/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./source-map/source-node').SourceNode;

},{"./source-map/source-map-consumer":46,"./source-map/source-map-generator":47,"./source-map/source-node":48}],41:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');

  /**
   * A data structure which is a combination of an array and a set. Adding a new
   * member is O(1), testing for membership is O(1), and finding the index of an
   * element is O(1). Removing elements from the set is not supported. Only
   * strings are supported for membership.
   */
  function ArraySet() {
    this._array = [];
    this._set = {};
  }

  /**
   * Static method for creating ArraySet instances from an existing array.
   */
  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
    var set = new ArraySet();
    for (var i = 0, len = aArray.length; i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  };

  /**
   * Add the given string to this set.
   *
   * @param String aStr
   */
  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
    var isDuplicate = this.has(aStr);
    var idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      this._set[util.toSetString(aStr)] = idx;
    }
  };

  /**
   * Is the given string a member of this set?
   *
   * @param String aStr
   */
  ArraySet.prototype.has = function ArraySet_has(aStr) {
    return Object.prototype.hasOwnProperty.call(this._set,
                                                util.toSetString(aStr));
  };

  /**
   * What is the index of the given string in the array?
   *
   * @param String aStr
   */
  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
    if (this.has(aStr)) {
      return this._set[util.toSetString(aStr)];
    }
    throw new Error('"' + aStr + '" is not in the set.');
  };

  /**
   * What is the element at the given index?
   *
   * @param Number aIdx
   */
  ArraySet.prototype.at = function ArraySet_at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error('No element indexed by ' + aIdx);
  };

  /**
   * Returns the array representation of this set (which has the proper indices
   * indicated by indexOf). Note that this is a copy of the internal array used
   * for storing the members so that no one can mess with internal state.
   */
  ArraySet.prototype.toArray = function ArraySet_toArray() {
    return this._array.slice();
  };

  exports.ArraySet = ArraySet;

});

},{"./util":49,"amdefine":50}],42:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64 = require('./base64');

  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
  // length quantities we use in the source map spec, the first bit is the sign,
  // the next four bits are the actual value, and the 6th bit is the
  // continuation bit. The continuation bit tells us whether there are more
  // digits in this value following this digit.
  //
  //   Continuation
  //   |    Sign
  //   |    |
  //   V    V
  //   101011

  var VLQ_BASE_SHIFT = 5;

  // binary: 100000
  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

  // binary: 011111
  var VLQ_BASE_MASK = VLQ_BASE - 1;

  // binary: 100000
  var VLQ_CONTINUATION_BIT = VLQ_BASE;

  /**
   * Converts from a two-complement value to a value where the sign bit is
   * placed in the least significant bit.  For example, as decimals:
   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
   */
  function toVLQSigned(aValue) {
    return aValue < 0
      ? ((-aValue) << 1) + 1
      : (aValue << 1) + 0;
  }

  /**
   * Converts to a two-complement value from a value where the sign bit is
   * placed in the least significant bit.  For example, as decimals:
   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
   */
  function fromVLQSigned(aValue) {
    var isNegative = (aValue & 1) === 1;
    var shifted = aValue >> 1;
    return isNegative
      ? -shifted
      : shifted;
  }

  /**
   * Returns the base 64 VLQ encoded value.
   */
  exports.encode = function base64VLQ_encode(aValue) {
    var encoded = "";
    var digit;

    var vlq = toVLQSigned(aValue);

    do {
      digit = vlq & VLQ_BASE_MASK;
      vlq >>>= VLQ_BASE_SHIFT;
      if (vlq > 0) {
        // There are still more digits in this value, so we must make sure the
        // continuation bit is marked.
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += base64.encode(digit);
    } while (vlq > 0);

    return encoded;
  };

  /**
   * Decodes the next base 64 VLQ value from the given string and returns the
   * value and the rest of the string via the out parameter.
   */
  exports.decode = function base64VLQ_decode(aStr, aOutParam) {
    var i = 0;
    var strLen = aStr.length;
    var result = 0;
    var shift = 0;
    var continuation, digit;

    do {
      if (i >= strLen) {
        throw new Error("Expected more digits in base 64 VLQ value.");
      }
      digit = base64.decode(aStr.charAt(i++));
      continuation = !!(digit & VLQ_CONTINUATION_BIT);
      digit &= VLQ_BASE_MASK;
      result = result + (digit << shift);
      shift += VLQ_BASE_SHIFT;
    } while (continuation);

    aOutParam.value = fromVLQSigned(result);
    aOutParam.rest = aStr.slice(i);
  };

});

},{"./base64":43,"amdefine":50}],43:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var charToIntMap = {};
  var intToCharMap = {};

  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    .split('')
    .forEach(function (ch, index) {
      charToIntMap[ch] = index;
      intToCharMap[index] = ch;
    });

  /**
   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
   */
  exports.encode = function base64_encode(aNumber) {
    if (aNumber in intToCharMap) {
      return intToCharMap[aNumber];
    }
    throw new TypeError("Must be between 0 and 63: " + aNumber);
  };

  /**
   * Decode a single base 64 digit to an integer.
   */
  exports.decode = function base64_decode(aChar) {
    if (aChar in charToIntMap) {
      return charToIntMap[aChar];
    }
    throw new TypeError("Not a valid base 64 digit: " + aChar);
  };

});

},{"amdefine":50}],44:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  /**
   * Recursive implementation of binary search.
   *
   * @param aLow Indices here and lower do not contain the needle.
   * @param aHigh Indices here and higher do not contain the needle.
   * @param aNeedle The element being searched for.
   * @param aHaystack The non-empty array being searched.
   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
   */
  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
    // This function terminates when one of the following is true:
    //
    //   1. We find the exact element we are looking for.
    //
    //   2. We did not find the exact element, but we can return the index of
    //      the next closest element that is less than that element.
    //
    //   3. We did not find the exact element, and there is no next-closest
    //      element which is less than the one we are searching for, so we
    //      return -1.
    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
    var cmp = aCompare(aNeedle, aHaystack[mid], true);
    if (cmp === 0) {
      // Found the element we are looking for.
      return mid;
    }
    else if (cmp > 0) {
      // aHaystack[mid] is greater than our needle.
      if (aHigh - mid > 1) {
        // The element is in the upper half.
        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
      }
      // We did not find an exact match, return the next closest one
      // (termination case 2).
      return mid;
    }
    else {
      // aHaystack[mid] is less than our needle.
      if (mid - aLow > 1) {
        // The element is in the lower half.
        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
      }
      // The exact needle element was not found in this haystack. Determine if
      // we are in termination case (2) or (3) and return the appropriate thing.
      return aLow < 0 ? -1 : aLow;
    }
  }

  /**
   * This is an implementation of binary search which will always try and return
   * the index of next lowest value checked if there is no exact hit. This is
   * because mappings between original and generated line/col pairs are single
   * points, and there is an implicit region between each of them, so a miss
   * just means that you aren't on the very start of a region.
   *
   * @param aNeedle The element you are looking for.
   * @param aHaystack The array that is being searched.
   * @param aCompare A function which takes the needle and an element in the
   *     array and returns -1, 0, or 1 depending on whether the needle is less
   *     than, equal to, or greater than the element, respectively.
   */
  exports.search = function search(aNeedle, aHaystack, aCompare) {
    if (aHaystack.length === 0) {
      return -1;
    }
    return recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
  };

});

},{"amdefine":50}],45:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');

  /**
   * Determine whether mappingB is after mappingA with respect to generated
   * position.
   */
  function generatedPositionAfter(mappingA, mappingB) {
    // Optimized for most common case
    var lineA = mappingA.generatedLine;
    var lineB = mappingB.generatedLine;
    var columnA = mappingA.generatedColumn;
    var columnB = mappingB.generatedColumn;
    return lineB > lineA || lineB == lineA && columnB >= columnA ||
           util.compareByGeneratedPositions(mappingA, mappingB) <= 0;
  }

  /**
   * A data structure to provide a sorted view of accumulated mappings in a
   * performance conscious manner. It trades a neglibable overhead in general
   * case for a large speedup in case of mappings being added in order.
   */
  function MappingList() {
    this._array = [];
    this._sorted = true;
    // Serves as infimum
    this._last = {generatedLine: -1, generatedColumn: 0};
  }

  /**
   * Iterate through internal items. This method takes the same arguments that
   * `Array.prototype.forEach` takes.
   *
   * NOTE: The order of the mappings is NOT guaranteed.
   */
  MappingList.prototype.unsortedForEach =
    function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };

  /**
   * Add the given source mapping.
   *
   * @param Object aMapping
   */
  MappingList.prototype.add = function MappingList_add(aMapping) {
    var mapping;
    if (generatedPositionAfter(this._last, aMapping)) {
      this._last = aMapping;
      this._array.push(aMapping);
    } else {
      this._sorted = false;
      this._array.push(aMapping);
    }
  };

  /**
   * Returns the flat, sorted array of mappings. The mappings are sorted by
   * generated position.
   *
   * WARNING: This method returns internal data without copying, for
   * performance. The return value must NOT be mutated, and should be treated as
   * an immutable borrow. If you want to take ownership, you must make your own
   * copy.
   */
  MappingList.prototype.toArray = function MappingList_toArray() {
    if (!this._sorted) {
      this._array.sort(util.compareByGeneratedPositions);
      this._sorted = true;
    }
    return this._array;
  };

  exports.MappingList = MappingList;

});

},{"./util":49,"amdefine":50}],46:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');
  var binarySearch = require('./binary-search');
  var ArraySet = require('./array-set').ArraySet;
  var base64VLQ = require('./base64-vlq');

  /**
   * A SourceMapConsumer instance represents a parsed source map which we can
   * query for information about the original file positions by giving it a file
   * position in the generated source.
   *
   * The only parameter is the raw source map (either as a JSON string, or
   * already parsed to an object). According to the spec, source maps have the
   * following attributes:
   *
   *   - version: Which version of the source map spec this map is following.
   *   - sources: An array of URLs to the original source files.
   *   - names: An array of identifiers which can be referrenced by individual mappings.
   *   - sourceRoot: Optional. The URL root from which all sources are relative.
   *   - sourcesContent: Optional. An array of contents of the original source files.
   *   - mappings: A string of base64 VLQs which contain the actual mappings.
   *   - file: Optional. The generated file this source map is associated with.
   *
   * Here is an example source map, taken from the source map spec[0]:
   *
   *     {
   *       version : 3,
   *       file: "out.js",
   *       sourceRoot : "",
   *       sources: ["foo.js", "bar.js"],
   *       names: ["src", "maps", "are", "fun"],
   *       mappings: "AA,AB;;ABCDE;"
   *     }
   *
   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
   */
  function SourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    var version = util.getArg(sourceMap, 'version');
    var sources = util.getArg(sourceMap, 'sources');
    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
    // requires the array) to play nice here.
    var names = util.getArg(sourceMap, 'names', []);
    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
    var mappings = util.getArg(sourceMap, 'mappings');
    var file = util.getArg(sourceMap, 'file', null);

    // Once again, Sass deviates from the spec and supplies the version as a
    // string rather than a number, so we use loose equality checking here.
    if (version != this._version) {
      throw new Error('Unsupported version: ' + version);
    }

    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    sources = sources.map(util.normalize);

    // Pass `true` below to allow duplicate names and sources. While source maps
    // are intended to be compressed and deduplicated, the TypeScript compiler
    // sometimes generates source maps with duplicates in them. See Github issue
    // #72 and bugzil.la/889492.
    this._names = ArraySet.fromArray(names, true);
    this._sources = ArraySet.fromArray(sources, true);

    this.sourceRoot = sourceRoot;
    this.sourcesContent = sourcesContent;
    this._mappings = mappings;
    this.file = file;
  }

  /**
   * Create a SourceMapConsumer from a SourceMapGenerator.
   *
   * @param SourceMapGenerator aSourceMap
   *        The source map that will be consumed.
   * @returns SourceMapConsumer
   */
  SourceMapConsumer.fromSourceMap =
    function SourceMapConsumer_fromSourceMap(aSourceMap) {
      var smc = Object.create(SourceMapConsumer.prototype);

      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                              smc.sourceRoot);
      smc.file = aSourceMap._file;

      smc.__generatedMappings = aSourceMap._mappings.toArray().slice();
      smc.__originalMappings = aSourceMap._mappings.toArray().slice()
        .sort(util.compareByOriginalPositions);

      return smc;
    };

  /**
   * The version of the source mapping spec that we are consuming.
   */
  SourceMapConsumer.prototype._version = 3;

  /**
   * The list of original sources.
   */
  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
    get: function () {
      return this._sources.toArray().map(function (s) {
        return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
      }, this);
    }
  });

  // `__generatedMappings` and `__originalMappings` are arrays that hold the
  // parsed mapping coordinates from the source map's "mappings" attribute. They
  // are lazily instantiated, accessed via the `_generatedMappings` and
  // `_originalMappings` getters respectively, and we only parse the mappings
  // and create these arrays once queried for a source location. We jump through
  // these hoops because there can be many thousands of mappings, and parsing
  // them is expensive, so we only want to do it if we must.
  //
  // Each object in the arrays is of the form:
  //
  //     {
  //       generatedLine: The line number in the generated code,
  //       generatedColumn: The column number in the generated code,
  //       source: The path to the original source file that generated this
  //               chunk of code,
  //       originalLine: The line number in the original source that
  //                     corresponds to this chunk of generated code,
  //       originalColumn: The column number in the original source that
  //                       corresponds to this chunk of generated code,
  //       name: The name of the original symbol which generated this chunk of
  //             code.
  //     }
  //
  // All properties except for `generatedLine` and `generatedColumn` can be
  // `null`.
  //
  // `_generatedMappings` is ordered by the generated positions.
  //
  // `_originalMappings` is ordered by the original positions.

  SourceMapConsumer.prototype.__generatedMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
    get: function () {
      if (!this.__generatedMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__generatedMappings;
    }
  });

  SourceMapConsumer.prototype.__originalMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
    get: function () {
      if (!this.__originalMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__originalMappings;
    }
  });

  SourceMapConsumer.prototype._nextCharIsMappingSeparator =
    function SourceMapConsumer_nextCharIsMappingSeparator(aStr) {
      var c = aStr.charAt(0);
      return c === ";" || c === ",";
    };

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  SourceMapConsumer.prototype._parseMappings =
    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var str = aStr;
      var temp = {};
      var mapping;

      while (str.length > 0) {
        if (str.charAt(0) === ';') {
          generatedLine++;
          str = str.slice(1);
          previousGeneratedColumn = 0;
        }
        else if (str.charAt(0) === ',') {
          str = str.slice(1);
        }
        else {
          mapping = {};
          mapping.generatedLine = generatedLine;

          // Generated column.
          base64VLQ.decode(str, temp);
          mapping.generatedColumn = previousGeneratedColumn + temp.value;
          previousGeneratedColumn = mapping.generatedColumn;
          str = temp.rest;

          if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
            // Original source.
            base64VLQ.decode(str, temp);
            mapping.source = this._sources.at(previousSource + temp.value);
            previousSource += temp.value;
            str = temp.rest;
            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
              throw new Error('Found a source, but no line and column');
            }

            // Original line.
            base64VLQ.decode(str, temp);
            mapping.originalLine = previousOriginalLine + temp.value;
            previousOriginalLine = mapping.originalLine;
            // Lines are stored 0-based
            mapping.originalLine += 1;
            str = temp.rest;
            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
              throw new Error('Found a source and line, but no column');
            }

            // Original column.
            base64VLQ.decode(str, temp);
            mapping.originalColumn = previousOriginalColumn + temp.value;
            previousOriginalColumn = mapping.originalColumn;
            str = temp.rest;

            if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
              // Original name.
              base64VLQ.decode(str, temp);
              mapping.name = this._names.at(previousName + temp.value);
              previousName += temp.value;
              str = temp.rest;
            }
          }

          this.__generatedMappings.push(mapping);
          if (typeof mapping.originalLine === 'number') {
            this.__originalMappings.push(mapping);
          }
        }
      }

      this.__generatedMappings.sort(util.compareByGeneratedPositions);
      this.__originalMappings.sort(util.compareByOriginalPositions);
    };

  /**
   * Find the mapping that best matches the hypothetical "needle" mapping that
   * we are searching for in the given "haystack" of mappings.
   */
  SourceMapConsumer.prototype._findMapping =
    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                           aColumnName, aComparator) {
      // To return the position we are searching for, we must first find the
      // mapping for the given position and then return the opposite position it
      // points to. Because the mappings are sorted, we can use binary search to
      // find the best mapping.

      if (aNeedle[aLineName] <= 0) {
        throw new TypeError('Line must be greater than or equal to 1, got '
                            + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError('Column must be greater than or equal to 0, got '
                            + aNeedle[aColumnName]);
      }

      return binarySearch.search(aNeedle, aMappings, aComparator);
    };

  /**
   * Compute the last column for each generated mapping. The last column is
   * inclusive.
   */
  SourceMapConsumer.prototype.computeColumnSpans =
    function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];

        // Mappings do not contain a field for the last generated columnt. We
        // can come up with an optimistic estimate, however, by assuming that
        // mappings are contiguous (i.e. given two consecutive mappings, the
        // first mapping ends where the second one starts).
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];

          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }

        // The last mapping for each line spans the entire line.
        mapping.lastGeneratedColumn = Infinity;
      }
    };

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.
   *   - column: The column number in the generated source.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.
   *   - column: The column number in the original source, or null.
   *   - name: The original identifier, or null.
   */
  SourceMapConsumer.prototype.originalPositionFor =
    function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, 'line'),
        generatedColumn: util.getArg(aArgs, 'column')
      };

      var index = this._findMapping(needle,
                                    this._generatedMappings,
                                    "generatedLine",
                                    "generatedColumn",
                                    util.compareByGeneratedPositions);

      if (index >= 0) {
        var mapping = this._generatedMappings[index];

        if (mapping.generatedLine === needle.generatedLine) {
          var source = util.getArg(mapping, 'source', null);
          if (source != null && this.sourceRoot != null) {
            source = util.join(this.sourceRoot, source);
          }
          return {
            source: source,
            line: util.getArg(mapping, 'originalLine', null),
            column: util.getArg(mapping, 'originalColumn', null),
            name: util.getArg(mapping, 'name', null)
          };
        }
      }

      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * availible.
   */
  SourceMapConsumer.prototype.sourceContentFor =
    function SourceMapConsumer_sourceContentFor(aSource) {
      if (!this.sourcesContent) {
        return null;
      }

      if (this.sourceRoot != null) {
        aSource = util.relative(this.sourceRoot, aSource);
      }

      if (this._sources.has(aSource)) {
        return this.sourcesContent[this._sources.indexOf(aSource)];
      }

      var url;
      if (this.sourceRoot != null
          && (url = util.urlParse(this.sourceRoot))) {
        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
        // many users. We can help them out when they expect file:// URIs to
        // behave like it would if they were running a local HTTP server. See
        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
        if (url.scheme == "file"
            && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
        }

        if ((!url.path || url.path == "/")
            && this._sources.has("/" + aSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
        }
      }

      throw new Error('"' + aSource + '" is not in the SourceMap.');
    };

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: The column number in the original source.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  SourceMapConsumer.prototype.generatedPositionFor =
    function SourceMapConsumer_generatedPositionFor(aArgs) {
      var needle = {
        source: util.getArg(aArgs, 'source'),
        originalLine: util.getArg(aArgs, 'line'),
        originalColumn: util.getArg(aArgs, 'column')
      };

      if (this.sourceRoot != null) {
        needle.source = util.relative(this.sourceRoot, needle.source);
      }

      var index = this._findMapping(needle,
                                    this._originalMappings,
                                    "originalLine",
                                    "originalColumn",
                                    util.compareByOriginalPositions);

      if (index >= 0) {
        var mapping = this._originalMappings[index];

        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }

      return {
        line: null,
        column: null,
        lastColumn: null
      };
    };

  /**
   * Returns all generated line and column information for the original source
   * and line provided. The only argument is an object with the following
   * properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *
   * and an array of objects is returned, each with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  SourceMapConsumer.prototype.allGeneratedPositionsFor =
    function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      // When there is no exact match, SourceMapConsumer.prototype._findMapping
      // returns the index of the closest mapping less than the needle. By
      // setting needle.originalColumn to Infinity, we thus find the last
      // mapping for the given line, provided such a mapping exists.
      var needle = {
        source: util.getArg(aArgs, 'source'),
        originalLine: util.getArg(aArgs, 'line'),
        originalColumn: Infinity
      };

      if (this.sourceRoot != null) {
        needle.source = util.relative(this.sourceRoot, needle.source);
      }

      var mappings = [];

      var index = this._findMapping(needle,
                                    this._originalMappings,
                                    "originalLine",
                                    "originalColumn",
                                    util.compareByOriginalPositions);
      if (index >= 0) {
        var mapping = this._originalMappings[index];

        while (mapping && mapping.originalLine === needle.originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[--index];
        }
      }

      return mappings.reverse();
    };

  SourceMapConsumer.GENERATED_ORDER = 1;
  SourceMapConsumer.ORIGINAL_ORDER = 2;

  /**
   * Iterate over each mapping between an original source/line/column and a
   * generated line/column in this source map.
   *
   * @param Function aCallback
   *        The function that is called with each mapping.
   * @param Object aContext
   *        Optional. If specified, this object will be the value of `this` every
   *        time that `aCallback` is called.
   * @param aOrder
   *        Either `SourceMapConsumer.GENERATED_ORDER` or
   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
   *        iterate over the mappings sorted by the generated file's line/column
   *        order or the original's source/line/column order, respectively. Defaults to
   *        `SourceMapConsumer.GENERATED_ORDER`.
   */
  SourceMapConsumer.prototype.eachMapping =
    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

      var mappings;
      switch (order) {
      case SourceMapConsumer.GENERATED_ORDER:
        mappings = this._generatedMappings;
        break;
      case SourceMapConsumer.ORIGINAL_ORDER:
        mappings = this._originalMappings;
        break;
      default:
        throw new Error("Unknown order of iteration.");
      }

      var sourceRoot = this.sourceRoot;
      mappings.map(function (mapping) {
        var source = mapping.source;
        if (source != null && sourceRoot != null) {
          source = util.join(sourceRoot, source);
        }
        return {
          source: source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name
        };
      }).forEach(aCallback, context);
    };

  exports.SourceMapConsumer = SourceMapConsumer;

});

},{"./array-set":41,"./base64-vlq":42,"./binary-search":44,"./util":49,"amdefine":50}],47:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64VLQ = require('./base64-vlq');
  var util = require('./util');
  var ArraySet = require('./array-set').ArraySet;
  var MappingList = require('./mapping-list').MappingList;

  /**
   * An instance of the SourceMapGenerator represents a source map which is
   * being built incrementally. You may pass an object with the following
   * properties:
   *
   *   - file: The filename of the generated source.
   *   - sourceRoot: A root for all relative URLs in this source map.
   */
  function SourceMapGenerator(aArgs) {
    if (!aArgs) {
      aArgs = {};
    }
    this._file = util.getArg(aArgs, 'file', null);
    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
    this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
    this._sources = new ArraySet();
    this._names = new ArraySet();
    this._mappings = new MappingList();
    this._sourcesContents = null;
  }

  SourceMapGenerator.prototype._version = 3;

  /**
   * Creates a new SourceMapGenerator based on a SourceMapConsumer
   *
   * @param aSourceMapConsumer The SourceMap.
   */
  SourceMapGenerator.fromSourceMap =
    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot: sourceRoot
      });
      aSourceMapConsumer.eachMapping(function (mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };

        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }

          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };

          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }

        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };

  /**
   * Add a single mapping from original source line and column to the generated
   * source's line and column for this source map being created. The mapping
   * object should have the following properties:
   *
   *   - generated: An object with the generated line and column positions.
   *   - original: An object with the original line and column positions.
   *   - source: The original source file (relative to the sourceRoot).
   *   - name: An optional original token name for this mapping.
   */
  SourceMapGenerator.prototype.addMapping =
    function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, 'generated');
      var original = util.getArg(aArgs, 'original', null);
      var source = util.getArg(aArgs, 'source', null);
      var name = util.getArg(aArgs, 'name', null);

      if (!this._skipValidation) {
        this._validateMapping(generated, original, source, name);
      }

      if (source != null && !this._sources.has(source)) {
        this._sources.add(source);
      }

      if (name != null && !this._names.has(name)) {
        this._names.add(name);
      }

      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source: source,
        name: name
      });
    };

  /**
   * Set the source content for a source file.
   */
  SourceMapGenerator.prototype.setSourceContent =
    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }

      if (aSourceContent != null) {
        // Add the source content to the _sourcesContents map.
        // Create a new _sourcesContents map if the property is null.
        if (!this._sourcesContents) {
          this._sourcesContents = {};
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        // Remove the source file from the _sourcesContents map.
        // If the _sourcesContents map is empty, set the property to null.
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };

  /**
   * Applies the mappings of a sub-source-map for a specific source file to the
   * source map being generated. Each mapping to the supplied source file is
   * rewritten using the supplied source map. Note: The resolution for the
   * resulting mappings is the minimium of this map and the supplied map.
   *
   * @param aSourceMapConsumer The source map to be applied.
   * @param aSourceFile Optional. The filename of the source file.
   *        If omitted, SourceMapConsumer's file property will be used.
   * @param aSourceMapPath Optional. The dirname of the path to the source map
   *        to be applied. If relative, it is relative to the SourceMapConsumer.
   *        This parameter is needed when the two source maps aren't in the same
   *        directory, and the source map to be applied contains relative source
   *        paths. If so, those relative source paths need to be rewritten
   *        relative to the SourceMapGenerator.
   */
  SourceMapGenerator.prototype.applySourceMap =
    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      // If aSourceFile is omitted, we will use the file property of the SourceMap
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
            'or the source map\'s "file" property. Both were omitted.'
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      // Make "sourceFile" relative if an absolute Url is passed.
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      // Applying the SourceMap can add and remove items from the sources and
      // the names array.
      var newSources = new ArraySet();
      var newNames = new ArraySet();

      // Find mappings for the "sourceFile"
      this._mappings.unsortedForEach(function (mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          // Check if it can be mapped by the source map, then update the mapping.
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            // Copy mapping
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source)
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }

        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }

        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }

      }, this);
      this._sources = newSources;
      this._names = newNames;

      // Copy sourcesContents of applied map.
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile = util.join(aSourceMapPath, sourceFile);
          }
          if (sourceRoot != null) {
            sourceFile = util.relative(sourceRoot, sourceFile);
          }
          this.setSourceContent(sourceFile, content);
        }
      }, this);
    };

  /**
   * A mapping can have one of the three levels of data:
   *
   *   1. Just the generated position.
   *   2. The Generated position, original position, and original source.
   *   3. Generated and original position, original source, as well as a name
   *      token.
   *
   * To maintain consistency, we validate that any new mapping being added falls
   * in to one of these categories.
   */
  SourceMapGenerator.prototype._validateMapping =
    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                                aName) {
      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
          && aGenerated.line > 0 && aGenerated.column >= 0
          && !aOriginal && !aSource && !aName) {
        // Case 1.
        return;
      }
      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
               && aGenerated.line > 0 && aGenerated.column >= 0
               && aOriginal.line > 0 && aOriginal.column >= 0
               && aSource) {
        // Cases 2 and 3.
        return;
      }
      else {
        throw new Error('Invalid mapping: ' + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        }));
      }
    };

  /**
   * Serialize the accumulated mappings in to the stream of base 64 VLQs
   * specified by the source map format.
   */
  SourceMapGenerator.prototype._serializeMappings =
    function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = '';
      var mapping;

      var mappings = this._mappings.toArray();

      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];

        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            result += ';';
            previousGeneratedLine++;
          }
        }
        else {
          if (i > 0) {
            if (!util.compareByGeneratedPositions(mapping, mappings[i - 1])) {
              continue;
            }
            result += ',';
          }
        }

        result += base64VLQ.encode(mapping.generatedColumn
                                   - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;

        if (mapping.source != null) {
          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
                                     - previousSource);
          previousSource = this._sources.indexOf(mapping.source);

          // lines are stored 0-based in SourceMap spec version 3
          result += base64VLQ.encode(mapping.originalLine - 1
                                     - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;

          result += base64VLQ.encode(mapping.originalColumn
                                     - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;

          if (mapping.name != null) {
            result += base64VLQ.encode(this._names.indexOf(mapping.name)
                                       - previousName);
            previousName = this._names.indexOf(mapping.name);
          }
        }
      }

      return result;
    };

  SourceMapGenerator.prototype._generateSourcesContent =
    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function (source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
                                                    key)
          ? this._sourcesContents[key]
          : null;
      }, this);
    };

  /**
   * Externalize the source map.
   */
  SourceMapGenerator.prototype.toJSON =
    function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }

      return map;
    };

  /**
   * Render the source map being generated to a string.
   */
  SourceMapGenerator.prototype.toString =
    function SourceMapGenerator_toString() {
      return JSON.stringify(this);
    };

  exports.SourceMapGenerator = SourceMapGenerator;

});

},{"./array-set":41,"./base64-vlq":42,"./mapping-list":45,"./util":49,"amdefine":50}],48:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
  var util = require('./util');

  // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
  // operating systems these days (capturing the result).
  var REGEX_NEWLINE = /(\r?\n)/;

  // Newline character code for charCodeAt() comparisons
  var NEWLINE_CODE = 10;

  // Private symbol for identifying `SourceNode`s when multiple versions of
  // the source-map library are loaded. This MUST NOT CHANGE across
  // versions!
  var isSourceNode = "$$$isSourceNode$$$";

  /**
   * SourceNodes provide a way to abstract over interpolating/concatenating
   * snippets of generated JavaScript source code while maintaining the line and
   * column information associated with the original source code.
   *
   * @param aLine The original line number.
   * @param aColumn The original column number.
   * @param aSource The original source's filename.
   * @param aChunks Optional. An array of strings which are snippets of
   *        generated JS, or other SourceNodes.
   * @param aName The original identifier.
   */
  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine == null ? null : aLine;
    this.column = aColumn == null ? null : aColumn;
    this.source = aSource == null ? null : aSource;
    this.name = aName == null ? null : aName;
    this[isSourceNode] = true;
    if (aChunks != null) this.add(aChunks);
  }

  /**
   * Creates a SourceNode from generated code and a SourceMapConsumer.
   *
   * @param aGeneratedCode The generated code
   * @param aSourceMapConsumer The SourceMap for the generated code
   * @param aRelativePath Optional. The path that relative sources in the
   *        SourceMapConsumer should be relative to.
   */
  SourceNode.fromStringWithSourceMap =
    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      // The SourceNode we want to fill with the generated code
      // and the SourceMap
      var node = new SourceNode();

      // All even indices of this array are one line of the generated code,
      // while all odd indices are the newlines between two adjacent lines
      // (since `REGEX_NEWLINE` captures its match).
      // Processed fragments are removed from this array, by calling `shiftNextLine`.
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var shiftNextLine = function() {
        var lineContents = remainingLines.shift();
        // The last line of a file might not have a newline.
        var newLine = remainingLines.shift() || "";
        return lineContents + newLine;
      };

      // We need to remember the position of "remainingLines"
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;

      // The generate SourceNodes we need a code range.
      // To extract it current and last mapping is used.
      // Here we store the last mapping.
      var lastMapping = null;

      aSourceMapConsumer.eachMapping(function (mapping) {
        if (lastMapping !== null) {
          // We add the code from "lastMapping" to "mapping":
          // First check if there is a new line in between.
          if (lastGeneratedLine < mapping.generatedLine) {
            var code = "";
            // Associate first line with "lastMapping"
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
            // The remaining code is added without mapping
          } else {
            // There is no new line in between.
            // Associate the code between "lastGeneratedColumn" and
            // "mapping.generatedColumn" with "lastMapping"
            var nextLine = remainingLines[0];
            var code = nextLine.substr(0, mapping.generatedColumn -
                                          lastGeneratedColumn);
            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
                                                lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            // No more remaining code, continue
            lastMapping = mapping;
            return;
          }
        }
        // We add the generated code until the first mapping
        // to the SourceNode without any mapping.
        // Each line is added as separate string.
        while (lastGeneratedLine < mapping.generatedLine) {
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[0];
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      // We have processed all mappings.
      if (remainingLines.length > 0) {
        if (lastMapping) {
          // Associate the remaining code in the current line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        // and add the remaining lines without any mapping
        node.add(remainingLines.join(""));
      }

      // Copy sourcesContent into SourceNode
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });

      return node;

      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === undefined) {
          node.add(code);
        } else {
          var source = aRelativePath
            ? util.join(aRelativePath, mapping.source)
            : mapping.source;
          node.add(new SourceNode(mapping.originalLine,
                                  mapping.originalColumn,
                                  source,
                                  code,
                                  mapping.name));
        }
      }
    };

  /**
   * Add a chunk of generated JS to this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.add = function SourceNode_add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function (chunk) {
        this.add(chunk);
      }, this);
    }
    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Add a chunk of generated JS to the beginning of this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (var i = aChunk.length-1; i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    }
    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Walk over the tree of JS snippets in this node and its children. The
   * walking function is called once for each snippet of JS and is passed that
   * snippet and the its original associated source's line/column location.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
    var chunk;
    for (var i = 0, len = this.children.length; i < len; i++) {
      chunk = this.children[i];
      if (chunk[isSourceNode]) {
        chunk.walk(aFn);
      }
      else {
        if (chunk !== '') {
          aFn(chunk, { source: this.source,
                       line: this.line,
                       column: this.column,
                       name: this.name });
        }
      }
    }
  };

  /**
   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
   * each of `this.children`.
   *
   * @param aSep The separator.
   */
  SourceNode.prototype.join = function SourceNode_join(aSep) {
    var newChildren;
    var i;
    var len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0; i < len-1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  };

  /**
   * Call String.prototype.replace on the very right-most source snippet. Useful
   * for trimming whitespace from the end of a source node, etc.
   *
   * @param aPattern The pattern to replace.
   * @param aReplacement The thing to replace the pattern with.
   */
  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
    var lastChild = this.children[this.children.length - 1];
    if (lastChild[isSourceNode]) {
      lastChild.replaceRight(aPattern, aReplacement);
    }
    else if (typeof lastChild === 'string') {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    }
    else {
      this.children.push(''.replace(aPattern, aReplacement));
    }
    return this;
  };

  /**
   * Set the source content for a source file. This will be added to the SourceMapGenerator
   * in the sourcesContent field.
   *
   * @param aSourceFile The filename of the source file
   * @param aSourceContent The content of the source file
   */
  SourceNode.prototype.setSourceContent =
    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };

  /**
   * Walk over the tree of SourceNodes. The walking function is called for each
   * source file content and is passed the filename and source content.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walkSourceContents =
    function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }

      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };

  /**
   * Return the string representation of this source node. Walks over the tree
   * and concatenates all the various snippets together to one string.
   */
  SourceNode.prototype.toString = function SourceNode_toString() {
    var str = "";
    this.walk(function (chunk) {
      str += chunk;
    });
    return str;
  };

  /**
   * Returns the string representation of this source node along with a source
   * map.
   */
  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
    var generated = {
      code: "",
      line: 1,
      column: 0
    };
    var map = new SourceMapGenerator(aArgs);
    var sourceMappingActive = false;
    var lastOriginalSource = null;
    var lastOriginalLine = null;
    var lastOriginalColumn = null;
    var lastOriginalName = null;
    this.walk(function (chunk, original) {
      generated.code += chunk;
      if (original.source !== null
          && original.line !== null
          && original.column !== null) {
        if(lastOriginalSource !== original.source
           || lastOriginalLine !== original.line
           || lastOriginalColumn !== original.column
           || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      for (var idx = 0, length = chunk.length; idx < length; idx++) {
        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
          generated.line++;
          generated.column = 0;
          // Mappings end at eol
          if (idx + 1 === length) {
            lastOriginalSource = null;
            sourceMappingActive = false;
          } else if (sourceMappingActive) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
        } else {
          generated.column++;
        }
      }
    });
    this.walkSourceContents(function (sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });

    return { code: generated.code, map: map };
  };

  exports.SourceNode = SourceNode;

});

},{"./source-map-generator":47,"./util":49,"amdefine":50}],49:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  /**
   * This is a helper function for getting values from parameter/options
   * objects.
   *
   * @param args The object we are extracting values from
   * @param name The name of the property we are getting.
   * @param defaultValue An optional value to return if the property is missing
   * from the object. If this is not specified and the property is missing, an
   * error will be thrown.
   */
  function getArg(aArgs, aName, aDefaultValue) {
    if (aName in aArgs) {
      return aArgs[aName];
    } else if (arguments.length === 3) {
      return aDefaultValue;
    } else {
      throw new Error('"' + aName + '" is a required argument.');
    }
  }
  exports.getArg = getArg;

  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
  var dataUrlRegexp = /^data:.+\,.+$/;

  function urlParse(aUrl) {
    var match = aUrl.match(urlRegexp);
    if (!match) {
      return null;
    }
    return {
      scheme: match[1],
      auth: match[2],
      host: match[3],
      port: match[4],
      path: match[5]
    };
  }
  exports.urlParse = urlParse;

  function urlGenerate(aParsedUrl) {
    var url = '';
    if (aParsedUrl.scheme) {
      url += aParsedUrl.scheme + ':';
    }
    url += '//';
    if (aParsedUrl.auth) {
      url += aParsedUrl.auth + '@';
    }
    if (aParsedUrl.host) {
      url += aParsedUrl.host;
    }
    if (aParsedUrl.port) {
      url += ":" + aParsedUrl.port
    }
    if (aParsedUrl.path) {
      url += aParsedUrl.path;
    }
    return url;
  }
  exports.urlGenerate = urlGenerate;

  /**
   * Normalizes a path, or the path portion of a URL:
   *
   * - Replaces consequtive slashes with one slash.
   * - Removes unnecessary '.' parts.
   * - Removes unnecessary '<dir>/..' parts.
   *
   * Based on code in the Node.js 'path' core module.
   *
   * @param aPath The path or url to normalize.
   */
  function normalize(aPath) {
    var path = aPath;
    var url = urlParse(aPath);
    if (url) {
      if (!url.path) {
        return aPath;
      }
      path = url.path;
    }
    var isAbsolute = (path.charAt(0) === '/');

    var parts = path.split(/\/+/);
    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
      part = parts[i];
      if (part === '.') {
        parts.splice(i, 1);
      } else if (part === '..') {
        up++;
      } else if (up > 0) {
        if (part === '') {
          // The first part is blank if the path is absolute. Trying to go
          // above the root is a no-op. Therefore we can remove all '..' parts
          // directly after the root.
          parts.splice(i + 1, up);
          up = 0;
        } else {
          parts.splice(i, 2);
          up--;
        }
      }
    }
    path = parts.join('/');

    if (path === '') {
      path = isAbsolute ? '/' : '.';
    }

    if (url) {
      url.path = path;
      return urlGenerate(url);
    }
    return path;
  }
  exports.normalize = normalize;

  /**
   * Joins two paths/URLs.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be joined with the root.
   *
   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
   *   first.
   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
   *   is updated with the result and aRoot is returned. Otherwise the result
   *   is returned.
   *   - If aPath is absolute, the result is aPath.
   *   - Otherwise the two paths are joined with a slash.
   * - Joining for example 'http://' and 'www.example.com' is also supported.
   */
  function join(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }
    if (aPath === "") {
      aPath = ".";
    }
    var aPathUrl = urlParse(aPath);
    var aRootUrl = urlParse(aRoot);
    if (aRootUrl) {
      aRoot = aRootUrl.path || '/';
    }

    // `join(foo, '//www.example.org')`
    if (aPathUrl && !aPathUrl.scheme) {
      if (aRootUrl) {
        aPathUrl.scheme = aRootUrl.scheme;
      }
      return urlGenerate(aPathUrl);
    }

    if (aPathUrl || aPath.match(dataUrlRegexp)) {
      return aPath;
    }

    // `join('http://', 'www.example.com')`
    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
      aRootUrl.host = aPath;
      return urlGenerate(aRootUrl);
    }

    var joined = aPath.charAt(0) === '/'
      ? aPath
      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

    if (aRootUrl) {
      aRootUrl.path = joined;
      return urlGenerate(aRootUrl);
    }
    return joined;
  }
  exports.join = join;

  /**
   * Make a path relative to a URL or another path.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be made relative to aRoot.
   */
  function relative(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }

    aRoot = aRoot.replace(/\/$/, '');

    // XXX: It is possible to remove this block, and the tests still pass!
    var url = urlParse(aRoot);
    if (aPath.charAt(0) == "/" && url && url.path == "/") {
      return aPath.slice(1);
    }

    return aPath.indexOf(aRoot + '/') === 0
      ? aPath.substr(aRoot.length + 1)
      : aPath;
  }
  exports.relative = relative;

  /**
   * Because behavior goes wacky when you set `__proto__` on objects, we
   * have to prefix all the strings in our set with an arbitrary character.
   *
   * See https://github.com/mozilla/source-map/pull/31 and
   * https://github.com/mozilla/source-map/issues/30
   *
   * @param String aStr
   */
  function toSetString(aStr) {
    return '$' + aStr;
  }
  exports.toSetString = toSetString;

  function fromSetString(aStr) {
    return aStr.substr(1);
  }
  exports.fromSetString = fromSetString;

  function strcmp(aStr1, aStr2) {
    var s1 = aStr1 || "";
    var s2 = aStr2 || "";
    return (s1 > s2) - (s1 < s2);
  }

  /**
   * Comparator between two mappings where the original positions are compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same original source/line/column, but different generated
   * line and column the same. Useful when searching for a mapping with a
   * stubbed out mapping.
   */
  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
    var cmp;

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp || onlyCompareOriginal) {
      return cmp;
    }

    cmp = strcmp(mappingA.name, mappingB.name);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp) {
      return cmp;
    }

    return mappingA.generatedColumn - mappingB.generatedColumn;
  };
  exports.compareByOriginalPositions = compareByOriginalPositions;

  /**
   * Comparator between two mappings where the generated positions are
   * compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same generated line and column, but different
   * source/name/original line and column the same. Useful when searching for a
   * mapping with a stubbed out mapping.
   */
  function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
    var cmp;

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp || onlyCompareGenerated) {
      return cmp;
    }

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp) {
      return cmp;
    }

    return strcmp(mappingA.name, mappingB.name);
  };
  exports.compareByGeneratedPositions = compareByGeneratedPositions;

});

},{"amdefine":50}],50:[function(require,module,exports){
(function (process,__filename){
/** vim: et:ts=4:sw=4:sts=4
 * @license amdefine 0.1.0 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/amdefine for details
 */

/*jslint node: true */
/*global module, process */
'use strict';

/**
 * Creates a define for node.
 * @param {Object} module the "module" object that is defined by Node for the
 * current module.
 * @param {Function} [requireFn]. Node's require function for the current module.
 * It only needs to be passed in Node versions before 0.5, when module.require
 * did not exist.
 * @returns {Function} a define function that is usable for the current node
 * module.
 */
function amdefine(module, requireFn) {
    'use strict';
    var defineCache = {},
        loaderCache = {},
        alreadyCalled = false,
        path = require('path'),
        makeRequire, stringRequire;

    /**
     * Trims the . and .. from an array of path segments.
     * It will keep a leading path segment if a .. will become
     * the first path segment, to help with module name lookups,
     * which act like paths, but can be remapped. But the end result,
     * all paths that use this function should look normalized.
     * NOTE: this method MODIFIES the input array.
     * @param {Array} ary the array of path segments.
     */
    function trimDots(ary) {
        var i, part;
        for (i = 0; ary[i]; i+= 1) {
            part = ary[i];
            if (part === '.') {
                ary.splice(i, 1);
                i -= 1;
            } else if (part === '..') {
                if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                    //End of the line. Keep at least one non-dot
                    //path segment at the front so it can be mapped
                    //correctly to disk. Otherwise, there is likely
                    //no path mapping for a path starting with '..'.
                    //This can still fail, but catches the most reasonable
                    //uses of ..
                    break;
                } else if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                }
            }
        }
    }

    function normalize(name, baseName) {
        var baseParts;

        //Adjust any relative paths.
        if (name && name.charAt(0) === '.') {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                baseParts = baseName.split('/');
                baseParts = baseParts.slice(0, baseParts.length - 1);
                baseParts = baseParts.concat(name.split('/'));
                trimDots(baseParts);
                name = baseParts.join('/');
            }
        }

        return name;
    }

    /**
     * Create the normalize() function passed to a loader plugin's
     * normalize method.
     */
    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(id) {
        function load(value) {
            loaderCache[id] = value;
        }

        load.fromText = function (id, text) {
            //This one is difficult because the text can/probably uses
            //define, and any relative paths and requires should be relative
            //to that id was it would be found on disk. But this would require
            //bootstrapping a module/require fairly deeply from node core.
            //Not sure how best to go about that yet.
            throw new Error('amdefine does not implement load.fromText');
        };

        return load;
    }

    makeRequire = function (systemRequire, exports, module, relId) {
        function amdRequire(deps, callback) {
            if (typeof deps === 'string') {
                //Synchronous, single module require('')
                return stringRequire(systemRequire, exports, module, deps, relId);
            } else {
                //Array of dependencies with a callback.

                //Convert the dependencies to modules.
                deps = deps.map(function (depName) {
                    return stringRequire(systemRequire, exports, module, depName, relId);
                });

                //Wait for next tick to call back the require call.
                process.nextTick(function () {
                    callback.apply(null, deps);
                });
            }
        }

        amdRequire.toUrl = function (filePath) {
            if (filePath.indexOf('.') === 0) {
                return normalize(filePath, path.dirname(module.filename));
            } else {
                return filePath;
            }
        };

        return amdRequire;
    };

    //Favor explicit value, passed in if the module wants to support Node 0.4.
    requireFn = requireFn || function req() {
        return module.require.apply(module, arguments);
    };

    function runFactory(id, deps, factory) {
        var r, e, m, result;

        if (id) {
            e = loaderCache[id] = {};
            m = {
                id: id,
                uri: __filename,
                exports: e
            };
            r = makeRequire(requireFn, e, m, id);
        } else {
            //Only support one define call per file
            if (alreadyCalled) {
                throw new Error('amdefine with no module ID cannot be called more than once per file.');
            }
            alreadyCalled = true;

            //Use the real variables from node
            //Use module.exports for exports, since
            //the exports in here is amdefine exports.
            e = module.exports;
            m = module;
            r = makeRequire(requireFn, e, m, module.id);
        }

        //If there are dependencies, they are strings, so need
        //to convert them to dependency values.
        if (deps) {
            deps = deps.map(function (depName) {
                return r(depName);
            });
        }

        //Call the factory with the right dependencies.
        if (typeof factory === 'function') {
            result = factory.apply(m.exports, deps);
        } else {
            result = factory;
        }

        if (result !== undefined) {
            m.exports = result;
            if (id) {
                loaderCache[id] = m.exports;
            }
        }
    }

    stringRequire = function (systemRequire, exports, module, id, relId) {
        //Split the ID by a ! so that
        var index = id.indexOf('!'),
            originalId = id,
            prefix, plugin;

        if (index === -1) {
            id = normalize(id, relId);

            //Straight module lookup. If it is one of the special dependencies,
            //deal with it, otherwise, delegate to node.
            if (id === 'require') {
                return makeRequire(systemRequire, exports, module, relId);
            } else if (id === 'exports') {
                return exports;
            } else if (id === 'module') {
                return module;
            } else if (loaderCache.hasOwnProperty(id)) {
                return loaderCache[id];
            } else if (defineCache[id]) {
                runFactory.apply(null, defineCache[id]);
                return loaderCache[id];
            } else {
                if(systemRequire) {
                    return systemRequire(originalId);
                } else {
                    throw new Error('No module with ID: ' + id);
                }
            }
        } else {
            //There is a plugin in play.
            prefix = id.substring(0, index);
            id = id.substring(index + 1, id.length);

            plugin = stringRequire(systemRequire, exports, module, prefix, relId);

            if (plugin.normalize) {
                id = plugin.normalize(id, makeNormalize(relId));
            } else {
                //Normalize the ID normally.
                id = normalize(id, relId);
            }

            if (loaderCache[id]) {
                return loaderCache[id];
            } else {
                plugin.load(id, makeRequire(systemRequire, exports, module, relId), makeLoad(id), {});

                return loaderCache[id];
            }
        }
    };

    //Create a define function specific to the module asking for amdefine.
    function define(id, deps, factory) {
        if (Array.isArray(id)) {
            factory = deps;
            deps = id;
            id = undefined;
        } else if (typeof id !== 'string') {
            factory = id;
            id = deps = undefined;
        }

        if (deps && !Array.isArray(deps)) {
            factory = deps;
            deps = undefined;
        }

        if (!deps) {
            deps = ['require', 'exports', 'module'];
        }

        //Set up properties for this module. If an ID, then use
        //internal cache. If no ID, then use the external variables
        //for this node module.
        if (id) {
            //Put the module in deep freeze until there is a
            //require call for it.
            defineCache[id] = [id, deps, factory];
        } else {
            runFactory(id, deps, factory);
        }
    }

    //define.require, which has access to all the values in the
    //cache. Useful for AMD modules that all have IDs in the file,
    //but need to finally export a value to node based on one of those
    //IDs.
    define.require = function (id) {
        if (loaderCache[id]) {
            return loaderCache[id];
        }

        if (defineCache[id]) {
            runFactory.apply(null, defineCache[id]);
            return loaderCache[id];
        }
    };

    define.amd = {};

    return define;
}

module.exports = amdefine;

}).call(this,require('_process'),"/node_modules/handlebars/node_modules/source-map/node_modules/amdefine/amdefine.js")
},{"_process":20,"path":19}],51:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2], true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(this.smartypants(cap[0]));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/--/g, '\u2014')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
  return html.replace(/&([#\w]+);/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],52:[function(require,module,exports){
(function (Buffer){

// numbers don't really matter, just don't change them!
module.exports = [
  {
    id: 8,
    title: "Coming out of the debt closet",
    date: "2015-01-13 15:29",
    categories: ["story", "debt", "personal"],
    text: Buffer("SSd2ZSBjb21lIG91dCBvZiB0aGUgY2xvc2V0IGJlZm9yZSwgYW5kIEknbSBnb2luZyB0byBkbyBpdCBhZ2Fpbi4KCkkgcGFpZCBteSBzdHVkZW50IGxvYW4gcGF5bWVudCB0b2RheS4gKDIwIHllYXJzIGFnbyB0aGF0IHdvdWxkIGJlICdJIGtpc3NlZCBhIGdpcmwgdG9kYXknIDtwKQoKSSdtIDI0IHllYXJzIG9sZCBhbmQgbXkgZGVidCBpcyAkNzUsODE3LjgxLiBUaGUgaW50ZXJlc3QgcmF0ZXMgb24gbXkgNiBsb2FucyB2YXJ5IGJldHdlZW4gNC41JSBhbmQgMTElLiBNeSB0b3RhbCBtaW5pbXVtIHBheW1lbnRzIGhvdmVyIHNvbWV3aGVyZSBhcm91bmQgJDQwMCBvciAkNTAwIGEgbW9udGguCgojIyBDYWxjdWxhdG9yCkhlcmUncyB3aGF0IGhhcHBlbmVkIHdoZW4gSSBwdXQgaW4gbXkgd29yc3QgbG9hbiBpbnRvIGFuIG9ubGluZQpkZWJ0IGNhbGN1bGF0b3IuIEZvciBqdXN0IG9uZSBvZiBteSBOYXZpZW50IChmb3JtZXJseSBTYWxsaWUgTWFlKSBsb2FucywgdGhlCnByaW5jaXBhbCBiYWxhbmNlIGlzICQzMywwMDAgKEkgdGhpbmsgdGhpcyB3YXMgbXkgZnJlc2htYW4geWVhciAtLSByb29tK2JvYXJkK3R1aXRpb24pLiBJZiBJIGp1c3QgcGF5IHRoZSBtaW5pbXVtIHBheW1lbnQsIHdoaWNoIGlzIGFib3V0CiQxNTkvbW9udGgsIEkgd29uJ3QgYmUgZGVidCBmcmVlLCBldmVyLgoKCiFbbXlkZWJ0MV0oL2ltYWdlcy9ibG9nL215ZGVidDEucG5nKQoKS2VlcCBpbiBtaW5kIHRoYXQgdGhpcyBpcyBqdXN0IGFib3V0IGhhbGYgb2YgdGhlIHRvdGFsCnRoYXQgSSBvd2UsIHNvIHRoZSBwcm9zcGVjdHMgYXJlIHN1cmVseSB3b3JzZSBmb3IgdGhlIGZ1bGwgYW1vdW50LiBUaGUgcmVhbGl0eQppcyB0aGF0IG1vc3QgcGVvcGxlIGRvbid0IG1ha2UgYXMgbXVjaCBtb25leSBhcyBJIGRvLiBNb3N0IHBlb3BsZSBjYW4gb25seSBwYXkKdGhlIG1pbmltdW0gcGF5bWVudCwgb3IgY2FuJ3QgcGF5IGF0IGFsbC4gWzEzLjcgcGVyY2VudCBvZiBzdHVkZW50IGRlYnRvcnMgYXJlCmluIGRlZmF1bHQgKGhhdmVuJ3QgcGFpZCBhIHNpbmdsZSBwYXltZW50IGluIDMKeWVhcnMpXShodHRwOi8vd3d3LnRpY2FzLm9yZy9maWxlcy9wdWIvL0NEUl8yMDE0X05SLnBkZikgYW5kIGl0IGlzIHJpc2luZy4KVGhlcmUncyBubyB3YXkgdG8gZXJhc2Ugc3R1ZGVudCBsb2FucyAodmlhIGJhbmtydXB0Y3ksIGZvciBleGFtcGxlKSwgYmVjYXVzZQplZmZlY3RpdmVseSB5b3UndmUgYWdyZWVkIHRvIG1vcnRnYWdlIHlvdXIgbWluZC4gQW5kIHRob3NlIHdobyBjYW4ndCBwYXkgd2lsbApoYXZlIHRoZWlyIHdhZ2VzIGdhcm5pc2hlZCBpZiB0aGV5IGNhbid0IGdldCBvbiBpbmNvbWUgYmFzZWQgcmVwYXltZW50IGluIHRpbWUuCgpJJ20gb25lIG9mIHRoZSBmZXcgImx1Y2t5IG9uZXMiIHdobyB3aWxsIGJlIGFibGUgdG8gcGF5IG9mZiB0aGlzIG1vbnN0cm9zaXR5LgoKVGhhbmtmdWxseSwgSSBoYXZlIGEgKGN1cnJlbnRseSkgbHVjcmF0aXZlIHNraWxsc2V0IGluIGNvbXB1dGVyIHByb2dyYW1taW5nLAptYWtpbmcgbWUgZm9ydHVuYXRlIGVub3VnaCB0byBtYWtlIGFib3V0ICQyayBhIG1vbnRoIGFmdGVyIHRheGVzLCBoZWFsdGhjYXJlLApmb29kLCBhbmQgcmVudC4gIEknbSBhYmxlIHRvIHBheSBtb3JlIHRoYW4gdGhlIG1pbmltdW0gbW9udGhseSBwYXltZW50cyAtLSBhbmQKaWYgSSBjb250aW51ZSBkb2luZyB0aGF0LCBJJ2xsIGJlIGRlYnQgZnJlZSBiZWZvcmUgSSdtIDQwLgoKUGF5aW5nIG9mZiBteSBkZWJ0IG1lYW5zIEknZCBoYXZlIHRvIGNvbnRpbnVlIG1ha2luZyBhcyBtdWNoIG1vbmV5IGFzIEkgZG8gZm9yCnRoZSBuZXh0IDE1IHllYXJzLiBCdXQgaWYgaXQgd2FzIGEgcGVyZmVjdCB3b3JsZCwgSSdkIGxpa2UgdG8gdGFrZSBhIHBheSBjdXQgYXQKc29tZSBwb2ludCB0byBkbyBzb21ldGhpbmcgZGlmZmVyZW50LiBUZWFjaGluZywgbXVzaWMsIHJlc2VhcmNoLCBjb21tdW5pdHkgb3JnYW5pemluZywgYW5kIHByby1ib25vIHRlY2gKd29yayAtLSBhbGwgb2YgdGhlc2Ugc2VydmljZXMgbWFrZSBvdXIgc29jaWV0eSBhIG5pY2VyIHBsYWNlIGFuZCBtYWtlIG1lIGZlZWwgYmV0dGVyCmFib3V0IG15IHBsYWNlIGluIGl0IC0tIGJ1dCB0aGV5IGRvbid0IHBheSB2ZXJ5IHdlbGwuICBJIHdvdWxkbid0IGJlIGFibGUgdG8gcGF5IG9mZiB0aGUgZGVidCBpZiBJIG1ham9yZWQgaW4gc29tZXRoaW5nIGVsc2Ugb3IKY2hhbmdlZCBjYXJlZXJzIHJpZ2h0IG5vdywgYmVjYXVzZSB0aGV5IGp1c3QgZG9uJ3QgcGF5IHdlbGwgZW5vdWdoLiAgSSdkIGJlCnBheWluZyBvbiB0aGUgbWluaW11bSBwYXltZW50IGZvciBzbyBsb25nIHRoYXQgdGhlIGludGVyZXN0IHdvdWxkIHJhY2sgdXAuCgpNb3N0IHBlb3BsZSBpbiBteSBnZW5lcmF0aW9uIGFyZSBpbiB0aGlzIHNpdHVhdGlvbi4gVGhleSBjYW4ndCBldmVuIHBheSB0aGUgbWluaW11bSBwYXltZW50LCBsZXQKYWxvbmUgdGhlIGRvdWJsZSBvciB0cmlwbGUgaXQgd2lsbCByZXF1aXJlIHRvIGJlIHRydWx5IGRlYnQgZnJlZS4gSXQgaXMgbm8Kc3VycHJpc2UsIHRoZW4sIHRoYXQgbXkgZ2VuZXJhdGlvbiAobWlsbGVuaWFscykgW2Rvbid0IHNhdmUgYQpwZW5ueV0oaHR0cDovL21vbmV5LmNubi5jb20vMjAxNC8xMS8xMC9wZi9taWxsZW5uaWFscy1uZWdhdGl2ZS1zYXZpbmdzLyksCltkb24ndCBvd24KY2Fyc10oaHR0cDovL3d3dy53YXNoaW5ndG9ucG9zdC5jb20vYmxvZ3Mvd29ua2Jsb2cvd3AvMjAxNC8xMC8xNC90aGUtbWFueS1yZWFzb25zLW1pbGxlbm5pYWxzLWFyZS1zaHVubmluZy1jYXJzLyksCmFuZCBbYXJlbid0IGJ1eWluZyBob21lc10oaHR0cDovL3d3dy5jbmJjLmNvbS9pZC8xMDIyNTI3ODkpIChhbGwgYXJ0aWNsZXMgd3JpdHRlbgppbiB0aGUgbGFzdCAzIG1vbnRocyBvZiAyMDE0KS4KCklmIHdlIGFsbCBqdXN0IHBheSB0aGUgbWluaW11bSBwYXltZW50LCB3ZSBhcmUgdHJhcHBlZCBpbiBhIG5ldmVyLWVuZGluZyBkZWJ0CnNwaXJhbC4gIFRoaXMgYnJpbmdzIHVwIGEgdG91Z2ggcXVlc3Rpb24gZm9yIG15IGdlbmVyYXRpb24gLS0gdGhlIGdlbmVyYXRpb24gb2YKc3R1ZGVudCBkZWJ0b3JzLiBXaGF0IGRvZXMgb3VyIG1vbmV0YXJ5IGZyZWVkb20gbG9vayBsaWtlPyBXaWxsIHdlIGV2ZXIgYmUgZnJlZQpvZiBkZWJ0PyBPciBhcmUgd2Ugc2ltcGx5IHVuZGVyIGluZGVudHVyZWQgc2Vydml0dWRlIHRvIG91ciBsZW5kZXJzPwoKSW4gZmFjdCwgSSB0aGluayB0aGF0IGluZGVudHVyZWQgc2Vydml0dWRlIGlzICoqZXhhY3RseSoqIHdoYXQgdGhlIGxlbmRlcnMgd2FudC4KCiMjIFRoZSBsb2FuIG5hcnJhdGl2ZQpUaGUgcG9wdWxhciBuYXJyYXRpdmUgb2YgYSBsb2FuIGlzIHRoYXQgeW91J3JlIGJvcnJvd2luZwpzb21lIG1vbmV5IHRoYXQgdGhlIG90aGVyIHBlcnNvbiBuZWVkZWQsIHRoYXQgeW91IGFyZSBhIGJ1cmRlbiBvbnRvIHRoZW0sIGFuZAphcyBzdWNoIGl0IGlzIG9wdGltYWwgdG8gcGF5IGJhY2sgdGhlIGJhbGFuY2UgYXMgcXVpY2tseSBhcyBwb3NzaWJsZS4KCkJ1dCBjb250cmFyeSB0byB0aGlzIG5hcnJhdGl2ZSwgc29tZSBsZW5kZXJzIGRvbid0IHdhbnQgeW91IHRvIHBheSBvZmYgeW91ciBkZWJ0LiBUaGV5J2QKcmF0aGVyIGNvbGxlY3QgaW50ZXJlc3Qgb24geW91ciBtaW5pbXVtIHBheW1lbnQgZm9yZXZlci4gIFRoZSBjb3Jwb3JhdGlvbnMgdGhhdApjYW4gYWZmb3JkIHRvIGhhdmUgdGhpcyBtZW50YWxpdHkgYXJlIHZlcnkgcG93ZXJmdWwuIFRoZXkgaGF2ZQp0aGVpciBbY29ycnVwdGVkIGZpbmdlcnMgaW4gb3VyCmdvdmVybm1lbnRdKGh0dHA6Ly93d3cubnByLm9yZy8yMDE0LzA5LzI2LzM1MTUyMDAzNy9mb3JtZXItZmVkLWJhbmstZXhhbWluZXItc2F5cy1zZWNyZXQtdGFwZXMtc2hvdy1mZWQtbGVuaWVuY3kpCltpbiB0b28gbWFueSBwbGFjZXMgdG8KY291bnRdKGh0dHA6Ly93d3cud3N3cy5vcmcvZW4vYXJ0aWNsZXMvMjAxNC8wNy8xMi9jb3JpLWoxMi5odG1sKSwgYW5kIGVhZ2VybHkKdGFrZSBhZHZhbnRhZ2Ugb2YgeW91bmcgZWFnZXIgbWluZHMsIGxvdy1pbmNvbWUgY29tbXVuaXRpZXMsIHBlb3BsZSBvZiBjb2xvciwgZGlzYWJsZWQgZm9saywgYW5kCnZldGVyYW5zLCBhbGwgb2Ygd2hvbSBqdXN0IHdhbnRlZCB0byBnZXQgYWhlYWQgaW4gbGlmZS4KClRoZXNlIGNvcnBvcmF0aW9ucyBhcmUgZGFuZ2Vyb3VzIHRvIHRoZSBmYWJyaWMgb2Ygb3VyCnNvY2lldHkgLSB0byBvdXIgZWNvbm9teSwgdG8gb3VyIHN0YW5kYXJkIG9mIGxpdmluZywgYW5kIHRvIG91ciBoZWFsdGggYXMgYSBjb21tdW5pdHkuCgojIyBObyBtb3JlIGRlYnQgc2Vydml0dWRlCgpJcyBpdCBkZWJ0IHNlcnZpdHVkZSB0byBvZmZlciB5b3VyIG1vbmV5IGVuZGxlc3NseSB0byBhIGNvcnBvcmF0aW9uIHdpdGgKaW50ZXJlc3QgcmF0ZXMgc28gaGlnaCB0aGF0IHlvdSBoYXZlIG5vIGhvcGUgb2YgZXZlciBwYXlpbmcgaXQgYmFjaz8gT3IgaXMgaXQKZGVidCBzZXJ2aXR1ZGUgdG8gb2ZmZXIgdGhlIGZydWl0cyBvZiB5b3VyIGxhYm9yIHRvIGRvIHNvbWV0aGluZyBvciB0byBzb21ld2hlcmUgeW91IGhhdGUsCmp1c3Qgc28geW91ciBkZWJ0IHdpbGwgZXZlbnR1YWxseSBiZSBnb25lPwoKSSB3YW50IG5laXRoZXIuIEkgZG9uJ3Qgd2FudCB0byBwYXkgaXQgYW55bW9yZS4gSSdtIHRpcmVkIG9mIGJlaW5nIHNjYXJlZCBhbmQgYWxvbmUgYWJvdXQgdGhlCnByb3NwZWN0IHRoYXQgSSBtYXkgbmV2ZXIgcGF5IG9mZiBteSBkZWJ0LiBJJ20gdGlyZWQgb2YgaXQgYmVpbmcgYWx3YXlzIGluIHRoZQpiYWNrIG9mIG15IG1pbmQsIGEgcmVhc29uIEkgZG9uJ3QgZG8gdGhpbmdzIEkgZW5qb3ksIG9yIGEgcmVhc29uIEknbSBzdHJlc3NlZApvdXQgYWJvdXQgdGhlIGZ1dHVyZS4KCkV2ZW4gdGhvdWdoIEkgZG9uJ3Qgd2FudCB0bywgSSdtIHN0aWxsIHBheWluZyBteSBkZWJ0IGZvciBub3cuCgpQZW9wbGUgYXJlIHRyeWluZyB0byBjb21lIHVwIHdpdGggc29sdXRpb25zLCB0aG91Z2ggaXQgaXMgdG91Z2ggY29uc2lkZXJpbmcgdGhlIHBvd2VyIG9mIHRoZXNlIGxhcmdlIGJhbmtzLiBIZXJlIGFyZSBzb21lIGlkZWFzOgoKICAtIFthIG5pY2Ugc291bmRpbmcgYnV0IGZhaWx1cmUtcHJvbmUgZGVidCBmb3JnaXZlbmVzcyBwcm9ncmFtXShodHRwOi8vd3d3Lm5hdGlvbmFsam91cm5hbC5jb20vbmV4dC1hbWVyaWNhL2VkdWNhdGlvbi90aGUtcHJvYmxlbS13aXRoLXN0dWRlbnQtbG9hbi1mb3JnaXZlbmVzcy0yMDE0MDQyMSkKICAtIHJlZmluYW5jaW5nLCBlbmRsZXNzbHkgKG5vdCByZWFsbHkgZmVhc2libGUgd2l0aCBsYXJnZSBhbW91bnRzIG9mIGRlYnQpCiAgLSBbY29vcGVyYXRpdmUgY2hlY2sgY2FzaGluZyBmb3Igd2hlbiB5b3VyIHdhZ2VzIGFyZSBnYXJuaXNoZWRdKGh0dHBzOi8vd3d3LmNjYS5lZHUvbmV3cy8yMDA5L2NvbW1vbi1jZW50cy1jY2Etc3R1ZGVudHMtdGFrZS1wcmVkYXRvcnktbGVuZGluZy1vYWtsYW5kKQogIC0gW2RlYnQgY29sbGVjdGl2ZXNdKGh0dHA6Ly9kZWJ0Y29sbGVjdGl2ZS5vcmcpCgpJbiBhbGwgb2YgdGhlc2Ugc29sdXRpb25zLCBwZW9wbGUgcG9vbCB0aGVpciBtb25leSBhbmQgcmVzb3VyY2VzIHRvZ2V0aGVyIGluCnNvbWUgd2F5LiBJdCBpcyBiZWNvbWluZyBtb3JlIGNsZWFyIHRoYXQKcmV0aGlua2luZyBsZW5kaW5nIGNvdWxkIGJlIGEga2V5IHRvcGljIGZvciBjb21tdW5pdGllcyBpbiB0aGUgMjFzdCBjZW50dXJ5LgoKRG8gd2UgcmVhbGx5IG5lZWQgYSBsb2FuIGZvciBhIGNhciBvcgpob3VzZSBvciBlZHVjYXRpb24/IEFyZSB0aGVyZSBvdGhlciB3YXlzIHRvIHByb3ZpZGUgdGhlc2Ugc2VydmljZXMgd2l0aG91dCBnZXR0aW5nIGEKbGFyZ2UgYmFuayBpbnZvbHZlZD8gSSBkb24ndCBoYXZlIGEgZ29sZGVuIGFuc3dlciwgYnV0IGl0cyBzb21ldGhpbmcgSSdtIHRoaW5raW5nIGFib3V0LgoKIyMgU28sIHdoYXQncyB5b3VyIHN0b3J5PwpJZiB5b3UgZmVlbCBsaWtlIHNoYXJpbmcsIHBsZWFzZSBkby4gUG9zdCBvciBsaW5rIHRvIHlvdXIgc3RvcnkgaW4gdGhlIGNvbW1lbnRzLgoKCgoKCg==","base64").toString(),
    disqus: "blog/2015/01/13/coming-out-of-the-debt-closet/"
  },
  {
    id: 7,
    title: "No cages.",
    date: "2014-02-17 13:33",
    categories: ["life"],
    text: Buffer("IkEgZmF0IGJpcmQgaW4gYSBjYWdlIHNob3VsZCBiZSBoYXBweSwgcGVvcGxlIHNheS4gQnV0IHdoZW4gdGhlIGNhZ2UgZG9vciBvcGVucywgaXQgd2lsbCByZWFsaXplIHdoYXQncyBiZWVuIG1pc3NpbmcuIiAtIGEgZnJpZW5kCgpBdCB0aGUgZW5kIG9mIGxhc3QgeWVhciwgSSBnb3QgYSBqb2Igb2ZmZXIgZnJvbSBHb29nbGUgYXMgYSBzb2Z0d2FyZSBlbmdpbmVlci4gSSB0b29rIGl0LiBHb29nbGUgaXMgdGhlIGRyZWFtIGpvYiB0aGF0IGV2ZXJ5b25lIHdhbnRzLCByaWdodD8gTXkgZnJpZW5kcyB0b2xkIG1lIGlmIEkgd2FzIHVuaGFwcHkgYXQgbXkgbGFzdCBqb2IsIEkganVzdCBuZWVkIHRvIGdvLiBCdWlsZCBteSByZXN1bWUuCgpTbyBJIGRpZC4gSSB3ZW50LiBJIHF1aXQgbXkgam9iIGluIEF1c3RpbiBhbmQgZmxldyB0byBTYW4gRnJhbmNpc2NvLCBDQS4gSSBzdGFydGVkIHRvIHNldHRsZSBpbiwgYnV0IGFsc28gYmVnYW4gdG8gcmVtZW1iZXIgdGhhdCBzdW1tZXIgb2YgMjAxMS4gSSBmaW5hbGx5IHJlYWxpemVkOiBJIGhhZCB3YWxrZWQgZGlyZWN0bHkgaW50byB0aGUgdGhpbmcgdGhhdCBJIGF2b2lkZWQgd2hlbiBJIHR1cm5lZCBkb3duIHRoZSBvZmZlcnMgZnJvbSBNaWNyb3NvZnQgYW5kIEFtYXpvbi4gVHdvIGRheXMgYmVmb3JlIEkgc3RhcnRlZCBteSBqb2IsIEkgZ290IGFuIGVtYWlsIGZyb20gbXkgcmVjcnVpdGVyIGFuZCBhIHN1YnNlcXVlbnQgcGhvbmUgY2FsbCBmcm9tIGEgR29vZ2xlIGludGVybmFsIGxhd3llciB0aGF0IHNhaWQgSSB3b3VsZCB2aW9sYXRlIHRoZSBjb2RlIG9mIGNvbmR1Y3QgaWYgSSBjb250aW51ZWQgd29ya2luZyBvbiBhIHNpZGUgcHJvamVjdCBJIHZlcnkgbXVjaCBjYXJlZCBhYm91dCBjYWxsZWQgUGFwZXJ0YWxrLiBUaGlzIHNpZGUgcHJvamVjdCBpcyBhIG5vbi1wcm9maXQgb3Blbi1zb3VyY2Ugd2Vic2l0ZSBmb3IgZGlzY3Vzc2luZyBzY2llbnRpZmljIGFydGljbGVzIGFuZCB0b3BpY3MuIFRoaXMgcHJvamVjdCBpcyBzb21ldGhpbmcgSSd2ZSBiZWVuIHBhc3Npb25hdGUgYWJvdXQsIGV4Y2l0ZWQgYWJvdXQsIGFuZCBvYnNlc3Npbmcgb3ZlciBmb3Igb3ZlciA0IG1vbnRocyAtLSBpdCBnaXZlcyBiYWNrIHRvIHRoZSBjb21tdW5pdHkgaW4gc29tZSBvZiB0aGUgb25seSB3YXlzIHRoYXQgSSBjYW4sIHRocm91Z2ggY29kZSBhbmQgY29tbXVuaWNhdGlvbi4gRm9yIEdvb2dsZSB0byB0ZWxsIG1lIEkgY291bGRuJ3Qgd29yayBvbiBpdCBhY3R1YWxseSBpc24ndCB0aGF0IHN1cnByaXNpbmcgaW4gcmV0cm9zcGVjdCwgYnV0IEkgZGlkbid0IHJlYWxpemUgaG93IGhhcmQgaXQgd291bGQgaGl0IG1lLiBIb3cgbXVjaCBJIGNhcmVkIGFib3V0IGl0IGFuZCB3aGF0IGl0IG1lYW5zIHRvICJnaXZlIGJhY2siIHRvIHRoZSBjb21tdW5pdHkuIFRoZXJlIGlzIGEgaG9sZSBoZXJlLCBpbiBteSBoZWFydCwgYW5kIGl0J3MgZ2V0dGluZyBiaWdnZXIgdGhlIGxvbmdlciBJIHN0YXkuCgpJJ20gbW9yZSBvZiBhIGRyZWFtZXIgdGhhbiBhIGhhY2tlciwgYW5kIEkgbmVlZCB0byBlbWJyYWNlIHRoaXMgcGFydCBvZiBteSBsaWZlLiBJIGFtIHN0YXJ0aW5nIGEgam9iIGFzIHNvZnR3YXJlIGVuZ2luZWVyIGFuZCBwcm9kdWN0IGV2YW5nZWxpc3QgYXQgRGF0YXBhZC5pbzsgcHVyc3VpbmcgbXkgcGFzc2lvbiBmb3Igb3BlbiBzY2llbnRpZmljIGRpc2N1c3Npb25zIHdpdGggUGFwZXJ0YWxrLm9yZzsgYW5kIGJlY29taW5nIGEgY29udHJpYnV0aW5nIGVkaXRvciB0byBhIG5ldyBibG9nIGZvciB0ZWNoIHByb2Zlc3Npb25hbHMuCgpNeSBuZXcgam9iIGF0IERhdGFwYWQgd2lsbCBiZSBhIGdvb2QgZXhwZXJpZW5jZSBmb3IgbWUgdG8gZ3JvdyBza2lsbHMgSSB3YW50IHRvIG1hc3RlcjoKCiogcHVibGljIHNwZWFraW5nIGFuZCB3cml0aW5nOwoqIHByb2R1Y3QgZGVtb25zdHJhdGlvbiBhbmQgdGVhY2hpbmc7CiogdGVjaG5pY2FsIGFuZCBub24tdGVjaG5pY2FsIHJlY3J1aXRtZW50OwoqIGNvbXBhbnkvcHJvamVjdCBncm93dGg7CiogLi4uYW5kIGNvbnRpbnVpbmcgdG8gc3RheSBmcmVzaCBieSBjb250cmlidXRpbmcgZGlyZWN0bHkgdG8gdGhlIHByb2R1Y3QuCgoKVGhpcyBkZXNpcmUgdG8gImdpdmUgYmFjayIgdG8gdGhlIGNvbW11bml0eSBleHRlbmRzIGZhciBiZXlvbmQganVzdCBQYXBlcnRhbGsuCk15IGRlc2lyZSB0byBjb250aW51ZSBncmFkIHNjaG9vbCBhdCBzb21lIHBvaW50IHN0aWxsIHN0YXlzIHdpdGggbWUgZXZlcnkgZGF5LAphbmQgSSBiZWxpZXZlIHRoZSBhYm92ZSBza2lsbHMgd2lsbCBoZWxwIG1lIGluIHRoYXQgZW5kZWF2b3IgYXMgd2VsbC4gSSBkaWQgbm90CmV4cGVjdCBtdWNoIGZyb20gR29vZ2xlIGV4Y2VwdCBhIHN0ZWFkeSBwYXljaGVjaywgc29tZSBzb2Z0d2FyZSBlbmdpbmVlcmluZwptYWludGVuYW5jZSBleHBlcmllbmNlLCBhbmQgc29tZSBpbnNpZGVyIGluZm9ybWF0aW9uIHRoYXQgSSBhbSBub3QgYWxsb3dlZCB0bwp0YWxrIGFib3V0LiBXaGF0IEkgZGlkbid0IHJlYWxpemUgaXMgaG93IG11Y2ggaXQnZCBtYWtlIG1lIGZlZWwgc2FkLCB0cmFwcGVkLAphbmQgYWxvbmUuIEknZCByYXRoZXIgdGFrZSBhIHJpc2sgb24gYSBzbWFsbCBncm91cCB0aGF0IHBsYW5zIHRvIHJlYWxseSBpbXByb3ZlCnRlY2hub2xvZ3kgaW4gYSBtdWNoLW5lZWRlZCBhcmVhIHRoYW4gaW5jcmVhc2Ugc2hhcmVob2xkZXIgdmFsdWUgYXQgYW4gYWxyZWFkeQpidXN0bGluZyBjb21wYW55LCBmZWVsaW5nIGxpa2UgYSBjb2cgaW4gdGhlIG1hY2hpbmUuIEdvb2dsZSB3aWxsIGJlIGZpbmUKd2l0aG91dCBtZS4gT25lIGRheSBJIG1heSBzZWUgbXlzZWxmIGF0IGEgYmlnIGNvbXBhbnkgbGlrZSBHb29nbGUgaW4gUiZELCBidXQKdGhhdCBpcyBhIHdoaWxlIGF3YXkuCgpJIHdpbGwgbm8gbG9uZ2VyIHdvcmsgZm9yIGEgbGFyZ2UgZW50aXR5IHRoYXQgZG9lc24ndCByZXNwZWN0IG15IGF1dG9ub215Lgo=","base64").toString()
  },
  {
    id: 6,
    title: "Where no Google bus commentary goes",
    date: "2013-12-23 03:56",
    categories: ["movements", "politics", "opinion", "urban planning"],
    text: Buffer("V2l0aCBpbmNvbWUgaW5lcXVhbGl0eSBhbmQgYmFkIHRyYW5zaXQsIHdlIGNhbid0IGxpdmUgdG9nZXRoZXIuIFNvbWUgb2YgdXMgYXJlIGhhdmluZyBhIHRvdWdoIHRpbWUgbGl2aW5nIGF0IGFsbC4KCkluIGEgcmVjZW50IGFydGljbGUgb24gUHVlYmxvIExhbmRzLCB0aGUgYXV0aG9yIHNwZW5kcyBzb21lIHRpbWUgb3V0bGluaW5nIHRoZQpsZXNzZXIga25vd24gY2l0aWVzIG9mIFJpY2htb25kIGFuZCBTYW4gUGFibG8uIEFtaWQgYWxsIG9mIHRoZSBodWJidWIgYWJvdXQgdGhlCkdvb2dsZSBidXMgcHJvdGVzdHMgaW4gW1NhbgpGcmFuY2lzY29dKGh0dHA6Ly93d3cucmV1dGVycy5jb20vYXJ0aWNsZS8yMDEzLzEyLzIwL3VzLXRlY2hidXMtcHJvdGVzdC1zYW5mcmFuY2lzY28taWRVU0JSRTlCSjFCQzIwMTMxMjIwKQphbmQKW09ha2xhbmRdKGh0dHA6Ly93d3cudGhldmVyZ2UuY29tLzIwMTMvMTIvMjAvNTIzMTc1OC9wcm90ZXN0ZXJzLXRhcmdldC1zaWxpY29uLXZhbGxleS1zaHV0dGxlcy1zbWFzaC1nb29nbGUtYnVzLXdpbmRvdykKKHdoaWNoIHdlcmUgdmFyaWVkIHRhY3RpY2FsbHkgYnkgcmVnaW9uLCBpbnRlcmVzdGluZyBmb3IgYSBzb2Npb2xvZ2lzdCksIHRoaXMKcGllY2UgIDwhLS0gbW9yZSAtLT4gc2hlZHMgbGlnaHQgb24gdGhlIGluY29tZSBkaXNwYXJpdGllcyB0aGF0IHBlb3BsZSBhcmVuJ3QgdGFsa2luZyBhYm91dC4gVGhlIGF1dGhvcgpwYXJ0aWN1bGFybHkgZm9jdXNlcyBvbiBob3cgdGhlc2UgY29tbXVuaXRpZXMgaGF2ZSBnb3R0ZW4gd29yc2Ugc2luY2UgdGhlCmZpbmFuY2lhbCBjcmlzaXMuIFlvdSBjYW4gcmVhZCB0aGUgYXJ0aWNsZQpbaGVyZS5dKGh0dHA6Ly9kYXJ3aW5ib25kZ3JhaGFtLndvcmRwcmVzcy5jb20vMjAxMy8xMi8yMS93aGVyZS1uby1nb29nbGUtYnVzZXMtZ28vKQoKCk9uZSB0aGluZyBtaXNzaW5nIGZyb20gdGhpcyBwaWVjZSBpcyBhbnl0aGluZyBjbG9zZSB0byBhIGNhbGwgdG8gYWN0aW9uLCBhCnBsYW4sIG9yIGV2ZW4gYSBzdW1tYXRpb24gb2YgaWRlYXMgdG8gaGVhZCB0aGVyZS4gQWxsIEkgZ290IHdhcyBhIGhvcGVsZXNzbHkgc21hbGwgcGFyYWdyYXBoIGF0IHRoZSBlbmQKdGhhdCBpZGVudGlmaWVzIG9uZSBwYXJ0IG9mIHRoZSBjYXVzZToKCj4gUGVyaGFwcyBoZXJlIEkgc2hvdWxkIGNvbmNsdWRlIGJ5IGFkZGluZyB0aGF0IEdvb2dsZSBhbHNvIGNsYWltcyBhICQxMzAKPiBtaWxsaW9uIENhbGlmb3JuaWEgcmVzZWFyY2ggYW5kIGRldmVsb3BtZW50IHRheCBjcmVkaXQgd2hpY2ggd2lsbAo+IGNhcnJ5LWZvcndhcmQgaW5kZWZpbml0ZWx5IGFuZCBhbGxvd3MgdGhlIGNvbXBhbnkgdG8gd2hpdHRsZSBkb3duIHRoZSB0YXhlcwo+IGl0IG93ZXMgdG8gU2FjcmFtZW50byBmb3IgbWFueSB5ZWFycyB0byBjb21lLiBUYXggcG9saWNpZXMgdGhhdCBmYXZvciB0aGUKPiB3ZWFsdGh5IGFuZCBsYXJnZSBjb3Jwb3JhdGlvbnMsIGFmdGVyIGFsbCwgYXJlIHBhcnQgb2YgdGhlIGNhdXNlIG9mIGdyb3dpbmcKPiBpbmVxdWFsaXR5IGluIEFtZXJpY2EgdG9kYXkuCgpUaGUgdHJ1dGggaXMsIHRoZXJlIGlzIHZhc3QsIGRlc3RhYmlsaXppbmcgaW5jb21lIGluZXF1YWxpdHkgYW5kIHNlcGFyYXRpb24gYnkKcmFjZSBhbmQgY2xhc3MgaW4gbW9zdCBiaWcgQW1lcmljYW4gY2l0aWVzIChldmVuIG15IGFsbWEgbWF0ZXIgQmxvb21pbmd0b24sIElOLApbd2hpY2ggcmFua2VkClwjMV0oaHR0cDovL2luZGlhbmFwdWJsaWNtZWRpYS5vcmcvbmV3cy9ibG9vbWluZ3Rvbi11bmVxdWFsLWNpdHktYmFzZWQtY2Vuc3VzLWRhdGEtMjM2MzQvKQpqdXN0IGFoZWFkIG9mIEF0bGFudGEpLgoKVGhlIG9ubHkgcmVhc29uIHBlb3BsZSBhcmUgZm9jdXNpbmcgb24gaXQgaW4gdGhlIEJheSBpcyBiZWNhdXNlIHRlY2ggaW5kdXN0cnkgaXMKYm9vbWluZyBhbmQgdGhlIHB1YmxpYyB0cmFuc2l0IGlzIGJhZCwgY3JlYXRpbmcgYSBtYWduaWZ5aW5nIGdsYXNzIGZvciBpdCAoTlkKaGFkIHRoaXMgcHJvYmxlbSBiZWZvcmUgU0YpLiAgQnkgc3Vic2lkaXppbmcgY29ycG9yYXRpb25zLCB0aGUgZ292ZXJubWVudAppbmNlbnRpdml6ZXMgdGhlbSB0byBzdGF5IGluIHRoZSByZWdpb24sIGdldCB0YXhlZCwgYW5kIGVtcGxveSBwZW9wbGUuIEJ1dCB3aGVuCmRvZXMgaXQgc3RvcD8gV2hlbiBkbyB3ZSBkZWNpZGUgdGhhdCB0aGVzZSB0YXggYnJlYWtzIGFyZSBhY3R1YWxseSBkb2luZyBtb3JlCmhhcm0gdGhhbiBnb29kIGJ5IGluY2VudGl2aXppbmcgdGhlIGluZHVzdHJ5IHRvIHN0YXkgaW4gdGhlIGFyZWE/CgpUaGUgdHJhZmZpYyBoZXJlIGlzIGluc2FuZS4gUHVibGljIHRyYW5zcG9ydGF0aW9uIGlzIGFnaW5nLCBpbmFkZXF1YXRlLCBhbmQKZXhwZW5zaXZlLiBUaGUgQmF5IEFyZWEgaXMgcGFja2VkIGZ1bGwgb2YgcGVvcGxlLCBhbmQgdGhleSBhbGwgbmVlZCBhIGNhciB0bwpnZXQgYXJvdW5kIChleGNlcHQgU0YvRWFzdCBCYXkpLgoKSSB3b24ndCBiZSB0aGUgZmlyc3Qgb3IgdGhlIGxhc3QgdG8gc2F5IGl0IC0tIFNpbGljb24gVmFsbGV5IHN1Y2tzIGFzIGEgcGxhY2UKdG8gbGl2ZSwgd29yaywgYW5kIHBsYXkuIEZvcmdldCBkcml2aW5nIGluIFNpbGljb24gVmFsbGV5IDdhbS0xMGFtIGFuZCA0LTc6MzBwbS4KRXhwZWN0IHRvIGRyaXZlIGF0IDVtcGguICBbVGhlIHRyYWZmaWMgaXMgbGl0ZXJhbGx5IGtpbGxpbmcgYWxsIG9mCnlvdS5dKGh0dHA6Ly93d3cuc2xhdGUuY29tL2FydGljbGVzL2J1c2luZXNzL21vbmV5Ym94LzIwMTEvMDUveW91cl9jb21tdXRlX2lzX2tpbGxpbmdfeW91Lmh0bWwpClNpbGljb24gVmFsbGV5IGNvdWxkIHJlYWxseSB1c2UgYmV0dGVyIHB1YmxpYyB0cmFuc3BvcnRhdGlvbiBhbmQgbW9yZSBtaXhlZAppbmNvbWUgbmVpZ2hib3Job29kcy4KCkltcG9ydGFudGx5LCBob3cgZG9lcyB0aGUgZWNvbm9teSBleHBlY3QgbG93IGluY29tZSB3b3JrZXJzIHRvIHdvcmsgaW4gYSBwbGFjZQp0aGV5IGNhbm5vdCBhZmZvcmQgdG8gbGl2ZT8gV2hhdCBoYXBwZW5zIHdoZW4gdGhlIGdhcyBwcmljZXMgZ28gdXAgdG9vIGZhcj8gIE9yIHRoZXkgY2FuJ3QKYWZmb3JkIHRvIG1haW50YWluIHRoZWlyIGNhcnM/IFRoZWlyIHBheWNoZWNrIGlzIGdvbmUuIFtBbmQgYXBwcm94aW1hdGVseSAzOCUKb2YgdGhlIHBvcHVsYXRpb24gaXMgbGl2aW5nIHBheWNoZWNrIHRvCnBheWNoZWNrXShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1BvdmVydHlfaW5fdGhlX1VuaXRlZF9TdGF0ZXMpLiBJdCdzCmEgZHlzZnVuY3Rpb25hbCBpbmZyYXN0cnVjdHVyZSwganVzdCB3YWl0aW5nIHRvIGNvbGxhcHNlIHVuZGVyIGEgbGFjayBvZiBzdHJ1Y3R1cmFsIGludGVncml0eS4KCldoYXQgZG8geW91IHRoaW5rIHdlIHNob3VsZCBkbz8gIFNob3VsZCB3ZSBiZSB0dXJuaW5nIG91ciBhdHRlbnRpb24gdG93YXJkIHRoZSBnb29nbGUgYnVzc2VzIG9yCnRoZSBjb3Jwb3JhdGUgYm9zc2VzIG9yIHRoZSBwb2xpdGljaWFucyBvciBvdXJzZWx2ZXM/IFdoYXQgc2hvdWxkIHdlIGRlbWFuZD8KClRoZSBHb29nbGUgYnVzIHByb3Rlc3RzIGRpZCB0aGVpciBqb2IgYnkgYnJpbmdpbmcgYXR0ZW50aW9uIHRvIHRoaXMgbWF0dGVyLCBhbmQKbm93IHdlIGFyZSBoYXZpbmcgYSBwdWJsaWMgY29udmVyc2F0aW9uLiAgTGV0J3MgZmluZCBlYWNob3RoZXIgYW5kIG1vdmUgZm9yd2FyZAp3aXRoIHNvbWUgc2hvcnQgYW5kIGxvbmctdGVybSBwcm9wb3NhbHMuICBJJ20gaW50ZXJlc3RlZCBpbgpoZWFyaW5nIHdoYXQgeW91IGhhdmUgdG8gc2F5LgoKCg==","base64").toString()
  },
  {
    id: 5,
    title: "Two weeks in Austin",
    date: "2013-09-28 18:13",
    categories: ['personal', 'social', 'observations'],
    text: Buffer("V2UgaGF2ZSByZWNlaXZlZCBhIGxvdCBvZiBwcmVzcyBmb3Igb3VyIHBhcGVyOiBbIk1vcmUgVHdlZXRzLCBNb3JlIFZvdGVzOgpTb2NpYWwgTWVkaWEgYXMgYSBRdWFudGl0YXRpdmUgSW5kaWNhdG9yIG9mIFBvbGl0aWNhbApCZWhhdmlvci4iXShodHRwOi8vcGFwZXJzLnNzcm4uY29tL3NvbDMvcGFwZXJzLmNmbT9hYnN0cmFjdF9pZD0yMjM1NDIzKQo8IS0tIG1vcmUgLS0+CiogW05QUl0oaHR0cDovL3d3dy5ucHIub3JnL3RlbXBsYXRlcy9zdG9yeS9zdG9yeS5waHA/c3RvcnlJZD0yMTE0MzQyNzQpCiogW1dhbGwgU3RyZWV0IEpvdXJuYWxdKGh0dHA6Ly9ibG9ncy53c2ouY29tL3dhc2h3aXJlLzIwMTMvMDgvMTIvcmVzZWFyY2hlcnMtZmluZC10d2VldHMtYW5kLXZvdGVzLWxpbmUtdXAvKQoqIFtDLVNQQU5dKGh0dHA6Ly93d3cuYy1zcGFudmlkZW8ub3JnL3Byb2dyYW0vUm9qKQoqIFtNU05CQydzIERhaWx5IFJ1bmRvd25dKGh0dHA6Ly93d3cubmJjbmV3cy5jb20vaWQvNDkyNjMzNjIjNTI3NzIzNzEpCiogW1BPTElUSUNPXShodHRwOi8vd3d3LnBvbGl0aWNvLmNvbS9zdG9yeS8yMDEzLzA4L3R3aXR0ZXItdm90ZXMtZWxlY3Rpb25zLTk1NTQxLmh0bWwpCiogW1dhc2hpbmd0b24gUG9zdF0oaHR0cDovL3d3dy53YXNoaW5ndG9ucG9zdC5jb20vb3BpbmlvbnMvaG93LXR3aXR0ZXItY2FuLXByZWRpY3QtYW4tZWxlY3Rpb24vMjAxMy8wOC8xMS8zNWVmODg1YS0wMTA4LTExZTMtOTZhOC1kM2I5MjFjMDkyNGFfc3RvcnkuaHRtbCkKKiBbTmF0aW9uYWwgSm91cm5hbF0oaHR0cDovL3d3dy5uYXRpb25hbGpvdXJuYWwuY29tL2RhaWx5L3R3ZWV0cy1jYW4tZm9yZXRlbGwtdm90ZXMtc3R1ZHktZmluZHMtMjAxMzA4MTIpCjwhLS0gbW9yZS0tPgoqIFtTYWxvbl0oaHR0cDovL3d3dy5zYWxvbi5jb20vMjAxMy8wOC8xMi9mb3JfcG9saXRpY2FsX2NhbmRpZGF0ZXNfYWxsX3R3aXR0ZXJfcHVibGljaXR5X2lzX2dvb2RfcHVibGljaXR5X25ld3NjcmVkLykKKiBbVGVjaHByZXNpZGVudF0oaHR0cDovL3RlY2hwcmVzaWRlbnQuY29tL25ld3MvMjM3ODQvY2FuLXR3ZWV0cy1wcmVkaWN0LXZvdGUpCiogW05leHRnb3ZdKGh0dHA6Ly93d3cubmV4dGdvdi5jb20vYmlnLWRhdGEvMjAxMy8wOC9zdHVkeS10d2VldHMtY2FuLWZvcmV0ZWxsLXZvdGVzLzY4NTk3LykKKiBbVGltZXMgb2YgSW5kaWFdKGh0dHA6Ly9hcnRpY2xlcy50aW1lc29maW5kaWEuaW5kaWF0aW1lcy5jb20vMjAxMy0wOC0xMi9zb2NpYWwtbWVkaWEvNDEzMzE4OTZfMV90d2VldHMtZGVtb2NyYXRpYy1jYW5kaWRhdGVzLW1vcmUtdm90ZXMpCiogW05ld3Nyb29tIEFtZXJpY2FdKGh0dHA6Ly93d3cubmV3c3Jvb21hbWVyaWNhLmNvbS9zdG9yeS8zODA2ODkvbW9yZV90d2VldHNfbWVhbnNfbW9yZV92b3Rlc19mb3JfcG9saXRpY2FsX2NhbmRpZGF0ZXNfc3R1ZHlfLmh0bWwpCiogW2UhIFNjaWVuY2UgbmV3c10oaHR0cDovL2VzY2llbmNlbmV3cy5jb20vYXJ0aWNsZXMvMjAxMy8wOC8xMS9zdHVkeS5maW5kcy5tb3JlLnR3ZWV0cy5tZWFucy5tb3JlLnZvdGVzLnBvbGl0aWNhbC5jYW5kaWRhdGVzKQoqIFtQb3BzY2ldKGh0dHA6Ly93d3cucG9wc2NpLmNvbS9zY2llbmNlL2FydGljbGUvMjAxMy0wOC9wb2xpdGljYWwtY2FuZGlkYXRlcy10d2l0dGVyLWFsbC10d2VldHMtYXJlLWdvb2QtdHdlZXRzKQoqIFtTbGFzaGRvdF0oaHR0cDovL3NsYXNoZG90Lm9yZy9zdG9yeS8xMy8wOC8xNC8xMzQ5MjA5L3R3aXR0ZXItYnV6ei1hcy1hbi1lbGVjdGlvbi1wcmVkaWN0b3IpCiogW1NjaWVuY2UgRGFpbHldKGh0dHA6Ly93d3cuc2NpZW5jZWRhaWx5LmNvbS9yZWxlYXNlcy8yMDEzLzA4LzEzMDgxMTAwNTMzMy5odG0pCiogW0V1cmVrYWxlcnRdKGh0dHA6Ly93d3cuZXVyZWthbGVydC5vcmcvcHViX3JlbGVhc2VzLzIwMTMtMDgvYXNhLXNmbTA4MDYxMy5waHApCiogW0Vjb25vbWljIFRpbWVzXShodHRwOi8vZWNvbm9taWN0aW1lcy5pbmRpYXRpbWVzLmNvbS90ZWNoL2ludGVybmV0L21vcmUtdHdlZXRzLW1lYW4tbW9yZS12b3Rlcy1mb3ItcG9saXRpY2FsLWNhbmRpZGF0ZXMtc3R1ZHkvYXJ0aWNsZXNob3cvMjE3Nzk0NDMuY21zKQoqIFtSZWQgT3JiaXRdKGh0dHA6Ly93d3cucmVkb3JiaXQuY29tL25ld3MvcG9saXRpY3MvMTExMjkyMTAxNy9zdHVkeS1maW5kcy1tb3JlLXR3ZWV0cy1tZWFuLW1vcmUtdm90ZXMtZm9yLXBvbGl0aWNhbC1jYW5kaWRhdGVzLykKKiBbTW9uZXkgQ29udHJvbF0oaHR0cDovL3d3dy5tb25leWNvbnRyb2wuY29tL25ld3MvY3VycmVudC1hZmZhaXJzL21vcmUtdHdlZXRzLW1lYW4tbW9yZS12b3Rlcy1mb3ItcG9saXRpY2FsLWNhbmRpZGF0ZXNfOTMzNzYxLmh0bWwpCiogW1NjaWVuY2UgTmV3cyBMaW5lXShodHRwOi8vd3d3LnNjaWVuY2VuZXdzbGluZS5jb20vc3VtbWFyeS8yMDEzMDgxMjEzNTQwMDA4Lmh0bWwpCgpUaGlzIHdhcyBhIHdoaXJsd2luZCByZXNwb25zZS4gSSBrbmV3IHRoaXMgd2FzIGdvaW5nIHRvIGJlIGJpZywgYnV0IEkgZGlkbid0CnJlYWxseSBleHBlY3QgdGhpcyBraW5kIG9mIGF0dGVudGlvbiBhbmQgdmlyYWxpdHkuIFRoZXJlIGFyZSBzb21lIGdsYXJpbmcKbWlzdGFrZXMgaW4gc29tZSBvZiB0aGUgcmVwb3J0aW5nLCBhcyB3ZWxsIGFzIHBsZW50eSBvZiBleGFnZXJhdGlvbnMuIFRoaXMKZXhwZXJpZW5jZSBnaXZlcyBtZSBtb3JlIGNhdXRpb24gd2hlbiBzdWJtaXR0aW5nIHRoaW5ncyB0byBwcmVzcyByZWxlYXNlcywgYW5kCnRvIGJlIGNhcmVmdWwgYWJvdXQgd2hhdCB5b3UgcHVibGlzaCB0byBtYWtlIHN1cmUgaXQgaXMgMTAwJSBjb3JyZWN0LgoKQSBmZXcgbW9udGhzIGFnbywgd2UgdHJpZWQgdG8gc3VibWl0IHRoaXMgcGFwZXIgdG8gU2NpZW5jZSBhbmQgTmF0dXJlIGJlZm9yZQpQbG9zT25lLCBidXQgcmVjZWl2ZWQgZGVzayByZWplY3Rpb25zLiBJIHdvbmRlciBpZiB0aGV5J2Qgd2FudCBpdCBub3c/Cg==","base64").toString()
  },
  {
    id: 4,
    title: "Coverage of More Tweets, More Votes",
    date: "2013-08-12 16:14",
    categories: ["news", "research"],
    text: Buffer("V2UgaGF2ZSByZWNlaXZlZCBhIGxvdCBvZiBwcmVzcyBmb3Igb3VyIHBhcGVyOiBbIk1vcmUgVHdlZXRzLCBNb3JlIFZvdGVzOgpTb2NpYWwgTWVkaWEgYXMgYSBRdWFudGl0YXRpdmUgSW5kaWNhdG9yIG9mIFBvbGl0aWNhbApCZWhhdmlvci4iXShodHRwOi8vcGFwZXJzLnNzcm4uY29tL3NvbDMvcGFwZXJzLmNmbT9hYnN0cmFjdF9pZD0yMjM1NDIzKQo8IS0tIG1vcmUgLS0+CiogW05QUl0oaHR0cDovL3d3dy5ucHIub3JnL3RlbXBsYXRlcy9zdG9yeS9zdG9yeS5waHA/c3RvcnlJZD0yMTE0MzQyNzQpCiogW1dhbGwgU3RyZWV0IEpvdXJuYWxdKGh0dHA6Ly9ibG9ncy53c2ouY29tL3dhc2h3aXJlLzIwMTMvMDgvMTIvcmVzZWFyY2hlcnMtZmluZC10d2VldHMtYW5kLXZvdGVzLWxpbmUtdXAvKQoqIFtDLVNQQU5dKGh0dHA6Ly93d3cuYy1zcGFudmlkZW8ub3JnL3Byb2dyYW0vUm9qKQoqIFtNU05CQydzIERhaWx5IFJ1bmRvd25dKGh0dHA6Ly93d3cubmJjbmV3cy5jb20vaWQvNDkyNjMzNjIjNTI3NzIzNzEpCiogW1BPTElUSUNPXShodHRwOi8vd3d3LnBvbGl0aWNvLmNvbS9zdG9yeS8yMDEzLzA4L3R3aXR0ZXItdm90ZXMtZWxlY3Rpb25zLTk1NTQxLmh0bWwpCiogW1dhc2hpbmd0b24gUG9zdF0oaHR0cDovL3d3dy53YXNoaW5ndG9ucG9zdC5jb20vb3BpbmlvbnMvaG93LXR3aXR0ZXItY2FuLXByZWRpY3QtYW4tZWxlY3Rpb24vMjAxMy8wOC8xMS8zNWVmODg1YS0wMTA4LTExZTMtOTZhOC1kM2I5MjFjMDkyNGFfc3RvcnkuaHRtbCkKKiBbTmF0aW9uYWwgSm91cm5hbF0oaHR0cDovL3d3dy5uYXRpb25hbGpvdXJuYWwuY29tL2RhaWx5L3R3ZWV0cy1jYW4tZm9yZXRlbGwtdm90ZXMtc3R1ZHktZmluZHMtMjAxMzA4MTIpCjwhLS0gbW9yZS0tPgoqIFtTYWxvbl0oaHR0cDovL3d3dy5zYWxvbi5jb20vMjAxMy8wOC8xMi9mb3JfcG9saXRpY2FsX2NhbmRpZGF0ZXNfYWxsX3R3aXR0ZXJfcHVibGljaXR5X2lzX2dvb2RfcHVibGljaXR5X25ld3NjcmVkLykKKiBbVGVjaHByZXNpZGVudF0oaHR0cDovL3RlY2hwcmVzaWRlbnQuY29tL25ld3MvMjM3ODQvY2FuLXR3ZWV0cy1wcmVkaWN0LXZvdGUpCiogW05leHRnb3ZdKGh0dHA6Ly93d3cubmV4dGdvdi5jb20vYmlnLWRhdGEvMjAxMy8wOC9zdHVkeS10d2VldHMtY2FuLWZvcmV0ZWxsLXZvdGVzLzY4NTk3LykKKiBbVGltZXMgb2YgSW5kaWFdKGh0dHA6Ly9hcnRpY2xlcy50aW1lc29maW5kaWEuaW5kaWF0aW1lcy5jb20vMjAxMy0wOC0xMi9zb2NpYWwtbWVkaWEvNDEzMzE4OTZfMV90d2VldHMtZGVtb2NyYXRpYy1jYW5kaWRhdGVzLW1vcmUtdm90ZXMpCiogW05ld3Nyb29tIEFtZXJpY2FdKGh0dHA6Ly93d3cubmV3c3Jvb21hbWVyaWNhLmNvbS9zdG9yeS8zODA2ODkvbW9yZV90d2VldHNfbWVhbnNfbW9yZV92b3Rlc19mb3JfcG9saXRpY2FsX2NhbmRpZGF0ZXNfc3R1ZHlfLmh0bWwpCiogW2UhIFNjaWVuY2UgbmV3c10oaHR0cDovL2VzY2llbmNlbmV3cy5jb20vYXJ0aWNsZXMvMjAxMy8wOC8xMS9zdHVkeS5maW5kcy5tb3JlLnR3ZWV0cy5tZWFucy5tb3JlLnZvdGVzLnBvbGl0aWNhbC5jYW5kaWRhdGVzKQoqIFtQb3BzY2ldKGh0dHA6Ly93d3cucG9wc2NpLmNvbS9zY2llbmNlL2FydGljbGUvMjAxMy0wOC9wb2xpdGljYWwtY2FuZGlkYXRlcy10d2l0dGVyLWFsbC10d2VldHMtYXJlLWdvb2QtdHdlZXRzKQoqIFtTbGFzaGRvdF0oaHR0cDovL3NsYXNoZG90Lm9yZy9zdG9yeS8xMy8wOC8xNC8xMzQ5MjA5L3R3aXR0ZXItYnV6ei1hcy1hbi1lbGVjdGlvbi1wcmVkaWN0b3IpCiogW1NjaWVuY2UgRGFpbHldKGh0dHA6Ly93d3cuc2NpZW5jZWRhaWx5LmNvbS9yZWxlYXNlcy8yMDEzLzA4LzEzMDgxMTAwNTMzMy5odG0pCiogW0V1cmVrYWxlcnRdKGh0dHA6Ly93d3cuZXVyZWthbGVydC5vcmcvcHViX3JlbGVhc2VzLzIwMTMtMDgvYXNhLXNmbTA4MDYxMy5waHApCiogW0Vjb25vbWljIFRpbWVzXShodHRwOi8vZWNvbm9taWN0aW1lcy5pbmRpYXRpbWVzLmNvbS90ZWNoL2ludGVybmV0L21vcmUtdHdlZXRzLW1lYW4tbW9yZS12b3Rlcy1mb3ItcG9saXRpY2FsLWNhbmRpZGF0ZXMtc3R1ZHkvYXJ0aWNsZXNob3cvMjE3Nzk0NDMuY21zKQoqIFtSZWQgT3JiaXRdKGh0dHA6Ly93d3cucmVkb3JiaXQuY29tL25ld3MvcG9saXRpY3MvMTExMjkyMTAxNy9zdHVkeS1maW5kcy1tb3JlLXR3ZWV0cy1tZWFuLW1vcmUtdm90ZXMtZm9yLXBvbGl0aWNhbC1jYW5kaWRhdGVzLykKKiBbTW9uZXkgQ29udHJvbF0oaHR0cDovL3d3dy5tb25leWNvbnRyb2wuY29tL25ld3MvY3VycmVudC1hZmZhaXJzL21vcmUtdHdlZXRzLW1lYW4tbW9yZS12b3Rlcy1mb3ItcG9saXRpY2FsLWNhbmRpZGF0ZXNfOTMzNzYxLmh0bWwpCiogW1NjaWVuY2UgTmV3cyBMaW5lXShodHRwOi8vd3d3LnNjaWVuY2VuZXdzbGluZS5jb20vc3VtbWFyeS8yMDEzMDgxMjEzNTQwMDA4Lmh0bWwpCgpUaGlzIHdhcyBhIHdoaXJsd2luZCByZXNwb25zZS4gSSBrbmV3IHRoaXMgd2FzIGdvaW5nIHRvIGJlIGJpZywgYnV0IEkgZGlkbid0CnJlYWxseSBleHBlY3QgdGhpcyBraW5kIG9mIGF0dGVudGlvbiBhbmQgdmlyYWxpdHkuIFRoZXJlIGFyZSBzb21lIGdsYXJpbmcKbWlzdGFrZXMgaW4gc29tZSBvZiB0aGUgcmVwb3J0aW5nLCBhcyB3ZWxsIGFzIHBsZW50eSBvZiBleGFnZXJhdGlvbnMuIFRoaXMKZXhwZXJpZW5jZSBnaXZlcyBtZSBtb3JlIGNhdXRpb24gd2hlbiBzdWJtaXR0aW5nIHRoaW5ncyB0byBwcmVzcyByZWxlYXNlcywgYW5kCnRvIGJlIGNhcmVmdWwgYWJvdXQgd2hhdCB5b3UgcHVibGlzaCB0byBtYWtlIHN1cmUgaXQgaXMgMTAwJSBjb3JyZWN0LgoKQSBmZXcgbW9udGhzIGFnbywgd2UgdHJpZWQgdG8gc3VibWl0IHRoaXMgcGFwZXIgdG8gU2NpZW5jZSBhbmQgTmF0dXJlIGJlZm9yZQpQbG9zT25lLCBidXQgcmVjZWl2ZWQgZGVzayByZWplY3Rpb25zLiBJIHdvbmRlciBpZiB0aGV5J2Qgd2FudCBpdCBub3c/Cg==","base64").toString()
  },
  {
    id: 3,
    title: "Data Science is Engineering",
    date: "2013-07-07 16:18",
    categories: ["academia", "programming", "education", "the future"],
    text: Buffer("V2UgZXhwZWN0IHN0dWRlbnRzIHRvIHdyaXRlIHJlc2VhcmNoIHBhcGVycyBhcyB3ZWxsIGFzIGRvIHN0YXRpc3RpY3MgaW4gUiBvciBTVEFUQSBvciBNYXRsYWIgb24gc21hbGwgZGF0YXNldHMuIFdoeSBkb27igJl0IHdlIGV4cGVjdCB0aGVtIHRvIGRlYWwgd2l0aCB2ZXJ5IHZlcnkgbGFyZ2UgZGF0YXNldHM/IFdlIGFyZSB0b2xkIHRoYXQg4oCcRGF0YSBTY2llbmNl4oCdIGlzIHRoZSBhbnN3ZXIgdG8gdGhpcyDigJxCaWcgRGF0YeKAnSBwcm9ibGVtLgoKSeKAmWQgbGlrZSB0byByZWRlZmluZSBEYXRhIFNjaWVuY2U6IGl0IGlzIHRoZSBhY3Qgb2YgZ2x1aW5nIHRvb2xraXRzIHRvZ2V0aGVyIHRvIGNyZWF0ZSBhIHBpcGVsaW5lIGZyb20gcmF3IGRhdGEgdG8gaW5mb3JtYXRpb24gdG8ga25vd2xlZGdlLlRoZXJlIGFyZSBubyBpbm5vdmF0aW9ucyB0byBiZSBtYWRlIGluIERhdGEgU2NpZW5jZS4gVGhlIGlubm92YXRpb25zIHRvIGJlIG1hZGUgaGVyZSBhcmUgaW4gQ29tcHV0ZXIgU2NpZW5jZSwgSW5mb3JtYXRpY3MsIFN0YXRpc3RpY3MsIFNvY2lvbG9neSwgVmlzdWFsaXphdGlvbiwgTWF0aCwgZXRjLiDigJQgYW5kIHRoZXkgYWx3YXlzIHdpbGwgYmUuCgpEYXRhIFNjaWVuY2UgaXMganVzdCBlbmdpbmVlcmluZy4KCiMjIyBBIEJpdCBvZiBCYWNrZ3JvdW5kCgpSZWNlbnRseSBuYW1lZCB0aGUgU2V4aWVzdCBKb2IgaW4gdGhlIDIxc3QgQ2VudHVyeSBieSBIYXJ2YXJkIEJ1c2luZXNzIFJldmlldywgRGF0YSBTY2llbmNlIGhhcyBlbWVyZ2VkIGFzIGEgbmV3IGRpc2NpcGxpbmUsIHdpdGggc2tpbGxzZXRzIGFwcGxpY2FibGUgdG8gaGFuZGxpbmcgbGFyZ2UgZGF0YXNldHMgZnJvbSBzb2NpYWwgbWVkaWEsIG1vYmlsZSBwaG9uZXMsIG9ubGluZSBwdXJjaGFzZXMsIGdlbm9tZXMsIGFuZCBvdGhlciBkYXRhc2V0cy4KCkZyb20gV2lraXBlZGlhOgo+4oCcRGF0YSBzY2llbmNlIGluY29ycG9yYXRlcyB2YXJ5aW5nIGVsZW1lbnRzIGFuZCBidWlsZHMgb24gdGVjaG5pcXVlcyBhbmQgdGhlb3JpZXMgZnJvbSBtYW55IGZpZWxkcywgaW5jbHVkaW5nIG1hdGgsIHN0YXRpc3RpY3MsIGRhdGEgZW5naW5lZXJpbmcsIHBhdHRlcm4gcmVjb2duaXRpb24gYW5kIGxlYXJuaW5nLCBhZHZhbmNlZCBjb21wdXRpbmcsIHZpc3VhbGl6YXRpb24sIHVuY2VydGFpbnR5IG1vZGVsaW5nLCBkYXRhIHdhcmVob3VzaW5nLCBhbmQgaGlnaCBwZXJmb3JtYW5jZSBjb21wdXRpbmcgd2l0aCB0aGUgZ29hbCBvZiBleHRyYWN0aW5nIG1lYW5pbmcgZnJvbSBkYXRhIGFuZCBjcmVhdGluZyBkYXRhIHByb2R1Y3RzLuKAnQoKVGhlIGRlc2NyaXB0aW9uIGdvZXMgb24gdG8gcmVpbmZvcmNlIHRoZSBwZXJjZXB0aW9uIHRoYXQgZGF0YSBzY2llbmNlIGlzIHZlcnkgZGlmZmljdWx0LCBieSBzdGF0aW5nIHRoYXQg4oCcdGhlcmUgaXMgcHJvYmFibHkgbm8gbGl2aW5nIHBlcnNvbiB3aG8gaXMgYW4gZXhwZXJ0IGluIGFsbCBvZiB0aGVzZSBkaXNjaXBsaW5lcy7igJ0gT2YgY291cnNlIHRoZXJlIGlzbuKAmXQuIERhdGEgc2NpZW5jZSBpcyB1c3VhbGx5IGhhbmRsZWQgYnkgdGVhbXMgb2YgY29tcGV0ZW50IGluZGl2aWR1YWxzIHdpdGggdmFyaWVkIGJhY2tncm91bmRzIHRoYXQgY2FuIGNvdmVyIG1vc3Qgb2YgdGhlc2UgYXJlYXMuCgpUaGUgdHJ1dGg6IG9ubHkgMSBvZiB0aGUgOSBhYm92ZSBkaXNjaXBsaW5lcyBhcmUgdGF1Z2h0IGluIHByaW1hcnkgYW5kIHNlY29uZGFyeSBzY2hvb2xzIGluIHRoZSBVbml0ZWQgU3RhdGVzLiBTdHVkZW50cyBhcmUgbHVja3kgdG8gaGF2ZSBhIENvbXB1dGVyIFNjaWVuY2UgQVAgY291cnNlIGluIGhpZ2ggc2Nob29sLCBhbmQgdGhleSBhcmUgc3ViLXBhciB0byBwcmVwYXJlIHlvdSBmb3IgdGhlIHJlYWwgd29ybGQgb2YgY29tcHV0aW5nLgoKVGh1cywgd2UgYXJlIGhpdHRpbmcgYW4gaW1wYXNzZSwgd2hlcmVpbiB0aGUgY29tcHV0YXRpb25hbCBhYmlsaXRpZXMgcmVxdWlyZWQgdG8gaGFuZGxlIG91ciBkYXRhIG91dHB1dCBhcmUgZmFyIG91dHBhY2luZyBvdXIgYWJpbGl0aWVzIG9yIHdvcmtmb3JjZSBzaXplLiBJIGFyZ3VlIHRoYXQgRGF0YSBTY2llbmNlIGhhcyBzaW1wbHkgZW1lcmdlZCBmcm9tIHRoZSBpbmFiaWxpdHkgdG8gdGVhY2ggYSBnZW5lcmF0aW9uIOKAlCBteSBnZW5lcmF0aW9uIOKAlCBhYm91dCBzb2Z0d2FyZSBlbmdpbmVlcmluZy4KCiMjIyBXaHkgZG8gd2UgdHJ1c3QgeW91LCBLYXJpc3NhPwpJIGhhdmUgYmVlbiBhIHJlc2VhcmNoIGFzc2lzdGFudCBhdCBJbmRpYW5hIFVuaXZlcnNpdHkgZm9yIHRoZSBwYXN0IHllYXIuIEJ5IHVzaW5nIG15IGNvbXB1dGVyIHNjaWVuY2Ugc2tpbGxzIGluIGNvbmp1bmN0aW9uIHdpdGggc29tZSBzb2NpYWwgc2NpZW5jZSBjb2xsYWJvcmF0b3JzIHdpdGggZ29vZCBxdWVzdGlvbnMsIEnigJl2ZSBiZWVuIGFibGUgdG8gcHV0IG15c2VsZiBpbiBhIHBvc2l0aW9uIHRoYXQgbW9zdCBwZW9wbGUgZG9u4oCZdCBmaW5kIHRoZW1zZWx2ZXMgc28gZWFybHkgaW4gdGhlaXIgYWNhZGVtaWMgY2FyZWVyLiBUaGUgc29jaWFsIHNjaWVuY2VzIGFyZSBsb3Zpbmcgc3R1ZGllcyB0aGF0IHVzZSB0aGVzZSDigJxCaWcgRGF0YeKAnS1zZXRzLCBhcyB3ZSBhcmUgYWJsZSB0byBjb21wdXRlIHRoaW5ncyBhYm91dCBodW1hbnMgb24gYSBsYXJnZXIgc2NhbGUgdGhhbiBldmVyIHBvc3NpYmxlIGJlZm9yZSBpbiBodW1hbiBoaXN0b3J5LiBUaGUgZmllbGQgaXMgd2lkZSBvcGVuLiBZb3UgY2FuIGVhc2lseSBiZWNvbWUgYSB3aXphcmQg4oCmIG9yIGF0IGxlYXN0IG1ha2UgdGhlbSB0aGluayB5b3UgYXJlLgoKUnVuIHRocm91Z2ggNDAwIG1pbGxpb24gc29jaWFsIG1lZGlhIHBvc3RzPyBHZXQgYWNjZXNzIHRvIGEgYmlnIGVub3VnaCBjb21wdXRlciBhbmQga25vdyB0aGUgbGlicmFyeSB0byB1c2UsIGFuZCBldmVyeXRoaW5nIGlzIHByYWN0aWNhbGx5IGRvbmUgZm9yIHlvdS4gTm93YWRheXMsIHNvbWV0aGluZyB0aGF0IHVzZWQgdG8gdGFrZSBhIGNvdXBsZSBodW5kcmVkIGxpbmVzIG9mIGNvZGUganVzdCBhIGZldyB5ZWFycyBhZ28gY2FuIG5vdyBiZSBkb25lIGxpa2UgdGhpczoKCglyZXMgPSBkYi5leGVjdXRlKG1hcF9mdW4sIHJlZHVjZV9mdW4pCgpUaGUgdHJ1dGggaXMsIHNvbWVvbmUgZXF1aXBwZWQgd2l0aCBhIGNvdXBsZSB5ZWFycyBvZiBjb21wdXRlciBzY2llbmNlIHRyYWluaW5nIGNhbiBjb21wbGV0ZSB0aGVzZSB0YXNrcyAoSSBkaWQhKS4gVGhleSBhcmUgbm90IHNvIGRpZmZpY3VsdC4gVGhlIGluY2VudGl2ZXMgdG8gcGFzcyB0aGVzZSBza2lsbHMgb24sIGhvd2V2ZXIsIGFyZSBub3QgaW5zdGl0dXRpb25hbGl6ZWQuIEFzIGRlbWFuZCBpbmNyZWFzZXMsIG15IHNhbGFyeSBvbmx5IGdvZXMgdXAuLi4gZXNwZWNpYWxseSBpZiB0aGUg4oCcZGF0YSBzY2llbnRpc3TigJ0gc3VwcGx5IGlzIHN0YWduYXRpbmcuCgojIyMgVGhlIEFjYWRlbXkKU28sIHdoYXQgZG9lcyB0aGlzIG1lYW4gZm9yIHRoZSBhY2FkZW15PyBUaGUgcGljdHVyZSBhdCB0aGUgdG9wIG9mIHRoaXMgYmxvZyBwb3N0IHNob3dzIGhvdyBtYW55IHNjaG9vbHMgaGF2ZSBwb3VuY2VkIG9uIHRoZSBpZGVhIG9mIGEgRGF0YSBTY2llbmNlIHByb2dyYW0sIGZlbGxvd3NoaXAsIG1hc3RlcnMsIG9yIFBoRC4gQnV0IHdoYXQgaXMgYWN0dWFsbHkgaGFwcGVuaW5nLCBoZXJlPyBXZSBhcmUgZnVubmVsaW5nIHBlb3BsZSBpbnRvIOKAnERhdGEgU2NpZW5jZeKAnSB3aG8gd291bGQgb3RoZXJ3aXNlIGJlIHN0dWR5aW5nIEJpb2xvZ3ksIFBoeXNpY3MsIFNvY2lvbG9neSwgUG9saXRpY2FsIFNjaWVuY2UsIG9yIG90aGVyIGZpZWxkcy4KCiFbQWx0IHRleHRdKC9pbWFnZXMvYmxvZy9kYXRhc2NpZW5jZWRvb2RsZS5qcGVnKQoKX0hlcmUgd2Ugc2VlIHRoZSB0cmFuc2Zvcm1hdGlvbiBvZiBhY2FkZW1pYS4gU3R1ZGVudHMgYXJlIGZ1bm5lbGVkIGZyb20gdmFyaW91cyBkaXNjaXBsaW5lcyB0byB0aGlzIGVwaGVyZW1hbCDigJxEYXRhIFNjaWVuY2Us4oCdIHdoZXJlIHRoZXkgbGVhcm4gcGFyYWxsZWwgY29tcHV0aW5nLCBtYWNoaW5lIGxlYXJuaW5nLCBhbmQgb3RoZXIgYXBwbGljYWJsZSBza2lsbHMgZnJvbSBDb21wdXRlciBTY2llbmNlIGFuZCBJbmZvcm1hdGljcy4gQXMgcHJvZ3JhbW1pbmcgaXMgYWRvcHRlZCBhcyB0aGUg4oCcZm91cnRoIFLigJ0gYWxvbmdzaWRlIHJlYWRpbmcsIHdyaXRpbmcsIGFuZCBhcml0aG1ldGljLCB3ZSBzZWUgdGhlIGRpc2NpcGxpbmVzIHNlcGFyYXRlIGFuZCBkYXRhIHNjaWVuY2UgZGlzYXBwZWFyLl8KCldoYXQgaWYgc29jaW9sb2dpc3RzIGRpZG7igJl0IGhhdmUgdG8gaGlyZSBhIGRhdGEgc2NpZW50aXN0LCBvciBiZWNvbWUgZGF0YSBzY2llbnRpc3RzOyB3aGF0IGlmIHBvbGl0aWNhbCBzY2llbnRpc3RzIGRpZG7igJl0IGhhdmUgdG8gZ2V0IGEgTVMgaW4gY29tcHV0ZXIgc2NpZW5jZTsgd2hhdCBpZuKApiB3aGF0IGlm4oCmIHdlIHNhdyBwcm9ncmFtbWluZyBhcyBhIGZ1bmRhbWVudGFsIGxpZmUgc2tpbGw/IFdoYXQgaWYgaW5zdGVhZCBvZiBmb2N1c2luZyBvbiBsZWFybmluZyBjb21wdXRhdGlvbmFsIGluZnJhc3RydWN0dXJlIGluIGEgcHJvZ3JhbSBsaWtlIERhdGEgU2NpZW5jZSwgc3R1ZGVudHMgY291bGQganVzdCBkaXZlIGludG8gdGhlaXIgZmllbGQgb2YgaW50ZXJlc3QsIHVzaW5nIGNvbXB1dGF0aW9uYWwgdG9vbHM/CgpXaGF0IGlmIGFsb25nIHdpdGggUmVhZGluZywgd1JpdGluZywgYW5kIGFSaXRobWV0aWMsIHRoZXJlIHdhcyBwUm9ncmFtbWluZz8gVGhlIOKAnGZvdXJ0aCBS4oCdIChvciDigJhyaXRobXMgZm9yIOKAnGFsZ29yaXRobXPigJ0gaXQgaGFzIGJlZW4gY2FsbGVkIGluIHRoZSBwYXN0KSBoYXMgYmVlbiB0b3V0ZWQgYXMgdGhlIDIxc3QtY2VudHVyeSBsaXRlcmFjeS4gT25jZSB0aGUgYWNhZGVteSBidWlsZHMgcHJvZ3JhbW1pbmcgYW5kIGFsZ29yaXRobXMgaW50byB0aGUgYmFzaWMgY3VycmljdWx1bSwgSSB0aGluayB3ZSB3aWxsIHNlZSBEYXRhIFNjaWVuY2Ugc3RvcCBiZWluZyB0aGlzIGNhdGNoLWFsbCBmb3IgZXZlcnkgc3R1ZGVudCB3aG8gd2FudHMgdG8gbGVhcm4gaG93IHRvIGhhcm5lc3Mg4oCcQmlnIERhdGEu4oCdCgpEb27igJl0IGdldCBtZSB3cm9uZyDigJQgSeKAmW0gc3VyZSBEYXRhIFNjaWVuY2Ugd2lsbCBjb250aW51ZSB0byBleGlzdCBmb3IgYSBsb25nIHRpbWUsIGFuZCB0aGUgY3VycmVudCBzZXQgdXAgaXMgZ3JlYXQgZm9yIHBlb3BsZSBsaWtlIG1lLiBOb3QgdG8gbWVudGlvbiwgaGF2aW5nIHBvZHMgb2YgcGVvcGxlIHdobyBkbyBzaW1pbGFyIHRoaW5ncyBhbGxvd3MgcmVzb3VyY2VzIHRvIGJlIHNoYXJlZCBlYXNpbHkuIEJ1dCBJIHByZWRpY3QgdGhpcyBmaWVsZCB3aWxsIGZsb3cgYmFjayBpbnRvIGl04oCZcyByZXNwZWN0aXZlIHN1YmZpZWxkcyBhcyBjb21wdXRlciBzY2llbmNlIGxpdGVyYWN5IGluY3JlYXNlcy4gVGhlIHByb2dyYW1taW5nIHBhcnRzIG9mIOKAnERhdGEgU2NpZW5jZeKAnSBhcmUgYWN0dWFsbHkgcHJldHR5IGVhc3kuCgpJIGltYWdpbmUgYW4gYWNhZGVteSB3aGVyZSBjb21wdXRlciBzY2llbmNlIGJlY29tZXMgYSBmdW5kYW1lbnRhbCBza2lsbCBpbiBTb2Npb2xvZ3ksIEJpb2xvZ3ksIEpvdXJuYWxpc20sIEVjb25vbWljcywgUGh5c2ljcywgUG9saXRpY2FsIFNjaWVuY2U7IHdoZXJlIHRoZSBpZGVhIG9mIOKAnERhdGEgU2NpZW5jZeKAnSBhcyBhIHNlcGFyYXRlIGVudGl0eSBzZWVtcyBhYnN1cmQsIGJlY2F1c2UgdGhhdOKAmXMganVzdCBlbmdpbmVlcmluZy4gVGhhdOKAmXMganVzdCBhbm90aGVyIHdheSB3ZSBjYW4gcHJvZHVjZSBhbmQgdHJhbnNtaXQgcmVzdWx0cywgYSBzdGFuZGFyZCBwcmFjdGljZSB0YXVnaHQgYWxvbmdzaWRlIHJlYWRpbmcgYW5kIHdyaXRpbmcu","base64").toString(),
    disqus: "blog/2013/07/07/data-science-is-engineering/"
  },
  {
    id: 2,
    title: "Don't forget to reply-all: E-mail is a terrible collaboration tool",
    date: "2013-06-13 16:24",
    categories: ["collaboration", "technology"],
    text: Buffer("SG93IG1hbnkgdGltZXMgaGF2ZSB5b3Ugd3JpdHRlbiBhbiBlLW1haWwgdG8gYSBncm91cCBvZiBwZW9wbGUsIGFuZCBzb21lb25lIGZvcmdldHMgdG8gcmVwbHktYWxsPwo8IS0tIG1vcmUgLS0+CgpNb3N0IG9mIHRoZSB0aW1lLCB3ZeKAmWQgbGlrZSB0byBoYXZlIGV2ZXJ5b25lIHJlc3BvbmQgdG8gZXZlcnlvbmUgZWxzZSwgcGFydGljdWxhcmx5IGluIGNvbGxhYm9yYXRpb24gc2NlbmFyaW9zIHN1Y2ggYXMgd29yaywgc2Nob29sLCBvciBzaWRlIHByb2plY3RzLiBJdOKAmXMgbmljZSB3aGVuIHBlb3BsZSBhcmUgbGVhc3Qgc2lnbmFsaW5nIHRoYXQgdGhleSBoYXZlIHJlY2VpdmVkIHRoZSBtZXNzYWdlLCBsZXQgYWxvbmUgcHV0dGluZyBmb3J0aCB2YWx1YWJsZSBpbnNpZ2h0IHJlbGF0ZWQgdG8gdGhlIHRvcGljLiBBdCB0aGUgdmVyeSBsZWFzdCwgd2UgZXhwZWN0LCBhbmQgaG9wZSwgdGhhdCBldmVyeW9uZSBpbnZvbHZlZCB3aWxsIOKAnHJlcGx5LWFsbOKAnSB3aGVuIHRoZXkgcmVzcG9uZCB3aXRoIHNvbWV0aGluZyB0aGF0IGNvbmNlcm5zIHRoZSBlbnRpcmUgZ3JvdXAuCgpUaGlzIGRvZXNu4oCZdCBhbHdheXMgaGFwcGVuLiBFc3BlY2lhbGx5IHdpdGggb3VyIGxlc3Mg4oCcdGVjaHnigJ0gbmVpZ2hib3JzLCBpdCBjYW4gYmUgZWFzeSB0byBhY2NpZGVudGFsbHkgKG9yIHVua25vd2luZ2x5KSBub3QgdXNlIHRoaXMgc2VlbWluZ2x5IGhpZGRlbiwgbm9uLWRlZmF1bHQgZmVhdHVyZSBvZiDigJxyZXBseWluZy1hbGwu4oCdCgpCdXQgd2h5IGlzIOKAnHJlcGx5LWFsbOKAnSBzbyBpbXBvcnRhbnQ/IEFuZCB3aGVyZSBkb2VzIGUtbWFpbCBnbyBwYXJ0aWN1bGFybHkgYmFkLCBldmVuIHdoZW4gcmVwbHktYWxsIGlzIHVzZWQ/CgpUYWtlIHRoaXMgZm9yIGV4YW1wbGUgKHRoaXMgaGFwcGVuZWQgdG8gbWUgb25jZSk6Cgo+IF9Kb2huXzogU28sIHdoZXJlIGFyZSB3ZSBtZWV0aW5nPyAzNzYgd291bGQgcmVhbGx5IHdvcmsgYmV0dGVyIGZvciBtZSwgSSBuZWVkIHRvIGRyb3Agb2ZmIG15IGtpZHMgYXQgc2Nob29sLgpfQmVjY2FfOiBJ4oCZbSBuZWFyIDM3Niwgc28gdGhhdCB3b3JrcywgYnV0IEkgZG9u4oCZdCBtaW5kIGdvaW5nIHRvIFRheWxvcuKAmXMgb2ZmaWNlLgpfVGF5bG9yXzogQm9iIGFuZCBJIHdpbGwgYmUgaW4gbXkgb2ZmaWNlLiBDb21lIG92ZXIuCl9Cb2JfOiBJIGRvbuKAmXQgcmVhbGx5IGNhcmUgd2hlcmUgd2UgbWVldC4KX0JlY2NhXzogTWF5YmUgaXQgbWlnaHQgYmUgYmV0dGVyIHRvIG1lZXQgaW4gMzc2IGJlY2F1c2Ugb2YgSm9obuKAmXMgdGltZSBjb25zdHJhaW50PwpfSm9obl86IEl04oCZcyBub3QgYSBiaWcgZGVhbCwgSSBkb27igJl0IG1pbmQgaGVhZGluZyBvdmVyIHRvIHlvdXIgb2ZmaWNlLCBUYXlsb3IuCl9UYXlsb3JfOiBBbHJpZ2h0IHRoYXTigJlzIGZpbmUsIHdlIHdpbGwgaGVhZCBvdmVyIHRvIDM3Ni4KCioqV2hlcmUgaXMgdGhlIGdyb3VwIG1lZXRpbmc/KioKClRoaXMgaXMgd2hhdCBoYXBwZW5zIHdpdGggYSBzdHJpbmcgb2Yg4oCccmVwbHktYWxs4oCdLXMgYXQgdGhlIHNhbWUgdGltZS4gUGVvcGxlIGFyZSB0cnlpbmcgdG8gdXNlIGUtbWFpbCBsaWtlIGNoYXQuIFRoZXNlIGUtbWFpbHMgZW50ZXIgeW91ciBlLW1haWwgYm94IHNlcXVlbnRpYWxseSwgbGlrZSBjaGF0LCBzbyBJIGRvbuKAmXQgYmxhbWUgcGVvcGxlIGZvciBkb2luZyBpdC4KCkJ1dCBpdOKAmXMgZS1tYWlsLCBub3QgY2hhdCEgRS1tYWlsIGlzIHNsb3cuIEl0IGlzIG1vZGVsZWQgYWZ0ZXIgc29tZXRoaW5nIHBlb3BsZSBsaWtlIHRvIGR1YiBhcyDigJxzbmFpbCBtYWls4oCdLiBUaGVyZSBhcmUgbWFueSBidXR0b25zIHRvIHByZXNzLCBhbmQgc29tZXRpbWVzIHlvdSBtaWdodCBwcmVzcyB0aGUgd3Jvbmcgb25lOyBzb21ldGltZXMgcGVvcGxlIGRvbuKAmXQgcmVwbHktYWxsOyBzb21ldGltZXMgcGVvcGxlIGp1c3QgZ2VudWluZWx5IG1pc3MgeW91ciBtZXNzYWdlczsgcGVvcGxlIHNvbWV0aW1lcyB3cml0ZSByZXNwb25zZXMgYXQgdGhlIHNhbWUgdGltZS4gSXQgd2FzdGVzIHRpbWUuCgpFdmVuIHdvcnNlLCB0aGUgbG9zcyBvZiBjb21tdW5pY2F0aW9uIGluIGEgZ3JvdXAsIHBhcnRpY3VsYXJseSBpbiBjb2xsYWJvcmF0aW9uIHNpdHVhdGlvbnMsIGNhbiBsZWFkIHRvIHRoZSBncm91cOKAmXMgZmFpbHVyZSB0byBlc3RhYmxpc2ggZ29hbHMgYW5kIGV4ZWN1dGUgdGhlbS4gSXQgY2FuIGxlYWQgdG8gbWlzdW5kZXJzdGFuZGluZ3MsIHRvIGR1cGxpY2F0aW9uIG9mIHdvcmssIG9yIGFic2VuY2Ugb2YgaXQgZW50aXJlbHkuCgpUaGUgc2VxdWVudGlhbCBwYXR0ZXJuIG9mIGUtbWFpbCBzb21ldGltZXMganVzdCBkb2VzbuKAmXQgbWFrZSBhbnkgc2Vuc2UuIFBlb3BsZSBvZnRlbiByZXBseSB0byBlLW1haWxzIHRoYXQgYXJlIG91dCBvZiBkYXRlLCBwZXJoYXBzIGR1ZSB0byBsYWcgb3IgYSBtaXNzZWQgbWVzc2FnZS4gVGhlIGVhc3kgd2F5IHRvIGZpeCB0aGlzLCBpcywgb2YgY291cnNlLCByZWFsLWxpZmUgY29tbXVuaWNhdGlvbiBzaW11bGF0aW9uLiBIYXZlbuKAmXQgd2UgZml4ZWQgdGhpcyBhbHJlYWR5LCB0aG91Z2g/IFdpdGggY2hhdD8KCk1heWJlIHdlIGNvdWxkIGRldGVjdCB3aGVuIGV2ZXJ5b25lIGluIHlvdXIgcmVjaXBpZW50cyBsaXN0IGlzIG9ubGluZSwgYW5kIGltbWVkaWF0ZWx5IHB1dCB0aGVtIGluIGEgY2hhdCByb29tIHRvZ2V0aGVyLCBpbnN0ZWFkIG9mIGZvcmNpbmcgZXZlcnlvbmUgdG8gY29tcGx5IHdpdGggdGhlIGNvbnN0cmFpbnRzIG9mIGUtbWFpbCAuIEEgZHluYW1pYyByZXNwb25zZSBzeXN0ZW0gY291bGQgd29yayBsaWtlIGNoYXQgd2hlbiBwb3NzaWJsZSwgYW5kIHdvcmsgbGlrZSBzbmFpbC1tYWlsIG90aGVyd2lzZS4KCi1LCgpFRElUOiBJIHJlYWxseSBkaWRu4oCZdCBtZWFuIGZvciB0aGlzIHRvIGNvbWUgb3V0IGFzIGFuIGVuZG9yc2VtZW50LCBidXQgaGlwY2hhdC5jb20gbG9va3MgbGlrZSBhIHZpYWJsZSBzb2x1dGlvbi4K","base64").toString()
  },
  {
    id: 1,
    title: "Widespread Apathy and the NSA",
    date: "2013-06-13 00:37",
    categories: ["politics", "technology", "surveillance"],
    text: Buffer("4oCcVGhleSBhcmUgc3VjaCBwb3dlcmZ1bCBhZHZlcnNhcmllcyB0aGF0IG5vIG9uZSBjYW4gbWVhbmluZ2Z1bGx5IG9wcG9zZSB0aGVtLgpJZiB0aGV5IHdhbnQgdG8gZ2V0IHlvdSwgdGhleeKAmWxsIGdldCB5b3UgaW4gdGltZS4gWW91IGRvbuKAmXQgaGF2ZSB0byBoYXZlIGRvbmUKYW55dGhpbmcgd3JvbmcsIHlvdSBqdXN0IGhhdmUgdG8gYmUgZXZlbnR1YWxseSB1bmRlciBzdXNwaWNpb24uIFRoZW4gdGhleSBjYW4KZ28gYmFjayBpbiB0aW1lIGFuZCBzY3J1dGluaXplIGV2ZXJ5IGRlY2lzaW9uIHlvdeKAmXZlIG1hZGUuIFRoZXkgY2FuIHBhaW50CmFueW9uZSBpbiB0aGUgY29udGV4dCBvZiBhIHdyb25nZG9lci7igJ0gLSBbRWR3YXJkIFNub3dkZW5dKGh0dHA6Ly93d3cuZ3VhcmRpYW4uY28udWsvd29ybGQvMjAxMy9qdW4vMDkvZWR3YXJkLXNub3dkZW4tbnNhLXdoaXN0bGVibG93ZXItc3VydmVpbGxhbmNlKSwgTlNBIHdoaXN0bGVibG93ZXIKClRoZSBpbmRpdmlkdWFsIHJlc3BvbnNpYmxlIGZvciB0aGUgTlNBIGxlYWtzIGhhcyBjb21lIGZvcndhcmQgd2l0aCBhIHBvd2VyZnVsCnZpZGVvIGV4cGxhaW5pbmcgdGhlIHJlYXNvbiBmb3IgdGhlIGxlYWssIGhpcyBtb3RpdmVzLCBhbmQgZGVzY3JpYmVzIHRoZSBzeXN0ZW0KbW9yZSBpbiBkZXRhaWwuIEhpcyBncmVhdGVzdCB3b3JyeSBpcyB0aGF0IG5vdGhpbmcgd2lsbCBjaGFuZ2UgZnJvbSB0aGlzLgoKSSB3b3JyeSBhYm91dCB0aGF0IGFzIHdlbGwuIFRoZSBVbml0ZWQgU3RhdGVzIE1pbGl0YXJ5IGFuZCBpdOKAmXMgdmFyaW91cwppbnRlbGxpZ2VuY2UgYWdlbmNpZXMgaGF2ZSBtb3JlIHN1cnZlaWxsYW5jZSBwb3dlciB0aGFuIGhhcyBldmVyIGJlZW4gcG9zc2libGUKaW4gaHVtYW4gaGlzdG9yeSwgYW5kIGl04oCZcyBvbmx5IGdldHRpbmcgd29yc2UuIEkgc3VzcGVjdCB0aGF0IHRoZSB1bmZvcnR1bmF0ZQpwYXJ0IG9mIHRoaXMgaXMgdGhlIGxvbmctdGVybSBnYW1lIChvciBsYWNrIHRoZXJlb2YpOiBob3cgd2lsbCB3ZSBjb21iYXQgaXQ/CgpSYW5kIFBhdWwgcmVjZW50bHkgcmV2ZWFsZWQgaGlzIG1vdGl2ZSB0byBmaWxlIGEgW2NsYXNzLWFjdGlvbiBsYXdzdWl0XShodHRwOi8vd3d3Lmh1ZmZpbmd0b25wb3N0LmNvbS8yMDEzLzA2LzA5L3JhbmQtcGF1bC1uc2Ffbl8zNDExNTg3Lmh0bWwpLCBidXQgaXMKdGhpcyBlbm91Z2g/CgpUaGUgVW5pdGVkIFN0YXRlcyBnb3Zlcm5tZW50IGhhcyBtYW55IGNoZWNrcyBhbmQgYmFsYW5jZXMsIGJ1dCBpdCBzZWVtcyB0byBiZQptaXNzaW5nIHNvbWUgb24gdGhlIG1pbGl0YXJ5IGFuZCBpbnRlbGxpZ2VuY2UgYWdlbmNpZXMuIEkgd29ycnkgdGhhdCB0aGlzCmluY3JlYXNlZCBwb3dlciBpcyBqdXN0IGFub3RoZXIgZXhhbXBsZSBvZiB0aGUgbWlsaXRhcnnigJlzIGNvbXBsZXRlCmluZGVwZW5kZW5jZSwgd2l0aG91dCBvdmVyc2lnaHQgb3IgZGVjcmVlIGZyb20gdGhlIHBlb3BsZSBpdCBpcyBzdXBwb3NlZCB0bwpzZXJ2ZS4KCkV2ZXJ5IGRheSBJIGJlY29tZSBtb3JlIGRpc2hlYXJ0ZW5lZCBieSBvdXIgKGxhY2sgb2YpIGFiaWxpdHkgdG8gYWN0dWFsbHkKY2hhbmdlIHRoZSBjb3Vyc2Ugb2YgZmVkZXJhbCBkZWNpc2lvbi1tYWtpbmcgcHJvY2Vzc2VzIGluIHRoZSBoaWdoZXIgZWNoZWxvbnMKb2YgZ292ZXJubWVudC4gTGFzdCBuaWdodCwgSSB0YWxrZWQgd2l0aCBmcmllbmRzIGF0IGEgc21hbGwgZ2V0IHRvZ2V0aGVyLiBJdAp3YXMgZGVwcmVzc2luZywgYXMgbWFueSBvZiB0aGVzZSB2ZXJ5IGludGVsbGlnZW50LCBzb2NpYWxseSBhbmQgcG9saXRpY2FsbHkKYXdhcmUgaW5kaXZpZHVhbHMgd2VyZSB1bmFibGUgdG8gZmVlbCBtb3RpdmF0ZWQgdG8gYWN0aW9uIGJ5IHRoZSBOU0EgbGVhay4gTWFueQpwZW9wbGUgc2ltcGx5IGRpZG7igJl0IHdhbnQgdG8gdGFsayBhYm91dCBpdC4gVGhlIHRvbmUgb2YgdGhlc2UgY29udmVyc2F0aW9ucwpzZWVtZWQgdG8gdGFrZSBhIGRvd253YXJkIHNwaXJhbCBpbnRvIGRlc3BhaXIgYW5kIGFwYXRoeSwgYW5kIGZpbmFsbHkgc2lsZW5jZS4KSXQgaXMgYSBzaGFtZSB0aGF0IGV2ZW4gdGhvc2Ugbm9ybWFsbHkgaW52ZXN0ZWQgaW4gcG9saXRpY2FsIGlucXVpcnkgY2FuIGJlCmRpc3N1YWRlZCBmcm9tIHB1cnN1aW5nIHNvbHV0aW9ucyBhbmQgZW5nYWdpbmcgaW4gYWN0aW9uLiBJbnN0ZWFkLCB0aGV5IGZlZWwgc28KcG93ZXJsZXNzIGluIG91ciBwb2xpdGljYWwgc3lzdGVtIHRoYXQgdGhleSBzaW1wbHkgc2hydWcgdGhlaXIgc2hvdWxkZXJzIGFuZApkcmluayBhd2F5IHRoZWlyIHNvcnJvdy4KCkkgb2JzZXJ2ZSB0aGlzLCBhbmQgd29uZGVyIHdoYXQgd2UgY2FuIGRvIHRvIGZ1bm5lbCB0aGlzIGFwYXRoeTsgd2hhdCBzb3J0IG9mCnN0cnVjdHVyZXMgY2FuIGJlIGNyZWF0ZWQgYW5kIGF2ZW51ZXMgdGFrZW4gdG8gYWRkcmVzcyB0aGUgaXNzdWUgb2YgZnVsbC1ibG93bgp0YWtlIG92ZXIgb2Ygb3VyIHBvbGl0aWNhbCBzeXN0ZW0gYnkgZmVhciwgYnkgbWlsaXRhcnkgcG93ZXIsIGFuZCBpbmR1c3RyaWFsCmludGVyZXN0cy4KCkFuZCB0aGVuIEkgc2hydWcuIEEgY2xhc3MgYWN0aW9uIGxhd3N1aXQgbWlnaHQgaGVscCwgYW5kIHBlcmhhcHMgdGhlIFN1cHJlbWUKQ291cnQgd2lsbCBydWxlIGFnYWluc3QgdGhlIGltcGxlbWVudGF0aW9uIG9mIHN1cnZlaWxsYW5jZSBzeXN0ZW1zIGxpa2UgUFJJU00uCkEgcHVzaCB0b3dhcmRzIGEgcmVkdWN0aW9uIG9mIHRoZSBtaWxpdGFyeSBidWRnZXQgY291bGQgc3RhcnQgdG8gc2VuZCBzaWduYWxzLApvciBhdCBsZWFzdCBiZWdpbiB0byB0YWtlIGF3YXkgdGhlaXIgY2FwYWJpbGl0aWVzLiBDYW1wYWlnbiBmaW5hbmNlIHJlZm9ybQpjb3VsZCBiZWdpbiB0byBtYWtlIHBlb3BsZSBmZWVsIG1vcmUgZW1wb3dlcmVkIGJ5IHRoZSBiYWxsb3QgYm94LiBCdXQgdGhlc2UKaXNzdWVzIGluIHRoZW1zZWx2ZXMgYXJlIGRpZmZpY3VsdCwgY29tcGxpY2F0ZWQsIGFuZCBzZWVtIHRvIGhhdmUgaGl0IGJyaWNrCndhbGxzIGluIHRoZSBwYXN0LiBFdmVuIGFmdGVyIGEgY2hhbmdlIGluIHBhcnR5IHBvd2VyIGluIDIwMDgsIHdlIGhhdmVu4oCZdCBzZWVuCm11Y2ggY2hlY2sgYW5kIGJhbGFuY2UgYWdhaW5zdCB0aGUgbWlsaXRhcnkgKFt0aGUgbWlsaXRhcnkgYnVkZ2V0IGhhcyBpbmNyZWFzZWQKY29udGludW91c2x5XShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01pbGl0YXJ5X2J1ZGdldF9vZl90aGVfVW5pdGVkX1N0YXRlcyksIFtndWFudGFuYW1vIGlzIHN0aWxsCm9wZW5dKGh0dHA6Ly9hYmNuZXdzLmdvLmNvbS9Qb2xpdGljcy9PVFVTL2d1YW50YW5hbW8tYmF5LW9wZW4tcHJvbWlzZXMvc3Rvcnk/aWQ9MTY2OTg3NjgjLlViVGV4VktCd244KSwKYW5kIFtjb25ncmVzcyBpcyB1bmFibGUgdG8gYWdyZWUgb24gYW55dGhpbmddKGh0dHA6Ly93d3cucHJlc3N0di5jb20vZGV0YWlsLzIwMTMvMDEvMDEvMjgxMjg4L3VzLWNvbmdyZXNzLXVuYWJsZS10by1tYWtlLWRlY2lzaW9ucy8pLgoKU28sIHdoYXQgY2FuIHdlIGRvPyBJ4oCZbGwgc3VwcG9ydCB3aG9ldmVyIHdhbnRzIHRvIGNvbWJhdCB0aGUgTlNB4oCZcyBwcmFjdGljZXMuIEkKZmVhciwgdGhvdWdoLCB0aGF0IHRoaXMgcHJvZ3JhbSB3aWxsIHN0YW5kIGFzIGFub3RoZXIgdW50cmF2ZXJzYWJsZSBtb3VudGFpbiBieQpmb2xrcyB3aG8gYXJlIGNvbnN1bWVkIGJ5IGEgc2VhIG9mIHdpZGUtc3ByZWFkIGFwYXRoeS4KCgo=","base64").toString()
  },
  {
    id: 0,
    title: "Expanded Best Practices when Learning to Code",
    date: "2013-06-01 00:43",
    categories: ["tutorials", "programming", "education"],
    text: Buffer("SSBjYW1lIGFjcm9zcyB0aGlzIG5pY2UgbGl0dGxlIGJsb2cgY2FsbGVkIFtDb2RlSFNdKGh0dHA6Ly9ibG9nLmNvZGVocy5jb20vKS4KSeKAmW0gcHJldHR5IGhhcHB5IGFib3V0IGEgbG90IG9mIHRoZSBwb3N0cyBJIHNlZSBvbiBpdCwgYW5kIGFsdGhvdWdoIGl0IGlzbuKAmXQKaW5jcmVkaWJseSBhY3RpdmUsIEkgZG8gZmluZCBpdCB0byBoYXZlIHNvbWUgbmljZSB0aWRiaXRzLiBIZXJlIGlzIGEgZ3JlYXQKbGl0dGxlIHBpZWNlIHRpdGxlZCDigJxCZXN0IFByYWN0aWNlcyBXaGVuIExlYXJuaW5nIHRvIENvZGUu4oCdIEhlIGRvZXNu4oCZdCBnbyBpbnRvCmdyZWF0IHByYWN0aWNhbCBkZXRhaWwgb24gZWFjaCBwb2ludCwgc28gSSB3YW50ZWQgdG8gZXhwYW5kIG9uIHRoZW0gaW4gdGhpcwpwb3N0Lgo8IS0tIG1vcmUgLS0+Cgo+IDEpIEtlZXAgYW4gb3BlbiBtaW5kLiBXaGVuIHlvdSBsZWFybiB0byBwcm9ncmFtLCBhbmQgeW91IGhhdmVu4oCZdCBwcm9ncmFtbWVkCmJlZm9yZSwgdGhlcmUgd2lsbCBiZSBhIGxvdCBvZiBuZXcgaWRlYXMuIEJlIHdpbGxpbmcgdG8gZ28gd2l0aCB0aGUgZmxvdy4KCllvdSB3aWxsIG9mdGVuIGJlIHRocm93biB0YXNrcyBsaWtlIOKAnFVzZSB0aGUgcmVhZGVyIG1vbmFk4oCdIG9yIOKAnFNldApzdWNoLWFuZC1zdWNoIE15U1FMIHZhcmlhYmxlIHRvIFjigJ0gb3Ig4oCcQmVuY2htYXJrIHlvdXIgZnVuY3Rpb25z4oCdIHdpdGhvdXQgbXVjaAptb3JlIGhlbHAuICBTb2Z0d2FyZSBkZXZlbG9wbWVudCwgbGlrZSBhbnkgZGlzY2lwbGluZSBvciBhcnQsIGhhcyBhIGxlYXJuaW5nCmN1cnZlLiBUaGVyZSBhcmUgYmFzaWMgYnVpbGRpbmcgYmxvY2tzIG9uZSBuZWVkcyB0byBjb21wbGV0ZSBldmVyeSB0YXNrLiBEb27igJl0CmJlIGFmcmFpZCB0byBiZSBjb25mdXNlZCwgYW5kIGtlZXAgYW4gb3BlbiBtaW5kIHRvIHdoYXQgbW9yZSBleHBlcmllbmNlZCBwZW9wbGUKYXJlIHRlbGxpbmcgeW91LiBJdOKAmXMgZ29pbmcgdG8gaGFwcGVuIG92ZXIgYW5kIG92ZXIgYWdhaW4uIEFzIHdpdGggbGVhcm5pbmcgYW55CmRpc2NpcGxpbmUgb3IgYXJ0LCBpdCB0YWtlcyB0aW1lIHRvIHB1dCB0aGUgYnVpbGRpbmcgYmxvY2tzIGluIHRoZSByaWdodCBwbGFjZXMKc28gdGhhdCB5b3UgY2FuIGNsaW1iIHRoZSBjdXJ2ZS4gSW4gdGhlIHByb2dyYW1taW5nIGNvbW11bml0eSB0aGVyZSBhcmUgYSBsb3QKb2YgcGVvcGxlIHdobyBzZWVtIGVsaXRpc3QgYW5kIHVud2lsbGluZyB0byBoZWxwIHlvdS4gVGhlIGhhcmRlc3QgcGFydCBmb3IgbWUKaXMgYmVjb21pbmcgZnJ1c3RyYXRlZCB3aGVuIEkgZG9u4oCZdCBoYXZlIHRoZXNlIGJ1aWxkaW5nIGJsb2NrcyB5ZXQsIGFuZCBJIGZlZWwKYWxvbmUgYW5kIGhlbHBsZXNzLiBJZiB5b3Uga2VlcCBwdXNoaW5nIGFuZCB0ZW1wZXIgeW91ciBmcnVzdHJhdGlvbnMsIHlvdeKAmWxsCmdldCB0aG9zZSBidWlsZGluZyBibG9ja3MgaW4gZHVlIHRpbWUuIFlvdSBjYW7igJl0IGJlIGZydXN0cmF0ZWQsIGFzIGl0IHdpbGwga2VlcAp5b3UgZnJvbSBhbiBvcGVuIG1pbmQuCgo+IDIpIEJlIHdpbGxpbmcgdG8gcGxheSBhcm91bmQuIE9uZSBvZiB0aGUgYmVzdCB3YXlzIHRvIHJlaW5mb3JjZSBhIHByb2dyYW1taW5nCmNvbmNlcHQgd2hlbiB5b3UgYXJlIGxlYXJuaW5nIGlzIGp1c3QgdG8gcGxheSBhcm91bmQgd2l0aCBpdC4gTWF5YmUgeW91IGxlYXJuIGEKbmV3IGNvbW1hbmQsIGEgbmV3IGZ1bmN0aW9uLCBhIG5ldyBjb25jZXB04oCmIHRyeSB0byBkbyB0aGUgZ2l2ZW4gZXhhbXBsZSwgYnV0CnRyeSB0byBtb2RpZnkgaXQgYSBsaXR0bGUgLS0ganVzdCB0byBzZWUgd2hhdCBoYXBwZW5zLgoKSXTigJlzIGp1c3QgYSBjb21wdXRlciEgSXQgYWN0dWFsbHkgZG9lc27igJl0IGhhdmUgYSBtaW5kIG9mIGl04oCZcyBvd24sIGFsdGhvdWdoIGl0CmRvZXMgc2VlbSBsaWtlIGl0IHNvbWV0aW1lcy4gSSByZWNvbW1lbmQgd29ya2luZyBvbiBhIGNsZWFuIGluc3RhbGxhdGlvbiBvZgpMaW51eCBNaW50IG9yIFVidW50dSwgYW5kIHdyaXRlIGxvZ3Mgb2Ygd2hhdCB5b3VyIHByb2dyYW0gd2lsbCBkbyB1c2luZyBwcmludApzdGF0ZW1lbnRzIGFuZC9vciB3cml0aW5nIHRvIGEgZmlsZS4gKkJhY2sgdXAgZXZlcnl0aGluZyB5b3Ugd3JpdGUgb24gdmVyc2lvbgpjb250cm9sICh1c2UgZ2l0aHViLmNvbSkuKiBJbiB0aGUgd29yc3QgY2FzZSwgeW91IGNhbiBhbHdheXMgcmVpbnN0YWxsIG9yIGdvCmJhY2sgdG8gYSBwcmV2aW91cyB2ZXJzaW9uLiA6KSBUaGVzZSBzbWFsbCB0aGluZ3Mgd2lsbCBtYWtlIHlvdSBmZWVsIG1vcmUKc2VjdXJlIGluIHlvdXIgcHJvZ3JhbW1pbmcsIHdoaWNoIGlzIGltcG9ydGFudCB0byB5b3VyIHN1Y2Nlc3MuIEp1c3QgZG9u4oCZdCBiZQphZnJhaWQuIFlvdSBjYW4gb25seSBsZWFybiBmcm9tIG1pc3Rha2VzLgoKPiAzKSBTdHlsZSBjb3VudHMuIFdoZW4gd2UgdGVhY2ggcHJvZ3JhbW1pbmcgYW5kIGNvbXB1dGVyIHNjaWVuY2UgYXQgQ29kZUhTLCB3ZQpmb2N1cyBvbiBnZXR0aW5nIHRoZSBwcm9ncmFtIHRvIHdvcmssIGJ1dCBhbHNvIG9uIHdyaXRpbmcgYSBwcm9ncmFtIHRoYXQgaGFzCmdvb2Qg4oCcc3R5bGUu4oCdIFdoYXQgSSBtZWFuIGJ5IHN0eWxlIGlzIHRoYXQgdGhlIHByb2dyYW0gaXMgYnJva2VuIGRvd24gaW4gYQpyZWFzb25hYmxlIHdheSwgYW5kIHRoYXQgYW4gZWZmb3J0IGlzIG1hZGUgdG8gbWFrZSBpdCB1bmRlcnN0YW5kYWJsZSBmb3IKYW5vdGhlciBwZXJzb24gd2hvIG1heSBjb21lIGFsb25nIGFuZCByZWFkIHRoZSBwcm9ncmFtLgoKVGhpcyBpcyBnb29kIGFkdmljZSwgYW5kIGl04oCZcyB0cnVlLCBidXQgaXQgZG9lc27igJl0IGdpdmUgeW91IGFueSBwcmFjdGljYWwKZXhhbXBsZXMuIEhlcmUgaXMgYW4gZXhhbXBsZSBvZiBzb21lIGNvZGUgd2l0aCBHb29kIFN0eWxl4oSiOgoKYGBgIHB5dGhvbgpkZWYgdG9fY3N2KHRpbWVsaW5lLCBmaWxlbmFtZSk6CgkiIiJUYWtlcyBhIHRpbWVsaW5lIChhcyBhIGxpc3Qgb2YgZGljdGlvbmFyaWVzKQoJd3JpdGVzIHRvIGZpbGUgaW4gY3N2IiIiCgoJd3JpdGVyID0gb3BlbihmaWxlbmFtZSwgInciKQoJZmllbGRuYW1lcyA9IFsnZGF0ZScsICdzaWduYWwnLCAndm9sdW1lJ10KCXdyaXRlci53cml0ZSgiJXMsICVzLCAlc24iICUgZmllbGRuYW1lcykKCglmb3IgdCBpbiB0aW1lbGluZToKCSAgICAgICB3cml0ZXIud3JpdGUoIiVzLCAlcywgJXNuIiAlIFt0LmRhdGUsIHQuc2lnbmFsLCB0LnZvbHVtZV0pCgl3cml0ZXIuY2xvc2UoKQpgYGAKCkdvb2QgdGhpbmdzOiBjb21tZW50IHVuZGVyIHRoZSBmdW5jdGlvbiBkZWZpbml0aW9uIHRoYXQgZGVzY3JpYmVzIHRoZSBpbnB1dCBhbmQKb3V0cHV0IG9mIHRoZSBmdW5jdGlvbiBpbiBwbGFpbiBFbmdsaXNoLiBWYXJpYWJsZXMgY3JlYXRlZCBhbmQgdGhlbiBwYXNzZWQgdG8KZnVuY3Rpb25zLCBzbyB0aGF0IGFwcHJvcHJpYXRlIG5hbWVzIGNhbiBiZSBhc3NpZ25lZCBhbmQgdGhlIGNvZGUgaXMgYWJsZSB0bwpzcGVhayBmb3IgaXRzZWxmLiBXaGl0ZXNwYWNlIGluIGJldHdlZW4gZWFjaCBsb2dpY2FsIGNodW5rOiBpbnN0YW50aWF0aW5nIHRoZQp3cml0ZXIsIHdyaXRpbmcgdGhlIGZpZWxkbmFtZXMsIHdyaXRpbmcgdGhlIHJvd3MsIGNsb3NpbmcgdGhlIHdyaXRlci4gT25lIGxhc3QKdGhpbmc6IE5ldmVyIGNvcHkgYW5kIHBhc3RlIHlvdXIgY29kZS4gV3JpdGUgYSBmdW5jdGlvbiwgY3JlYXRlIGEgY2xhc3MsIGFuZApjYWxsIGl0IG11bHRpcGxlIHBsYWNlcy4gT25jZSB5b3UgZmluZCB5b3Vyc2VsZiBjb3B5aW5nIGFuZCBwYXN0aW5nLCB5b3Ugc2hvdWxkCnNlcmlvdXNseSBjb25zaWRlciBpZiB5b3UgYXJlIG1ha2luZyB5b3VyIGNvZGUgaGFyZGVyIHRvIHJlYWQgYW5kIGRlYnVnLiBJCnByb21pc2UgaXQgd2lsbCBtYWtlIG1vcmUgd29yayBmb3IgeW91IGluIHRoZSBsb25nIHJ1biA5OSUgb2YgdGhlIHRpbWUuIFlvdQptaWdodCBsb29rIGF0IHRoaXMgY29kZSB0d28geWVhcnMgZnJvbSBub3cgb3IgcGFzcyBpdCBvZmYgdG8geW91ciBzdWNjZXNzb3IsIHNvCmhhdmluZyBHb29kIFN0eWxl4oSiIGlzIGEgbWF0dGVyIG9mIGNvdXJ0ZXN5LCBwcmFjdGljYWxpdHksIGFuZCB0aW1lIGVmZmljaWVuY3kuCgo+IDQpIEFzayBxdWVzdGlvbnMuIEV2ZXJ5b25lIGdldHMgc3R1Y2sgd2hlbiBsZWFybmluZyB0byBwcm9ncmFtIC0tIEkgcHJvbWlzZS4KSG93ZXZlciwgYSBiaWcgcGFydCBvZiBob3cgd2VsbCB5b3UgbGVhcm4gaXMgaG93IHlvdSByZXNwb25kIHdoZW4geW91IGdldApzdHVjay4gVHJ5IHRvIGFzayBnb29kIHF1ZXN0aW9ucyAtLSBvZnRlbiB0aGUgcHJvbWlzZSBvZiBmb3JtdWxhdGluZyBhbmQgYXNraW5nCnRoZSBxdWVzdGlvbiBhY3R1YWxseSBoZWxwcyBjbGFyaWZ5IHRoZSBwcm9ibGVtIHlvdSBhcmUgaGF2aW5nLgoKV2hlbiB5b3UgaGl0IGEgcHJvYmxlbSwgaGVyZSBpcyB0aGUgb3JkZXIgb2Ygc3RlcHMgeW91IHNob3VsZCB1c2UgdG8gdHJ5IHRvIGZpeCBpdDoKCjAuIEZpbmQgYSBjb2RpbmcgYnVkZHkuIFByZWZlcmFibHksIHNvbWVvbmUgd2hvIGhhcyBleHBlcmllbmNlIGluIGEgZGlmZmVyZW50IGFyZWEgb3IgaGFzIGEgZGlmZmVyZW50IGNvZGluZyBtaW5kc2V0IHRoYW4geW91LiBTb21lIG9mIHRoZSBlYXNpZXN0IHByb2JsZW1zIGNvdWxkIGJlIGZpeGVkIHJpZ2h0IGF3YXkuIFRha2UgdHVybnMgYmVpbmcgdGhlIG9uZSBhdCB0aGUga2V5Ym9hcmQgc28geW91IGJvdGggY2FuIGxlYXJuIGZyb20gZWFjaCBvdGhlci4gSSByZWFsbHkgbGlrZSBwYWlyIHByb2dyYW1taW5nIC0gaXQgcHJvZHVjZXMgY29kZSBnZW5lcmFsbHkgZmFzdGVyIGFuZCBtb3JlIGFjY3VyYXRlbHksIHVubGVzcyB5b3UgZG9u4oCZdCB3b3JrIHdlbGwgdG9nZXRoZXIuCgoxLiBTdG9wIGNvZGluZy4gVGFrZSBvdXQgYSBwaWVjZSBvZiBwYXBlci4gVGhpbmsgYWJvdXQgd2hhdCB5b3UgYXJlIGRvaW5nIGFuZCB0cnkgdG8gd3JpdGUgaXQgaW4gcGxhaW4gRW5nbGlzaCwgdXNlIGRpYWdyYW1zLCBvciBvdXRsaW5lIHRoZSBhbGdvcml0aG0uIFRoaXMgaXMgdGhlIG1vc3QgY3J1Y2lhbCBwYXJ0IG9mIHRoZXNlIHN0ZXBzLCBhcyB5b3Ugd2lsbCBsZWFybiBtb3JlIGFib3V0IHRoZSBwcm9ibGVtIGFuZCBiZSBhYmxlIHRvIGFydGljdWxhdGUgeW91ciBxdWVzdGlvbnMsIG9yIGV2ZW4gYW5zd2VyIHRoZW0geW91cnNlbGYuCgoyLiBBc2sgTXIuR29vZ2xlIGFuZCBTdGFjayBPdmVyZmxvdy4gU29tZW9uZSBtaWdodCBoYXZlIGFscmVhZHkgYW5zd2VyZWQgaXQhCgozLiBBc2sgc29tZW9uZSB3aXRoIG1vcmUgZXhwZXJpZW5jZSB0aGFuIHlvdS4gQXNrIHlvdXIgYm9zcywgYWR2aXNvciwgcHJvZmVzc29yLCBncmFkIHN0dWRlbnQsIHBvc3Rkb2MgZnJpZW5kLCB3aG9ldmVyLiBZb3UgcHJvYmFibHkgd2lsbCBoYXZlIGxlYXJuZWQgbW9yZSBhYm91dCB5b3VyIHByb2JsZW0gZnJvbSB0aGUgcHJldmlvdXMgc3RlcHMgc28geW91IGNhbiBhc2sgdGhlIHF1ZXN0aW9ucyBjbGVhcmx5IGFuZCB1bmRlcnN0YW5kIHRoZWlyIGFuc3dlcnMgZXZlbiBiZXR0ZXIuIElmIHlvdSB3YW50IHRvIGJlIGEgY29kaW5nIGd1cnUsIHRoZW4geW914oCZbGwgbmVlZCB0byBsZWFybiBob3cgdG8gc29sdmUgcHJvYmxlbXMgb24geW91ciBvd24uIElmIHlvdSBhbHdheXMgZ28gdG8gcGVvcGxlIHdobyBoYXZlIG1vcmUgZXhwZXJpZW5jZSBhbmQgZ2V0IGZlZCB0aGUgYW5zd2VyLCB5b3Ugd2lsbCBmYWlsIHRvIGxlYXJuIHRoYXQgdmFsdWFibGUgc2tpbGwuIEFzayBxdWVzdGlvbnMsIGJ1dCBhc2sgeW91cnNlbGYgZmlyc3QuCgo+IDUpIEZvY3VzIG9uIGZ1bi4gTGVhcm5pbmcgYSBuZXcgc2tpbGwgaXMgYWJvdXQgYSBtaWxsaW9uIHRpbWVzIG1vcmUgaW50ZXJlc3Rpbmcgd2hlbiBpdCBmZWVscyBmdW4uIFRoaXMgbWVhbnMgZmluZCBhIHdheSB0byB3b3JrIG9uIGl0IHRoYXQgZml0cyBpbiB5b3VyIHNjaGVkdWxlLCBidXQgb25lIHRoYXQgaXMgcmVhc29uYWJsZSBhbmQgbWFpbnRhaW5hYmxlLiBUaG9zZSBhcmUganVzdCBhIGZldyB0aXBzLCBidXQgdGhlIGJlc3Qgd2F5IHRvIGxlYXJuIGlzIHRvIGp1c3QgdG8gZ2V0IHN0YXJ0ZWQhIFdpdGggQ29kZUhTIHlvdSBzdGFydCB3cml0aW5nIHlvdXIgZmlyc3QgcHJvZ3JhbSBpbiBqdXN0IHR3byBtaW51dGVzLiDigJRKZXJlbXkgKGh0dHA6Ly9ibG9nLmNvZGVocy5jb20vKQoKSSByZWFsbHkgZW5qb3llZCB0aGlzIHNtYWxsIHNldCBvZiB0aWRiaXRzLCBhbmQgSSBob3BlIHlvdSBmaW5kIHRoZW0gdXNlZnVsLiDigJhUaWxsIG5leHQgdGltZS4uLgoKCg==","base64").toString()
  }
]
}).call(this,require("buffer").Buffer)
},{"buffer":15}],53:[function(require,module,exports){
(function (Buffer){
var templater = require('a-simple-templater')

var marked = require('marked')
var Handlebars = require('handlebars')

var posts = require('./posts.js')

var routes = [
  {
    url: '/post/:id',
    template: Buffer("PGg2PjxhIGhyZWY9Ii8iPmJhY2s8L2E+PC9oNj4KPGgxIGNrYXNzPSJibG9nLXRpdGxlIj57e3RpdGxlfX08L2gxPgo8aDY+Ynkga2FyaXNzYSBhdCB7e2RhdGV9fSBhYm91dCB7e2NhdGVnb3JpZXN9fQo8YSBjbGFzcz0iZGlzcXVzLWNvbW1lbnQtY291bnQiIGRhdGEtZGlzcXVzLXVybD0iaHR0cDovL2thcmlzc2FtY2suY29tIiBkYXRhLWRpc3F1cy1pZGVudGlmaWVyPSJ7e2Rpc3F1c319IiBocmVmPSIjZGlzcXVzX3RocmVhZCI+IGNvbW1lbnRzPC9hPjwvaDY+Cgp7e21hcmtkb3duIHRleHR9fQogICAgPGRpdiBjbGFzcz0icm93Ij4KCiAgICAgIDxpZnJhbWUgaWQ9InR3aXR0ZXItd2lkZ2V0LTAiIHNjcm9sbGluZz0ibm8iIGZyYW1lYm9yZGVyPSIwIiBhbGxvd3RyYW5zcGFyZW5jeT0idHJ1ZSIgc3JjPSJodHRwOi8vcGxhdGZvcm0udHdpdHRlci5jb20vd2lkZ2V0cy90d2VldF9idXR0b24uYjE2OWFhNzg4NzMxMjU1ZGQ1NWYxYmIyNDNiNjYwZTEuZW4uaHRtbCNfPTE0MzIxNDIxMzc3ODEmYW1wO2NvdW50PWhvcml6b250YWwmYW1wO2RudD1mYWxzZSZhbXA7aWQ9dHdpdHRlci13aWRnZXQtMCZhbXA7bGFuZz1lbiIgY2xhc3M9InR3aXR0ZXItc2hhcmUtYnV0dG9uIHR3aXR0ZXItdHdlZXQtYnV0dG9uIHR3aXR0ZXItc2hhcmUtYnV0dG9uIHR3aXR0ZXItY291bnQtaG9yaXpvbnRhbCIgdGl0bGU9IlR3aXR0ZXIgVHdlZXQgQnV0dG9uIiBkYXRhLXR3dHRyLXJlbmRlcmVkPSJ0cnVlIiBzdHlsZT0icG9zaXRpb246IHN0YXRpYzsgdmlzaWJpbGl0eTogdmlzaWJsZTsgd2lkdGg6IDkwcHg7IGhlaWdodDogMjBweDsiPjwvaWZyYW1lPgoKICAgICAgPGlmcmFtZSBpZD0idHdpdHRlci13aWRnZXQtMSIgc2Nyb2xsaW5nPSJubyIgZnJhbWVib3JkZXI9IjAiIGFsbG93dHJhbnNwYXJlbmN5PSJ0cnVlIiBzcmM9Imh0dHA6Ly9wbGF0Zm9ybS50d2l0dGVyLmNvbS93aWRnZXRzL2ZvbGxvd19idXR0b24uNTAwMDVmZTMzNjkxYWQxNTA0MWY3MTk5NDU3YWMzZTAuZW4uaHRtbCNfPTE0MzIxNDIxMzc3OTkmYW1wO2RudD1mYWxzZSZhbXA7aWQ9dHdpdHRlci13aWRnZXQtMSZhbXA7bGFuZz1lbiZhbXA7c2NyZWVuX25hbWU9a2FyaXNzYW1jayZhbXA7c2hvd19jb3VudD10cnVlJmFtcDtzaG93X3NjcmVlbl9uYW1lPXRydWUmYW1wO3NpemU9bSIgY2xhc3M9InR3aXR0ZXItZm9sbG93LWJ1dHRvbiB0d2l0dGVyLWZvbGxvdy1idXR0b24iIHRpdGxlPSJUd2l0dGVyIEZvbGxvdyBCdXR0b24iIGRhdGEtdHd0dHItcmVuZGVyZWQ9InRydWUiIHN0eWxlPSJwb3NpdGlvbjogc3RhdGljOyB2aXNpYmlsaXR5OiB2aXNpYmxlOyB3aWR0aDogMjE5cHg7IGhlaWdodDogMjBweDsiPjwvaWZyYW1lPgoKICAgIDwvZGl2PgogICAgPGRpdiBpZD0iZGlzcXVzX3RocmVhZCI+PC9kaXY+CiAgICA8YSBocmVmPSJodHRwOi8vZGlzcXVzLmNvbSIgY2xhc3M9ImRzcS1icmxpbmsiPmNvbW1lbnRzIHBvd2VyZWQgYnkgPHNwYW4gY2xhc3M9ImxvZ28tZGlzcXVzIj5EaXNxdXM8L3NwYW4+PC9hPgo8L2Rpdj4K","base64").toString(),
    data: function (params, cb) {
      var post = posts[params.id]
      post.disqus = post.disqus || '/post/' + post.id
      post.text = post.text
      cb(post)
    },
    onrender: function (params, data) {
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
  },
  {
    url: '/',
    template: Buffer("PGRpdiBjbGFzcz0iYmxvZyI+Cnt7I2VhY2ggcG9zdHN9fQo8ZGl2IGNsYXNzPSJyb3ciPgogIDxkaXYgY2xhc3M9InRlbiBjb2x1bW4iPgogICAgPGgyIGNsYXNzPSJibG9nLXRpdGxlIj48YSBocmVmPSIvcG9zdC97e2lkfX0iPnt7dGl0bGV9fTwvYT48L2gyPgogICAgPGg2PmJ5IGthcmlzc2EgYXQge3tkYXRlfX0gYWJvdXQge3tjYXRlZ29yaWVzfX08L2g2PgogICAgPGg2Pnt7b3ZlcnZpZXcgdGV4dH19IDxhIGhyZWY9Ii9wb3N0L3t7aWR9fSI+W3JlYWQgbW9yZV08L2E+PC9oNj4KICAgIDxocj4KICA8L2Rpdj4KPC9kaXY+Cnt7L2VhY2h9fQo8L2Rpdj4KCjxkaXYgY2xhc3M9InJvdyI+CjxpZnJhbWUgaWQ9InR3aXR0ZXItd2lkZ2V0LTEiIHNjcm9sbGluZz0ibm8iIGZyYW1lYm9yZGVyPSIwIiBhbGxvd3RyYW5zcGFyZW5jeT0idHJ1ZSIgc3JjPSJodHRwOi8vcGxhdGZvcm0udHdpdHRlci5jb20vd2lkZ2V0cy9mb2xsb3dfYnV0dG9uLjUwMDA1ZmUzMzY5MWFkMTUwNDFmNzE5OTQ1N2FjM2UwLmVuLmh0bWwjXz0xNDMyMTQyMTM3Nzk5JmFtcDtpZD10d2l0dGVyLXdpZGdldC0xJmFtcDtsYW5nPWVuJmFtcDtzY3JlZW5fbmFtZT1rYXJpc3NhbWNrJmFtcDtzaG93X2NvdW50PXRydWUmYW1wO3Nob3dfc2NyZWVuX25hbWU9dHJ1ZSZhbXA7c2l6ZT1tIiBjbGFzcz0idHdpdHRlci1mb2xsb3ctYnV0dG9uIHR3aXR0ZXItZm9sbG93LWJ1dHRvbiIgdGl0bGU9IlR3aXR0ZXIgRm9sbG93IEJ1dHRvbiIgZGF0YS10d3R0ci1yZW5kZXJlZD0idHJ1ZSIgc3R5bGU9InBvc2l0aW9uOiBzdGF0aWM7IHZpc2liaWxpdHk6IHZpc2libGU7IHdpZHRoOiAyNDlweDsgaGVpZ2h0OiAzMHB4OyI+PC9pZnJhbWU+CjwvZGl2Pg==","base64").toString(),
    data: function (params, cb)  {
      cb({
        posts: posts
      })
    }
  }
]

Handlebars.registerHelper('overview', function(passedString) {
  var endIndex = passedString.indexOf('<!-- more -->')
  if (endIndex === -1) endIndex = 300
  var theString = passedString.substring(0, endIndex);
  theString += "..."
  return new Handlebars.SafeString(marked(theString))
});

Handlebars.registerHelper('markdown', function(string) {
  return new Handlebars.SafeString(marked(string));
});

templater('#content', routes, function (source, data) {
  var template = Handlebars.compile(source)
  return template(data)
})

}).call(this,require("buffer").Buffer)
},{"./posts.js":52,"a-simple-templater":1,"buffer":15,"handlebars":39,"marked":51}]},{},[53]);