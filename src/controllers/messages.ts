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

import _ from 'lodash'
import async from 'async'
import winston from '../logger'

const conversationSchema = require('../models/chat/conversation')
const messageSchema = require('../models/chat/message')

const messagesController: Record<string, any> = {}

messagesController.content = {}

messagesController.view = (req: any, res: any) => {
  const content: Record<string, any> = {}
  content.title = 'Messages'
  content.nav = 'messages'
  content.data = {}
  content.data.common = req.viewdata
  if (req.params.convoid) content.data.conversationId = req.params.convoid

  return res.render('messages', content)
}

messagesController.get = function (req: any, res: any) {
  const content: Record<string, any> = {}
  content.title = 'Messages'
  content.nav = 'messages'
  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.conversations = []
  content.data.showNewConvo = req.showNewConvo

  conversationSchema.getConversationsWithLimit(req.user._id, undefined, function (err: any, convos: any[]) {
    if (err) {
      winston.debug(err)
      return handleError(res, err)
    }

    async.eachSeries(
      convos,
      function (convo: any, done: any) {
        const c = convo.toObject()

        const userMeta =
          convo.userMeta[
            _.findIndex(convo.userMeta, function (item: any) {
              return item.userId.toString() === req.user._id.toString()
            })
          ]
        if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt) {
          return done()
        }

        messageSchema.getMostRecentMessage(c._id, function (err: any, rm: any) {
          if (err) return done(err)

          _.each(c.participants, function (p: any) {
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
      function (err: any) {
        if (err) {
          winston.debug(err)
          return handleError(res, err)
        }

        return res.render('messages', content)
      }
    )
  })
}

messagesController.getConversation = async (req: any, res: any) => {
  const cid = req.params.convoid
  if (_.isUndefined(cid)) return handleError(res, 'Invalid Conversation ID!')

  const content: Record<string, any> = {}
  content.title = 'Messages'
  content.nav = 'messages'
  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.conversations = []

  async.parallel(
    [
      function (next: any) {
        conversationSchema.getConversationsWithLimit(req.user._id, undefined, function (err: any, convos: any[]) {
          if (err) return next(err)

          async.eachSeries(
            convos,
            function (convo: any, done: any) {
              const userMeta =
                convo.userMeta[
                  _.findIndex(convo.userMeta, function (item: any) {
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

              const c = convo.toObject()
              messageSchema.getMostRecentMessage(c._id, function (err: any, rm: any) {
                if (err) return done(err)

                _.each(c.participants, function (p: any) {
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
            function (err: any) {
              if (err) return next(err)

              return next()
            }
          )
        })
      },
      function (next: any) {
        content.data.page = 2

        conversationSchema.getConversation(cid, function (err: any, convo: any) {
          if (err) return next(err)

          if (convo === null || convo === undefined) {
            return res.redirect('/messages')
          }

          const c = convo.toObject()

          let isPart = false
          _.each(c.participants, function (p: any) {
            if (p._id.toString() === req.user._id.toString()) isPart = true
          })

          if (!isPart) {
            return res.redirect('/messages')
          }

          messageSchema.getConversationWithObject(
            { cid: c._id, userMeta: convo.userMeta, requestingUser: req.user },
            function (err: any, messages: any[]) {
              if (err) return next(err)

              _.each(c.participants, function (p: any) {
                if (p._id.toString() !== req.user._id.toString()) {
                  c.partner = p
                }
              })

              c.requestingUserMeta =
                convo.userMeta[
                  _.findIndex(convo.userMeta, function (item: any) {
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
    function (err: any) {
      if (err) return handleError(res, err)
      return res.render('messages', content)
    }
  )
}

function handleError(res: any, err: any) {
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
