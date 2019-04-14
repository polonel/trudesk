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
 *  Updated:    3/28/19 2:13 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var mongoose = require('mongoose')

// Refs
require('./user')

var COLLECTION = 'teams'

var teamSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  normalized: { type: String, required: true, unique: true, lowercase: true },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'accounts',
      autopopulate: { select: '-hasL2Auth -preferences -__v' }
    }
  ]
})

teamSchema.plugin(require('mongoose-autopopulate'))

teamSchema.pre('validate', function () {
  this.normalized = this.name.trim().toLowerCase()
})

teamSchema.pre('save', function (next) {
  this.name = this.name.trim()

  return next()
})

teamSchema.methods.addMember = function (memberId, callback) {
  if (_.isUndefined(memberId)) return callback('Invalid MemberId - TeamSchema.AddMember()')

  if (this.members === null) this.members = []

  if (isMember(this.members, memberId)) return callback(null, false)

  this.members.push(memberId)
  this.members = _.uniq(this.members)

  return callback(null, true)
}

teamSchema.methods.removeMember = function (memberId, callback) {
  if (_.isUndefined(memberId)) return callback('Invalid MemberId - TeamSchema.RemoveMember()')

  if (!isMember(this.members, memberId)) return callback(null, false)

  this.members.splice(_.indexOf(this.members, _.find(this.members, { _id: memberId })), 1)

  this.members = _.uniq(this.members)

  return callback(null, true)
}

teamSchema.methods.isMember = function (memberId) {
  return isMember(this.members, memberId)
}

teamSchema.statics.getWithObject = function (obj, callback) {
  if (!obj) return callback({ message: 'Invalid Team Object - TeamSchema.GetWithObject()' })

  var q = this.model(COLLECTION)
    .find({})
    .skip(obj.limit * obj.page)
    .limit(obj.limit)
    .sort('name')

  return q.exec(callback)
}

teamSchema.statics.getTeamByName = function (name, callback) {
  if (_.isUndefined(name) || name.length < 1) return callback('Invalid Team Name - TeamSchema.GetTeamByName()')

  var q = this.model(COLLECTION).findOne({ normalized: name })

  return q.exec(callback)
}

teamSchema.statics.getTeams = function (callback) {
  var q = this.model(COLLECTION)
    .find({})
    .sort('name')

  return q.exec(callback)
}

teamSchema.statics.getTeamsByIds = function (ids, callback) {
  return this.model(COLLECTION)
    .find({ _id: { $in: ids } })
    .sort('name')
    .exec(callback)
}

teamSchema.statics.getTeamsNoPopulate = function (callback) {
  var q = this.model(COLLECTION)
    .find({})
    .sort('name')

  return q.exec(callback)
}

teamSchema.statics.getTeamsOfUser = function (userId, callback) {
  if (_.isUndefined(userId)) return callback('Invalid UserId - TeamSchema.GetTeamsOfUser()')

  var q = this.model(COLLECTION)
    .find({ members: userId })
    .sort('name')

  return q.exec(callback)
}

teamSchema.statics.getTeamsOfUserNoPopulate = function (userId, callback) {
  if (_.isUndefined(userId)) return callback('Invalid UserId - TeamSchema.GetTeamsOfUserNoPopulate()')

  var q = this.model(COLLECTION)
    .find({ members: userId })
    .sort('name')

  return q.exec(callback)
}

teamSchema.statics.getTeam = function (id, callback) {
  if (_.isUndefined(id)) return callback('Invalid TeamId - TeamSchema.GetTeam()')

  var q = this.model(COLLECTION).findOne({ _id: id })

  return q.exec(callback)
}

function isMember (arr, id) {
  var matches = _.filter(arr, function (value) {
    if (value._id.toString() === id.toString()) return value
  })

  return matches.length > 0
}

module.exports = mongoose.model(COLLECTION, teamSchema)
