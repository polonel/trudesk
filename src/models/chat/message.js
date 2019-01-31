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
 *  Updated:    1/21/19 2:04 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var mongoose = require('mongoose')
var _ = require('lodash')

var COLLECTION = 'messages'

var messageSchema = mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'accounts',
      required: true,
      index: true
    },
    body: { type: String, required: true }
  },
  { timestamps: true }
)

messageSchema.statics.getFullConversation = function (convoId, callback) {
  return this.model(COLLECTION)
    .find({ conversation: convoId })
    .select('createdAt body owner')
    .sort('-createdAt')
    .populate({
      path: 'owner',
      select: '_id username fullname email image lastOnline'
    })
    .exec(callback)
}

messageSchema.statics.getConversation = function (convoId, callback) {
  return this.model(COLLECTION)
    .find({ conversation: convoId })
    .select('createdAt body owner')
    .sort('-createdAt')
    .limit(25)
    .populate({
      path: 'owner',
      select: '_id username fullname email image lastOnline'
    })
    .exec(callback)
}

messageSchema.statics.getConversationWithObject = function (object, callback) {
  if (!_.isObject(object)) {
    return callback('Invalid Object (Must by of type Object) - MessageSchema.GetUserWithObject()', null)
  }

  var self = this
  var deletedAt = null

  var limit = object.limit === null ? 25 : object.limit
  var page = object.page === null ? 0 : object.page

  if (object.requestingUser) {
    var userMetaIdx = _.findIndex(object.userMeta, function (item) {
      return item.userId.toString() === object.requestingUser._id.toString()
    })
    if (userMetaIdx !== -1 && object.userMeta[userMetaIdx].deletedAt) {
      deletedAt = new Date(object.userMeta[userMetaIdx].deletedAt)
    }
  }

  var q = self
    .model(COLLECTION)
    .find({})
    .sort('-createdAt')
    .skip(page * limit)
    .populate({
      path: 'owner',
      select: '_id username fullname email image lastOnline'
    })

  if (limit !== -1) {
    q.limit(limit)
  }

  if (object.cid !== null) {
    q.where({ conversation: object.cid })
  }

  if (deletedAt) {
    q.where({ createdAt: { $gte: deletedAt } })
  }

  return q.exec(callback)
}

messageSchema.statics.getMostRecentMessage = function (convoId, callback) {
  return this.model(COLLECTION)
    .find({ conversation: convoId })
    .sort('-createdAt')
    .limit(1)
    .populate({
      path: 'owner',
      select: '_id username fullname image lastOnline'
    })
    .exec(callback)
}

module.exports = mongoose.model(COLLECTION, messageSchema)
