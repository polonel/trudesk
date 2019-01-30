/*!
 * jQuery serializeObject - v0.2 - 1/20/2010
 * http://benalman.com/projects/jquery-misc-plugins/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Whereas .serializeArray() serializes a form into an array, .serializeObject()
// serializes a form into an (arguably more useful) object.

;(function ($, undefined) {
  '$:nomunge' // Used by YUI compressor.

  $.fn.serializeObject = function () {
    var obj = {}

    $.each(this.serializeArray(), function (i, o) {
      var n = o.name,
        v = o.value

      obj[n] = obj[n] === undefined ? v : $.isArray(obj[n]) ? obj[n].concat(v) : [obj[n], v]
    })

    return obj
  }

  /**
   This is a jQuery plugin to support resizing text areas.

   Originally based off text area resizer by Ryan O'Dell : http://plugins.jquery.com/misc/textarea.js
   Modifications by Discourse https://github.com/discourse/discourse
   @module $.fn.DivResizer
   **/

  var div,
    endDrag,
    grip,
    lastMousePos,
    min,
    mousePosition,
    originalDivHeight,
    originalPos,
    performDrag,
    startDrag,
    wrappedEndDrag,
    wrappedPerformDrag
  div = void 0
  originalPos = void 0
  originalDivHeight = void 0
  lastMousePos = 0
  min = 350
  grip = void 0
  wrappedEndDrag = void 0
  wrappedPerformDrag = void 0

  startDrag = function (e, opts) {
    div = $(e.data.el)
    div.addClass('clear-transitions')
    div.blur()
    lastMousePos = mousePosition(e).y
    originalPos = lastMousePos
    originalDivHeight = div.height()
    wrappedPerformDrag = (function () {
      return function (e) {
        return performDrag(e, opts)
      }
    })()
    wrappedEndDrag = (function () {
      return function (e) {
        return endDrag(e, opts)
      }
    })()
    $(document)
      .mousemove(wrappedPerformDrag)
      .mouseup(wrappedEndDrag)
    return false
  }

  performDrag = function (e, opts) {
    $(div).trigger('div-resizing')

    var size, sizePx, thisMousePos
    thisMousePos = mousePosition(e).y
    size = originalDivHeight + (originalPos - thisMousePos)
    lastMousePos = thisMousePos

    var maxHeight = $(window).height()
    if (opts.maxHeight) {
      maxHeight = opts.maxHeight(maxHeight)
    }
    size = Math.min(size, maxHeight)
    size = Math.max(min, size)
    sizePx = size + 'px'
    if (typeof opts.onDrag === 'function') {
      opts.onDrag(sizePx)
    }
    div.height(sizePx)
    if (size < min) {
      endDrag(e, opts)
    }
    return false
  }

  endDrag = function (e, opts) {
    $(document)
      .unbind('mousemove', wrappedPerformDrag)
      .unbind('mouseup', wrappedEndDrag)
    div.removeClass('clear-transitions')
    div.focus()
    if (typeof opts.resize === 'function') {
      opts.resize()
    }
    $(div).trigger('div-resized')
    div = null
  }

  mousePosition = function (e) {
    return {
      x: e.clientX + document.documentElement.scrollLeft,
      y: e.clientY + document.documentElement.scrollTop
    }
  }

  $.fn.DivResizer = function (opts) {
    return this.each(function () {
      var grippie, start, staticOffset
      div = $(this)
      if (div.hasClass('processed')) return
      div.addClass('processed')
      staticOffset = null
      start = function () {
        return function (e) {
          return startDrag(e, opts)
        }
      }
      grippie = div
        .prepend("<div class='grippie'></div>")
        .find('.grippie')
        .bind(
          'mousedown',
          {
            el: this
          },
          start()
        )
    })
  }
})(jQuery)
