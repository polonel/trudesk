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

import { DocumentType, modelOptions, plugin, pre, prop, Ref, ReturnModelType } from '@typegoose/typegoose'
import { isArray, reject } from "lodash"
import type { Types } from "mongoose"
import mongooseAutoPopulate from "mongoose-autopopulate"
import utils from '../helpers/utils'
import { TicketPriorityClass } from "./ticketpriority"

const COLLECTION = 'tickettypes'

@pre('save', function(this: DocumentType<TicketTypeClass>, next) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())

  return next()
})
@plugin(mongooseAutoPopulate as any)
@modelOptions({options: {customName: COLLECTION}})
export class TicketTypeClass {
  public _id!: Types.ObjectId
  @prop({required: true, unique: true})
  public name!: string
  @prop({ref: () => TicketPriorityClass, autopopulate: true})
  public priorities!: Ref<TicketPriorityClass>[]

  // Statics
  public static async getTypes(this: ReturnModelType<typeof TicketTypeClass>) {
    return this.find({}).exec()
  }

  public static async getType(this: ReturnModelType<typeof TicketTypeClass>, id: string | Types.ObjectId, callback?: any) {
    const query = this.findOne({_id: id})
    if (typeof callback === 'function') return query.exec(callback)

    return query.exec()
  }

  public static async getTypeByName(this: ReturnModelType<typeof TicketTypeClass>, name: string) {
    return this.findOne({name: name}).exec()
  }

  // Methods
  public async addPriority(this: DocumentType<TicketTypeClass>, priorityId: Types.ObjectId) {
    return new Promise((resolve, reject) => {
      if (!priorityId) return reject({message: 'Invalid priorityId'})

      if (!isArray(this.priorities)) {
        this.priorities = []
      }

      this.priorities.push(priorityId)

      return resolve(this)
    })
  }

  public async removePriority(this: DocumentType<TicketTypeClass>, priorityId: Types.ObjectId) {
    return new Promise((resolve, __reject) => {
      if (!priorityId) return __reject({message: 'Invalid priorityId'})

      this.priorities = reject(this.priorities, p => {
          if (!p) return true
          return p._id.toString() === priorityId.toString()
      })

      return resolve(this)
    })
  }
}