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

const mongoose = require('mongoose')
const _ = require('lodash')
const utils = require('../../helpers/utils')

const COLLECTION = 'messages'

const messageSchema = mongoose.Schema(
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

messageSchema.pre('save', function (next) {
  this.body = utils.sanitizeFieldPlainText(utils.applyExtremeTextLength(this.body))

  next()
})

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
  const self = this
  const limit = object.limit === null ? 25 : object.limit
  const page = object.page === null ? 0 : object.page

  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        if (!_.isObject(object)) {
          if (typeof callback === 'function')
            return callback('Invalid Object (Must by of type Object) - MessageSchema.GetUserWithObject()')

          return reject(new Error('Invalid Object (Must by of type Object) - MessageSchema.GetUserWithObject()'))
        }

        let deletedAt = null

        if (object.requestingUser) {
          const userMetaIdx = _.findIndex(object.userMeta, item => {
            return item.userId.toString() === object.requestingUser._id.toString()
          })
          if (userMetaIdx !== -1 && object.userMeta[userMetaIdx].deletedAt)
            deletedAt = new Date(object.userMeta[userMetaIdx].deletedAt)
        }

        const query = self
          .model(COLLECTION)
          .find({})
          .sort('-createdAt')
          .skip(page * limit)
          .populate({
            path: 'owner',
            select: '_id username fullname email image lastOnline'
          })

        if (limit !== -1) query.limit(limit)
        if (object.cid) query.where({ conversation: object.cid })
        if (deletedAt) query.where({ createdAt: { $gte: deletedAt } })

        if (typeof callback === 'function') return query.exec(callback)

        const results = await query.exec()

        return resolve(results)
      } catch (e) {
        if (typeof callback === 'function') return callback(e)

        return reject(e)
      }
    })()
  })
}

messageSchema.statics.getMostRecentMessage = function (convoId, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const query = self
          .model(COLLECTION)
          .find({ conversation: convoId })
          .sort('-createdAt')
          .limit(1)
          .populate({
            path: 'owner',
            select: '_id username fullname image lastOnline'
          })

        if (typeof callback === 'function') return query.exec(callback)

        const results = await query.exec()

        return resolve(results)
      } catch (e) {
        if (typeof callback === 'function') return callback(e)

        return reject(e)
      }
    })()
  })
}

module.exports = mongoose.model(COLLECTION, messageSchema)
