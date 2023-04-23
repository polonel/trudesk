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
 *  Updated:    7/23/22 4:42 AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import bodyParser from "body-parser";
import express from "express";
import expressStaticGzip from "express-static-gzip"
import path from "path";
import serveFavicon from 'serve-favicon'
import pkg from "../package.json";
import config, { trudeskRoot } from "./config"
import * as controllers from "./controllers";
import logger from './logger'
import routeMiddleware from './middleware/middleware'
import buildSass from './sass/buildsass'
import { ExpressApp, HTTPServer, Port } from "./webserver";

export const installServer = function (callback: (err?: Error) => void) {
  const router = express.Router()
  ExpressApp.use('/assets', express.static(path.resolve(__dirname, '../public/uploads/assets')))

  if (global.env === 'production') {
    ExpressApp.use(
      expressStaticGzip(path.resolve(config.trudeskRoot(), 'dist/public'), {
        index: false
      })
    )
  } else ExpressApp.use(express.static(path.resolve(config.trudeskRoot(), 'dist/public')))

  ExpressApp.use(serveFavicon(path.join(__dirname, '../public/img/favicon.ico')))
  ExpressApp.use(bodyParser.urlencoded({ extended: false }))
  ExpressApp.use(bodyParser.json())

  router.get('/', (_req, res) => {
    return res.redirect('/install')
  })

  router.get('/healthz', (_req, res) => {
    res.status(200).send('OK')
  })
  router.get('/version', (_req, res) => {
    return res.json({ version: pkg.version })
  })

  router.get('/install', (_req, res) => {
    res.sendFile(path.resolve(trudeskRoot(), 'dist/index-install.html'))
  })

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  router.post('/install', routeMiddleware.checkOrigin, controllers.install.install)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  router.post('/install/elastictest', routeMiddleware.checkOrigin, controllers.install.elastictest)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  router.post('/install/mongotest', routeMiddleware.checkOrigin, controllers.install.mongotest)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  router.post('/install/existingdb', routeMiddleware.checkOrigin, controllers.install.existingdb)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  router.post('/install/restart', routeMiddleware.checkOrigin, controllers.install.restart)

  router.get('*', (_req, res) => {
    return res.redirect('/install')
  })

  ExpressApp.use('/', router)


  buildSass.buildDefault((err: Error) => {
    if (err) {
      logger.error(err)
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