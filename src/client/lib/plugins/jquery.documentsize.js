// jQuery.documentSize, v1.2.3
// Copyright (c) 2015-2016 Michael Heim, Zeilenwechsel.de
// Distributed under MIT license
// http://github.com/hashchange/jquery.documentsize

;(function (root, factory) {
  'use strict'

  if (typeof exports === 'object') {
    module.exports = factory(require('jquery'))
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory)
  }
})(this, function (jQuery) {
  'use strict'
  ;(function ($) {
    'use strict'

    // IIFE generating the functions $.documentWidth, $.documentHeight, $.windowWidth, $.windowHeight, and
    // $.scrollbarWidth.
    //
    // These functions need to run feature detections which requires insertion of an iframe ($.documentWidth/Height) and
    // a div ($.scrollbarWidth). The body element in the main document must be available when that happens (ie, the
    // opening body tag must have been parsed).
    //
    // For that reason, the detection does not run instantly - after all, the code might be loaded and run while parsing
    // the head. Instead, detection happens on DOM-ready, or when any of the functions is invoked for the first time.
    // Given the purpose of the functions, they won't be called until after the opening body tag has been parsed.

    var _scrollbarWidth,
      _supportsWindowInnerWidth,
      _supportsSubpixelAccuracy,
      elementNameForDocSizeQuery,
      ieVersion,
      useGetComputedStyle = !!window.getComputedStyle

    /**
     * @param   {Document} [_document=document]
     * @returns {number}
     */
    $.documentWidth = function (_document) {
      var width

      _document || (_document = document)

      try {
        if (elementNameForDocSizeQuery === undefined) testDocumentScroll()
        width = _document[elementNameForDocSizeQuery].scrollWidth
      } catch (e) {
        // Fallback for unsupported, broken browsers which can't run the behaviour test successfully
        width = guessDocumentSize('Width', _document)
      }

      return width
    }

    /**
     * @param   {Document} [_document=document]
     * @returns {number}
     */
    $.documentHeight = function (_document) {
      var height

      _document || (_document = document)

      try {
        if (elementNameForDocSizeQuery === undefined) testDocumentScroll()
        height = _document[elementNameForDocSizeQuery].scrollHeight
      } catch (e) {
        // Fallback for unsupported, broken browsers which can't run the behaviour test successfully
        height = guessDocumentSize('Height', _document)
      }

      return height
    }

    /**
     * @param   {string|Object|Window} [options="visual"]  (a) viewport option: strings "visual", "layout" (case-
     *                                                         insensitive), or a hash with a `viewport` property
     *                                                     (b) the window argument
     * @param   {string|Object|Window} [_window=window]    same as first argument; positions for window and viewport
     *                                                     argument are interchangeable
     * @returns {number}
     */
    $.windowWidth = function (options, _window) {
      var config = getWindowQueryConfig(arguments)
      return getWindowSize('Width', config)
    }

    /**
     * @param   {string|Object|Window} [options="visual"]  (a) viewport option: strings "visual", "layout" (case-
     *                                                         insensitive), or a hash with a `viewport` property
     *                                                     (b) the window argument
     * @param   {string|Object|Window} [_window=window]    same as first argument; positions for window and viewport
     *                                                     argument are interchangeable
     * @returns {number}
     */
    $.windowHeight = function (options, _window) {
      var config = getWindowQueryConfig(arguments)
      return getWindowSize('Height', config)
    }

    /**
     * @param   {Window} [_window=window]
     * @returns {number}
     */
    $.pinchZoomFactor = function (_window) {
      // Calculate the zoom factor based on the width, not the height. getPinchZoomFactor() does just that.
      //
      // It would be more accurate to use the longest side for the calculation, keeping the effect of rounding errors
      // low (unless the browser supports sub-pixel accuracy anyway).
      //
      // Unfortunately, iOS does not allow that approach. Switching from normal to minimal UI is not reflected in the
      // clientHeight, so the zoom factor would seem to change when the UI disappears (even though in reality, it
      // doesn't). We have to use the width, irrespective of orientation.

      return getPinchZoomFactor(_window)
    }

    /**
     * @returns {number}
     */
    $.scrollbarWidth = browserScrollbarWidth

    /**
     * Returns the window width or height. Does the actual work of $.windowWidth() and $.windowHeight().
     *
     * Handles minimal UI in iOS properly. Returns the size of either the visual viewport (default) or the layout
     * viewport.
     *
     * Precision:
     *
     * - The maximum rounding error for the visual viewport is +/- 1px.
     * - Layout viewport width is precise.
     * - Layout viewport height would potentially be prone to larger rounding errors (though in practice they rarely
     *   seem to exceed +/- 2px). Additional logic is employed to detect and correct these errors. As a result, the
     *   layout viewport height is precise as well.
     *
     * @param   {string}            dimension  must be "Width" or "Height" (upper case!)
     * @param   {WindowQueryConfig} config
     * @returns {number}
     */
    function getWindowSize (dimension, config) {
      var ddeClientHeight,
        visualSize,
        zoomFactor,
        snapToKnownHeight,
        lBound,
        uBound,
        _window = config.window,
        scrollbarsConsumeSpace = browserScrollbarWidth() !== 0,
        getLayoutViewportWidth = config.useLayoutViewport && dimension === 'Width',
        useClientSize = scrollbarsConsumeSpace || !supportsWindowInnerWidth() || getLayoutViewportWidth,
        size = useClientSize
          ? _window.document.documentElement['client' + dimension]
          : getWindowInnerSize(dimension, _window)

      if (config.useLayoutViewport && !useClientSize) {
        // Looking for the layout viewport height on mobile. Calculate it from window.innerHeight and the zoom
        // factor, so as to capture the real height when the browser is in minimal UI on iOS.
        //
        // NB The layout viewport has a size in full CSS pixels (unaffected by zooming, hence no sub pixels).

        visualSize = size
        zoomFactor = getPinchZoomFactor(_window, { asRange: true })

        size = Math.round(visualSize * zoomFactor.calculated)

        // Fix rounding errors, caused by the visual height ignoring sub-pixel fractions. If we know we are near a
        // known layout viewport height, use that.
        if (!supportsSubpixelAccuracy()) {
          ddeClientHeight = _window.document.documentElement.clientHeight

          // In Android, the height we get from ddE.clientHeight and the one calculated from window.innerHeight
          // should be the same, except for rounding errors in the calculation. So basically, we could just set
          // any calculated value to the clientHeight, no matter how large the difference is. (That is, if we even
          // end up here - in some versions of Chrome on Android, for instance, we have sub-pixel accuracy.)
          //
          // Not so in iOS. In minimal UI, the real layout viewport may be larger than the one reported by
          // clientHeight, by about 60px. So we need to impose reasonable limits on what is considered to be near
          // the clientHeight.
          //
          // - If the calculated value is within 3px of the clientHeight, we consider it to be a clear case of a
          //   rounding error.
          // - Alternatively, the clientHeight must be between the theoretical maximum and minimum values of the
          //   computation, assuming maximum rounding errors at every stage.
          // - If we use that range, its upper bound is capped at 30px above the clientHeight - keeping a safe
          //   distance from current minimal UI heights, or possible future ones.

          lBound = (visualSize - 1) * zoomFactor.min
          uBound = (visualSize + 1) * zoomFactor.max

          snapToKnownHeight =
            (size <= ddeClientHeight + 3 && size >= ddeClientHeight - 3) ||
            (lBound <= ddeClientHeight && uBound >= ddeClientHeight && uBound < ddeClientHeight + 30)

          if (snapToKnownHeight) size = ddeClientHeight
        }
      }

      return size
    }

    /**
     * Calculates the zoom factor for pinch zooming on mobile. A factor > 1 means that the page is zoomed in (content
     * enlarged).
     *
     * The zoom factor returned here measures the size of the visual viewport with respect to the size of the layout
     * viewport. Note that browsers usually calculate their zoom level with respect to the ideal viewport, not the
     * layout viewport (see Peter-Paul Koch, The Mobile Web Handbook, Chapter 3: Viewports, Section "Minimum and Maximum
     * Zoom").
     *
     * Ignores page zoom on the desktop (returning a zoom factor of 1). For the distinction between pinch and page zoom,
     * again see Chapter 3 in PPK's book.
     *
     * @param   {Window}  [_window=window]
     * @param   {Object}  [options]
     * @param   {boolean} [options.asRange=false]
     * @returns {number|ZoomAccuracyRange}
     */
    function getPinchZoomFactor (_window, options) {
      var ddeClientWidth,
        windowInnerWidth,
        asRange = options && options.asRange,
        factors = {
          calculated: 1,
          min: 1,
          max: 1
        },
        skip = browserScrollbarWidth() !== 0 || !supportsWindowInnerWidth()

      if (!skip) {
        _window || (_window = window)
        ddeClientWidth = _window.document.documentElement.clientWidth
        windowInnerWidth = getWindowInnerWidth(_window)

        // Calculate the zoom factor, assuming window.innerWidth is precise (no rounding errors).
        factors.calculated = ddeClientWidth / windowInnerWidth

        // If requested, determine the minimum and maximum value of the zoom factor in the presence of rounding errors.
        if (asRange) {
          if (supportsSubpixelAccuracy()) {
            // No need to take rounding errors into account
            factors.min = factors.max = factors.calculated
          } else {
            factors.min = ddeClientWidth / (windowInnerWidth + 1)
            factors.max = ddeClientWidth / (windowInnerWidth - 1)
          }
        }
      }

      return asRange ? factors : factors.calculated
    }

    /**
     * Handles the argument juggling for $.windowWidth() and $.windowHeight(). Extracts the window and viewport settings
     * from the arguments, applying the defaults (use global window, use visual viewport) where necessary.
     *
     * Examines the first two arguments. The window and the viewport setting can appear in either position,
     * interchangeably. The viewport setting can be passed in as a string, or as part of an options hash,
     * `{ viewport: ... }`.
     *
     * Recognized viewport names are "visual" and "layout" (case-insensitive).
     *
     * @param   {Array|Arguments} args
     * @returns {WindowQueryConfig}
     */
    function getWindowQueryConfig (args) {
      var isWindowArg0,
        isOptionArg0,
        isOptionArg1,
        // Defaults
        _window = window,
        _useVisualViewport = true

      if (args && args.length) {
        // Coerce to a real array
        args = Array.prototype.slice.call(args)

        // Examine the first argument. Cast strings to an options hash with a `viewport` property.
        isWindowArg0 = isWindow(args[0])
        if (!isWindowArg0) args[0] = castStringToViewportOption(args[0])
        isOptionArg0 = !isWindowArg0 && args[0]

        // Examine the second argument. Again, cast strings to an options hash with a `viewport` property.
        if (!isOptionArg0) args[1] = castStringToViewportOption(args[1])
        isOptionArg1 = !isOptionArg0 && args[1]

        // Extract window and viewport option, if available.
        if (isWindowArg0) {
          _window = args[0]
          if (isOptionArg1 && args[1].viewport) _useVisualViewport = isVisualViewport(args[1].viewport)
        } else if (isOptionArg0) {
          if (args[0].viewport) _useVisualViewport = isVisualViewport(args[0].viewport)
          if (isWindow(args[1])) _window = args[1]
        } else if (!args[0] && args[1]) {
          // First argument was falsy, e.g. undefined, null. Ignore it. But process the second, non-falsy argument.
          if (isOptionArg1 && args[1].viewport) {
            _useVisualViewport = isVisualViewport(args[1].viewport)
          } else if (isWindow(args[1])) {
            _window = args[1]
          }
        }
      }

      return {
        window: _window,
        useVisualViewport: _useVisualViewport,
        useLayoutViewport: !_useVisualViewport
      }
    }

    /**
     * Checks if the argument is the name of the visual viewport. The check is case-insensitive.
     *
     * Expects a string. Tolerates falsy values, returning false then (argument is not naming the visual viewport).
     * Throws an error for everything else. Also throws an error if the viewport name is a string but not recognized
     * (typo alert).
     *
     * Helper for getWindowQueryConfig().
     *
     * @param   {string} [name]  strings "visual", "layout" (case-insensitive)
     * @returns {boolean}
     */
    function isVisualViewport (name) {
      var viewport = isString(name) && name.toLowerCase()

      if (name && !viewport) throw new Error('Invalid viewport option: ' + name)
      if (viewport && viewport !== 'visual' && viewport !== 'layout') throw new Error('Invalid viewport name: ' + name)

      return viewport === 'visual'
    }

    /**
     * Examines a value and casts a string to a hash with a `viewport` property (the string being its value). If the
     * value is not a string, or if the string is empty, it is returned as-is. Helper for getWindowQueryConfig().
     *
     * @param   {*} arg
     * @returns {*}
     */
    function castStringToViewportOption (arg) {
      return isString(arg) && arg !== '' ? { viewport: arg } : arg
    }

    /**
     * Checks if the browser supports window.innerWidth and window.innerHeight.
     *
     * The check is run on demand, rather than up front while loading the component, because the window properties can
     * behave strangely in the early stages of opening a window. The component might be loaded in the document head,
     * which could potentially be early enough to run into these oddities. So we wait until the first call.
     *
     * IE 8 does not support window.innerWidth and .innerHeight. FF has a bug which as only been fixed in FF25 (released
     * 29 Oct 2013). It manifests itself in a fictional return value of 10 for these properties. See
     *
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window.innerWidth
     * - https://developer.mozilla.org/en-US/docs/Web/API/Window.innerHeight
     * - https://bugzilla.mozilla.org/show_bug.cgi?id=641188
     *
     * @returns {boolean}
     */
    function supportsWindowInnerWidth () {
      if (_supportsWindowInnerWidth === undefined) _supportsWindowInnerWidth = getWindowInnerWidth() > 10
      return _supportsWindowInnerWidth
    }

    /**
     * Does the actual work of $.scrollbarWidth. Protected from external modification. See $.scrollbarWidth for details.
     *
     * Adapted from Ben Alman's scrollbarWidth plugin. See
     * - http://benalman.com/projects/jquery-misc-plugins/#scrollbarwidth
     * - http://jsbin.com/zeliy/1
     *
     * @returns {number}
     */
    function browserScrollbarWidth () {
      var testEl

      if (_scrollbarWidth === undefined) {
        testEl = document.createElement('div')
        testEl.style.cssText =
          'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -500px; left: -500px; margin: 0px; padding: 0px; border: none;'

        document.body.appendChild(testEl)
        _scrollbarWidth = testEl.offsetWidth - testEl.clientWidth
        document.body.removeChild(testEl)
      }

      return _scrollbarWidth
    }

    /**
     * Detects which element to use for a document size query (body or documentElement).
     *
     * Sandbox
     * -------
     *
     * The detection is sandboxed in an iframe element created for the purpose. If the iframe window can't be
     * accessed because of some obscure policy restriction or browser bug, the main window and document is used
     * as a fallback.
     *
     * The test is designed to minimize the visual and rendering impact in the test window, in case the fallback
     * should ever be used.
     *
     * Test method
     * -----------
     *
     * We can't test directly which call to use (at least not with an even worse amount of intervention than is
     * already the case, which matters if the iframe is not accessible). But we can work by exclusion.
     *
     * In Chrome (desktop and mobile), Safari (also iOS), and Opera, body.scrollWidth returns the true document
     * width. In Firefox and IE, body.scrollWidth responds to the body content size instead. In those browsers,
     * true document width is returned by document.documentElement.scrollWidth.
     *
     * So we test the behaviour of body.scrollWidth by manipulating the body size, while keeping the document size
     * constant.
     *
     * - We prepare for the test by making sure the body does not display its overflow.
     * - Then we inject a small test element into the body and give it a relative position far outside the viewport.
     *
     * The body size is expanded, but the document size remains unaffected because the body hides the overflowing
     * test element (either outright, or by putting it in a hidden part of the scroll pane). Then we check if
     * body.scrollWidth has responded to the change. From that, we infer the right element to use for a document
     * width query.
     *
     * The function does not return anything. It sets the elementNameForDocSizeQuery in the closure instead.
     */
    function testDocumentScroll () {
      var initialDocumentState,
        _testEl,
        initialScrollWidth,
        responds,
        iframe = createTestIframe(),
        _document = (iframe && iframe.contentDocument) || document,
        _body = _document.body,
        inIframe = _document !== document

      // Create a test element which will be used to to expand the body content way to the right.
      _testEl = _document.createElement('div')
      _testEl.style.cssText = 'width: 1px; height: 1px; position: relative; top: 0px; left: 32000px;'

      // Make sure that the body (but not the window) hides its overflow. Only applies if the iframe is not
      // accessible. The iframe document already contains the required styles.
      if (!inIframe) initialDocumentState = prepareGlobalDocument()

      // Inject the test element, then test if the body.scrollWidth property responds
      initialScrollWidth = _body.scrollWidth
      _body.appendChild(_testEl)
      responds = initialScrollWidth !== _body.scrollWidth
      _body.removeChild(_testEl)

      // Restore the overflow settings for window and body
      if (!inIframe) restoreGlobalDocument(initialDocumentState)

      // If body.scrollWidth responded, it reacts to body content size, not document size. Default to
      // ddE.scrollWidth. If it did not react, however, it is linked to the (unchanged) document size.
      elementNameForDocSizeQuery = responds ? 'documentElement' : 'body'

      if (iframe) document.body.removeChild(iframe)
    }

    /**
     * Creates an iframe document with an HTML5 doctype and UTF-8 encoding and positions it off screen. Window size
     * is 500px x 500px. Body and window (document element) are set to overflow: hidden.
     *
     * In case the content document of the iframe can't be accessed for some reason, the function returns undefined.
     * This is unlikely to ever happen, though.
     *
     * @returns {HTMLIFrameElement|undefined}
     */
    function createTestIframe () {
      var iframe = document.createElement('iframe'),
        body = document.body

      iframe.style.cssText =
        'position: absolute; top: -600px; left: -600px; width: 500px; height: 500px; margin: 0px; padding: 0px; border: none; display: block;'
      iframe.frameborder = '0'

      body.appendChild(iframe)
      iframe.src = 'about:blank'

      if (!iframe.contentDocument) return

      iframe.contentDocument.write(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title></title><style type="text/css">html, body { overflow: hidden; }</style></head><body></body></html>'
      )

      return iframe
    }

    /**
     * Makes sure the body (but not the window) hides its overflow. Works with the global document, returns the initial
     * state before manipulation (including properties indicating what has been modified).
     *
     * Used only if iframe creation or access has failed for some reason.
     */
    function prepareGlobalDocument () {
      var ddEStyle,
        bodyStyle,
        ddE = document.documentElement,
        body = document.body,
        ddEComputedStyles = useGetComputedStyle ? window.getComputedStyle(ddE, null) : ddE.currentStyle,
        bodyComputedStyles = useGetComputedStyle ? window.getComputedStyle(body, null) : body.currentStyle,
        ddEOverflowX = (ddEComputedStyles.overflowX || ddEComputedStyles.overflow || 'visible').toLowerCase(),
        bodyOverflowX = (bodyComputedStyles.overflowX || bodyComputedStyles.overflow || 'visible').toLowerCase(),
        modifyBody = bodyOverflowX !== 'hidden',
        modifyDocumentElement = ddEOverflowX === 'visible',
        initialState = {
          documentElement: {
            modified: modifyDocumentElement
          },
          body: {
            modified: modifyBody
          }
        }

      if (modifyDocumentElement) {
        ddEStyle = ddE.style
        initialState.documentElement.styleOverflowX = ddEStyle.overflowX
        ddEStyle.overflowX = 'auto'
      }

      if (modifyBody) {
        bodyStyle = body.style
        initialState.body.styleOverflowX = bodyStyle.overflowX
        bodyStyle.overflowX = 'hidden'
      }

      return initialState
    }

    /**
     * Restores the body and documentElement styles to their initial state, which is passed in as an argument. Works
     * with the global document.
     *
     * Used only if iframe creation or access has failed for some reason.
     *
     * @param {Object} previousState  the initial state, as returned by prepareGlobalDocument()
     */
    function restoreGlobalDocument (previousState) {
      if (previousState.documentElement.modified)
        document.documentElement.style.overflowX = previousState.documentElement.styleOverflowX
      if (previousState.body.modified) document.body.style.overflowX = previousState.body.styleOverflowX
    }

    /**
     * Returns a best guess for the window width or height. Used as a fallback for unsupported browsers which are too
     * broken to even run the feature test.
     *
     * The conventional jQuery method of guessing the document size is used here: every conceivable value is queried and
     * the largest one is picked.
     *
     * @param {string}   dimension    accepted values are "Width" or "Height" (capitalized first letter!)
     * @param {Document} [_document]
     */
    function guessDocumentSize (dimension, _document) {
      var ddE = _document.documentElement

      return Math.max(
        ddE.body['scroll' + dimension],
        _document['scroll' + dimension],
        ddE.body['offset' + dimension],
        _document['offset' + dimension],
        _document['client' + dimension]
      )
    }

    /**
     * Returns window.innerWidth.
     *
     * Along the way, the return value is examined to see if the browser supports sub-pixel accuracy (floating-point
     * values).
     *
     * @param   {Window} [_window=window]
     * @returns {number}
     */
    function getWindowInnerWidth (_window) {
      return getWindowInnerSize('Width', _window)
    }

    /**
     * Returns window.innerHeight.
     *
     * Along the way, the return value is examined to see if the browser supports sub-pixel accuracy (floating-point
     * values).
     *
     * @param   {Window} [_window=window]
     * @returns {number}
     */
    function getWindowInnerHeight (_window) {
      return getWindowInnerSize('Height', _window)
    }

    /**
     * Returns window.innerWidth or window.innerHeight, depending on the dimension argument.
     *
     * Along the way, the return value is examined to see if the browser supports sub-pixel accuracy (floating-point
     * values).
     *
     * @param   {string} dimension  must be "Width" or "Height" (upper case!)
     * @param   {Window} [_window=window]
     * @returns {number}
     */
    function getWindowInnerSize (dimension, _window) {
      var size = (_window || window)['inner' + dimension]

      // Check for fractions. Exclude undefined return values in browsers which don't support window.innerWidth/Height.
      if (size) checkForFractions(size)
      return size
    }

    /**
     * Accepts an observed value of window.innerWidth or window.innerHeight and examines it for fractional values.
     * Caches the finding if there is one. Helper for getWindowInnerWidth() and friends.
     *
     * See supportsSubpixelAccuracy() for more.
     *
     * @param {number} sizeMeasurement
     */
    function checkForFractions (sizeMeasurement) {
      // When checking the cached value, we can't accept false as a definitive answer. We have to continue checking
      // unless the cached value is `true`.
      //
      // See supportsSubpixelAccuracy().
      if (!_supportsSubpixelAccuracy && isFloat(sizeMeasurement)) _supportsSubpixelAccuracy = true
    }

    /**
     * Returns whether or not the browser supports sub-pixel accuracy (floating-point values) for window.innerWidth and
     * window.innerHeight - as far as we know yet.
     *
     * The browser behaviour can't be tested directly, and must be figured out by continuous observation. We have to
     * monitor the return values of window.innerWidth/Height for fractions. That is done with getWindowInnerWidth etc.
     * As soon as we find a fraction, we know that the browser supports floating-point accuracy.
     *
     * However, we can never be sure of the opposite. If we haven't encountered a fraction yet, it could simply mean
     * that we are at 100% zoom, and integers have indeed been the correct return value so far.
     *
     * So when the method here answers with true, it is definitive. When it returns false, that just means "maybe not,
     * but we don't know". And the the return value might flip to true in a future query.
     *
     * @returns {boolean}
     */
    function supportsSubpixelAccuracy () {
      return !!_supportsSubpixelAccuracy
    }

    function isWindow (value) {
      // Identical to jQuery.isWindow()
      return value != null && value.window == value // jshint ignore:line
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
     * Returns whether or not a value is of type number. Also rejects NaN as a number.
     *
     * NB This is not the same as $.isNumeric because $.isNumeric( "3" ) is true while isNumber( "3" ) is false.
     *
     * @param   {*} value
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

    /**
     * Returns whether or not a number is a float, ie has decimals.
     *
     * Requires the argument to be a number. If unsure, guard against false detections with
     * `isNumber( value ) && isFloat ( value )`.
     *
     * For the technique, see http://stackoverflow.com/a/3885844/508355
     *
     * @param   {number} num
     * @returns {boolean}
     */
    function isFloat (num) {
      return num === +num && num !== (num | 0) // jshint ignore:line
    }

    /**
     * Returns the IE version, or false if the browser is not IE.
     *
     * The result is determined by browser sniffing, rather than a test tailored to the use case. The function must only
     * be called as a last resort, for scenarios where there is no alternative to browser sniffing.
     *
     * These scenarios include:
     *
     * - Preventing IE6 and IE7 from crashing
     * - Preventing IE9 from blocking or delaying the load event
     *
     * The test follows the MSDN recommendation at https://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx#parsingua
     * The result is cached.
     *
     * @returns {number|boolean}
     */
    function getIEVersion () {
      var userAgent, userAgentTestRx

      if (ieVersion === undefined) {
        ieVersion = false
        userAgent = navigator && navigator.userAgent

        if (navigator && navigator.appName === 'Microsoft Internet Explorer' && userAgent) {
          userAgentTestRx = new RegExp('MSIE ([0-9]{1,}[.0-9]{0,})') // jshint ignore:line
          if (userAgentTestRx.exec(userAgent) != null) ieVersion = parseFloat(RegExp.$1)
        }
      }

      return ieVersion
    }

    /**
     * Checks if we are dealing with a truly ancient version of IE (< IE8).
     *
     * This is done by browser sniffing, rather than a test tailored to the use case. Use it only if there is no
     * alternative.
     *
     * @returns {boolean}
     */
    function isAncientIE () {
      var ieVersion = getIEVersion()
      return ieVersion && ieVersion < 8
    }

    /**
     * Checks if the browser is IE9.
     *
     * This is done by browser sniffing, rather than a test tailored to the use case. Use it only if there is no
     * alternative.
     *
     * @returns {boolean}
     */
    function isIE9 () {
      return getIEVersion() === 9
    }

    // Let's prime $.documentWidth(), $.documentHeight() and $.scrollbarWidth() immediately after the DOM is ready. It
    // is best to do it up front because the test touches the DOM, so let's get it over with before people set up
    // handlers for mutation events and such.
    //
    // This step has to be skipped for the following browsers:
    //
    // - ancient versions of IE (IE6, IE7).
    //   IE6 and IE7 can't handle the feature tests on DOM ready - they crash right away. Later on, the tests are ok.
    //
    // - IE9.
    //   If the feature tests were run on DOM ready, the window load event would become unreliable. The event might not
    //   fire until the user moves the mouse over the document. This bug is rare and not triggered by jQuery.documentSize
    //   alone; third-party code likely plays a role. The exact circumstances are not clear - see issue #3.
    //
    // For these browsers, we don't run the feature tests preemptively. Instead, we do it on demand, when the first
    // document size query is made.
    if (typeof $ === 'function' && !isAncientIE() && !isIE9()) {
      // Try-catch acts as a safety net for unsupported, broken browsers
      try {
        $(function () {
          if (elementNameForDocSizeQuery === undefined) testDocumentScroll()
          browserScrollbarWidth()
        })
      } catch (e) {}
    }

    /**
     * Custom types.
     *
     * For easier documentation and type inference.
     */

    /**
     * @name ZoomAccuracyRange
     * @type {Object}
     *
     * @property {number} calculated
     * @property {number} min
     * @property {number} max
     */

    /**
     * @name WindowQueryConfig
     * @type {Object}
     *
     * @property {Window}  window
     * @property {boolean} useVisualViewport
     * @property {boolean} useLayoutViewport
     */
  })(typeof jQuery !== 'undefined' ? jQuery : typeof Zepto !== 'undefined' ? Zepto : $)
  return jQuery.documentSize
})
