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

var _ = require('lodash')
var fs = require('fs-extra')
var path = require('path')
var spawn = require('child_process').spawn
var os = require('os')
var async = require('async')
var AdmZip = require('adm-zip')
var database = require('../database')
var winston = require('winston')

global.env = process.env.NODE_ENV || 'production'

var CONNECTION_URI = null
var databaseName = null

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
      ' [Child:Backup:' +
      process.pid +
      ']'
    )
  },
  level: global.env === 'production' ? 'info' : 'verbose'
})

function cleanup (callback) {
  var rimraf = require('rimraf')
  rimraf(path.join(__dirname, '../../restores/restore_*'), callback)
}

function cleanUploads (callback) {
  var rimraf = require('rimraf')
  rimraf(path.join(__dirname, '../../public/uploads/*'), callback)
}

function copyUploads (file, callback) {
  async.parallel(
    [
      function (done) {
        fs.copy(
          path.join(__dirname, '../../restores/restore_' + file + '/assets/'),
          path.join(__dirname, '../../public/uploads/assets/'),
          done
        )
      },
      function (done) {
        fs.copy(
          path.join(__dirname, '../../restores/restore_' + file + '/users/'),
          path.join(__dirname, '../../public/uploads/users/'),
          done
        )
      },
      function (done) {
        fs.copy(
          path.join(__dirname, '../../restores/restore_' + file + '/tickets/'),
          path.join(__dirname, '../../public/uploads/tickets/'),
          done
        )
      }
    ],
    callback
  )
}

function extractArchive (file, callback) {
  var zip = new AdmZip(path.join(__dirname, '../../backups/', file))
  zip.extractAllTo(path.join(__dirname, '../../restores/restore_' + file + '/'), true)

  if (_.isFunction(callback)) {
    return callback()
  }
}

function cleanMongoDb (callback) {
  database.db.connection.db.dropDatabase(callback)
}

function runRestore (file, callback) {
  var platform = os.platform()
  winston.info('Starting Restore... (' + platform + ')')

  var dbName = fs.readdirSync(path.join(__dirname, '../../restores/restore_' + file, 'database'))[0]
  if (!dbName) {
    return callback(new Error('Invalid Backup. Unable to get DBName'))
  }

  var options = [
    '--uri',
    CONNECTION_URI,
    '-d',
    databaseName,
    path.join(__dirname, '../../restores/restore_' + file, 'database', dbName),
    '--noIndexRestore'
  ]
  var mongorestore = null
  if (platform === 'win32') {
    mongorestore = spawn(path.join(__dirname, 'bin', platform, 'mongorestore'), options, {
      env: { PATH: process.env.PATH }
    })
  } else {
    mongorestore = spawn('mongorestore', options, { env: { PATH: process.env.PATH } })
  }

  mongorestore.stdout.on('data', function (data) {
    winston.debug(data.toString())
  })

  mongorestore.stderr.on('data', function (data) {
    winston.debug(data.toString())
  })

  mongorestore.on('exit', function (code) {
    if (code === 0) {
      callback(null, 'done')
    } else {
      callback(new Error('mongorestore falied with code ' + code))
    }
  })
}

;(function () {
  CONNECTION_URI = process.env.MONGOURI
  if (!CONNECTION_URI) return process.send({ success: false, error: 'Invalid connection uri' })

  var FILE = process.env.FILE
  if (!FILE) return process.send({ success: false, error: 'Invalid File' })

  if (!fs.existsSync(path.join(__dirname, '../../backups', FILE))) {
    return process.send({ success: false, error: 'FILE NOT FOUND' })
  }

  var options = {
    keepAlive: 0,
    auto_reconnect: false,
    connectTimeoutMS: 5000,
    useNewUrlParser: true
  }
  database.init(
    function (e, db) {
      if (e) {
        return process.send({ success: false, error: e })
      }

      if (!db) {
        return process.send({
          success: false,
          error: { message: 'Unable to open database' }
        })
      }

      databaseName = database.db.connection.db.databaseName

      fs.ensureDirSync(path.join(__dirname, '../../restores'))

      async.series(
        [
          function (next) {
            // Clean any old restores hanging around
            cleanup(next)
          },
          function (next) {
            cleanUploads(next)
          },
          function (next) {
            extractArchive(FILE, next)
          },
          function (next) {
            cleanMongoDb(next)
          },
          function (next) {
            runRestore(FILE, next)
          },
          function (next) {
            copyUploads(FILE, next)
          },
          function (next) {
            cleanup(next)
          }
        ],
        function (err) {
          if (err) return process.send({ success: false, error: err })

          return process.send({ success: true })
        }
      )
    },
    CONNECTION_URI,
    options
  )
})()
