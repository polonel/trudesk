/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    10/28/2018
 Author:     Chris Brame

 **/

import _ from 'lodash'
import { CallbackError, Document, HydratedDocument, Model, model, Schema, Types } from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import utils from '../helpers/utils'

export const COLLECTION = 'roles'

export interface IRole extends Document {
  name: string
  normalized: string
  description?: string
  grants: Array<string>
  hierarchy: boolean

  // Virtuals
  isAdmin: boolean
  isAgent: boolean

  // Instance methods
  updateGrants(grants: Array<string>, callback: () => void): void
  updateGrantsAndHierarchy(grants: Array<string>, hierarchy: boolean, callback?: () => void): Promise<IRole>
}

interface IRoleMethods {
  updateGrants(grants: Array<string>, callback: () => void): void

  updateGrantsAndHierarchy(grants: Array<string>, hierarchy: boolean, callback?: () => void): Promise<HydratedDocument<IRole>>
}

export interface IRoleModel extends Model<IRole, Record<string, never>, IRoleMethods> {
  _id: Types.ObjectId
  isAdmin: boolean
  isAgent: boolean

  getRoles(
    callback?: (err?: CallbackError, res?: Array<HydratedDocument<IRole>>) => void
  ): Promise<Array<HydratedDocument<IRole>>>

  getRolesLean(callback?: (err: CallbackError, roles: Array<IRole>) => void): Promise<Array<IRole>>

  get(
    id: string | Types.ObjectId,
    callback: (err?: CallbackError, res?: HydratedDocument<IRole>) => void
  ): Promise<HydratedDocument<IRole>>

  getRole(
    id: Types.ObjectId,
    callback: (err: CallbackError, role: HydratedDocument<IRole>) => void
  ): Promise<HydratedDocument<IRole>>

  getRoleByName(
    name: string,
    callback?: (err: CallbackError, role: HydratedDocument<IRole>) => void
  ): Promise<HydratedDocument<IRole>>
}

const roleSchema = new Schema<IRole, IRoleModel, IRoleMethods>(
  {
    name: { type: String, required: true, unique: true },
    normalized: String,
    description: String,
    grants: [{ type: String, required: true }],
    hierarchy: { type: Boolean, required: true, default: true },
  },
  {
    toObject: { getters: true, virtuals: true },
    toJSON: { virtuals: true },
  }
)

roleSchema.virtual('isAdmin').get(function () {
  if (_.isUndefined(global.roles)) return false
  const role = _.find(global.roles, (r) => r.normalized === this.normalized)
  if (!role) return false

  return _.indexOf(role.grants, 'admin:*') !== -1
})

roleSchema.virtual('isAgent').get(function () {
  if (_.isUndefined(global.roles)) return false
  const role = _.find(global.roles, { normalized: this.normalized })
  if (!role) return false

  return _.indexOf(role.grants, 'agent:*') !== -1
})

roleSchema.plugin(mongooseLeanVirtuals)

roleSchema.pre('save', async function () {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())
  this.normalized = utils.sanitizeFieldPlainText(this.name.toLowerCase().trim())
})

roleSchema.method('updateGrants', function (grants, callback) {
  this.grants = grants
  this.save().then(r => callback(null, r)).catch(e => callback(e))
})

roleSchema.method('updateGrantsAndHierarchy', function (grants, hierarchy, callback) {
  this.grants = grants
  this.hierarchy = hierarchy
  if (typeof callback === 'function') {
    return this.save().then(r => callback(null, r)).catch(e => callback(e))
  }
  return this.save()
})

roleSchema.static('getRoles', function getRoles(callback?) {
  const p = this.find({}).exec()
  if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
  return p
})

roleSchema.static('getRolesLean', function (callback?): void {
  const p = this.find({}).lean({ virtuals: true }).exec()
  if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
  return p
})

roleSchema.static('getRole', function getRole(id, callback?) {
  const p = this.findOne({ _id: id }).exec()
  if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
  return p
})

roleSchema.static('getRoleByName', function getRoleByName(name, callback?) {
  const p = this.findOne({ normalized: new RegExp('^' + name.trim() + '$', 'i') }).exec()
  if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
  return p
})

roleSchema.static('getAgentRoles', function getAgentRoles(callback?) {
  const p = this.find({}).exec().then(function (roles) {
    return _.filter(roles, function (role) {
      return _.indexOf(role.grants, 'agent:*') !== -1
    })
  })
  if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
  return p
})

export const RoleModel = model<IRole, IRoleModel>(COLLECTION, roleSchema)

export default RoleModel

module.exports = RoleModel
