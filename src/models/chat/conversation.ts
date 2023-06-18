import { modelOptions, prop, Ref, ReturnModelType, Severity } from "@typegoose/typegoose"
import type { Types } from 'mongoose'
import { UserModelClass } from "../user"

const COLLECTION = 'conversations'

@modelOptions({schemaOptions: {timestamps: true, _id: false}})
class UserConversationMeta {
  @prop({required: true, ref: () => UserModelClass})
  public userId!: Ref<UserModelClass>
  @prop({type: Date})
  public joinedAt?: Date
  @prop()
  public hasUnread?: boolean
  @prop({type: Date})
  public lastRead?: Date
  @prop({type: Date})
  public deletedAt?: Date
}

// const UserConversationMetaModel = getModelForClass(UserConversationMeta)

@modelOptions({options: {customName: COLLECTION, allowMixed: Severity.ALLOW}})
export class ConversationModelClass {
  public _id!: Types.ObjectId
  @prop()
  public title?: string
  @prop({ type: () => [UserConversationMeta]})
  public userMeta!: UserConversationMeta[]

  @prop({ref: () => UserModelClass})
  public participants!: Ref<UserModelClass>[]
  @prop({required: true, default: Date.now})
  public createdAt!: Date
  @prop({required: true, default: Date.now})
  public updatedAt!: Date

 public static async getConversations(
   this: ReturnModelType<typeof ConversationModelClass>,
   userId: Array<Types.ObjectId> | Types.ObjectId | string
 ) : Promise<ConversationModelClass[]> {
    return new Promise<Array<ConversationModelClass>>((resolve, reject) => {
      ;(async () => {
        try {
          const conversations = await this.find({ participants: { $size: 2, $all: userId}}).sort('-updatedAt').populate({
            path: 'participants',
            select: 'username fullname email title image lastOnline'
          }).exec()

          return resolve(conversations)
        } catch (err) {
          return reject(err)
        }
      })()
    })
 }

 public static async getConversationsWithLimit(
   this: ReturnModelType<typeof ConversationModelClass>,
   userId: Array<Types.ObjectId | string>,
   limit: number
 ) : Promise<ConversationModelClass[]> {
   return new Promise((resolve, reject) => {
     ;(async () => {
       try {
         const l = limit || 1000000
         const conversations = await this.find({ participants: userId })
           .sort('-updatedAt')
           .limit(l)
           .populate({
             path: 'participants',
             select: 'username fullname email title image lastOnline'
           }).exec()

         return resolve(conversations)
       } catch (e) {
         return reject(e)
       }
     })()
   })
 }

 public static async getConversation(
   this: ReturnModelType<typeof ConversationModelClass>,
   convoId: Types.ObjectId
 ): Promise<ConversationModelClass> {
   return new Promise((resolve, reject) => {
     ;(async () => {
       try {
         const conversation = await this.findOne({ _id: convoId })
           .populate('participants', '_id username fullname email title image lastOnline').exec() as ConversationModelClass

         return resolve(conversation)
       } catch (e) {
         return reject(e)
       }
     })()
   })
 }
}