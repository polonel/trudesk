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
 *  Updated:    7/24/22 2:27 AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import { DocumentType, getModelForClass, modelOptions, pre, prop, Ref, ReturnModelType } from "@typegoose/typegoose";
import bcrypt from 'bcrypt'
import Chance from "chance";
import _ from "lodash";
import type { Types } from "mongoose";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import base32 from 'thirty-two'
import utils from '../helpers/utils'
import type { IRoleModel, RoleModel } from './role'

type UserQueryObj = {
  limit?: number
  page?: number
  showDeleted?: boolean
}

const COLLECTION = 'accounts'
const SALT_FACTOR = 10

class UserPreferences {
  @prop({ default: false })
  public tourCompleted?: boolean
  @prop({ default: true })
  public autoRefreshTicketGrid?: boolean
  @prop({ default: [], type: String })
  public openChatWindows?: string[]
  @prop({ default: true })
  public keyboardShortcuts?: boolean
  @prop()
  public timezone?: string
}

@pre<UserModelClass>(['findOne', 'find'], function () {
  this.populate('role', 'name description normalized _id')
})

@pre<UserModelClass>('save', function (this: DocumentType<UserModelClass>, next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this

  user.username = utils.applyMaxShortTextLength(utils.sanitizeFieldPlainText(user.username.toLowerCase().trim()))
  user.email = utils.sanitizeFieldPlainText(user.email.trim())

  if (user.fullname) user.fullname = utils.applyMaxShortTextLength(utils.sanitizeFieldPlainText(user.fullname.trim()))
  if (user.title) user.title = utils.applyMaxShortTextLength(utils.sanitizeFieldPlainText(user.title.trim()))

  if (!user.isModified('password')) {
    return next()
  }

  if (user.password.toString().length > 255) user.password = utils.applyMaxTextLength(user.password)

  bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
    if (err) return next(err)

    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err)

      user.password = hash
      return next()
    })
  })
})

@modelOptions({ options: { customName: COLLECTION } })
export class UserModelClass {
  @prop({ required: true, unique: true })
  public username!: string
  @prop({ required: true, select: false })
  public password!: string
  @prop({ required: true, unique: true })
  public email!: string
  @prop({ required: true, index: true })
  public fullname?: string
  @prop()
  public title?: string
  @prop()
  public image?: string

  @prop()
  public workNumber?: string
  @prop()
  public mobileNumber?: string
  @prop()
  public companyName?: string
  @prop()
  public facebookUrl?: string
  @prop()
  public linkedinUrl?: string
  @prop()
  public twitterUrl?: string

  @prop({ ref: 'roles', required: true })
  public role!: Ref<typeof RoleModel>

  @prop({ select: false })
  public resetPassHash?: string
  @prop({ select: false })
  public resetPassExpire?: Date
  @prop({ select: false })
  public tOTPKey?: string
  @prop({ select: false })
  public tOTPPeriod?: string
  @prop({ required: true, default: false })
  public hasL2Auth!: boolean
  @prop({ sparse: true, select: false })
  public accessToken?: string

  @prop({ _id: false })
  preferences?: UserPreferences

  @prop()
  public lastOnline?: Date
  @prop()
  public deleted?: boolean

  // ----- STATICS
  public static validatePassword(this: ReturnModelType<typeof UserModelClass>, password: string, dbPass: string): boolean {
    return bcrypt.compareSync(password, dbPass)
  }

  public static async getUser(this: ReturnModelType<typeof UserModelClass>, oId: string | Types.ObjectId) {
    if (!oId) throw new Error('Invalid Object Id (String | ObjectId)')
    return this.findOne({ _id: oId })
  }

  public static async getByUsername(this: ReturnModelType<typeof UserModelClass>, username: string) {
    if (!username) throw new Error('Invalid Username')
    return this.findOne({ username: new RegExp(`^${username}$`, 'i') })
      .populate('role', 'name description normalized _id')
      .select('+password +accessToken')
  }

  public static async getByEmail(this: ReturnModelType<typeof UserModelClass>, email: string) {
    if (!email) throw new Error('Invalid Email')

    return this.findOne({ email: email.toLowerCase() })
  }

  public static async getUserByResetHash(this: ReturnModelType<typeof UserModelClass>, resethash: string) {
    if (!resethash) throw new Error('Invalid ResetHash')

    return this.findOne({ resetPassHash: resethash, deleted: false }, '+resetPassHash +resetPassExpire')
  }

  public static async getCustomers(this: ReturnModelType<typeof UserModelClass>, obj: UserQueryObj) {
    const limit = obj.limit || 10
    const page = obj.page || 0
    const accounts = await this.find({}, '-password -resetPassHash -resetPassExpire')

    const customerRoleIds = _.filter(accounts, a => {
      return !(a.role as IRoleModel)?.isAdmin && !(a.role as IRoleModel)?.isAgent
    }).map(a => {
      return (a.role as IRoleModel)?._id
    })

    const query = this.find({ role: { $in: customerRoleIds } }, '-password -resetPassHash -resetPassExpire')
      .sort({ fullname: 1 })
      .skip(page * limit)
      .limit(limit)

    if (!obj.showDeleted) query.where({ deleted: false })

    return query.exec()
  }

  public static async getAgents(this: ReturnModelType<typeof UserModelClass>, obj: UserQueryObj) {
    const limit = obj.limit || 10
    const page = obj.page || 0
    const accounts = await this.find({})

    const agentRoleIds = _.filter(accounts, a => (a.role as IRoleModel)?.isAgent).map(a => (a.role as IRoleModel)?._id)

    const query = this.find({ role: { $in: agentRoleIds } }, '-password -resetPassHash -resetPassExpire')
      .sort({ fullname: 1 })
      .skip(page * limit)
      .limit(limit)

    if (!obj.showDeleted) query.where({ deleted: false })

    return query.exec()
  }

  public static async getAdmins(this: ReturnModelType<typeof UserModelClass>, obj: UserQueryObj) {
    const limit = obj.limit || 10
    const page = obj.page || 0
    const accounts = await this.find({})

    const adminRoleIds = _.filter(accounts, a => (a.role as IRoleModel)?.isAdmin).map(a => (a.role as IRoleModel)?._id)

    const query = this.find({ role: { $in: adminRoleIds } }, '-password -resetPassHash -resetPassExpire')
      .sort({ fullname: 1 })
      .skip(page * limit)
      .limit(limit)

    if (!obj.showDeleted) query.where({ deleted: false })

    return query.exec()
  }

  // ----- METHODS
  public async generateL2Auth(this: DocumentType<UserModelClass>) {
    return new Promise((resolve, reject) => {
      if (_.isUndefined(this.tOTPKey) || _.isNull(this.tOTPKey)) {
        const chance = new Chance()

        const genOTPKey = chance.string({
          length: 7,
          pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'
        })

        const base32GenOTPKey = base32
          .encode(genOTPKey)
          .toString()
          .replace(/=/g, '')

        return resolve(base32GenOTPKey)
      } else {
        const error = new Error('FATAL: Key already assigned!')

        return reject(error)
      }
    })
  }

  public async removeL2Auth(this: DocumentType<UserModelClass>) {
    delete this.tOTPKey
    this.hasL2Auth = false
    return this.save()
  }

  public async softDelete(this: DocumentType<UserModelClass>): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      (async () => {
        try {
          this.deleted = true
          await this.save()
          return resolve(true)
        } catch (error) {
          return reject(false)
        }
      })()
    })
  }
}

const UserModel = getModelForClass(UserModelClass)

export default UserModel
module.exports = UserModel

