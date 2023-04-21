import { DocumentType, modelOptions, prop, Ref, ReturnModelType, Severity } from "@typegoose/typegoose"
import type { Types } from "mongoose"
import { UserModelClass } from "./user"

export const COLLECTION = "notification"

@modelOptions({options: {customName: COLLECTION, allowMixed: Severity.ALLOW}})
export class NotificationModelClass {
  public _id!: Types.ObjectId
  @prop({default: Date.now})
  public created!: Date
  @prop({required: true})
  public title!: string
  @prop({required: true})
  public message!: string
  @prop()
  public type?: number
  @prop()
  public data?: object

  @prop({default: true})
  public unread!: boolean
  @prop({ ref: () => UserModelClass })
  public owner!: Ref<UserModelClass>

  public static async getNotification(this: ReturnModelType<typeof NotificationModelClass>, id: Types.ObjectId) {
    if (!id) throw new Error('Invalid Notification ID')

    return this.findOne({_id: id}).exec()
  }

  public static async findAllForUser(this: ReturnModelType<typeof NotificationModelClass>, userId: Types.ObjectId) {
    if (!userId) throw new Error('Invalid User ID')

    return this.find({owner: userId}).sort({created: -1}).limit(100).exec()
  }

  public static async getForUserWithLimit(this: ReturnModelType<typeof NotificationModelClass>, userId: Types.ObjectId) {
    if (!userId) throw new Error('Invalid User ID')

    return this.find({owner: userId}).sort({created: -1}).limit(5).exec()
  }

  public static async getCount(this: ReturnModelType<typeof NotificationModelClass>, userId: Types.ObjectId) {
    if (!userId) throw new Error('Invalid User ID')

    return this.countDocuments({owner: userId}).exec()
  }

  public static async getUnreadCount(this: ReturnModelType<typeof NotificationModelClass>, userId: Types.ObjectId) {
    if (!userId) throw new Error('Invalid User ID')

    return this.countDocuments({owner: userId, unread: true}).exec()
  }

  public static async clearNotifications(this: ReturnModelType<typeof NotificationModelClass>, userId: Types.ObjectId) {
    if (!userId) throw new Error('Invalid User ID')

    return this.deleteMany({owner: userId}).exec()
  }

  public markRead (this: DocumentType<NotificationModelClass>) : Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.unread = false
      return resolve(true)
    })
  }
}