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
 *  Updated:    1/24/19 11:50 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var path = require('path')
var fs = require('fs-extra')
var Busboy = require('busboy')
var templateSchema = require('../models/template')

var editor = {}

editor.page = function (req, res) {
  var content = {}
  content.title = 'Editor'
  content.nav = 'settings'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.template = req.params.template

  return res.render('editor', content)
}

editor.getAssets = function (req, res) {
  var imageExts = ['.gif', '.png', '.jpg', '.jpeg', '.ico', '.bmp']

  fs.ensureDirSync(path.join(__dirname, '../../public/uploads/assets/upload'))

  fs.readdir(path.join(__dirname, '../../public/uploads/assets/upload'), function (err, files) {
    if (err) return res.status(400).json({ success: false, error: err })

    files = files.filter(function (file) {
      return _.indexOf(imageExts, path.extname(file).toLowerCase() !== -1)
    })

    files = _.map(files, function (i) {
      return { src: '/uploads/assets/upload/' + i }
    })

    return res.json({ success: true, assets: files })
  })
}

editor.removeAsset = function (req, res) {
  var id = req.body.fileUrl
  if (!id) return res.status(400).json({ success: false, error: 'Invalid File' })

  var file = path.basename(id)
  fs.unlink(path.join(__dirname, '../../public/uploads/assets/upload', file), function (err) {
    if (err) return res.status(500).json({ success: false, error: err })

    return res.json({ success: true })
  })
}

editor.assetsUpload = function (req, res) {
  // var chance = new Chance()
  var busboy = new Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 5 * 1024 * 1024 // 5mb limit
    }
  })

  var object = {}
  var error

  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 500,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    // var ext = path.extname(filename)

    var savePath = path.join(__dirname, '../../public/uploads/assets/upload')
    // var sanitizedFilename = chance.hash({ length: 20 }) + ext
    if (!fs.existsSync(savePath)) fs.ensureDirSync(savePath)

    object.filePath = path.join(savePath, filename)
    object.filename = filename
    object.mimetype = mimetype

    if (fs.existsSync(object.filePath)) {
      error = {
        status: 500,
        message: 'File already exists'
      }

      return file.resume()
    }

    file.on('limit', function () {
      error = {
        status: 500,
        message: 'File too large'
      }

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.on('finish', function () {
    if (error) return res.status(error.status).json({ success: false, error: error })

    if (_.isUndefined(object.filename) || _.isUndefined(object.filePath)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid Form Data' } })
    }

    // Everything Checks out lets make sure the file exists and then add it to the attachments array
    if (!fs.existsSync(object.filePath))
      return res.status(500).json({ success: false, error: { message: 'File Failed to Save to Disk' } })

    var includePort = global.TRUDESK_PORT && global.TRUDESK_PORT !== (80 || 443)

    var fileUrl =
      req.protocol +
      '://' +
      req.hostname +
      (includePort ? ':' + global.TRUDESK_PORT.toString() : '') +
      '/uploads/assets/upload/' +
      object.filename

    // var dimensions = sizeOf(fileUrl)

    return res.json({
      success: true,
      data: [fileUrl]
    })
  })

  req.pipe(busboy)
}

editor.load = function (req, res) {
  templateSchema.get(req.params.id, function (err, template) {
    if (err) return res.status(400).json({ success: false, error: err })

    if (!template)
      return res.status(400).json({ success: false, invalid: true, error: { message: 'Invalid Template.' } })

    template.data.id = 'gjs-'

    return res.json(template.data)
  })
}

editor.save = function (req, res) {
  var name = req.body.template
  delete req.body.template
  templateSchema.findOneAndUpdate(
    { name: name },
    { name: name, data: req.body },
    { new: true, upsert: true },
    function (err, template) {
      if (err) return res.status(500).json({ success: false, error: err })

      return res.json({ success: true, tempalte: template })
    }
  )
}

module.exports = editor
