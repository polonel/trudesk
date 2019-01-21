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

var _ = require('lodash')

var async = require('async')

var winston = require('winston')

var conversationSchema = require('../models/chat/conversation')

var messageSchema = require('../models/chat/message')

var messagesController = {}

messagesController.content = {}

messagesController.get = function (req, res) {
  var content = {}
  content.title = 'Messages'
  content.nav = 'messages'
  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.conversations = []
  content.data.showNewConvo = req.showNewConvo

  conversationSchema.getConversationsWithLimit(req.user._id, undefined, function (err, convos) {
    if (err) {
      winston.debug(err)
      return handleError(res, err)
    }

    async.eachSeries(
      convos,
      function (convo, done) {
        var c = convo.toObject()

        var userMeta =
          convo.userMeta[
            _.findIndex(convo.userMeta, function (item) {
              return item.userId.toString() === req.user._id.toString()
            })
          ]
        if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt) {
          return done()
        }

        messageSchema.getMostRecentMessage(c._id, function (err, rm) {
          if (err) return done(err)

          _.each(c.participants, function (p) {
            if (p._id.toString() !== req.user._id.toString()) {
              c.partner = p
            }
          })

          rm = _.first(rm)

          if (!_.isUndefined(rm)) {
            if (String(c.partner._id) === String(rm.owner._id)) {
              c.recentMessage = c.partner.fullname + ': ' + rm.body
            } else {
              c.recentMessage = 'You: ' + rm.body
            }
          } else {
            c.recentMessage = 'New Conversation'
          }

          content.data.conversations.push(c)

          return done()
        })
      },
      function (err) {
        if (err) {
          winston.debug(err)
          return handleError(res, err)
        }

        return res.render('messages', content)
      }
    )
  })
}

messagesController.getConversation = function (req, res) {
  var cid = req.params.convoid
  if (_.isUndefined(cid)) return handleError(res, 'Invalid Conversation ID!')

  var content = {}
  content.title = 'Messages'
  content.nav = 'messages'
  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.conversations = []

  async.parallel(
    [
      function (next) {
        conversationSchema.getConversationsWithLimit(req.user._id, undefined, function (err, convos) {
          if (err) return next(err)

          async.eachSeries(
            convos,
            function (convo, done) {
              var userMeta =
                convo.userMeta[
                  _.findIndex(convo.userMeta, function (item) {
                    return item.userId.toString() === req.user._id.toString()
                  })
                ]
              if (
                !_.isUndefined(userMeta) &&
                !_.isUndefined(userMeta.deletedAt) &&
                userMeta.deletedAt > convo.updatedAt &&
                req.params.convoid.toString() !== convo._id.toString()
              ) {
                return done()
              }

              var c = convo.toObject()
              messageSchema.getMostRecentMessage(c._id, function (err, rm) {
                if (err) return done(err)

                _.each(c.participants, function (p) {
                  if (p._id.toString() !== req.user._id.toString()) {
                    c.partner = p
                  }
                })

                rm = _.first(rm)

                if (!_.isUndefined(rm)) {
                  if (String(c.partner._id) === String(rm.owner._id)) {
                    c.recentMessage = c.partner.fullname + ': ' + rm.body
                  } else {
                    c.recentMessage = 'You: ' + rm.body
                  }
                } else {
                  c.recentMessage = 'New Conversation'
                }

                if (
                  !_.isUndefined(userMeta) &&
                  !_.isUndefined(userMeta.deletedAt) &&
                  !_.isUndefined(rm) &&
                  rm.createdAt < userMeta.deletedAt
                ) {
                  c.recentMessage = 'New Conversation'
                }

                content.data.conversations.push(c)

                return done()
              })
            },
            function (err) {
              if (err) return next(err)

              return next()
            }
          )
        })
      },
      function (next) {
        content.data.page = 2

        conversationSchema.getConversation(cid, function (err, convo) {
          if (err) return next(err)

          if (convo === null || convo === undefined) {
            return res.redirect('/messages')
          }

          var c = convo.toObject()
          messageSchema.getConversationWithObject(
            { cid: c._id, userMeta: convo.userMeta, requestingUser: req.user },
            function (err, messages) {
              if (err) return next(err)

              _.each(c.participants, function (p) {
                if (p._id.toString() !== req.user._id.toString()) {
                  c.partner = p
                }
              })

              c.requestingUserMeta =
                convo.userMeta[
                  _.findIndex(convo.userMeta, function (item) {
                    return item.userId.toString() === req.user._id.toString()
                  })
                ]

              content.data.conversation = c
              content.data.conversation.messages = messages.reverse()

              return next()
            }
          )
        })
      }
    ],
    function (err) {
      if (err) return handleError(res, err)
      return res.render('messages', content)
    }
  )
}

function handleError (res, err) {
  if (err) {
    winston.warn(err)
    if (!err.status) res.status = 500
    else res.status = err.status
    return res.render('error', {
      layout: false,
      error: err,
      message: err.message
    })
  }
}

module.exports = messagesController
