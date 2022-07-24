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

import { CallbackError, Document, HydratedDocument, Model, model, Schema, Types } from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import _ from 'lodash'
import utils from '../helpers/utils'

export const COLLECTION = 'roles'

export interface IRole extends Document {
  name: string
  normalized: string
  description?: string
  grants: Array<string>
  hierarchy: boolean

  // Virtual
  isAdmin: boolean
  isAgent: boolean

  updateGrants(grants: Array<string>, callback: () => void): void

  updateGrantsAndHierarchy(grants: Array<string>, hierarchy: boolean, callback: () => void): void
}

interface IRoleModel extends Model<IRole> {
  getRoles(callback?: (err?: CallbackError, res?: Array<HydratedDocument<IRole>>) => void): Promise<Array<HydratedDocument<IRole>>>

  getRolesLean(callback: (err: CallbackError, roles: Array<IRole>) => void): void

  get(id: string | Types.ObjectId, callback: (err?: CallbackError, res?: HydratedDocument<IRole>) => void): Promise<HydratedDocument<IRole>>

  getRole(id: Types.ObjectId, callback: (err: CallbackError, role: HydratedDocument<IRole>) => void): Promise<HydratedDocument<IRole>>

  getRoleByName(name: string, callback: (err: CallbackError, role: HydratedDocument<IRole>) => void): Promise<HydratedDocument<IRole>>
}

const roleSchema = new Schema<IRole, IRoleModel>(
  {
    name: { type: String, required: true, unique: true },
    normalized: String,
    description: String,
    grants: [{ type: String, required: true }],
    hierarchy: { type: Boolean, required: true, default: true }
  },
  {
    toObject: { getters: true, virtuals: true },
    toJSON: { virtuals: true }
  }
)

roleSchema.virtual('isAdmin').get(function () {
  if (_.isUndefined(global.roles)) return false
  const role = _.find(global.roles, r => r.normalized === this.normalized)
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

roleSchema.pre('save', function (next) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())
  this.normalized = utils.sanitizeFieldPlainText(this.name.toLowerCase().trim())

  return next()
})

roleSchema.method('updateGrants', function (grants, callback) {
  this.grants = grants
  this.save(callback)
})

roleSchema.method('updateGrantsAndHierarchy', function (grants, hierarchy, callback) {
  this.grants = grants
  this.hierarchy = hierarchy
  this.save(callback)
})

roleSchema.static('getRoles', function getRoles(callback) {
  return this.find({})
    .exec(callback)
})

roleSchema.static('getRolesLean', function (callback): void {
  return this.find({})
    .lean({ virtuals: true })
    .exec(callback)
})

roleSchema.static('getRole', function getRole(id, callback) {
  const q = this.findOne({ _id: id })

  return q.exec(callback)
})

roleSchema.static('getRoleByName', function getRoleByName(name, callback) {
  const q = this.findOne({ normalized: new RegExp('^' + name.trim() + '$', 'i') })

  return q.exec(callback)
})

roleSchema.static('getAgentRoles', function getAgentRoles(callback) {
  const q = this.find({})
  q.exec(function (err, roles) {
    if (err) return callback(err)

    const rolesWithAgent = _.filter(roles, function (role) {
      return _.indexOf(role.grants, 'agent:*') !== -1
    })

    return callback(null, rolesWithAgent)
  })
})

// Alias
roleSchema.static('get', function get() {
  return roleSchema.statics.getRole
})

export const RoleModel = model<IRole, IRoleModel>(COLLECTION, roleSchema)

export default RoleModel

module.exports = RoleModel