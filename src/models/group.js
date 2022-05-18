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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var mongoose = require('mongoose')
var utils = require('../helpers/utils')

var COLLECTION = 'groups'

/**
 * Group Schema
 * @module models/ticket
 * @class Group
 * @requires {@link User}
 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of Group
 * @property {Array} members Members in this group
 * @property {Array} sendMailTo Members to email when a new / updated ticket has triggered
 */
var groupSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'accounts',
      autopopulate: { select: '-hasL2Auth -preferences -__v' }
    }
  ],
  sendMailTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'accounts' }],
  public: { type: Boolean, required: true, default: false }
})

groupSchema.plugin(require('mongoose-autopopulate'))

groupSchema.pre('save', function (next) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())

  next()
})

groupSchema.methods.addMember = async function (memberId, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    ;(async () => {
      if (_.isUndefined(memberId)) {
        if (typeof callback === 'function') return callback({ message: 'Invalid MemberId - $Group.AddMember()' })

        return reject(new Error('Invalid MemberId - $Group.AddMember()'))
      }

      if (self.members === null) self.members = []
      if (isMember(self.members, memberId)) {
        if (typeof callback === 'function') return callback(null, false)

        return resolve(false)
      }

      self.members.push(memberId)
      self.members = _.uniq(self.members)

      if (typeof callback === 'function') return callback(null, true)

      return resolve(true)
    })()
  })
}

groupSchema.methods.removeMember = async function (memberId, callback) {
  const self = this
  const hasCallback = typeof callback === 'function'
  return new Promise((resolve, reject) => {
    ;(async () => {
      if (_.isUndefined(memberId)) {
        if (hasCallback) return callback({ message: 'Invalid MemberId - $Group.RemoveMember()' })

        return reject(new Error('Invalid MemberId - $Group.RemoveMember()'))
      }

      if (!isMember(self.members, memberId)) {
        if (hasCallback) return callback(null, false)

        return resolve(false)
      }

      self.members.splice(_.indexOf(self.members, _.find(self.members, { _id: memberId })), 1)
      self.members = _.uniq(self.members)

      if (hasCallback) return callback(null, true)

      return resolve(true)
    })()
  })
}

groupSchema.methods.isMember = function (memberId) {
  return isMember(this.members, memberId)
}

groupSchema.methods.addSendMailTo = function (memberId, callback) {
  if (_.isUndefined(memberId)) return callback('Invalid MemberId - $Group.AddSendMailTo()')

  if (this.sendMailTo === null) this.sendMailTo = []

  if (isMember(this.sendMailTo, memberId)) return callback(null, false)

  this.sendMailTo.push(memberId)
  this.sendMailTo = _.uniq(this.sendMailTo)

  return callback(null, true)
}

groupSchema.methods.removeSendMailTo = function (memberId, callback) {
  if (_.isUndefined(memberId)) return callback('Invalid MemberId - $Group.RemoveSendMailTo()')

  if (!isMember(this.sendMailTo, memberId)) return callback(null, false)

  this.sendMailTo.splice(_.indexOf(this.sendMailTo, _.find(this.sendMailTo, { _id: memberId })), 1)

  return callback(null, true)
}

groupSchema.statics.getGroupByName = function (name, callback) {
  if (_.isUndefined(name) || name.length < 1) return callback('Invalid Group Name - GroupSchema.GetGroupByName()')

  var q = this.model(COLLECTION)
    .findOne({ name: name })
    .populate('members', '_id username fullname email role preferences image title deleted')
    .populate('sendMailTo', '_id username fullname email role preferences image title deleted')

  return q.exec(callback)
}

groupSchema.statics.getWithObject = function (obj, callback) {
  var limit = obj.limit ? Number(obj.limit) : 100
  var page = obj.page ? Number(obj.page) : 0
  var userId = obj.userId

  if (userId) {
    return this.model(COLLECTION)
      .find({ members: userId })
      .limit(limit)
      .skip(page * limit)
      .populate('members', '_id username fullname email role preferences image title deleted')
      .populate('sendMailTo', '_id username fullname email role preferences image title deleted')
      .sort('name')
      .exec(callback)
  }

  return this.model(COLLECTION)
    .find({})
    .limit(limit)
    .skip(page * limit)
    .populate('members', '_id username fullname email role preferences image title deleted')
    .populate('sendMailTo', '_id username fullname email role preferences image title deleted')
    .sort('name')
    .exec(callback)
}

groupSchema.statics.getAllGroups = async function (callback) {
  const self = this
  return new Promise((resolve, reject) => {
    ;(async () => {
      const q = self
        .model(COLLECTION)
        .find({})
        .populate('members', '_id username fullname email role preferences image title deleted')
        .populate('sendMailTo', '_id username fullname email role preferences image title deleted')
        .sort('name')

      if (typeof callback === 'function') return q.exec(callback)

      const groups = await q.exec()

      return resolve(groups)
    })()
  })
}

groupSchema.statics.getAllGroupsNoPopulate = function (callback) {
  var q = this.model(COLLECTION)
    .find({})
    .sort('name')

  return q.exec(callback)
}

groupSchema.statics.getAllPublicGroups = function (callback) {
  var q = this.model(COLLECTION)
    .find({ public: true })
    .sort('name')

  return q.exec(callback)
}

groupSchema.statics.getGroups = async function (groupIds, callback) {
  return new Promise((resolve, reject) => {
    ;(async () => {
      if (_.isUndefined(groupIds)) {
        if (typeof callback === 'function') return callback('Invalid Array of Group IDs - GroupSchema.GetGroups()')
        return reject(new Error('Invalid Array of Group IDs - GroupSchema.GetGroups()'))
      }

      try {
        const exec = this.model(COLLECTION)
          .find({ _id: { $in: groupIds } })
          .populate('members', '_id username fullname email role preferences image title deleted')
          .sort('name')

        if (typeof callback === 'function') {
          return exec.exec(callback)
        }

        const groups = await exec.exec()

        return resolve(groups)
      } catch (e) {
        if (typeof callback === 'function') return callback(e)
        return reject(e)
      }
    })()
  })
}

groupSchema.statics.getAllGroupsOfUser = async function (userId, callback) {
  return new Promise((resolve, reject) => {
    ;(async () => {
      if (_.isUndefined(userId)) {
        if (typeof callback === 'function')
          return callback({ message: 'Invalid UserId - GroupSchema.GetAllGroupsOfUser()' })
        return reject(new Error('Invalid UserId - GroupSchema.GetAllGroupsOfUser()'))
      }

      const q = this.model(COLLECTION)
        .find({ members: userId })
        .populate('members', '_id username fullname email role preferences image title deleted')
        .populate('sendMailTo', '_id username fullname email role preferences image title deleted')
        .sort('name')

      if (typeof callback === 'function') return q.exec(callback)

      const groups = await q.exec()

      return resolve(groups)
    })()
  })
}

groupSchema.statics.getAllGroupsOfUserNoPopulate = function (userId, callback) {
  if (_.isUndefined(userId)) return callback('Invalid UserId - GroupSchema.GetAllGroupsOfUserNoPopulate()')

  var q = this.model(COLLECTION)
    .find({ members: userId })
    .sort('name')

  return q.exec(callback)
}

groupSchema.statics.getGroupById = function (gId, callback) {
  if (_.isUndefined(gId)) return callback('Invalid GroupId - GroupSchema.GetGroupById()')

  var q = this.model(COLLECTION)
    .findOne({ _id: gId })
    .populate('members', '_id username fullname email role preferences image title')
    .populate('sendMailTo', '_id username fullname email role preferences image title')

  return q.exec(callback)
}

function isMember (arr, id) {
  var matches = _.filter(arr, function (value) {
    if (value._id.toString() === id.toString()) {
      return value
    }
  })

  return matches.length > 0
}

module.exports = mongoose.model(COLLECTION, groupSchema)
