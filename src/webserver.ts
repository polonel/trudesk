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

import _ from 'lodash'
import _nconf from 'nconf'
import express from 'express'
import winston from './logger'
import middleware from './middleware'
import routes from './routes'
import http, { Server } from 'http'
import type { TrudeskDatabase } from "./database";

export interface WebServer {
  server: Server
  sessionStore?: any
}

const nconf = _nconf.argv().env()

export const ExpressApp = express()
export const HTTPServer = http.createServer(ExpressApp)
export let Port = nconf.get('port') || 8118

const webserver: WebServer = {
  server: HTTPServer
}

export const init = async (db: TrudeskDatabase, callback, port?: number) => {
  if (port) Port = port
  middleware(ExpressApp, db, function (middleware, store) {
    webserver.sessionStore = store
    routes(ExpressApp, middleware)

    // Load Events
    //emitterEvents()

    if (typeof callback === 'function') callback()
  })
}

export const webServerListen = (callback, port?: number) => {
  if (port) Port = port

  HTTPServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      winston.error('Address in use, exiting...')
      HTTPServer.close()
    } else {
      winston.error(err.message)
      throw err
    }
  })

  HTTPServer.listen(Port, '0.0.0.0', () => {
    winston.info('Trudesk is now listening on port: ' + Port)

    if (_.isFunction(callback)) return callback()
  })
}

export const installServer = function (callback) {
  const router = express.Router()
  const controllers = require('./controllers/index.js')
  const path = require('path')
  const hbs = require('express-hbs')
  const hbsHelpers = require('./helpers/hbs/helpers')
  const bodyParser = require('body-parser')
  const favicon = require('serve-favicon')
  const pkg = require('../package.json')
  const routeMiddleware = require('./middleware/middleware')(ExpressApp)

  ExpressApp.set('views', path.join(__dirname, './views/'))
  ExpressApp.engine(
    'hbs',
    hbs.express3({
      defaultLayout: path.join(__dirname, './views/layout/main.hbs'),
      partialsDir: [path.join(__dirname, './views/partials/')]
    })
  )
  ExpressApp.set('view engine', 'hbs')
  hbsHelpers.register(hbs.handlebars)

  ExpressApp.use('/assets', express.static(path.join(__dirname, '../public/uploads/assets')))

  ExpressApp.use(express.static(path.join(__dirname, '../public')))
  ExpressApp.use(favicon(path.join(__dirname, '../public/img/favicon.ico')))
  ExpressApp.use(bodyParser.urlencoded({ extended: false }))
  ExpressApp.use(bodyParser.json())

  router.get('/healthz', (req, res) => {
    res.status(200).send('OK')
  })
  router.get('/version', (req, res) => {
    return res.json({ version: pkg.version })
  })

  router.get('/install', controllers.install.index)
  router.post('/install', routeMiddleware.checkOrigin, controllers.install.install)
  router.post('/install/elastictest', routeMiddleware.checkOrigin, controllers.install.elastictest)
  router.post('/install/mongotest', routeMiddleware.checkOrigin, controllers.install.mongotest)
  router.post('/install/existingdb', routeMiddleware.checkOrigin, controllers.install.existingdb)
  router.post('/install/restart', routeMiddleware.checkOrigin, controllers.install.restart)

  ExpressApp.use('/', router)

  ExpressApp.use((req, res) => {
    return res.redirect('/install')
  })

  require('socket.io')(HTTPServer)

  require('./sass/buildsass').buildDefault(err => {
    if (err) {
      winston.error(err)
      return callback(err)
    }

    if (!HTTPServer.listening) {
      HTTPServer.listen(Port, '0.0.0.0', () => {
        return callback()
      })
    } else {
      return callback()
    }
  })
}

export default webserver