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
 *  Updated:    7/24/22 12:25 AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import { CallbackError, Document, HydratedDocument, model, Model, Schema } from 'mongoose'

const COLLECTION = 'settings'

export interface ISetting extends Document {
  name: string
  value: string | boolean | number | object
}

interface ISettingModel extends Model<ISetting> {
  getSettings(callback?: (err?: CallbackError, res?: Array<HydratedDocument<ISetting>>) => void): Promise<Array<HydratedDocument<ISetting>>>

  getSettingByName(name: string, callback?: (err?: CallbackError, res?: HydratedDocument<ISetting>) => void): Promise<HydratedDocument<ISetting>>

  getSettingsByName(name: string, callback?: (err?: CallbackError, res?: Array<HydratedDocument<ISetting>>) => void): Promise<Array<HydratedDocument<ISetting>>>
}

const settingSchema = new Schema<ISetting, ISettingModel>({
  name: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true }
})

settingSchema.static('getSettings', function getSettings(callback) {
  return new Promise<Array<HydratedDocument<ISetting>>>((resolve, reject) => {
    (async () => {
      try {
        const q = this.find().select('name value')
        if (typeof callback === 'function') return q.exec(callback)

        const result = await q.exec()

        return resolve(result)
      } catch (e) {
        if (typeof callback === 'function') return callback(e)

        return reject(e)
      }
    })()
  })
})

settingSchema.static('getSettingByName', async function getSettingByName(name, callback) {
  return new Promise((resolve, reject) => {
    (async () => {
      const q = this.findOne({ name })

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
})

settingSchema.static('getSettingsByName', async function getSettingByName(names, callback) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const q = this.find({ name: names })
        const result = await q.exec()
        if (typeof callback === 'function') callback(null, result)

        return resolve(result)
      } catch (e) {
        if (typeof callback === 'function') callback(e)

        return reject(e)
      }
    })()
  })
})

export const SettingModel = model<ISetting, ISettingModel>(COLLECTION, settingSchema)

export default SettingModel
module.exports = SettingModel
