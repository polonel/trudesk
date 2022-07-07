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

const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const spawn = require('child_process').spawn
const os = require('os')
const async = require('async')
const AdmZip = require('adm-zip')
const database = require('../database')
const winston = require('../logger')

global.env = process.env.NODE_ENV || 'production'

let CONNECTION_URI = null
let databaseName = null

function cleanup (callback) {
  const rimraf = require('rimraf')
  rimraf(path.join(__dirname, '../../restores/restore_*'), callback)
}

function cleanUploads (callback) {
  const rimraf = require('rimraf')
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
  const zip = new AdmZip(path.join(__dirname, '../../backups/', file))
  zip.extractAllTo(path.join(__dirname, '../../restores/restore_' + file + '/'), true)

  if (_.isFunction(callback)) {
    return callback()
  }
}

function cleanMongoDb (callback) {
  database.db.connection.db.dropDatabase(callback)
}

function runRestore (file, callback) {
  const platform = os.platform()
  winston.info('Starting Restore... (' + platform + ')')

  const dbName = fs.readdirSync(path.join(__dirname, '../../restores/restore_' + file, 'database'))[0]
  if (!dbName) {
    return callback(new Error('Invalid Backup. Unable to get DBName'))
  }

  const options = [
    '--uri',
    CONNECTION_URI,
    '-d',
    databaseName,
    path.join(__dirname, '../../restores/restore_' + file, 'database', dbName),
    '--noIndexRestore'
  ]
  let mongorestore = null
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

  const FILE = process.env.FILE
  if (!FILE) return process.send({ success: false, error: 'Invalid File' })

  if (!fs.existsSync(path.join(__dirname, '../../backups', FILE))) {
    return process.send({ success: false, error: 'FILE NOT FOUND' })
  }

  const options = {
    keepAlive: true,
    connectTimeoutMS: 5000
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
