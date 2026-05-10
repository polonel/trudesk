/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 */

import { DocumentType, modelOptions, pre, prop, ReturnModelType } from '@typegoose/typegoose'
import type { Types } from 'mongoose'
import utils from '../helpers/utils'

const COLLECTION = 'notices'

@pre<NoticeClass>('save', async function (this: DocumentType<NoticeClass>) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())
  this.message = utils.sanitizeFieldPlainText(this.message.trim())
})
@modelOptions({ options: { customName: COLLECTION } })
export class NoticeClass {
  public _id!: Types.ObjectId

  @prop({ required: true })
  public name!: string

  @prop({ required: true, default: Date.now })
  public date!: Date

  @prop({ required: true, default: '#e74c3c' })
  public color!: string

  @prop({ required: true, default: '#ffffff' })
  public fontColor!: string

  @prop({ required: true })
  public message!: string

  @prop({ required: true, default: false })
  public active!: boolean

  @prop({ default: Date.now })
  public activeDate?: Date

  @prop({ default: false })
  public alertWindow?: boolean

  public static async getNotices(
    this: ReturnModelType<typeof NoticeClass>
  ): Promise<DocumentType<NoticeClass>[]> {
    return this.find({}).exec()
  }

  public static async getNotice(
    this: ReturnModelType<typeof NoticeClass>,
    id: Types.ObjectId | string
  ): Promise<DocumentType<NoticeClass> | null> {
    return this.findOne({ _id: id }).exec()
  }

  public static async getNoticeByName(
    this: ReturnModelType<typeof NoticeClass>,
    name: string
  ): Promise<DocumentType<NoticeClass>[]> {
    return this.find({ name }).exec()
  }

  public static async getActive(
    this: ReturnModelType<typeof NoticeClass>
  ): Promise<DocumentType<NoticeClass> | null> {
    return this.findOne({ active: true }).exec()
  }
}
