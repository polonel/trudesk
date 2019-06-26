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

var express = require('express')
var router = express.Router()
var controllers = require('../controllers')
var path = require('path')
var winston = require('winston')
var packagejson = require('../../package.json')

function mainRoutes (router, middleware, controllers) {
  router.get('/', middleware.redirectToDashboardIfLoggedIn, controllers.main.index)
  router.get('/healthz', function (req, res) {
    return res.status(200).send('OK')
  })
  router.get('/version', function (req, res) {
    return res.json({ version: packagejson.version })
  })
  router.get('/install', function (req, res) {
    return res.redirect('/')
  })
  router.get(
    '/dashboard',
    middleware.redirectToLogin,
    middleware.redirectIfUser,
    middleware.loadCommonData,
    controllers.main.dashboard
  )

  router.get('/login', function (req, res) {
    return res.redirect('/')
  })

  router.post('/login', controllers.main.loginPost)
  router.get('/l2auth', controllers.main.l2authget)
  router.post('/l2auth', controllers.main.l2AuthPost)
  router.get('/logout', controllers.main.logout)
  router.post('/forgotpass', controllers.main.forgotPass)
  router.get('/resetpassword/:hash', controllers.main.resetPass)
  router.post('/forgotl2auth', controllers.main.forgotL2Auth)
  router.get('/resetl2auth/:hash', controllers.main.resetl2auth)

  router.get('/about', middleware.redirectToLogin, middleware.loadCommonData, controllers.main.about)

  router.get('/captcha', function (req, res) {
    var svgCaptcha = require('svg-captcha')
    var captcha = svgCaptcha.create()
    req.session.captcha = captcha.text
    res.set('Content-Type', 'image/svg+xml')
    res.send(captcha.data)
  })

  // Public
  router.get('/newissue', controllers.tickets.pubNewIssue)
  router.get('/register', controllers.accounts.signup)
  router.get('/signup', controllers.accounts.signup)

  router.get('/logoimage', function (req, res) {
    var s = require('../models/setting')
    var _ = require('lodash')
    s.getSettingByName('gen:customlogo', function (err, hasCustomLogo) {
      if (!err && hasCustomLogo && hasCustomLogo.value) {
        s.getSettingByName('gen:customlogofilename', function (err, logoFilename) {
          if (!err && logoFilename && !_.isUndefined(logoFilename)) {
            return res.send('/assets/topLogo.png')
          }

          return res.send('/img/defaultLogoLight.png')
        })
      } else {
        return res.send('/img/defaultLogoLight.png')
      }
    })
  })

  // Tickets
  router.get(
    '/tickets',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getActive,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/filter',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.filter,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/active',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getActive,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/active/page/:page',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getActive,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/new',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/new/page/:page',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/open',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/open/page/:page',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/pending',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/pending/page/:page',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/closed',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/closed/page/:page',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/assigned',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getAssigned,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/assigned/page/:page',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getAssigned,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/unassigned',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getUnassigned,
    controllers.tickets.processor
  )
  router.get(
    '/tickets/unassigned/page/:page',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getUnassigned,
    controllers.tickets.processor
  )
  router.get('/tickets/print/:uid', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.print)
  router.get('/tickets/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.tickets.single)
  // router.post('/tickets/postcomment', middleware.redirectToLogin, controllers.tickets.postcomment);
  router.post('/tickets/uploadattachment', middleware.redirectToLogin, controllers.tickets.uploadAttachment)
  router.post('/tickets/uploadmdeimage', middleware.redirectToLogin, controllers.tickets.uploadImageMDE)

  // Messages
  router.get('/messages', middleware.redirectToLogin, middleware.loadCommonData, controllers.messages.get)
  router.get(
    '/messages/startconversation',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    function (req, res, next) {
      req.showNewConvo = true
      next()
    },
    controllers.messages.get
  )
  router.get(
    '/messages/:convoid',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.messages.getConversation
  )

  // Accounts
  router.get('/profile', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.profile)
  router.get('/accounts', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.getCustomers)
  router.get(
    '/accounts/customers',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.accounts.getCustomers
  )
  router.get('/accounts/agents', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.getAgents)
  router.get('/accounts/admins', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.getAdmins)
  router.post('/accounts/uploadimage', middleware.redirectToLogin, controllers.accounts.uploadImage)
  router.get('/accounts/import', middleware.redirectToLogin, middleware.loadCommonData, controllers.accounts.importPage)
  router.post('/accounts/import/csv/upload', middleware.redirectToLogin, controllers.accounts.uploadCSV)
  router.post('/accounts/import/json/upload', middleware.redirectToLogin, controllers.accounts.uploadJSON)
  router.post('/accounts/import/ldap/bind', middleware.redirectToLogin, controllers.accounts.bindLdap)

  // Groups
  router.get('/groups', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.get)
  router.get('/groups/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.getCreate)
  router.get('/groups/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.groups.edit)

  // Teams
  router.get('/teams', middleware.redirectToLogin, middleware.loadCommonData, controllers.teams.get)

  // Departments
  router.get('/departments', middleware.redirectToLogin, middleware.loadCommonData, controllers.departments.get)

  // Reports
  router.get('/reports', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.overview)
  router.get('/reports/overview', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.overview)
  router.get('/reports/generate', middleware.redirectToLogin, middleware.loadCommonData, controllers.reports.generate)
  router.get(
    '/reports/breakdown/group',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.reports.breakdownGroup
  )
  router.get(
    '/reports/breakdown/user',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.reports.breakdownUser
  )

  // Notices
  router.get('/notices', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.get)
  router.get('/notices/create', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.create)
  router.get('/notices/:id', middleware.redirectToLogin, middleware.loadCommonData, controllers.notices.edit)

  router.get('/settings', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.general)
  router.get('/settings/general', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.general)
  router.get(
    '/settings/appearance',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.appearance
  )
  router.post('/settings/general/uploadlogo', middleware.redirectToLogin, controllers.main.uploadLogo)
  router.post('/settings/general/uploadpagelogo', middleware.redirectToLogin, controllers.main.uploadPageLogo)
  router.post('/settings/general/uploadfavicon', middleware.redirectToLogin, controllers.main.uploadFavicon)
  router.get(
    '/settings/permissions',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.permissionsSettings
  )
  router.get(
    '/settings/tickets',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.ticketSettings
  )
  router.get(
    '/settings/mailer',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.mailerSettings
  )
  router.get(
    '/settings/notifications',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.notificationsSettings
  )
  router.get(
    '/settings/elasticsearch',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.elasticsearchSettings
  )
  router.get('/settings/tps', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.tpsSettings)
  router.get(
    '/settings/backup',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.backupSettings
  )
  router.get('/settings/legal', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.legal)
  router.get('/settings/logs', middleware.redirectToLogin, middleware.loadCommonData, controllers.settings.logs)

  router.get(
    '/settings/editor/:template',
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.editor.page
  )

  // Plugins
  router.get('/plugins', middleware.redirectToLogin, middleware.loadCommonData, controllers.plugins.get)

  // API
  // v1
  require('../controllers/api/v1/routes')(middleware, router, controllers)
  // v2
  require('../controllers/api/v2/routes')(middleware, router, controllers)

  router.get('/api/v1/plugins/list/installed', middleware.api, function (req, res) {
    return res.json({ success: true, loadedPlugins: global.plugins })
  })
  router.get(
    '/api/v1/plugins/install/:packageid',
    middleware.api,
    middleware.isAdmin,
    controllers.api.v1.plugins.installPlugin
  )
  router.delete(
    '/api/v1/plugins/remove/:packageid',
    middleware.api,
    middleware.isAdmin,
    controllers.api.v1.plugins.removePlugin
  )

  router.get('/api/v1/admin/restart', middleware.api, middleware.isAdmin, function (req, res) {
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
        res.json({ success: true })
      })
    })
  })

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
}

module.exports = function (app, middleware) {
  mainRoutes(router, middleware, controllers)
  app.use('/', router)

  // Load Plugin routes
  var dive = require('dive')
  var fs = require('fs')
  var pluginDir = path.join(__dirname, '../../plugins')
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir)
  dive(pluginDir, { directories: true, files: false, recursive: false }, function (err, dir) {
    if (err) throw err
    var pluginRoutes = require(path.join(dir, '/routes'))
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
  var status = err.status || 500
  res.status(err.status)

  if (status === 404) {
    res.render('404', { layout: false })
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
