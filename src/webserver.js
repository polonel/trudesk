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
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var nconf = require('nconf')
  .argv()
  .env()
var async = require('async')
var express = require('express')
var WebServer = express()
var winston = require('winston')
var middleware = require('./middleware')
var routes = require('./routes')
var server = require('http').createServer(WebServer)
var port = nconf.get('port') || 8118

;(function (app) {
  'use strict'

  // Load Events
  require('./emitter/events')

  module.exports.server = server
  module.exports.app = app
  module.exports.init = function (db, callback, p) {
    if (p !== undefined) port = p
    async.parallel(
      [
        function (done) {
          middleware(app, db, function (middleware, store) {
            module.exports.sessionStore = store
            routes(app, middleware)

            return done()
          })
        }
      ],
      function () {
        return callback()
      }
    )
  }

  module.exports.listen = function (callback, p) {
    if (!_.isUndefined(p)) port = p

    server.on('error', function (err) {
      if (err.code === 'EADDRINUSE') {
        winston.error('Address in use, exiting...')
        server.close()
      } else {
        winston.error(err.message)
        throw err
      }
    })

    server.listen(port, '0.0.0.0', function () {
      winston.info('TruDesk is now listening on port: ' + port)

      if (_.isFunction(callback)) return callback()
    })
  }

  module.exports.installServer = function (callback) {
    var router = express.Router()
    var controllers = require('./controllers/index.js')
    var path = require('path')
    var hbs = require('express-hbs')
    var hbsHelpers = require('./helpers/hbs/helpers')
    var bodyParser = require('body-parser')
    var favicon = require('serve-favicon')
    var pkg = require('../package.json')
    var routeMiddleware = require('./middleware/middleware')(app)

    app.set('views', path.join(__dirname, './views/'))
    app.engine(
      'hbs',
      hbs.express3({
        defaultLayout: path.join(__dirname, './views/layout/main.hbs'),
        partialsDir: [path.join(__dirname, './views/partials/')]
      })
    )
    app.set('view engine', 'hbs')
    hbsHelpers.register(hbs.handlebars)

    app.use('/assets', express.static(path.join(__dirname, '../public/uploads/assets')))

    app.use(express.static(path.join(__dirname, '../public')))
    app.use(favicon(path.join(__dirname, '../public/img/favicon.ico')))
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())

    router.get('/healthz', function (req, res) {
      res.status(200).send('OK')
    })
    router.get('/version', function (req, res) {
      return res.json({ version: pkg.version })
    })

    router.get('/install', controllers.install.index)
    router.post('/install', routeMiddleware.checkOrigin, controllers.install.install)
    router.post('/install/elastictest', routeMiddleware.checkOrigin, controllers.install.elastictest)
    router.post('/install/mongotest', routeMiddleware.checkOrigin, controllers.install.mongotest)
    router.post('/install/existingdb', routeMiddleware.checkOrigin, controllers.install.existingdb)
    router.post('/install/restart', routeMiddleware.checkOrigin, controllers.install.restart)

    app.use('/', router)

    app.use(function (req, res) {
      return res.redirect('/install')
    })

    require('socket.io')(server)

    require('./sass/buildsass').buildDefault(function (err) {
      if (err) {
        winston.error(err)
        return callback(err)
      }

      if (!server.listening) {
        server.listen(port, '0.0.0.0', function () {
          return callback()
        })
      } else {
        return callback()
      }
    })
  }
})(WebServer)
