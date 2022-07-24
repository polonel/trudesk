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
import type { RouteMiddlewareType } from "./middleware/middleware";

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

export const init = async (db: TrudeskDatabase, callback: () => void, port?: number) => {
  if (port) Port = port
  middleware(ExpressApp, db, (routeMiddleware: RouteMiddlewareType, store: any) => {
    webserver.sessionStore = store
    routes(ExpressApp, routeMiddleware)

    // Load Events
    //emitterEvents()

    if (typeof callback === 'function') callback()
  })
}

export const webServerListen = (callback: () => void, port?: number) => {
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

export default webserver