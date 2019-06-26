/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define('pages/pageloader', ['async', 'jquery'], function (async, $) {
  var pageLoader = {}
  pageLoader.init = function (callback) {
    // Called to render component on ajax page load
    window.react.renderer(window.react.redux.store)
    window.react.redux.store.dispatch({
      type: 'NAV_CHANGE',
      payload: {
        activeItem: $('#__sidebar_route').text(),
        activeSubItem: $('#__sidebar_sub_route').text(),
        sessionUser: window.trudeskSessionService.getUser()
      }
    })

    if (!window.react.redux.store.getState().shared.sessionUser)
      window.react.redux.store.dispatch({
        type: 'SET_SESSION_USER',
        payload: {
          sessionUser: window.trudeskSessionService.getUser()
        }
      })

    require([
      'pages/dashboard',
      'pages/messages',
      'pages/accountsImport',
      'pages/groups',
      'pages/profile',
      'pages/reports',
      'pages/reportsBreakdown',
      'pages/notices',
      'pages/createNotice',
      'pages/plugins',
      'pages/logs',

      'modules/ajaximgupload',
      'modules/attachmentUpload'
    ], function (a, b, c, d, e, f, g, h, i, j, k, l, m) {
      async.parallel(
        [
          function (done) {
            a.init(done)
          },
          function (done) {
            b.init(done)
          },
          function (done) {
            c.init(done)
          },
          function (done) {
            d.init(done)
          },
          function (done) {
            e.init(done)
          },
          function (done) {
            f.init(done)
          },
          function (done) {
            g.init(done)
          },
          function (done) {
            h.init(done)
          },
          function (done) {
            i.init(done)
          },
          function (done) {
            j.init(done)
          },
          function (done) {
            k.init(done)
          },
          function (done) {
            l.init()
            m.init()

            return done()
          }
        ],
        function () {
          if (typeof callback === 'function') {
            return callback()
          }
        }
      )
    })
  }

  return pageLoader
})
