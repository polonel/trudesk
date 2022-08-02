// jQuery.isInView, v1.0.3
// Copyright (c)2015 Michael Heim, Zeilenwechsel.de
// Distributed under MIT license
// http://github.com/hashchange/jquery.isinview

;(function (root, factory) {
  'use strict'

  if (typeof exports === 'object') {
    module.exports = factory(require('jquery'), require('jquery_docsize'))
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery', 'jquery_docsize'], factory)
  }
})(this, function (jQuery) {
  'use strict'
  ;(function ($) {
    'use strict'

    var _useGetComputedStyle = !!window.getComputedStyle, // IE8, my dear, this is for you
      _isIOS,
      root = window,
      $root = $(window)

    /**
     * API
     */

    /**
     * @param   {string} [axis="both"]  values "horizontal", "vertical", "both"
     * @returns {boolean|Object|undefined}
     */
    $.fn.hasScrollbar = function (axis) {
      return hasScrollbar(this, axis)
    }

    /**
     * @param   {string} [axis="both"]  values "horizontal", "vertical", "both"
     * @returns {number|Object|undefined}
     */
    $.fn.scrollbarWidth = function (axis) {
      return effectiveScrollbarWith(this, axis)
    }

    /**
     * @returns {Window|undefined}
     */
    $.fn.ownerWindow = function () {
      return ownerWindow(this)
    }

    /**
     * @param {Window|Document|HTMLElement|jQuery|string} [container=window]
     * @param {Object}                                    [opts]
     * @param {boolean}                                   [opts.partially=false]
     * @param {boolean}                                   [opts.excludeHidden=false]
     * @param {string}                                    [opts.direction="both"]
     * @param {string}                                    [opts.box="border-box"]     alternatively, "content-box"
     * @param {number|string}                             [opts.tolerance=0]          number only (px), or with unit ("px" or "%" only)
     *
     * @returns {jQuery}
     */
    $.fn.inView = function (container, opts) {
      return inView(this, container, opts)
    }

    /**
     * @param {Object}        [opts]
     * @param {boolean}       [opts.partially=false]
     * @param {boolean}       [opts.excludeHidden=false]
     * @param {string}        [opts.direction="both"]
     * @param {string}        [opts.box="border-box"]     alternatively, "content-box"
     * @param {number|string} [opts.tolerance=0]          number only (px), or with unit ("px" or "%" only)
     *
     * @returns {jQuery}
     */
    $.fn.inViewport = function (opts) {
      return inView(this, ownerWindow(this), opts)
    }

    /**
     * @param {Window|Document|HTMLElement|jQuery|string} [container=window]
     * @param {Object}                                    [opts]
     * @param {boolean}                                   [opts.partially=false]
     * @param {boolean}                                   [opts.excludeHidden=false]
     * @param {string}                                    [opts.direction="both"]
     * @param {string}                                    [opts.box="border-box"]     alternatively, "content-box"
     * @param {number|string}                             [opts.tolerance=0]          number only (px), or with unit ("px" or "%" only)
     *
     * @returns {boolean}
     */
    $.fn.isInView = function (container, opts) {
      return isInView(this, container, opts)
    }

    /**
     * @param {Object}        [opts]
     * @param {boolean}       [opts.partially=false]
     * @param {boolean}       [opts.excludeHidden=false]
     * @param {string}        [opts.direction="both"]
     * @param {string}        [opts.box="border-box"]     alternatively, "content-box"
     * @param {number|string} [opts.tolerance=0]          number only (px), or with unit ("px" or "%" only)
     *
     * @returns {boolean}
     */
    $.fn.isInViewport = function (opts) {
      return isInView(this, ownerWindow(this), opts)
    }

    $.expr.match.inviewport = /^(?:inVieport)$/i

    $.expr.setFilters.inviewport = $.expr.createPseudo(function () {
      return $.expr.createPseudo(function (elems, matches) {
        var i,
          config,
          length = elems.length

        if (length) {
          config = _prepareConfig($(elems))
          checkHierarchy(elems[0], config.container)

          for (i = 0; i < length; i++) {
            matches[i] = _isInView(elems[i], config) ? elems[i] : undefined
          }
        }
      })
    })

    /**
     * Internals
     */

    /**
     * Does the actual work of $.fn.hasScrollbar. Protected from external modification. See $.fn.hasScrollbar for
     * details.
     *
     * @param   {jQuery} $elem
     * @param   {string} [axis="both"]  values "horizontal", "vertical", "both"
     * @returns {boolean|Object|undefined}
     */
    function hasScrollbar ($elem, axis) {
      var $body,
        elemProps,
        bodyProps,
        innerWidth,
        innerHeight,
        scrollWidth,
        scrollHeight,
        query = { target: {} },
        result = {},
        context = {},
        elem = $elem[0]

      $elem = $elem.eq(0)
      axis || (axis = 'both')

      query.getBoth = axis === 'both'
      query.getHorizontal = axis === 'horizontal' || query.getBoth
      query.getVertical = axis === 'vertical' || query.getBoth

      if (axis !== 'horizontal' && axis !== 'vertical' && axis !== 'both')
        throw new Error('Invalid parameter value: axis = ' + axis)
      if (!$elem.length) return

      // Transformations:
      // - If called on a window, we need window, document, documentElement and body, and discard the element
      // - If called on the document or document element, we treat it like a call on window (above)
      // - If called on the body, we need document, documentElement and the body itself (again, we discard the element
      //   to avoid ambiguity)
      // - If called on an iframe element, we treat it like a window call, using the iframe content window
      query.target.isWindow = $.isWindow(elem)
      if (query.target.isWindow) {
        context.document = elem.document
      } else if (elem.nodeType === 9) {
        context.document = elem
        query.target.isWindow = true
      } else if (elem === elem.ownerDocument.documentElement) {
        context.document = elem.ownerDocument
        query.target.isWindow = true
      } else if (elem.nodeType === 1 && elem.tagName.toLowerCase() === 'iframe') {
        context.document = elem.contentDocument || elem.contentWindow.document
        query.target.isWindow = true
      } else if (elem === elem.ownerDocument.body) {
        context.document = elem.ownerDocument
        query.target.isBody = true
      }

      if (query.target.isWindow || query.target.isBody) {
        context.window = context.document.defaultView || context.document.parentWindow
        context.$document = $(context.document)
        context.documentElement = context.document.documentElement
        context.body = context.document.body

        elem = $elem = undefined // won't be needed; discard, to avoid ambiguity in the code below
      }

      if (query.target.isWindow) {
        result = _windowHasScrollbar(query, context)
      } else if (query.target.isBody) {
        // Checking for body scroll bars.
        //
        // body.clientWidth returns the width of the body, minus the scroll bars. We can simply compare it to the
        // full width, provided that the browser displays scroll bars which take up space.
        //
        // By implication, this check DOES NOT work for an effective body overflow of "auto" in browsers which
        // display scroll bars of width 0. (Affects iOS, other mobile browsers, and Safari on OS X when used without
        // an attached mouse.) There simply is no reliable, bullet-proof way to determine the width of the body
        // content, ie the true body scroll width, in those browsers.
        bodyProps = _getViewportOverflows(query, context).body

        $body = $(context.body)
        if (query.getHorizontal)
          result.horizontal =
            bodyProps.overflowScrollX || (bodyProps.overflowAutoX && context.body.clientHeight < $body.height())
        if (query.getVertical)
          result.vertical =
            bodyProps.overflowScrollY || (bodyProps.overflowAutoY && context.body.clientWidth < $body.width())
      } else {
        // Scroll bars on an ordinary HTML element
        //
        // If we deal with an ordinary element, we always need the overflow settings for both axes because the axes
        // interact (one scroll bar can cause another).
        elemProps = getCss(elem, ['overflow', 'overflowX', 'overflowY'], { toLowerCase: true })
        elemProps = getAppliedOverflows(elemProps, true)

        scrollWidth = elem.scrollWidth
        scrollHeight = elem.scrollHeight

        result.horizontal =
          scrollWidth > 0 &&
          (elemProps.overflowScrollX || (elemProps.overflowAutoX && (innerWidth = $elem.innerWidth()) < scrollWidth))
        result.vertical =
          scrollHeight > 0 &&
          (elemProps.overflowScrollY || (elemProps.overflowAutoY && (innerHeight = $elem.innerHeight()) < scrollHeight))

        // Detect if the appearance of one scroll bar causes the other to appear, too.
        result.vertical =
          result.vertical ||
          (result.horizontal &&
            elemProps.overflowAutoY &&
            (innerHeight !== undefined ? innerHeight : $elem.innerHeight()) - $.scrollbarWidth() < scrollHeight)
        result.horizontal =
          result.horizontal ||
          (result.vertical &&
            elemProps.overflowAutoX &&
            (innerWidth !== undefined ? innerWidth : $elem.innerWidth()) - $.scrollbarWidth() < scrollWidth)
      }

      return query.getBoth ? result : query.getHorizontal ? result.horizontal : result.vertical
    }

    /**
     * Does the actual work of $.fn.scrollbarWidth. Protected from external modification. See $.fn.scrollbarWidth for
     * details.
     *
     * @param   {jQuery} $elem
     * @param   {string} [axis="both"]  values "horizontal", "vertical", "both"
     * @returns {number|Object}
     */
    function effectiveScrollbarWith ($elem, axis) {
      var queryHorizontal,
        queryVertical,
        queryBoth,
        elemHasScrollbar,
        horizontal,
        vertical,
        globalWidth = $.scrollbarWidth()

      axis || (axis = 'both')

      queryBoth = axis === 'both'
      queryHorizontal = axis === 'horizontal' || queryBoth
      queryVertical = axis === 'vertical' || queryBoth

      if (axis !== 'horizontal' && axis !== 'vertical' && axis !== 'both')
        throw new Error('Invalid parameter value: axis = ' + axis)
      if (!$elem.length) return

      // Bail out early, without an $elem.hasScrollbar() query, if scroll bars don't take up any space.
      if (globalWidth === 0) return queryBoth ? { horizontal: 0, vertical: 0 } : 0

      elemHasScrollbar = queryBoth
        ? hasScrollbar($elem)
        : queryHorizontal
        ? { horizontal: hasScrollbar($elem, 'horizontal') }
        : { vertical: hasScrollbar($elem, 'vertical') }

      if (queryHorizontal) horizontal = elemHasScrollbar.horizontal ? globalWidth : 0
      if (queryVertical) vertical = elemHasScrollbar.vertical ? globalWidth : 0

      return queryBoth ? { horizontal: horizontal, vertical: vertical } : queryHorizontal ? horizontal : vertical
    }

    /**
     * Does the actual work of $.fn.ownerWindow. Protected from external modification. See $.fn.ownerWindow for details.
     *
     * @param   {jQuery} $elem
     * @returns {Window|undefined}
     */
    function ownerWindow ($elem) {
      var elem = $elem[0],
        ownerDocument = elem && (elem.nodeType === 9 ? elem : elem.ownerDocument)

      return (
        (ownerDocument && (ownerDocument.defaultView || ownerDocument.parentWindow)) ||
        ($.isWindow(elem) && elem) ||
        undefined
      )
    }

    /**
     * Does the actual work of $.fn.inView. Protected from external modification. See $.fn.inView for details.
     *
     * @param {jQuery}                                    $elems
     * @param {Window|Document|HTMLElement|jQuery|string} [container=window]
     * @param {Object}                                    [opts]
     * @param {boolean}                                   [opts.partially=false]
     * @param {boolean}                                   [opts.excludeHidden=false]
     * @param {string}                                    [opts.direction="both"]
     * @param {string}                                    [opts.box="border-box"]     alternatively, "content-box"
     * @param {number|string}                             [opts.tolerance=0]          number only (px), or with unit ("px" or "%" only)
     *
     * @returns {jQuery}
     */
    function inView ($elems, container, opts) {
      var config,
        elemsInView = []

      if (!$elems.length) return $()

      config = _prepareConfig($elems, container, opts)

      // Check if the elements are children of the container. For performance reasons, only the first element is
      // examined.
      checkHierarchy($elems[0], config.container)

      $elems.each(function () {
        if (_isInView(this, config)) elemsInView.push(this)
      })

      return $(elemsInView)
    }

    /**
     * Does the actual work of $.fn.isInView. Protected from external modification. See $.fn.isInView for details.
     *
     * @param {jQuery}                                    $elem
     * @param {Window|Document|HTMLElement|jQuery|string} [container=window]
     * @param {Object}                                    [opts]
     * @param {boolean}                                   [opts.partially=false]
     * @param {boolean}                                   [opts.excludeHidden=false]
     * @param {string}                                    [opts.direction="both"]
     * @param {string}                                    [opts.box="border-box"]     alternatively, "content-box"
     * @param {number|string}                             [opts.tolerance=0]          number only (px), or with unit ("px" or "%" only)
     *
     * @returns {boolean}
     */
    function isInView ($elem, container, opts) {
      var config,
        elem = $elem[0]

      if (!$elem.length) return false

      config = _prepareConfig($elem, container, opts)
      checkHierarchy(elem, config.container)

      return _isInView(elem, config)
    }

    /**
     * Prepares the configuration for a single element query. Returns the config object which is to be consumed by
     * _isInView().
     *
     * @param {jQuery}                                    $elem                       single element, or set of elements
     * @param {Window|Document|HTMLElement|jQuery|string} [container=window]
     * @param {Object}                                    [opts]
     * @param {boolean}                                   [opts.partially=false]
     * @param {boolean}                                   [opts.excludeHidden=false]
     * @param {string}                                    [opts.direction="both"]
     * @param {string}                                    [opts.box="border-box"]     alternatively, "content-box"
     * @param {number|string}                             [opts.tolerance=0]          number only (px), or with unit ("px" or "%" only)
     *
     * @returns {Object}
     */
    function _prepareConfig ($elem, container, opts) {
      var $container,
        direction,
        config = {}

      opts || (opts = {})

      container || (container = ownerWindow($elem))
      config.$container = $container = wrapContainer(container)
      config.container = container = $container[0]

      checkOptions(opts)

      direction = opts.direction || 'both'
      config.useVertical = direction === 'both' || direction === 'vertical'
      config.useHorizontal = direction === 'both' || direction === 'horizontal'

      config.partially = opts.partially
      config.excludeHidden = opts.excludeHidden
      config.borderBox = opts.box !== 'content-box'
      config.containerIsWindow = $.isWindow(container)

      if (opts.tolerance !== undefined) {
        config.toleranceType = isNumber(opts.tolerance) || opts.tolerance.slice(-3) === 'px' ? 'add' : 'multiply'
        config.tolerance =
          config.toleranceType === 'add' ? parseFloat(opts.tolerance) : parseFloat(opts.tolerance) / 100 + 1
      } else {
        config.tolerance = 0
        config.toleranceType = 'add'
      }

      // Create an object to cache DOM queries with regard to the viewport, for faster repeated access.
      config.cache = {}

      return config
    }

    /**
     * Returns if an element is in view, with regard to a given configuration.
     *
     * The configuration is built with _prepareConfig().
     *
     * @param {HTMLElement}        elem
     * @param {Object}             config
     * @param {HTMLElement|Window} config.container
     * @param {jQuery}             config.$container
     * @param {boolean}            config.containerIsWindow
     * @param {Object}             config.cache
     * @param {boolean}            config.useHorizontal
     * @param {boolean}            config.useVertical
     * @param {boolean}            config.partially
     * @param {boolean}            config.excludeHidden
     * @param {boolean}            config.borderBox
     * @param {number}             config.tolerance
     * @param {string}             config.toleranceType
     *
     * @returns {boolean}
     */
    function _isInView (elem, config) {
      var containerWidth,
        containerHeight,
        hTolerance,
        vTolerance,
        rect,
        container = config.container,
        $container = config.$container,
        cache = config.cache,
        elemInView = true

      if (elem === container) throw new Error('Invalid container: is the same as the element')

      // When hidden elements are ignored, we check if an element consumes space in the document. And we bail out
      // immediately if it doesn't.
      //
      // The test employed for this works in the vast majority of cases, but there is a limitation. We use offsetWidth
      // and offsetHeight, which considers the content (incl. borders) but ignores margins. Zero-size content with a
      // margin might actually consume space sometimes, but it won't be detected (see http://jsbin.com/tiwabo/3).
      //
      // That said, the definition of visibility and the actual test are the same as in jQuery :visible.
      if (config.excludeHidden && !(elem.offsetWidth > 0 && elem.offsetHeight > 0)) return false

      if (config.useHorizontal) containerWidth = getNetContainerWidth($container, config.containerIsWindow, cache)
      if (config.useVertical) containerHeight = getNetContainerHeight($container, config.containerIsWindow, cache)

      // Convert tolerance to a px value (if given as a percentage)
      hTolerance =
        cache.hTolerance !== undefined
          ? cache.hTolerance
          : (cache.hTolerance = config.toleranceType === 'add' ? config.tolerance : containerWidth * config.tolerance)
      vTolerance =
        cache.vTolerance !== undefined
          ? cache.vTolerance
          : (cache.vTolerance = config.toleranceType === 'add' ? config.tolerance : containerHeight * config.tolerance)

      // We can safely use getBoundingClientRect without a fallback. Its core properties (top, left, bottom, right)
      // are supported on the desktop for ages (IE5+). On mobile, too: supported from Blackberry 6+ (2010), iOS 4
      // (2010, iPhone 3GS+), according to the jQuery source comment in $.fn.offset.
      //
      // In oldIE (up to IE8), the coordinates were 2px off in each dimension because the "viewport" began at (2,2) of
      // the window. Can be feature-tested by creating an absolutely positioned div at (0,0) and reading the rect
      // coordinates. Won't be fixed here because the quirk is too minor to justify the overhead, just for oldIE.
      //
      // (See http://stackoverflow.com/a/10231202/508355 and Zakas, Professional Javascript (2012), p. 406)

      rect = config.borderBox ? elem.getBoundingClientRect() : getContentRect(elem)
      if (!config.containerIsWindow) rect = getRelativeRect(rect, $container, cache)

      if (config.partially) {
        if (config.useVertical) elemInView = rect.top < containerHeight + vTolerance && rect.bottom > -vTolerance
        if (config.useHorizontal)
          elemInView = elemInView && rect.left < containerWidth + hTolerance && rect.right > -hTolerance
      } else {
        if (config.useVertical)
          elemInView =
            rect.top >= -vTolerance &&
            rect.top < containerHeight + vTolerance &&
            rect.bottom > -vTolerance &&
            rect.bottom <= containerHeight + vTolerance
        if (config.useHorizontal)
          elemInView =
            elemInView &&
            rect.left >= -hTolerance &&
            rect.left < containerWidth + hTolerance &&
            rect.right > -hTolerance &&
            rect.right <= containerWidth + hTolerance
      }

      return elemInView
    }

    /**
     * Gets the TextRectangle coordinates relative to a container element.
     *
     * Do not call if the container is a window (redundant) or a document. Both calls would fail.
     */
    function getRelativeRect (rect, $container, cache) {
      var containerPaddingRectRoot

      if (cache && cache.containerPaddingRectRoot) {
        containerPaddingRectRoot = cache.containerPaddingRectRoot
      } else {
        // gBCR coordinates enclose padding, and leave out margin. That is perfect for scrolling because
        //
        // - padding scrolls (ie,o it is part of the scrollable area, and gBCR puts it inside)
        // - margin doesn't scroll (ie, it pushes the scrollable area to another position, and gBCR records that)
        //
        // Borders, however, don't scroll, so they are not part of the scrollable area, but gBCR puts them inside.
        //
        // (See http://jsbin.com/pivata/10 for an extensive test of gBCR behaviour.)

        containerPaddingRectRoot = getPaddingRectRoot($container[0])

        // Cache the calculations
        if (cache) cache.containerPaddingRectRoot = containerPaddingRectRoot
      }

      return {
        top: rect.top - containerPaddingRectRoot.top,
        bottom: rect.bottom - containerPaddingRectRoot.top,
        left: rect.left - containerPaddingRectRoot.left,
        right: rect.right - containerPaddingRectRoot.left
      }
    }

    /**
     * Calculates the rect of the content-box. Similar to getBoundingClientRect, but excludes padding and borders - and
     * is much slower.
     *
     * @param   {HTMLElement} elem
     * @returns {ClientRect}
     */
    function getContentRect (elem) {
      var rect = elem.getBoundingClientRect(),
        props = getCss(
          elem,
          [
            'borderTopWidth',
            'borderRightWidth',
            'borderBottomWidth',
            'borderLeftWidth',
            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft'
          ],
          { toFloat: true }
        )

      return {
        top: rect.top + props.paddingTop + props.borderTopWidth,
        right: rect.right - (props.paddingRight + props.borderRightWidth),
        bottom: rect.bottom - (props.paddingBottom + props.borderBottomWidth),
        left: rect.left + props.paddingLeft + props.borderLeftWidth
      }
    }

    /**
     * Returns the top, left coordinates of the rect of the padding box (offset box).
     *
     * The coordinates match those of getBoundingClientRect, but exclude the borders.
     *
     * Does not care about bottom, right coordinates, in order to speed up the process.
     *
     * @param   {HTMLElement} elem
     * @returns {{ top: number, left: number }}
     */
    function getPaddingRectRoot (elem) {
      var rect = elem.getBoundingClientRect(),
        props = getCss(elem, ['borderTopWidth', 'borderLeftWidth'], { toFloat: true })

      return {
        top: rect.top + props.borderTopWidth,
        left: rect.left + props.borderLeftWidth
      }
    }

    /**
     * Returns the scroll bar state of the window. Helper for hasScrollbar().
     *
     * @param {Object} query
     * @param {Object} context
     *
     * @returns {{vertical: boolean, horizontal: boolean}}
     */
    function _windowHasScrollbar (query, context) {
      var windowInnerHeight,
        windowInnerWidth,
        windowProps,
        scrollbarWidth = $.scrollbarWidth(),
        result = {},
        doneX = !query.getHorizontal,
        doneY = !query.getVertical

      // We may be able to take a shortcut. The window.innerWidth and -Height report the dimensions of the viewport
      // including scroll bars, and documentElement.clientWidth and -Height report them without scroll bars. That
      // gives the presence of a scroll bar away, as long as
      //
      // - the scroll bars actually take up space (width > 0)
      // - the browser supports window.innerWidth/Height (IE8, for instance, does not)
      // - the browser doesn't report a buggy value. FF has a bug which as only been fixed in FF25 (released 29 Oct
      //   2013). It manifests itself in a fictional return value of 10 for these properties. See
      //   * https://developer.mozilla.org/en-US/docs/Web/API/Window.innerWidth
      //   * https://developer.mozilla.org/en-US/docs/Web/API/Window.innerHeight
      //   * https://bugzilla.mozilla.org/show_bug.cgi?id=641188

      if (query.getHorizontal && scrollbarWidth > 0) {
        windowInnerHeight = context.window.innerHeight
        if (windowInnerHeight > 10) {
          result.horizontal = windowInnerHeight > context.documentElement.clientHeight
          doneX = true
        }
      }

      if (query.getVertical && scrollbarWidth > 0) {
        windowInnerWidth = context.window.innerWidth
        if (windowInnerWidth > 10) {
          result.vertical = windowInnerWidth > context.documentElement.clientWidth
          doneY = true
        }
      }

      if (!doneX || !doneY) {
        // Shortcut didn't work. We have to evaluate overflow settings, window and document size.

        windowProps = _getViewportOverflows(query, context).window

        // Handle the trivial cases first: window set to overflow: scroll or to overflow: hidden.
        if (!doneX && windowProps.overflowScrollX) result.horizontal = doneX = true
        if (!doneY && windowProps.overflowScrollY) result.vertical = doneY = true

        if (!doneX && windowProps.overflowHiddenX) {
          result.horizontal = false
          doneX = true
        }

        if (!doneY && windowProps.overflowHiddenY) {
          result.vertical = false
          doneY = true
        }

        // Handle the remaining overflow: auto case
        //
        // (There is no actual overflow: visible case for the viewport, see getAppliedViewportOverflows.)
        if (!doneX) result.horizontal = context.documentElement.clientWidth < $.documentWidth(context.document)
        if (!doneY) result.vertical = context.documentElement.clientHeight < $.documentHeight(context.document)
      }

      return result
    }

    /**
     * Returns the applied overflow for the viewport (documentElement) and body in an aggregated `{ window: ...,
     * body: ...}` hash. Helper for hasScrollbar().
     *
     * If we deal with window or body scroll bars, we always need the settings for both body and window (documentElement)
     * because they are interdependent. See getAppliedViewportOverflows().
     *
     * @param {Object} query
     * @param {Object} context
     * @returns {{window: AppliedOverflow, body: AppliedOverflow}}
     */
    function _getViewportOverflows (query, context) {
      var windowProps,
        bodyProps,
        overflowPropNames = ['overflow'],
        bodyOverflowPropNames = ['overflow']

      if (query.getHorizontal) {
        overflowPropNames.push('overflowX')
        bodyOverflowPropNames.push('overflowX')
      }
      if (query.getVertical) {
        overflowPropNames.push('overflowY')
        bodyOverflowPropNames.push('overflowY')
      }

      windowProps = getCss(context.documentElement, overflowPropNames, { toLowerCase: true })
      bodyProps = getCss(context.body, bodyOverflowPropNames, { toLowerCase: true })

      return getAppliedViewportOverflows(windowProps, bodyProps)
    }

    /**
     * Determines the effective overflow setting of an element, separately for each axis, based on the `overflow`,
     * `overflowX` and `overflowY` properties of the element which must be passed in as a hash.
     *
     * Returns a hash of the computed results for overflowX, overflowY. Also adds boolean status properties to the hash
     * if the createBooleans flag is set. These are properties for mere convenience. They signal if a particular
     * overflow type applies (e.g. overflowHiddenX = true/false).
     *
     * ATTN The method does not take the special relation of body and documentElement into account. That is handled by
     * the more specific getAppliedViewportOverflows() function.
     *
     * The effective overflow setting is established as follows:
     *
     * - If a computed value for `overflow(X/Y)` exists, it gets applied to the axis.
     * - If not, the computed value of the general `overflow` setting gets applied to the axis.
     * - If there is no computed value at all, the overflow default gets applied to the axis. The default is
     *   "visible" in seemingly every browser out there. Falling back to the default should never be necessary,
     *   though, because there always is a computed value.
     *
     * @param {Object}        props            hash of element properties (computed values)
     * @param {string}        props.overflow
     * @param {string}        props.overflowX
     * @param {string}        props.overflowY
     * @param {boolean=false} createBooleans   if true, create the full set of boolean status properties, e.g.
     *                                         overflowVisibleX (true/false), overflowHiddenY (true/false) etc
     * @returns {AppliedOverflow}              hash of the computed results: overflowX, overflowY, optional boolean
     *                                         status properties
     */
    function getAppliedOverflows (props, createBooleans) {
      var status = {}

      // Establish the applied overflow (e.g. overflowX: "scroll")
      status.overflowX = props.overflowX || props.overflow || 'visible'
      status.overflowY = props.overflowY || props.overflow || 'visible'

      // Create the derived boolean status properties (e.g overflowScrollX: true)
      if (createBooleans) {
        $.each(['Visible', 'Auto', 'Scroll', 'Hidden'], function (index, type) {
          var lcType = type.toLowerCase()
          status['overflow' + type + 'X'] = status.overflowX === lcType
          status['overflow' + type + 'Y'] = status.overflowY === lcType
        })
      }

      return status
    }

    /**
     * Determines the effective overflow setting of the viewport and body, separately for each axis, based on the
     * `overflow`, `overflowX` and `overflowY` properties of the documentElement and body which must be passed in as a
     * hash.
     *
     * Returns the results for viewport and body in an aggregated `{ window: ..., body: ...}` hash.
     *
     * For the basic resolution mechanism, see getAppliedOverflows(). When determining the effective overflow, the
     * peculiarities of viewport and body are taken into account:
     *
     * - Viewport and body overflows are interdependent. If the nominal viewport overflow for a given axis is "visible",
     *   the viewport inherits the body overflow for that axis, and the body overflow is set to "visible". Curiously,
     *   that transfer is _not_ reflected in the computed values, it just manifests in behaviour.
     *
     * - Once that is done, if the viewport overflow is still "visible" for an axis, it is effectively turned into
     *   "auto". Scroll bars appear when the content overflows the viewport (ie, "auto" behaviour). Hence, this function
     *   will indeed report "auto". Again, the transformation is only manifest in behaviour, not in the computed values.
     *
     * - In iOS, if the effective overflow setting of the viewport is "hidden", it is ignored and treated as "auto".
     *   Content can still overflow the viewport, and scroll bars appear as needed.
     *
     *   Now, the catch. This behaviour is impossible to feature-detect. The computed values are not at all affected by
     *   it, and the results reported eg. for clientHeight, offsetHeight, scrollHeight of body and documentElement do
     *   not differ between Safari on iOS and, say, Chrome on the desktop. The numbers don't give the behaviour away.
     *
     *   So we have to resort to browser sniffing here. It sucks, but there is literally no other option.
     *
     * NB Additional status properties (see getAppliedOverflows) are always generated here.
     *
     * @param {Object} documentElementProps            hash of documentElement properties (computed values)
     * @param {string} documentElementProps.overflow
     * @param {string} documentElementProps.overflowX
     * @param {string} documentElementProps.overflowY
     *
     * @param {Object} bodyProps                       hash of body properties (computed values)
     * @param {string} bodyProps.overflow
     * @param {string} bodyProps.overflowX
     * @param {string} bodyProps.overflowY
     *
     * @returns {{window: AppliedOverflow, body: AppliedOverflow}}
     */
    function getAppliedViewportOverflows (documentElementProps, bodyProps) {
      var _window = getAppliedOverflows(documentElementProps, false),
        body = getAppliedOverflows(bodyProps, false),
        consolidated = { window: {}, body: {} }

      // Handle the interdependent relationship between body and window (documentElement) overflow
      if (_window.overflowX === 'visible') {
        // If the window overflow is set to "visible", body props get transferred to the window, body changes to
        // "visible". (Nothing really changes if both are set to "visible".)
        consolidated.body.overflowX = 'visible'
        consolidated.window.overflowX = body.overflowX
      } else {
        // No transfer of properties.
        // - If body overflow is "visible", it remains that way, and the window stays as it is.
        // - If body and window are set to properties other than "visible", they keep their divergent settings.
        consolidated.body.overflowX = body.overflowX
        consolidated.window.overflowX = _window.overflowX
      }

      // Repeat for overflowY
      if (_window.overflowY === 'visible') {
        consolidated.body.overflowY = 'visible'
        consolidated.window.overflowY = body.overflowY
      } else {
        consolidated.body.overflowY = body.overflowY
        consolidated.window.overflowY = _window.overflowY
      }

      // window.overflow(X/Y): "visible" actually means "auto" because scroll bars appear as needed; transform
      if (consolidated.window.overflowX === 'visible') consolidated.window.overflowX = 'auto'
      if (consolidated.window.overflowY === 'visible') consolidated.window.overflowY = 'auto'

      // In iOS, window.overflow(X/Y): "hidden" actually means "auto"; transform
      if (isIOS()) {
        if (consolidated.window.overflowX === 'hidden') consolidated.window.overflowX = 'auto'
        if (consolidated.window.overflowY === 'hidden') consolidated.window.overflowY = 'auto'
      }

      // Add the boolean status properties to the result
      consolidated.window = getAppliedOverflows(consolidated.window, true)
      consolidated.body = getAppliedOverflows(consolidated.body, true)

      return consolidated
    }

    /**
     * Establishes the container and returns it in a jQuery wrapper.
     *
     * Resolves and normalizes the input, which may be a document, HTMLElement, window, or selector string. Corrects
     * likely mistakes, such as passing in a document or an iframe, rather than the corresponding window.
     *
     * @param {Window|Document|HTMLElement|HTMLIFrameElement|jQuery|string} container
     * @returns {jQuery}
     */
    function wrapContainer (container) {
      var $container,
        isJquery = container instanceof $

      if (!isJquery && !$.isWindow(container) && !container.nodeType && !isString(container))
        throw new Error('Invalid container: not a window, node, jQuery object or selector string')

      $container = isJquery ? container : container === root ? $root : $(container)

      if (!$container.length) throw new Error('Invalid container: empty jQuery object')

      container = $container[0]

      if (container.nodeType === 9) {
        // Document is passed in, transform to window
        $container = wrapContainer(container.defaultView || container.parentWindow)
      } else if (container.nodeType === 1 && container.tagName.toLowerCase() === 'iframe') {
        // IFrame element is passed in, transform to IFrame content window
        $container = wrapContainer(container.contentWindow)
      }

      // Check if the container matches the requirements
      if (!$.isWindow($container[0]) && $container.css('overflow') === 'visible')
        throw new Error(
          'Invalid container: is set to overflow:visible. Containers must have the ability to obscure some of their content, otherwise the in-view test is pointless. Containers must be set to overflow:scroll/auto/hide, or be a window (or document, or iframe, as proxies for a window)'
        )

      return $container
    }

    /**
     * Checks if the element is a descendant of the container, and throws an error otherwise. Also checks the type of
     * the element (must indeed be an element node).
     *
     * For performance reasons, this check should *not* be run on every element in a set.
     *
     * @param {HTMLElement}                 elem
     * @param {Window|Document|HTMLElement} container
     */
    function checkHierarchy (elem, container) {
      var elemIsContained

      if (elem.nodeType !== 1) throw new Error('Invalid node: is not an element')

      if ($.isWindow(container)) {
        elemIsContained =
          elem.ownerDocument && container === (elem.ownerDocument.defaultView || elem.ownerDocument.parentWindow)
      } else if (container.nodeType === 9) {
        // We need a DOM element for this check, so we use the documentElement as a proxy if the container is a document.
        elemIsContained = $.contains(container.documentElement, elem)
      } else {
        elemIsContained = $.contains(container, elem)
      }

      if (!elemIsContained) throw new Error('Invalid container: is not an ancestor of the element')
    }

    /**
     * Spots likely option mistakes and throws appropriate errors.
     *
     * @param {Object} opts
     */
    function checkOptions (opts) {
      var isNum, isNumWithUnit

      if (
        opts.direction &&
        !(opts.direction === 'vertical' || opts.direction === 'horizontal' || opts.direction === 'both')
      ) {
        throw new Error('Invalid option value: direction = "' + opts.direction + '"')
      }

      if (opts.box && !(opts.box === 'border-box' || opts.box === 'content-box')) {
        throw new Error('Invalid option value: box = "' + opts.box + '"')
      }

      if (opts.tolerance !== undefined) {
        isNum = isNumber(opts.tolerance)
        isNumWithUnit = isString(opts.tolerance) && /^[+-]?\d*\.?\d+(px|%)?$/.test(opts.tolerance)
        if (!(isNum || isNumWithUnit)) throw new Error('Invalid option value: tolerance = "' + opts.tolerance + '"')
      }
    }

    /**
     * Gets the width of a jQuery-wrapped container, excluding scroll bars. Also supports quirks mode for window
     * containers, unlike jQuery's $( window ).width(). Makes use of caching if a cache object is provided.
     *
     * @param   {jQuery}  $container
     * @param   {boolean} isWindow    required to speed up the process
     * @param   {Object}  [cache]
     * @returns {number}
     */
    function getNetContainerWidth ($container, isWindow, cache) {
      var width

      if (cache && cache.netContainerWidth !== undefined) {
        width = cache.netContainerWidth
      } else {
        width = isWindow
          ? getWindowDimension($container, 'Width')
          : $container.innerWidth() - getContainerScrollbarWidths($container, cache).vertical

        if (cache) cache.netContainerWidth = width
      }

      return width
    }

    /**
     * Gets the height of a jQuery-wrapped container, excluding scroll bars. Also supports quirks mode for window
     * containers, unlike jQuery's $( window ).height(). Makes use of caching if a cache object is provided.
     *
     * @param   {jQuery}  $container
     * @param   {boolean} isWindow    required to speed up the process
     * @param   {Object}  [cache]
     * @returns {number}
     */
    function getNetContainerHeight ($container, isWindow, cache) {
      var height

      if (cache && cache.netContainerHeight !== undefined) {
        height = cache.netContainerHeight
      } else {
        height = isWindow
          ? getWindowDimension($container, 'Height')
          : $container.innerHeight() - getContainerScrollbarWidths($container, cache).horizontal

        if (cache) cache.netContainerHeight = height
      }

      return height
    }

    /**
     * Gets the effective scroll bar widths of a given container. Makes use of caching if a cache object is provided.
     *
     * @param   {jQuery} $container
     * @param   {Object} [cache]
     * @returns {Object}
     */
    function getContainerScrollbarWidths ($container, cache) {
      var containerScrollbarWidths

      if (cache && cache.containerScrollbarWidths) {
        containerScrollbarWidths = cache.containerScrollbarWidths
      } else {
        containerScrollbarWidths = effectiveScrollbarWith($container)
        if (cache) cache.containerScrollbarWidths = containerScrollbarWidths
      }

      return containerScrollbarWidths
    }

    /**
     * Gets the width or height of a jQuery-wrapped window. Use it instead of $container.width(). Supports quirks mode,
     * unlike jQuery.
     *
     * Window dimensions are calculated as in Zakas, Professional Javascript (2012), p. 404. The standards mode part of
     * it is the same as in jQuery, too.
     *
     * @param {jQuery} $window
     * @param {string} dimension  "Width" or "Height" (capitalized!)
     * @returns {number}
     */
    function getWindowDimension ($window, dimension) {
      var doc = $window[0].document,
        property = 'client' + dimension

      return doc.compatMode === 'BackCompat' ? doc.body[property] : doc.documentElement[property]
    }

    /**
     * Returns the computed style for a property, or an array of properties, as a hash.
     *
     * Building a CSS properties hash this way can be significantly faster than the more convenient, conventional jQuery
     * approach, $( elem ).css( propertiesArray ).
     *
     * ATTN
     * ====
     *
     * We are using an internal jQuery API here: $.css(). The current signature was introduced in jQuery 1.9.0. It may
     * break without warning with any change of the minor version.
     *
     * For that reason, the $.css API is monitored by the tests in api.jquery.css.spec.js which verify that it works as
     * expected.
     *
     * @param {HTMLElement}     elem
     * @param {string|string[]} properties
     * @param {Object}          [opts]
     * @param {boolean}         [opts.toLowerCase=false]  ensures return values in lower case
     * @param {boolean}         [opts.toFloat=false]      converts return values to numbers, using parseFloat
     *
     * @returns {Object}        property names and their values
     */
    function getCss (elem, properties, opts) {
      var i,
        length,
        name,
        props = {},
        _window = elem.ownerDocument.defaultView || elem.ownerDocument.parentWindow,
        computedStyles = _useGetComputedStyle ? _window.getComputedStyle(elem, null) : elem.currentStyle

      opts || (opts = {})

      if (!$.isArray(properties)) properties = [properties]
      length = properties.length

      for (i = 0; i < length; i++) {
        name = properties[i]
        props[name] = $.css(elem, name, false, computedStyles)
        if (opts.toLowerCase && props[name] && props[name].toLowerCase) props[name] = props[name].toLowerCase()
        if (opts.toFloat) props[name] = parseFloat(props[name])
      }

      return props
    }

    /**
     * Returns the bounding client rect, including width and height properties. Ensures compatibility with IE8, which
     * supports getBoundingClientRect but doesn't calculate width and height.
     *
     * Use only when width and height are actually needed.
     *
     * Will be removed when IE8 support is dropped entirely.
     *
     * @param   {HTMLElement} elem
     * @returns {ClientRect}
     */
    function getBoundingClientRectCompat (elem) {
      var elemRect = elem.getBoundingClientRect()

      if (elemRect.width === undefined || elemRect.height === undefined) {
        // Fix for IE8
        elemRect = {
          top: elemRect.top,
          left: elemRect.left,
          bottom: elemRect.bottom,
          right: elemRect.right,
          width: elemRect.right - elemRect.left,
          height: elemRect.bottom - elemRect.top
        }
      }

      return elemRect
    }

    /**
     * Detects if the browser is on iOS. Works for Safari as well as other browsers, say, Chrome on iOS.
     *
     * Required for some iOS behaviour which can't be feature-detected in any way.
     *
     * @returns {boolean}
     */
    function isIOS () {
      if (_isIOS === undefined) _isIOS = /iPad|iPhone|iPod/g.test(navigator.userAgent)
      return _isIOS
    }

    /**
     * Calls parseFloat on each value. Useful for removing units from numeric values.
     *
     * @param   {Object} object
     * @returns {Object}
     */
    function toFloat (object) {
      var transformed = {}

      $.map(object, function (value, key) {
        transformed[key] = parseFloat(value)
      })

      return transformed
    }

    /**
     * Returns whether or not a value is of type number. Also rejects NaN as a number.
     *
     * NB This is not the same as $.isNumeric because $.isNumeric( "3" ) is true while isNumber( "3" ) is false.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isNumber (value) {
      // Done as in the Lodash compatibility build, but rejecting NaN as a number.
      var isNumeric =
        typeof value === 'number' ||
        (value && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Number]') ||
        false

      // Reject NaN before returning
      return isNumeric && value === +value
    }

    function isString (value) {
      // Done as in the Lodash compatibility build
      return (
        typeof value === 'string' ||
        (value && typeof value === 'object' && Object.prototype.toString.call(value) === '[object String]') ||
        false
      )
    }

    /**
     * Custom types.
     *
     * For easier documentation and type inference.
     */

    /**
     * @name  AppliedOverflow
     * @type  {Object}
     *
     * @property {string}  overflowX
     * @property {string}  overflowY
     * @property {boolean} overflowVisibleX
     * @property {boolean} overflowVisibleY
     * @property {boolean} overflowAutoX
     * @property {boolean} overflowAutoY
     * @property {boolean} overflowScrollX
     * @property {boolean} overflowScrollY
     * @property {boolean} overflowHiddenX
     * @property {boolean} overflowHiddenY
     */
  })(typeof jQuery !== 'undefined' ? jQuery : $)
})
