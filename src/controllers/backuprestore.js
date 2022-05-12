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
const async = require('async')
const moment = require('moment')

const backupRestore = {}

function formatBytes (bytes, fixed) {
  if (!fixed) fixed = 2
  if (bytes < 1024) return bytes + ' Bytes'
  if (bytes < 1048576) return (bytes / 1024).toFixed(fixed) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(fixed) + ' MB'

  return (bytes / 1073741824).toFixed(fixed) + ' GB'
}

backupRestore.getBackups = function (req, res) {
  fs.readdir(path.join(__dirname, '../../backups'), function (err, files) {
    if (err) return res.status(400).json({ error: err })

    files = files.filter(function (file) {
      return path.extname(file).toLowerCase() === '.zip'
    })

    let fileWithStats = []
    async.forEach(
      files,
      function (f, next) {
        fs.stat(path.join(__dirname, '../../backups/', f), function (err, stats) {
          if (err) return next(err)

          const obj = {}
          obj.size = stats.size
          obj.sizeFormat = formatBytes(obj.size, 1)
          obj.filename = f
          obj.time = stats.mtime

          fileWithStats.push(obj)

          return next()
        })
      },
      function (err) {
        if (err) return res.status(400).json({ success: false, error: err })
        fileWithStats = _.sortBy(fileWithStats, function (o) {
          return new moment(o.time)
        }).reverse()
        return res.json({ success: true, files: fileWithStats })
      }
    )
  })
}

backupRestore.runBackup = function (req, res) {
  const database = require('../database')
  const child = require('child_process').fork(path.join(__dirname, '../../src/backup/backup'), {
    env: { FORK: 1, NODE_ENV: global.env, MONGOURI: database.connectionuri, PATH: process.env.PATH }
  })
  global.forks.push({ name: 'backup', fork: child })

  let result = null

  child.on('message', function (data) {
    child.kill('SIGINT')
    global.forks = _.remove(global.forks, function (f) {
      return f.fork !== child
    })

    if (data.error) {
      result = { success: false, error: data.error }
    }

    if (data.success) {
      result = { success: true }
    } else {
      result = { success: false, error: data }
    }
  })

  child.on('close', function () {
    if (!result) {
      return res.status(500).json({ success: false, error: 'An Unknown Error Occurred' })
    }

    if (result.error) {
      return res.status(400).json(result)
    }

    return res.json(result)
  })
}

backupRestore.deleteBackup = function (req, res) {
  const filename = req.params.backup
  if (_.isUndefined(filename) || !fs.existsSync(path.join(__dirname, '../../backups/', filename))) {
    return res.status(400).json({ success: false, error: 'Invalid Filename' })
  }

  fs.unlink(path.join(__dirname, '../../backups/', filename), function (err) {
    if (err) return res.status(400).json({ success: false, error: err })

    return res.json({ success: true })
  })
}

backupRestore.restoreBackup = function (req, res) {
  const database = require('../database')

  const file = req.body.file
  if (!file) return res.status(400).json({ success: false, error: 'Invalid File' })

  // CHECK IF HAS TOOLS INSTALLED
  // if (require('os').platform() === 'win32')
  //     return res.json({success: true});
  //
  // require('child_process').exec('mongodump --version', function(err) {
  //     if (err) return res.status(400).json({success: false, error: err});
  //
  //     return res.json({success: true});
  // });

  const child = require('child_process').fork(path.join(__dirname, '../../src/backup/restore'), {
    env: {
      FORK: 1,
      NODE_ENV: global.env,
      MONGOURI: database.connectionuri,
      FILE: file,
      PATH: process.env.PATH
    }
  })
  global.forks.push({ name: 'restore', fork: child })

  let result = null

  child.on('message', function (data) {
    child.kill('SIGINT')
    global.forks = _.remove(global.forks, function (f) {
      return f.fork !== child
    })

    if (data.error) {
      result = { success: false, error: data.error }
      return
    }

    if (data.success) {
      const cache = _.find(global.forks, function (f) {
        return f.name === 'cache'
      })

      if (cache && cache.fork) {
        cache.fork.send({ name: 'cache:refresh:force' })
      }

      require('../permissions').flushRoles(function () {})

      result = { success: true }
    } else {
      result = { success: false, error: data.error }
    }
  })

  child.on('close', function () {
    if (!result) {
      return res.status(500).json({ success: false, error: 'An Unknown Error Occurred' })
    }

    if (result.error) {
      return res.status(400).json(result)
    }

    return res.json(result)
  })
}

backupRestore.hasBackupTools = function (req, res) {
  if (require('os').platform() === 'win32') {
    return res.json({ success: true })
  }

  require('child_process').exec('mongodump --version', function (err) {
    if (err) return res.status(400).json({ success: false, error: err })

    return res.json({ success: true })
  })
}

backupRestore.uploadBackup = function (req, res) {
  const Busboy = require('busboy')
  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      files: 1
    }
  })

  const object = {}
  let error

  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    if (
      mimetype.indexOf('application/zip') === -1 &&
      mimetype.indexOf('application/x-compressed') === -1 &&
      mimetype.indexOf('application/x-zip-compressed') === -1 &&
      mimetype.indexOf('application/octet-stream') === -1 &&
      mimetype.indexOf('multipart/x-zip')
    ) {
      error = {
        status: 400,
        message: 'Invalid file type. Zip Required.'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../backups')
    fs.ensureDirSync(savePath)

    object.filePath = path.join(savePath, filename)
    object.filename = filename
    object.mimetype = mimetype

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.on('finish', function () {
    if (error) return res.status(error.status).json({ success: false, error: error.message })

    if (_.isUndefined(object.filePath) || _.isUndefined(object.filename)) {
      return res.status(400).json({ success: false, error: 'Invalid Form Data' })
    }

    if (!fs.existsSync(object.filePath))
      return res.status(400).json({ success: false, error: 'File failed to save to disk' })

    return res.json({ success: true })
  })

  req.pipe(busboy)
}

module.exports = backupRestore
