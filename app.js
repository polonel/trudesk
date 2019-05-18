#!/usr/bin/env node

/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    5/17/19 7:26 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

var async = require('async')
var path = require('path')
var fs = require('fs')
var winston = require('winston')
var nconf = require('nconf')
var Chance = require('chance')
var chance = new Chance()
var pkg = require('./package.json')
// `var memory = require('./src/memory');

var isDocker = process.env.TRUDESK_DOCKER || false

global.forks = []

nconf.argv().env()

global.env = process.env.NODE_ENV || 'development'
// global.env = process.env.NODE_ENV || 'production';

winston.setLevels(winston.config.cli.levels)
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  colorize: true,
  timestamp: function () {
    var date = new Date()
    return (
      date.getMonth() +
      1 +
      '/' +
      date.getDate() +
      ' ' +
      date.toTimeString().substr(0, 8) +
      ' [' +
      global.process.pid +
      ']'
    )
  },
  level: global.env === 'production' ? 'info' : 'verbose'
})

winston.add(winston.transports.File, {
  filename: 'logs/error.log',
  level: 'error'
})

winston.err = function (err) {
  winston.error(err.stack)
}

if (!process.env.FORK) {
  winston.info('    .                              .o8                     oooo')
  winston.info('  .o8                             "888                     `888')
  winston.info('.o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo')
  winston.info('  888   `888""8P `888  `888  d88\' `888  d88\' `88b d88(  "8  888 .8P\'')
  winston.info('  888    888      888   888  888   888  888ooo888 `"Y88b.   888888.')
  winston.info('  888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.')
  winston.info('  "888" d888b     `V88V"V8P\' `Y8bod88P" `Y8bod8P\' 8""888P\' o888o o888o')
  winston.info('==========================================================================')
  winston.info('trudesk v' + pkg.version + ' Copyright (C) 2014-2019 Chris Brame')
  winston.info('')
  winston.info('Running in: ' + global.env)
  winston.info('Server Time: ' + new Date())
}

var configFile = path.join(__dirname, '/config.json')
var configExists

nconf.defaults({
  base_dir: __dirname,
  tokens: {
    secret: chance.hash() + chance.md5(),
    expires: 900
  }
})

if (nconf.get('config')) {
  configFile = path.resolve(__dirname, nconf.get('config'))
}

configExists = fs.existsSync(configFile)

function launchInstallServer () {
  var ws = require('./src/webserver')
  ws.installServer(function () {
    return winston.info('Trudesk Install Server Running...')
  })
}

if (nconf.get('install') || (!configExists && !isDocker)) {
  launchInstallServer()
}

function loadConfig () {
  nconf.file({
    file: configFile
  })
}

function start () {
  if (!isDocker) loadConfig()

  var _db = require('./src/database')

  _db.init(function (err, db) {
    if (err) {
      winston.error('FETAL: ' + err.message)
      winston.warn('Retrying to connect to MongoDB in 10secs...')
      return setTimeout(function () {
        _db.init(dbCallback)
      }, 10000)
    } else {
      dbCallback(err, db)
    }
  })
}

function launchServer (db) {
  var ws = require('./src/webserver')
  ws.init(db, function (err) {
    if (err) {
      winston.error(err)
      return
    }

    async.series(
      [
        function (next) {
          require('./src/settings/defaults').init(next)
        },
        function (next) {
          require('./src/permissions').register(next)
        },
        function (next) {
          require('./src/elasticsearch').init(function (err) {
            if (err) {
              winston.error(err)
            }

            return next()
          })
        },
        function (next) {
          require('./src/socketserver')(ws)
          return next()
        },
        function (next) {
          // Start Check Mail
          var settingSchema = require('./src/models/setting')
          settingSchema.getSetting('mailer:check:enable', function (err, mailCheckEnabled) {
            if (err) {
              winston.warn(err)
              return next(err)
            }

            if (mailCheckEnabled && mailCheckEnabled.value) {
              settingSchema.getSettings(function (err, settings) {
                if (err) return next(err)

                var mailCheck = require('./src/mailer/mailCheck')
                winston.debug('Starting MailCheck...')
                mailCheck.init(settings)

                return next()
              })
            } else {
              return next()
            }
          })
        },
        function (next) {
          require('./src/migration').run(next)
        },
        function (next) {
          winston.debug('Building dynamic sass...')
          require('./src/sass/buildsass').build(next)
        },
        // function (next) {
        //   // Start Task Runners
        //   require('./src/taskrunner')
        //   return next()
        // },
        function (next) {
          var cache = require('./src/cache/cache')
          if (isDocker) {
            var envDocker = {
              TRUDESK_DOCKER: process.env.TRUDESK_DOCKER,
              TD_MONGODB_SERVER: process.env.TD_MONGODB_SERVER,
              TD_MONGODB_PORT: process.env.TD_MONGODB_PORT,
              TD_MONGODB_USERNAME: process.env.TD_MONGODB_USERNAME,
              TD_MONGODB_PASSWORD: process.env.TD_MONGODB_PASSWORD,
              TD_MONGODB_DATABASE: process.env.TD_MONGODB_DATABASE
            }

            cache.env = envDocker
          }

          cache.init()

          return next()
        },
        function (next) {
          var taskRunner = require('./src/taskrunner')
          return taskRunner.init(next)
        }
      ],
      function (err) {
        if (err) throw new Error(err)

        ws.listen(function () {
          winston.info('trudesk Ready')
        })
      }
    )
  })
}

function dbCallback (err, db) {
  if (err || !db) {
    return start()
  }

  if (isDocker) {
    var s = require('./src/models/setting')
    s.getSettingByName('installed', function (err, installed) {
      if (err) return start()

      if (!installed) {
        return launchInstallServer()
      } else {
        return launchServer(db)
      }
    })
  } else {
    return launchServer(db)
  }
}

if (!nconf.get('install') && (configExists || isDocker)) start()
