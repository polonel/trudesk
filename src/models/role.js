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

var mongoose = require('mongoose')
var mongooseLeanVirtuals = require('mongoose-lean-virtuals')
var _ = require('lodash')

var COLLECTION = 'roles'

var roleSchema = mongoose.Schema(
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
  var role = _.find(global.roles, { normalized: this.normalized })
  if (!role) return false

  return _.indexOf(role.grants, 'admin:*') !== -1
})

roleSchema.virtual('isAgent').get(function () {
  if (_.isUndefined(global.roles)) return false
  var role = _.find(global.roles, { normalized: this.normalized })
  if (!role) return false

  return _.indexOf(role.grants, 'agent:*') !== -1
})

roleSchema.plugin(mongooseLeanVirtuals)

roleSchema.pre('save', function (next) {
  this.name = this.name.trim()
  this.normalized = this.name.toLowerCase().trim()

  return next()
})

roleSchema.methods.updateGrants = function (grants, callback) {
  this.grants = grants
  this.save(callback)
}

roleSchema.methods.updateGrantsAndHierarchy = function (grants, hierarchy, callback) {
  this.grants = grants
  this.hierarchy = hierarchy
  this.save(callback)
}

roleSchema.statics.getRoles = function (callback) {
  return this.model(COLLECTION)
    .find({})
    .exec(callback)
}

roleSchema.statics.getRolesLean = function (callback) {
  return this.model(COLLECTION)
    .find({})
    .lean({ virtuals: true })
    .exec(callback)
}

roleSchema.statics.getRole = function (id, callback) {
  var q = this.model(COLLECTION).findOne({ _id: id })

  return q.exec(callback)
}

roleSchema.statics.getRoleByName = function (name, callback) {
  var q = this.model(COLLECTION).findOne({ normalized: new RegExp('^' + name.trim() + '$', 'i') })

  return q.exec(callback)
}

roleSchema.statics.getAgentRoles = function (callback) {
  var q = this.model(COLLECTION).find({})
  q.exec(function (err, roles) {
    if (err) return callback(err)

    var rolesWithAgent = _.filter(roles, function (role) {
      return _.indexOf(role.grants, 'agent:*') !== -1
    })

    return callback(null, rolesWithAgent)
  })
}

// Alias
roleSchema.statics.get = roleSchema.statics.getRole

module.exports = mongoose.model(COLLECTION, roleSchema)
