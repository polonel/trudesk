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
 *  Updated:    7/23/22 4:4f AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import express from "express";
import path from "path";
import logger from './logger'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore // 404: @types/express-hbs
import hbs from 'express-hbs'
import hbsHelpers from "./helpers/hbs/helpers";
import bodyParser from "body-parser";
import serveFavicon from 'serve-favicon'
import pkg from "../package.json";
import * as controllers from "./controllers";
import { ExpressApp, HTTPServer, Port } from "./webserver";
import routeMiddleware from './middleware/middleware'
import buildSass from './sass/buildsass'

export const installServer = function (callback: (err?: Error) => void) {
  const router = express.Router()

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
  ExpressApp.use('/assets', express.static(path.resolve(__dirname, '../public/uploads/assets')))

  ExpressApp.use(express.static(path.join(__dirname, '../public')))
  ExpressApp.use(serveFavicon(path.join(__dirname, '../public/img/favicon.ico')))
  ExpressApp.use(bodyParser.urlencoded({ extended: false }))
  ExpressApp.use(bodyParser.json())

  router.get('/healthz', (_req, res) => {
    res.status(200).send('OK')
  })
  router.get('/version', (_req, res) => {
    return res.json({ version: pkg.version })
  })

  router.get('/install', controllers.install.index)
  router.post('/install', routeMiddleware.checkOrigin, controllers.install.install)
  router.post('/install/elastictest', routeMiddleware.checkOrigin, controllers.install.elastictest)
  router.post('/install/mongotest', routeMiddleware.checkOrigin, controllers.install.mongotest)
  router.post('/install/existingdb', routeMiddleware.checkOrigin, controllers.install.existingdb)
  router.post('/install/restart', routeMiddleware.checkOrigin, controllers.install.restart)

  ExpressApp.use('/', router)

  ExpressApp.use((_req, res) => {
    return res.redirect('/install')
  })

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