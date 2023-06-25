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
 *  Updated:    6/22/23 8:08 PM
 *  Copyright (c) 2014-2023. All rights reserved.
 */

import { DocumentType, modelOptions, pre, prop, ReturnModelType } from '@typegoose/typegoose'
import _ from 'lodash'
import type { Types } from 'mongoose'
import utils from '../helpers/utils'
import Counters from './counters'

const COLLECTION = 'statuses'

@pre('validate', async function(this: DocumentType<TicketStatusClass>) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())

  if (!_.isUndefined(this.uid) || this.uid)
    return

  // @ts-ignore
  const res = await Counters.increment('status')
  this.uid = res.value.next
  if (!this.uid)
    throw new Error('Invalid UID')
})
@modelOptions({ options: {customName: COLLECTION}, schemaOptions: { toJSON: { virtuals: true}}})
export class TicketStatusClass {
  public _id!: Types.ObjectId
  @prop({required: true, unique: true})
  public name!: string
  @prop({required: true, default: '#29b955'})
  public htmlColor!: string
  @prop({required: true, unique: true})
  public uid!: number
  @prop({required: true, index: true, default: 999})
  public order!: number
  @prop({required: true, default: true})
  public slatimer!: boolean
  @prop({required: true, default: false})
  public isResolved!: boolean
  @prop({required: true, default: false})
  public isLocked!: boolean

  public static async getStatuses(this: ReturnModelType<typeof TicketStatusClass>): Promise<DocumentType<TicketStatusClass>[] | []> {
    return this.find({}).sort({order: 1}).exec()
  }

  public static async getStatusById(this: ReturnModelType<typeof TicketStatusClass>, _id: string | Types.ObjectId) : Promise<DocumentType<TicketStatusClass> | null> {
    return this.findOne({_id}).exec()
  }

  public static async getStatusByUID(this: ReturnModelType<typeof TicketStatusClass>, uid: number) : Promise<DocumentType<TicketStatusClass> | null> {
    return this.findOne({uid}).exec()
  }
}