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

const express = require('express')
const router = express.Router()
const controllers = require('../controllers')
const path = require('path')
const winston = require('../logger')
const packagejson = require('../../package.json')
const { trudeskRoot } = require('../config')

function mainRoutes (router, middleware, controllers) {
  router.get('/healthz', function (req, res) {
    return res.status(200).send('OK')
  })
  router.get('/version', function (req, res) {
    return res.json({ version: packagejson.version })
  })
  router.get('/install', function (req, res) {
    return res.redirect('/')
  })

  router.post('/resetpassword', controllers.main.forgotPass)
  router.get('/resetpassword/:hash', controllers.main.resetPass)
  router.post('/verifymfa', controllers.main.verifymfa)
  router.post('/forgotl2auth', controllers.main.forgotL2Auth)
  router.get('/resetl2auth/:hash', controllers.main.resetl2auth)
  //

  // API
  // v1
  // require('../controllers/api/v1/routes')(middleware, router, controllers)
  // v2
  require('../controllers/api/v2/routes')(middleware, router, controllers)

  if (global.env === 'development') {
    router.get('/debug/populatedb', controllers.debug.populatedatabase)
    router.get('/debug/sendmail', controllers.debug.sendmail)
    router.get('/debug/mailcheck/refetch', function (req, res) {
      var mailCheck = require('../mailer/mailCheck')
      mailCheck.refetch()
      res.send('OK')
    })

    router.get('/debug/cache/refresh', function (req, res) {
      var _ = require('lodash')

      var forkProcess = _.find(global.forks, { name: 'cache' })
      forkProcess.fork.send({ name: 'cache:refresh' })

      res.send('OK')
    })

    router.get('/debug/restart', function (req, res) {
      var pm2 = require('pm2')
      pm2.connect(function (err) {
        if (err) {
          winston.error(err)
          res.status(400).send(err)
          return
        }
        pm2.restart('trudesk', function (err) {
          if (err) {
            res.status(400).send(err)
            return winston.error(err)
          }

          pm2.disconnect()
          res.send('OK')
        })
      })
    })
  }

  router.get('*', (req, res) => {
    res.sendFile(path.resolve(trudeskRoot(), 'dist/index.html'))
  })

  // router.get('/agent(/*)?', function (req, res) {
  //   res.sendFile(path.resolve(__dirname, '../../dist/index.html'))
  // })

  // router.get('*', function (req, res) {
  //   res.sendFile(path.resolve(__dirname, '../customerClient/build/index.html'))
  // })
}

module.exports = function (app, middleware) {
  mainRoutes(router, middleware, controllers)
  app.use('/', router)

  // Load Plugin routes
  const dive = require('dive')
  const fs = require('fs')
  const pluginDir = path.join(__dirname, '../../plugins')
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir)
  dive(pluginDir, { directories: true, files: false, recursive: false }, function (err, dir) {
    if (err) throw err
    const pluginRoutes = require(path.join(dir, '/routes'))
    if (pluginRoutes) {
      pluginRoutes(router, middleware)
    } else {
      winston.warn('Unable to load plugin: ' + pluginDir)
    }
  })

  app.use(handle404)
  app.use(handleErrors)
}

function handleErrors (err, req, res) {
  const status = err.status || 500
  res.status(err.status)

  if (status === 429) {
    res.render('429', { layout: false })
    return
  }

  if (status === 500) {
    res.render('500', { layout: false })
    return
  }

  if (status === 503) {
    res.render('503', { layout: false })
    return
  }

  winston.warn(err.stack)

  res.render('error', {
    message: err.message,
    error: err,
    layout: false
  })
}

function handle404 (req, res) {
  return res.status(404).render('404', { layout: false })
}
