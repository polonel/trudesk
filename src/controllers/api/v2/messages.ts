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
import { ConversationModel, MessageModel, UserModel } from '../../../models'
import logger from '../../../logger'

const apiMessages: Record<string, any> = {}

apiMessages.startConversation = async (req: any, res: any) => {
  const payload = req.body
  const requester = payload.owner
  const participants = payload.participants

  try {
    const conversations = await ConversationModel.getConversations(participants)
    if (conversations.length > 0) {
      // Cast to any — typegoose class doesn't expose mongoose Document methods (save, toObject)
      const conversation = _.first(conversations) as any
      const idx = _.findIndex(conversation.userMeta, (i: any) => i.userId.toString() === requester.toString())
      const userMeta = conversation.userMeta[idx]
      if (userMeta) {
        userMeta.updatedAt = Date.now()
        const updatedConvo = await conversation.save()
        return apiUtils.sendApiSuccess(res, { conversation: updatedConvo })
      } else return apiUtils.sendApiSuccess(res, conversation)
    }

    if (conversations.length < 1) {
      const userMeta: any[] = []
      _.each(participants, (item: any) => {
        const meta: any = {
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
  } catch (err: any) {
    return apiUtils.sendApiError(res, 400, { error: err.message })
  }

  return apiUtils.sendApiSuccess(res)
}

apiMessages.getConversations = async (req: any, res: any) => {
  try {
    const resConversations: any[] = []
    const conversations = await ConversationModel.getConversationsWithLimit(req.user._id, 1000000)
    for (const convo of conversations) {
      // Cast to any — typegoose class doesn't expose mongoose Document runtime methods
      const convoObject = (convo as any).toObject()

      const index = _.findIndex(convo.userMeta, (item: any) => item.userId.toString() === req.user._id.toString())

      if (index === -1) continue

      const userMeta = convo.userMeta[index]

      if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt)
        continue

      const recentMessages = await MessageModel.getMostRecentMessage(convoObject._id)
      const recentMessage = _.first(recentMessages)

      for (const participant of convoObject.participants) {
        if (participant._id.toString() !== req.user._id.toString()) {
          convoObject.partner = participant
        }

        delete participant.role
      }

      if (!_.isUndefined(recentMessage)) {
        if (convoObject.partner._id.toString() === (recentMessage.owner as any)?._id?.toString()) {
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
  } catch (e: any) {
    logger.debug(e)
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiMessages.single = async (req: any, res: any) => {
  const _id = req.params.id
  if (!_id) return apiUtils.sendApiError(res, 400, 'Invalid Conversation Id')
  try {
    // Use any so mongoose Document methods and dynamic property assignments are valid
    let conversation: any = await ConversationModel.getConversation(_id)

    if (!conversation) return apiUtils.sendApiError(res, 404, 'Conversation not found')

    conversation = conversation.toObject()
    let isParticipant = false
    for (const participant of conversation.participants) {
      if (participant._id.toString() === req.user._id.toString()) isParticipant = true
    }

    if (!isParticipant) return apiUtils.sendApiError(res, 400, 'Invalid')

    const convoMessages = await MessageModel.getConversationWithObject({
      cid: conversation._id,
      userMeta: conversation.userMeta,
      requestingUser: req.user
    })

    for (const message of convoMessages) {
      ;(message as any).owner.role = undefined
    }

    for (const participant of conversation.participants) {
      if (participant._id.toString() !== req.user._id.toString()) conversation.partner = participant

      delete participant.role
    }

    conversation.requestingUserMeta =
      conversation.userMeta[
        _.findIndex(conversation.userMeta, (item: any) => item.userId.toString() === req.user._id.toString())
      ]

    conversation.messages = convoMessages.reverse()

    return apiUtils.sendApiSuccess(res, { conversation })
  } catch (e: any) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiMessages.send = async (req: any, res: any) => {
  const payload = req.body
  const cId = payload.cId
  const owner = payload.owner
  let message = payload.body
  const matches = message.match(/^[Tt]#[0-9]*$/g)

  if (!_.isNull(matches) && matches.length > 0) {
    _.each(matches, function (m: string) {
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
    // Cast to any — ConversationModelClass doesn't declare mongoose Document methods
    const convo = (await ConversationModel.findOne({ _id: cId })) as any
    if (!convo) return apiUtils.sendApiError(res, 404, { error: 'Invalid Conversation' })

    convo.updatedAt = new Date()
    const savedConvo = await convo.save()
    const user = await UserModel.findOne({ _id: owner })
    if (!user) return apiUtils.sendApiError(res, 404, { error: 'Invalid Conversation' })

    const _Message = new MessageModel({
      conversation: savedConvo._id,
      owner: user,
      body: message
    })

    const mSave = await _Message.save()

    return apiUtils.sendApiSuccess(res, { message: mSave })
  } catch (err: any) {
    logger.debug(err)
    return apiUtils.sendApiError(res, 400, { error: err.message })
  }
}

apiMessages.deleteConversation = async (req: any, res: any) => {
  const conversation = req.params.id
  if (!conversation) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    // Cast to any — typegoose class doesn't expose mongoose Document methods
    const convo = (await ConversationModel.getConversation(conversation)) as any
    const user = req.user
    const idx = _.findIndex(convo.userMeta, function (item: any) {
      return item.userId.toString() === user._id.toString()
    })
    if (idx === -1) {
      return apiUtils.sendApiError(res, 400, { error: 'Unable to attach to userMeta' })
    }

    convo.userMeta[idx].deletedAt = new Date()
    const sConvo = await convo.save()

    const cleanConvo = sConvo.toObject()
    cleanConvo.participants.forEach((p: any) => {
      delete p._id
      delete p.id
      delete p.role
    })

    cleanConvo.userMeta.forEach((meta: any) => {
      delete meta.userId
    })

    return apiUtils.sendApiSuccess(res, { conversation: cleanConvo })
  } catch (e: any) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

module.exports = apiMessages
