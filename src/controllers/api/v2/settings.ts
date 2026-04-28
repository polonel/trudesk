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
 *  Updated:    2/14/19 12:06 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import path from 'path'
import fs from 'fs'
// @ts-ignore: busboy lacks type declarations
import Busboy from 'busboy'
import logger from '../../../logger'
// @ts-ignore: sanitize-html lacks type declarations
import sanitizeHtml from 'sanitize-html'
import settingsUtil from '../../../settings/settingsUtil'
import apiUtils from '../apiUtils'
import { SettingModel } from '../../../models'
import { stripExifData } from '../../../helpers/utils'

const apiSettings: Record<string, any> = {}

apiSettings.get = async (req: any, res: any) => {
  try {
    const querySettings = req.query.settings
    if (querySettings) {
      const dbSettings = await SettingModel.getSettingsByName(querySettings, null, 'name value')
      return apiUtils.sendApiSuccess(res, { settings: dbSettings })
    } else {
      const dbSettings = await settingsUtil.getSettings(() => undefined)
      if (!dbSettings) return apiUtils.sendApiError(res, 400, 'Invalid Settings')

      if (!req.user?.role?.isAdmin && dbSettings.settings) {
        const s = dbSettings.settings as Partial<typeof dbSettings.settings>
        delete s.mailerHost
        delete s.mailerSSL
        delete s.mailerPort
        delete s.mailerUsername
        delete s.mailerPassword
        delete s.mailerFrom
        delete s.mailerCheckEnabled
        delete s.mailerCheckPolling
        delete s.mailerCheckHost
        delete s.mailerCheckPort
        delete s.mailerCheckPassword
        delete s.mailerCheckTicketType
        delete s.mailerCheckTicketPriority
        delete s.mailerCheckCreateAccount
        delete s.mailerCheckDeleteMessage

        delete dbSettings.mailTemplates
      }

      return apiUtils.sendApiSuccess(res, { settings: dbSettings })
    }
  } catch (e: any) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiSettings.updateBatch = async (req: any, res: any) => {
  let postData = req.body
  if (!postData) return apiUtils.sendApiError_InvalidPostData(res)
  if (!Array.isArray(postData)) postData = [postData]

  const updatedSettings: any[] = []

  try {
    for (const item of postData) {
      let setting = await SettingModel.findOne({ name: item.name })
      if (!setting) {
        setting = new SettingModel({
          name: item.name
        })
      }

      if (setting.name === 'legal:privacypolicy') item.value = sanitizeHtml(item.value, { allowedTags: false })

      setting.value = item.value

      setting = await setting.save()

      updatedSettings.push(setting)
    }

    return apiUtils.sendApiSuccess(res, { updatedSettings })
  } catch (e: any) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiSettings.theme = async (_req: any, res: any) => {
  try {
    const content = await settingsUtil.getSettings(() => undefined)
    const parsed = content.settings || {}

    const theme = {
      customLogo: (parsed as any).hasCustomLogo?.value,
      customLogoUrl: (parsed as any).customLogoFilename?.value,
      customFavicon: (parsed as any).hasCustomFavicon?.value,
      customFaviconUrl: '/assets/' + (parsed as any).customFaviconFilename?.value,
      siteTitle: (parsed as any).siteTitle?.value,
      autoDark: (parsed as any).themeAutoDark?.value,
      themeLight: (parsed as any).themeLight?.value,
      themeDark: (parsed as any).themeDark?.value,
      headerBG: (parsed as any).colorHeaderBG?.value,
      headerPrimary: (parsed as any).colorHeaderPrimary?.value,
      primary: (parsed as any).colorPrimary?.value,
      secondary: (parsed as any).colorSecondary?.value,
      tertiary: (parsed as any).colorTertiary?.value,
      quaternary: (parsed as any).colorQuaternary?.value
    }

    return apiUtils.sendApiSuccess(res, { theme })
  } catch (e: any) {
    return apiUtils.sendApiError(res, 400, e.message)
  }
}

apiSettings.uploadLogo = async (req: any, res: any) => {
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 1024 * 1024 * 3 // 3mb
    }
  })

  const object: Record<string, any> = {}
  let error: any = null

  busboy.on('file', function (_name: string, file: any, info: any) {
    const filename = info.filename
    const mimetype = info.mimeType
    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../../../public/uploads/assets')
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)

    object.filePath = path.join(savePath, 'topLogo' + path.extname(filename))
    object.filename = 'topLogo' + path.extname(filename)
    object.mimetype = mimetype

    file.on('limit', () => {
      error = {
        status: 400,
        message: 'File size too large. File size limit: 3mb'
      }

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.once('finish', () => {
    if (error) {
      logger.warn(error)
      return apiUtils.sendApiError(res, error.status, error)
    }

    if (!object.filePath || !object.filename) return apiUtils.sendApiError(res, 400, 'Invalid image data')
    if (!fs.existsSync(object.filePath)) return apiUtils.sendApiError(res, 400, 'File failed to save to disk')
    if (path.extname(object.filename) === '.jpg' || path.extname(object.filename) === '.jpeg')
      stripExifData(object.filePath)

    settingsUtil
      .setSetting('gen:customlogo', true)
      .then(() => {
        settingsUtil
          .setSetting('gen:customlogofilename', object.filename)
          .then(() => {
            return apiUtils.sendApiSuccess(res, {})
          })
          .catch(() => {
            return apiUtils.sendApiError(res, 400, 'Failed to save setting to database')
          })
      })
      .catch(() => {
        return apiUtils.sendApiError(res, 400, 'Failed to save setting to database')
      })
  })

  req.pipe(busboy)
}

apiSettings.uploadPageLogo = async (req: any, res: any) => {
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 1024 * 1024 * 3 // 3mb
    }
  })

  const object: Record<string, any> = {}
  let error: any = null

  busboy.on('file', function (_name: string, file: any, info: any) {
    const filename = info.filename
    const mimetype = info.mimeType
    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../../../public/uploads/assets')
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)

    object.filePath = path.join(savePath, 'pageLogo' + path.extname(filename))
    object.filename = 'pageLogo' + path.extname(filename)
    object.mimetype = mimetype

    file.on('limit', () => {
      error = {
        status: 400,
        message: 'File size too large. File size limit: 3mb'
      }

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.once('finish', () => {
    if (error) {
      logger.warn(error)
      return apiUtils.sendApiError(res, error.status, error)
    }

    if (!object.filePath || !object.filename) return apiUtils.sendApiError(res, 400, 'Invalid image data')
    if (!fs.existsSync(object.filePath)) return apiUtils.sendApiError(res, 400, 'File failed to save to disk')
    if (path.extname(object.filename) === '.jpg' || path.extname(object.filename) === '.jpeg')
      stripExifData(object.filePath)

    settingsUtil
      .setSetting('gen:custompagelogo', true)
      .then(() => {
        settingsUtil
          .setSetting('gen:custompagelogofilename', object.filename)
          .then(() => {
            return apiUtils.sendApiSuccess(res, {})
          })
          .catch(() => {
            return apiUtils.sendApiError(res, 400, 'Failed to save setting to database')
          })
      })
      .catch(() => {
        return apiUtils.sendApiError(res, 400, 'Failed to save setting to database')
      })
  })

  req.pipe(busboy)
}

apiSettings.uploadFavicon = async (req: any, res: any) => {
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 1024 * 1024 * 1 // 1mb
    }
  })

  const object: Record<string, any> = {}
  let error: any = null

  busboy.on('file', function (_name: string, file: any, info: any) {
    const filename = info.filename
    const mimetype = info.mimeType
    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 400,
        message: 'Invalid File Type'
      }

      return file.resume()
    }

    const savePath = path.join(__dirname, '../../../../public/uploads/assets')
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath)

    object.filePath = path.join(savePath, 'favicon' + path.extname(filename))
    object.filename = 'favicon' + path.extname(filename)
    object.mimetype = mimetype

    file.on('limit', () => {
      error = {
        status: 400,
        message: 'File size too large. File size limit: 1mb'
      }

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.once('finish', () => {
    if (error) {
      logger.warn(error)
      return apiUtils.sendApiError(res, error.status, error)
    }

    if (!object.filePath || !object.filename) return apiUtils.sendApiError(res, 400, 'Invalid image data')
    if (!fs.existsSync(object.filePath)) return apiUtils.sendApiError(res, 400, 'File failed to save to disk')
    if (path.extname(object.filename) === '.jpg' || path.extname(object.filename) === '.jpeg')
      stripExifData(object.filePath)

    settingsUtil
      .setSetting('gen:customfavicon', true)
      .then(() => {
        settingsUtil
          .setSetting('gen:customfaviconfilename', object.filename)
          .then(() => {
            return apiUtils.sendApiSuccess(res, {})
          })
          .catch(() => {
            return apiUtils.sendApiError(res, 400, 'Failed to save setting to database')
          })
      })
      .catch(() => {
        return apiUtils.sendApiError(res, 400, 'Failed to save setting to database')
      })
  })

  req.pipe(busboy)
}

module.exports = apiSettings
