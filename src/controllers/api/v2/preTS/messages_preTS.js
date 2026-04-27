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
 *  Updated:    2/14/19 12:05 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import _ from 'lodash'
import apiUtils from '../apiUtils'
import Message from '../../../models/chat/message'
import { ConversationModel, UserModel } from '../../../models'
import logger from '../../../logger'

const apiMessages = {}

apiMessages.startConversation = async (req, res) => {
  const payload = req.body
  const requester = payload.owner
  const participants = payload.participants

  try {
    const conversations = await ConversationModel.getConversations(participants)
    if (conversations.length > 0) {
      const conversation = _.first(conversations)
      const idx = _.findIndex(conversation.userMeta, i => i.userId.toString() === requester.toString())
      const userMeta = conversation.userMeta[idx]
      if (userMeta) {
        userMeta.updatedAt = Date.now()
        const updatedConvo = await conversation.save()
        return apiUtils.sendApiSuccess(res, { conversation: updatedConvo })
      } else return apiUtils.sendApiSuccess(res, conversation)
    }

    if (conversations.length < 1) {
      const userMeta = []
      _.each(participants, item => {
        const meta = {
          userId: item,
          joinedAt: new Date()
        }

        if (requester === item) meta.lastRead = new Date()

        userMeta.push(meta)
      })

      const Conversation = new ConversationModel({
        participants,
        userMeta,
        updatedAt: new Date()
      })

      const cSave = await Conversation.save()
      return apiUtils.sendApiSuccess(res, { conversation: cSave })
    }
  } catch (err) {
    return apiUtils.sendApiError(res, 400, { error: err.message })
  }

  return apiUtils.sendApiSuccess(res)
}

apiMessages.getConversations = async (req, res) => {
  try {
    const resConversations = []
    const conversations = await ConversationModel.getConversationsWithLimit(req.user._id)
    for (const convo of conversations) {
      const convoObject = convo.toObject()

      const index = _.findIndex(convo.userMeta, item => item.userId.toString() === req.user._id.toString())

      if (index === -1) continue

      const userMeta = convo.userMeta[index]

      if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt)
        continue

      let recentMessage = await Message.getMostRecentMessage(convoObject._id)

      for (const participant of convoObject.participants) {
        if (participant._id.toString() !== req.user._id.toString()) {
          convoObject.partner = participant
        }

        delete participant.role
      }

      recentMessage = _.first(recentMessage)

      if (!_.isUndefined(recentMessage)) {
        if (convoObject.partner._id.toString() === recentMessage.owner._id.toString()) {
          convoObject.recentMessage = `${convoObject.partner.fullname}: ${recentMessage.body}`
        } else {
          convoObject.recentMessage = `You: ${recentMessage.body}`
        }
      } else {
        convoObject.recentMessage = 'New Conversation'
      }

      resConversations.push(convoObject)
    }

    return apiUtils.sendApiSuccess(res, { conversations: resConversations })
  } catch (e) {
    logger.debug(e)
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiMessages.single = async (req, res) => {
  const _id = req.params.id
  if (!_id) return apiUtils.sendApiError(res, 400, 'Invalid Conversation Id')
  try {
    let conversation = await ConversationModel.getConversation(_id)

    if (!conversation) return apiUtils.sendApiError(res, 404, 'Conversation not found')

    conversation = conversation.toObject()
    let isParticipant = false
    for (const participant of conversation.participants) {
      if (participant._id.toString() === req.user._id.toString()) isParticipant = true
    }

    if (!isParticipant) return apiUtils.sendApiError(res, 400, 'Invalid')

    const convoMessages = await Message.getConversationWithObject({
      cid: conversation._id,
      userMeta: conversation.userMeta,
      requestingUser: req.user
    })

    // Clear the role. It's not needed
    for (const message of convoMessages) {
      message.owner.role = undefined
    }

    for (const participant of conversation.participants) {
      if (participant._id.toString() !== req.user._id.toString()) conversation.partner = participant

      delete participant.role
    }

    conversation.requestingUserMeta =
      conversation.userMeta[
        _.findIndex(conversation.userMeta, item => item.userId.toString() === req.user._id.toString())
      ]

    conversation.messages = convoMessages.reverse()

    return apiUtils.sendApiSuccess(res, { conversation })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiMessages.send = async (req, res) => {
  const payload = req.body
  const cId = payload.cId
  const owner = payload.owner
  let message = payload.body
  const matches = message.match(/^[Tt]#[0-9]*$/g)

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

  try {
    const convo = await ConversationModel.findOne({ _id: cId })
    if (!convo) return apiUtils.sendApiError(res, 404, { error: 'Invalid Conversation' })

    convo.updatedAt = new Date()
    const savedConvo = await convo.save()
    const user = await UserModel.findOne({ _id: owner })
    if (!user) return apiUtils.sendApiError(res, 404, { error: 'Invalid Conversation' })

    const _Message = new Message({
      conversation: savedConvo._id,
      owner: user,
      body: message
    })

    const mSave = await _Message.save()

    return apiUtils.sendApiSuccess(res, { message: mSave })
  } catch (err) {
    logger.debug(err)
    return apiUtils.sendApiError(res, 400, { error: err.message })
  }
}

apiMessages.deleteConversation = async (req, res) => {
  const conversation = req.params.id
  if (!conversation) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const convo = await ConversationModel.getConversation(conversation)
    const user = req.user
    const idx = _.findIndex(convo.userMeta, function (item) {
      return item.userId.toString() === user._id.toString()
    })
    if (idx === -1) {
      return apiUtils.sendApiError(res, 400, { error: 'Unable to attach to userMeta' })
    }

    convo.userMeta[idx].deletedAt = new Date()
    const sConvo = await convo.save()

    const cleanConvo = sConvo.toObject()
    cleanConvo.participants.forEach(p => {
      delete p._id
      delete p.id
      delete p.role
    })

    cleanConvo.userMeta.forEach(meta => {
      delete meta.userId
    })

    return apiUtils.sendApiSuccess(res, { conversation: cleanConvo })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

module.exports = apiMessages
