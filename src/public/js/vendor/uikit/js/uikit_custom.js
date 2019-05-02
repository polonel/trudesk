/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (core) {
  if (typeof define == 'function' && define.amd) {
    // AMD

    define('uikit', function () {
      var uikit = window.UIkit || core(window, window.jQuery, window.document)

      uikit.load = function (res, req, onload, config) {
        var resources = res.split(','),
          load = [],
          i,
          base = (config.config && config.config.uikit && config.config.uikit.base
            ? config.config.uikit.base
            : ''
          ).replace(/\/+$/g, '')

        if (!base) {
          throw new Error('Please define base path to UIkit in the requirejs config.')
        }

        for (i = 0; i < resources.length; i += 1) {
          var resource = resources[i].replace(/\./g, '/')
          load.push(base + '/components/' + resource)
        }

        req(load, function () {
          onload(uikit)
        })
      }

      return uikit
    })
  }

  if (!window.jQuery) {
    throw new Error('UIkit requires jQuery')
  }

  if (window && window.jQuery) {
    core(window, window.jQuery, window.document)
  }
})(function (global, $, doc) {
  'use strict'

  var UI = {},
    _UI = global.UIkit ? Object.create(global.UIkit) : undefined

  UI.version = '2.24.3'

  UI.noConflict = function () {
    // restore UIkit version
    if (_UI) {
      global.UIkit = _UI
      $.UIkit = _UI
      $.fn.uk = _UI.fn
    }

    return UI
  }

  UI.prefix = function (str) {
    return str
  }

  // cache jQuery
  UI.$ = $

  UI.$doc = UI.$(document)
  UI.$win = UI.$(window)
  UI.$html = UI.$('html')

  UI.support = {}
  UI.support.transition = (function () {
    var transitionEnd = (function () {
      var element = doc.body || doc.documentElement,
        transEndEventNames = {
          WebkitTransition: 'webkitTransitionEnd',
          MozTransition: 'transitionend',
          OTransition: 'oTransitionEnd otransitionend',
          transition: 'transitionend'
        },
        name

      for (name in transEndEventNames) {
        if (element.style[name] !== undefined) return transEndEventNames[name]
      }
    })()

    return transitionEnd && { end: transitionEnd }
  })()

  UI.support.animation = (function () {
    var animationEnd = (function () {
      var element = doc.body || doc.documentElement,
        animEndEventNames = {
          WebkitAnimation: 'webkitAnimationEnd',
          MozAnimation: 'animationend',
          OAnimation: 'oAnimationEnd oanimationend',
          animation: 'animationend'
        },
        name

      for (name in animEndEventNames) {
        if (element.style[name] !== undefined) return animEndEventNames[name]
      }
    })()

    return animationEnd && { end: animationEnd }
  })()

  // requestAnimationFrame polyfill
  //https://github.com/darius/requestAnimationFrame
  ;(function () {
    Date.now =
      Date.now ||
      function () {
        return new Date().getTime()
      }

    var vendors = ['webkit', 'moz']
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i]
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame']
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame']
    }
    if (
      /iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || // iOS6 is buggy
      !window.requestAnimationFrame ||
      !window.cancelAnimationFrame
    ) {
      var lastTime = 0
      window.requestAnimationFrame = function (callback) {
        var now = Date.now()
        var nextTime = Math.max(lastTime + 16, now)
        return setTimeout(function () {
          callback((lastTime = nextTime))
        }, nextTime - now)
      }
      window.cancelAnimationFrame = clearTimeout
    }
  })()

  UI.support.touch =
    'ontouchstart' in document ||
    (global.DocumentTouch && document instanceof global.DocumentTouch) ||
    (global.navigator.msPointerEnabled && global.navigator.msMaxTouchPoints > 0) || //IE 10
    (global.navigator.pointerEnabled && global.navigator.maxTouchPoints > 0) || //IE >=11
    false

  UI.support.mutationobserver = global.MutationObserver || global.WebKitMutationObserver || null

  UI.Utils = {}

  UI.Utils.isFullscreen = function () {
    return (
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      document.fullscreenElement ||
      false
    )
  }

  UI.Utils.str2json = function (str, notevil) {
    try {
      if (notevil) {
        return JSON.parse(
          str
            // wrap keys without quote with valid double quote
            .replace(/([\$\w]+)\s*:/g, function (_, $1) {
              return '"' + $1 + '":'
            })
            // replacing single quote wrapped ones to double quote
            .replace(/'([^']+)'/g, function (_, $1) {
              return '"' + $1 + '"'
            })
        )
      } else {
        return new Function('', 'var json = ' + str + '; return JSON.parse(JSON.stringify(json));')()
      }
    } catch (e) {
      return false
    }
  }

  UI.Utils.debounce = function (func, wait, immediate) {
    var timeout
    return function () {
      var context = this,
        args = arguments
      var later = function () {
        timeout = null
        if (!immediate) func.apply(context, args)
      }
      var callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(context, args)
    }
  }

  UI.Utils.removeCssRules = function (selectorRegEx) {
    var idx, idxs, stylesheet, _i, _j, _k, _len, _len1, _len2, _ref

    if (!selectorRegEx) return

    setTimeout(function () {
      try {
        _ref = document.styleSheets
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          stylesheet = _ref[_i]
          idxs = []
          stylesheet.cssRules = stylesheet.cssRules
          for (idx = _j = 0, _len1 = stylesheet.cssRules.length; _j < _len1; idx = ++_j) {
            if (
              stylesheet.cssRules[idx].type === CSSRule.STYLE_RULE &&
              selectorRegEx.test(stylesheet.cssRules[idx].selectorText)
            ) {
              idxs.unshift(idx)
            }
          }
          for (_k = 0, _len2 = idxs.length; _k < _len2; _k++) {
            stylesheet.deleteRule(idxs[_k])
          }
        }
      } catch (_error) {}
    }, 0)
  }

  UI.Utils.isInView = function (element, options) {
    var $element = $(element)

    if (!$element.is(':visible')) {
      return false
    }

    var window_left = UI.$win.scrollLeft(),
      window_top = UI.$win.scrollTop(),
      offset = $element.offset(),
      left = offset.left,
      top = offset.top

    options = $.extend({ topoffset: 0, leftoffset: 0 }, options)

    if (
      top + $element.height() >= window_top &&
      top - options.topoffset <= window_top + UI.$win.height() &&
      left + $element.width() >= window_left &&
      left - options.leftoffset <= window_left + UI.$win.width()
    ) {
      return true
    } else {
      return false
    }
  }

  UI.Utils.checkDisplay = function (context, initanimation) {
    var elements = UI.$(
        '[data-uk-margin], [data-uk-grid-match], [data-uk-grid-margin], [data-uk-check-display]',
        context || document
      ),
      animated

    if (context && !elements.length) {
      elements = $(context)
    }

    elements.trigger('display.uk.check')

    // fix firefox / IE animations
    if (initanimation) {
      if (typeof initanimation != 'string') {
        initanimation = '[class*="uk-animation-"]'
      }

      elements.find(initanimation).each(function () {
        var ele = UI.$(this),
          cls = ele.attr('class'),
          anim = cls.match(/uk\-animation\-(.+)/)

        ele.removeClass(anim[0]).width()

        ele.addClass(anim[0])
      })
    }

    return elements
  }

  UI.Utils.options = function (string) {
    if ($.type(string) != 'string') return string

    if (string.indexOf(':') != -1 && string.trim().substr(-1) != '}') {
      string = '{' + string + '}'
    }

    var start = string ? string.indexOf('{') : -1,
      options = {}

    if (start != -1) {
      try {
        options = UI.Utils.str2json(string.substr(start))
      } catch (e) {}
    }

    return options
  }

  UI.Utils.animate = function (element, cls) {
    var d = $.Deferred()

    element = UI.$(element)
    cls = cls

    element
      .css('display', 'none')
      .addClass(cls)
      .one(UI.support.animation.end, function () {
        element.removeClass(cls)
        d.resolve()
      })
      .width()

    element.css('display', '')

    return d.promise()
  }

  UI.Utils.uid = function (prefix) {
    return (prefix || 'id') + new Date().getTime() + 'RAND' + Math.ceil(Math.random() * 100000)
  }

  UI.Utils.template = function (str, data) {
    var tokens = str
        .replace(/\n/g, '\\n')
        .replace(/\{\{\{\s*(.+?)\s*\}\}\}/g, '{{!$1}}')
        .split(/(\{\{\s*(.+?)\s*\}\})/g),
      i = 0,
      toc,
      cmd,
      prop,
      val,
      fn,
      output = [],
      openblocks = 0

    while (i < tokens.length) {
      toc = tokens[i]

      if (toc.match(/\{\{\s*(.+?)\s*\}\}/)) {
        i = i + 1
        toc = tokens[i]
        cmd = toc[0]
        prop = toc.substring(toc.match(/^(\^|\#|\!|\~|\:)/) ? 1 : 0)

        switch (cmd) {
          case '~':
            output.push('for(var $i=0;$i<' + prop + '.length;$i++) { var $item = ' + prop + '[$i];')
            openblocks++
            break
          case ':':
            output.push('for(var $key in ' + prop + ') { var $val = ' + prop + '[$key];')
            openblocks++
            break
          case '#':
            output.push('if(' + prop + ') {')
            openblocks++
            break
          case '^':
            output.push('if(!' + prop + ') {')
            openblocks++
            break
          case '/':
            output.push('}')
            openblocks--
            break
          case '!':
            output.push('__ret.push(' + prop + ');')
            break
          default:
            output.push('__ret.push(escape(' + prop + '));')
            break
        }
      } else {
        output.push("__ret.push('" + toc.replace(/\'/g, "\\'") + "');")
      }
      i = i + 1
    }

    fn = new Function(
      '$data',
      [
        'var __ret = [];',
        'try {',
        'with($data){',
        !openblocks ? output.join('') : '__ret = ["Not all blocks are closed correctly."]',
        '};',
        '}catch(e){__ret = [e.message];}',
        'return __ret.join("").replace(/\\n\\n/g, "\\n");',
        "function escape(html) { return String(html).replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');}"
      ].join('\n')
    )

    return data ? fn(data) : fn
  }

  UI.Utils.events = {}
  UI.Utils.events.click = UI.support.touch ? 'tap' : 'click'

  global.UIkit = UI

  // deprecated

  UI.fn = function (command, options) {
    var args = arguments,
      cmd = command.match(/^([a-z\-]+)(?:\.([a-z]+))?/i),
      component = cmd[1],
      method = cmd[2]

    if (!UI[component]) {
      $.error('UIkit component [' + component + '] does not exist.')
      return this
    }

    return this.each(function () {
      var $this = $(this),
        data = $this.data(component)
      if (!data) $this.data(component, (data = UI[component](this, method ? undefined : options)))
      if (method) data[method].apply(data, Array.prototype.slice.call(args, 1))
    })
  }

  $.UIkit = UI
  $.fn.uk = UI.fn

  UI.langdirection = UI.$html.attr('dir') == 'rtl' ? 'right' : 'left'

  UI.components = {}

  UI.component = function (name, def) {
    var fn = function (element, options) {
      var $this = this

      this.UIkit = UI
      this.element = element ? UI.$(element) : null
      this.options = $.extend(true, {}, this.defaults, options)
      this.plugins = {}

      if (this.element) {
        this.element.data(name, this)
      }

      this.init()
      ;(this.options.plugins.length ? this.options.plugins : Object.keys(fn.plugins)).forEach(function (plugin) {
        if (fn.plugins[plugin].init) {
          fn.plugins[plugin].init($this)
          $this.plugins[plugin] = true
        }
      })

      this.trigger('init.uk.component', [name, this])

      return this
    }

    fn.plugins = {}

    $.extend(
      true,
      fn.prototype,
      {
        defaults: { plugins: [] },

        boot: function () {},
        init: function () {},

        on: function (a1, a2, a3) {
          return UI.$(this.element || this).on(a1, a2, a3)
        },

        one: function (a1, a2, a3) {
          return UI.$(this.element || this).one(a1, a2, a3)
        },

        off: function (evt) {
          return UI.$(this.element || this).off(evt)
        },

        trigger: function (evt, params) {
          return UI.$(this.element || this).trigger(evt, params)
        },

        find: function (selector) {
          return UI.$(this.element ? this.element : []).find(selector)
        },

        proxy: function (obj, methods) {
          var $this = this

          methods.split(' ').forEach(function (method) {
            if (!$this[method])
              $this[method] = function () {
                return obj[method].apply(obj, arguments)
              }
          })
        },

        mixin: function (obj, methods) {
          var $this = this

          methods.split(' ').forEach(function (method) {
            if (!$this[method]) $this[method] = obj[method].bind($this)
          })
        },

        option: function () {
          if (arguments.length == 1) {
            return this.options[arguments[0]] || undefined
          } else if (arguments.length == 2) {
            this.options[arguments[0]] = arguments[1]
          }
        }
      },
      def
    )

    this.components[name] = fn

    this[name] = function () {
      var element, options

      if (arguments.length) {
        switch (arguments.length) {
          case 1:
            if (typeof arguments[0] === 'string' || arguments[0].nodeType || arguments[0] instanceof jQuery) {
              element = $(arguments[0])
            } else {
              options = arguments[0]
            }

            break
          case 2:
            element = $(arguments[0])
            options = arguments[1]
            break
        }
      }

      if (element && element.data(name)) {
        return element.data(name)
      }

      return new UI.components[name](element, options)
    }

    if (UI.domready) {
      UI.component.boot(name)
    }

    return fn
  }

  UI.plugin = function (component, name, def) {
    this.components[component].plugins[name] = def
  }

  UI.component.boot = function (name) {
    if (UI.components[name].prototype && UI.components[name].prototype.boot && !UI.components[name].booted) {
      UI.components[name].prototype.boot.apply(UI, [])
      UI.components[name].booted = true
    }
  }

  UI.component.bootComponents = function () {
    for (var component in UI.components) {
      UI.component.boot(component)
    }
  }

  // DOM mutation save ready helper function

  UI.domObservers = []
  UI.domready = false

  UI.ready = function (fn) {
    UI.domObservers.push(fn)

    if (UI.domready) {
      fn(document)
    }
  }

  UI.on = function (a1, a2, a3) {
    if (a1 && a1.indexOf('ready.uk.dom') > -1 && UI.domready) {
      a2.apply(UI.$doc)
    }

    return UI.$doc.on(a1, a2, a3)
  }

  UI.one = function (a1, a2, a3) {
    if (a1 && a1.indexOf('ready.uk.dom') > -1 && UI.domready) {
      a2.apply(UI.$doc)
      return UI.$doc
    }

    return UI.$doc.one(a1, a2, a3)
  }

  UI.trigger = function (evt, params) {
    return UI.$doc.trigger(evt, params)
  }

  UI.domObserve = function (selector, fn) {
    if (!UI.support.mutationobserver) return

    fn = fn || function () {}

    UI.$(selector).each(function () {
      var element = this,
        $element = UI.$(element)

      if ($element.data('observer')) {
        return
      }

      try {
        var observer = new UI.support.mutationobserver(
          UI.Utils.debounce(function (mutations) {
            fn.apply(element, [])
            $element.trigger('changed.uk.dom')
          }, 50)
        )

        // pass in the target node, as well as the observer options
        observer.observe(element, { childList: true, subtree: true })

        $element.data('observer', observer)
      } catch (e) {}
    })
  }

  UI.init = function (root) {
    root = root || document

    UI.domObservers.forEach(function (fn) {
      fn(root)
    })
  }

  UI.on('domready.uk.dom', function () {
    UI.init()

    if (UI.domready) UI.Utils.checkDisplay()
  })

  document.addEventListener(
    'DOMContentLoaded',
    (function () {
      var domReady = function () {
        UI.$body = UI.$('body')

        UI.ready(function (context) {
          UI.domObserve('[data-uk-observe]')
        })

        UI.on('changed.uk.dom', function (e) {
          UI.init(e.target)
          UI.Utils.checkDisplay(e.target)
        })

        UI.trigger('beforeready.uk.dom')

        UI.component.bootComponents()

        // custom scroll observer
        requestAnimationFrame(
          (function () {
            var memory = { x: window.pageXOffset, y: window.pageYOffset },
              dir

            var fn = function () {
              if (memory.x != window.pageXOffset || memory.y != window.pageYOffset) {
                dir = { x: 0, y: 0 }

                if (window.pageXOffset != memory.x) dir.x = window.pageXOffset > memory.x ? 1 : -1
                if (window.pageYOffset != memory.y) dir.y = window.pageYOffset > memory.y ? 1 : -1

                memory = {
                  dir: dir,
                  x: window.pageXOffset,
                  y: window.pageYOffset
                }

                UI.$doc.trigger('scrolling.uk.document', [memory])
              }

              requestAnimationFrame(fn)
            }

            if (UI.support.touch) {
              UI.$html.on('touchmove touchend MSPointerMove MSPointerUp pointermove pointerup', fn)
            }

            if (memory.x || memory.y) fn()

            return fn
          })()
        )

        // run component init functions on dom
        UI.trigger('domready.uk.dom')

        if (UI.support.touch) {
          // remove css hover rules for touch devices
          // UI.Utils.removeCssRules(/\.uk-(?!navbar).*:hover/);

          // viewport unit fix for uk-height-viewport - should be fixed in iOS 8
          if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
            UI.$win.on(
              'load orientationchange resize',
              UI.Utils.debounce(
                (function () {
                  var fn = function () {
                    $('.uk-height-viewport').css('height', window.innerHeight)
                    return fn
                  }

                  return fn()
                })(),
                100
              )
            )
          }
        }

        UI.trigger('afterready.uk.dom')

        // mark that domready is left behind
        UI.domready = true
      }

      if (document.readyState == 'complete' || document.readyState == 'interactive') {
        setTimeout(domReady)
      }

      return domReady
    })()
  )

  // add touch identifier class
  UI.$html.addClass(UI.support.touch ? 'uk-touch' : 'uk-notouch')

  // add uk-hover class on tap to support overlays on touch devices
  if (UI.support.touch) {
    var hoverset = false,
      exclude,
      hovercls = 'uk-hover',
      selector = '.uk-overlay, .uk-overlay-hover, .uk-overlay-toggle, .uk-animation-hover, .uk-has-hover'

    UI.$html
      .on('mouseenter touchstart MSPointerDown pointerdown', selector, function () {
        if (hoverset) $('.' + hovercls).removeClass(hovercls)

        hoverset = $(this).addClass(hovercls)
      })
      .on('mouseleave touchend MSPointerUp pointerup', function (e) {
        exclude = $(e.target).parents(selector)

        if (hoverset) {
          hoverset.not(exclude).removeClass(hovercls)
        }
      })
  }

  return UI
})

//  Based on Zeptos touch.js
//  https://raw.github.com/madrobby/zepto/master/src/touch.js
//  Zepto.js may be freely distributed under the MIT license.
;(function ($) {
  if ($.fn.swipeLeft) {
    return
  }

  var touch = {},
    touchTimeout,
    tapTimeout,
    swipeTimeout,
    longTapTimeout,
    longTapDelay = 750,
    gesture

  function swipeDirection (x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : y1 - y2 > 0 ? 'Up' : 'Down'
  }

  function longTap () {
    longTapTimeout = null
    if (touch.last) {
      if (touch.el !== undefined) touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap () {
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  function cancelAll () {
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  function isPrimaryTouch (event) {
    return event.pointerType == event.MSPOINTER_TYPE_TOUCH && event.isPrimary
  }

  $(function () {
    var now,
      delta,
      deltaX = 0,
      deltaY = 0,
      firstTouch

    if ('MSGesture' in window) {
      gesture = new MSGesture()
      gesture.target = document.body
    }

    $(document)
      .on('MSGestureEnd gestureend', function (e) {
        var swipeDirectionFromVelocity =
          e.originalEvent.velocityX > 1
            ? 'Right'
            : e.originalEvent.velocityX < -1
            ? 'Left'
            : e.originalEvent.velocityY > 1
            ? 'Down'
            : e.originalEvent.velocityY < -1
            ? 'Up'
            : null

        if (swipeDirectionFromVelocity && touch.el !== undefined) {
          touch.el.trigger('swipe')
          touch.el.trigger('swipe' + swipeDirectionFromVelocity)
        }
      })
      // MSPointerDown: for IE10
      // pointerdown: for IE11
      .on('touchstart MSPointerDown pointerdown', function (e) {
        if (e.type == 'MSPointerDown' && !isPrimaryTouch(e.originalEvent)) return

        firstTouch = e.type == 'MSPointerDown' || e.type == 'pointerdown' ? e : e.originalEvent.touches[0]

        now = Date.now()
        delta = now - (touch.last || now)
        touch.el = $('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode)

        if (touchTimeout) clearTimeout(touchTimeout)

        touch.x1 = firstTouch.pageX
        touch.y1 = firstTouch.pageY

        if (delta > 0 && delta <= 250) touch.isDoubleTap = true

        touch.last = now
        longTapTimeout = setTimeout(longTap, longTapDelay)

        // adds the current touch contact for IE gesture recognition
        if (gesture && (e.type == 'MSPointerDown' || e.type == 'pointerdown' || e.type == 'touchstart')) {
          gesture.addPointer(e.originalEvent.pointerId)
        }
      })
      // MSPointerMove: for IE10
      // pointermove: for IE11
      .on('touchmove MSPointerMove pointermove', function (e) {
        if (e.type == 'MSPointerMove' && !isPrimaryTouch(e.originalEvent)) return

        firstTouch = e.type == 'MSPointerMove' || e.type == 'pointermove' ? e : e.originalEvent.touches[0]

        cancelLongTap()
        touch.x2 = firstTouch.pageX
        touch.y2 = firstTouch.pageY

        deltaX += Math.abs(touch.x1 - touch.x2)
        deltaY += Math.abs(touch.y1 - touch.y2)
      })
      // MSPointerUp: for IE10
      // pointerup: for IE11
      .on('touchend MSPointerUp pointerup', function (e) {
        if (e.type == 'MSPointerUp' && !isPrimaryTouch(e.originalEvent)) return

        cancelLongTap()

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) || (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)) {
          swipeTimeout = setTimeout(function () {
            if (touch.el !== undefined) {
              touch.el.trigger('swipe')
              touch.el.trigger('swipe' + swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2))
            }
            touch = {}
          }, 0)

          // normal tap
        } else if ('last' in touch) {
          // don't fire tap when delta position changed by more than 30 pixels,
          // for instance when moving to a point and back to origin
          if (isNaN(deltaX) || (deltaX < 30 && deltaY < 30)) {
            // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
            // ('tap' fires before 'scroll')
            tapTimeout = setTimeout(function () {
              // trigger universal 'tap' with the option to cancelTouch()
              // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
              var event = $.Event('tap')
              event.cancelTouch = cancelAll
              if (touch.el !== undefined) touch.el.trigger(event)

              // trigger double tap immediately
              if (touch.isDoubleTap) {
                if (touch.el !== undefined) touch.el.trigger('doubleTap')
                touch = {}
              }

              // trigger single tap after 250ms of inactivity
              else {
                touchTimeout = setTimeout(function () {
                  touchTimeout = null
                  if (touch.el !== undefined) touch.el.trigger('singleTap')
                  touch = {}
                }, 250)
              }
            }, 0)
          } else {
            touch = {}
          }
          deltaX = deltaY = 0
        }
      })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel', cancelAll)

    // scrolling the window indicates intention of the user
    // to scroll, not tap or swipe, so cancel all ongoing events
    $(window).on('scroll', cancelAll)
  })
  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(
    function (eventName) {
      $.fn[eventName] = function (callback) {
        return $(this).on(eventName, callback)
      }
    }
  )
})(jQuery)
;(function (UI) {
  'use strict'

  var stacks = []

  UI.component('stackMargin', {
    defaults: {
      cls: 'uk-margin-small-top',
      rowfirst: false
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-margin]', context).each(function () {
          var ele = UI.$(this),
            obj

          if (!ele.data('stackMargin')) {
            obj = UI.stackMargin(ele, UI.Utils.options(ele.attr('data-uk-margin')))
          }
        })
      })
    },

    init: function () {
      var $this = this

      this.columns = []

      UI.$win.on(
        'resize orientationchange',
        (function () {
          var fn = function () {
            $this.process()
          }

          UI.$(function () {
            fn()
            UI.$win.on('load', fn)
          })

          return UI.Utils.debounce(fn, 20)
        })()
      )

      UI.$html.on('changed.uk.dom', function (e) {
        $this.process()
      })

      this.on(
        'display.uk.check',
        function (e) {
          if (this.element.is(':visible')) this.process()
        }.bind(this)
      )

      stacks.push(this)
    },

    process: function () {
      var $this = this

      this.columns = this.element.children()

      UI.Utils.stackMargin(this.columns, this.options)

      if (!this.options.rowfirst) {
        return this
      }

      // Mark first column elements
      var pos_cache = this.columns
        .removeClass(this.options.rowfirst)
        .filter(':visible')
        .first()
        .position()

      if (pos_cache) {
        this.columns.each(function () {
          UI.$(this)[UI.$(this).position().left == pos_cache.left ? 'addClass' : 'removeClass']($this.options.rowfirst)
        })
      }

      return this
    },

    revert: function () {
      this.columns.removeClass(this.options.cls)
      return this
    }
  })

  // responsive element e.g. iframes
  ;(function () {
    var elements = [],
      check = function (ele) {
        if (!ele.is(':visible')) return

        var width = ele.parent().width(),
          iwidth = ele.data('width'),
          ratio = width / iwidth,
          height = Math.floor(ratio * ele.data('height'))

        ele.css({ height: width < iwidth ? height : ele.data('height') })
      }

    UI.component('responsiveElement', {
      defaults: {},

      boot: function () {
        // init code
        UI.ready(function (context) {
          UI.$('iframe.uk-responsive-width, [data-uk-responsive]', context).each(function () {
            var ele = UI.$(this),
              obj

            if (!ele.data('responsiveIframe')) {
              obj = UI.responsiveElement(ele, {})
            }
          })
        })
      },

      init: function () {
        var ele = this.element

        if (ele.attr('width') && ele.attr('height')) {
          ele
            .data({
              width: ele.attr('width'),
              height: ele.attr('height')
            })
            .on('display.uk.check', function () {
              check(ele)
            })

          check(ele)

          elements.push(ele)
        }
      }
    })

    UI.$win.on(
      'resize load',
      UI.Utils.debounce(function () {
        elements.forEach(function (ele) {
          check(ele)
        })
      }, 15)
    )
  })()

  // helper

  UI.Utils.stackMargin = function (elements, options) {
    options = UI.$.extend(
      {
        cls: 'uk-margin-small-top'
      },
      options
    )

    options.cls = options.cls

    elements = UI.$(elements).removeClass(options.cls)

    var skip = false,
      firstvisible = elements.filter(':visible:first'),
      offset = firstvisible.length ? firstvisible.position().top + firstvisible.outerHeight() - 1 : false // (-1): weird firefox bug when parent container is display:flex

    if (offset === false || elements.length == 1) return

    elements.each(function () {
      var column = UI.$(this)

      if (column.is(':visible')) {
        if (skip) {
          column.addClass(options.cls)
        } else {
          if (column.position().top >= offset) {
            skip = column.addClass(options.cls)
          }
        }
      }
    })
  }

  UI.Utils.matchHeights = function (elements, options) {
    elements = UI.$(elements).css('min-height', '')
    options = UI.$.extend({ row: true }, options)

    var matchHeights = function (group) {
      if (group.length < 2) return

      var max = 0

      group
        .each(function () {
          max = Math.max(max, UI.$(this).outerHeight())
        })
        .each(function () {
          var element = UI.$(this),
            height = max - (element.css('box-sizing') == 'border-box' ? 0 : element.outerHeight() - element.height())

          element.css('min-height', height + 'px')
        })
    }

    if (options.row) {
      elements.first().width() // force redraw

      setTimeout(function () {
        var lastoffset = false,
          group = []

        elements.each(function () {
          var ele = UI.$(this),
            offset = ele.offset().top

          if (offset != lastoffset && group.length) {
            matchHeights(UI.$(group))
            group = []
            offset = ele.offset().top
          }

          group.push(ele)
          lastoffset = offset
        })

        if (group.length) {
          matchHeights(UI.$(group))
        }
      }, 0)
    } else {
      matchHeights(elements)
    }
  }
  ;(function (cacheSvgs) {
    UI.Utils.inlineSvg = function (selector, root) {
      var images = UI.$(selector || 'img[src$=".svg"]', root || document).each(function () {
        var img = UI.$(this),
          src = img.attr('src')

        if (!cacheSvgs[src]) {
          var d = UI.$.Deferred()

          UI.$.get(src, { nc: Math.random() }, function (data) {
            d.resolve(UI.$(data).find('svg'))
          })

          cacheSvgs[src] = d.promise()
        }

        cacheSvgs[src].then(function (svg) {
          var $svg = UI.$(svg).clone()

          if (img.attr('id')) $svg.attr('id', img.attr('id'))
          if (img.attr('class')) $svg.attr('class', img.attr('class'))
          if (img.attr('style')) $svg.attr('style', img.attr('style'))

          if (img.attr('width')) {
            $svg.attr('width', img.attr('width'))
            if (!img.attr('height')) $svg.removeAttr('height')
          }

          if (img.attr('height')) {
            $svg.attr('height', img.attr('height'))
            if (!img.attr('width')) $svg.removeAttr('width')
          }

          img.replaceWith($svg)
        })
      })
    }

    // init code
    UI.ready(function (context) {
      UI.Utils.inlineSvg('[data-uk-svg]', context)
    })
  })({})
})(UIkit)
;(function (UI) {
  'use strict'

  UI.component('smoothScroll', {
    boot: function () {
      // init code
      UI.$html.on('click.smooth-scroll.uikit', '[data-uk-smooth-scroll]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('smoothScroll')) {
          var obj = UI.smoothScroll(ele, UI.Utils.options(ele.attr('data-uk-smooth-scroll')))
          ele.trigger('click')
        }

        return false
      })
    },

    init: function () {
      var $this = this

      this.on('click', function (e) {
        e.preventDefault()
        scrollToElement(UI.$(this.hash).length ? UI.$(this.hash) : UI.$('body'), $this.options)
      })
    }
  })

  function scrollToElement (ele, options) {
    options = UI.$.extend(
      {
        duration: 1000,
        transition: 'easeOutExpo',
        offset: 0,
        complete: function () {}
      },
      options
    )

    // get / set parameters
    var target = ele.offset().top - options.offset,
      docheight = UI.$doc.height(),
      winheight = window.innerHeight

    if (target + winheight > docheight) {
      target = docheight - winheight
    }

    // animate to target, fire callback when done
    UI.$('html,body')
      .stop()
      .animate({ scrollTop: target }, options.duration, options.transition)
      .promise()
      .done(options.complete)
  }

  UI.Utils.scrollToElement = scrollToElement

  if (!UI.$.easing.easeOutExpo) {
    UI.$.easing.easeOutExpo = function (x, t, b, c, d) {
      return t == d ? b + c : c * (-Math.pow(2, (-10 * t) / d) + 1) + b
    }
  }
})(UIkit)
;(function (UI) {
  'use strict'

  var $win = UI.$win,
    $doc = UI.$doc,
    scrollspies = [],
    checkScrollSpy = function () {
      for (var i = 0; i < scrollspies.length; i++) {
        window.requestAnimationFrame.apply(window, [scrollspies[i].check])
      }
    }

  UI.component('scrollspy', {
    defaults: {
      target: false,
      cls: 'uk-scrollspy-inview',
      initcls: 'uk-scrollspy-init-inview',
      topoffset: 0,
      leftoffset: 0,
      repeat: false,
      delay: 0
    },

    boot: function () {
      // listen to scroll and resize
      $doc.on('scrolling.uk.document', checkScrollSpy)
      $win.on('load resize orientationchange', UI.Utils.debounce(checkScrollSpy, 50))

      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-scrollspy]', context).each(function () {
          var element = UI.$(this)

          if (!element.data('scrollspy')) {
            var obj = UI.scrollspy(element, UI.Utils.options(element.attr('data-uk-scrollspy')))
          }
        })
      })
    },

    init: function () {
      var $this = this,
        inviewstate,
        initinview,
        togglecls = this.options.cls.split(/,/),
        fn = function () {
          var elements = $this.options.target ? $this.element.find($this.options.target) : $this.element,
            delayIdx = elements.length === 1 ? 1 : 0,
            toggleclsIdx = 0

          elements.each(function (idx) {
            var element = UI.$(this),
              inviewstate = element.data('inviewstate'),
              inview = UI.Utils.isInView(element, $this.options),
              toggle = element.data('ukScrollspyCls') || togglecls[toggleclsIdx].trim()

            if (inview && !inviewstate && !element.data('scrollspy-idle')) {
              if (!initinview) {
                element.addClass($this.options.initcls)
                $this.offset = element.offset()
                initinview = true

                element.trigger('init.uk.scrollspy')
              }

              element.data(
                'scrollspy-idle',
                setTimeout(function () {
                  element
                    .addClass('uk-scrollspy-inview')
                    .toggleClass(toggle)
                    .width()
                  element.trigger('inview.uk.scrollspy')

                  element.data('scrollspy-idle', false)
                  element.data('inviewstate', true)
                }, $this.options.delay * delayIdx)
              )

              delayIdx++
            }

            if (!inview && inviewstate && $this.options.repeat) {
              if (element.data('scrollspy-idle')) {
                clearTimeout(element.data('scrollspy-idle'))
              }

              element.removeClass('uk-scrollspy-inview').toggleClass(toggle)
              element.data('inviewstate', false)

              element.trigger('outview.uk.scrollspy')
            }

            toggleclsIdx = togglecls[toggleclsIdx + 1] ? toggleclsIdx + 1 : 0
          })
        }

      fn()

      this.check = fn

      scrollspies.push(this)
    }
  })

  var scrollspynavs = [],
    checkScrollSpyNavs = function () {
      for (var i = 0; i < scrollspynavs.length; i++) {
        window.requestAnimationFrame.apply(window, [scrollspynavs[i].check])
      }
    }

  UI.component('scrollspynav', {
    defaults: {
      cls: 'uk-active',
      closest: false,
      topoffset: 0,
      leftoffset: 0,
      smoothscroll: false
    },

    boot: function () {
      // listen to scroll and resize
      $doc.on('scrolling.uk.document', checkScrollSpyNavs)
      $win.on('resize orientationchange', UI.Utils.debounce(checkScrollSpyNavs, 50))

      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-scrollspy-nav]', context).each(function () {
          var element = UI.$(this)

          if (!element.data('scrollspynav')) {
            var obj = UI.scrollspynav(element, UI.Utils.options(element.attr('data-uk-scrollspy-nav')))
          }
        })
      })
    },

    init: function () {
      var ids = [],
        links = this.find("a[href^='#']").each(function () {
          if (this.getAttribute('href').trim() !== '#') ids.push(this.getAttribute('href'))
        }),
        targets = UI.$(ids.join(',')),
        clsActive = this.options.cls,
        clsClosest = this.options.closest || this.options.closest

      var $this = this,
        inviews,
        fn = function () {
          inviews = []

          for (var i = 0; i < targets.length; i++) {
            if (UI.Utils.isInView(targets.eq(i), $this.options)) {
              inviews.push(targets.eq(i))
            }
          }

          if (inviews.length) {
            var navitems,
              scrollTop = $win.scrollTop(),
              target = (function () {
                for (var i = 0; i < inviews.length; i++) {
                  if (inviews[i].offset().top >= scrollTop) {
                    return inviews[i]
                  }
                }
              })()

            if (!target) return

            if ($this.options.closest) {
              links
                .blur()
                .closest(clsClosest)
                .removeClass(clsActive)
              navitems = links
                .filter("a[href='#" + target.attr('id') + "']")
                .closest(clsClosest)
                .addClass(clsActive)
            } else {
              navitems = links
                .removeClass(clsActive)
                .filter("a[href='#" + target.attr('id') + "']")
                .addClass(clsActive)
            }

            $this.element.trigger('inview.uk.scrollspynav', [target, navitems])
          }
        }

      if (this.options.smoothscroll && UI.smoothScroll) {
        links.each(function () {
          UI.smoothScroll(this, $this.options.smoothscroll)
        })
      }

      fn()

      this.element.data('scrollspynav', this)

      this.check = fn
      scrollspynavs.push(this)
    }
  })
})(UIkit)
;(function (UI) {
  'use strict'

  var toggles = []

  UI.component('toggle', {
    defaults: {
      target: false,
      cls: 'uk-hidden',
      animation: false,
      duration: 200
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-toggle]', context).each(function () {
          var ele = UI.$(this)

          if (!ele.data('toggle')) {
            var obj = UI.toggle(ele, UI.Utils.options(ele.attr('data-uk-toggle')))
          }
        })

        setTimeout(function () {
          toggles.forEach(function (toggle) {
            toggle.getToggles()
          })
        }, 0)
      })
    },

    init: function () {
      var $this = this

      this.aria = this.options.cls.indexOf('uk-hidden') !== -1

      this.getToggles()

      this.on('click', function (e) {
        if ($this.element.is('a[href="#"]')) e.preventDefault()
        $this.toggle()
      })

      toggles.push(this)
    },

    toggle: function () {
      if (!this.totoggle.length) return

      if (this.options.animation && UI.support.animation) {
        var $this = this,
          animations = this.options.animation.split(',')

        if (animations.length == 1) {
          animations[1] = animations[0]
        }

        animations[0] = animations[0].trim()
        animations[1] = animations[1].trim()

        this.totoggle.css('animation-duration', this.options.duration + 'ms')

        this.totoggle.each(function () {
          var ele = UI.$(this)

          if (ele.hasClass($this.options.cls)) {
            ele.toggleClass($this.options.cls)

            UI.Utils.animate(ele, animations[0]).then(function () {
              ele.css('animation-duration', '')
              UI.Utils.checkDisplay(ele)
            })
          } else {
            UI.Utils.animate(this, animations[1] + ' uk-animation-reverse').then(function () {
              ele.toggleClass($this.options.cls).css('animation-duration', '')
              UI.Utils.checkDisplay(ele)
            })
          }
        })
      } else {
        this.totoggle.toggleClass(this.options.cls)
        UI.Utils.checkDisplay(this.totoggle)
      }

      this.updateAria()
    },

    getToggles: function () {
      this.totoggle = this.options.target ? UI.$(this.options.target) : []
      this.updateAria()
    },

    updateAria: function () {
      if (this.aria && this.totoggle.length) {
        this.totoggle.each(function () {
          UI.$(this).attr('aria-hidden', UI.$(this).hasClass('uk-hidden'))
        })
      }
    }
  })
})(UIkit)
;(function (UI) {
  'use strict'

  UI.component('alert', {
    defaults: {
      fade: true,
      duration: 200,
      trigger: '.uk-alert-close'
    },

    boot: function () {
      // init code
      UI.$html.on('click.alert.uikit', '[data-uk-alert]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('alert')) {
          var alert = UI.alert(ele, UI.Utils.options(ele.attr('data-uk-alert')))

          if (UI.$(e.target).is(alert.options.trigger)) {
            e.preventDefault()
            alert.close()
          }
        }
      })
    },

    init: function () {
      var $this = this

      this.on('click', this.options.trigger, function (e) {
        e.preventDefault()
        $this.close()
      })
    },

    close: function () {
      var element = this.trigger('close.uk.alert'),
        removeElement = function () {
          this.trigger('closed.uk.alert').remove()
        }.bind(this)

      if (this.options.fade) {
        element
          .css('overflow', 'hidden')
          .css('max-height', element.height())
          .animate(
            {
              height: 0,
              opacity: 0,
              'padding-top': 0,
              'padding-bottom': 0,
              'margin-top': 0,
              'margin-bottom': 0
            },
            this.options.duration,
            removeElement
          )
      } else {
        removeElement()
      }
    }
  })
})(UIkit)
;(function (UI) {
  'use strict'

  UI.component('buttonRadio', {
    defaults: {
      activeClass: 'uk-active',
      target: '.uk-button'
    },

    boot: function () {
      // init code
      UI.$html.on('click.buttonradio.uikit', '[data-uk-button-radio]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('buttonRadio')) {
          var obj = UI.buttonRadio(ele, UI.Utils.options(ele.attr('data-uk-button-radio'))),
            target = UI.$(e.target)

          if (target.is(obj.options.target)) {
            target.trigger('click')
          }
        }
      })
    },

    init: function () {
      var $this = this

      // Init ARIA
      this.find($this.options.target)
        .attr('aria-checked', 'false')
        .filter('.' + $this.options.activeClass)
        .attr('aria-checked', 'true')

      this.on('click', this.options.target, function (e) {
        var ele = UI.$(this)

        if (ele.is('a[href="#"]')) e.preventDefault()

        $this
          .find($this.options.target)
          .not(ele)
          .removeClass($this.options.activeClass)
          .blur()
        ele.addClass($this.options.activeClass)

        // Update ARIA
        $this
          .find($this.options.target)
          .not(ele)
          .attr('aria-checked', 'false')
        ele.attr('aria-checked', 'true')

        $this.trigger('change.uk.button', [ele])
      })
    },

    getSelected: function () {
      return this.find('.' + this.options.activeClass)
    }
  })

  UI.component('buttonCheckbox', {
    defaults: {
      activeClass: 'uk-active',
      target: '.uk-button'
    },

    boot: function () {
      UI.$html.on('click.buttoncheckbox.uikit', '[data-uk-button-checkbox]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('buttonCheckbox')) {
          var obj = UI.buttonCheckbox(ele, UI.Utils.options(ele.attr('data-uk-button-checkbox'))),
            target = UI.$(e.target)

          if (target.is(obj.options.target)) {
            target.trigger('click')
          }
        }
      })
    },

    init: function () {
      var $this = this

      // Init ARIA
      this.find($this.options.target)
        .attr('aria-checked', 'false')
        .filter('.' + $this.options.activeClass)
        .attr('aria-checked', 'true')

      this.on('click', this.options.target, function (e) {
        var ele = UI.$(this)

        if (ele.is('a[href="#"]')) e.preventDefault()

        ele.toggleClass($this.options.activeClass).blur()

        // Update ARIA
        ele.attr('aria-checked', ele.hasClass($this.options.activeClass))

        $this.trigger('change.uk.button', [ele])
      })
    },

    getSelected: function () {
      return this.find('.' + this.options.activeClass)
    }
  })

  UI.component('button', {
    defaults: {},

    boot: function () {
      UI.$html.on('click.button.uikit', '[data-uk-button]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('button')) {
          var obj = UI.button(ele, UI.Utils.options(ele.attr('data-uk-button')))
          ele.trigger('click')
        }
      })
    },

    init: function () {
      var $this = this

      // Init ARIA
      this.element.attr('aria-pressed', this.element.hasClass('uk-active'))

      this.on('click', function (e) {
        if ($this.element.is('a[href="#"]')) e.preventDefault()

        $this.toggle()
        $this.trigger('change.uk.button', [$this.element.blur().hasClass('uk-active')])
      })
    },

    toggle: function () {
      this.element.toggleClass('uk-active')

      // Update ARIA
      this.element.attr('aria-pressed', this.element.hasClass('uk-active'))
    }
  })
})(UIkit)
;(function (UI) {
  'use strict'

  var active = false,
    hoverIdle,
    flips = {
      x: {
        'bottom-left': 'bottom-right',
        'bottom-right': 'bottom-left',
        'bottom-center': 'bottom-right',
        'top-left': 'top-right',
        'top-right': 'top-left',
        'top-center': 'top-right',
        'left-top': 'right',
        'left-bottom': 'right-bottom',
        'left-center': 'right-center',
        'right-top': 'left',
        'right-bottom': 'left-bottom',
        'right-center': 'left-center'
      },
      y: {
        'bottom-left': 'top-left',
        'bottom-right': 'top-right',
        'bottom-center': 'top-center',
        'top-left': 'bottom-left',
        'top-right': 'bottom-right',
        'top-center': 'bottom-center',
        'left-top': 'top-left',
        'left-bottom': 'left-bottom',
        'left-center': 'top-left',
        'right-top': 'top-left',
        'right-bottom': 'bottom-left',
        'right-center': 'top-left'
      },
      xy: {}
    }

  UI.component('dropdown', {
    defaults: {
      mode: 'hover',
      pos: 'bottom-left',
      offset: 0,
      remaintime: 800,
      justify: false,
      boundary: UI.$win,
      delay: 0,
      dropdownSelector: '.uk-dropdown,.uk-dropdown-blank',
      hoverDelayIdle: 250,
      preventflip: false
    },

    remainIdle: false,

    boot: function () {
      var triggerevent = UI.support.touch ? 'click' : 'mouseenter'

      // init code
      UI.$html.on(triggerevent + '.dropdown.uikit', '[data-uk-dropdown]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('dropdown')) {
          var dropdown = UI.dropdown(ele, UI.Utils.options(ele.attr('data-uk-dropdown')))

          if (triggerevent == 'click' || (triggerevent == 'mouseenter' && dropdown.options.mode == 'hover')) {
            dropdown.element.trigger(triggerevent)
          }

          if (dropdown.element.find(dropdown.options.dropdownSelector).length) {
            e.preventDefault()
          }
        }
      })
    },

    init: function () {
      var $this = this

      this.dropdown = this.find(this.options.dropdownSelector)
      this.offsetParent = this.dropdown
        .parents()
        .filter(function () {
          return UI.$.inArray(UI.$(this).css('position'), ['relative', 'fixed', 'absolute']) !== -1
        })
        .slice(0, 1)

      this.centered = this.dropdown.hasClass('uk-dropdown-center')
      this.justified = this.options.justify ? UI.$(this.options.justify) : false

      this.boundary = UI.$(this.options.boundary)

      if (!this.boundary.length) {
        this.boundary = UI.$win
      }

      // legacy DEPRECATED!
      if (this.dropdown.hasClass('uk-dropdown-up')) {
        this.options.pos = 'top-left'
      }
      if (this.dropdown.hasClass('uk-dropdown-flip')) {
        this.options.pos = this.options.pos.replace('left', 'right')
      }
      if (this.dropdown.hasClass('uk-dropdown-center')) {
        this.options.pos = this.options.pos.replace(/(left|right)/, 'center')
      }
      //-- end legacy

      // Init ARIA
      this.element.attr('aria-haspopup', 'true')
      this.element.attr('aria-expanded', this.element.hasClass('uk-open'))

      if (this.options.mode == 'click' || UI.support.touch) {
        this.on('click.uikit.dropdown', function (e) {
          var $target = UI.$(e.target)

          if (!$target.parents($this.options.dropdownSelector).length) {
            if (
              $target.is("a[href='#']") ||
              $target.parent().is("a[href='#']") ||
              ($this.dropdown.length && !$this.dropdown.is(':visible'))
            ) {
              e.preventDefault()
            }

            $target.blur()
          }

          if (!$this.element.hasClass('uk-open')) {
            $this.show()
          } else {
            if (
              !$this.dropdown.find(e.target).length ||
              $target.is('.uk-dropdown-close') ||
              $target.parents('.uk-dropdown-close').length
            ) {
              $this.hide()
            }
          }
        })
      } else {
        this.on('mouseenter', function (e) {
          $this.trigger('pointerenter.uk.dropdown', [$this])

          if ($this.remainIdle) {
            clearTimeout($this.remainIdle)
          }

          if (hoverIdle) {
            clearTimeout(hoverIdle)
          }

          if (active && active == $this) {
            return
          }

          // pseudo manuAim
          if (active && active != $this) {
            hoverIdle = setTimeout(function () {
              hoverIdle = setTimeout($this.show.bind($this), $this.options.delay)
            }, $this.options.hoverDelayIdle)
          } else {
            hoverIdle = setTimeout($this.show.bind($this), $this.options.delay)
          }
        })
          .on('mouseleave', function () {
            if (hoverIdle) {
              clearTimeout(hoverIdle)
            }

            $this.remainIdle = setTimeout(function () {
              if (active && active == $this) $this.hide()
            }, $this.options.remaintime)

            $this.trigger('pointerleave.uk.dropdown', [$this])
          })
          .on('click', function (e) {
            var $target = UI.$(e.target)

            if ($this.remainIdle) {
              clearTimeout($this.remainIdle)
            }

            if (active && active == $this) {
              if (
                !$this.dropdown.find(e.target).length ||
                $target.is('.uk-dropdown-close') ||
                $target.parents('.uk-dropdown-close').length
              ) {
                $this.hide()
              }
              return
            }

            if ($target.is("a[href='#']") || $target.parent().is("a[href='#']")) {
              e.preventDefault()
            }

            $this.show()
          })
      }
    },

    show: function () {
      UI.$html.off('click.outer.dropdown')

      if (active && active != this) {
        active.hide(true)
      }

      if (hoverIdle) {
        clearTimeout(hoverIdle)
      }

      this.trigger('beforeshow.uk.dropdown', [this])

      this.checkDimensions()
      this.element.addClass('uk-open')

      // Update ARIA
      this.element.attr('aria-expanded', 'true')

      this.trigger('show.uk.dropdown', [this])

      UI.Utils.checkDisplay(this.dropdown, true)
      active = this

      this.registerOuterClick()
    },

    hide: function (force) {
      this.trigger('beforehide.uk.dropdown', [this, force])

      this.element.removeClass('uk-open')

      if (this.remainIdle) {
        clearTimeout(this.remainIdle)
      }

      this.remainIdle = false

      // Update ARIA
      this.element.attr('aria-expanded', 'false')

      this.trigger('hide.uk.dropdown', [this, force])

      if (active == this) active = false
    },

    registerOuterClick: function () {
      var $this = this

      UI.$html.off('click.outer.dropdown')

      setTimeout(function () {
        UI.$html.on('click.outer.dropdown', function (e) {
          if (hoverIdle) {
            clearTimeout(hoverIdle)
          }

          var $target = UI.$(e.target)

          if (active == $this && !$this.element.find(e.target).length) {
            $this.hide(true)
            UI.$html.off('click.outer.dropdown')
          }
        })
      }, 10)
    },

    checkDimensions: function () {
      if (!this.dropdown.length) return

      // reset
      this.dropdown
        .removeClass('uk-dropdown-top uk-dropdown-bottom uk-dropdown-left uk-dropdown-right uk-dropdown-stack')
        .css({
          'top-left': '',
          left: '',
          'margin-left': '',
          'margin-right': ''
        })

      if (this.justified && this.justified.length) {
        this.dropdown.css('min-width', '')
      }

      var $this = this,
        pos = UI.$.extend({}, this.offsetParent.offset(), {
          width: this.offsetParent[0].offsetWidth,
          height: this.offsetParent[0].offsetHeight
        }),
        posoffset = this.options.offset,
        dropdown = this.dropdown,
        offset = dropdown.show().offset() || { left: 0, top: 0 },
        width = dropdown.outerWidth(),
        height = dropdown.outerHeight(),
        boundarywidth = this.boundary.width(),
        boundaryoffset =
          this.boundary[0] !== window && this.boundary.offset() ? this.boundary.offset() : { top: 0, left: 0 },
        dpos = this.options.pos

      var variants = {
          'bottom-left': { top: 0 + pos.height + posoffset, left: 0 },
          'bottom-right': { top: 0 + pos.height + posoffset, left: 0 + pos.width - width },
          'bottom-center': { top: 0 + pos.height + posoffset, left: 0 + pos.width / 2 - width / 2 },
          'top-left': { top: 0 - height - posoffset, left: 0 },
          'top-right': { top: 0 - height - posoffset, left: 0 + pos.width - width },
          'top-center': { top: 0 - height - posoffset, left: 0 + pos.width / 2 - width / 2 },
          'left-top': { top: 0, left: 0 - width - posoffset },
          'left-bottom': { top: 0 + pos.height - height, left: 0 - width - posoffset },
          'left-center': { top: 0 + pos.height / 2 - height / 2, left: 0 - width - posoffset },
          'right-top': { top: 0, left: 0 + pos.width + posoffset },
          'right-bottom': { top: 0 + pos.height - height, left: 0 + pos.width + posoffset },
          'right-center': { top: 0 + pos.height / 2 - height / 2, left: 0 + pos.width + posoffset }
        },
        css = {},
        pp

      pp = dpos.split('-')
      css = variants[dpos] ? variants[dpos] : variants['bottom-left']

      // justify dropdown
      if (this.justified && this.justified.length) {
        justify(dropdown.css({ left: 0 }), this.justified, boundarywidth)
      } else {
        if (this.options.preventflip !== true) {
          var fdpos

          switch (this.checkBoundary(pos.left + css.left, pos.top + css.top, width, height, boundarywidth)) {
            case 'x':
              if (this.options.preventflip !== 'x') fdpos = flips['x'][dpos] || 'right-top'
              break
            case 'y':
              if (this.options.preventflip !== 'y') fdpos = flips['y'][dpos] || 'top-left'
              break
            case 'xy':
              if (!this.options.preventflip) fdpos = flips['xy'][dpos] || 'right-bottom'
              break
          }

          if (fdpos) {
            pp = fdpos.split('-')
            css = variants[fdpos] ? variants[fdpos] : variants['bottom-left']

            // check flipped
            if (this.checkBoundary(pos.left + css.left, pos.top + css.top, width, height, boundarywidth)) {
              pp = dpos.split('-')
              css = variants[dpos] ? variants[dpos] : variants['bottom-left']
            }
          }
        }
      }

      if (width > boundarywidth) {
        dropdown.addClass('uk-dropdown-stack')
        this.trigger('stack.uk.dropdown', [this])
      }

      dropdown
        .css(css)
        .css('display', '')
        .addClass('uk-dropdown-' + pp[0])
    },

    checkBoundary: function (left, top, width, height, boundarywidth) {
      var axis = ''

      if (left < 0 || left - UI.$win.scrollLeft() + width > boundarywidth) {
        axis += 'x'
      }

      if (top - UI.$win.scrollTop() < 0 || top - UI.$win.scrollTop() + height > window.innerHeight) {
        axis += 'y'
      }

      return axis
    }
  })

  UI.component('dropdownOverlay', {
    defaults: {
      justify: false,
      cls: '',
      duration: 200
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-dropdown-overlay]', context).each(function () {
          var ele = UI.$(this)

          if (!ele.data('dropdownOverlay')) {
            UI.dropdownOverlay(ele, UI.Utils.options(ele.attr('data-uk-dropdown-overlay')))
          }
        })
      })
    },

    init: function () {
      var $this = this

      this.justified = this.options.justify ? UI.$(this.options.justify) : false
      this.overlay = this.element.find('uk-dropdown-overlay')

      if (!this.overlay.length) {
        this.overlay = UI.$('<div class="uk-dropdown-overlay"></div>').appendTo(this.element)
      }

      this.overlay.addClass(this.options.cls)

      this.on({
        'beforeshow.uk.dropdown': function (e, dropdown) {
          $this.dropdown = dropdown

          if ($this.justified && $this.justified.length) {
            justify(
              $this.overlay.css({ display: 'block', 'margin-left': '', 'margin-right': '' }),
              $this.justified,
              $this.justified.outerWidth()
            )
          }
        },

        'show.uk.dropdown': function (e, dropdown) {
          var h = $this.dropdown.dropdown.outerHeight(true)

          $this.dropdown.element.removeClass('uk-open')

          $this.overlay
            .stop()
            .css('display', 'block')
            .animate({ height: h }, $this.options.duration, function () {
              $this.dropdown.dropdown.css('visibility', '')
              $this.dropdown.element.addClass('uk-open')

              UI.Utils.checkDisplay($this.dropdown.dropdown, true)
            })

          $this.pointerleave = false
        },

        'hide.uk.dropdown': function () {
          $this.overlay.stop().animate({ height: 0 }, $this.options.duration)
        },

        'pointerenter.uk.dropdown': function (e, dropdown) {
          clearTimeout($this.remainIdle)
        },

        'pointerleave.uk.dropdown': function (e, dropdown) {
          $this.pointerleave = true
        }
      })

      this.overlay.on({
        mouseenter: function () {
          if ($this.remainIdle) {
            clearTimeout($this.dropdown.remainIdle)
            clearTimeout($this.remainIdle)
          }
        },

        mouseleave: function () {
          if ($this.pointerleave && active) {
            $this.remainIdle = setTimeout(function () {
              if (active) active.hide()
            }, active.options.remaintime)
          }
        }
      })
    }
  })

  function justify (ele, justifyTo, boundarywidth, offset) {
    ele = UI.$(ele)
    justifyTo = UI.$(justifyTo)
    boundarywidth = boundarywidth || window.innerWidth
    offset = offset || ele.offset()

    if (justifyTo.length) {
      var jwidth = justifyTo.outerWidth()

      ele.css('min-width', jwidth)

      if (UI.langdirection == 'right') {
        var right1 = boundarywidth - (justifyTo.offset().left + jwidth),
          right2 = boundarywidth - (ele.offset().left + ele.outerWidth())

        ele.css('margin-right', right1 - right2)
      } else {
        ele.css('margin-left', justifyTo.offset().left - offset.left)
      }
    }
  }
})(UIkit)
;(function (UI) {
  'use strict'

  var grids = []

  UI.component('gridMatchHeight', {
    defaults: {
      target: false,
      row: true,
      ignorestacked: false
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-grid-match]', context).each(function () {
          var grid = UI.$(this),
            obj

          if (!grid.data('gridMatchHeight')) {
            obj = UI.gridMatchHeight(grid, UI.Utils.options(grid.attr('data-uk-grid-match')))
          }
        })
      })
    },

    init: function () {
      var $this = this

      this.columns = this.element.children()
      this.elements = this.options.target ? this.find(this.options.target) : this.columns

      if (!this.columns.length) return

      UI.$win.on(
        'load resize orientationchange',
        (function () {
          var fn = function () {
            $this.match()
          }

          UI.$(function () {
            fn()
          })

          return UI.Utils.debounce(fn, 50)
        })()
      )

      UI.$html.on('changed.uk.dom', function (e) {
        $this.columns = $this.element.children()
        $this.elements = $this.options.target ? $this.find($this.options.target) : $this.columns
        $this.match()
      })

      this.on(
        'display.uk.check',
        function (e) {
          if (this.element.is(':visible')) this.match()
        }.bind(this)
      )

      grids.push(this)
    },

    match: function () {
      var firstvisible = this.columns.filter(':visible:first')

      if (!firstvisible.length) return

      var stacked =
        Math.ceil((100 * parseFloat(firstvisible.css('width'))) / parseFloat(firstvisible.parent().css('width'))) >= 100

      if (stacked && !this.options.ignorestacked) {
        this.revert()
      } else {
        UI.Utils.matchHeights(this.elements, this.options)
      }

      return this
    },

    revert: function () {
      this.elements.css('min-height', '')
      return this
    }
  })

  UI.component('gridMargin', {
    defaults: {
      cls: 'uk-grid-margin',
      rowfirst: 'uk-row-first'
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-grid-margin]', context).each(function () {
          var grid = UI.$(this),
            obj

          if (!grid.data('gridMargin')) {
            obj = UI.gridMargin(grid, UI.Utils.options(grid.attr('data-uk-grid-margin')))
          }
        })
      })
    },

    init: function () {
      var stackMargin = UI.stackMargin(this.element, this.options)
    }
  })
})(UIkit)
/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (UI) {
  'use strict'

  var active = false,
    activeCount = 0,
    $html = UI.$html,
    body

  UI.component('modal', {
    defaults: {
      keyboard: true,
      bgclose: true,
      minScrollHeight: 150,
      center: false,
      modal: true
    },

    scrollable: false,
    transition: false,
    hasTransitioned: true,

    init: function () {
      if (!body) body = UI.$('body')

      if (!this.element.length) return

      var $this = this

      this.paddingdir = 'padding-' + (UI.langdirection == 'left' ? 'right' : 'left')
      this.dialog = this.find('.uk-modal-dialog')

      this.active = false

      // Update ARIA
      this.element.attr('aria-hidden', this.element.hasClass('uk-open'))

      this.on('click', '.uk-modal-close', function (e) {
        e.preventDefault()
        $this.hide()
      }).on('click', function (e) {
        var target = UI.$(e.target)

        if (target[0] == $this.element[0] && $this.options.bgclose) {
          $this.hide()
        }
      })
    },

    toggle: function () {
      return this[this.isActive() ? 'hide' : 'show']()
    },

    show: function () {
      if (!this.element.length) return

      var $this = this

      if (this.isActive()) return

      if (this.options.modal && active) {
        active.hide(true)
      }

      this.element.removeClass('uk-open').show()
      this.resize()

      if (this.options.modal) {
        active = this
      }

      this.active = true

      activeCount++

      if (UI.support.transition) {
        this.hasTransitioned = false
        this.element
          .one(UI.support.transition.end, function () {
            $this.hasTransitioned = true
          })
          .addClass('uk-open')
      } else {
        this.element.addClass('uk-open')
      }

      $html.addClass('uk-modal-page').height() // force browser engine redraw

      // Update ARIA
      this.element.attr('aria-hidden', 'false')

      this.element.trigger('show.uk.modal')

      UI.Utils.checkDisplay(this.dialog, true)

      return this
    },

    hide: function (force) {
      if (!force && UI.support.transition && this.hasTransitioned) {
        var $this = this

        this.one(UI.support.transition.end, function () {
          $this._hide()
        }).removeClass('uk-open')
      } else {
        this._hide()
      }

      return this
    },

    resize: function () {
      var bodywidth = body.width()

      this.scrollbarwidth = window.innerWidth - bodywidth

      body.css(this.paddingdir, this.scrollbarwidth)

      this.element.css('overflow-y', this.scrollbarwidth ? 'scroll' : 'auto')

      if (!this.updateScrollable() && this.options.center) {
        var dh = this.dialog.outerHeight(),
          pad = parseInt(this.dialog.css('margin-top'), 10) + parseInt(this.dialog.css('margin-bottom'), 10)

        if (dh + pad < window.innerHeight) {
          this.dialog.css({ top: window.innerHeight / 2 - dh / 2 - pad })
        } else {
          this.dialog.css({ top: '' })
        }
      }
    },

    updateScrollable: function () {
      // has scrollable?
      var scrollable = this.dialog.find('.uk-overflow-container:visible:first')

      if (scrollable.length) {
        scrollable.css('height', 0)

        var offset = Math.abs(parseInt(this.dialog.css('margin-top'), 10)),
          dh = this.dialog.outerHeight(),
          wh = window.innerHeight,
          h = wh - 2 * (offset < 20 ? 20 : offset) - dh

        scrollable.css({
          'max-height': h < this.options.minScrollHeight ? '' : h,
          height: ''
        })

        return true
      }

      return false
    },

    _hide: function () {
      this.active = false
      if (activeCount > 0) activeCount--
      else activeCount = 0

      this.element.hide().removeClass('uk-open')

      // Update ARIA
      this.element.attr('aria-hidden', 'true')

      if (!activeCount) {
        $html.removeClass('uk-modal-page')
        body.css(this.paddingdir, '')
      }

      if (active === this) active = false

      this.trigger('hide.uk.modal')
    },

    isActive: function () {
      return this.active
    }
  })

  UI.component('modalTrigger', {
    boot: function () {
      // init code
      UI.$html.on('click.modal.uikit', '[data-uk-modal]', function (e) {
        var ele = UI.$(this)

        if (ele.is('a')) {
          e.preventDefault()
        }

        if (!ele.data('modalTrigger')) {
          var modal = UI.modalTrigger(ele, UI.Utils.options(ele.attr('data-uk-modal')))
          modal.show()
        }
      })

      // close modal on esc button
      UI.$html.on('keydown.modal.uikit', function (e) {
        if (active && e.keyCode === 27 && active.options.keyboard) {
          // ESC
          e.preventDefault()
          active.hide()
        }
      })

      UI.$win.on(
        'resize orientationchange',
        UI.Utils.debounce(function () {
          if (active) active.resize()
        }, 150)
      )
    },

    init: function () {
      var $this = this

      this.options = UI.$.extend(
        {
          target: $this.element.is('a') ? $this.element.attr('href') : false
        },
        this.options
      )

      this.modal = UI.modal(this.options.target, this.options)

      this.on('click', function (e) {
        e.preventDefault()
        $this.show()
      })

      //methods
      this.proxy(this.modal, 'show hide isActive')
    }
  })

  UI.modal.dialog = function (content, options) {
    var modal = UI.modal(UI.$(UI.modal.dialog.template).appendTo('body'), options)

    modal.on('hide.uk.modal', function () {
      if (modal.persist) {
        modal.persist.appendTo(modal.persist.data('modalPersistParent'))
        modal.persist = false
      }
      modal.element.remove()
    })

    setContent(content, modal)

    return modal
  }

  UI.modal.dialog.template = '<div class="uk-modal"><div class="uk-modal-dialog" style="min-height:0;"></div></div>'

  UI.modal.alert = function (content, options) {
    options = UI.$.extend(true, { bgclose: false, keyboard: false, modal: false, labels: UI.modal.labels }, options)

    var modal = UI.modal.dialog(
      [
        '<div class="uk-margin uk-modal-content">' + String(content) + '</div>',
        '<div class="uk-modal-footer uk-text-right"><button class="uk-button uk-button-primary uk-modal-close">' +
          options.labels.Ok +
          '</button></div>'
      ].join(''),
      options
    )

    modal.on('show.uk.modal', function () {
      setTimeout(function () {
        modal.element.find('button:first').focus()
      }, 50)
    })

    return modal.show()
  }

  UI.modal.confirm = function (content, onconfirm, oncancel) {
    var options = arguments.length > 1 && arguments[arguments.length - 1] ? arguments[arguments.length - 1] : {}

    onconfirm = UI.$.isFunction(onconfirm) ? onconfirm : function () {}
    oncancel = UI.$.isFunction(oncancel) ? oncancel : function () {}
    options = UI.$.extend(
      true,
      { bgclose: false, keyboard: false, modal: false, labels: UI.modal.labels, confirmButtonClass: '' },
      UI.$.isFunction(options) ? {} : options
    )

    var modal = UI.modal.dialog(
      [
        '<div class="uk-margin uk-modal-content">' + String(content) + '</div>',
        '<div class="uk-modal-footer uk-text-right"><button class="uk-button js-modal-confirm-cancel">' +
          options.labels.Cancel +
          '</button> <button class="uk-button uk-button-primary js-modal-confirm ' +
          options.confirmButtonClass +
          '">' +
          options.labels.Ok +
          '</button></div>'
      ].join(''),
      options
    )

    modal.element.find('.js-modal-confirm, .js-modal-confirm-cancel').on('click', function () {
      UI.$(this).is('.js-modal-confirm') ? onconfirm() : oncancel()
      modal.hide()
    })

    modal.on('show.uk.modal', function () {
      setTimeout(function () {
        modal.element.find('.js-modal-confirm').focus()
      }, 50)
    })

    return modal.show()
  }

  UI.modal.prompt = function (text, value, onsubmit, options) {
    onsubmit = UI.$.isFunction(onsubmit) ? onsubmit : function (value) {}
    options = UI.$.extend(true, { bgclose: false, keyboard: false, modal: false, labels: UI.modal.labels }, options)

    var modal = UI.modal.dialog(
        [
          text ? '<div class="uk-modal-content uk-form">' + String(text) + '</div>' : '',
          '<div class="uk-margin-small-top uk-modal-content uk-form"><p><input type="text" class="uk-width-1-1"></p></div>',
          '<div class="uk-modal-footer uk-text-right"><button class="uk-button uk-modal-close">' +
            options.labels.Cancel +
            '</button> <button class="uk-button uk-button-primary js-modal-ok">' +
            options.labels.Ok +
            '</button></div>'
        ].join(''),
        options
      ),
      input = modal.element
        .find("input[type='text']")
        .val(value || '')
        .on('keyup', function (e) {
          if (e.keyCode == 13) {
            modal.element.find('.js-modal-ok').trigger('click')
          }
        })

    modal.element.find('.js-modal-ok').on('click', function () {
      if (onsubmit(input.val()) !== false) {
        modal.hide()
      }
    })

    modal.on('show.uk.modal', function () {
      setTimeout(function () {
        input.focus()
      }, 50)
    })

    return modal.show()
  }

  UI.modal.blockUI = function (content, options) {
    var modal = UI.modal.dialog(
      [
        '<div class="uk-margin uk-modal-content">' +
          String(content || '<div class="uk-text-center">...</div>') +
          '</div>'
      ].join(''),
      UI.$.extend({ bgclose: false, keyboard: false, modal: false }, options)
    )

    modal.content = modal.element.find('.uk-modal-content:first')

    return modal.show()
  }

  UI.modal.labels = {
    Ok: 'Ok',
    Cancel: 'Cancel'
  }

  // helper functions
  function setContent (content, modal) {
    if (!modal) return

    if (typeof content === 'object') {
      // convert DOM object to a jQuery object
      content = content instanceof jQuery ? content : UI.$(content)

      if (content.parent().length) {
        modal.persist = content
        modal.persist.data('modalPersistParent', content.parent())
      }
    } else if (typeof content === 'string' || typeof content === 'number') {
      // just insert the data as innerHTML
      content = UI.$('<div></div>').html(content)
    } else {
      // unsupported data type!
      content = UI.$('<div></div>').html('UIkit.modal Error: Unsupported data type: ' + typeof content)
    }

    content.appendTo(modal.element.find('.uk-modal-dialog'))

    return modal
  }
})(UIkit)
;(function (UI) {
  'use strict'

  UI.component('nav', {
    defaults: {
      toggle: ">li.uk-parent > a[href='#']",
      lists: '>li.uk-parent > ul',
      multiple: false
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-nav]', context).each(function () {
          var nav = UI.$(this)

          if (!nav.data('nav')) {
            var obj = UI.nav(nav, UI.Utils.options(nav.attr('data-uk-nav')))
          }
        })
      })
    },

    init: function () {
      var $this = this

      this.on('click.uikit.nav', this.options.toggle, function (e) {
        e.preventDefault()
        var ele = UI.$(this)
        $this.open(ele.parent()[0] == $this.element[0] ? ele : ele.parent('li'))
      })

      this.find(this.options.lists).each(function () {
        var $ele = UI.$(this),
          parent = $ele.parent(),
          active = parent.hasClass('uk-active')

        $ele.wrap('<div style="overflow:hidden;height:0;position:relative;"></div>')
        parent.data('list-container', $ele.parent()[active ? 'removeClass' : 'addClass']('uk-hidden'))

        // Init ARIA
        parent.attr('aria-expanded', parent.hasClass('uk-open'))

        if (active) $this.open(parent, true)
      })
    },

    open: function (li, noanimation) {
      var $this = this,
        element = this.element,
        $li = UI.$(li),
        $container = $li.data('list-container')

      if (!this.options.multiple) {
        element
          .children('.uk-open')
          .not(li)
          .each(function () {
            var ele = UI.$(this)

            if (ele.data('list-container')) {
              ele
                .data('list-container')
                .stop()
                .animate({ height: 0 }, function () {
                  UI.$(this)
                    .parent()
                    .removeClass('uk-open')
                    .end()
                    .addClass('uk-hidden')
                })
            }
          })
      }

      $li.toggleClass('uk-open')

      // Update ARIA
      $li.attr('aria-expanded', $li.hasClass('uk-open'))

      if ($container) {
        if ($li.hasClass('uk-open')) {
          $container.removeClass('uk-hidden')
        }

        if (noanimation) {
          $container.stop().height($li.hasClass('uk-open') ? 'auto' : 0)

          if (!$li.hasClass('uk-open')) {
            $container.addClass('uk-hidden')
          }

          this.trigger('display.uk.check')
        } else {
          $container.stop().animate(
            {
              height: $li.hasClass('uk-open') ? getHeight($container.find('ul:first')) : 0
            },
            function () {
              if (!$li.hasClass('uk-open')) {
                $container.addClass('uk-hidden')
              } else {
                $container.css('height', '')
              }

              $this.trigger('display.uk.check')
            }
          )
        }
      }
    }
  })

  // helper

  function getHeight (ele) {
    var $ele = UI.$(ele),
      height = 'auto'

    if ($ele.is(':visible')) {
      height = $ele.outerHeight()
    } else {
      var tmp = {
        position: $ele.css('position'),
        visibility: $ele.css('visibility'),
        display: $ele.css('display')
      }

      height = $ele.css({ position: 'absolute', visibility: 'hidden', display: 'block' }).outerHeight()

      $ele.css(tmp) // reset element
    }

    return height
  }
})(UIkit)
;(function (UI) {
  'use strict'

  var scrollpos = { x: window.scrollX, y: window.scrollY },
    $win = UI.$win,
    $doc = UI.$doc,
    $html = UI.$html,
    Offcanvas = {
      show: function (element) {
        element = UI.$(element)

        if (!element.length) return

        var $body = UI.$('body'),
          bar = element.find('.uk-offcanvas-bar:first'),
          rtl = UI.langdirection == 'right',
          flip = bar.hasClass('uk-offcanvas-bar-flip') ? -1 : 1,
          dir = flip * (rtl ? -1 : 1),
          scrollbarwidth = window.innerWidth - $body.width()

        scrollpos = { x: window.pageXOffset, y: window.pageYOffset }

        element.addClass('uk-active')

        $body
          .css({ width: window.innerWidth - scrollbarwidth, height: window.innerHeight })
          .addClass('uk-offcanvas-page')
        $body.css(rtl ? 'margin-right' : 'margin-left', (rtl ? -1 : 1) * (bar.outerWidth() * dir)).width() // .width() - force redraw

        $html.css('margin-top', scrollpos.y * -1)

        bar.addClass('uk-offcanvas-bar-show')

        this._initElement(element)

        bar.trigger('show.uk.offcanvas', [element, bar])

        // Update ARIA
        element.attr('aria-hidden', 'false')
      },

      hide: function (force) {
        var $body = UI.$('body'),
          panel = UI.$('.uk-offcanvas.uk-active'),
          rtl = UI.langdirection == 'right',
          bar = panel.find('.uk-offcanvas-bar:first'),
          finalize = function () {
            $body.removeClass('uk-offcanvas-page').css({ width: '', height: '', 'margin-left': '', 'margin-right': '' })
            panel.removeClass('uk-active')

            bar.removeClass('uk-offcanvas-bar-show')
            $html.css('margin-top', '')
            window.scrollTo(scrollpos.x, scrollpos.y)
            bar.trigger('hide.uk.offcanvas', [panel, bar])

            // Update ARIA
            panel.attr('aria-hidden', 'true')
          }

        if (!panel.length) return

        if (UI.support.transition && !force) {
          $body
            .one(UI.support.transition.end, function () {
              finalize()
            })
            .css(rtl ? 'margin-right' : 'margin-left', '')

          setTimeout(function () {
            bar.removeClass('uk-offcanvas-bar-show')
          }, 0)
        } else {
          finalize()
        }
      },

      _initElement: function (element) {
        if (element.data('OffcanvasInit')) return

        element.on('click.uk.offcanvas swipeRight.uk.offcanvas swipeLeft.uk.offcanvas', function (e) {
          var target = UI.$(e.target)

          if (!e.type.match(/swipe/)) {
            if (!target.hasClass('uk-offcanvas-close')) {
              if (target.hasClass('uk-offcanvas-bar')) return
              if (target.parents('.uk-offcanvas-bar:first').length) return
            }
          }

          e.stopImmediatePropagation()
          Offcanvas.hide()
        })

        element.on('click', "a[href*='#']", function (e) {
          var link = UI.$(this),
            href = link.attr('href')

          if (href == '#') {
            return
          }

          UI.$doc.one('hide.uk.offcanvas', function () {
            var target

            try {
              target = UI.$(link[0].hash)
            } catch (e) {
              target = ''
            }

            if (!target.length) {
              target = UI.$('[name="' + link[0].hash.replace('#', '') + '"]')
            }

            if (target.length && UI.Utils.scrollToElement) {
              UI.Utils.scrollToElement(target, UI.Utils.options(link.attr('data-uk-smooth-scroll') || '{}'))
            } else {
              window.location.href = href
            }
          })

          Offcanvas.hide()
        })

        element.data('OffcanvasInit', true)
      }
    }

  UI.component('offcanvasTrigger', {
    boot: function () {
      // init code
      $html.on('click.offcanvas.uikit', '[data-uk-offcanvas]', function (e) {
        e.preventDefault()

        var ele = UI.$(this)

        if (!ele.data('offcanvasTrigger')) {
          var obj = UI.offcanvasTrigger(ele, UI.Utils.options(ele.attr('data-uk-offcanvas')))
          ele.trigger('click')
        }
      })

      $html.on('keydown.uk.offcanvas', function (e) {
        if (e.keyCode === 27) {
          // ESC
          Offcanvas.hide()
        }
      })
    },

    init: function () {
      var $this = this

      this.options = UI.$.extend(
        {
          target: $this.element.is('a') ? $this.element.attr('href') : false
        },
        this.options
      )

      this.on('click', function (e) {
        e.preventDefault()
        Offcanvas.show($this.options.target)
      })
    }
  })

  UI.offcanvas = Offcanvas
})(UIkit)
;(function (UI) {
  'use strict'

  var Animations

  UI.component('switcher', {
    defaults: {
      connect: false,
      toggle: '>*',
      active: 0,
      animation: false,
      duration: 200,
      swiping: true
    },

    animating: false,

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-switcher]', context).each(function () {
          var switcher = UI.$(this)

          if (!switcher.data('switcher')) {
            var obj = UI.switcher(switcher, UI.Utils.options(switcher.attr('data-uk-switcher')))
          }
        })
      })
    },

    init: function () {
      var $this = this

      this.on('click.uikit.switcher', this.options.toggle, function (e) {
        e.preventDefault()
        $this.show(this)
      })

      if (this.options.connect) {
        this.connect = UI.$(this.options.connect)

        this.connect.find('.uk-active').removeClass('.uk-active')

        // delegate switch commands within container content
        if (this.connect.length) {
          // Init ARIA for connect
          this.connect.children().attr('aria-hidden', 'true')

          this.connect.on('click', '[data-uk-switcher-item]', function (e) {
            e.preventDefault()

            var item = UI.$(this).attr('data-uk-switcher-item')

            if ($this.index == item) return

            switch (item) {
              case 'next':
              case 'previous':
                $this.show($this.index + (item == 'next' ? 1 : -1))
                break
              default:
                $this.show(parseInt(item, 10))
            }
          })

          if (this.options.swiping) {
            this.connect.on('swipeRight swipeLeft', function (e) {
              e.preventDefault()
              if (!window.getSelection().toString()) {
                $this.show($this.index + (e.type == 'swipeLeft' ? 1 : -1))
              }
            })
          }
        }

        var toggles = this.find(this.options.toggle),
          active = toggles.filter('.uk-active')

        if (active.length) {
          this.show(active, false)
        } else {
          if (this.options.active === false) return

          active = toggles.eq(this.options.active)
          this.show(active.length ? active : toggles.eq(0), false)
        }

        // Init ARIA for toggles
        toggles.not(active).attr('aria-expanded', 'false')
        active.attr('aria-expanded', 'true')

        this.on('changed.uk.dom', function () {
          $this.connect = UI.$($this.options.connect)
        })
      }
    },

    show: function (tab, animate) {
      if (this.animating) {
        return
      }

      if (isNaN(tab)) {
        tab = UI.$(tab)
      } else {
        var toggles = this.find(this.options.toggle)

        tab = tab < 0 ? toggles.length - 1 : tab
        tab = toggles.eq(toggles[tab] ? tab : 0)
      }

      var $this = this,
        toggles = this.find(this.options.toggle),
        active = UI.$(tab),
        animation =
          Animations[this.options.animation] ||
          function (current, next) {
            if (!$this.options.animation) {
              return Animations.none.apply($this)
            }

            var anim = $this.options.animation.split(',')

            if (anim.length == 1) {
              anim[1] = anim[0]
            }

            anim[0] = anim[0].trim()
            anim[1] = anim[1].trim()

            return coreAnimation.apply($this, [anim, current, next])
          }

      if (animate === false || !UI.support.animation) {
        animation = Animations.none
      }

      if (active.hasClass('uk-disabled')) return

      // Update ARIA for Toggles
      toggles.attr('aria-expanded', 'false')
      active.attr('aria-expanded', 'true')

      toggles.filter('.uk-active').removeClass('uk-active')
      active.addClass('uk-active')

      if (this.options.connect && this.connect.length) {
        this.index = this.find(this.options.toggle).index(active)

        if (this.index == -1) {
          this.index = 0
        }

        this.connect.each(function () {
          var container = UI.$(this),
            children = UI.$(container.children()),
            current = UI.$(children.filter('.uk-active')),
            next = UI.$(children.eq($this.index))

          $this.animating = true

          animation.apply($this, [current, next]).then(function () {
            current.removeClass('uk-active')
            next.addClass('uk-active')

            // Update ARIA for connect
            current.attr('aria-hidden', 'true')
            next.attr('aria-hidden', 'false')

            UI.Utils.checkDisplay(next, true)

            $this.animating = false
          })
        })
      }

      this.trigger('show.uk.switcher', [active])
    }
  })

  Animations = {
    none: function () {
      var d = UI.$.Deferred()
      d.resolve()
      return d.promise()
    },

    fade: function (current, next) {
      return coreAnimation.apply(this, ['uk-animation-fade', current, next])
    },

    'slide-bottom': function (current, next) {
      return coreAnimation.apply(this, ['uk-animation-slide-bottom', current, next])
    },

    'slide-top': function (current, next) {
      return coreAnimation.apply(this, ['uk-animation-slide-top', current, next])
    },

    'slide-vertical': function (current, next, dir) {
      var anim = ['uk-animation-slide-top', 'uk-animation-slide-bottom']

      if (current && current.index() > next.index()) {
        anim.reverse()
      }

      return coreAnimation.apply(this, [anim, current, next])
    },

    'slide-left': function (current, next) {
      return coreAnimation.apply(this, ['uk-animation-slide-left', current, next])
    },

    'slide-right': function (current, next) {
      return coreAnimation.apply(this, ['uk-animation-slide-right', current, next])
    },

    'slide-horizontal': function (current, next, dir) {
      var anim = ['uk-animation-slide-right', 'uk-animation-slide-left']

      if (current && current.index() > next.index()) {
        anim.reverse()
      }

      return coreAnimation.apply(this, [anim, current, next])
    },

    scale: function (current, next) {
      return coreAnimation.apply(this, ['uk-animation-scale-up', current, next])
    }
  }

  UI.switcher.animations = Animations

  // helpers

  function coreAnimation (cls, current, next) {
    var d = UI.$.Deferred(),
      clsIn = cls,
      clsOut = cls,
      release

    if (next[0] === current[0]) {
      d.resolve()
      return d.promise()
    }

    if (typeof cls == 'object') {
      clsIn = cls[0]
      clsOut = cls[1] || cls[0]
    }

    UI.$body.css('overflow-x', 'hidden') // fix scroll jumping in iOS

    release = function () {
      if (current) current.hide().removeClass('uk-active ' + clsOut + ' uk-animation-reverse')

      next
        .addClass(clsIn)
        .one(
          UI.support.animation.end,
          function () {
            next.removeClass('' + clsIn + '').css({ opacity: '', display: '' })

            d.resolve()

            UI.$body.css('overflow-x', '')

            if (current) current.css({ opacity: '', display: '' })
          }.bind(this)
        )
        .show()
    }

    next.css('animation-duration', this.options.duration + 'ms')

    if (current && current.length) {
      current.css('animation-duration', this.options.duration + 'ms')

      current
        .css('display', 'none')
        .addClass(clsOut + ' uk-animation-reverse')
        .one(
          UI.support.animation.end,
          function () {
            release()
          }.bind(this)
        )
        .css('display', '')
    } else {
      next.addClass('uk-active')
      release()
    }

    return d.promise()
  }
})(UIkit)
;(function (UI) {
  'use strict'

  UI.component('tab', {
    defaults: {
      target: '>li:not(.uk-tab-responsive, .uk-disabled)',
      connect: false,
      active: 0,
      animation: false,
      duration: 200,
      swiping: true
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-tab]', context).each(function () {
          var tab = UI.$(this)

          if (!tab.data('tab')) {
            var obj = UI.tab(tab, UI.Utils.options(tab.attr('data-uk-tab')))
          }
        })
      })
    },

    init: function () {
      var $this = this

      this.current = false

      this.on('click.uikit.tab', this.options.target, function (e) {
        e.preventDefault()

        if ($this.switcher && $this.switcher.animating) {
          return
        }

        var current = $this.find($this.options.target).not(this)

        current.removeClass('uk-active').blur()

        $this.trigger('change.uk.tab', [UI.$(this).addClass('uk-active'), $this.current])

        $this.current = UI.$(this)

        // Update ARIA
        if (!$this.options.connect) {
          current.attr('aria-expanded', 'false')
          UI.$(this).attr('aria-expanded', 'true')
        }
      })

      if (this.options.connect) {
        this.connect = UI.$(this.options.connect)
      }

      // init responsive tab
      this.responsivetab = UI.$('<li class="uk-tab-responsive uk-active"><a></a></li>').append(
        '<div class="uk-dropdown uk-dropdown-small"><ul class="uk-nav uk-nav-dropdown"></ul><div>'
      )

      this.responsivetab.dropdown = this.responsivetab.find('.uk-dropdown')
      this.responsivetab.lst = this.responsivetab.dropdown.find('ul')
      this.responsivetab.caption = this.responsivetab.find('a:first')

      if (this.element.hasClass('uk-tab-bottom')) this.responsivetab.dropdown.addClass('uk-dropdown-up')

      // handle click
      this.responsivetab.lst.on('click.uikit.tab', 'a', function (e) {
        e.preventDefault()
        e.stopPropagation()

        var link = UI.$(this)

        $this.element
          .children('li:not(.uk-tab-responsive)')
          .eq(link.data('index'))
          .trigger('click')
      })

      this.on('show.uk.switcher change.uk.tab', function (e, tab) {
        $this.responsivetab.caption.html(tab.text())
      })

      this.element.append(this.responsivetab)

      // init UIkit components
      if (this.options.connect) {
        this.switcher = UI.switcher(this.element, {
          toggle: '>li:not(.uk-tab-responsive)',
          connect: this.options.connect,
          active: this.options.active,
          animation: this.options.animation,
          duration: this.options.duration,
          swiping: this.options.swiping
        })
      }

      UI.dropdown(this.responsivetab, { mode: 'click' })

      // init
      $this.trigger('change.uk.tab', [
        this.element
          .find(this.options.target)
          .not('.uk-tab-responsive')
          .filter('.uk-active')
      ])

      this.check()

      UI.$win.on(
        'resize orientationchange',
        UI.Utils.debounce(function () {
          if ($this.element.is(':visible')) $this.check()
        }, 100)
      )

      this.on('display.uk.check', function () {
        if ($this.element.is(':visible')) $this.check()
      })
    },

    check: function () {
      var children = this.element.children('li:not(.uk-tab-responsive)').removeClass('uk-hidden')

      if (!children.length) {
        this.responsivetab.addClass('uk-hidden')
        return
      }

      var top = children.eq(0).offset().top + Math.ceil(children.eq(0).height() / 2),
        doresponsive = false,
        item,
        link,
        clone

      this.responsivetab.lst.empty()

      children.each(function () {
        if (UI.$(this).offset().top > top) {
          doresponsive = true
        }
      })

      if (doresponsive) {
        for (var i = 0; i < children.length; i++) {
          item = UI.$(children.eq(i))
          link = item.find('a')

          if (item.css('float') != 'none' && !item.attr('uk-dropdown')) {
            if (!item.hasClass('uk-disabled')) {
              clone = item[0].outerHTML.replace('<a ', '<a data-index="' + i + '" ')

              this.responsivetab.lst.append(clone)
            }

            item.addClass('uk-hidden')
          }
        }
      }

      this.responsivetab[this.responsivetab.lst.children('li').length ? 'removeClass' : 'addClass']('uk-hidden')
    }
  })
})(UIkit)
;(function (UI) {
  'use strict'

  UI.component('cover', {
    defaults: {
      automute: true
    },

    boot: function () {
      // auto init
      UI.ready(function (context) {
        UI.$('[data-uk-cover]', context).each(function () {
          var ele = UI.$(this)

          if (!ele.data('cover')) {
            var plugin = UI.cover(ele, UI.Utils.options(ele.attr('data-uk-cover')))
          }
        })
      })
    },

    init: function () {
      this.parent = this.element.parent()

      UI.$win.on(
        'load resize orientationchange',
        UI.Utils.debounce(
          function () {
            this.check()
          }.bind(this),
          100
        )
      )

      this.on(
        'display.uk.check',
        function (e) {
          if (this.element.is(':visible')) this.check()
        }.bind(this)
      )

      this.check()

      if (this.element.is('iframe') && this.options.automute) {
        var src = this.element.attr('src')

        this.element
          .attr('src', '')
          .on('load', function () {
            this.contentWindow.postMessage(
              '{ "event": "command", "func": "mute", "method":"setVolume", "value":0}',
              '*'
            )
          })
          .attr('src', [src, src.indexOf('?') > -1 ? '&' : '?', 'enablejsapi=1&api=1'].join(''))
      }
    },

    check: function () {
      this.element.css({
        width: '',
        height: ''
      })

      this.dimension = { w: this.element.width(), h: this.element.height() }

      if (this.element.attr('width') && !isNaN(this.element.attr('width'))) {
        this.dimension.w = this.element.attr('width')
      }

      if (this.element.attr('height') && !isNaN(this.element.attr('height'))) {
        this.dimension.h = this.element.attr('height')
      }

      this.ratio = this.dimension.w / this.dimension.h

      var w = this.parent.width(),
        h = this.parent.height(),
        width,
        height

      // if element height < parent height (gap underneath)
      if (w / this.ratio < h) {
        width = Math.ceil(h * this.ratio)
        height = h

        // element width < parent width (gap to right)
      } else {
        width = w
        height = Math.ceil(w / this.ratio)
      }

      this.element.css({
        width: width,
        height: height
      })
    }
  })
})(UIkit)

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-accordion', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  UI.component('accordion', {
    defaults: {
      showfirst: true,
      collapse: true,
      animate: true,
      easing: 'swing',
      duration: 300,
      toggle: '.uk-accordion-title',
      containers: '.uk-accordion-content',
      clsactive: 'uk-active'
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        setTimeout(function () {
          UI.$('[data-uk-accordion]', context).each(function () {
            var ele = UI.$(this)

            if (!ele.data('accordion')) {
              UI.accordion(ele, UI.Utils.options(ele.attr('data-uk-accordion')))
            }
          })
        }, 0)
      })
    },

    init: function () {
      var $this = this

      this.element.on('click.uikit.accordion', this.options.toggle, function (e) {
        e.preventDefault()

        $this.toggleItem(UI.$(this).data('wrapper'), $this.options.animate, $this.options.collapse)
      })

      this.update()

      if (this.options.showfirst) {
        this.toggleItem(this.toggle.eq(0).data('wrapper'), false, false)
      }
    },

    toggleItem: function (wrapper, animated, collapse) {
      var $this = this

      wrapper.data('toggle').toggleClass(this.options.clsactive)
      wrapper.data('content').toggleClass(this.options.clsactive)

      var active = wrapper.data('toggle').hasClass(this.options.clsactive)

      if (collapse) {
        this.toggle.not(wrapper.data('toggle')).removeClass(this.options.clsactive)
        this.content
          .not(wrapper.data('content'))
          .removeClass(this.options.clsactive)
          .parent()
          .stop()
          .css('overflow', 'hidden')
          .animate({ height: 0 }, { easing: this.options.easing, duration: animated ? this.options.duration : 0 })
          .attr('aria-expanded', 'false')
      }

      wrapper.stop().css('overflow', 'hidden')

      if (animated) {
        wrapper.animate(
          { height: active ? getHeight(wrapper.data('content')) : 0 },
          {
            easing: this.options.easing,
            duration: this.options.duration,
            complete: function () {
              if (active) {
                wrapper.css({ overflow: '', height: 'auto' })
                UI.Utils.checkDisplay(wrapper.data('content'))
              }

              $this.trigger('display.uk.check')
            }
          }
        )
      } else {
        wrapper.height(active ? 'auto' : 0)

        if (active) {
          wrapper.css({ overflow: '' })
          UI.Utils.checkDisplay(wrapper.data('content'))
        }

        this.trigger('display.uk.check')
      }

      // Update ARIA
      wrapper.attr('aria-expanded', active)

      this.element.trigger('toggle.uk.accordion', [active, wrapper.data('toggle'), wrapper.data('content')])
    },

    update: function () {
      var $this = this,
        $content,
        $wrapper,
        $toggle

      this.toggle = this.find(this.options.toggle)
      this.content = this.find(this.options.containers)

      this.content.each(function (index) {
        $content = UI.$(this)

        if ($content.parent().data('wrapper')) {
          $wrapper = $content.parent()
        } else {
          $wrapper = UI.$(this)
            .wrap('<div data-wrapper="true" style="overflow:hidden;height:0;position:relative;"></div>')
            .parent()

          // Init ARIA
          $wrapper.attr('aria-expanded', 'false')
        }

        $toggle = $this.toggle.eq(index)

        $wrapper.data('toggle', $toggle)
        $wrapper.data('content', $content)
        $toggle.data('wrapper', $wrapper)
        $content.data('wrapper', $wrapper)
      })

      this.element.trigger('update.uk.accordion', [this])
    }
  })

  // helper

  function getHeight (ele) {
    var $ele = UI.$(ele),
      height = 'auto'

    if ($ele.is(':visible')) {
      height = $ele.outerHeight()
    } else {
      var tmp = {
        position: $ele.css('position'),
        visibility: $ele.css('visibility'),
        display: $ele.css('display')
      }

      height = $ele.css({ position: 'absolute', visibility: 'hidden', display: 'block' }).outerHeight()

      $ele.css(tmp) // reset element
    }

    return height
  }

  return UI.accordion
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-autocomplete', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  var active

  UI.component('autocomplete', {
    defaults: {
      minLength: 3,
      param: 'search',
      method: 'post',
      delay: 300,
      loadingClass: 'uk-loading',
      flipDropdown: false,
      skipClass: 'uk-skip',
      hoverClass: 'uk-active',
      source: null,
      renderer: null,

      // template

      template:
        '<ul class="uk-nav uk-nav-autocomplete uk-autocomplete-results">{{~items}}<li data-value="{{$item.value}}"><a>{{$item.value}}</a></li>{{/items}}</ul>'
    },

    visible: false,
    value: null,
    selected: null,

    boot: function () {
      // init code
      UI.$html.on('focus.autocomplete.uikit', '[data-uk-autocomplete]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('autocomplete')) {
          UI.autocomplete(ele, UI.Utils.options(ele.attr('data-uk-autocomplete')))
        }
      })

      // register outer click for autocompletes
      UI.$html.on('click.autocomplete.uikit', function (e) {
        if (active && e.target != active.input[0]) active.hide()
      })
    },

    init: function () {
      var $this = this,
        select = false,
        trigger = UI.Utils.debounce(function (e) {
          if (select) {
            return (select = false)
          }
          $this.handle()
        }, this.options.delay)

      this.dropdown = this.find('.uk-dropdown')
      this.template = this.find('script[type="text/autocomplete"]').html()
      this.template = UI.Utils.template(this.template || this.options.template)
      this.input = this.find('input:first').attr('autocomplete', 'off')

      if (!this.dropdown.length) {
        this.dropdown = UI.$('<div class="uk-dropdown"></div>').appendTo(this.element)
      }

      if (this.options.flipDropdown) {
        this.dropdown.addClass('uk-dropdown-flip')
      }

      this.dropdown.attr('aria-expanded', 'false')

      this.input.on({
        keydown: function (e) {
          if (e && e.which && !e.shiftKey) {
            switch (e.which) {
              case 13: // enter
                select = true

                if ($this.selected) {
                  e.preventDefault()
                  $this.select()
                }
                break
              case 38: // up
                e.preventDefault()
                $this.pick('prev', true)
                break
              case 40: // down
                e.preventDefault()
                $this.pick('next', true)
                break
              case 27:
              case 9: // esc, tab
                $this.hide()
                break
              default:
                break
            }
          }
        },
        keyup: trigger
      })

      this.dropdown.on('click', '.uk-autocomplete-results > *', function () {
        $this.select()
      })

      this.dropdown.on('mouseover', '.uk-autocomplete-results > *', function () {
        $this.pick(UI.$(this))
      })

      this.triggercomplete = trigger
    },

    handle: function () {
      var $this = this,
        old = this.value

      this.value = this.input.val()

      if (this.value.length < this.options.minLength) return this.hide()

      if (this.value != old) {
        $this.request()
      }

      return this
    },

    pick: function (item, scrollinview) {
      var $this = this,
        items = UI.$(this.dropdown.find('.uk-autocomplete-results').children(':not(.' + this.options.skipClass + ')')),
        selected = false

      if (typeof item !== 'string' && !item.hasClass(this.options.skipClass)) {
        selected = item
      } else if (item == 'next' || item == 'prev') {
        if (this.selected) {
          var index = items.index(this.selected)

          if (item == 'next') {
            selected = items.eq(index + 1 < items.length ? index + 1 : 0)
          } else {
            selected = items.eq(index - 1 < 0 ? items.length - 1 : index - 1)
          }
        } else {
          selected = items[item == 'next' ? 'first' : 'last']()
        }

        selected = UI.$(selected)
      }

      if (selected && selected.length) {
        this.selected = selected
        items.removeClass(this.options.hoverClass)
        this.selected.addClass(this.options.hoverClass)

        // jump to selected if not in view
        if (scrollinview) {
          var top = selected.position().top,
            scrollTop = $this.dropdown.scrollTop(),
            dpheight = $this.dropdown.height()

          if (top > dpheight || top < 0) {
            $this.dropdown.scrollTop(scrollTop + top)
          }
        }
      }
    },

    select: function () {
      if (!this.selected) return

      var data = this.selected.data()

      this.trigger('selectitem.uk.autocomplete', [data, this])

      if (data.value) {
        this.input.val(data.value).trigger('change')
      }

      this.hide()
    },

    show: function () {
      if (this.visible) return
      this.visible = true
      this.element.addClass('uk-open')

      if (active && active !== this) {
        active.hide()
      }

      active = this

      // Update aria
      this.dropdown.attr('aria-expanded', 'true')

      return this
    },

    hide: function () {
      if (!this.visible) return
      this.visible = false
      this.element.removeClass('uk-open')

      if (active === this) {
        active = false
      }

      // Update aria
      this.dropdown.attr('aria-expanded', 'false')

      return this
    },

    request: function () {
      var $this = this,
        release = function (data) {
          if (data) {
            $this.render(data)
          }

          $this.element.removeClass($this.options.loadingClass)
        }

      this.element.addClass(this.options.loadingClass)

      if (this.options.source) {
        var source = this.options.source

        switch (typeof this.options.source) {
          case 'function':
            this.options.source.apply(this, [release])

            break

          case 'object':
            if (source.length) {
              var items = []

              source.forEach(function (item) {
                if (item.value && item.value.toLowerCase().indexOf($this.value.toLowerCase()) != -1) {
                  items.push(item)
                }
              })

              release(items)
            }

            break

          case 'string':
            var params = {}

            params[this.options.param] = this.value

            UI.$.ajax({
              url: this.options.source,
              data: params,
              type: this.options.method,
              dataType: 'json'
            }).done(function (json) {
              release(json || [])
            })

            break

          default:
            release(null)
        }
      } else {
        this.element.removeClass($this.options.loadingClass)
      }
    },

    render: function (data) {
      this.dropdown.empty()

      this.selected = false

      if (this.options.renderer) {
        this.options.renderer.apply(this, [data])
      } else if (data && data.length) {
        this.dropdown.append(this.template({ items: data }))
        this.show()

        this.trigger('show.uk.autocomplete')
      }

      return this
    }
  })

  return UI.autocomplete
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
// removed moment_js from core
// customized by tzd
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-datepicker', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  // Datepicker

  var active = false,
    dropdown

  UI.component('datepicker', {
    defaults: {
      mobile: false,
      weekstart: 1,
      i18n: {
        months: [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ],
        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      format: 'DD.MM.YYYY',
      offsettop: 5,
      maxDate: false,
      minDate: false,
      pos: 'auto',
      addClass: '',
      template: function (data, opts) {
        var content = '',
          i

        content += '<div class="uk-datepicker-nav uk-clearfix">'
        content += '<a href="" class="uk-datepicker-previous"></a>'
        content += '<a href="" class="uk-datepicker-next"></a>'

        if (UI.formSelect) {
          var currentyear = new Date().getFullYear(),
            options = [],
            months,
            years,
            minYear,
            maxYear

          for (i = 0; i < opts.i18n.months.length; i++) {
            if (i == data.month) {
              options.push('<option value="' + i + '" selected>' + opts.i18n.months[i] + '</option>')
            } else {
              options.push('<option value="' + i + '">' + opts.i18n.months[i] + '</option>')
            }
          }

          months =
            '<span class="uk-form-select">' +
            opts.i18n.months[data.month] +
            '<select class="update-picker-month">' +
            options.join('') +
            '</select></span>'

          // --

          options = []

          minYear = data.minDate ? data.minDate.year() : currentyear - 50
          maxYear = data.maxDate ? data.maxDate.year() : currentyear + 20

          for (i = minYear; i <= maxYear; i++) {
            if (i == data.year) {
              options.push('<option value="' + i + '" selected>' + i + '</option>')
            } else {
              options.push('<option value="' + i + '">' + i + '</option>')
            }
          }

          years =
            '<span class="uk-form-select">' +
            data.year +
            '<select class="update-picker-year">' +
            options.join('') +
            '</select></span>'

          content += '<div class="uk-datepicker-heading">' + months + ' ' + years + '</div>'
        } else {
          content += '<div class="uk-datepicker-heading">' + opts.i18n.months[data.month] + ' ' + data.year + '</div>'
        }

        content += '</div>'

        content += '<table class="uk-datepicker-table">'
        content += '<thead>'
        for (i = 0; i < data.weekdays.length; i++) {
          if (data.weekdays[i]) {
            content += '<th>' + data.weekdays[i] + '</th>'
          }
        }
        content += '</thead>'

        content += '<tbody>'
        for (i = 0; i < data.days.length; i++) {
          if (data.days[i] && data.days[i].length) {
            content += '<tr>'
            for (var d = 0; d < data.days[i].length; d++) {
              if (data.days[i][d]) {
                var day = data.days[i][d],
                  cls = []

                if (!day.inmonth) cls.push('uk-datepicker-table-muted')
                if (day.selected) cls.push('uk-active')
                if (day.disabled) cls.push('uk-datepicker-date-disabled uk-datepicker-table-muted')

                content +=
                  '<td><a href="" class="' +
                  cls.join(' ') +
                  '" data-date="' +
                  day.day.format() +
                  '">' +
                  day.day.format('D') +
                  '</a></td>'
              }
            }
            content += '</tr>'
          }
        }
        content += '</tbody>'

        content += '</table>'

        return content
      }
    },

    boot: function () {
      UI.$win.on('resize orientationchange', function () {
        if (active) {
          active.hide()
        }
      })

      // init code
      UI.$html.on('focus.datepicker.uikit', '[data-uk-datepicker]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('datepicker')) {
          e.preventDefault()
          UI.datepicker(ele, UI.Utils.options(ele.attr('data-uk-datepicker')))
          ele.trigger('focus')
        }
      })

      UI.$html.on('click focus', '*', function (e) {
        var target = UI.$(e.target)

        if (
          active &&
          target[0] != dropdown[0] &&
          !target.data('datepicker') &&
          !target.parents('.uk-datepicker:first').length
        ) {
          active.hide()
        }
      })
    },

    init: function () {
      // use native datepicker on touch devices
      if (UI.support.touch && this.element.attr('type') == 'date' && !this.options.mobile) {
        return
      }

      var $this = this

      this.current = this.element.val() ? moment(this.element.val(), this.options.format) : moment()

      this.on('click focus', function () {
        if (active !== $this) $this.pick(this.value ? this.value : $this.options.minDate ? $this.options.minDate : '')
      }).on('change', function () {
        if ($this.element.val() && !moment($this.element.val(), $this.options.format).isValid()) {
          $this.element.val(moment().format($this.options.format))
        }
      })

      // init dropdown
      if (!dropdown) {
        dropdown = UI.$('<div class="uk-dropdown uk-datepicker ' + $this.options.addClass + '"></div>')

        dropdown.on('click', '.uk-datepicker-next, .uk-datepicker-previous, [data-date]', function (e) {
          e.stopPropagation()
          e.preventDefault()

          var ele = UI.$(this)

          if (ele.hasClass('uk-datepicker-date-disabled')) return false

          if (ele.is('[data-date]')) {
            active.current = moment(ele.data('date'))
            active.element.val(active.current.format(active.options.format)).trigger('change')
            dropdown.removeClass('uk-dropdown-shown')
            setTimeout(function () {
              dropdown.removeClass('uk-dropdown-active')
            }, 280)
            active.hide()
          } else {
            active.add(ele.hasClass('uk-datepicker-next') ? 1 : -1, 'months')
          }
        })

        dropdown.on('change', '.update-picker-month, .update-picker-year', function () {
          var select = UI.$(this)
          active[select.is('.update-picker-year') ? 'setYear' : 'setMonth'](Number(select.val()))
        })

        dropdown.appendTo('body')
      }
    },

    pick: function (initdate) {
      var offset = this.element.offset(),
        offset_left = parseInt(offset.left),
        offset_top = parseInt(offset.top),
        css = {
          left: offset_left,
          right: ''
        }

      this.current = isNaN(initdate) ? moment(initdate, this.options.format) : moment()
      this.initdate = this.current.format('YYYY-MM-DD')

      this.update()

      if (UI.langdirection == 'right' || window.innerWidth - offset_left - dropdown.outerWidth() < 0) {
        css.right = window.innerWidth - (window.innerWidth - $('body').width()) - (css.left + this.element.outerWidth())
        css.left = ''
      }

      var posTop =
          offset_top -
          this.element.outerHeight() +
          this.element.height() -
          this.options.offsettop -
          dropdown.outerHeight(),
        posBottom = offset_top + this.element.outerHeight() + this.options.offsettop

      css.top = posBottom

      if (this.options.pos == 'top') {
        css.top = posTop
        dropdown.addClass('dp-top')
      } else if (
        this.options.pos == 'auto' &&
        (window.innerHeight - posBottom - dropdown.outerHeight() + UI.$win.scrollTop() < 0 && posTop >= 0)
      ) {
        css.top = posTop
        dropdown.addClass('dp-top')
      }

      css.minWidth = dropdown.actual('outerWidth')

      dropdown.css(css).addClass('uk-dropdown-active uk-dropdown-shown')

      this.trigger('show.uk.datepicker')

      active = this
    },

    add: function (unit, value) {
      this.current.add(unit, value)
      this.update()
    },

    setMonth: function (month) {
      this.current.month(month)
      this.update()
    },

    setYear: function (year) {
      this.current.year(year)
      this.update()
    },

    update: function () {
      var data = this.getRows(this.current.year(), this.current.month()),
        tpl = this.options.template(data, this.options)

      dropdown.html(tpl)

      this.trigger('update.uk.datepicker')
    },

    getRows: function (year, month) {
      var opts = this.options,
        now = moment().format('YYYY-MM-DD'),
        days = [
          31,
          (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
          31,
          30,
          31,
          30,
          31,
          31,
          30,
          31,
          30,
          31
        ][month],
        before = new Date(year, month, 1, 12).getDay(),
        data = { month: month, year: year, weekdays: [], days: [], maxDate: false, minDate: false },
        row = []

      if (opts.maxDate !== false) {
        data.maxDate = isNaN(opts.maxDate) ? moment(opts.maxDate, opts.format) : moment().add(opts.maxDate, 'days')
      }

      if (opts.minDate !== false) {
        data.minDate = isNaN(opts.minDate) ? moment(opts.minDate, opts.format) : moment().add(opts.minDate - 1, 'days')
      }

      data.weekdays = (function () {
        for (var i = 0, arr = []; i < 7; i++) {
          var day = i + (opts.weekstart || 0)

          while (day >= 7) {
            day -= 7
          }

          arr.push(opts.i18n.weekdays[day])
        }

        return arr
      })()

      if (opts.weekstart && opts.weekstart > 0) {
        before -= opts.weekstart
        if (before < 0) {
          before += 7
        }
      }

      var cells = days + before,
        after = cells

      while (after > 7) {
        after -= 7
      }

      cells += 7 - after

      var day, isDisabled, isSelected, isToday, isInMonth

      for (var i = 0, r = 0; i < cells; i++) {
        day = new Date(year, month, 1 + (i - before), 12)
        isDisabled = (data.minDate && data.minDate > day) || (data.maxDate && day > data.maxDate)
        isInMonth = !(i < before || i >= days + before)

        day = moment(day)

        isSelected = this.initdate == day.format('YYYY-MM-DD')
        isToday = now == day.format('YYYY-MM-DD')

        row.push({ selected: isSelected, today: isToday, disabled: isDisabled, day: day, inmonth: isInMonth })

        if (++r === 7) {
          data.days.push(row)
          row = []
          r = 0
        }
      }

      return data
    },

    hide: function () {
      if (active && active === this) {
        dropdown.removeClass('uk-dropdown-shown')
        setTimeout(function () {
          dropdown.removeClass('uk-dropdown-active dp-top')
        }, 280)
        active = false
        this.trigger('hide.uk.datepicker')
      }
    }
  })

  UI.Utils.moment = moment()

  return UI.datepicker
})
/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-form-password', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  UI.component('formPassword', {
    defaults: {
      lblShow: 'Show',
      lblHide: 'Hide'
    },

    boot: function () {
      // init code
      UI.$html.on('click.formpassword.uikit', '[data-uk-form-password]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('formPassword')) {
          e.preventDefault()

          UI.formPassword(ele, UI.Utils.options(ele.attr('data-uk-form-password')))
          ele.trigger('click')
        }
      })
    },

    init: function () {
      var $this = this

      this.on('click', function (e) {
        e.preventDefault()

        if ($this.input.length) {
          var type = $this.input.attr('type')
          $this.input.attr('type', type == 'text' ? 'password' : 'text')
          $this.element.html($this.options[type == 'text' ? 'lblShow' : 'lblHide'])
        }
      })

      this.input = this.element.next('input').length ? this.element.next('input') : this.element.prev('input')
      this.element.html(this.options[this.input.is("[type='password']") ? 'lblShow' : 'lblHide'])

      this.element.data('formPassword', this)
    }
  })

  return UI.formPassword
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-form-select', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  UI.component('formSelect', {
    defaults: {
      target: '>span:first',
      activeClass: 'uk-active'
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-form-select]', context).each(function () {
          var ele = UI.$(this)

          if (!ele.data('formSelect')) {
            UI.formSelect(ele, UI.Utils.options(ele.attr('data-uk-form-select')))
          }
        })
      })
    },

    init: function () {
      var $this = this

      this.target = this.find(this.options.target)
      this.select = this.find('select')

      // init + on change event
      this.select.on(
        'change',
        (function () {
          var select = $this.select[0],
            fn = function () {
              try {
                $this.target.text(select.options[select.selectedIndex].text)
              } catch (e) {}

              $this.element[$this.select.val() ? 'addClass' : 'removeClass']($this.options.activeClass)

              return fn
            }

          return fn()
        })()
      )

      this.element.data('formSelect', this)
    }
  })

  return UI.formSelect
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-grid', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  UI.component('grid', {
    defaults: {
      colwidth: 'auto',
      animation: true,
      duration: 300,
      gutter: 0,
      controls: false,
      filter: false
    },

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-grid]', context).each(function () {
          var ele = UI.$(this)

          if (!ele.data('grid')) {
            UI.grid(ele, UI.Utils.options(ele.attr('data-uk-grid')))
          }
        })
      })
    },

    init: function () {
      var $this = this,
        gutter = String(this.options.gutter)
          .trim()
          .split(' ')

      this.gutterv = parseInt(gutter[0], 10)
      this.gutterh = parseInt(gutter[1] || gutter[0], 10)

      // make sure parent element has the right position property
      this.element.css({ position: 'relative' })

      this.controls = null

      if (this.options.controls) {
        this.controls = UI.$(this.options.controls)

        // filter
        this.controls.on('click', '[data-uk-filter]', function (e) {
          e.preventDefault()
          $this.filter(UI.$(this).data('ukFilter'))
        })

        // sort
        this.controls.on('click', '[data-uk-sort]', function (e) {
          e.preventDefault()
          var cmd = UI.$(this)
            .attr('data-uk-sort')
            .split(':')
          $this.sort(cmd[0], cmd[1])
        })
      }

      UI.$win.on(
        'load resize orientationchange',
        UI.Utils.debounce(
          function () {
            if ($this.currentfilter) {
              $this.filter($this.currentfilter)
            } else {
              this.updateLayout()
            }
          }.bind(this),
          100
        )
      )

      this.on('display.uk.check', function () {
        if ($this.element.is(':visible')) $this.updateLayout()
      })

      UI.$html.on('changed.uk.dom', function (e) {
        $this.updateLayout()
      })

      if (this.options.filter !== false) {
        this.filter(this.options.filter)
      } else {
        this.updateLayout()
      }
    },

    _prepareElements: function () {
      var children = this.element.children(':not([data-grid-prepared])'),
        css

      // exit if no already prepared elements found
      if (!children.length) {
        return
      }

      css = {
        position: 'absolute',
        'box-sizing': 'border-box',
        width: this.options.colwidth == 'auto' ? '' : this.options.colwidth
      }

      if (this.options.gutter) {
        css['padding-left'] = this.gutterh
        css['padding-bottom'] = this.gutterv

        this.element.css('margin-left', this.gutterh * -1)
      }

      children.attr('data-grid-prepared', 'true').css(css)
    },

    updateLayout: function (elements) {
      this._prepareElements()

      elements = elements || this.element.children(':visible')

      var children = elements,
        maxwidth = this.element.width() + 2 * this.gutterh + 2,
        left = 0,
        top = 0,
        positions = [],
        item,
        width,
        height,
        pos,
        i,
        z,
        max,
        size

      this.trigger('beforeupdate.uk.grid', [children])

      children.each(function (index) {
        size = getElementSize(this)

        item = UI.$(this)
        width = size.outerWidth
        height = size.outerHeight
        left = 0
        top = 0

        if (item.hasClass('uk-grid-static')) return

        for (i = 0, max = positions.length; i < max; i++) {
          pos = positions[i]

          if (left <= pos.aX) {
            left = pos.aX
          }
          if (maxwidth < left + width) {
            left = 0
          }
          if (top <= pos.aY) {
            top = pos.aY
          }
        }

        positions.push({
          ele: item,
          top: top,
          left: left,
          width: width,
          height: height,
          aY: top + height,
          aX: left + width
        })
      })

      var posPrev,
        maxHeight = 0

      // fix top
      for (i = 0, max = positions.length; i < max; i++) {
        pos = positions[i]
        top = 0

        for (z = 0; z < i; z++) {
          posPrev = positions[z]

          // (posPrev.left + 1) fixex 1px bug when using % based widths
          if (pos.left < posPrev.aX && posPrev.left + 1 < pos.aX) {
            top = posPrev.aY
          }
        }

        pos.top = top
        pos.aY = top + pos.height

        maxHeight = Math.max(maxHeight, pos.aY)
      }

      maxHeight = maxHeight - this.gutterv

      if (this.options.animation) {
        this.element.stop().animate({ height: maxHeight }, 100)

        positions.forEach(
          function (pos) {
            pos.ele.stop().animate({ top: pos.top, left: pos.left, opacity: 1 }, this.options.duration)
          }.bind(this)
        )
      } else {
        this.element.css('height', maxHeight)

        positions.forEach(
          function (pos) {
            pos.ele.css({ top: pos.top, left: pos.left, opacity: 1 })
          }.bind(this)
        )
      }

      // make sure to trigger possible scrollpies etc.
      setTimeout(function () {
        UI.$doc.trigger('scrolling.uk.document')
      }, 2 * this.options.duration * (this.options.animation ? 1 : 0))

      this.trigger('afterupdate.uk.grid', [children])
    },

    filter: function (filter) {
      this.currentfilter = filter

      filter = filter || []

      if (typeof filter === 'number') {
        filter = filter.toString()
      }

      if (typeof filter === 'string') {
        filter = filter.split(/,/).map(function (item) {
          return item.trim()
        })
      }

      var $this = this,
        children = this.element.children(),
        elements = { visible: [], hidden: [] },
        visible,
        hidden

      children.each(function (index) {
        var ele = UI.$(this),
          f = ele.attr('data-uk-filter'),
          infilter = filter.length ? false : true

        if (f) {
          f = f.split(/,/).map(function (item) {
            return item.trim()
          })

          filter.forEach(function (item) {
            if (f.indexOf(item) > -1) infilter = true
          })
        }

        elements[infilter ? 'visible' : 'hidden'].push(ele)
      })

      // convert to jQuery collections
      elements.hidden = UI.$(elements.hidden).map(function () {
        return this[0]
      })
      elements.visible = UI.$(elements.visible).map(function () {
        return this[0]
      })

      elements.hidden
        .attr('aria-hidden', 'true')
        .filter(':visible')
        .fadeOut(this.options.duration)
      elements.visible
        .attr('aria-hidden', 'false')
        .filter(':hidden')
        .css('opacity', 0)
        .show()

      $this.updateLayout(elements.visible)

      if (this.controls && this.controls.length) {
        this.controls
          .find('[data-uk-filter]')
          .removeClass('uk-active')
          .filter('[data-uk-filter="' + filter + '"]')
          .addClass('uk-active')
      }
    },

    sort: function (by, order) {
      order = order || 1

      // covert from string (asc|desc) to number
      if (typeof order === 'string') {
        order = order.toLowerCase() == 'desc' ? -1 : 1
      }

      var elements = this.element.children()

      elements
        .sort(function (a, b) {
          a = UI.$(a)
          b = UI.$(b)

          return (b.data(by) || '') < (a.data(by) || '') ? order : order * -1
        })
        .appendTo(this.element)

      this.updateLayout(elements.filter(':visible'))

      if (this.controls && this.controls.length) {
        this.controls
          .find('[data-uk-sort]')
          .removeClass('uk-active')
          .filter('[data-uk-sort="' + by + ':' + (order == -1 ? 'desc' : 'asc') + '"]')
          .addClass('uk-active')
      }
    }
  })

  /*!
   * getSize v1.2.2
   * measure size of elements
   * MIT license
   * https://github.com/desandro/get-size
   */
  var _getSize = (function () {
    var prefixes = 'Webkit Moz ms Ms O'.split(' ')
    var docElemStyle = document.documentElement.style

    function getStyleProperty (propName) {
      if (!propName) {
        return
      }

      // test standard property first
      if (typeof docElemStyle[propName] === 'string') {
        return propName
      }

      // capitalize
      propName = propName.charAt(0).toUpperCase() + propName.slice(1)

      // test vendor specific properties
      var prefixed
      for (var i = 0, len = prefixes.length; i < len; i++) {
        prefixed = prefixes[i] + propName
        if (typeof docElemStyle[prefixed] === 'string') {
          return prefixed
        }
      }
    }

    // -------------------------- helpers -------------------------- //

    // get a number from a string, not a percentage
    function getStyleSize (value) {
      var num = parseFloat(value)
      // not a percent like '100%', and a number
      var isValid = value.indexOf('%') === -1 && !isNaN(num)
      return isValid && num
    }

    function noop () {}

    var logError =
      typeof console === 'undefined'
        ? noop
        : function (message) {
            console.error(message)
          }

    // -------------------------- measurements -------------------------- //

    var measurements = [
      'paddingLeft',
      'paddingRight',
      'paddingTop',
      'paddingBottom',
      'marginLeft',
      'marginRight',
      'marginTop',
      'marginBottom',
      'borderLeftWidth',
      'borderRightWidth',
      'borderTopWidth',
      'borderBottomWidth'
    ]

    function getZeroSize () {
      var size = {
        width: 0,
        height: 0,
        innerWidth: 0,
        innerHeight: 0,
        outerWidth: 0,
        outerHeight: 0
      }
      for (var i = 0, len = measurements.length; i < len; i++) {
        var measurement = measurements[i]
        size[measurement] = 0
      }
      return size
    }

    // -------------------------- setup -------------------------- //

    var isSetup = false
    var getStyle, boxSizingProp, isBoxSizeOuter

    /**
     * setup vars and functions
     * do it on initial getSize(), rather than on script load
     * For Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=548397
     */
    function setup () {
      // setup once
      if (isSetup) {
        return
      }
      isSetup = true

      var getComputedStyle = window.getComputedStyle
      getStyle = (function () {
        var getStyleFn = getComputedStyle
          ? function (elem) {
              return getComputedStyle(elem, null)
            }
          : function (elem) {
              return elem.currentStyle
            }

        return function getStyle (elem) {
          var style = getStyleFn(elem)
          if (!style) {
            logError(
              'Style returned ' +
                style +
                '. Are you running this code in a hidden iframe on Firefox? ' +
                'See http://bit.ly/getsizebug1'
            )
          }
          return style
        }
      })()

      // -------------------------- box sizing -------------------------- //

      boxSizingProp = getStyleProperty('boxSizing')

      /**
       * WebKit measures the outer-width on style.width on border-box elems
       * IE & Firefox measures the inner-width
       */
      if (boxSizingProp) {
        var div = document.createElement('div')
        div.style.width = '200px'
        div.style.padding = '1px 2px 3px 4px'
        div.style.borderStyle = 'solid'
        div.style.borderWidth = '1px 2px 3px 4px'
        div.style[boxSizingProp] = 'border-box'

        var body = document.body || document.documentElement
        body.appendChild(div)
        var style = getStyle(div)

        isBoxSizeOuter = getStyleSize(style.width) === 200
        body.removeChild(div)
      }
    }

    // -------------------------- getSize -------------------------- //

    function getSize (elem) {
      setup()

      // use querySeletor if elem is string
      if (typeof elem === 'string') {
        elem = document.querySelector(elem)
      }

      // do not proceed on non-objects
      if (!elem || typeof elem !== 'object' || !elem.nodeType) {
        return
      }

      var style = getStyle(elem)

      // if hidden, everything is 0
      if (style.display === 'none') {
        return getZeroSize()
      }

      var size = {}
      size.width = elem.offsetWidth
      size.height = elem.offsetHeight

      var isBorderBox = (size.isBorderBox = !!(
        boxSizingProp &&
        style[boxSizingProp] &&
        style[boxSizingProp] === 'border-box'
      ))

      // get all measurements
      for (var i = 0, len = measurements.length; i < len; i++) {
        var measurement = measurements[i]
        var value = style[measurement]

        var num = parseFloat(value)
        // any 'auto', 'medium' value will be 0
        size[measurement] = !isNaN(num) ? num : 0
      }

      var paddingWidth = size.paddingLeft + size.paddingRight
      var paddingHeight = size.paddingTop + size.paddingBottom
      var marginWidth = size.marginLeft + size.marginRight
      var marginHeight = size.marginTop + size.marginBottom
      var borderWidth = size.borderLeftWidth + size.borderRightWidth
      var borderHeight = size.borderTopWidth + size.borderBottomWidth

      var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter

      // overwrite width and height if we can get it from style
      var styleWidth = getStyleSize(style.width)
      if (styleWidth !== false) {
        size.width =
          styleWidth +
          // add padding and border unless it's already including it
          (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth)
      }

      var styleHeight = getStyleSize(style.height)
      if (styleHeight !== false) {
        size.height =
          styleHeight +
          // add padding and border unless it's already including it
          (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight)
      }

      size.innerWidth = size.width - (paddingWidth + borderWidth)
      size.innerHeight = size.height - (paddingHeight + borderHeight)

      size.outerWidth = size.width + marginWidth
      size.outerHeight = size.height + marginHeight

      return size
    }

    return getSize
  })()

  function getElementSize (ele) {
    return _getSize(ele)
  }
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    // AMD
    define('uikit-lightbox', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  var modal,
    cache = {}

  UI.component('lightbox', {
    defaults: {
      group: false,
      duration: 400,
      keyboard: true
    },

    index: 0,
    items: false,

    boot: function () {
      UI.$html.on('click', '[data-uk-lightbox]', function (e) {
        e.preventDefault()

        var link = UI.$(this)

        if (!link.data('lightbox')) {
          UI.lightbox(link, UI.Utils.options(link.attr('data-uk-lightbox')))
        }

        link.data('lightbox').show(link)
      })

      // keyboard navigation
      UI.$doc.on('keyup', function (e) {
        if (modal && modal.is(':visible') && modal.lightbox.options.keyboard) {
          e.preventDefault()

          switch (e.keyCode) {
            case 37:
              modal.lightbox.previous()
              break
            case 39:
              modal.lightbox.next()
              break
          }
        }
      })
    },

    init: function () {
      var siblings = []

      this.index = 0
      this.siblings = []

      if (this.element && this.element.length) {
        var domSiblings = this.options.group
          ? UI.$(
              [
                '[data-uk-lightbox*="' + this.options.group + '"]',
                "[data-uk-lightbox*='" + this.options.group + "']"
              ].join(',')
            )
          : this.element

        domSiblings.each(function () {
          var ele = UI.$(this)

          siblings.push({
            source: ele.attr('href'),
            title: ele.attr('data-title') || ele.attr('title'),
            type: ele.attr('data-lightbox-type') || 'auto',
            link: ele
          })
        })

        this.index = domSiblings.index(this.element)
        this.siblings = siblings
      } else if (this.options.group && this.options.group.length) {
        this.siblings = this.options.group
      }

      this.trigger('lightbox-init', [this])
    },

    show: function (index) {
      this.modal = getModal(this)

      // stop previous animation
      this.modal.dialog.stop()
      this.modal.content.stop()

      var $this = this,
        promise = UI.$.Deferred(),
        data,
        item

      index = index || 0

      // index is a jQuery object or DOM element
      if (typeof index == 'object') {
        this.siblings.forEach(function (s, idx) {
          if (index[0] === s.link[0]) {
            index = idx
          }
        })
      }

      // fix index if needed
      if (index < 0) {
        index = this.siblings.length - index
      } else if (!this.siblings[index]) {
        index = 0
      }

      item = this.siblings[index]

      data = {
        lightbox: $this,
        source: item.source,
        type: item.type,
        index: index,
        promise: promise,
        title: item.title,
        item: item,
        meta: {
          content: '',
          width: null,
          height: null
        }
      }

      this.index = index

      this.modal.content.empty()

      if (!this.modal.is(':visible')) {
        this.modal.content.css({ width: '', height: '' }).empty()
        this.modal.modal.show()
      }

      this.modal.loader.removeClass('uk-hidden')

      promise
        .promise()
        .done(function () {
          $this.data = data
          $this.fitSize(data)
        })
        .fail(function () {
          data.meta.content =
            '<div class="uk-position-cover uk-flex uk-flex-middle uk-flex-center"><strong>Loading resource failed!</strong></div>'
          data.meta.width = 400
          data.meta.height = 300

          $this.data = data
          $this.fitSize(data)
        })

      $this.trigger('showitem.uk.lightbox', [data])
    },

    fitSize: function () {
      var $this = this,
        data = this.data,
        pad = this.modal.dialog.outerWidth() - this.modal.dialog.width(),
        dpadTop = parseInt(this.modal.dialog.css('margin-top'), 10),
        dpadBot = parseInt(this.modal.dialog.css('margin-bottom'), 10),
        dpad = dpadTop + dpadBot,
        content = data.meta.content,
        duration = $this.options.duration

      if (this.siblings.length > 1) {
        content = [
          content,
          '<a href="#" class="uk-slidenav uk-slidenav-contrast uk-slidenav-previous uk-hidden-touch" data-lightbox-previous></a>',
          '<a href="#" class="uk-slidenav uk-slidenav-contrast uk-slidenav-next uk-hidden-touch" data-lightbox-next></a>'
        ].join('')
      }

      // calculate width
      var tmp = UI.$('<div>&nbsp;</div>').css({
          opacity: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          'max-width': $this.modal.dialog.css('max-width'),
          padding: $this.modal.dialog.css('padding'),
          margin: $this.modal.dialog.css('margin')
        }),
        maxwidth,
        maxheight,
        w = data.meta.width,
        h = data.meta.height

      tmp.appendTo('body').width()

      maxwidth = tmp.width()
      maxheight = window.innerHeight - dpad

      tmp.remove()

      this.modal.dialog.find('.uk-modal-caption').remove()

      if (data.title) {
        this.modal.dialog.append('<div class="uk-modal-caption">' + data.title + '</div>')
        maxheight -= this.modal.dialog.find('.uk-modal-caption').outerHeight()
      }

      if (maxwidth < data.meta.width) {
        h = Math.floor(h * (maxwidth / w))
        w = maxwidth
      }

      if (maxheight < h) {
        h = Math.floor(maxheight)
        w = Math.ceil(data.meta.width * (maxheight / data.meta.height))
      }

      this.modal.content
        .css('opacity', 0)
        .width(w)
        .html(content)

      if (data.type == 'iframe') {
        this.modal.content.find('iframe:first').height(h)
      }

      var dh = h + pad,
        t = Math.floor(window.innerHeight / 2 - dh / 2) - dpad

      if (t < 0) {
        t = 0
      }

      this.modal.closer.addClass('uk-hidden')

      if ($this.modal.data('mwidth') == w && $this.modal.data('mheight') == h) {
        duration = 0
      }

      this.modal.dialog.animate({ width: w + pad, height: h + pad, top: t }, duration, 'swing', function () {
        $this.modal.loader.addClass('uk-hidden')
        $this.modal.content.css({ width: '' }).animate({ opacity: 1 }, function () {
          $this.modal.closer.removeClass('uk-hidden')
        })

        $this.modal.data({ mwidth: w, mheight: h })
      })
    },

    next: function () {
      this.show(this.siblings[this.index + 1] ? this.index + 1 : 0)
    },

    previous: function () {
      this.show(this.siblings[this.index - 1] ? this.index - 1 : this.siblings.length - 1)
    }
  })

  // Plugins

  UI.plugin('lightbox', 'image', {
    init: function (lightbox) {
      lightbox.on('showitem.uk.lightbox', function (e, data) {
        if (data.type == 'image' || (data.source && data.source.match(/\.(jpg|jpeg|png|gif|svg)$/i))) {
          var resolve = function (source, width, height) {
            data.meta = {
              content:
                '<img class="uk-responsive-width" width="' + width + '" height="' + height + '" src ="' + source + '">',
              width: width,
              height: height
            }

            data.type = 'image'

            data.promise.resolve()
          }

          if (!cache[data.source]) {
            var img = new Image()

            img.onerror = function () {
              data.promise.reject('Loading image failed')
            }

            img.onload = function () {
              cache[data.source] = { width: img.width, height: img.height }
              resolve(data.source, cache[data.source].width, cache[data.source].height)
            }

            img.src = data.source
          } else {
            resolve(data.source, cache[data.source].width, cache[data.source].height)
          }
        }
      })
    }
  })

  UI.plugin('lightbox', 'youtube', {
    init: function (lightbox) {
      var youtubeRegExp = /(\/\/.*?youtube\.[a-z]+)\/watch\?v=([^&]+)&?(.*)/,
        youtubeRegExpShort = /youtu\.be\/(.*)/

      lightbox.on('showitem.uk.lightbox', function (e, data) {
        var id,
          matches,
          resolve = function (id, width, height) {
            data.meta = {
              content:
                '<iframe src="//www.youtube.com/embed/' +
                id +
                '" width="' +
                width +
                '" height="' +
                height +
                '" style="max-width:100%;"></iframe>',
              width: width,
              height: height
            }

            data.type = 'iframe'

            data.promise.resolve()
          }

        if ((matches = data.source.match(youtubeRegExp))) {
          id = matches[2]
        }

        if ((matches = data.source.match(youtubeRegExpShort))) {
          id = matches[1]
        }

        if (id) {
          if (!cache[id]) {
            var img = new Image(),
              lowres = false

            img.onerror = function () {
              cache[id] = { width: 640, height: 320 }
              resolve(id, cache[id].width, cache[id].height)
            }

            img.onload = function () {
              //youtube default 404 thumb, fall back to lowres
              if (img.width == 120 && img.height == 90) {
                if (!lowres) {
                  lowres = true
                  img.src = '//img.youtube.com/vi/' + id + '/0.jpg'
                } else {
                  cache[id] = { width: 640, height: 320 }
                  resolve(id, cache[id].width, cache[id].height)
                }
              } else {
                cache[id] = { width: img.width, height: img.height }
                resolve(id, img.width, img.height)
              }
            }

            img.src = '//img.youtube.com/vi/' + id + '/maxresdefault.jpg'
          } else {
            resolve(id, cache[id].width, cache[id].height)
          }

          e.stopImmediatePropagation()
        }
      })
    }
  })

  UI.plugin('lightbox', 'vimeo', {
    init: function (lightbox) {
      var regex = /(\/\/.*?)vimeo\.[a-z]+\/([0-9]+).*?/,
        matches

      lightbox.on('showitem.uk.lightbox', function (e, data) {
        var id,
          resolve = function (id, width, height) {
            data.meta = {
              content:
                '<iframe src="//player.vimeo.com/video/' +
                id +
                '" width="' +
                width +
                '" height="' +
                height +
                '" style="width:100%;box-sizing:border-box;"></iframe>',
              width: width,
              height: height
            }

            data.type = 'iframe'

            data.promise.resolve()
          }

        if ((matches = data.source.match(regex))) {
          id = matches[2]

          if (!cache[id]) {
            UI.$.ajax({
              type: 'GET',
              url: 'http://vimeo.com/api/oembed.json?url=' + encodeURI(data.source),
              jsonp: 'callback',
              dataType: 'jsonp',
              success: function (data) {
                cache[id] = { width: data.width, height: data.height }
                resolve(id, cache[id].width, cache[id].height)
              }
            })
          } else {
            resolve(id, cache[id].width, cache[id].height)
          }

          e.stopImmediatePropagation()
        }
      })
    }
  })

  UI.plugin('lightbox', 'video', {
    init: function (lightbox) {
      lightbox.on('showitem.uk.lightbox', function (e, data) {
        var resolve = function (source, width, height) {
          data.meta = {
            content:
              '<video class="uk-responsive-width" src="' +
              source +
              '" width="' +
              width +
              '" height="' +
              height +
              '" controls></video>',
            width: width,
            height: height
          }

          data.type = 'video'

          data.promise.resolve()
        }

        if (data.type == 'video' || data.source.match(/\.(mp4|webm|ogv)$/i)) {
          if (!cache[data.source]) {
            var vid = UI.$('<video style="position:fixed;visibility:hidden;top:-10000px;"></video>')
              .attr('src', data.source)
              .appendTo('body')

            var idle = setInterval(function () {
              if (vid[0].videoWidth) {
                clearInterval(idle)
                cache[data.source] = { width: vid[0].videoWidth, height: vid[0].videoHeight }
                resolve(data.source, cache[data.source].width, cache[data.source].height)
                vid.remove()
              }
            }, 20)
          } else {
            resolve(data.source, cache[data.source].width, cache[data.source].height)
          }
        }
      })
    }
  })

  function getModal (lightbox) {
    if (modal) {
      modal.lightbox = lightbox
      return modal
    }

    // init lightbox container
    modal = UI.$(
      [
        '<div class="uk-modal">',
        '<div class="uk-modal-dialog uk-modal-dialog-lightbox uk-slidenav-position" style="margin-left:auto;margin-right:auto;width:200px;height:200px;top:' +
          Math.abs(window.innerHeight / 2 - 200) +
          'px;">',
        '<a href="#" class="uk-modal-close uk-close uk-close-alt"></a>',
        '<div class="uk-lightbox-content"></div>',
        '<div class="uk-modal-spinner uk-hidden"></div>',
        '</div>',
        '</div>'
      ].join('')
    ).appendTo('body')

    modal.dialog = modal.find('.uk-modal-dialog:first')
    modal.content = modal.find('.uk-lightbox-content:first')
    modal.loader = modal.find('.uk-modal-spinner:first')
    modal.closer = modal.find('.uk-close.uk-close-alt')
    modal.modal = UI.modal(modal, { modal: false })

    // next / previous
    modal
      .on('swipeRight swipeLeft', function (e) {
        modal.lightbox[e.type == 'swipeLeft' ? 'next' : 'previous']()
      })
      .on('click', '[data-lightbox-previous], [data-lightbox-next]', function (e) {
        e.preventDefault()
        modal.lightbox[UI.$(this).is('[data-lightbox-next]') ? 'next' : 'previous']()
      })

    // destroy content on modal hide
    modal.on('hide.uk.modal', function (e) {
      modal.content.html('')
    })

    UI.$win.on(
      'load resize orientationchange',
      UI.Utils.debounce(
        function (e) {
          if (modal.is(':visible') && !UI.Utils.isFullscreen()) modal.lightbox.fitSize()
        }.bind(this),
        100
      )
    )

    modal.lightbox = lightbox

    return modal
  }

  UI.lightbox.create = function (items, options) {
    if (!items) return

    var group = [],
      o

    items.forEach(function (item) {
      group.push(
        UI.$.extend(
          {
            source: '',
            title: '',
            type: 'auto',
            link: false
          },
          typeof item == 'string' ? { source: item } : item
        )
      )
    })

    o = UI.lightbox(UI.$.extend({}, options, { group: group }))

    return o
  }

  return UI.lightbox
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
/*
 * Based on Nestable jQuery Plugin - Copyright (c) 2012 David Bushell - http://dbushell.com/
 */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-nestable', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  var hasTouch = 'ontouchstart' in window,
    html = UI.$html,
    touchedlists = [],
    $win = UI.$win,
    draggingElement

  var eStart = hasTouch ? 'touchstart' : 'mousedown',
    eMove = hasTouch ? 'touchmove' : 'mousemove',
    eEnd = hasTouch ? 'touchend' : 'mouseup',
    eCancel = hasTouch ? 'touchcancel' : 'mouseup'

  UI.component('nestable', {
    defaults: {
      listBaseClass: 'uk-nestable',
      listClass: 'uk-nestable-list',
      listItemClass: 'uk-nestable-item',
      dragClass: 'uk-nestable-dragged',
      movingClass: 'uk-nestable-moving',
      emptyClass: 'uk-nestable-empty',
      handleClass: '',
      collapsedClass: 'uk-collapsed',
      placeholderClass: 'uk-nestable-placeholder',
      noDragClass: 'uk-nestable-nodrag',
      group: false,
      maxDepth: 10,
      threshold: 20,
      idlethreshold: 10
    },

    boot: function () {
      // adjust document scrolling
      UI.$html.on('mousemove touchmove', function (e) {
        if (draggingElement) {
          var top = draggingElement.offset().top

          if (top < UI.$win.scrollTop()) {
            UI.$win.scrollTop(UI.$win.scrollTop() - Math.ceil(draggingElement.height() / 2))
          } else if (top + draggingElement.height() > window.innerHeight + UI.$win.scrollTop()) {
            UI.$win.scrollTop(UI.$win.scrollTop() + Math.ceil(draggingElement.height() / 2))
          }
        }
      })

      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-nestable]', context).each(function () {
          var ele = UI.$(this)

          if (!ele.data('nestable')) {
            UI.nestable(ele, UI.Utils.options(ele.attr('data-uk-nestable')))
          }
        })
      })
    },

    init: function () {
      var $this = this

      Object.keys(this.options).forEach(function (key) {
        if (String(key).indexOf('Class') != -1) {
          $this.options['_' + key] = '.' + $this.options[key]
        }
      })

      this.find(this.options._listItemClass)
        .find('>ul')
        .addClass(this.options.listClass)

      this.checkEmptyList()

      this.reset()
      this.element.data('nestable-group', this.options.group || UI.Utils.uid('nestable-group'))

      this.find(this.options._listItemClass).each(function () {
        $this.setParent(UI.$(this))
      })

      this.on('click', '[data-nestable-action]', function (e) {
        if ($this.dragEl || (!hasTouch && e.button !== 0)) {
          return
        }

        e.preventDefault()

        var target = UI.$(e.currentTarget),
          action = target.data('nestableAction'),
          item = target.closest($this.options._listItemClass)

        if (action === 'collapse') {
          $this.collapseItem(item)
        }
        if (action === 'expand') {
          $this.expandItem(item)
        }
        if (action === 'toggle') {
          $this.toggleItem(item)
        }
      })

      var onStartEvent = function (e) {
        var handle = UI.$(e.target)

        if (e.target === $this.element[0]) {
          return
        }

        if (handle.is($this.options._noDragClass) || handle.closest($this.options._noDragClass).length) {
          return
        }

        if (handle.is('[data-nestable-action]') || handle.closest('[data-nestable-action]').length) {
          return
        }

        if ($this.options.handleClass && !handle.hasClass($this.options.handleClass)) {
          if ($this.options.handleClass) {
            handle = handle.closest($this.options._handleClass)
          }
        }

        if (!handle.length || $this.dragEl || (!hasTouch && e.button !== 0) || (hasTouch && e.touches.length !== 1)) {
          return
        }

        if (e.originalEvent && e.originalEvent.touches) {
          e = evt.originalEvent.touches[0]
        }

        $this.delayMove = function (evt) {
          evt.preventDefault()
          $this.dragStart(e)
          $this.trigger('start.uk.nestable', [$this])

          $this.delayMove = false
        }

        $this.delayMove.x = parseInt(e.pageX, 10)
        $this.delayMove.y = parseInt(e.pageY, 10)
        $this.delayMove.threshold = $this.options.idlethreshold

        e.preventDefault()
      }

      var onMoveEvent = function (e) {
        if (e.originalEvent && e.originalEvent.touches) {
          e = e.originalEvent.touches[0]
        }

        if (
          $this.delayMove &&
          (Math.abs(e.pageX - $this.delayMove.x) > $this.delayMove.threshold ||
            Math.abs(e.pageY - $this.delayMove.y) > $this.delayMove.threshold)
        ) {
          if (!window.getSelection().toString()) {
            $this.delayMove(e)
          } else {
            $this.delayMove = false
          }
        }

        if ($this.dragEl) {
          e.preventDefault()
          $this.dragMove(e)
          $this.trigger('move.uk.nestable', [$this])
        }
      }

      var onEndEvent = function (e) {
        if ($this.dragEl) {
          e.preventDefault()
          $this.dragStop(hasTouch ? e.touches[0] : e)
        }

        draggingElement = false
        $this.delayMove = false
      }

      if (hasTouch) {
        this.element[0].addEventListener(eStart, onStartEvent, false)
        window.addEventListener(eMove, onMoveEvent, false)
        window.addEventListener(eEnd, onEndEvent, false)
        window.addEventListener(eCancel, onEndEvent, false)
      } else {
        this.on(eStart, onStartEvent)
        $win.on(eMove, onMoveEvent)
        $win.on(eEnd, onEndEvent)
      }
    },

    serialize: function () {
      var data,
        depth = 0,
        list = this,
        step = function (level, depth) {
          var array = [],
            items = level.children(list.options._listItemClass)

          items.each(function () {
            var li = UI.$(this),
              item = {},
              attribute,
              sub = li.children(list.options._listClass)

            for (var i = 0; i < li[0].attributes.length; i++) {
              attribute = li[0].attributes[i]
              if (attribute.name.indexOf('data-') === 0) {
                item[attribute.name.substr(5)] = UI.Utils.str2json(attribute.value)
              }
            }

            if (sub.length) {
              item.children = step(sub, depth + 1)
            }

            array.push(item)
          })
          return array
        }

      data = step(list.element, depth)

      return data
    },

    list: function (options) {
      var data = [],
        list = this,
        depth = 0,
        step = function (level, depth, parent) {
          var items = level.children(options._listItemClass)

          items.each(function (index) {
            var li = UI.$(this),
              item = UI.$.extend({ parent_id: parent ? parent : null, depth: depth, order: index }, li.data()),
              sub = li.children(options._listClass)

            data.push(item)

            if (sub.length) {
              step(sub, depth + 1, li.data(options.idProperty || 'id'))
            }
          })
        }

      options = UI.$.extend({}, list.options, options)

      step(list.element, depth)

      return data
    },

    reset: function () {
      this.mouse = {
        offsetX: 0,
        offsetY: 0,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        nowX: 0,
        nowY: 0,
        distX: 0,
        distY: 0,
        dirAx: 0,
        dirX: 0,
        dirY: 0,
        lastDirX: 0,
        lastDirY: 0,
        distAxX: 0,
        distAxY: 0
      }
      this.moving = false
      this.dragEl = null
      this.dragRootEl = null
      this.dragDepth = 0
      this.hasNewRoot = false
      this.pointEl = null

      for (var i = 0; i < touchedlists.length; i++) {
        this.checkEmptyList(touchedlists[i])
      }

      touchedlists = []
    },

    toggleItem: function (li) {
      this[li.hasClass(this.options.collapsedClass) ? 'expandItem' : 'collapseItem'](li)
    },

    expandItem: function (li) {
      li.removeClass(this.options.collapsedClass)
    },

    collapseItem: function (li) {
      var lists = li.children(this.options._listClass)
      if (lists.length) {
        li.addClass(this.options.collapsedClass)
      }
    },

    expandAll: function () {
      var list = this
      this.find(list.options._listItemClass).each(function () {
        list.expandItem(UI.$(this))
      })
    },

    collapseAll: function () {
      var list = this
      this.find(list.options._listItemClass).each(function () {
        list.collapseItem(UI.$(this))
      })
    },

    setParent: function (li) {
      if (li.children(this.options._listClass).length) {
        li.addClass('uk-parent')
      }
    },

    unsetParent: function (li) {
      li.removeClass('uk-parent ' + this.options.collapsedClass)
      li.children(this.options._listClass).remove()
    },

    dragStart: function (e) {
      var mouse = this.mouse,
        target = UI.$(e.target),
        dragItem = target.closest(this.options._listItemClass),
        offset = dragItem.offset()

      this.placeEl = dragItem

      mouse.offsetX = e.pageX - offset.left
      mouse.offsetY = e.pageY - offset.top

      mouse.startX = mouse.lastX = offset.left
      mouse.startY = mouse.lastY = offset.top

      this.dragRootEl = this.element

      this.dragEl = UI.$('<ul></ul>')
        .addClass(this.options.listClass + ' ' + this.options.dragClass)
        .append(dragItem.clone())
      this.dragEl.css('width', dragItem.width())
      this.placeEl.addClass(this.options.placeholderClass)

      draggingElement = this.dragEl

      this.tmpDragOnSiblings = [dragItem[0].previousSibling, dragItem[0].nextSibling]

      UI.$body.append(this.dragEl)

      this.dragEl.css({
        left: offset.left,
        top: offset.top
      })

      // total depth of dragging item
      var i,
        depth,
        items = this.dragEl.find(this.options._listItemClass)

      for (i = 0; i < items.length; i++) {
        depth = UI.$(items[i]).parents(this.options._listClass + ',' + this.options._listBaseClass).length
        if (depth > this.dragDepth) {
          this.dragDepth = depth
        }
      }

      html.addClass(this.options.movingClass)
    },

    dragStop: function (e) {
      var el = UI.$(this.placeEl),
        root = this.placeEl.parents(this.options._listBaseClass + ':first')

      this.placeEl.removeClass(this.options.placeholderClass)
      this.dragEl.remove()

      if (this.element[0] !== root[0]) {
        root.trigger('change.uk.nestable', [root.data('nestable'), el, 'added'])
        this.element.trigger('change.uk.nestable', [this, el, 'removed'])
      } else {
        this.element.trigger('change.uk.nestable', [this, el, 'moved'])
      }

      this.trigger('stop.uk.nestable', [this, el])

      this.reset()

      html.removeClass(this.options.movingClass)
    },

    dragMove: function (e) {
      var list,
        parent,
        prev,
        next,
        depth,
        opt = this.options,
        mouse = this.mouse,
        maxDepth = this.dragRootEl ? this.dragRootEl.data('nestable').options.maxDepth : opt.maxDepth

      this.dragEl.css({
        left: e.pageX - mouse.offsetX,
        top: e.pageY - mouse.offsetY
      })

      // mouse position last events
      mouse.lastX = mouse.nowX
      mouse.lastY = mouse.nowY
      // mouse position this events
      mouse.nowX = e.pageX
      mouse.nowY = e.pageY
      // distance mouse moved between events
      mouse.distX = mouse.nowX - mouse.lastX
      mouse.distY = mouse.nowY - mouse.lastY
      // direction mouse was moving
      mouse.lastDirX = mouse.dirX
      mouse.lastDirY = mouse.dirY
      // direction mouse is now moving (on both axis)
      mouse.dirX = mouse.distX === 0 ? 0 : mouse.distX > 0 ? 1 : -1
      mouse.dirY = mouse.distY === 0 ? 0 : mouse.distY > 0 ? 1 : -1
      // axis mouse is now moving on
      var newAx = Math.abs(mouse.distX) > Math.abs(mouse.distY) ? 1 : 0

      // do nothing on first move
      if (!mouse.moving) {
        mouse.dirAx = newAx
        mouse.moving = true
        return
      }

      // calc distance moved on this axis (and direction)
      if (mouse.dirAx !== newAx) {
        mouse.distAxX = 0
        mouse.distAxY = 0
      } else {
        mouse.distAxX += Math.abs(mouse.distX)
        if (mouse.dirX !== 0 && mouse.dirX !== mouse.lastDirX) {
          mouse.distAxX = 0
        }
        mouse.distAxY += Math.abs(mouse.distY)
        if (mouse.dirY !== 0 && mouse.dirY !== mouse.lastDirY) {
          mouse.distAxY = 0
        }
      }
      mouse.dirAx = newAx

      /**
       * move horizontal
       */
      if (mouse.dirAx && mouse.distAxX >= opt.threshold) {
        // reset move distance on x-axis for new phase
        mouse.distAxX = 0
        prev = this.placeEl.prev('li')

        // increase horizontal level if previous sibling exists and is not collapsed
        if (mouse.distX > 0 && prev.length && !prev.hasClass(opt.collapsedClass)) {
          // cannot increase level when item above is collapsed
          list = prev.find(opt._listClass).last()

          // check if depth limit has reached
          depth = this.placeEl.parents(opt._listClass + ',' + opt._listBaseClass).length

          if (depth + this.dragDepth <= maxDepth) {
            // create new sub-level if one doesn't exist
            if (!list.length) {
              list = UI.$('<ul/>').addClass(opt.listClass)
              list.append(this.placeEl)
              prev.append(list)
              this.setParent(prev)
            } else {
              // else append to next level up
              list = prev.children(opt._listClass).last()
              list.append(this.placeEl)
            }
          }
        }

        // decrease horizontal level
        if (mouse.distX < 0) {
          // we cannot decrease the level if an item precedes the current one
          next = this.placeEl.next(opt._listItemClass)
          if (!next.length) {
            // get parent ul of the list item
            var parentUl = this.placeEl.closest([opt._listBaseClass, opt._listClass].join(','))
            // try to get the li surrounding the ul
            var surroundingLi = parentUl.closest(opt._listItemClass)

            // if the ul is inside of a li (meaning it is nested)
            if (surroundingLi.length) {
              // we can decrease the horizontal level
              surroundingLi.after(this.placeEl)
              // if the previous parent ul is now empty
              if (!parentUl.children().length) {
                this.unsetParent(surroundingLi)
              }
            }
          }
        }
      }

      var isEmpty = false

      // find list item under cursor
      var pointX = e.pageX - (window.pageXOffset || document.scrollLeft || 0),
        pointY = e.pageY - (window.pageYOffset || document.documentElement.scrollTop)
      this.pointEl = UI.$(document.elementFromPoint(pointX, pointY))

      if (opt.handleClass && this.pointEl.hasClass(opt.handleClass)) {
        this.pointEl = this.pointEl.closest(opt._listItemClass)
      } else {
        var nestableitem = this.pointEl.closest(opt._listItemClass)

        if (nestableitem.length) {
          this.pointEl = nestableitem
        }
      }

      if (this.placeEl.find(this.pointEl).length) {
        return
      }

      if (this.pointEl.data('nestable') && !this.pointEl.children().length) {
        isEmpty = true
        this.checkEmptyList(this.pointEl)
      } else if (!this.pointEl.length || !this.pointEl.hasClass(opt.listItemClass)) {
        return
      }

      // find parent list of item under cursor
      var pointElRoot = this.element,
        tmpRoot = this.pointEl.closest(this.options._listBaseClass),
        isNewRoot = pointElRoot[0] != tmpRoot[0]

      /**
       * move vertical
       */
      if (!mouse.dirAx || isNewRoot || isEmpty) {
        // check if groups match if dragging over new root
        if (isNewRoot && opt.group !== tmpRoot.data('nestable-group')) {
          return
        } else {
          touchedlists.push(pointElRoot)
        }

        // check depth limit
        depth = this.dragDepth - 1 + this.pointEl.parents(opt._listClass + ',' + opt._listBaseClass).length

        if (depth > maxDepth) {
          return
        }

        var before = e.pageY < this.pointEl.offset().top + this.pointEl.height() / 2

        parent = this.placeEl.parent()

        if (isEmpty) {
          this.pointEl.append(this.placeEl)
        } else if (before) {
          this.pointEl.before(this.placeEl)
        } else {
          this.pointEl.after(this.placeEl)
        }

        if (!parent.children().length) {
          if (!parent.data('nestable')) this.unsetParent(parent.parent())
        }

        this.checkEmptyList(this.dragRootEl)
        this.checkEmptyList(pointElRoot)

        // parent root list has changed
        if (isNewRoot) {
          this.dragRootEl = tmpRoot
          this.hasNewRoot = this.element[0] !== this.dragRootEl[0]
        }
      }
    },

    checkEmptyList: function (list) {
      list = list ? UI.$(list) : this.element

      if (this.options.emptyClass) {
        list[!list.children().length ? 'addClass' : 'removeClass'](this.options.emptyClass)
      }
    }
  })

  return UI.nestable
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-notify', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  var containers = {},
    messages = {},
    notify = function (options) {
      if (UI.$.type(options) == 'string') {
        options = { message: options }
      }

      if (arguments[1]) {
        options = UI.$.extend(options, UI.$.type(arguments[1]) == 'string' ? { status: arguments[1] } : arguments[1])
      }

      return new Message(options).show()
    },
    closeAll = function (group, instantly) {
      var id

      if (group) {
        for (id in messages) {
          if (group === messages[id].group) messages[id].close(instantly)
        }
      } else {
        for (id in messages) {
          messages[id].close(instantly)
        }
      }
    }

  var Message = function (options) {
    this.options = UI.$.extend({}, Message.defaults, options)

    this.uuid = UI.Utils.uid('notifymsg')
    this.element = UI.$(
      ['<div class="uk-notify-message">', '<a class="uk-close"></a>', '<div></div>', '</div>'].join('')
    ).data('notifyMessage', this)

    this.content(this.options.message)

    // status
    if (this.options.status) {
      this.element.addClass('uk-notify-message-' + this.options.status)
      this.currentstatus = this.options.status
    }

    this.group = this.options.group

    messages[this.uuid] = this

    if (!containers[this.options.pos]) {
      containers[this.options.pos] = UI.$('<div class="uk-notify uk-notify-' + this.options.pos + '"></div>')
        .appendTo('body')
        .on('click', '.uk-notify-message', function () {
          var message = UI.$(this).data('notifyMessage')

          message.element.trigger('manualclose.uk.notify', [message])
          message.close()
        })
    }
  }

  UI.$.extend(Message.prototype, {
    uuid: false,
    element: false,
    timout: false,
    currentstatus: '',
    group: false,

    show: function () {
      if (this.element.is(':visible')) return

      var $this = this

      containers[this.options.pos].show().prepend(this.element)

      var marginbottom = parseInt(this.element.css('margin-bottom'), 10)

      this.element
        .css({ opacity: 0, 'margin-top': -1 * this.element.outerHeight(), 'margin-bottom': 0 })
        .animate({ opacity: 1, 'margin-top': 0, 'margin-bottom': marginbottom }, function () {
          if ($this.options.timeout) {
            var closefn = function () {
              $this.close()
            }

            $this.timeout = setTimeout(closefn, $this.options.timeout)

            $this.element.hover(
              function () {
                clearTimeout($this.timeout)
              },
              function () {
                $this.timeout = setTimeout(closefn, $this.options.timeout)
              }
            )
          }
        })

      return this
    },

    close: function (instantly) {
      var $this = this,
        finalize = function () {
          $this.element.remove()

          if (!containers[$this.options.pos].children().length) {
            containers[$this.options.pos].hide()
          }

          $this.options.onClose.apply($this, [])
          $this.element.trigger('close.uk.notify', [$this])

          delete messages[$this.uuid]
        }

      if (this.timeout) clearTimeout(this.timeout)

      if (instantly) {
        finalize()
      } else {
        this.element.animate(
          { opacity: 0, 'margin-top': -1 * this.element.outerHeight(), 'margin-bottom': 0 },
          function () {
            finalize()
          }
        )
      }
    },

    content: function (html) {
      var container = this.element.find('>div')

      if (!html) {
        return container.html()
      }

      container.html(html)

      return this
    },

    status: function (status) {
      if (!status) {
        return this.currentstatus
      }

      this.element.removeClass('uk-notify-message-' + this.currentstatus).addClass('uk-notify-message-' + status)

      this.currentstatus = status

      return this
    }
  })

  Message.defaults = {
    message: '',
    status: '',
    timeout: 5000,
    group: null,
    pos: 'top-center',
    onClose: function () {}
  }

  UI.notify = notify
  UI.notify.message = Message
  UI.notify.closeAll = closeAll

  return notify
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-slideshow', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  var Animations,
    playerId = 0

  UI.component('slideshow', {
    defaults: {
      animation: 'fade',
      duration: 500,
      height: 'auto',
      start: 0,
      autoplay: false,
      autoplayInterval: 7000,
      videoautoplay: true,
      videomute: true,
      slices: 15,
      pauseOnHover: true,
      kenburns: false,
      kenburnsanimations: [
        'uk-animation-middle-left',
        'uk-animation-top-right',
        'uk-animation-bottom-left',
        'uk-animation-top-center',
        '', // middle-center
        'uk-animation-bottom-right'
      ]
    },

    current: false,
    interval: null,
    hovering: false,

    boot: function () {
      // init code
      UI.ready(function (context) {
        UI.$('[data-uk-slideshow]', context).each(function () {
          var slideshow = UI.$(this)

          if (!slideshow.data('slideshow')) {
            UI.slideshow(slideshow, UI.Utils.options(slideshow.attr('data-uk-slideshow')))
          }
        })
      })
    },

    init: function () {
      var $this = this,
        canvas,
        kbanimduration

      this.container = this.element.hasClass('uk-slideshow') ? this.element : UI.$(this.find('.uk-slideshow'))
      this.slides = this.container.children()
      this.slidesCount = this.slides.length
      this.current = this.options.start
      this.animating = false
      this.triggers = this.find('[data-uk-slideshow-item]')
      this.fixFullscreen =
        navigator.userAgent.match(/(iPad|iPhone|iPod)/g) && this.container.hasClass('uk-slideshow-fullscreen') // viewport unit fix for height:100vh - should be fixed in iOS 8

      if (this.options.kenburns) {
        kbanimduration = this.options.kenburns === true ? '15s' : this.options.kenburns

        if (!String(kbanimduration).match(/(ms|s)$/)) {
          kbanimduration += 'ms'
        }

        if (typeof this.options.kenburnsanimations == 'string') {
          this.options.kenburnsanimations = this.options.kenburnsanimations.split(',')
        }
      }

      this.slides.each(function (index) {
        var slide = UI.$(this),
          media = slide.children('img,video,iframe').eq(0)

        slide.data('media', media)
        slide.data('sizer', media)

        if (media.length) {
          var placeholder

          switch (media[0].nodeName) {
            case 'IMG':
              var cover = UI.$('<div class="uk-cover-background uk-position-cover"></div>').css({
                'background-image': 'url(' + media.attr('src') + ')'
              })

              if (media.attr('width') && media.attr('height')) {
                placeholder = UI.$('<canvas></canvas>').attr({
                  width: media.attr('width'),
                  height: media.attr('height')
                })
                media.replaceWith(placeholder)
                media = placeholder
                placeholder = undefined
              }

              media.css({ width: '100%', height: 'auto', opacity: 0 })
              slide.prepend(cover).data('cover', cover)
              break

            case 'IFRAME':
              var src = media[0].src,
                iframeId = 'sw-' + ++playerId

              media
                .attr('src', '')
                .on('load', function () {
                  if (index !== $this.current || (index == $this.current && !$this.options.videoautoplay)) {
                    $this.pausemedia(media)
                  }

                  if ($this.options.videomute) {
                    $this.mutemedia(media)

                    var inv = setInterval(
                      (function (ic) {
                        return function () {
                          $this.mutemedia(media)
                          if (++ic >= 4) clearInterval(inv)
                        }
                      })(0),
                      250
                    )
                  }
                })
                .data('slideshow', $this) // add self-reference for the vimeo-ready listener
                .attr('data-player-id', iframeId) // add frameId for the vimeo-ready listener
                .attr(
                  'src',
                  [src, src.indexOf('?') > -1 ? '&' : '?', 'enablejsapi=1&api=1&player_id=' + iframeId].join('')
                )
                .addClass('uk-position-absolute')

              // disable pointer events
              if (!UI.support.touch) media.css('pointer-events', 'none')

              placeholder = true

              if (UI.cover) {
                UI.cover(media)
                media.attr('data-uk-cover', '{}')
              }

              break

            case 'VIDEO':
              media.addClass('uk-cover-object uk-position-absolute')
              placeholder = true

              if ($this.options.videomute) $this.mutemedia(media)
          }

          if (placeholder) {
            canvas = UI.$('<canvas></canvas>').attr({ width: media[0].width, height: media[0].height })
            var img = UI.$('<img style="width:100%;height:auto;">').attr('src', canvas[0].toDataURL())

            slide.prepend(img)
            slide.data('sizer', img)
          }
        } else {
          slide.data('sizer', slide)
        }

        if ($this.hasKenBurns(slide)) {
          slide.data('cover').css({
            '-webkit-animation-duration': kbanimduration,
            'animation-duration': kbanimduration
          })
        }
      })

      this.on('click.uikit.slideshow', '[data-uk-slideshow-item]', function (e) {
        e.preventDefault()

        var slide = UI.$(this).attr('data-uk-slideshow-item')

        if ($this.current == slide) return

        switch (slide) {
          case 'next':
          case 'previous':
            $this[slide == 'next' ? 'next' : 'previous']()
            break
          default:
            $this.show(parseInt(slide, 10))
        }

        $this.stop()
      })

      // Set start slide
      this.slides
        .attr('aria-hidden', 'true')
        .eq(this.current)
        .addClass('uk-active')
        .attr('aria-hidden', 'false')
      this.triggers.filter('[data-uk-slideshow-item="' + this.current + '"]').addClass('uk-active')

      UI.$win.on(
        'resize load',
        UI.Utils.debounce(function () {
          $this.resize()

          if ($this.fixFullscreen) {
            $this.container.css('height', window.innerHeight)
            $this.slides.css('height', window.innerHeight)
          }
        }, 100)
      )

      // chrome image load fix
      setTimeout(function () {
        $this.resize()
      }, 80)

      // Set autoplay
      if (this.options.autoplay) {
        this.start()
      }

      if (this.options.videoautoplay && this.slides.eq(this.current).data('media')) {
        this.playmedia(this.slides.eq(this.current).data('media'))
      }

      if (this.options.kenburns) {
        this.applyKenBurns(this.slides.eq(this.current))
      }

      this.container.on({
        mouseenter: function () {
          if ($this.options.pauseOnHover) $this.hovering = true
        },
        mouseleave: function () {
          $this.hovering = false
        }
      })

      this.on('swipeRight swipeLeft', function (e) {
        $this[e.type == 'swipeLeft' ? 'next' : 'previous']()
      })

      this.on('display.uk.check', function () {
        if ($this.element.is(':visible')) {
          $this.resize()

          if ($this.fixFullscreen) {
            $this.container.css('height', window.innerHeight)
            $this.slides.css('height', window.innerHeight)
          }
        }
      })
    },

    resize: function () {
      if (this.container.hasClass('uk-slideshow-fullscreen')) return

      var height = this.options.height

      if (this.options.height === 'auto') {
        height = 0

        this.slides.css('height', '').each(function () {
          height = Math.max(height, UI.$(this).height())
        })
      }

      this.container.css('height', height)
      this.slides.css('height', height)
    },

    show: function (index, direction) {
      if (this.animating || this.current == index) return

      this.animating = true

      var $this = this,
        current = this.slides.eq(this.current),
        next = this.slides.eq(index),
        dir = direction ? direction : this.current < index ? 1 : -1,
        currentmedia = current.data('media'),
        animation = Animations[this.options.animation] ? this.options.animation : 'fade',
        nextmedia = next.data('media'),
        finalize = function () {
          if (!$this.animating) return

          if (currentmedia && currentmedia.is('video,iframe')) {
            $this.pausemedia(currentmedia)
          }

          if (nextmedia && nextmedia.is('video,iframe')) {
            $this.playmedia(nextmedia)
          }

          next.addClass('uk-active').attr('aria-hidden', 'false')
          current.removeClass('uk-active').attr('aria-hidden', 'true')

          $this.animating = false
          $this.current = index

          UI.Utils.checkDisplay(next, '[class*="uk-animation-"]:not(.uk-cover-background.uk-position-cover)')

          $this.trigger('show.uk.slideshow', [next, current, $this])
        }

      $this.applyKenBurns(next)

      // animation fallback
      if (!UI.support.animation) {
        animation = 'none'
      }

      current = UI.$(current)
      next = UI.$(next)

      $this.trigger('beforeshow.uk.slideshow', [next, current, $this])

      Animations[animation].apply(this, [current, next, dir]).then(finalize)

      $this.triggers.removeClass('uk-active')
      $this.triggers.filter('[data-uk-slideshow-item="' + index + '"]').addClass('uk-active')
    },

    applyKenBurns: function (slide) {
      if (!this.hasKenBurns(slide)) {
        return
      }

      var animations = this.options.kenburnsanimations,
        index = this.kbindex || 0

      slide
        .data('cover')
        .attr('class', 'uk-cover-background uk-position-cover')
        .width()
      slide.data('cover').addClass(['uk-animation-scale', 'uk-animation-reverse', animations[index].trim()].join(' '))

      this.kbindex = animations[index + 1] ? index + 1 : 0
    },

    hasKenBurns: function (slide) {
      return this.options.kenburns && slide.data('cover')
    },

    next: function () {
      this.show(this.slides[this.current + 1] ? this.current + 1 : 0, 1)
    },

    previous: function () {
      this.show(this.slides[this.current - 1] ? this.current - 1 : this.slides.length - 1, -1)
    },

    start: function () {
      this.stop()

      var $this = this

      this.interval = setInterval(function () {
        if (!$this.hovering) $this.next()
      }, this.options.autoplayInterval)
    },

    stop: function () {
      if (this.interval) clearInterval(this.interval)
    },

    playmedia: function (media) {
      if (!(media && media[0])) return

      switch (media[0].nodeName) {
        case 'VIDEO':
          if (!this.options.videomute) {
            media[0].muted = false
          }

          media[0].play()
          break
        case 'IFRAME':
          if (!this.options.videomute) {
            media[0].contentWindow.postMessage(
              '{ "event": "command", "func": "unmute", "method":"setVolume", "value":1}',
              '*'
            )
          }

          media[0].contentWindow.postMessage('{ "event": "command", "func": "playVideo", "method":"play"}', '*')
          break
      }
    },

    pausemedia: function (media) {
      switch (media[0].nodeName) {
        case 'VIDEO':
          media[0].pause()
          break
        case 'IFRAME':
          media[0].contentWindow.postMessage('{ "event": "command", "func": "pauseVideo", "method":"pause"}', '*')
          break
      }
    },

    mutemedia: function (media) {
      switch (media[0].nodeName) {
        case 'VIDEO':
          media[0].muted = true
          break
        case 'IFRAME':
          media[0].contentWindow.postMessage(
            '{ "event": "command", "func": "mute", "method":"setVolume", "value":0}',
            '*'
          )
          break
      }
    }
  })

  Animations = {
    none: function () {
      var d = UI.$.Deferred()
      d.resolve()
      return d.promise()
    },

    scroll: function (current, next, dir) {
      var d = UI.$.Deferred()

      current.css('animation-duration', this.options.duration + 'ms')
      next.css('animation-duration', this.options.duration + 'ms')

      next.css('opacity', 1).one(
        UI.support.animation.end,
        function () {
          current.removeClass(dir == -1 ? 'uk-slideshow-scroll-backward-out' : 'uk-slideshow-scroll-forward-out')
          next
            .css('opacity', '')
            .removeClass(dir == -1 ? 'uk-slideshow-scroll-backward-in' : 'uk-slideshow-scroll-forward-in')
          d.resolve()
        }.bind(this)
      )

      current.addClass(dir == -1 ? 'uk-slideshow-scroll-backward-out' : 'uk-slideshow-scroll-forward-out')
      next.addClass(dir == -1 ? 'uk-slideshow-scroll-backward-in' : 'uk-slideshow-scroll-forward-in')
      next.width() // force redraw

      return d.promise()
    },

    swipe: function (current, next, dir) {
      var d = UI.$.Deferred()

      current.css('animation-duration', this.options.duration + 'ms')
      next.css('animation-duration', this.options.duration + 'ms')

      next.css('opacity', 1).one(
        UI.support.animation.end,
        function () {
          current.removeClass(dir === -1 ? 'uk-slideshow-swipe-backward-out' : 'uk-slideshow-swipe-forward-out')
          next
            .css('opacity', '')
            .removeClass(dir === -1 ? 'uk-slideshow-swipe-backward-in' : 'uk-slideshow-swipe-forward-in')
          d.resolve()
        }.bind(this)
      )

      current.addClass(dir == -1 ? 'uk-slideshow-swipe-backward-out' : 'uk-slideshow-swipe-forward-out')
      next.addClass(dir == -1 ? 'uk-slideshow-swipe-backward-in' : 'uk-slideshow-swipe-forward-in')
      next.width() // force redraw

      return d.promise()
    },

    scale: function (current, next, dir) {
      var d = UI.$.Deferred()

      current.css('animation-duration', this.options.duration + 'ms')
      next.css('animation-duration', this.options.duration + 'ms')

      next.css('opacity', 1)

      current.one(
        UI.support.animation.end,
        function () {
          current.removeClass('uk-slideshow-scale-out')
          next.css('opacity', '')
          d.resolve()
        }.bind(this)
      )

      current.addClass('uk-slideshow-scale-out')
      current.width() // force redraw

      return d.promise()
    },

    fade: function (current, next, dir) {
      var d = UI.$.Deferred()

      current.css('animation-duration', this.options.duration + 'ms')
      next.css('animation-duration', this.options.duration + 'ms')

      next.css('opacity', 1)

      // for plain text content slides - looks smoother
      if (!(next.data('cover') || next.data('placeholder'))) {
        next
          .css('opacity', 1)
          .one(UI.support.animation.end, function () {
            next.removeClass('uk-slideshow-fade-in')
          })
          .addClass('uk-slideshow-fade-in')
      }

      current.one(
        UI.support.animation.end,
        function () {
          current.removeClass('uk-slideshow-fade-out')
          next.css('opacity', '')
          d.resolve()
        }.bind(this)
      )

      current.addClass('uk-slideshow-fade-out')
      current.width() // force redraw

      return d.promise()
    }
  }

  UI.slideshow.animations = Animations

  // Listen for messages from the vimeo player
  window.addEventListener(
    'message',
    function onMessageReceived (e) {
      var data = e.data,
        iframe

      if (typeof data == 'string') {
        try {
          data = JSON.parse(data)
        } catch (err) {
          data = {}
        }
      }

      if (e.origin && e.origin.indexOf('vimeo') > -1 && data.event == 'ready' && data.player_id) {
        iframe = UI.$('[data-player-id="' + data.player_id + '"]')

        if (iframe.length) {
          iframe.data('slideshow').mutemedia(iframe)
        }
      }
    },
    false
  )
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
/*
 * Based on nativesortable - Copyright (c) Brian Grinstead - https://github.com/bgrins/nativesortable
 */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-sortable', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  var supportsTouch = 'ontouchstart' in window || (window.DocumentTouch && document instanceof DocumentTouch),
    draggingPlaceholder,
    currentlyDraggingElement,
    currentlyDraggingTarget,
    dragging,
    moving,
    clickedlink,
    delayIdle,
    touchedlists,
    moved,
    overElement

  function closestSortable (ele) {
    ele = UI.$(ele)

    do {
      if (ele.data('sortable')) {
        return ele
      }
      ele = UI.$(ele).parent()
    } while (ele.length)

    return ele
  }

  UI.component('sortable', {
    defaults: {
      animation: 150,
      threshold: 10,

      childClass: 'uk-sortable-item',
      placeholderClass: 'uk-sortable-placeholder',
      overClass: 'uk-sortable-over',
      draggingClass: 'uk-sortable-dragged',
      dragMovingClass: 'uk-sortable-moving',
      baseClass: 'uk-sortable',
      noDragClass: 'uk-sortable-nodrag',
      emptyClass: 'uk-sortable-empty',
      dragCustomClass: '',
      handleClass: false,
      group: false,

      stop: function () {},
      start: function () {},
      change: function () {}
    },

    boot: function () {
      // auto init
      UI.ready(function (context) {
        UI.$('[data-uk-sortable]', context).each(function () {
          var ele = UI.$(this)

          if (!ele.data('sortable')) {
            UI.sortable(ele, UI.Utils.options(ele.attr('data-uk-sortable')))
          }
        })
      })

      UI.$html.on('mousemove touchmove', function (e) {
        if (delayIdle) {
          var src = e.originalEvent.targetTouches ? e.originalEvent.targetTouches[0] : e

          if (
            Math.abs(src.pageX - delayIdle.pos.x) > delayIdle.threshold ||
            Math.abs(src.pageY - delayIdle.pos.y) > delayIdle.threshold
          ) {
            delayIdle.apply(src)
          }
        }

        if (draggingPlaceholder) {
          if (!moving) {
            moving = true
            draggingPlaceholder.show()

            draggingPlaceholder.$current.addClass(draggingPlaceholder.$sortable.options.placeholderClass)
            draggingPlaceholder.$sortable.element.children().addClass(draggingPlaceholder.$sortable.options.childClass)

            UI.$html.addClass(draggingPlaceholder.$sortable.options.dragMovingClass)
          }

          var offset = draggingPlaceholder.data('mouse-offset'),
            left = parseInt(e.originalEvent.pageX, 10) + offset.left,
            top = parseInt(e.originalEvent.pageY, 10) + offset.top

          draggingPlaceholder.css({ left: left, top: top })

          // adjust document scrolling

          if (top + draggingPlaceholder.height() / 3 > document.body.offsetHeight) {
            return
          }

          if (top < UI.$win.scrollTop()) {
            UI.$win.scrollTop(UI.$win.scrollTop() - Math.ceil(draggingPlaceholder.height() / 3))
          } else if (top + draggingPlaceholder.height() / 3 > window.innerHeight + UI.$win.scrollTop()) {
            UI.$win.scrollTop(UI.$win.scrollTop() + Math.ceil(draggingPlaceholder.height() / 3))
          }
        }
      })

      UI.$html.on('mouseup touchend', function (e) {
        delayIdle = clickedlink = false

        // dragging?
        if (!currentlyDraggingElement || !draggingPlaceholder) {
          // completely reset dragging attempt. will cause weird delay behavior elsewise
          currentlyDraggingElement = draggingPlaceholder = null
          return
        }

        // inside or outside of sortable?
        var sortable = closestSortable(e.target),
          component = draggingPlaceholder.$sortable,
          ev = { type: e.type }

        if (sortable[0]) {
          component.dragDrop(ev, component.element)
        }
        component.dragEnd(ev, component.element)
      })
    },

    init: function () {
      var $this = this,
        element = this.element[0]

      touchedlists = []

      this.checkEmptyList()

      this.element.data('sortable-group', this.options.group ? this.options.group : UI.Utils.uid('sortable-group'))

      var handleDragStart = delegate(function (e) {
        if (e.data && e.data.sortable) {
          return
        }

        var $target = UI.$(e.target),
          $link = $target.is('a[href]') ? $target : $target.parents('a[href]')

        if ($target.is(':input')) {
          return
        }

        e.preventDefault()

        if (!supportsTouch && $link.length) {
          $link
            .one('click', function (e) {
              e.preventDefault()
            })
            .one('mouseup', function () {
              if (!moved) $link.trigger('click')
            })
        }

        e.data = e.data || {}

        e.data.sortable = element

        return $this.dragStart(e, this)
      })

      var handleDragOver = delegate(function (e) {
        if (!currentlyDraggingElement) {
          return true
        }

        if (e.preventDefault) {
          e.preventDefault()
        }

        return false
      })

      var handleDragEnter = delegate(
        UI.Utils.debounce(function (e) {
          return $this.dragEnter(e, this)
        }),
        40
      )

      var handleDragLeave = delegate(function (e) {
        // Prevent dragenter on a child from allowing a dragleave on the container
        var previousCounter = $this.dragenterData(this)
        $this.dragenterData(this, previousCounter - 1)

        // This is a fix for child elements firing dragenter before the parent fires dragleave
        if (!$this.dragenterData(this)) {
          UI.$(this).removeClass($this.options.overClass)
          $this.dragenterData(this, false)
        }
      })

      var handleTouchMove = delegate(function (e) {
        if (!currentlyDraggingElement || currentlyDraggingElement === this || currentlyDraggingTarget === this) {
          return true
        }

        $this.element.children().removeClass($this.options.overClass)
        currentlyDraggingTarget = this

        $this.moveElementNextTo(currentlyDraggingElement, this)

        return prevent(e)
      })

      // Bind/unbind standard mouse/touch events as a polyfill.
      function addDragHandlers () {
        if (supportsTouch) {
          element.addEventListener('touchmove', handleTouchMove, false)
        } else {
          element.addEventListener('mouseover', handleDragEnter, false)
          element.addEventListener('mouseout', handleDragLeave, false)
        }

        // document.addEventListener("selectstart", prevent, false);
      }

      function removeDragHandlers () {
        if (supportsTouch) {
          element.removeEventListener('touchmove', handleTouchMove, false)
        } else {
          element.removeEventListener('mouseover', handleDragEnter, false)
          element.removeEventListener('mouseout', handleDragLeave, false)
        }

        // document.removeEventListener("selectstart", prevent, false);
      }

      this.addDragHandlers = addDragHandlers
      this.removeDragHandlers = removeDragHandlers

      function handleDragMove (e) {
        if (!currentlyDraggingElement) {
          return
        }

        $this.dragMove(e, $this)
      }

      function delegate (fn) {
        return function (e) {
          var touch, target, context

          if (e) {
            touch = (supportsTouch && e.touches && e.touches[0]) || {}
            target = touch.target || e.target

            // Fix event.target for a touch event
            if (supportsTouch && document.elementFromPoint) {
              target = document.elementFromPoint(e.pageX - document.body.scrollLeft, e.pageY - document.body.scrollTop)
            }

            overElement = UI.$(target)
          }

          if (UI.$(target).hasClass($this.options.childClass)) {
            fn.apply(target, [e])
          } else if (target !== element) {
            // If a child is initiating the event or ending it, then use the container as context for the callback.
            context = moveUpToChildNode(element, target)

            if (context) {
              fn.apply(context, [e])
            }
          }
        }
      }

      window.addEventListener(supportsTouch ? 'touchmove' : 'mousemove', handleDragMove, false)
      element.addEventListener(supportsTouch ? 'touchstart' : 'mousedown', handleDragStart, false)
    },

    dragStart: function (e, elem) {
      moved = false
      moving = false
      dragging = false

      var $this = this,
        target = UI.$(e.target)

      if (!supportsTouch && e.button == 2) {
        return
      }

      if ($this.options.handleClass) {
        var handle = target.hasClass($this.options.handleClass)
          ? target
          : target.closest('.' + $this.options.handleClass, $this.element)

        if (!handle.length) {
          //e.preventDefault();
          return
        }
      }

      if (target.is('.' + $this.options.noDragClass) || target.closest('.' + $this.options._noDragClass).length) {
        return
      }

      // prevent dragging if taget is a form field
      if (target.is(':input')) {
        return
      }

      currentlyDraggingElement = elem

      // init drag placeholder
      if (draggingPlaceholder) {
        draggingPlaceholder.remove()
      }

      var $current = UI.$(currentlyDraggingElement),
        offset = $current.offset()

      delayIdle = {
        pos: { x: e.pageX, y: e.pageY },
        threshold: $this.options.threshold,
        apply: function (evt) {
          draggingPlaceholder = UI.$(
            '<div class="' + [$this.options.draggingClass, $this.options.dragCustomClass].join(' ') + '"></div>'
          )
            .css({
              display: 'none',
              top: offset.top,
              left: offset.left,
              width: $current.width(),
              height: $current.height(),
              padding: $current.css('padding')
            })
            .data({
              'mouse-offset': {
                left: offset.left - parseInt(evt.pageX, 10),
                top: offset.top - parseInt(evt.pageY, 10)
              },
              origin: $this.element,
              index: $current.index()
            })
            .append($current.html())
            .appendTo('body')

          draggingPlaceholder.$current = $current
          draggingPlaceholder.$sortable = $this

          $current.data({
            'start-list': $current.parent(),
            'start-index': $current.index(),
            'sortable-group': $this.options.group
          })

          $this.addDragHandlers()

          $this.options.start(this, currentlyDraggingElement)
          $this.trigger('start.uk.sortable', [$this, currentlyDraggingElement])

          moved = true
          delayIdle = false
        }
      }
    },

    dragMove: function (e, elem) {
      overElement = UI.$(
        document.elementFromPoint(
          e.pageX - (document.body.scrollLeft || document.scrollLeft || 0),
          e.pageY - (document.body.scrollTop || document.documentElement.scrollTop || 0)
        )
      )

      var overRoot = overElement.closest('.' + this.options.baseClass),
        groupOver = overRoot.data('sortable-group'),
        $current = UI.$(currentlyDraggingElement),
        currentRoot = $current.parent(),
        groupCurrent = $current.data('sortable-group'),
        overChild

      if (overRoot[0] !== currentRoot[0] && groupCurrent !== undefined && groupOver === groupCurrent) {
        overRoot.data('sortable').addDragHandlers()

        touchedlists.push(overRoot)
        overRoot.children().addClass(this.options.childClass)

        // swap root
        if (overRoot.children().length > 0) {
          overChild = overElement.closest('.' + this.options.childClass)

          if (overChild.length) {
            overChild.before($current)
          } else {
            overRoot.append($current)
          }
        } else {
          // empty list
          overElement.append($current)
        }

        UIkit.$doc.trigger('mouseover')
      }

      this.checkEmptyList()
      this.checkEmptyList(currentRoot)
    },

    dragEnter: function (e, elem) {
      if (!currentlyDraggingElement || currentlyDraggingElement === elem) {
        return true
      }

      var previousCounter = this.dragenterData(elem)

      this.dragenterData(elem, previousCounter + 1)

      // Prevent dragenter on a child from allowing a dragleave on the container
      if (previousCounter === 0) {
        var currentlist = UI.$(elem).parent(),
          startlist = UI.$(currentlyDraggingElement).data('start-list')

        if (currentlist[0] !== startlist[0]) {
          var groupOver = currentlist.data('sortable-group'),
            groupCurrent = UI.$(currentlyDraggingElement).data('sortable-group')

          if ((groupOver || groupCurrent) && groupOver != groupCurrent) {
            return false
          }
        }

        UI.$(elem).addClass(this.options.overClass)
        this.moveElementNextTo(currentlyDraggingElement, elem)
      }

      return false
    },

    dragEnd: function (e, elem) {
      var $this = this

      // avoid triggering event twice
      if (currentlyDraggingElement) {
        // TODO: trigger on right element?
        this.options.stop(elem)
        this.trigger('stop.uk.sortable', [this])
      }

      currentlyDraggingElement = null
      currentlyDraggingTarget = null

      touchedlists.push(this.element)
      touchedlists.forEach(function (el, i) {
        UI.$(el)
          .children()
          .each(function () {
            if (this.nodeType === 1) {
              UI.$(this)
                .removeClass($this.options.overClass)
                .removeClass($this.options.placeholderClass)
                .removeClass($this.options.childClass)
              $this.dragenterData(this, false)
            }
          })
      })

      touchedlists = []

      UI.$html.removeClass(this.options.dragMovingClass)

      this.removeDragHandlers()

      if (draggingPlaceholder) {
        draggingPlaceholder.remove()
        draggingPlaceholder = null
      }
    },

    dragDrop: function (e, elem) {
      if (e.type === 'drop') {
        if (e.stopPropagation) {
          e.stopPropagation()
        }

        if (e.preventDefault) {
          e.preventDefault()
        }
      }

      this.triggerChangeEvents()
    },

    triggerChangeEvents: function () {
      // trigger events once
      if (!currentlyDraggingElement) return

      var $current = UI.$(currentlyDraggingElement),
        oldRoot = draggingPlaceholder.data('origin'),
        newRoot = $current.closest('.' + this.options.baseClass),
        triggers = [],
        el = UI.$(currentlyDraggingElement)

      // events depending on move inside lists or across lists
      if (oldRoot[0] === newRoot[0] && draggingPlaceholder.data('index') != $current.index()) {
        triggers.push({ sortable: this, mode: 'moved' })
      } else if (oldRoot[0] != newRoot[0]) {
        triggers.push(
          { sortable: UI.$(newRoot).data('sortable'), mode: 'added' },
          { sortable: UI.$(oldRoot).data('sortable'), mode: 'removed' }
        )
      }

      triggers.forEach(function (trigger, i) {
        trigger.sortable.element.trigger('change.uk.sortable', [trigger.sortable, el, trigger.mode])
      })
    },

    dragenterData: function (element, val) {
      element = UI.$(element)

      if (arguments.length == 1) {
        return parseInt(element.data('child-dragenter'), 10) || 0
      } else if (!val) {
        element.removeData('child-dragenter')
      } else {
        element.data('child-dragenter', Math.max(0, val))
      }
    },

    moveElementNextTo: function (element, elementToMoveNextTo) {
      dragging = true

      var $this = this,
        list = UI.$(element)
          .parent()
          .css('min-height', ''),
        next = isBelow(element, elementToMoveNextTo) ? elementToMoveNextTo : elementToMoveNextTo.nextSibling,
        children = list.children(),
        count = children.length

      if (!$this.options.animation) {
        elementToMoveNextTo.parentNode.insertBefore(element, next)
        UI.Utils.checkDisplay($this.element.parent())
        return
      }

      list.css('min-height', list.height())

      children.stop().each(function () {
        var ele = UI.$(this),
          offset = ele.position()

        offset.width = ele.width()

        ele.data('offset-before', offset)
      })

      elementToMoveNextTo.parentNode.insertBefore(element, next)

      UI.Utils.checkDisplay($this.element.parent())

      children = list
        .children()
        .each(function () {
          var ele = UI.$(this)
          ele.data('offset-after', ele.position())
        })
        .each(function () {
          var ele = UI.$(this),
            before = ele.data('offset-before')
          ele.css({ position: 'absolute', top: before.top, left: before.left, 'min-width': before.width })
        })

      children.each(function () {
        var ele = UI.$(this),
          before = ele.data('offset-before'),
          offset = ele.data('offset-after')

        ele.css('pointer-events', 'none').width()

        setTimeout(function () {
          ele.animate({ top: offset.top, left: offset.left }, $this.options.animation, function () {
            ele
              .css({ position: '', top: '', left: '', 'min-width': '', 'pointer-events': '' })
              .removeClass($this.options.overClass)
              .removeData('child-dragenter')
            count--
            if (!count) {
              list.css('min-height', '')
              UI.Utils.checkDisplay($this.element.parent())
            }
          })
        }, 0)
      })
    },

    serialize: function () {
      var data = [],
        item,
        attribute

      this.element.children().each(function (j, child) {
        item = {}
        for (var i = 0; i < child.attributes.length; i++) {
          attribute = child.attributes[i]
          if (attribute.name.indexOf('data-') === 0) {
            item[attribute.name.substr(5)] = UI.Utils.str2json(attribute.value)
          }
        }
        data.push(item)
      })

      return data
    },

    checkEmptyList: function (list) {
      list = list ? UI.$(list) : this.element

      if (this.options.emptyClass) {
        list[!list.children().length ? 'addClass' : 'removeClass'](this.options.emptyClass)
      }
    }
  })

  // helpers

  function isBelow (el1, el2) {
    var parent = el1.parentNode

    if (el2.parentNode != parent) {
      return false
    }

    var cur = el1.previousSibling

    while (cur && cur.nodeType !== 9) {
      if (cur === el2) {
        return true
      }
      cur = cur.previousSibling
    }

    return false
  }

  function moveUpToChildNode (parent, child) {
    var cur = child
    if (cur == parent) {
      return null
    }

    while (cur) {
      if (cur.parentNode === parent) {
        return cur
      }

      cur = cur.parentNode
      if (!cur || !cur.ownerDocument || cur.nodeType === 11) {
        break
      }
    }
    return null
  }

  function prevent (e) {
    if (e.stopPropagation) {
      e.stopPropagation()
    }
    if (e.preventDefault) {
      e.preventDefault()
    }
    e.returnValue = false
  }

  return UI.sortable
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-sticky', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  var $win = UI.$win,
    $doc = UI.$doc,
    sticked = [],
    direction = 1

  UI.component('sticky', {
    defaults: {
      top: 0,
      bottom: 0,
      animation: '',
      clsinit: 'uk-sticky-init',
      clsactive: 'uk-active',
      clsinactive: '',
      getWidthFrom: '',
      showup: false,
      boundary: false,
      media: false,
      target: false,
      disabled: false
    },

    boot: function () {
      // should be more efficient than using $win.scroll(checkscrollposition):
      UI.$doc.on('scrolling.uk.document', function (e, data) {
        if (!data || !data.dir) return
        direction = data.dir.y
        checkscrollposition()
      })

      UI.$win.on(
        'resize orientationchange',
        UI.Utils.debounce(function () {
          if (!sticked.length) return

          for (var i = 0; i < sticked.length; i++) {
            sticked[i].reset(true)
            //sticked[i].self.computeWrapper();
          }

          checkscrollposition()
        }, 100)
      )

      // init code
      UI.ready(function (context) {
        setTimeout(function () {
          UI.$('[data-uk-sticky]', context).each(function () {
            var $ele = UI.$(this)

            if (!$ele.data('sticky')) {
              UI.sticky($ele, UI.Utils.options($ele.attr('data-uk-sticky')))
            }
          })

          checkscrollposition()
        }, 0)
      })
    },

    init: function () {
      var wrapper = UI.$('<div class="uk-sticky-placeholder"></div>'),
        boundary = this.options.boundary,
        boundtoparent

      this.wrapper = this.element
        .css('margin', 0)
        .wrap(wrapper)
        .parent()

      this.computeWrapper()

      if (boundary) {
        if (boundary === true || boundary[0] === '!') {
          boundary = boundary === true ? this.wrapper.parent() : this.wrapper.closest(boundary.substr(1))
          boundtoparent = true
        } else if (typeof boundary === 'string') {
          boundary = UI.$(boundary)
        }
      }

      this.sticky = {
        self: this,
        options: this.options,
        element: this.element,
        currentTop: null,
        wrapper: this.wrapper,
        init: false,
        getWidthFrom: UI.$(this.options.getWidthFrom || this.wrapper),
        boundary: boundary,
        boundtoparent: boundtoparent,
        top: 0,
        calcTop: function () {
          var top = this.options.top

          // dynamic top parameter
          if (this.options.top && typeof this.options.top == 'string') {
            // e.g. 50vh
            if (this.options.top.match(/^(-|)(\d+)vh$/)) {
              top = (window.innerHeight * parseInt(this.options.top, 10)) / 100
              // e.g. #elementId, or .class-1,class-2,.class-3 (first found is used)
            } else {
              var topElement = UI.$(this.options.top).first()

              if (topElement.length && topElement.is(':visible')) {
                top = -1 * (topElement.offset().top + topElement.outerHeight() - this.wrapper.offset().top)
              }
            }
          }

          this.top = top
        },

        reset: function (force) {
          this.calcTop()

          var finalize = function () {
            this.element.css({ position: '', top: '', width: '', left: '', margin: '0' })
            this.element.removeClass([this.options.animation, 'uk-animation-reverse', this.options.clsactive].join(' '))
            this.element.addClass(this.options.clsinactive)
            this.element.trigger('inactive.uk.sticky')

            this.currentTop = null
            this.animate = false
          }.bind(this)

          if (!force && this.options.animation && UI.support.animation && !UI.Utils.isInView(this.wrapper)) {
            this.animate = true

            this.element
              .removeClass(this.options.animation)
              .one(UI.support.animation.end, function () {
                finalize()
              })
              .width() // force redraw

            this.element.addClass(this.options.animation + ' ' + 'uk-animation-reverse')
          } else {
            finalize()
          }
        },

        check: function () {
          if (this.options.disabled) {
            return false
          }

          if (this.options.media) {
            switch (typeof this.options.media) {
              case 'number':
                if (window.innerWidth < this.options.media) {
                  return false
                }
                break
              case 'string':
                if (window.matchMedia && !window.matchMedia(this.options.media).matches) {
                  return false
                }
                break
            }
          }

          var scrollTop = $win.scrollTop(),
            documentHeight = $doc.height(),
            dwh = documentHeight - window.innerHeight,
            extra = scrollTop > dwh ? dwh - scrollTop : 0,
            elementTop = this.wrapper.offset().top,
            etse = elementTop - this.top - extra,
            active = scrollTop >= etse

          if (active && this.options.showup) {
            // set inactiv if scrolling down
            if (direction == 1) {
              active = false
            }

            // set inactive when wrapper is still in view
            if (direction == -1 && !this.element.hasClass(this.options.clsactive) && UI.Utils.isInView(this.wrapper)) {
              active = false
            }
          }

          return active
        }
      }

      this.sticky.calcTop()

      sticked.push(this.sticky)
    },

    update: function () {
      checkscrollposition(this.sticky)
    },

    enable: function () {
      this.options.disabled = false
      this.update()
    },

    disable: function (force) {
      this.options.disabled = true
      this.sticky.reset(force)
    },

    computeWrapper: function () {
      this.wrapper.css({
        height: ['absolute', 'fixed'].indexOf(this.element.css('position')) == -1 ? this.element.outerHeight() : '',
        float: this.element.css('float') != 'none' ? this.element.css('float') : '',
        margin: this.element.css('margin')
      })

      if (this.element.css('position') == 'fixed') {
        this.element.css({
          width: this.sticky.getWidthFrom.length ? this.sticky.getWidthFrom.width() : this.element.width()
        })
      }
    }
  })

  function checkscrollposition (direction) {
    var stickies = arguments.length ? arguments : sticked

    if (!stickies.length || $win.scrollTop() < 0) return

    var scrollTop = $win.scrollTop(),
      documentHeight = $doc.height(),
      windowHeight = $win.height(),
      dwh = documentHeight - windowHeight,
      extra = scrollTop > dwh ? dwh - scrollTop : 0,
      newTop,
      containerBottom,
      stickyHeight,
      sticky

    for (var i = 0; i < stickies.length; i++) {
      sticky = stickies[i]

      if (!sticky.element.is(':visible') || sticky.animate) {
        continue
      }

      if (!sticky.check()) {
        if (sticky.currentTop !== null) {
          sticky.reset()
        }
      } else {
        if (sticky.top < 0) {
          newTop = 0
        } else {
          stickyHeight = sticky.element.outerHeight()
          newTop = documentHeight - stickyHeight - sticky.top - sticky.options.bottom - scrollTop - extra
          newTop = newTop < 0 ? newTop + sticky.top : sticky.top
        }

        if (sticky.boundary && sticky.boundary.length) {
          var bTop = sticky.boundary.offset().top

          if (sticky.boundtoparent) {
            containerBottom =
              documentHeight - (bTop + sticky.boundary.outerHeight()) + parseInt(sticky.boundary.css('padding-bottom'))
          } else {
            containerBottom = documentHeight - bTop - parseInt(sticky.boundary.css('margin-top'))
          }

          newTop =
            scrollTop + stickyHeight > documentHeight - containerBottom - (sticky.top < 0 ? 0 : sticky.top)
              ? documentHeight - containerBottom - (scrollTop + stickyHeight)
              : newTop
        }

        if (sticky.currentTop != newTop) {
          sticky.element.css({
            position: 'fixed',
            top: newTop,
            width: sticky.getWidthFrom.length ? sticky.getWidthFrom.width() : sticky.element.width(),
            left: sticky.wrapper.offset().left
          })

          if (!sticky.init) {
            sticky.element.addClass(sticky.options.clsinit)

            if (location.hash && scrollTop > 0 && sticky.options.target) {
              var $target = UI.$(location.hash)

              if ($target.length) {
                setTimeout(
                  (function ($target, sticky) {
                    return function () {
                      sticky.element.width() // force redraw

                      var offset = $target.offset(),
                        maxoffset = offset.top + $target.outerHeight(),
                        stickyOffset = sticky.element.offset(),
                        stickyHeight = sticky.element.outerHeight(),
                        stickyMaxOffset = stickyOffset.top + stickyHeight

                      if (stickyOffset.top < maxoffset && offset.top < stickyMaxOffset) {
                        scrollTop = offset.top - stickyHeight - sticky.options.target
                        window.scrollTo(0, scrollTop)
                      }
                    }
                  })($target, sticky),
                  0
                )
              }
            }
          }

          sticky.element.addClass(sticky.options.clsactive).removeClass(sticky.options.clsinactive)
          sticky.element.trigger('active.uk.sticky')
          sticky.element.css('margin', '')

          if (sticky.options.animation && sticky.init && !UI.Utils.isInView(sticky.wrapper)) {
            sticky.element.addClass(sticky.options.animation)
          }

          sticky.currentTop = newTop
        }
      }

      sticky.init = true
    }
  }

  return UI.sticky
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-tooltip', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  var $tooltip, // tooltip container
    tooltipdelay,
    checkdelay

  UI.component('tooltip', {
    defaults: {
      offset: 5,
      pos: 'top',
      animation: false,
      delay: 0, // in miliseconds
      cls: '',
      activeClass: 'uk-active',
      src: function (ele) {
        var title = ele.attr('title')

        if (title !== undefined) {
          ele.data('cached-title', title).removeAttr('title')
        }

        return ele.data('cached-title')
      }
    },

    tip: '',

    boot: function () {
      // init code
      UI.$html.on('mouseenter.tooltip.uikit focus.tooltip.uikit', '[data-uk-tooltip]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('tooltip')) {
          UI.tooltip(ele, UI.Utils.options(ele.attr('data-uk-tooltip')))
          ele.trigger('mouseenter')
        }
      })
    },

    init: function () {
      var $this = this

      if (!$tooltip) {
        $tooltip = UI.$('<div class="uk-tooltip"></div>').appendTo('body')
      }

      this.on({
        focus: function (e) {
          $this.show()
        },
        blur: function (e) {
          $this.hide()
        },
        mouseenter: function (e) {
          $this.show()
        },
        mouseleave: function (e) {
          $this.hide()
        }
      })
    },

    show: function () {
      this.tip = typeof this.options.src === 'function' ? this.options.src(this.element) : this.options.src

      if (tooltipdelay) clearTimeout(tooltipdelay)
      if (checkdelay) clearTimeout(checkdelay)

      if (typeof this.tip === 'string' ? !this.tip.length : true) return

      $tooltip
        .stop()
        .css({ top: -2000, visibility: 'hidden' })
        .removeClass(this.options.activeClass)
        .show()
      $tooltip.html('<div class="uk-tooltip-inner">' + this.tip + '</div>')

      var $this = this,
        pos = UI.$.extend({}, this.element.offset(), {
          width: this.element[0].offsetWidth,
          height: this.element[0].offsetHeight
        }),
        width = $tooltip[0].offsetWidth,
        height = $tooltip[0].offsetHeight,
        offset =
          typeof this.options.offset === 'function' ? this.options.offset.call(this.element) : this.options.offset,
        position = typeof this.options.pos === 'function' ? this.options.pos.call(this.element) : this.options.pos,
        tmppos = position.split('-'),
        tcss = {
          display: 'none',
          visibility: 'visible',
          top: pos.top + pos.height + height,
          left: pos.left
        }

      // prevent strange position
      // when tooltip is in offcanvas etc.
      if (UI.$html.css('position') == 'fixed' || UI.$body.css('position') == 'fixed') {
        var bodyoffset = UI.$('body').offset(),
          htmloffset = UI.$('html').offset(),
          docoffset = { top: htmloffset.top + bodyoffset.top, left: htmloffset.left + bodyoffset.left }

        pos.left -= docoffset.left
        pos.top -= docoffset.top
      }

      if ((tmppos[0] == 'left' || tmppos[0] == 'right') && UI.langdirection == 'right') {
        tmppos[0] = tmppos[0] == 'left' ? 'right' : 'left'
      }

      var variants = {
        bottom: { top: pos.top + pos.height + offset, left: pos.left + pos.width / 2 - width / 2 },
        top: { top: pos.top - height - offset, left: pos.left + pos.width / 2 - width / 2 },
        left: { top: pos.top + pos.height / 2 - height / 2, left: pos.left - width - offset },
        right: { top: pos.top + pos.height / 2 - height / 2, left: pos.left + pos.width + offset }
      }

      UI.$.extend(tcss, variants[tmppos[0]])

      if (tmppos.length == 2) tcss.left = tmppos[1] == 'left' ? pos.left : pos.left + pos.width - width

      var boundary = this.checkBoundary(tcss.left, tcss.top, width, height)

      if (boundary) {
        switch (boundary) {
          case 'x':
            if (tmppos.length == 2) {
              position = tmppos[0] + '-' + (tcss.left < 0 ? 'left' : 'right')
            } else {
              position = tcss.left < 0 ? 'right' : 'left'
            }

            break

          case 'y':
            if (tmppos.length == 2) {
              position = (tcss.top < 0 ? 'bottom' : 'top') + '-' + tmppos[1]
            } else {
              position = tcss.top < 0 ? 'bottom' : 'top'
            }

            break

          case 'xy':
            if (tmppos.length == 2) {
              position = (tcss.top < 0 ? 'bottom' : 'top') + '-' + (tcss.left < 0 ? 'left' : 'right')
            } else {
              position = tcss.left < 0 ? 'right' : 'left'
            }

            break
        }

        tmppos = position.split('-')

        UI.$.extend(tcss, variants[tmppos[0]])

        if (tmppos.length == 2) tcss.left = tmppos[1] == 'left' ? pos.left : pos.left + pos.width - width
      }

      tcss.left -= UI.$body.position().left

      tooltipdelay = setTimeout(function () {
        $tooltip.css(tcss).attr('class', ['uk-tooltip', 'uk-tooltip-' + position, $this.options.cls].join(' '))

        if ($this.options.animation) {
          $tooltip
            .css({ opacity: 0, display: 'block' })
            .addClass($this.options.activeClass)
            .animate({ opacity: 1 }, parseInt($this.options.animation, 10) || 400)
        } else {
          $tooltip.show().addClass($this.options.activeClass)
        }

        tooltipdelay = false

        // close tooltip if element was removed or hidden
        checkdelay = setInterval(function () {
          if (!$this.element.is(':visible')) $this.hide()
        }, 150)
      }, parseInt(this.options.delay, 10) || 0)
    },

    hide: function () {
      if (this.element.is('input') && this.element[0] === document.activeElement) return

      if (tooltipdelay) clearTimeout(tooltipdelay)
      if (checkdelay) clearTimeout(checkdelay)

      $tooltip.stop()

      if (this.options.animation) {
        var $this = this

        $tooltip.fadeOut(parseInt(this.options.animation, 10) || 400, function () {
          $tooltip.removeClass($this.options.activeClass)
        })
      } else {
        $tooltip.hide().removeClass(this.options.activeClass)
      }
    },

    content: function () {
      return this.tip
    },

    checkBoundary: function (left, top, width, height) {
      var axis = ''

      if (left < 0 || left - UI.$win.scrollLeft() + width > window.innerWidth) {
        axis += 'x'
      }

      if (top < 0 || top - UI.$win.scrollTop() + height > window.innerHeight) {
        axis += 'y'
      }

      return axis
    }
  })

  return UI.tooltip
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-timepicker', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  UI.component('timepicker', {
    defaults: {
      format: '24h',
      delay: 0,
      start: 0,
      end: 24
    },

    boot: function () {
      // init code
      UI.$html.on('focus.timepicker.uikit', '[data-uk-timepicker]', function (e) {
        var ele = UI.$(this)

        if (!ele.data('timepicker')) {
          var obj = UI.timepicker(ele, UI.Utils.options(ele.attr('data-uk-timepicker')))

          setTimeout(function () {
            obj.autocomplete.input.focus()
          }, 40)
        }
      })
    },

    init: function () {
      var $this = this,
        times = getTimeRange(this.options.start, this.options.end),
        container

      this.options.minLength = 0
      this.options.template =
        '<ul class="uk-nav uk-nav-autocomplete uk-autocomplete-results">{{~items}}<li data-value="{{$item.value}}"><a class="needsclick">{{$item.value}}</a></li>{{/items}}</ul>'

      this.options.source = function (release) {
        release(times[$this.options.format] || times['12h'])
      }

      if (this.element.is('input')) {
        this.element.wrap('<div class="uk-autocomplete"></div>')
        container = this.element.parent()
      } else {
        container = this.element.addClass('uk-autocomplete')
      }

      this.autocomplete = UI.autocomplete(container, this.options)
      this.autocomplete.dropdown.addClass('uk-dropdown-small uk-dropdown-scrollable')

      this.autocomplete.on('show.uk.autocomplete', function () {
        var selected = $this.autocomplete.dropdown.find('[data-value="' + $this.autocomplete.input.val() + '"]')

        setTimeout(function () {
          $this.autocomplete.pick(selected, true)
        }, 10)
      })

      this.autocomplete.input
        .on('focus', function () {
          $this.autocomplete.value = Math.random()
          $this.autocomplete.triggercomplete()
        })
        .on(
          'blur',
          UI.Utils.debounce(function () {
            $this.checkTime()
          }, 100)
        )

      this.element.data('timepicker', this)
    },

    checkTime: function () {
      var arr,
        timeArray,
        meridian = 'AM',
        hour,
        minute,
        time = this.autocomplete.input.val()

      if (this.options.format == '12h') {
        arr = time.split(' ')
        timeArray = arr[0].split(':')
        meridian = arr[1]
      } else {
        timeArray = time.split(':')
      }

      hour = parseInt(timeArray[0], 10)
      minute = parseInt(timeArray[1], 10)

      if (isNaN(hour)) hour = 0
      if (isNaN(minute)) minute = 0

      if (this.options.format == '12h') {
        if (hour > 12) {
          hour = 12
        } else if (hour < 0) {
          hour = 12
        }

        if (meridian === 'am' || meridian === 'a') {
          meridian = 'AM'
        } else if (meridian === 'pm' || meridian === 'p') {
          meridian = 'PM'
        }

        if (meridian !== 'AM' && meridian !== 'PM') {
          meridian = 'AM'
        }
      } else {
        if (hour >= 24) {
          hour = 23
        } else if (hour < 0) {
          hour = 0
        }
      }

      if (minute < 0) {
        minute = 0
      } else if (minute >= 60) {
        minute = 0
      }

      this.autocomplete.input.val(this.formatTime(hour, minute, meridian)).trigger('change')
    },

    formatTime: function (hour, minute, meridian) {
      hour = hour < 10 ? '0' + hour : hour
      minute = minute < 10 ? '0' + minute : minute
      return hour + ':' + minute + (this.options.format == '12h' ? ' ' + meridian : '')
    }
  })

  // helper

  function getTimeRange (start, end) {
    start = start || 0
    end = end || 24

    var times = { '12h': [], '24h': [] },
      i,
      h

    for (i = start, h = ''; i < end; i++) {
      h = '' + i

      if (i < 10) h = '0' + h

      times['24h'].push({ value: h + ':00' })
      times['24h'].push({ value: h + ':30' })

      if (i === 0) {
        h = 12
        times['12h'].push({ value: h + ':00 AM' })
        times['12h'].push({ value: h + ':30 AM' })
      }

      if (i > 0 && i < 13 && i !== 12) {
        times['12h'].push({ value: h + ':00 AM' })
        times['12h'].push({ value: h + ':30 AM' })
      }

      if (i >= 12) {
        h = h - 12
        if (h === 0) h = 12
        if (h < 10) h = '0' + String(h)

        times['12h'].push({ value: h + ':00 PM' })
        times['12h'].push({ value: h + ':30 PM' })
      }
    }

    return times
  }
})

/*! UIkit 2.24.3 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
;(function (addon) {
  var component

  if (window.UIkit) {
    component = addon(UIkit)
  }

  if (typeof define == 'function' && define.amd) {
    define('uikit-upload', ['uikit'], function () {
      return component || addon(UIkit)
    })
  }
})(function (UI) {
  'use strict'

  UI.component('uploadSelect', {
    init: function () {
      var $this = this

      this.on('change', function () {
        xhrupload($this.element[0].files, $this.options)
        var twin = $this.element.clone(true).data('uploadSelect', $this)
        $this.element.replaceWith(twin)
        $this.element = twin
      })
    }
  })

  UI.component('uploadDrop', {
    defaults: {
      dragoverClass: 'uk-dragover'
    },

    init: function () {
      var $this = this,
        hasdragCls = false

      this.on('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files) {
          e.stopPropagation()
          e.preventDefault()

          $this.element.removeClass($this.options.dragoverClass)
          $this.element.trigger('dropped.uk.upload', [e.dataTransfer.files])

          xhrupload(e.dataTransfer.files, $this.options)
        }
      })
        .on('dragenter', function (e) {
          e.stopPropagation()
          e.preventDefault()
        })
        .on('dragover', function (e) {
          e.stopPropagation()
          e.preventDefault()

          if (!hasdragCls) {
            $this.element.addClass($this.options.dragoverClass)
            hasdragCls = true
          }
        })
        .on('dragleave', function (e) {
          e.stopPropagation()
          e.preventDefault()
          $this.element.removeClass($this.options.dragoverClass)
          hasdragCls = false
        })
    }
  })

  UI.support.ajaxupload = (function () {
    function supportFileAPI () {
      var fi = document.createElement('INPUT')
      fi.type = 'file'
      return 'files' in fi
    }

    function supportAjaxUploadProgressEvents () {
      var xhr = new XMLHttpRequest()
      return !!(xhr && 'upload' in xhr && 'onprogress' in xhr.upload)
    }

    function supportFormData () {
      return !!window.FormData
    }

    return supportFileAPI() && supportAjaxUploadProgressEvents() && supportFormData()
  })()

  if (UI.support.ajaxupload) {
    UI.$.event.props.push('dataTransfer')
  }

  function xhrupload (files, settings) {
    if (!UI.support.ajaxupload) {
      return this
    }

    settings = UI.$.extend({}, xhrupload.defaults, settings)

    if (!files.length) {
      return
    }

    if (settings.allow !== '*.*') {
      for (var i = 0, file; (file = files[i]); i++) {
        if (!matchName(settings.allow, file.name)) {
          if (typeof settings.notallowed == 'string') {
            alert(settings.notallowed)
          } else {
            settings.notallowed(file, settings)
          }
          return
        }
      }
    }

    var complete = settings.complete

    if (settings.single) {
      var count = files.length,
        uploaded = 0,
        allow = true

      settings.beforeAll(files)

      settings.complete = function (response, xhr) {
        uploaded = uploaded + 1

        complete(response, xhr)

        if (settings.filelimit && uploaded >= settings.filelimit) {
          allow = false
        }

        if (allow && uploaded < count) {
          upload([files[uploaded]], settings)
        } else {
          settings.allcomplete(response, xhr)
        }
      }

      upload([files[0]], settings)
    } else {
      settings.complete = function (response, xhr) {
        complete(response, xhr)
        settings.allcomplete(response, xhr)
      }

      upload(files, settings)
    }

    function upload (files, settings) {
      // upload all at once
      var formData = new FormData(),
        xhr = new XMLHttpRequest()

      if (settings.before(settings, files) === false) return

      for (var i = 0, f; (f = files[i]); i++) {
        formData.append(settings.param, f)
      }
      for (var p in settings.params) {
        formData.append(p, settings.params[p])
      }

      // Add any event handlers here...
      xhr.upload.addEventListener(
        'progress',
        function (e) {
          var percent = (e.loaded / e.total) * 100
          settings.progress(percent, e)
        },
        false
      )

      xhr.addEventListener(
        'loadstart',
        function (e) {
          settings.loadstart(e)
        },
        false
      )
      xhr.addEventListener(
        'load',
        function (e) {
          settings.load(e)
        },
        false
      )
      xhr.addEventListener(
        'loadend',
        function (e) {
          settings.loadend(e)
        },
        false
      )
      xhr.addEventListener(
        'error',
        function (e) {
          settings.error(e)
        },
        false
      )
      xhr.addEventListener(
        'abort',
        function (e) {
          settings.abort(e)
        },
        false
      )

      xhr.open(settings.method, settings.action, true)

      if (settings.type == 'json') {
        xhr.setRequestHeader('Accept', 'application/json')
      }

      xhr.onreadystatechange = function () {
        settings.readystatechange(xhr)

        if (xhr.readyState == 4) {
          var response = xhr.responseText

          if (settings.type == 'json') {
            try {
              response = UI.$.parseJSON(response)
            } catch (e) {
              response = false
            }
          }

          settings.complete(response, xhr)
        }
      }
      settings.beforeSend(xhr)
      xhr.send(formData)
    }
  }

  xhrupload.defaults = {
    action: '',
    single: true,
    method: 'POST',
    param: 'files[]',
    params: {},
    allow: '*.*',
    type: 'text',
    filelimit: false,

    // events
    before: function (o) {},
    beforeSend: function (xhr) {},
    beforeAll: function () {},
    loadstart: function () {},
    load: function () {},
    loadend: function () {},
    error: function () {},
    abort: function () {},
    progress: function () {},
    complete: function () {},
    allcomplete: function () {},
    readystatechange: function () {},
    notallowed: function (file, settings) {
      alert('Only the following file types are allowed: ' + settings.allow)
    }
  }

  function matchName (pattern, path) {
    var parsedPattern =
      '^' +
      pattern
        .replace(/\//g, '\\/')
        .replace(/\*\*/g, '(\\/[^\\/]+)*')
        .replace(/\*/g, '[^\\/]+')
        .replace(/((?!\\))\?/g, '$1.') +
      '$'

    parsedPattern = '^' + parsedPattern + '$'

    return path.match(new RegExp(parsedPattern, 'i')) !== null
  }

  UI.Utils.xhrupload = xhrupload

  return xhrupload
})

// http://getuikit.com/docs/documentation_javascript.html#js-override
var easing_swiftOut = [0.4, 0, 0.2, 1]

if (typeof UIkit !== 'undefined') {
  UIkit.on('beforeready.uk.dom', function () {
    // accrodion
    if (typeof UIkit.components.accordion !== 'undefined') {
      // check if accordion component is defined
      $.extend(UIkit.components.accordion.prototype.defaults, {
        easing: easing_swiftOut,
        duration: 200
      })
    }

    // dropdown
    if (typeof UIkit.components.dropdown.prototype !== 'undefined') {
      // check if dropdown component is defined

      $.extend(UIkit.components.dropdown.prototype.defaults, {
        remaintime: 150,
        delay: 50
      })
      ;(function () {
        var old_show_function = UIkit.components.dropdown.prototype.show

        UIkit.components.dropdown.prototype.show = function () {
          this.dropdown
            .css({
              'min-width': this.dropdown.outerWidth()
            })
            .addClass('uk-dropdown-active uk-dropdown-shown')

          return old_show_function.apply(this, arguments)
        }
      })()
      ;(function () {
        var old_hide_function = UIkit.components.dropdown.prototype.hide

        UIkit.components.dropdown.prototype.hide = function () {
          var this_dropdown = this.dropdown

          this_dropdown.removeClass('uk-dropdown-shown')

          var dropdown_timeout = setTimeout(function () {
            this_dropdown.removeClass('uk-dropdown-active')
          }, 280)

          return old_hide_function.apply(this, arguments)
        }
      })()
    }

    // modal
    if (typeof UIkit.components.modal !== 'undefined') {
      // check if modal component is defined

      $.extend(UIkit.components.modal.prototype.defaults, {
        center: true
      })

      var $body = $('body')

      UIkit.modal.dialog.template =
        '<div class="uk-modal uk-modal-dialog-replace"><div class="uk-modal-dialog" style="min-height:0;"></div></div>'
      $body.on('show.uk.modal', '.uk-modal-dialog-replace', function () {
        // customize uikit dialog
        setTimeout(function () {
          var dialogReplace = $('.uk-modal-dialog-replace')
          if (dialogReplace.find('.uk-button-primary').length) {
            var actionBtn = dialogReplace
              .find('.uk-button-primary')
              .toggleClass('uk-button-primary md-btn-flat-primary')
            if (actionBtn.next('button')) {
              actionBtn.next('button').after(actionBtn)
            }
          }
          if (dialogReplace.find('.uk-button').length) {
            dialogReplace.find('.uk-button').toggleClass('uk-button md-btn md-btn-flat')
          }
          if (dialogReplace.find('.uk-margin-small-top').length) {
            dialogReplace.find('.uk-margin-small-top').toggleClass('uk-margin-small-top uk-margin-top')
          }
          if (dialogReplace.find('input.uk-width-1-1').length) {
            dialogReplace.find('input.uk-width-1-1').toggleClass('uk-width-1-1 md-input')
            // reinitialize md inputs
            altair_md.inputs()
          }
          if (dialogReplace.find('.uk-form').length) {
            dialogReplace.find('.uk-form').removeClass('uk-form')
          }
        }, 50)
      })
    }

    // tooltip
    if (typeof UIkit.components.tooltip !== 'undefined') {
      // check if tooltip component is defined
      $.extend(UIkit.components.tooltip.prototype.defaults, {
        animation: 280,
        offset: 8
      })
    }

    // sortable
    if (typeof UIkit.components.sortable !== 'undefined') {
      // check if sortable component is defined
      if (Modernizr.touch) {
        $('[data-uk-sortable]')
          .children()
          .addClass('needsclick')
      }
    }
  })
}
