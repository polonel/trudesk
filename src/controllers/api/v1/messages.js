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
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var async = require('async')
var _ = require('lodash')
var winston = require('winston')
var ConversationSchema = require('../../../models/chat/conversation')
var MessageSchema = require('../../../models/chat/message')

var apiMessages = {}

/**
 * @api {get} /api/v1/messages Get Messages
 * @apiName getMessages
 * @apiDescription Gets messages for the current logged in user
 * @apiVersion 0.1.8
 * @apiGroup Messages
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/messages
 *
 * @apiSuccess {boolean}    success             Successful?
 * @apiSuccess {array}      messages
 * @apiSuccess {object}     messages._id        The MongoDB ID
 * @apiSuccess {object}     messages.owner      Message Owner
 * @apiSuccess {object}     messages.from       Message From
 * @apiSuccess {string}     messages.subject    Message Subject
 * @apiSuccess {string}     messages.message    Message Text
 * @apiSuccess {date}       messages.date       Message Date
 * @apiSuccess {boolean}    messages.unread     Unread?
 * @apiSuccess {number}     messages.folder     Message Folder
 *
 */

apiMessages.getConversations = function (req, res) {
  ConversationSchema.getConversations(req.user._id, function (err, conversations) {
    if (err) return res.status(400).json({ success: false, error: err.message })

    return res.json({ success: true, conversations: conversations })
  })
}

apiMessages.getRecentConversations = function (req, res) {
  ConversationSchema.getConversations(req.user._id, function (err, conversations) {
    if (err) return res.status(400).json({ success: false, error: err.message })

    var result = []
    async.eachSeries(
      conversations,
      function (item, done) {
        var idx = _.findIndex(item.userMeta, function (mItem) {
          return mItem.userId.toString() === req.user._id.toString()
        })
        if (idx === -1) {
          return res.status(400).json({ success: false, error: 'Unable to attach to userMeta' })
        }

        MessageSchema.getMostRecentMessage(item._id, function (err, m) {
          if (err) return done(err)
          var r = item.toObject()

          if (_.first(m) === undefined) {
            return done()
          }

          if (item.userMeta[idx].deletedAt && item.userMeta[idx].deletedAt > _.first(m).createdAt) {
            return done()
          }

          r.recentMessage = _.first(m)
          if (!_.isUndefined(r.recentMessage)) {
            r.recentMessage.__v = undefined
            result.push(r)
          }

          return done()
        })
      },
      function (err) {
        if (err) return res.status(400).json({ success: false, error: err })
        return res.json({ success: true, conversations: result })
      }
    )
  })
}

apiMessages.get = function (req, res) {
  ConversationSchema.getConversations(req.user._id, function (err, conversations) {
    if (err) return res.status(400).json({ success: false, error: err })
    var fullConversations = []

    async.forEach(
      conversations,
      function (item, done) {
        MessageSchema.getFullConversation(item._id, function (err, messages) {
          if (err) return done(err)
          fullConversations.push({
            cId: item._id,
            p: item.participants,
            messages: messages
          })

          return done()
        })
      },
      function (err) {
        if (err) return res.status(400).json({ success: false, error: err })
        return res.json({ success: true, conversations: fullConversations })
      }
    )
  })
}

apiMessages.startConversation = function (req, res) {
  var payload = req.body
  var requester = payload.owner
  var participants = payload.participants

  // Check if Conversation with these participants exist
  ConversationSchema.getConversations(participants, function (err, convo) {
    if (err) {
      return res.status(400).json({ success: false, error: err.message })
    }

    if (convo.length === 1) {
      return res.json({ success: true, conversation: convo[0] })
    }

    var userMeta = []
    _.each(participants, function (item) {
      var meta = {
        userId: item,
        joinedAt: new Date()
      }

      if (requester === item) {
        meta.lastRead = new Date()
      }

      userMeta.push(meta)
    })

    var Conversation = new ConversationSchema({
      participants: participants,
      userMeta: userMeta,
      updatedAt: new Date()
    })

    Conversation.save(function (err, cSave) {
      if (err) {
        winston.debug(err)
        return res.status(400).json({ success: false, error: err.message })
      }

      return res.json({ success: true, conversation: cSave })
    })
  })
}

apiMessages.send = function (req, res) {
  var payload = req.body
  var cId = payload.cId
  var owner = payload.owner
  var message = payload.body
  var matches = message.match(/^[Tt]#[0-9]*$/g)

  if (!_.isNull(matches) && matches.length > 0) {
    _.each(matches, function (m) {
      message = message.replace(
        m,
        '<a href="/tickets/' +
          m.replace('T#', '').replace('t#', '') +
          '">T#' +
          m.replace('T#', '').replace('t#', '') +
          '</a>'
      )
    })
  }

  async.waterfall(
    [
      function (done) {
        // Updated conversation to save UpdatedAt field.
        ConversationSchema.findOneAndUpdate({ _id: cId }, { updatedAt: new Date() }, { new: false }, function (
          err,
          convo
        ) {
          if (err) return done(err)
          if (convo === null || convo === undefined) {
            return done('Invalid Conversation: ' + convo)
          }
          return done(null, convo)
        })
      },
      function (convo, done) {
        var Message = new MessageSchema({
          conversation: convo._id,
          owner: owner,
          body: message
        })

        Message.save(function (err, mSave) {
          if (err) {
            return done(err)
          }

          // Update conversation Meta!!
          return done(null, mSave)
        })
      }
    ],
    function (err, mSave) {
      if (err) {
        winston.debug(err)
        return res.status(400).json({ success: false, error: err.message })
      }
      return res.json({ success: true, message: mSave })
    }
  )
}

apiMessages.getMessagesForConversation = function (req, res) {
  var conversation = req.params.id
  var page = req.query.page === undefined ? 0 : req.query.page
  var limit = req.query.limit === undefined ? 10 : req.query.limit
  if (_.isUndefined(conversation) || _.isNull(conversation)) {
    return res.status(400).json({ success: false, error: 'Invalid Conversation' })
  }

  var response = {}
  async.series(
    [
      function (done) {
        ConversationSchema.getConversation(conversation, function (err, convo) {
          if (err) return done(err)
          if (!convo) return done({ message: 'Invalid Conversation' })

          response.conversation = convo

          return done()
        })
      },
      function (done) {
        MessageSchema.getConversationWithObject(
          {
            cid: conversation,
            page: page,
            limit: limit,
            userMeta: response.conversation.userMeta,
            requestingUser: req.user
          },
          function (err, messages) {
            if (err) return done(err)

            response.messages = messages

            done()
          }
        )
      }
    ],
    function (err) {
      if (err) {
        winston.debug(err)
        return res.status(400).json({ success: false, error: err.message })
      }

      return res.json({
        success: true,
        conversation: response.conversation,
        messages: response.messages
      })
    }
  )
}

apiMessages.deleteConversation = function (req, res) {
  var conversation = req.params.id

  if (_.isUndefined(conversation) || _.isNull(conversation)) {
    return res.status(400).json({ success: false, error: 'Invalid Conversation' })
  }

  ConversationSchema.getConversation(conversation, function (err, convo) {
    if (err) return res.status(400).json({ success: false, error: err.message })

    var user = req.user
    var idx = _.findIndex(convo.userMeta, function (item) {
      return item.userId.toString() === user._id.toString()
    })
    if (idx === -1) {
      return res.status(400).json({ success: false, error: 'Unable to attach to userMeta' })
    }

    convo.userMeta[idx].deletedAt = new Date()

    convo.save(function (err, sConvo) {
      if (err) return res.status(400).json({ success: false, error: err.message })

      return res.json({ success: true, conversation: sConvo })
    })
  })
}

module.exports = apiMessages
