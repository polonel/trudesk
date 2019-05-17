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

var path = require('path')
var async = require('async')
var express = require('express')
var mongoose = require('mongoose')
var HandleBars = require('handlebars').create()
var hbs = require('express-hbs')
var hbsHelpers = require('../helpers/hbs/helpers')
var winston = require('winston')
var flash = require('connect-flash')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var MongoStore = require('connect-mongo')(session)
var passportConfig = require('../passport')()

var middleware = {}

module.exports = function (app, db, callback) {
  middleware = require('./middleware')(app)
  app.disable('x-powered-by')

  app.set('views', path.join(__dirname, '../views/'))

  app.engine(
    'hbs',
    hbs.express4({
      handlebars: HandleBars,
      defaultLayout: path.join(__dirname, '../views/layout/main.hbs'),
      partialsDir: [path.join(__dirname, '../views/partials/'), path.join(__dirname, '../views/subviews/reports')]
    })
  )
  app.set('view engine', 'hbs')
  hbsHelpers.register(hbs.handlebars)
  // Required to access handlebars in mail templates
  global.Handlebars = hbs.handlebars

  app.use(bodyParser.urlencoded({ limit: '2mb', extended: false }))
  app.use(bodyParser.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.use(function (req, res, next) {
    if (mongoose.connection.readyState !== 1) {
      var err = new Error('MongoDb Error')
      err.status = 503
      return next(err)
    }

    return next()
  })

  var cookie = {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
  }

  var sessionSecret = 'trudesk$123#SessionKeY!2387'
  async.waterfall(
    [
      function (next) {
        var sessionStore = new MongoStore({
          mongooseConnection: db.connection,
          autoReconnect: true
        })
        app.use(
          session({
            secret: sessionSecret,
            cookie: cookie,
            store: sessionStore,
            saveUninitialized: false,
            resave: false
          })
        )

        next(null, sessionStore)
      },
      function (store, next) {
        app.use(passportConfig.initialize())
        app.use(passportConfig.session())
        app.use(flash())

        // CORS
        app.use(allowCrossDomain)
        // Mobile
        app.use('/mobile', express.static(path.join(__dirname, '../../', 'mobile')))

        app.use('/assets', express.static(path.join(__dirname, '../../public/uploads/assets')))
        app.use('/uploads/users', express.static(path.join(__dirname, '../../public/uploads/users')))
        app.use('/uploads', middleware.hasAuth, express.static(path.join(__dirname, '../../public/uploads')))
        app.use(
          '/backups',
          middleware.hasAuth,
          middleware.isAdmin,
          express.static(path.join(__dirname, '../../backups'))
        )

        app.use(express.static(path.join(__dirname, '../../public')))

        // Uncomment to enable plugins
        return next(null, store)
        // global.plugins = [];
        // var dive = require('dive');
        // dive(path.join(__dirname, '../../plugins'), {directories: true, files: false, recursive: false}, function(err, dir) {
        //    if (err) throw err;
        //    var fs = require('fs');
        //    if (fs.existsSync(path.join(dir, 'plugin.json'))) {
        //        var plugin = require(path.join(dir, 'plugin.json'));
        //        if (!_.isUndefined(_.find(global.plugins, {'name': plugin.name})))
        //            throw new Error('Unable to load plugin with duplicate name: ' + plugin.name);
        //
        //        global.plugins.push({name: plugin.name.toLowerCase(), version: plugin.version});
        //        var pluginPublic = path.join(dir, '/public');
        //        app.use('/plugins/' + plugin.name, express.static(pluginPublic));
        //        winston.debug('Detected Plugin: ' + plugin.name.toLowerCase() + '-' + plugin.version);
        //    }
        // }, function() {
        //     next(null, store);
        // });
      }
    ],
    function (err, s) {
      if (err) {
        winston.error(err)
        throw new Error(err)
      }

      callback(middleware, s)
    }
  )
}

function allowCrossDomain (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,accesstoken,X-RToken,X-Token'
  )

  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
}
