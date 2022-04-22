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

const mongoose = require('mongoose')

const COLLECTION = 'settings'

const settingSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
})

settingSchema.statics.getSettings = function (callback) {
  const q = this.model(COLLECTION)
    .find()
    .select('name value')

  return q.exec(callback)
}

settingSchema.statics.getSettingByName = async function (name, callback) {
  return new Promise((resolve, reject) => {
    ;(async () => {
      const q = this.model(COLLECTION).findOne({ name })

      try {
        const result = await q.exec()
        if (typeof callback === 'function') callback(null, result)

        return resolve(result)
      } catch (e) {
        if (typeof callback === 'function') callback(e)

        return reject(e)
      }
    })()
  })
}

settingSchema.statics.getSettingsByName = async function (names, callback) {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const q = this.model(COLLECTION).find({ name: names })
        const result = await q.exec()
        if (typeof callback === 'function') callback(null, result)

        return resolve(result)
      } catch (e) {
        if (typeof callback === 'function') callback(e)

        return reject(e)
      }
    })()
  })
}

settingSchema.statics.getSetting = settingSchema.statics.getSettingByName

module.exports = mongoose.model(COLLECTION, settingSchema)
