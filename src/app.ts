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
 *  Updated:    5/11/22 2:26 AM
 *  Copyright (c) 2014-2022 Trudesk, Inc. All rights reserved.
 */

import async from 'async'
import pkg from '../package.json'
import { init as cacheInit } from './cache/cache'
import { checkForOldConfig, hasConfigFile, loadConfig } from './config'
import { init as databaseInit, TrudeskDatabase, trudeskDatabase } from './database'
import elasticsearch from './elasticsearch'
import { installServer } from './installserver'
import winston from './logger'
import mailCheck from './mailer/mailCheck'
import migration from './migration'
import Models from './models'
import permissions from './permissions'
import buildSass from './sass/buildsass'
import { init as tdDefaultInit } from './settings/defaults'
import { SocketServer } from './socketserver'
import taskRunner from './taskrunner'
import webserver, { init as webServerInit, webServerListen } from './webserver'

const isDocker = process.env['TRUDESK_DOCKER'] || false

global.forks = []

global.env = process.env['NODE_ENV'] || 'development'

if (!process.env['FORK']) {
  winston.info('    .                              .o8                     oooo')
  winston.info('  .o8                             "888                     `888')
  winston.info('.o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo')
  winston.info('  888   `888""8P `888  `888  d88\' `888  d88\' `88b d88(  "8  888 .8P\'')
  winston.info('  888    888      888   888  888   888  888ooo888 `"Y88b.   888888.')
  winston.info('  888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.')
  winston.info('  "888" d888b     `V88V"V8P\' `Y8bod88P" `Y8bod8P\' 8""888P\' o888o o888o')
  winston.info('==========================================================================')
  winston.info('trudesk v' + pkg.version + ' Copyright (C) 2014-2022 Trudesk Inc. (POLONEL)')
  winston.info('')
  winston.info('                         COMMUNITY EDITION')
  winston.info('')
  winston.info('Running in: ' + global.env)
  winston.info('Server Time: ' + new Date())
}

// Make sure we convert the .json file to .yml
checkForOldConfig()

function launchInstallServer() {
  installServer(function () {
    return winston.info('Trudesk Install Server Running...')
  })
}

if (!hasConfigFile() && !isDocker) {
  launchInstallServer()
}

function start() {
  if (!isDocker) loadConfig()
  databaseInit(function (err) {
    if (err) {
      winston.error('FETAL: ' + err.message)
      winston.warn('Retrying to connect to MongoDB in 10secs...')
      setTimeout(function () {
        databaseInit(dbCallback)
      }, 10000)
    } else {
      dbCallback(err, trudeskDatabase)
    }
  })
}

function launchServer(db: TrudeskDatabase) {
  webServerInit(db, () => {
    async.series(
      [
        function (next) {
          tdDefaultInit(next)
        },
        function (next) {
          permissions.register(next)
        },
        function (next) {
          elasticsearch.init(function (err?: Error) {
            if (err) {
              winston.error(err)
            }

            return next()
          })
        },
        function (next) {
          SocketServer(webserver)
          return next()
        },
        function (next) {
          // Start Check Mail
          const settingSchema = Models.SettingModel
          settingSchema.getSettingByName('mailer:check:enable', function (err, mailCheckEnabled) {
            if (err) {
              winston.warn(err)
              return next(err)
            }

            if (mailCheckEnabled && mailCheckEnabled.value) {
              settingSchema.getSettings(function (err, settings) {
                if (err) return next(err)

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
          migration.run(next)
        },
        function (next) {
          winston.debug('Building dynamic sass...')
          buildSass.build(next)
        },
        // function (next) {
        //   // Start Task Runners
        //   require('./src/taskrunner')
        //   return next()
        // },
        function (next) {
          let cacheEnvVars = {}
          if (isDocker) {
            cacheEnvVars = {
              TRUDESK_DOCKER: process.env['TRUDESK_DOCKER'],
              TD_MONGODB_SERVER: process.env['TD_MONGODB_SERVER'],
              TD_MONGODB_PORT: process.env['TD_MONGODB_PORT'],
              TD_MONGODB_USERNAME: process.env['TD_MONGODB_USERNAME'],
              TD_MONGODB_PASSWORD: process.env['TD_MONGODB_PASSWORD'],
              TD_MONGODB_DATABASE: process.env['TD_MONGODB_DATABASE'],
              TD_MONGODB_URI: process.env['TD_MONGODB_URI'],
            }
          }

          cacheInit(cacheEnvVars)

          return next()
        },
        function (next) {
          return taskRunner.init(next)
        },
      ],
      function (err) {
        if (err) throw err

        webServerListen(function () {
          winston.info('trudesk Ready')
        })
      }
    )
  })
}

function dbCallback(err?: Error | null, db?: TrudeskDatabase | null) {
  if (err || !db) {
    return start()
  }

  if (isDocker) {
    const s = Models.SettingModel
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

if (hasConfigFile() || isDocker) start()
