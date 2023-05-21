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
 *  Updated:    4/23/22 10:12 PM
 *  Copyright (c) 2014-2023. All rights reserved.
 */

import { DocumentType, modelOptions, pre, prop, ReturnModelType } from '@typegoose/typegoose'
import moment from 'moment'
import 'moment-duration-format'
import type { Types } from "mongoose"
import utils from '../helpers/utils'

const COLLECTION = 'priorities'

@pre('save', function(this: DocumentType<TicketPriorityClass>, next) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())

  return next()
})
@modelOptions({options: {customName: COLLECTION}, schemaOptions: { toJSON: {virtuals: true}}})
export class TicketPriorityClass {
  public _id!: Types.ObjectId
  @prop({required: true, unique: true})
  public name!: string
  @prop({required: true, default: 2880})
  public overdueIn!: number
  @prop({default: '#29b955'})
  public htmlColor?: string

  @prop({index: true})
  public migrationNum?: number
  @prop()
  public default?: boolean

  // Virtuals
  public get durationFormatted() {
    const momentDuration = moment.duration(this.overdueIn, 'minutes')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return momentDuration.format('Y [year], M [month], d [day], h [hour], m [min]', { trim: 'both' })
  }

  // Statics
  public static async getPriorities(this: ReturnModelType<typeof TicketPriorityClass>) {
    return this.find({}).exec()
  }

  public static async getPriority(this: ReturnModelType<typeof TicketPriorityClass>, id: Types.ObjectId) {
      if (!id) throw new Error('Invalid Priority Id')

      return this.findOne({_id: id}).exec()
  }

  public static async getByMigrationNum(this: ReturnModelType<typeof TicketPriorityClass>, migrationNum: number) {
    if (!migrationNum) throw new Error('Invalid Migration Number')
    return this.findOne({migrationNum: migrationNum}).exec()
  }
}