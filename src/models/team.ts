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
 *  Updated:    7/27/22 12:50 AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import { DocumentType, modelOptions, pre, prop, Ref, ReturnModelType } from '@typegoose/typegoose'
import _ from 'lodash'
import type { Types } from 'mongoose'
import utils from '../helpers/utils'
import { UserModelClass } from './user'

const COLLECTION = 'teams'

type TeamQueryObj = {
  limit?: number
  page?: number
}

@pre('validate', function (this: DocumentType<TeamModelClass>) {
  this.normalized = utils.sanitizeFieldPlainText(this.name.trim().toLowerCase())
})
@pre('save', function (this: DocumentType<TeamModelClass>, next) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())

  return next()
})
@modelOptions({ options: { customName: COLLECTION } })
export class TeamModelClass {
  public _id!: Types.ObjectId
  @prop({ required: true, unique: true })
  public name!: string
  @prop({ required: true, unique: true, lowercase: true })
  public normalized!: string
  @prop({ ref: () => UserModelClass })
  public members!: Ref<UserModelClass>[]

  // Statics
  public static async getWithObject(this: ReturnModelType<typeof TeamModelClass>, obj: TeamQueryObj) {
    if (!obj) throw new Error('Invalid Object - Team.getWithObject()')

    const limit = obj.limit || 10
    const page = obj.page || 0

    return this.find({})
      .skip(limit * page)
      .limit(limit)
      .sort('name')
      .populate('members')
      .exec()
  }

  public static async getTeamByName(this: ReturnModelType<typeof TeamModelClass>, name: string) {
    if (!name) throw new Error('Invalid Team Name')

    return this.findOne({ normalized: name.toLowerCase() }).exec()
  }

  public static async getTeam(this: ReturnModelType<typeof TeamModelClass>, id: string | Types.ObjectId) {
    if (!id) throw new Error('Invalid TeamId')

    return this.findOne({ _id: id }).exec()
  }

  public static async getTeams(this: ReturnModelType<typeof TeamModelClass>) {
    return this.find({}).sort('name').exec()
  }

  public static async getTeamsByIds(this: ReturnModelType<typeof TeamModelClass>, ids: Array<Types.ObjectId>) {
    return this.find({ _id: { $in: ids } })
      .sort('name')
      .exec()
  }

  public static async getTeamsOfUser(this: ReturnModelType<typeof TeamModelClass>, userId: Types.ObjectId | string) {
    if (!userId) throw new Error('Invalid UserId')

    return this.find({ members: userId }).sort('name').exec()
  }

  public addMember(this: DocumentType<TeamModelClass>, memberId: Types.ObjectId): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      ;(async () => {
        if (_.isUndefined(memberId)) {
          return reject(new Error('Invalid MemberId - TeamSchema.AddMember()'))
        }

        if (this.members === null) this.members = []

        this.members.push(memberId)
        this.members = _.uniq(this.members)

        return resolve(true)
      })()
    })
  }

  public removeMember(this: DocumentType<TeamModelClass>, memberId: Types.ObjectId): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      ;(async () => {
        if (_.isUndefined(memberId)) return reject(new Error('Invalid MemberId - TeamSchema.AddMember()'))

        if (!isMember(this.members as UserModelClass[], memberId)) return resolve(false)

        this.members.splice(_.indexOf(this.members, _.find(this.members, { _id: memberId })), 1)

        this.members = _.uniq(this.members)

        return resolve(true)
      })()
    })
  }

  public isMember(this: DocumentType<TeamModelClass>, memberId: Types.ObjectId): boolean {
    return isMember(this.members as UserModelClass[], memberId)
  }
}

const isMember = (members: UserModelClass[], id: string | Types.ObjectId) => {
  const matches = _.filter(members, (value) => {
    if (value._id.toString() === id.toString()) return value
    return null
  })

  return matches.length > 0
}
