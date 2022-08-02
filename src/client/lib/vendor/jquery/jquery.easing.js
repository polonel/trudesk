/*
 * jQuery Easing Compatibility v1 - http://gsgd.co.uk/sandbox/jquery.easing.php
 *
 * Adds compatibility for applications that use the pre 1.2 easing names
 *
 * Copyright (c) 2007 George Smith
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 */

jQuery.extend(jQuery.easing, {
  easeIn: function (x, t, b, c, d) {
    return jQuery.easing.easeInQuad(x, t, b, c, d)
  },
  easeOut: function (x, t, b, c, d) {
    return jQuery.easing.easeOutQuad(x, t, b, c, d)
  },
  easeInOut: function (x, t, b, c, d) {
    return jQuery.easing.easeInOutQuad(x, t, b, c, d)
  },
  expoin: function (x, t, b, c, d) {
    return jQuery.easing.easeInExpo(x, t, b, c, d)
  },
  expoout: function (x, t, b, c, d) {
    return jQuery.easing.easeOutExpo(x, t, b, c, d)
  },
  expoinout: function (x, t, b, c, d) {
    return jQuery.easing.easeInOutExpo(x, t, b, c, d)
  },
  bouncein: function (x, t, b, c, d) {
    return jQuery.easing.easeInBounce(x, t, b, c, d)
  },
  bounceout: function (x, t, b, c, d) {
    return jQuery.easing.easeOutBounce(x, t, b, c, d)
  },
  bounceinout: function (x, t, b, c, d) {
    return jQuery.easing.easeInOutBounce(x, t, b, c, d)
  },
  elasin: function (x, t, b, c, d) {
    return jQuery.easing.easeInElastic(x, t, b, c, d)
  },
  elasout: function (x, t, b, c, d) {
    return jQuery.easing.easeOutElastic(x, t, b, c, d)
  },
  elasinout: function (x, t, b, c, d) {
    return jQuery.easing.easeInOutElastic(x, t, b, c, d)
  },
  backin: function (x, t, b, c, d) {
    return jQuery.easing.easeInBack(x, t, b, c, d)
  },
  backout: function (x, t, b, c, d) {
    return jQuery.easing.easeOutBack(x, t, b, c, d)
  },
  backinout: function (x, t, b, c, d) {
    return jQuery.easing.easeInOutBack(x, t, b, c, d)
  }
})

/*!
 * Bez v1.0.10-g5ae0136
 * http://github.com/rdallasgray/bez
 *
 * A plugin to convert CSS3 cubic-bezier co-ordinates to jQuery-compatible easing functions
 *
 * With thanks to Nikolay Nemshilov for clarification on the cubic-bezier maths
 * See http://st-on-it.blogspot.com/2011/05/calculating-cubic-bezier-function.html
 *
 * Copyright 2011 Robert Dallas Gray. All rights reserved.
 * Provided under the FreeBSD license: https://github.com/rdallasgray/bez/blob/master/LICENSE.txt
 */ jQuery.extend({
  bez: function (a) {
    var b =
      'bez_' +
      jQuery
        .makeArray(arguments)
        .join('_')
        .replace('.', 'p')
    if (typeof jQuery.easing[b] != 'function') {
      var c = function (a, b) {
        var c = [null, null],
          d = [null, null],
          e = [null, null],
          f = function (f, g) {
            return (
              (e[g] = 3 * a[g]),
              (d[g] = 3 * (b[g] - a[g]) - e[g]),
              (c[g] = 1 - e[g] - d[g]),
              f * (e[g] + f * (d[g] + f * c[g]))
            )
          },
          g = function (a) {
            return e[0] + a * (2 * d[0] + 3 * c[0] * a)
          },
          h = function (a) {
            var b = a,
              c = 0,
              d
            while (++c < 14) {
              d = f(b, 0) - a
              if (Math.abs(d) < 0.001) break
              b -= d / g(b)
            }
            return b
          }
        return function (a) {
          return f(h(a), 1)
        }
      }
      jQuery.easing[b] = function (b, d, e, f, g) {
        return f * c([a[0], a[1]], [a[2], a[3]])(d / g) + e
      }
    }
    return b
  }
})

/*! Copyright 2012, Ben Lin (http://dreamerslab.com/)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 1.0.19
 *
 * Requires: jQuery >= 1.2.3
 */
;(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register module depending on jQuery using requirejs define.
    define(['jquery'], factory)
  } else {
    // No AMD.
    factory(jQuery)
  }
})(function ($) {
  $.fn.addBack = $.fn.addBack || $.fn.andSelf

  $.fn.extend({
    actual: function (method, options) {
      // check if the jQuery method exist
      if (!this[method]) {
        throw '$.actual => The jQuery method "' + method + '" you called does not exist'
      }

      var defaults = {
        absolute: false,
        clone: false,
        includeMargin: false,
        display: 'block'
      }

      var configs = $.extend(defaults, options)

      var $target = this.eq(0)
      var fix, restore

      if (configs.clone === true) {
        fix = function () {
          var style = 'position: absolute !important; top: -1000 !important; '

          // this is useful with css3pie
          $target = $target
            .clone()
            .attr('style', style)
            .appendTo('body')
        }

        restore = function () {
          // remove DOM element after getting the width
          $target.remove()
        }
      } else {
        var tmp = []
        var style = ''
        var $hidden

        fix = function () {
          // get all hidden parents
          $hidden = $target
            .parents()
            .addBack()
            .filter(':hidden')
          style += 'visibility: hidden !important; display: ' + configs.display + ' !important; '

          if (configs.absolute === true) style += 'position: absolute !important; '

          // save the origin style props
          // set the hidden el css to be got the actual value later
          $hidden.each(function () {
            // Save original style. If no style was set, attr() returns undefined
            var $this = $(this)
            var thisStyle = $this.attr('style')

            tmp.push(thisStyle)
            // Retain as much of the original style as possible, if there is one
            $this.attr('style', thisStyle ? thisStyle + ';' + style : style)
          })
        }

        restore = function () {
          // restore origin style values
          $hidden.each(function (i) {
            var $this = $(this)
            var _tmp = tmp[i]

            if (_tmp === undefined) {
              $this.removeAttr('style')
            } else {
              $this.attr('style', _tmp)
            }
          })
        }
      }

      fix()
      // get the actual value with user specific methed
      // it can be 'width', 'height', 'outerWidth', 'innerWidth'... etc
      // configs.includeMargin only works for 'outerWidth' and 'outerHeight'
      var actual = /(outer)/.test(method) ? $target[method](configs.includeMargin) : $target[method]()

      restore()
      // IMPORTANT, this plugin only return the value of the first element
      return actual
    }
  })
})
