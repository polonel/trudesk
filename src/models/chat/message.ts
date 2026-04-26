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
 *  Updated:    1/21/19 2:04 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { DocumentType, modelOptions, pre, prop, Ref, ReturnModelType } from '@typegoose/typegoose'
import type { Types } from 'mongoose'
import { UserModelClass } from '../user'
import { ConversationModelClass } from './conversation'
import utils from '../../helpers/utils'

const COLLECTION = 'messages'

interface ConversationWithObject {
  cid?: Types.ObjectId | string
  limit?: number
  page?: number
  requestingUser?: { _id: Types.ObjectId }
  userMeta?: Array<{ userId: Types.ObjectId; deletedAt?: Date }>
}

@pre<MessageClass>('save', function (this: DocumentType<MessageClass>, next) {
  this.body = utils.sanitizeFieldPlainText(utils.applyExtremeTextLength(this.body))
  return next()
})
@modelOptions({ options: { customName: COLLECTION }, schemaOptions: { timestamps: true } })
export class MessageClass {
  public _id!: Types.ObjectId

  @prop({ required: true, index: true, ref: () => ConversationModelClass })
  public conversation!: Ref<ConversationModelClass>

  @prop({ required: true, index: true, ref: () => UserModelClass })
  public owner!: Ref<UserModelClass>

  @prop({ required: true })
  public body!: string

  public createdAt!: Date
  public updatedAt!: Date

  public static async getFullConversation(
    this: ReturnModelType<typeof MessageClass>,
    convoId: Types.ObjectId | string
  ) {
    return this.find({ conversation: convoId })
      .select('createdAt body owner')
      .sort('-createdAt')
      .populate({ path: 'owner', select: '_id username fullname email image lastOnline' })
      .exec()
  }

  public static async getConversation(
    this: ReturnModelType<typeof MessageClass>,
    convoId: Types.ObjectId | string
  ) {
    return this.find({ conversation: convoId })
      .select('createdAt body owner')
      .sort('-createdAt')
      .limit(25)
      .populate({ path: 'owner', select: '_id username fullname email image lastOnline' })
      .exec()
  }

  public static async getConversationWithObject(
    this: ReturnModelType<typeof MessageClass>,
    object: ConversationWithObject
  ) {
    const limit = object.limit ?? 25
    const page = object.page ?? 0

    let deletedAt: Date | null = null
    if (object.requestingUser && object.userMeta) {
      const meta = object.userMeta.find(
        item => item.userId.toString() === object.requestingUser!._id.toString()
      )
      if (meta?.deletedAt) deletedAt = new Date(meta.deletedAt)
    }

    const query = this.find({})
      .sort('-createdAt')
      .skip(page * limit)
      .populate({ path: 'owner', select: '_id username fullname email image lastOnline' })

    if (limit !== -1) query.limit(limit)
    if (object.cid) query.where({ conversation: object.cid })
    if (deletedAt) query.where({ createdAt: { $gte: deletedAt } })

    return query.exec()
  }

  public static async getMostRecentMessage(
    this: ReturnModelType<typeof MessageClass>,
    convoId: Types.ObjectId | string
  ) {
    return this.find({ conversation: convoId })
      .sort('-createdAt')
      .limit(1)
      .populate({ path: 'owner', select: '_id username fullname image lastOnline' })
      .exec()
  }
}
