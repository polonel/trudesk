import { DocumentType, modelOptions, pre, prop, Ref, ReturnModelType } from '@typegoose/typegoose'
import type { Types } from 'mongoose'
import utils from '../helpers/utils'
import { UserModelClass } from './user'

const COLLECTION = 'groups'

type GroupQueryObject = {
  limit?: number | string
  page?: number | string
  userId?: Types.ObjectId | string
}

@pre<GroupModelClass>(['find', 'findOne'], function () {
  this.populate('members', '_id username fullname email role preferences image title deleted').populate(
    'sendMailTo',
    '_id username fullname email role preferences image title deleted'
  )
})
@pre<GroupModelClass>('save', function (this: DocumentType<GroupModelClass>, next) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())

  return next()
})
@modelOptions({ options: { customName: COLLECTION } })
export class GroupModelClass {
  public _id!: Types.ObjectId
  @prop({ required: true, unique: true })
  public name!: string
  @prop({ ref: () => UserModelClass, default: [] })
  public members!: Ref<UserModelClass>[]
  @prop({ ref: () => UserModelClass, default: [] })
  public sendMailTo!: Ref<UserModelClass>[]
  @prop({ required: true, default: false })
  public public!: boolean

  public static async getGroupByName(this: ReturnModelType<typeof GroupModelClass>, name: string) {
    if (!name) throw new Error('Invalid Group Name')

    return this.findOne({ name: name }).exec()
  }

  public static async getGroupById(this: ReturnModelType<typeof GroupModelClass>, id: Types.ObjectId | string) {
    return this.findOne({ _id: id }).exec()
  }

  public static async getAllGroups(this: ReturnModelType<typeof GroupModelClass>) {
    return this.find({}).sort('name').exec()
  }

  public static async getAllPublicGroups(this: ReturnModelType<typeof GroupModelClass>) {
    return this.find({ public: true }).sort('name').exec()
  }

  public static async getAllGroupsOfUser(
    this: ReturnModelType<typeof GroupModelClass>,
    userId: Types.ObjectId | string
  ) {
    if (!userId) throw new Error('Invalid UserId')

    return this.find({ members: userId }).sort('name').exec()
  }

  public static async getWithObject(this: ReturnModelType<typeof GroupModelClass>, obj: GroupQueryObject) {
    const limit = obj.limit ? Number(obj.limit) : 100
    const page = obj.page ? Number(obj.page) : 0
    const userId = obj.userId

    if (userId) {
      return this.find({ members: userId })
        .limit(limit)
        .skip(page * limit)
        .sort('name')
        .exec()
    }

    return this.find({})
      .limit(limit)
      .skip(page * limit)
      .sort('name')
      .exec()
  }

  public static async getGroups(
    this: ReturnModelType<typeof GroupModelClass>,
    groupIds: Array<Types.ObjectId | string>
  ) {
    if (!groupIds) throw new Error('Invalid Array of Group IDs')

    return this.find({ _id: { $in: { groupIds } } }).sort('name')
  }
}
