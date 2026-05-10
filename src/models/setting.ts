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
 *  Updated:    7/25/22 2:14 AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import { getModelForClass, modelOptions, prop, ReturnModelType, Severity } from '@typegoose/typegoose'

const COLLECTION = 'settings'

@modelOptions({ options: { customName: COLLECTION, allowMixed: Severity.ALLOW } })
export class SettingModelClass {
  @prop({ required: true, unique: true })
  public name!: string
  @prop({ required: true })
  public value!: string | number | boolean | object

  public static async getSettings(this: ReturnModelType<typeof SettingModelClass>, callback?: any) {
    const p = this.find({}).select('name value').exec()
    if (typeof callback === 'function') return p.then((r: any) => callback(null, r)).catch((e: any) => callback(e))
    return p
  }

  public static async getSettingByName(this: ReturnModelType<typeof SettingModelClass>, name: string, callback?: any) {
    const p = this.findOne({ name }).exec()
    if (typeof callback === 'function') return p.then((r: any) => callback(null, r)).catch((e: any) => callback(e))
    return p
  }

  public static async getSettingsByName(
    this: ReturnModelType<typeof SettingModelClass>,
    name: string[],
    callback?: any,
    select?: string
  ) {
    const query = this.find({ name })
    if (select) query.select(select)
    const p = query.exec()
    if (typeof callback === 'function') return p.then((r: any) => callback(null, r)).catch((e: any) => callback(e))
    return p
  }
}

const SettingModel = getModelForClass(SettingModelClass)
export default SettingModel
module.exports = SettingModel
