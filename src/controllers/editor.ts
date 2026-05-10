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

import _ from 'lodash'
import path from 'path'
import fs from 'fs-extra'

const Busboy = require('busboy')
const templateSchema = require('../models/template')

const editor: Record<string, any> = {}

editor.page = function (req: any, res: any) {
  const content: Record<string, any> = {}
  content.title = 'Editor'
  content.nav = 'settings'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.template = req.params.template

  return res.render('editor', content)
}

editor.getAssets = function (_req: any, res: any) {
  const imageExts = ['.gif', '.png', '.jpg', '.jpeg', '.ico', '.bmp']

  fs.ensureDirSync(path.join(__dirname, '../../public/uploads/assets/upload'))

  fs.readdir(path.join(__dirname, '../../public/uploads/assets/upload'), function (err: any, files: string[]) {
    if (err) return res.status(400).json({ success: false, error: err })

    files = files.filter(function (file) {
      return _.indexOf(imageExts, path.extname(file).toLowerCase()) !== -1
    })

    const mapped = _.map(files, function (i) {
      return { src: '/uploads/assets/upload/' + i }
    })

    return res.json({ success: true, assets: mapped })
  })
}

editor.removeAsset = function (req: any, res: any) {
  const id = req.body.fileUrl
  if (!id) return res.status(400).json({ success: false, error: 'Invalid File' })

  const file = path.basename(id)
  fs.unlink(path.join(__dirname, '../../public/uploads/assets/upload', file), function (err: any) {
    if (err) return res.status(500).json({ success: false, error: err })

    return res.json({ success: true })
  })
}

editor.assetsUpload = function (req: any, res: any) {
  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 5 * 1024 * 1024 // 5mb limit
    }
  })

  const object: Record<string, any> = {}
  let error: any

  busboy.on('file', function (_fieldname: any, file: any, filename: any, _encoding: any, mimetype: any) {
    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 500,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../public/uploads/assets/upload')
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

    if (!fs.existsSync(object.filePath))
      return res.status(500).json({ success: false, error: { message: 'File Failed to Save to Disk' } })

    const includePort = (global as any).TRUDESK_PORT && (global as any).TRUDESK_PORT !== 80 && (global as any).TRUDESK_PORT !== 443

    const fileUrl =
      req.protocol +
      '://' +
      req.hostname +
      (includePort ? ':' + String((global as any).TRUDESK_PORT) : '') +
      '/uploads/assets/upload/' +
      object.filename

    return res.json({
      success: true,
      data: [fileUrl]
    })
  })

  req.pipe(busboy)
}

editor.load = function (req: any, res: any) {
  templateSchema.get(req.params.id, function (err: any, template: any) {
    if (err) return res.status(400).json({ success: false, error: err })

    if (!template)
      return res.status(400).json({ success: false, invalid: true, error: { message: 'Invalid Template.' } })

    template.data.id = 'gjs-'

    return res.json(template.data)
  })
}

editor.save = function (req: any, res: any) {
  const name = req.body.template
  delete req.body.template
  templateSchema.findOneAndUpdate(
    { name: name },
    { name: name, data: req.body },
    { new: true, upsert: true },
    function (err: any, template: any) {
      if (err) return res.status(500).json({ success: false, error: err })

      return res.json({ success: true, tempalte: template })
    }
  )
}

module.exports = editor
