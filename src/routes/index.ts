/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 **/

import express, { Application, ErrorRequestHandler, Request, RequestHandler, Response, Router } from 'express'
import path from 'path'
import fs from 'fs'
import winston from '../logger'
import packagejson from '../../package.json'
import { trudeskRoot } from '../config'
import { RouteMiddlewareType } from '../middleware/middleware'

 
const controllers = require('../controllers')

const router: Router = express.Router()

function mainRoutes (router: Router, middleware: RouteMiddlewareType, controllers: any): void {
  router.get('/healthz', (_req: Request, res: Response) => res.status(200).send('OK'))
  router.get('/version', (_req: Request, res: Response) => res.json({ version: packagejson.version }))
  router.get('/install', (_req: Request, res: Response) => res.redirect('/'))
  router.post('/login', controllers.main.loginPost)
  router.get('/logout', controllers.main.logout)

  router.post('/resetpassword', controllers.main.forgotPass)
  router.get('/resetpassword/:hash', controllers.main.resetPass)
  router.post('/verifymfa', controllers.main.verifymfa)
  router.post('/forgotl2auth', controllers.main.forgotL2Auth)
  router.get('/resetl2auth/:hash', controllers.main.resetl2auth)

  // API
  // v1
  // require('../controllers/api/v1/routes')(middleware, router, controllers)
  // v2
   
  require('../controllers/api/v2/routes')(middleware, router, controllers)

  if (global.env === 'development') {
    router.get('/debug/populatedb', controllers.debug.populatedatabase)
    router.get('/debug/sendmail', controllers.debug.sendmail)

    router.get('/debug/mailcheck/refetch', (_req: Request, res: Response) => {
       
      const mailCheck = require('../mailer/mailCheck')
      mailCheck.refetch()
      res.send('OK')
    })

    router.get('/debug/cache/refresh', (_req: Request, res: Response) => {
       
      const _ = require('lodash')
      const forkProcess = _.find(global.forks, { name: 'cache' })
      forkProcess.fork.send({ name: 'cache:refresh' })
      res.send('OK')
    })

    router.get('/debug/restart', (_req: Request, res: Response) => {
       
      const pm2 = require('pm2')
      pm2.connect(function (err: Error) {
        if (err) {
          winston.error(err)
          return res.status(400).send(err)
        }
        pm2.restart('trudesk', function (err: Error) {
          if (err) {
            res.status(400).send(err)
            return winston.error(err)
          }
          pm2.disconnect()
          res.send('OK')
          return undefined
        })
        return undefined
      })
    })
  }

  router.get('*path', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(trudeskRoot(), 'dist/index.html'))
  })
}

const handle404: RequestHandler = (_req, res) => {
  return res.status(404).render('404', { layout: false })
}

const handleErrors: ErrorRequestHandler = (err, _req, res, _next) => {
  const status: number = err.status || 500
  res.status(status)

  if (status === 429) return res.render('429', { layout: false })
  if (status === 500) return res.render('500', { layout: false })
  if (status === 503) return res.render('503', { layout: false })

  winston.warn(err.stack)
  return res.render('error', { message: err.message, error: err, layout: false })
}

export default function (app: Application, middleware: RouteMiddlewareType): void {
  mainRoutes(router, middleware, controllers)
  app.use('/', router)

  // Load Plugin routes
   
  const dive = require('dive')
  const pluginDir = path.join(trudeskRoot(), 'plugins')
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir)

  dive(
    pluginDir,
    { directories: true, files: false, recursive: false },
    function (err: Error, dir: string) {
      if (err) throw err
       
      const pluginRoutes = require(path.join(dir, '/routes'))
      if (pluginRoutes) {
        pluginRoutes(router, middleware)
      } else {
        winston.warn('Unable to load plugin: ' + dir)
      }
    }
  )

  app.use(handle404)
  app.use(handleErrors)
}
