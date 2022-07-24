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

import utils from '../helpers/utils'
import { DocumentType, getModelForClass, modelOptions, pre, prop, ReturnModelType } from "@typegoose/typegoose";
import type { Types } from "mongoose"

const COLLECTION = 'tags'

@pre<TicketTagClass>('save', function (this: DocumentType<TicketTagClass>) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())
  this.normalized = utils.sanitizeFieldPlainText(this.name.toLowerCase().trim())
})

@modelOptions({ options: { customName: COLLECTION } })
class TicketTagClass {
  @prop({ required: true, unique: true })
  public name!: string

  @prop({ lowercase: true })
  public normalized?: string

  public static async getTag(this: ReturnModelType<typeof TicketTagClass>, id: string | Types.ObjectId) {
    return this.findOne({ _id: id });
  }

  public static async getTags(this: ReturnModelType<typeof TicketTagClass>) {
    return this.find({}).sort('normalized')
  }

  public static async getTagsWithLimit(this: ReturnModelType<typeof TicketTagClass>, limit: number, page: number) {
    const query = this.find({}).sort('normalized')
    if (limit !== -1)
      query.limit(limit).skip(page * limit)

    return query.exec()
  }

  public static async getTagByName(this: ReturnModelType<typeof TicketTagClass>, tagName: string) {
    return this.findOne({ name: tagName })
  }

  public static async tagExist(this: ReturnModelType<typeof TicketTagClass>, tagName: string) {
    return this.countDocuments({ name: tagName })
  }

  public static async getTagCount(this: ReturnModelType<typeof TicketTagClass>) {
    return this.countDocuments({}).lean()
  }
}

const TagModel = getModelForClass(TicketTagClass)

export default TagModel
module.exports = TagModel
