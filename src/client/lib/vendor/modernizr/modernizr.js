/*! modernizr 3.3.1 (Custom Build) | MIT *
 * https://modernizr.com/download/?-animation-applicationcache-audio-audioloop-audiopreload-backgroundblendmode-backgroundcliptext-backgroundsize-bgpositionshorthand-bgpositionxy-bgrepeatspace_bgrepeatround-bgsizecover-borderradius-boxshadow-boxsizing-canvas-canvasblending-canvastext-canvaswinding-checked-contextmenu-cookies-cors-cssanimations-csscolumns-cssfilters-cssmask-cssremunit-cssscrollbar-csstransforms-csstransitions-cssvalid-cssvhunit-cssvwunit-cubicbezierrange-customevent-ellipsis-emoji-eventlistener-fileinput-filereader-flash-flexbox-flexboxlegacy-flexboxtweener-flexwrap-formvalidation-generatedcontent-geolocation-history-htmlimports-imgcrossorigin-inlinesvg-input-inputtypes-json-lastchild-localstorage-mediaqueries-multiplebgs-notification-nthchild-olreversed-opacity-overflowscrolling-placeholder-queryselector-requestanimationframe-rgba-search-supports-svg-svgfilters-textareamaxlength-todataurljpeg_todataurlpng_todataurlwebp-unicode-unicoderange-video-webaudio-webgl-websockets-setclasses !*/
!(function (A, e, t) {
  function n (A, e) {
    return typeof A === e
  }
  function a () {
    var A, e, t, a, i, o, r
    for (var d in E)
      if (E.hasOwnProperty(d)) {
        if (
          ((A = []),
          (e = E[d]),
          e.name && (A.push(e.name.toLowerCase()), e.options && e.options.aliases && e.options.aliases.length))
        )
          for (t = 0; t < e.options.aliases.length; t++) A.push(e.options.aliases[t].toLowerCase())
        for (a = n(e.fn, 'function') ? e.fn() : e.fn, i = 0; i < A.length; i++)
          (o = A[i]),
            (r = o.split('.')),
            1 === r.length
              ? (Modernizr[r[0]] = a)
              : (!Modernizr[r[0]] ||
                  Modernizr[r[0]] instanceof Boolean ||
                  (Modernizr[r[0]] = new Boolean(Modernizr[r[0]])),
                (Modernizr[r[0]][r[1]] = a)),
            v.push((a ? '' : 'no-') + r.join('-'))
      }
  }
  function i (A) {
    var e = I.className,
      t = Modernizr._config.classPrefix || ''
    if ((y && (e = e.baseVal), Modernizr._config.enableJSClass)) {
      var n = new RegExp('(^|\\s)' + t + 'no-js(\\s|$)')
      e = e.replace(n, '$1' + t + 'js$2')
    }
    Modernizr._config.enableClasses &&
      ((e += ' ' + t + A.join(' ' + t)), y ? (I.className.baseVal = e) : (I.className = e))
  }
  function o () {
    return 'function' != typeof e.createElement
      ? e.createElement(arguments[0])
      : y
      ? e.createElementNS.call(e, 'http://www.w3.org/2000/svg', arguments[0])
      : e.createElement.apply(e, arguments)
  }
  function r () {
    var A = e.body
    return A || ((A = o(y ? 'svg' : 'body')), (A.fake = !0)), A
  }
  function d (A, e) {
    if ('object' == typeof A) for (var t in A) k(A, t) && d(t, A[t])
    else {
      A = A.toLowerCase()
      var n = A.split('.'),
        a = Modernizr[n[0]]
      if ((2 == n.length && (a = a[n[1]]), 'undefined' != typeof a)) return Modernizr
      ;(e = 'function' == typeof e ? e() : e),
        1 == n.length
          ? (Modernizr[n[0]] = e)
          : (!Modernizr[n[0]] || Modernizr[n[0]] instanceof Boolean || (Modernizr[n[0]] = new Boolean(Modernizr[n[0]])),
            (Modernizr[n[0]][n[1]] = e)),
        i([(e && 0 != e ? '' : 'no-') + n.join('-')]),
        Modernizr._trigger(A, e)
    }
    return Modernizr
  }
  function w (A) {
    return A.replace(/([a-z])-([a-z])/g, function (A, e, t) {
      return e + t.toUpperCase()
    }).replace(/^-/, '')
  }
  function s (A, t, n, a) {
    var i,
      d,
      w,
      s,
      l = 'modernizr',
      D = o('div'),
      u = r()
    if (parseInt(n, 10)) for (; n--; ) (w = o('div')), (w.id = a ? a[n] : l + (n + 1)), D.appendChild(w)
    return (
      (i = o('style')),
      (i.type = 'text/css'),
      (i.id = 's' + l),
      (u.fake ? u : D).appendChild(i),
      u.appendChild(D),
      i.styleSheet ? (i.styleSheet.cssText = A) : i.appendChild(e.createTextNode(A)),
      (D.id = l),
      u.fake &&
        ((u.style.background = ''),
        (u.style.overflow = 'hidden'),
        (s = I.style.overflow),
        (I.style.overflow = 'hidden'),
        I.appendChild(u)),
      (d = t(D, A)),
      u.fake ? (u.parentNode.removeChild(u), (I.style.overflow = s), I.offsetHeight) : D.parentNode.removeChild(D),
      !!d
    )
  }
  function l (A, e) {
    return !!~('' + A).indexOf(e)
  }
  function D (A, e) {
    return function () {
      return A.apply(e, arguments)
    }
  }
  function u (A, e, t) {
    var a
    for (var i in A) if (A[i] in e) return t === !1 ? A[i] : ((a = e[A[i]]), n(a, 'function') ? D(a, t || e) : a)
    return !1
  }
  function P (A) {
    return A.replace(/([A-Z])/g, function (A, e) {
      return '-' + e.toLowerCase()
    }).replace(/^ms-/, '-ms-')
  }
  function c (e, n) {
    var a = e.length
    if ('CSS' in A && 'supports' in A.CSS) {
      for (; a--; ) if (A.CSS.supports(P(e[a]), n)) return !0
      return !1
    }
    if ('CSSSupportsRule' in A) {
      for (var i = []; a--; ) i.push('(' + P(e[a]) + ':' + n + ')')
      return (
        (i = i.join(' or ')),
        s('@supports (' + i + ') { #modernizr { position: absolute; } }', function (A) {
          return 'absolute' == getComputedStyle(A, null).position
        })
      )
    }
    return t
  }
  function f (A, e, a, i) {
    function r () {
      s && (delete O.style, delete O.modElem)
    }
    if (((i = n(i, 'undefined') ? !1 : i), !n(a, 'undefined'))) {
      var d = c(A, a)
      if (!n(d, 'undefined')) return d
    }
    for (var s, D, u, P, f, p = ['modernizr', 'tspan', 'samp']; !O.style && p.length; )
      (s = !0), (O.modElem = o(p.shift())), (O.style = O.modElem.style)
    for (u = A.length, D = 0; u > D; D++)
      if (((P = A[D]), (f = O.style[P]), l(P, '-') && (P = w(P)), O.style[P] !== t)) {
        if (i || n(a, 'undefined')) return r(), 'pfx' == e ? P : !0
        try {
          O.style[P] = a
        } catch (g) {}
        if (O.style[P] != f) return r(), 'pfx' == e ? P : !0
      }
    return r(), !1
  }
  function p (A, e, t, a, i) {
    var o = A.charAt(0).toUpperCase() + A.slice(1),
      r = (A + ' ' + Z.join(o + ' ') + o).split(' ')
    return n(e, 'string') || n(e, 'undefined')
      ? f(r, e, a, i)
      : ((r = (A + ' ' + F.join(o + ' ') + o).split(' ')), u(r, e, t))
  }
  function g (A, e, n) {
    return p(A, t, t, e, n)
  }
  var v = [],
    E = [],
    B = {
      _version: '3.3.1',
      _config: { classPrefix: '', enableClasses: !0, enableJSClass: !0, usePrefixes: !0 },
      _q: [],
      on: function (A, e) {
        var t = this
        setTimeout(function () {
          e(t[A])
        }, 0)
      },
      addTest: function (A, e, t) {
        E.push({ name: A, fn: e, options: t })
      },
      addAsyncTest: function (A) {
        E.push({ name: null, fn: A })
      }
    },
    Modernizr = function () {}
  ;(Modernizr.prototype = B),
    (Modernizr = new Modernizr()),
    Modernizr.addTest('applicationcache', 'applicationCache' in A),
    Modernizr.addTest('cookies', function () {
      try {
        e.cookie = 'cookietest=1'
        var A = -1 != e.cookie.indexOf('cookietest=')
        return (e.cookie = 'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT'), A
      } catch (t) {
        return !1
      }
    }),
    Modernizr.addTest('cors', 'XMLHttpRequest' in A && 'withCredentials' in new XMLHttpRequest()),
    Modernizr.addTest('customevent', 'CustomEvent' in A && 'function' == typeof A.CustomEvent),
    Modernizr.addTest('eventlistener', 'addEventListener' in A),
    Modernizr.addTest('geolocation', 'geolocation' in navigator),
    Modernizr.addTest('history', function () {
      var e = navigator.userAgent
      return (-1 === e.indexOf('Android 2.') && -1 === e.indexOf('Android 4.0')) ||
        -1 === e.indexOf('Mobile Safari') ||
        -1 !== e.indexOf('Chrome') ||
        -1 !== e.indexOf('Windows Phone')
        ? A.history && 'pushState' in A.history
        : !1
    }),
    Modernizr.addTest('json', 'JSON' in A && 'parse' in JSON && 'stringify' in JSON),
    Modernizr.addTest('queryselector', 'querySelector' in e && 'querySelectorAll' in e),
    Modernizr.addTest(
      'svg',
      !!e.createElementNS && !!e.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
    )
  var Q = !1
  try {
    Q = 'WebSocket' in A && 2 === A.WebSocket.CLOSING
  } catch (m) {}
  Modernizr.addTest('websockets', Q),
    Modernizr.addTest('webaudio', function () {
      var e = 'webkitAudioContext' in A,
        t = 'AudioContext' in A
      return Modernizr._config.usePrefixes ? e || t : t
    })
  var C = 'CSS' in A && 'supports' in A.CSS,
    h = 'supportsCSS' in A
  Modernizr.addTest('supports', C || h),
    Modernizr.addTest('filereader', !!(A.File && A.FileList && A.FileReader)),
    Modernizr.addTest('localstorage', function () {
      var A = 'modernizr'
      try {
        return localStorage.setItem(A, A), localStorage.removeItem(A), !0
      } catch (e) {
        return !1
      }
    }),
    Modernizr.addTest('svgfilters', function () {
      var e = !1
      try {
        e = 'SVGFEColorMatrixElement' in A && 2 == SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE
      } catch (t) {}
      return e
    })
  var I = e.documentElement
  Modernizr.addTest('contextmenu', 'contextMenu' in I && 'HTMLMenuItemElement' in A)
  var y = 'svg' === I.nodeName.toLowerCase()
  Modernizr.addTest('audio', function () {
    var A = o('audio'),
      e = !1
    try {
      ;(e = !!A.canPlayType) &&
        ((e = new Boolean(e)),
        (e.ogg = A.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '')),
        (e.mp3 = A.canPlayType('audio/mpeg; codecs="mp3"').replace(/^no$/, '')),
        (e.opus =
          A.canPlayType('audio/ogg; codecs="opus"') || A.canPlayType('audio/webm; codecs="opus"').replace(/^no$/, '')),
        (e.wav = A.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '')),
        (e.m4a = (A.canPlayType('audio/x-m4a;') || A.canPlayType('audio/aac;')).replace(/^no$/, '')))
    } catch (t) {}
    return e
  }),
    Modernizr.addTest('canvas', function () {
      var A = o('canvas')
      return !(!A.getContext || !A.getContext('2d'))
    }),
    Modernizr.addTest('canvastext', function () {
      return Modernizr.canvas === !1 ? !1 : 'function' == typeof o('canvas').getContext('2d').fillText
    }),
    Modernizr.addTest('emoji', function () {
      if (!Modernizr.canvastext) return !1
      var e = A.devicePixelRatio || 1,
        t = 12 * e,
        n = o('canvas'),
        a = n.getContext('2d')
      return (
        (a.fillStyle = '#f00'),
        (a.textBaseline = 'top'),
        (a.font = '32px Arial'),
        a.fillText('🐨', 0, 0),
        0 !== a.getImageData(t, t, 1, 1).data[0]
      )
    }),
    Modernizr.addTest('olreversed', 'reversed' in o('ol')),
    Modernizr.addTest('video', function () {
      var A = o('video'),
        e = !1
      try {
        ;(e = !!A.canPlayType) &&
          ((e = new Boolean(e)),
          (e.ogg = A.canPlayType('video/ogg; codecs="theora"').replace(/^no$/, '')),
          (e.h264 = A.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/, '')),
          (e.webm = A.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/, '')),
          (e.vp9 = A.canPlayType('video/webm; codecs="vp9"').replace(/^no$/, '')),
          (e.hls = A.canPlayType('application/x-mpegURL; codecs="avc1.42E01E"').replace(/^no$/, '')))
      } catch (t) {}
      return e
    }),
    Modernizr.addTest('webanimations', 'animate' in o('div')),
    Modernizr.addTest('webgl', function () {
      var e = o('canvas'),
        t = 'probablySupportsContext' in e ? 'probablySupportsContext' : 'supportsContext'
      return t in e ? e[t]('webgl') || e[t]('experimental-webgl') : 'WebGLRenderingContext' in A
    }),
    Modernizr.addTest('canvasblending', function () {
      if (Modernizr.canvas === !1) return !1
      var A = o('canvas').getContext('2d')
      try {
        A.globalCompositeOperation = 'screen'
      } catch (e) {}
      return 'screen' === A.globalCompositeOperation
    }),
    Modernizr.addTest('audioloop', 'loop' in o('audio'))
  var b = o('canvas')
  Modernizr.addTest('todataurljpeg', function () {
    return !!Modernizr.canvas && 0 === b.toDataURL('image/jpeg').indexOf('data:image/jpeg')
  }),
    Modernizr.addTest('todataurlpng', function () {
      return !!Modernizr.canvas && 0 === b.toDataURL('image/png').indexOf('data:image/png')
    }),
    Modernizr.addTest('todataurlwebp', function () {
      var A = !1
      try {
        A = !!Modernizr.canvas && 0 === b.toDataURL('image/webp').indexOf('data:image/webp')
      } catch (e) {}
      return A
    }),
    Modernizr.addTest('canvaswinding', function () {
      if (Modernizr.canvas === !1) return !1
      var A = o('canvas').getContext('2d')
      return A.rect(0, 0, 10, 10), A.rect(2, 2, 6, 6), A.isPointInPath(5, 5, 'evenodd') === !1
    }),
    Modernizr.addTest('bgpositionshorthand', function () {
      var A = o('a'),
        e = A.style,
        t = 'right 10px bottom 10px'
      return (e.cssText = 'background-position: ' + t + ';'), e.backgroundPosition === t
    }),
    Modernizr.addTest('multiplebgs', function () {
      var A = o('a').style
      return (
        (A.cssText = 'background:url(https://),url(https://),red url(https://)'), /(url\s*\(.*?){3}/.test(A.background)
      )
    }),
    Modernizr.addTest('cssremunit', function () {
      var A = o('a').style
      try {
        A.fontSize = '3rem'
      } catch (e) {}
      return /rem/.test(A.fontSize)
    }),
    Modernizr.addTest('rgba', function () {
      var A = o('a').style
      return (A.cssText = 'background-color:rgba(150,255,150,.5)'), ('' + A.backgroundColor).indexOf('rgba') > -1
    }),
    Modernizr.addTest('fileinput', function () {
      if (
        navigator.userAgent.match(
          /(Android (1.0|1.1|1.5|1.6|2.0|2.1))|(Windows Phone (OS 7|8.0))|(XBLWP)|(ZuneWP)|(w(eb)?OSBrowser)|(webOS)|(Kindle\/(1.0|2.0|2.5|3.0))/
        )
      )
        return !1
      var A = o('input')
      return (A.type = 'file'), !A.disabled
    }),
    Modernizr.addTest('placeholder', 'placeholder' in o('input') && 'placeholder' in o('textarea')),
    Modernizr.addTest('imgcrossorigin', 'crossOrigin' in o('img')),
    Modernizr.addTest('inlinesvg', function () {
      var A = o('div')
      return (
        (A.innerHTML = '<svg/>'),
        'http://www.w3.org/2000/svg' == ('undefined' != typeof SVGRect && A.firstChild && A.firstChild.namespaceURI)
      )
    }),
    Modernizr.addTest('textareamaxlength', !!('maxLength' in o('textarea')))
  var V = o('input'),
    q = 'autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '),
    S = {}
  Modernizr.input = (function (e) {
    for (var t = 0, n = e.length; n > t; t++) S[e[t]] = !!(e[t] in V)
    return S.list && (S.list = !(!o('datalist') || !A.HTMLDataListElement)), S
  })(q)
  var M = 'search tel url email datetime date month week time datetime-local number range color'.split(' '),
    x = {}
  Modernizr.inputtypes = (function (A) {
    for (var n, a, i, o = A.length, r = '1)', d = 0; o > d; d++)
      V.setAttribute('type', (n = A[d])),
        (i = 'text' !== V.type && 'style' in V),
        i &&
          ((V.value = r),
          (V.style.cssText = 'position:absolute;visibility:hidden;'),
          /^range$/.test(n) && V.style.WebkitAppearance !== t
            ? (I.appendChild(V),
              (a = e.defaultView),
              (i =
                a.getComputedStyle &&
                'textfield' !== a.getComputedStyle(V, null).WebkitAppearance &&
                0 !== V.offsetHeight),
              I.removeChild(V))
            : /^(search|tel)$/.test(n) ||
              (i = /^(url|email)$/.test(n) ? V.checkValidity && V.checkValidity() === !1 : V.value != r)),
        (x[A[d]] = !!i)
    return x
  })(M)
  var T = (function () {
    function A (A, e) {
      var a
      return A
        ? ((e && 'string' != typeof e) || (e = o(e || 'div')),
          (A = 'on' + A),
          (a = A in e),
          !a &&
            n &&
            (e.setAttribute || (e = o('div')),
            e.setAttribute(A, ''),
            (a = 'function' == typeof e[A]),
            e[A] !== t && (e[A] = t),
            e.removeAttribute(A)),
          a)
        : !1
    }
    var n = !('onblur' in e.documentElement)
    return A
  })()
  ;(B.hasEvent = T), Modernizr.addTest('inputsearchevent', T('search'))
  var R = B._config.usePrefixes ? ' -webkit- -moz- -o- -ms- '.split(' ') : ['', '']
  ;(B._prefixes = R),
    Modernizr.addTest('cubicbezierrange', function () {
      var A = o('a')
      return (A.style.cssText = R.join('transition-timing-function:cubic-bezier(1,0,0,1.1); ')), !!A.style.length
    }),
    Modernizr.addTest('opacity', function () {
      var A = o('a').style
      return (A.cssText = R.join('opacity:.55;')), /^0.55$/.test(A.opacity)
    })
  var k
  !(function () {
    var A = {}.hasOwnProperty
    k =
      n(A, 'undefined') || n(A.call, 'undefined')
        ? function (A, e) {
            return e in A && n(A.constructor.prototype[e], 'undefined')
          }
        : function (e, t) {
            return A.call(e, t)
          }
  })(),
    (B._l = {}),
    (B.on = function (A, e) {
      this._l[A] || (this._l[A] = []),
        this._l[A].push(e),
        Modernizr.hasOwnProperty(A) &&
          setTimeout(function () {
            Modernizr._trigger(A, Modernizr[A])
          }, 0)
    }),
    (B._trigger = function (A, e) {
      if (this._l[A]) {
        var t = this._l[A]
        setTimeout(function () {
          var A, n
          for (A = 0; A < t.length; A++) (n = t[A])(e)
        }, 0),
          delete this._l[A]
      }
    }),
    Modernizr._q.push(function () {
      B.addTest = d
    }),
    Modernizr.addAsyncTest(function () {
      var t,
        n,
        a = function (A) {
          I.contains(A) || I.appendChild(A)
        },
        i = function (A) {
          A.fake && A.parentNode && A.parentNode.removeChild(A)
        },
        w = function (A, e) {
          var t = !!A
          if (
            (t && ((t = new Boolean(t)), (t.blocked = 'blocked' === A)),
            d('flash', function () {
              return t
            }),
            e && P.contains(e))
          ) {
            for (; e.parentNode !== P; ) e = e.parentNode
            P.removeChild(e)
          }
        }
      try {
        n = 'ActiveXObject' in A && 'Pan' in new A.ActiveXObject('ShockwaveFlash.ShockwaveFlash')
      } catch (s) {}
      if (((t = !(('plugins' in navigator && 'Shockwave Flash' in navigator.plugins) || n)), t || y)) w(!1)
      else {
        var l,
          D,
          u = o('embed'),
          P = r()
        if (((u.type = 'application/x-shockwave-flash'), P.appendChild(u), !('Pan' in u || n)))
          return a(P), w('blocked', u), void i(P)
        ;(l = function () {
          return (
            a(P),
            I.contains(P)
              ? (I.contains(u) ? ((D = u.style.cssText), '' !== D ? w('blocked', u) : w(!0, u)) : w('blocked'),
                void i(P))
              : ((P = e.body || P),
                (u = o('embed')),
                (u.type = 'application/x-shockwave-flash'),
                P.appendChild(u),
                setTimeout(l, 1e3))
          )
        }),
          setTimeout(l, 10)
      }
    }),
    d('htmlimports', 'import' in o('link')),
    Modernizr.addAsyncTest(function () {
      function A (n) {
        clearTimeout(e)
        var i = n !== t && 'loadeddata' === n.type ? !0 : !1
        a.removeEventListener('loadeddata', A, !1), d('audiopreload', i), a.parentNode.removeChild(a)
      }
      var e,
        n = 300,
        a = o('audio'),
        i = a.style
      if (!(Modernizr.audio && 'preload' in a)) return void d('audiopreload', !1)
      ;(i.position = 'absolute'), (i.height = 0), (i.width = 0)
      try {
        if (Modernizr.audio.mp3)
          a.src =
            'data:audio/mpeg;base64,//MUxAAB6AXgAAAAAPP+c6nf//yi/6f3//MUxAMAAAIAAAjEcH//0fTX6C9Lf//0//MUxA4BeAIAAAAAAKX2/6zv//+IlR4f//MUxBMCMAH8AAAAABYWalVMQU1FMy45//MUxBUB0AH0AAAAADkuM1VVVVVVVVVV//MUxBgBUATowAAAAFVVVVVVVVVVVVVV'
        else if (Modernizr.audio.m4a)
          a.src =
            'data:audio/x-m4a;base64,AAAAGGZ0eXBNNEEgAAACAGlzb21pc28yAAAACGZyZWUAAAAfbWRhdN4EAABsaWJmYWFjIDEuMjgAAAFoAQBHAAACiG1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAYAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAG0dHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAYAAAAAAAAAAAAAAAAAQAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAABUG1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAArEQAAAQAVcQAAAAAAC1oZGxyAAAAAAAAAABzb3VuAAAAAAAAAAAAAAAAU291bmRIYW5kbGVyAAAAAPttaW5mAAAAEHNtaGQAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAL9zdGJsAAAAW3N0c2QAAAAAAAAAAQAAAEttcDRhAAAAAAAAAAEAAAAAAAAAAAACABAAAAAArEQAAAAAACdlc2RzAAAAAAMZAAEABBFAFQAAAAABftAAAAAABQISCAYBAgAAABhzdHRzAAAAAAAAAAEAAAABAAAEAAAAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAUc3RzegAAAAAAAAAXAAAAAQAAABRzdGNvAAAAAAAAAAEAAAAoAAAAYHVkdGEAAABYbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAraWxzdAAAACOpdG9vAAAAG2RhdGEAAAABAAAAAExhdmY1Mi42NC4y'
        else if (Modernizr.audio.ogg)
          a.src =
            'data:audio/ogg;base64,T2dnUwACAAAAAAAAAAD/QwAAAAAAAM2LVKsBHgF2b3JiaXMAAAAAAUSsAAAAAAAAgLsAAAAAAAC4AU9nZ1MAAAAAAAAAAAAA/0MAAAEAAADmvOe6Dy3/////////////////MgN2b3JiaXMdAAAAWGlwaC5PcmcgbGliVm9yYmlzIEkgMjAwNzA2MjIAAAAAAQV2b3JiaXMfQkNWAQAAAQAYY1QpRplS0kqJGXOUMUaZYpJKiaWEFkJInXMUU6k515xrrLm1IIQQGlNQKQWZUo5SaRljkCkFmVIQS0kldBI6J51jEFtJwdaYa4tBthyEDZpSTCnElFKKQggZU4wpxZRSSkIHJXQOOuYcU45KKEG4nHOrtZaWY4updJJK5yRkTEJIKYWSSgelU05CSDWW1lIpHXNSUmpB6CCEEEK2IIQNgtCQVQAAAQDAQBAasgoAUAAAEIqhGIoChIasAgAyAAAEoCiO4iiOIzmSY0kWEBqyCgAAAgAQAADAcBRJkRTJsSRL0ixL00RRVX3VNlVV9nVd13Vd13UgNGQVAAABAEBIp5mlGiDCDGQYCA1ZBQAgAAAARijCEANCQ1YBAAABAABiKDmIJrTmfHOOg2Y5aCrF5nRwItXmSW4q5uacc845J5tzxjjnnHOKcmYxaCa05pxzEoNmKWgmtOacc57E5kFrqrTmnHPGOaeDcUYY55xzmrTmQWo21uaccxa0pjlqLsXmnHMi5eZJbS7V5pxzzjnnnHPOOeecc6oXp3NwTjjnnHOi9uZabkIX55xzPhmne3NCOOecc84555xzzjnnnHOC0JBVAAAQAABBGDaGcacgSJ+jgRhFiGnIpAfdo8MkaAxyCqlHo6ORUuoglFTGSSmdIDRkFQAACAAAIYQUUkghhRRSSCGFFFKIIYYYYsgpp5yCCiqppKKKMsoss8wyyyyzzDLrsLPOOuwwxBBDDK20EktNtdVYY62555xrDtJaaa211koppZRSSikIDVkFAIAAABAIGWSQQUYhhRRSiCGmnHLKKaigAkJDVgEAgAAAAgAAADzJc0RHdERHdERHdERHdETHczxHlERJlERJtEzL1ExPFVXVlV1b1mXd9m1hF3bd93Xf93Xj14VhWZZlWZZlWZZlWZZlWZZlWYLQkFUAAAgAAIAQQgghhRRSSCGlGGPMMeegk1BCIDRkFQAACAAgAAAAwFEcxXEkR3IkyZIsSZM0S7M8zdM8TfREURRN01RFV3RF3bRF2ZRN13RN2XRVWbVdWbZt2dZtX5Zt3/d93/d93/d93/d93/d1HQgNWQUASAAA6EiOpEiKpEiO4ziSJAGhIasAABkAAAEAKIqjOI7jSJIkSZakSZ7lWaJmaqZneqqoAqEhqwAAQAAAAQAAAAAAKJriKabiKaLiOaIjSqJlWqKmaq4om7Lruq7ruq7ruq7ruq7ruq7ruq7ruq7ruq7ruq7ruq7ruq7rui4QGrIKAJAAANCRHMmRHEmRFEmRHMkBQkNWAQAyAAACAHAMx5AUybEsS9M8zdM8TfRET/RMTxVd0QVCQ1YBAIAAAAIAAAAAADAkw1IsR3M0SZRUS7VUTbVUSxVVT1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTVN0zRNIDRkJQAABADAYo3B5SAhJSXl3hDCEJOeMSYhtV4hBJGS3jEGFYOeMqIMct5C4xCDHggNWREARAEAAMYgxxBzyDlHqZMSOeeodJQa5xyljlJnKcWYYs0oldhSrI1zjlJHraOUYiwtdpRSjanGAgAAAhwAAAIshEJDVgQAUQAAhDFIKaQUYow5p5xDjCnnmHOGMeYcc44556B0UirnnHROSsQYc445p5xzUjonlXNOSiehAACAAAcAgAALodCQFQFAnACAQZI8T/I0UZQ0TxRFU3RdUTRd1/I81fRMU1U90VRVU1Vt2VRVWZY8zzQ901RVzzRV1VRVWTZVVZZFVdVt03V123RV3ZZt2/ddWxZ2UVVt3VRd2zdV1/Zd2fZ9WdZ1Y/I8VfVM03U903Rl1XVtW3VdXfdMU5ZN15Vl03Vt25VlXXdl2fc103Rd01Vl2XRd2XZlV7ddWfZ903WF35VlX1dlWRh2XfeFW9eV5XRd3VdlVzdWWfZ9W9eF4dZ1YZk8T1U903RdzzRdV3VdX1dd19Y105Rl03Vt2VRdWXZl2fddV9Z1zzRl2XRd2zZdV5ZdWfZ9V5Z13XRdX1dlWfhVV/Z1WdeV4dZt4Tdd1/dVWfaFV5Z14dZ1Ybl1XRg+VfV9U3aF4XRl39eF31luXTiW0XV9YZVt4VhlWTl+4ViW3feVZXRdX1ht2RhWWRaGX/id5fZ943h1XRlu3efMuu8Mx++k+8rT1W1jmX3dWWZfd47hGDq/8OOpqq+brisMpywLv+3rxrP7vrKMruv7qiwLvyrbwrHrvvP8vrAso+z6wmrLwrDatjHcvm4sv3Acy2vryjHrvlG2dXxfeArD83R1XXlmXcf2dXTjRzh+ygAAgAEHAIAAE8pAoSErAoA4AQCPJImiZFmiKFmWKIqm6LqiaLqupGmmqWmeaVqaZ5qmaaqyKZquLGmaaVqeZpqap5mmaJqua5qmrIqmKcumasqyaZqy7LqybbuubNuiacqyaZqybJqmLLuyq9uu7Oq6pFmmqXmeaWqeZ5qmasqyaZquq3meanqeaKqeKKqqaqqqraqqLFueZ5qa6KmmJ4qqaqqmrZqqKsumqtqyaaq2bKqqbbuq7Pqybeu6aaqybaqmLZuqatuu7OqyLNu6L2maaWqeZ5qa55mmaZqybJqqK1uep5qeKKqq5ommaqqqLJumqsqW55mqJ4qq6omea5qqKsumatqqaZq2bKqqLZumKsuubfu+68qybqqqbJuqauumasqybMu+78qq7oqmKcumqtqyaaqyLduy78uyrPuiacqyaaqybaqqLsuybRuzbPu6aJqybaqmLZuqKtuyLfu6LNu678qub6uqrOuyLfu67vqucOu6MLyybPuqrPq6K9u6b+sy2/Z9RNOUZVM1bdtUVVl2Zdn2Zdv2fdE0bVtVVVs2TdW2ZVn2fVm2bWE0Tdk2VVXWTdW0bVmWbWG2ZeF2Zdm3ZVv2ddeVdV/XfePXZd3murLty7Kt+6qr+rbu+8Jw667wCgAAGHAAAAgwoQwUGrISAIgCAACMYYwxCI1SzjkHoVHKOecgZM5BCCGVzDkIIZSSOQehlJQy5yCUklIIoZSUWgshlJRSawUAABQ4AAAE2KApsThAoSErAYBUAACD41iW55miatqyY0meJ4qqqaq27UiW54miaaqqbVueJ4qmqaqu6+ua54miaaqq6+q6aJqmqaqu67q6Lpqiqaqq67qyrpumqqquK7uy7Oumqqqq68quLPvCqrquK8uybevCsKqu68qybNu2b9y6ruu+7/vCka3rui78wjEMRwEA4AkOAEAFNqyOcFI0FlhoyEoAIAMAgDAGIYMQQgYhhJBSSiGllBIAADDgAAAQYEIZKDRkRQAQJwAAGEMppJRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkgppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkqppJRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoplVJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSCgCQinAAkHowoQwUGrISAEgFAACMUUopxpyDEDHmGGPQSSgpYsw5xhyUklLlHIQQUmktt8o5CCGk1FJtmXNSWosx5hgz56SkFFvNOYdSUoux5ppr7qS0VmuuNedaWqs115xzzbm0FmuuOdecc8sx15xzzjnnGHPOOeecc84FAOA0OACAHtiwOsJJ0VhgoSErAYBUAAACGaUYc8456BBSjDnnHIQQIoUYc845CCFUjDnnHHQQQqgYc8w5CCGEkDnnHIQQQgghcw466CCEEEIHHYQQQgihlM5BCCGEEEooIYQQQgghhBA6CCGEEEIIIYQQQgghhFJKCCGEEEIJoZRQAABggQMAQIANqyOcFI0FFhqyEgAAAgCAHJagUs6EQY5Bjw1BylEzDUJMOdGZYk5qMxVTkDkQnXQSGWpB2V4yCwAAgCAAIMAEEBggKPhCCIgxAABBiMwQCYVVsMCgDBoc5gHAA0SERACQmKBIu7iALgNc0MVdB0IIQhCCWBxAAQk4OOGGJ97whBucoFNU6iAAAAAAAAwA4AEA4KAAIiKaq7C4wMjQ2ODo8AgAAAAAABYA+AAAOD6AiIjmKiwuMDI0Njg6PAIAAAAAAAAAAICAgAAAAAAAQAAAAICAT2dnUwAE7AwAAAAAAAD/QwAAAgAAADuydfsFAQEBAQEACg4ODg=='
        else {
          if (!Modernizr.audio.wav) return void d('audiopreload', !1)
          a.src =
            'data:audio/wav;base64,UklGRvwZAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YdgZAAAAAAEA/v8CAP//AAABAP////8DAPz/BAD9/wEAAAAAAAAAAAABAP7/AgD//wAAAQD//wAAAQD//wAAAQD+/wIA//8AAAAAAAD//wIA/v8BAAAA//8BAAAA//8BAP//AQAAAP//AQD//wEAAAD//wEA//8BAP//AQD//wEA//8BAP//AQD+/wMA/f8DAP3/AgD+/wIA/////wMA/f8CAP7/AgD+/wMA/f8CAP7/AgD//wAAAAAAAAAAAQD+/wIA/v8CAP7/AwD9/wIA/v8BAAEA/v8CAP7/AQAAAAAAAAD//wEAAAD//wIA/f8DAP7/AQD//wEAAAD//wEA//8CAP7/AQD//wIA/v8CAP7/AQAAAAAAAAD//wEAAAAAAAAA//8BAP//AgD9/wQA+/8FAPz/AgAAAP//AgD+/wEAAAD//wIA/v8CAP3/BAD8/wQA/P8DAP7/AwD8/wQA/P8DAP7/AQAAAAAA//8BAP//AgD+/wEAAAD//wIA/v8BAP//AQD//wEAAAD//wEA//8BAAAAAAAAAP//AgD+/wEAAAAAAAAAAAD//wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AgD+/wIA/v8BAP//AQABAP7/AQD//wIA/v8CAP3/AwD/////AgD9/wMA/v8BAP//AQAAAP//AQD//wEA//8BAP//AAABAP//AAABAP//AQD//wAAAAACAP3/AwD9/wIA//8BAP//AQD//wEA//8BAP//AgD9/wMA/v8AAAIA/f8CAAAA/v8EAPv/BAD9/wIAAAD+/wQA+v8HAPr/BAD+/wEAAAD//wIA/f8EAPz/BAD7/wUA/P8EAPz/AwD+/wEAAAD//wEAAAAAAP//AgD8/wUA+/8FAPz/AwD9/wIA//8AAAEA/v8CAP//AQD//wAAAAABAP//AgD9/wMA/f8EAPz/AwD+/wAAAwD7/wUA/P8DAP7/AQAAAP//AgD+/wEAAQD+/wIA/v8BAAEA/v8CAP7/AQAAAP//AgD9/wMA/f8DAP7/AgD+/wEAAAAAAAEA//8AAAEA/v8DAP3/AgD//wEA//8BAP7/AwD9/wMA/v8BAP//AQAAAP//AgD9/wMA/v8BAP//AQAAAP//AgD+/wEAAQD+/wIA/////wIA//8AAAEA/f8DAP//AAABAP////8DAP3/AwD+/wEA//8BAP//AQAAAAAA//8BAP//AQD//wEA//8BAP//AAAAAAEA//8BAP7/AgD//wEA//8AAAAAAAAAAAAAAAD//wIA/v8BAAAA//8BAAEA/v8BAAAA//8DAPz/AwD+/wIA/v8CAP3/AwD+/wEAAAD//wEA//8BAAAA//8BAAAA/v8EAPv/BAD+/wAAAAABAP7/AgD//wAAAAABAP7/AgD//wAAAAAAAAAAAAABAP3/BAD8/wQA/f8BAAAAAAABAP7/AgD+/wIA/v8CAP7/AgD+/wIA/v8BAAAAAAD//wIA/f8DAP7/AAABAP//AAACAPz/BAD9/wIA//8AAP//AwD9/wMA/P8EAP3/AwD9/wIA//8BAP//AQD+/wMA/f8DAP7/AAABAP//AQAAAP//AQD//wIA/f8DAP7/AQAAAP//AQAAAAAA//8CAP7/AQABAP7/AgD+/wEAAQD+/wIA/v8CAP////8CAP7/AgD//wAAAAABAP7/AwD9/wIAAAD+/wMA/f8CAP//AQD+/wMA/f8CAP//AAACAPz/BQD6/wUA/v///wIA/v8CAP3/BAD7/wYA+v8FAPz/AwD/////AgD+/wEAAAD//wEAAAD//wIA/f8DAP7/AQAAAP//AgD//wAA//8BAAAAAAAAAP//AQD//wEA//8AAAIA/f8DAP3/AgAAAP//AQD//wEA//8AAAEA//8BAP////8CAP//AAABAP3/BAD9/wIA/v8BAAEA//8BAP7/AgD//wEA//8AAAEA//8BAP//AAAAAAEA//8BAP7/AgD//wEA//8AAAAAAQD+/wIA/v8BAAAAAAD//wIA/v8BAAAAAAAAAAAAAQD+/wMA/f8CAP//AQD//wIA/f8DAP7/AQD//wEA//8CAP7/AAABAP7/AwD9/wMA/v8AAAEA//8BAAAAAAD//wIA/v8BAAAA//8CAP7/AgD+/wEA//8CAP7/AgD//wAAAAAAAAAAAQD//wEA/v8DAPz/BQD8/wIA//8AAAEAAAD//wEA//8BAP//AQAAAAAA//8BAP//AgD+/wEAAAAAAP//AQD+/wMA/////wEA/v8CAP//AQD//wEA//8AAAEA//8BAAAA/v8EAPz/AwD+/wEAAAAAAAAA//8CAP7/AQD//wEA//8BAP//AAABAP7/AwD9/wIA//8BAP//AQD//wEA//8AAAEA/v8EAPv/BAD9/wIA//8BAP7/AwD9/wIA//8AAAEA//8BAP//AQD//wAAAQD//wEAAAD+/wMA/v8AAAIA/f8DAP7/AQD//wAAAQD+/wMA/f8CAP//AAABAP7/AgD+/wMA/f8CAP7/AQABAP7/AgD+/wIA/v8CAP7/AwD8/wMA//8AAAEA//8AAAAAAAABAP//AQD//wAAAQD//wIA/f8DAP3/AwD+/wAAAgD9/wIA//8AAAEAAAD+/wMA/P8FAPv/BAD9/wIA//8AAP//AgD+/wIA/v8BAAAAAAD//wEAAAAAAP//AQD//wEA//8BAP//AAABAP7/AwD9/wIA//8BAP//AAABAP//AQD//wAAAQD//wEA//8BAP//AAABAAAA//8BAP7/AwD9/wMA/f8DAP3/AgD//wEA//8BAP7/AgD//wAAAgD8/wQA/f8CAP//AQD+/wMA/f8CAP7/AgD//wAAAAAAAAAAAAABAP7/AwD9/wIA/v8DAP3/AwD9/wIA/v8DAPz/BQD7/wQA/f8CAP7/AwD9/wMA/f8CAP//AQAAAP7/AwD+/wEA//8AAAEAAAAAAP//AAABAP//AQAAAP7/AwD9/wMA/f8CAP//AQD//wEA//8AAAIA/f8CAAAA//8BAAAA//8BAAAA/v8EAPv/BAD9/wIA//8AAAEA/v8CAP//AAABAP//AAABAP//AAABAP7/AwD8/wQA/f8CAAAA/v8DAP3/AwD9/wMA/v8BAAAA//8BAAAA//8CAP7/AQAAAAAAAAAAAAAA//8CAP7/AgD+/wIA/v8CAP7/AgD//wAAAQD//wAAAQD//wAAAQD//wAAAQD+/wIA//8AAAAAAQD+/wMA/f8CAP//AQD//wEA//8AAAEA/v8DAP3/AgD//wAAAAABAP7/AwD9/wIA//8AAAEA/v8DAP3/AgD//wAAAAABAP7/AwD8/wMA/v8CAP//AAD//wIA/v8CAP7/AQABAP7/AQAAAP//AgD/////AQD//wEAAAD//wEA/v8EAPv/BAD9/wMA/v8BAAAA//8BAAEA/P8GAPr/BQD8/wMA/v8BAAAA//8CAP7/AQABAP3/BAD7/wYA+/8EAPz/AwD//wEA//8BAP7/BAD8/wMA/v8AAAIA/v8BAAAA//8BAAAA//8BAAAA//8CAP3/AwD+/wAAAgD8/wUA/P8DAP7/AAABAAAAAAD//wEAAAD//wIA/f8DAP7/AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEA/f8EAPz/AwD/////AgD+/wIA/f8DAP7/AgD+/wEA//8CAP7/AQD//wEAAAAAAP//AQAAAP//AgD9/wMA/v8BAAAA//8BAP//AQAAAP//AAACAP3/BAD7/wQA/v8BAAAA//8BAP//AQAAAP//AQAAAP7/BAD7/wUA+/8EAP3/AgD//wAAAQD+/wIA//8AAAEA/v8CAP//AQD+/wEAAAAAAAAAAAD//wEA//8CAP3/AwD9/wIA//8AAAAAAAAAAAAA//8BAP//AgD+/wEA//8CAP7/AQAAAP//AgD/////AgD/////AgD+/wIA//8AAP//AQABAP7/AgD9/wMA/v8CAP////8BAAAAAAAAAAAA//8CAP////8DAPz/AwD+/wEAAAAAAP//AQD//wEAAAD//wEAAAD+/wQA+/8FAPz/AgAAAP//AgD9/wMA/v8BAAAAAAD//wEAAAD//wIA/v8BAAAAAAD//wIA/v8BAAAA//8BAAAA//8CAP7/AQD//wEA//8BAAAA//8BAP//AAABAP//AQAAAP7/AgD//wEA//8AAAAAAQD+/wMA/P8EAP7///8DAPz/BQD8/wEAAQD+/wMA/v8AAAEA//8BAP//AQD//wEA/v8CAP//AQD//wAAAAABAAAA//8BAP//AQAAAAAA//8BAP//AgD+/wAAAQD//wIA/f8CAP//AQAAAP7/AwD9/wMA/v8BAP//AAABAP//AgD9/wIA//8BAAAA//8BAAAA//8CAP3/AwD+/wEAAAD+/wQA/P8DAP7/AAACAP7/AQAAAP//AQAAAP//AQAAAP//AgD9/wIAAAD//wIA/f8DAP7/AQD//wEA//8CAP7/AQD//wAAAQD//wEA//8AAAAAAQD//wEAAAD9/wUA+/8FAPz/AgD//wAAAQD//wAAAQD+/wMA/f8BAAEA/v8CAP7/AgD+/wIA/v8BAAAAAAAAAAAAAAD//wIA/v8CAP////8CAP7/AgD+/wIA/v8CAP7/AQAAAP//AQAAAP//AQD//wAAAQD//wAAAQD+/wMA/f8CAAAA/v8DAP3/AgAAAP//AQAAAP7/AwD9/wMA/v8BAP//AQD//wEAAAD+/wMA/f8CAAAA/v8CAP//AAAAAAEA//8AAAEA/v8DAP3/AwD9/wIA//8BAP//AgD8/wQA/v8BAAAA/v8CAP//AQD//wAAAAAAAAEA/f8EAPz/BAD9/wIA//8AAAAAAAABAP//AAAAAAAAAAABAP3/BAD9/wIA/v8BAAEA//8AAAAA//8CAP7/AgD9/wQA+/8FAPv/BQD8/wMA/f8DAP3/AwD+/wAAAgD9/wMA/f8CAAAA/v8EAPv/BQD7/wUA/P8DAP///v8DAP3/BAD8/wMA/f8DAP7/AQD//wEAAAD//wEA/v8CAAAA/v8CAP7/AgD//wAAAAAAAAAAAQD+/wIA//8AAAEA/v8DAPz/BAD9/wIA//8AAP//AgD//wEA/v8BAAAAAQD//wAAAAAAAAEA//8AAAEA//8BAP//AAABAP//AQD+/wIA/v8DAPz/BAD8/wQA/f8BAAAAAQD+/wMA/P8DAP//AAAAAAAAAAD//wMA+/8FAP3/AQABAP3/BAD8/wMA/v8BAAAA//8CAP3/AwD+/wEAAQD9/wMA/f8EAPz/BAD7/wQA/v8BAAEA/f8DAP7/AQAAAP//AgD+/wEAAAD//wIA/v8CAP7/AgD+/wEAAQD//wEA/v8CAP7/BAD7/wQA/f8CAAAA//8AAAAAAAABAP//AQD+/wEAAQD+/wMA/f8BAAEA/v8DAPz/AwD/////AwD8/wQA/P8DAP7/AgD//wAA//8BAAAAAAAAAP//AgD+/wEAAAD//wIA/v8BAAAA//8CAP3/AgD//wAAAQD+/wIA/v8BAAAA//8CAP7/AgD+/wEA//8CAP3/BAD7/wQA/v8BAAAA//8AAAEAAAD//wIA/f8DAP7/AgD+/wIA/v8CAP7/AgD+/wEAAAAAAP//AgD9/wMA/v8BAP//AgD9/wMA/v8AAAEA//8BAP//AQD//wEA//8AAAEA/v8EAPz/AgD//wAAAQAAAP//AAABAP//AQD//wEAAAD//wEA//8BAAEA/f8DAP7/AQABAP3/AwD+/wIA/////wEAAAAAAAAAAAD//wIA/v8CAP////8CAP7/AgD//wAA//8CAP3/BAD9/wAAAgD9/wMA/v8BAP//AQAAAP//AQAAAP//AgD9/wMA/f8EAPz/AwD+/wEAAAAAAAAAAAD//wIA/f8EAP3/AAABAAAA//8CAP7/AQAAAP//AQAAAAAA//8BAP//AQAAAP//AQAAAP//AQAAAP//AgD9/wMA/v8BAP//AQAAAP//AQD//wIA/v8CAP3/BAD9/wEAAAD//wEAAQD9/wMA/f8CAAAA/v8DAP3/AgD//wAAAQD+/wIA/v8CAP7/AQAAAP//AgD+/wEAAAAAAP//AwD7/wUA/f8BAAEA/v8BAAEA/v8DAP3/AgD//wEA//8BAP//AQD//wEA//8CAP3/BAD7/wQA/////wIA/v8AAAIA/v8CAP3/BAD7/wUA/P8DAP3/AwD9/wMA/v8AAAIA/v8CAP7/AgD+/wIA//8AAAEA/v8CAP7/AgD//wAAAAD//wEAAAAAAAAA//8BAP7/BAD7/wUA/P8CAAAA//8BAP//AQAAAP//AgD9/wMA/v8BAAAA//8BAAAA//8CAP3/AwD+/wEA//8CAP3/AwD+/wAAAwD8/wIAAAD//wIA/////wIA/v8CAP7/AgD+/wEAAAAAAAAAAAAAAP//AgD+/wIA//8AAAAA//8CAP7/AgD+/wEA//8CAP3/AwD9/wMA/v8BAP7/AwD9/wMA/f8CAP//AQD+/wIA//8BAP//AQD+/wMA/v8BAAAA//8BAAAA//8CAP7/AQAAAP//AgD+/wIA/v8CAP//AAAAAAEA//8BAP//AAABAAAA//8BAP//AQD//wEA//8BAP//AQAAAP//AQD//wEAAAD//wIA/f8CAAAA//8BAAAA//8BAP//AAABAP//AQD//wAAAAAAAAEA/v8CAP//AQD//wAAAAABAP7/AwD9/wIAAAD+/wIA//8BAP//AgD9/wMA/f8DAP7/AgD+/wEAAAAAAAEA/v8CAP7/AgD//wAAAAAAAAAAAAAAAP//AgD/////AgD9/wQA/f8BAAAAAAAAAAEA/f8DAP////8DAP3/AQABAP7/AgD//wAAAQD+/wMA/f8CAP7/AQABAP7/AwD7/wYA+v8FAP3/AQABAP7/AgD+/wMA/f8CAP7/AwD+/wEA//8BAP//AQAAAP7/BQD5/wcA+v8FAPz/AwD+/wIA/v8BAAAA//8DAPv/BQD8/wMA/////wEAAAAAAAAAAAD//wIA/f8DAP7/AQAAAP//AQAAAP//AgD+/wIA/v8BAAEA/f8EAPz/AwD+/wEA//8CAP7/AQD//wEA//8CAP7/AQAAAP//AgD+/wEAAAAAAAAAAAAAAAAAAAD//wIA/f8EAPz/AwD+/wEA//8CAP7/AgD+/wEAAQD+/wEAAQD+/wIA/////wIA//8AAAAAAAAAAAAAAAD//wEAAAAAAP//AgD9/wMA/v8BAP//AQAAAP//AQD//wEA//8BAP//AQD//wEA//8BAP//AQAAAP7/AwD9/wMA/v8BAP7/AwD9/wMA/v8BAP//AAABAP//AQD//wAAAAABAP//AAAAAAAAAQD//wEA/v8CAAAA/v8EAPv/BAD9/wIAAAD+/wMA/P8DAP//AAAAAP//AQD//wIA/f8DAP3/AwD9/wMA/v8BAAAA//8BAAAA//8CAP3/AwD9/wQA+/8FAPv/BQD8/wMA/v8BAAAA//8BAP//AgD+/wEAAAD//wIA/v8BAAEA/f8DAP3/AgAAAP//AQD//wAAAQD//wEA//8BAP//AQD//wEA/v8DAP3/AgAAAP7/AwD9/wIAAAD//wEAAAD//wIA/f8DAP7/AgD9/wQA+/8FAPz/AgAAAP//AgD9/wIA//8BAP//AQD//wEA//8BAP//AQD//wIA/f8DAP3/AgD//wAAAQD+/wIA/v8BAAEA/v8CAP7/AgD+/wMA/P8DAP//AAABAP7/AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEA/v8CAP3/BAD8/wMA/v8BAAAAAAD//wEAAAAAAAAAAAD//wEAAAAAAAAA//8BAP//AgD+/wEA//8CAP3/AwD9/wMA/f8EAPv/BAD+/wAAAQD//wEA//8BAP//AAABAP//AQD//wEAAAD//wEA//8BAP//AgD9/wMA/v8AAAIA/f8DAP7/AAACAP3/AwD+/wEA//8BAP//AQAAAP//AQAAAP7/AwD9/wMA/v8AAAEA//8BAP//AAAAAAEA//8AAAEA/v8CAP//AAAAAAEA/v8DAPz/BAD9/wEAAQD+/wEAAQD9/wQA/P8DAP7/AQAAAAAAAAAAAAAAAAAAAAAAAQD+/wIA/////wIA/v8BAAAA//8BAP//AQD//wEA//8BAAAA/v8EAPz/AwD///7/BAD8/wMA/////wIA/v8CAP////8CAP7/AgD+/wIA/v8CAP////8CAP7/AwD9/wIA/v8CAP//AAABAP7/AwD9/wEAAQD+/wMA/f8CAP//AAAAAAEA/v8DAPz/BAD9/wIA/v8CAP7/AgD//wAAAAD//wIA/v8CAP7/AQAAAAAA//8CAP7/AgD+/wIA/v8CAP7/AwD8/wUA+v8GAPv/AwD//wAAAAAAAAAA//8DAPv/BQD9/wAAAgD9/wMA/v8BAP//AQAAAP//AgD9/wMA/v8BAAAA//8BAAAAAAAAAP//AQAAAAAAAAD//wEA//8CAP3/AwD+/wAAAgD+/wEAAAD//wIA/v8CAP7/AgD/////AwD8/wUA/P8CAP//AQD//wIA/f8DAP3/AwD+/wAAAQD+/wMA/f8DAP3/AgD//wAAAQD//wEA//8BAP7/AwD+/wEA//8AAAEA//8CAPz/BAD9/wIA//8AAAEA/v8DAPz/BAD9/wIA//8AAAEA/v8CAP7/AgD//wEA/f8EAPz/BAD+////AgD//wAAAQD//wAAAQD//wEA//8BAP7/AwD+/wEA'
        }
      } catch (r) {
        return void d('audiopreload', !1)
      }
      a.setAttribute('preload', 'auto'),
        (a.style.cssText = 'display:none'),
        I.appendChild(a),
        setTimeout(function () {
          a.addEventListener('loadeddata', A, !1), (e = setTimeout(A, n))
        }, 0)
    })
  var U = (B.testStyles = s)
  Modernizr.addTest('unicoderange', function () {
    return Modernizr.testStyles(
      '@font-face{font-family:"unicodeRange";src:local("Arial");unicode-range:U+0020,U+002E}#modernizr span{font-size:20px;display:inline-block;font-family:"unicodeRange",monospace}#modernizr .mono{font-family:monospace}',
      function (A) {
        for (var e = ['.', '.', 'm', 'm'], t = 0; t < e.length; t++) {
          var n = o('span')
          ;(n.innerHTML = e[t]), (n.className = t % 2 ? 'mono' : ''), A.appendChild(n), (e[t] = n.clientWidth)
        }
        return e[0] !== e[1] && e[2] === e[3]
      }
    )
  }),
    Modernizr.addTest('unicode', function () {
      var A,
        e = o('span'),
        t = o('span')
      return (
        U('#modernizr{font-family:Arial,sans;font-size:300em;}', function (n) {
          ;(e.innerHTML = y ? '妇' : '&#5987;'),
            (t.innerHTML = y ? '☆' : '&#9734;'),
            n.appendChild(e),
            n.appendChild(t),
            (A = 'offsetWidth' in e && e.offsetWidth !== t.offsetWidth)
        }),
        A
      )
    }),
    Modernizr.addTest('checked', function () {
      return U(
        '#modernizr {position:absolute} #modernizr input {margin-left:10px} #modernizr :checked {margin-left:20px;display:block}',
        function (A) {
          var e = o('input')
          return (
            e.setAttribute('type', 'checkbox'),
            e.setAttribute('checked', 'checked'),
            A.appendChild(e),
            20 === e.offsetLeft
          )
        }
      )
    }),
    U('#modernizr{font:0/0 a}#modernizr:after{content:":)";visibility:hidden;font:7px/1 a}', function (A) {
      Modernizr.addTest('generatedcontent', A.offsetHeight >= 7)
    }),
    U(
      '#modernizr div {width:100px} #modernizr :last-child{width:200px;display:block}',
      function (A) {
        Modernizr.addTest('lastchild', A.lastChild.offsetWidth > A.firstChild.offsetWidth)
      },
      2
    ),
    Modernizr.addTest('cssvalid', function () {
      return U(
        '#modernizr input{height:0;border:0;padding:0;margin:0;width:10px} #modernizr input:valid{width:50px}',
        function (A) {
          var e = o('input')
          return A.appendChild(e), e.clientWidth > 10
        }
      )
    }),
    U('#modernizr { height: 50vh; }', function (e) {
      var t = parseInt(A.innerHeight / 2, 10),
        n = parseInt((A.getComputedStyle ? getComputedStyle(e, null) : e.currentStyle).height, 10)
      Modernizr.addTest('cssvhunit', n == t)
    }),
    U(
      '#modernizr div {width:1px} #modernizr div:nth-child(2n) {width:2px;}',
      function (A) {
        for (var e = A.getElementsByTagName('div'), t = !0, n = 0; 5 > n; n++) t = t && e[n].offsetWidth === (n % 2) + 1
        Modernizr.addTest('nthchild', t)
      },
      5
    ),
    U('#modernizr { width: 50vw; }', function (e) {
      var t = parseInt(A.innerWidth / 2, 10),
        n = parseInt((A.getComputedStyle ? getComputedStyle(e, null) : e.currentStyle).width, 10)
      Modernizr.addTest('cssvwunit', n == t)
    }),
    U(
      '#modernizr{overflow: scroll; width: 40px; height: 40px; }#' +
        R.join('scrollbar{width:0px} #modernizr::')
          .split('#')
          .slice(1)
          .join('#') +
        'scrollbar{width:0px}',
      function (A) {
        Modernizr.addTest('cssscrollbar', 40 == A.scrollWidth)
      }
    ),
    Modernizr.addTest('formvalidation', function () {
      var e = o('form')
      if (!('checkValidity' in e && 'addEventListener' in e)) return !1
      if ('reportValidity' in e) return !0
      var t,
        n = !1
      return (
        (Modernizr.formvalidationapi = !0),
        e.addEventListener(
          'submit',
          function (e) {
            ;(!A.opera || A.operamini) && e.preventDefault(), e.stopPropagation()
          },
          !1
        ),
        (e.innerHTML = '<input name="modTest" required="required" /><button></button>'),
        U('#modernizr form{position:absolute;top:-99999em}', function (A) {
          A.appendChild(e),
            (t = e.getElementsByTagName('input')[0]),
            t.addEventListener(
              'invalid',
              function (A) {
                ;(n = !0), A.preventDefault(), A.stopPropagation()
              },
              !1
            ),
            (Modernizr.formvalidationmessage = !!t.validationMessage),
            e.getElementsByTagName('button')[0].click()
        }),
        n
      )
    })
  var W = (function () {
    var e = A.matchMedia || A.msMatchMedia
    return e
      ? function (A) {
          var t = e(A)
          return (t && t.matches) || !1
        }
      : function (e) {
          var t = !1
          return (
            s('@media ' + e + ' { #modernizr { position: absolute; } }', function (e) {
              t = 'absolute' == (A.getComputedStyle ? A.getComputedStyle(e, null) : e.currentStyle).position
            }),
            t
          )
        }
  })()
  ;(B.mq = W), Modernizr.addTest('mediaqueries', W('only all'))
  var z = 'Moz O ms Webkit',
    Z = B._config.usePrefixes ? z.split(' ') : []
  B._cssomPrefixes = Z
  var K = function (e) {
    var n,
      a = R.length,
      i = A.CSSRule
    if ('undefined' == typeof i) return t
    if (!e) return !1
    if (((e = e.replace(/^@/, '')), (n = e.replace(/-/g, '_').toUpperCase() + '_RULE'), n in i)) return '@' + e
    for (var o = 0; a > o; o++) {
      var r = R[o],
        d = r.toUpperCase() + '_' + n
      if (d in i) return '@-' + r.toLowerCase() + '-' + e
    }
    return !1
  }
  B.atRule = K
  var F = B._config.usePrefixes ? z.toLowerCase().split(' ') : []
  B._domPrefixes = F
  var J = { elem: o('modernizr') }
  Modernizr._q.push(function () {
    delete J.elem
  })
  var O = { style: J.elem.style }
  Modernizr._q.unshift(function () {
    delete O.style
  }),
    (B.testAllProps = p)
  var G = (B.prefixed = function (A, e, t) {
    return 0 === A.indexOf('@') ? K(A) : (-1 != A.indexOf('-') && (A = w(A)), e ? p(A, e, t) : p(A, 'pfx'))
  })
  Modernizr.addTest('requestanimationframe', !!G('requestAnimationFrame', A), { aliases: ['raf'] }),
    Modernizr.addTest('backgroundblendmode', G('backgroundBlendMode', 'text')),
    (B.testAllProps = g),
    Modernizr.addTest('cssanimations', g('animationName', 'a', !0)),
    Modernizr.addTest('backgroundcliptext', function () {
      return g('backgroundClip', 'text')
    }),
    Modernizr.addTest('bgpositionxy', function () {
      return g('backgroundPositionX', '3px', !0) && g('backgroundPositionY', '5px', !0)
    }),
    Modernizr.addTest('bgrepeatround', g('backgroundRepeat', 'round')),
    Modernizr.addTest('bgrepeatspace', g('backgroundRepeat', 'space')),
    Modernizr.addTest('backgroundsize', g('backgroundSize', '100%', !0)),
    Modernizr.addTest('bgsizecover', g('backgroundSize', 'cover')),
    Modernizr.addTest('borderradius', g('borderRadius', '0px', !0)),
    (function () {
      Modernizr.addTest('csscolumns', function () {
        var A = !1,
          e = g('columnCount')
        try {
          ;(A = !!e) && (A = new Boolean(A))
        } catch (t) {}
        return A
      })
      for (
        var A,
          e,
          t = [
            'Width',
            'Span',
            'Fill',
            'Gap',
            'Rule',
            'RuleColor',
            'RuleStyle',
            'RuleWidth',
            'BreakBefore',
            'BreakAfter',
            'BreakInside'
          ],
          n = 0;
        n < t.length;
        n++
      )
        (A = t[n].toLowerCase()),
          (e = g('column' + t[n])),
          ('breakbefore' === A || 'breakafter' === A || 'breakinside' == A) && (e = e || g(t[n])),
          Modernizr.addTest('csscolumns.' + A, e)
    })(),
    Modernizr.addTest('ellipsis', g('textOverflow', 'ellipsis')),
    Modernizr.addTest('cssfilters', function () {
      if (Modernizr.supports) return g('filter', 'blur(2px)')
      var A = o('a')
      return (
        (A.style.cssText = R.join('filter:blur(2px); ')),
        !!A.style.length && (e.documentMode === t || e.documentMode > 9)
      )
    }),
    Modernizr.addTest('boxshadow', g('boxShadow', '1px 1px', !0)),
    Modernizr.addTest('boxsizing', g('boxSizing', 'border-box', !0) && (e.documentMode === t || e.documentMode > 7)),
    Modernizr.addTest('flexbox', g('flexBasis', '1px', !0)),
    Modernizr.addTest('flexboxlegacy', g('boxDirection', 'reverse', !0)),
    Modernizr.addTest('flexboxtweener', g('flexAlign', 'end', !0)),
    Modernizr.addTest('flexwrap', g('flexWrap', 'wrap', !0)),
    Modernizr.addTest('cssmask', g('maskRepeat', 'repeat-x', !0)),
    Modernizr.addTest('csstransforms', function () {
      return -1 === navigator.userAgent.indexOf('Android 2.') && g('transform', 'scale(1)', !0)
    }),
    Modernizr.addTest('csstransitions', g('transition', 'all', !0)),
    Modernizr.addTest('overflowscrolling', g('overflowScrolling', 'touch', !0)),
    a(),
    i(v),
    delete B.addTest,
    delete B.addAsyncTest
  for (var Y = 0; Y < Modernizr._q.length; Y++) Modernizr._q[Y]()
  A.Modernizr = Modernizr
})(window, document)
