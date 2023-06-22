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

const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const spawn = require('child_process').spawn
const archiver = require('archiver')
const database = require('../database')
const winston = require('../logger')
const moment = require('moment')
const pkg = require('../../package.json')

global.env = process.env.NODE_ENV || 'production'

let CONNECTION_URI = null
let FILENAME = null

function createZip (callback) {
  const filename = FILENAME
  const output = fs.createWriteStream(path.join(__dirname, '../../backups/', filename))
  const archive = archiver('zip', {
    zlib: { level: 9 }
  })

  output.on('close', callback)
  output.on('end', callback)

  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      winston.warn(err)
    } else {
      winston.error(err)
      return callback(err)
    }
  })

  archive.on('error', callback)

  archive.pipe(output)
  archive.directory(path.join(__dirname, '../../backups/dump/'), false)

  archive.finalize()
}

function cleanup (callback) {
  const rimraf = require('rimraf')
  rimraf(path.join(__dirname, '../../backups/dump'), callback)
}

function copyFiles (callback) {
  // Make sure the directories are created for the backup.
  fs.ensureDirSync(path.join(__dirname, '../../public/uploads/assets'))
  fs.ensureDirSync(path.join(__dirname, '../../public/uploads/tickets'))
  fs.ensureDirSync(path.join(__dirname, '../../public/uploads/users'))

  fs.copy(path.join(__dirname, '../../public/uploads/'), path.join(__dirname, '../../backups/dump/'), callback)
}

function runBackup (callback) {
  const platform = os.platform()
  winston.info('Starting backup... (' + platform + ')')

  let mongodumpExec = 'mongodump'
  if (platform === 'win32') {
    mongodumpExec = path.join(__dirname, 'bin/win32/mongodump')
  }

  const options = [
    '--uri',
    CONNECTION_URI,
    '--forceTableScan',
    '--out',
    path.join(__dirname, '../../backups/dump/database/')
  ]
  const mongodump = spawn(mongodumpExec, options, { env: { PATH: process.env.PATH } })

  mongodump.stdout.on('data', function (data) {
    winston.debug(data.toString())
  })

  mongodump.stderr.on('data', function (data) {
    winston.debug(data.toString())
  })

  mongodump.on('error', function (err) {
    winston.error(err)
    return callback(err.message)
  })

  mongodump.on('exit', function (code) {
    if (code === 0) {
      const dbName = fs.readdirSync(path.join(__dirname, '../../backups/dump/database'))[0]
      if (!dbName) {
        return callback(new Error('Unable to retrieve database name'))
      }

      require('rimraf')(path.join(__dirname, '../../backups/dump/database', dbName, 'session*'), function (err) {
        if (err) return callback(err)

        copyFiles(function (err) {
          if (err) return callback(err)
          createZip(function (err) {
            if (err) return callback(err)
            cleanup(callback)
          })
        })
      })
    } else {
      callback(new Error('MongoDump failed with code ' + code))
    }
  })
}

;(function () {
  CONNECTION_URI = process.env.MONGOURI
  FILENAME = process.env.FILENAME || 'trudesk-v' + pkg.version + '-' + moment().format('MMDDYYYY_HHmm') + '.zip'

  if (!CONNECTION_URI) return process.send({ error: { message: 'Invalid connection uri' } })
  const options = {
    keepAlive: false,
    connectTimeoutMS: 5000
  }
  database.init(
    function (e, db) {
      if (e) {
        process.send({ success: false, error: e })
        return process.kill(0)
      }

      if (!db) {
        process.send({
          success: false,
          error: { message: 'Unable to open database' }
        })
        return process.kill(0)
      }

      // Cleanup any leftovers
      cleanup(function (err) {
        if (err) return process.send({ success: false, error: err })

        runBackup(function (err) {
          if (err) return process.send({ success: false, error: err })

          winston.info('Backup completed successfully: ' + FILENAME)
          process.send({ success: true })
        })
      })
    },
    CONNECTION_URI,
    options
  )
})()
