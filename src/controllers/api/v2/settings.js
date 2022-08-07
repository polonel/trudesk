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

const path = require('path')
const sanitizeHtml = require('sanitize-html')
const settingsUtil = require('../../../settings/settingsUtil')
const apiUtils = require('../apiUtils')
const { SettingModel } = require('../../../models')

const apiSettings = {}

apiSettings.get = async (req, res) => {
  try {
    const querySettings = req.query.settings
    if (querySettings) {
      const dbSettings = await SettingModel.getSettingsByName(querySettings, null, 'name value')
      return apiUtils.sendApiSuccess(res, { settings: dbSettings })
    } else {
      const dbSettings = await settingsUtil.getSettings()
      if (!dbSettings) return apiUtils.sendApiError(res, 400, { message: 'Invalid Settings' })

      if (!req.user?.role?.isAdmin) {
        delete dbSettings.settings.mailerHost
        delete dbSettings.settings.mailerSSL
        delete dbSettings.settings.mailerPort
        delete dbSettings.settings.mailerUsername
        delete dbSettings.settings.mailerPassword
        delete dbSettings.settings.mailerFrom
        delete dbSettings.settings.mailerCheckEnabled
        delete dbSettings.settings.mailerCheckPolling
        delete dbSettings.settings.mailerCheckHost
        delete dbSettings.settings.mailerCheckPort
        delete dbSettings.settings.mailerCheckPassword
        delete dbSettings.settings.mailerCheckTicketType
        delete dbSettings.settings.mailerCheckTicketPriority
        delete dbSettings.settings.mailerCheckCreateAccount
        delete dbSettings.settings.mailerCheckDeleteMessage

        delete dbSettings.mailTemplates
      }

      return apiUtils.sendApiSuccess(res, { settings: dbSettings })
    }
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiSettings.updateBatch = async (req, res) => {
  let postData = req.body
  if (!postData) return apiUtils.sendApiError_InvalidPostData(res)
  if (!Array.isArray(postData)) postData = [postData]

  const updatedSettings = []

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
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiSettings.theme = async (req, res) => {
  try {
    // const settings = await SettingModel.getSettingsByName([
    //   'gen:customlogo',
    //   'gen:customlogourl',
    //   'gen:customfavicon',
    //   'gen:customfaviconurl',
    //   'color:headerbg',
    //   'color:headerprimary',
    //   'color:primary',
    //   'color:secondary',
    //   'color:tertiary',
    //   'color:quaternary'
    // ])

    const content = await settingsUtil.getSettings()
    const parsed = content.settings

    const theme = {
      customLogo: parsed.hasCustomLogo.value,
      customLogoUrl: parsed.customLogoFilename.value,
      customFavicon: parsed.hasCustomFavicon.value,
      customFaviconUrl: parsed.customFaviconFilename.value,
      headerBG: parsed.colorHeaderBG.value,
      headerPrimary: parsed.colorHeaderPrimary.value,
      primary: parsed.colorPrimary.value,
      secondary: parsed.colorSecondary.value,
      tertiary: parsed.colorTertiary.value,
      quaternary: parsed.colorQuaternary.value
    }

    return apiUtils.sendApiSuccess(res, { theme })
  } catch (e) {
    return apiUtils.sendApiError(res, 400, e.message)
  }
}

module.exports = apiSettings
export default apiSettings
