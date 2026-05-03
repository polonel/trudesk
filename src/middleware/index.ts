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

import path from 'path'
import fs from 'fs'
import express, { Application, NextFunction, Request, RequestHandler, Response } from 'express'
import expressStaticGzip from 'express-static-gzip'
import mongoose from 'mongoose'
import flash from 'connect-flash'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import winston from '../logger'
import config from '../config'
import { TrudeskDatabase } from '../database'
import middleware, { RouteMiddlewareType } from './middleware'
import passportSetup from '../passport'
import settingsUtil from '../settings/settingsUtil'
import csrf from '../dependencies/csrf-td'

const passportConfig = passportSetup()

function allowCrossDomain (req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,accesstoken,X-RToken,X-Token'
  )
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none';")

  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
}

export default function (
  app: Application,
  db: TrudeskDatabase,
  callback: (mw: RouteMiddlewareType, store: MongoStore) => void
): void {
  app.disable('x-powered-by')

  app.use(bodyParser.urlencoded({ limit: '2mb', extended: false }))
  app.use(bodyParser.json({ limit: '2mb' }))
  app.use(cookieParser())

  if (global.env === 'production') {
    app.use(
      expressStaticGzip(path.resolve(config.trudeskRoot(), 'dist/public'), {
        enableBrotli: true,
        orderPreference: ['br', 'gz'],
        serveStatic: {
          maxAge: 31536000,
          cacheControl: true
        },
        index: false
      })
    )
  } else {
    app.use(express.static(path.resolve(config.trudeskRoot(), 'dist/public')))
  }

  app.use((_req: Request, res: Response, next: NextFunction) => {
    if (mongoose.connection.readyState !== 1) {
      return res.render('503', { layout: false })
    }
    return next()
  })

  const sessionSecret = config.get('tokens:secret') ?? 'trudesk$1234#SessionKeY!2288'

  const sessionStore = MongoStore.create({
    client: db.connection!.getClient()
  })

  app.use(
    session({
      secret: sessionSecret,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
      },
      store: sessionStore,
      saveUninitialized: false,
      resave: false
    })
  )

  app.use(passportConfig.initialize())
  app.use(passportConfig.session())
  app.use(flash())
  app.use(allowCrossDomain)

  csrf.init()
  app.use(csrf.generateToken)

  app.use((_req: Request, res: Response, next: NextFunction) => {
    settingsUtil.getSettings(function (err, setting) {
      if (err) return winston.warn(err.message)
      const maintenanceMode = setting?.settings?.maintenanceMode
      const user = (_req as Request & { user?: { role: { isAdmin: boolean } } }).user
      if (user && maintenanceMode?.value === true && !user.role.isAdmin) {
        return res.render('maintenance', { layout: false })
      }
      return next()
    })
  })

  // Walk up from __dirname to find project root (works for both ts-node src/ and compiled dist/src/)
  const _findMobileDist = () => {
    for (const levels of [2, 3, 4]) {
      const parts = Array.from({ length: levels }, () => '..')
      const candidate = path.resolve(__dirname, ...parts, 'mobile-pwa', 'dist')
      if (fs.existsSync(candidate)) return candidate
    }
    return path.resolve(__dirname, '..', '..', '..', 'mobile-pwa', 'dist')
  }
  const mobileDist = _findMobileDist()
  if (global.env === 'production') {
    app.use('/mobile', expressStaticGzip(mobileDist, {
      enableBrotli: true,
      orderPreference: ['br', 'gz'],
      serveStatic: { maxAge: 31536000, cacheControl: true },
      index: false
    }))
  } else {
    app.use('/mobile', express.static(mobileDist))
  }
  app.use('/mobile', (_req: Request, res: Response) => {
    res.sendFile(path.join(mobileDist, 'index.html'))
  })
  app.use('/favicon.ico', express.static(path.resolve(config.trudeskRoot(), 'public/img/favicon.ico')))
  app.use('/assets', express.static(path.resolve(config.trudeskRoot(), 'public/uploads/assets')))
  app.use('/uploads/users', express.static(path.resolve(config.trudeskRoot(), 'public/uploads/users')))
  app.use('/uploads', middleware.hasAuth as unknown as RequestHandler, express.static(path.resolve(config.trudeskRoot(), 'public/uploads')))
  app.use(
    '/backups',
    middleware.hasAuth as unknown as RequestHandler,
    middleware.isAdmin as unknown as RequestHandler,
    express.static(path.resolve(config.trudeskRoot(), 'backups'))
  )
  app.use('/sounds', express.static(path.resolve(config.trudeskRoot(), 'public/sounds')))

  callback(middleware, sessionStore)
}
