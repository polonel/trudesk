import express from 'express'
import http, { Server } from 'http'
import path from 'path'
import _ from 'lodash'
import _nconf from 'nconf'
 
const hbs = require('express-hbs')
import type { TrudeskDatabase } from './database'
import winston from './logger'
import middleware from './middleware'
import type { RouteMiddlewareType } from './middleware/middleware'
import routes from './routes'
import { trudeskRoot } from './config'

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

function configureViewEngine(): void {
  const viewsDir = path.resolve(trudeskRoot(), 'src/views')
  const partialsDir = path.resolve(viewsDir, 'partials')
  const layoutsDir = path.resolve(viewsDir, 'layout')

  ExpressApp.engine(
    'hbs',
    hbs.express4({
      partialsDir,
      layoutsDir,
      defaultLayout: path.join(layoutsDir, 'main.hbs')
    })
  )
  ExpressApp.set('view engine', 'hbs')
  ExpressApp.set('views', viewsDir)
}

export const init = async (db: TrudeskDatabase, callback: () => void, port?: number) => {
  if (port) Port = port

  configureViewEngine()

  middleware(ExpressApp, db, (routeMiddleware: RouteMiddlewareType, store: any) => {
    webserver.sessionStore = store
    routes(ExpressApp, routeMiddleware)

    require('./emitter/events')

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
    winston.info('Trudesk test server listening on port: ' + Port)

    if (_.isFunction(callback)) return callback()
  })
}

export default webserver
