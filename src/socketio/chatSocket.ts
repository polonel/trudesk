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
import type { Socket } from 'socket.io'
import winston from '../logger'
import utils from '../helpers/utils'
import { UserModel as userSchema, GroupModel, ConversationModel as Conversation, MessageModel as Message } from '../models'
import { shared as sharedVars, utils as sharedUtils } from './index'
import socketEventConst from './socketEventConsts'

declare const io: any

interface ChatSocketEvents {
  onSetUserOnlineStatus: (socket: Socket) => void
  onUpdateUsers: (socket: Socket) => void
  updateOnlineBubbles: (socket: Socket) => void
  updateConversationsNotifications: (socket: Socket) => void
  spawnChatWindow: (socket: Socket) => void
  getOpenChatWindows: (socket: Socket) => void
  onChatMessage: (socket: Socket) => void
  onChatTyping: (socket: Socket) => void
  onChatStopTyping: (socket: Socket) => void
  saveChatWindow: (socket: Socket) => void
  onDisconnect: (socket: Socket) => void
}

const events = {} as ChatSocketEvents

function register(socket: Socket): void {
  events.onSetUserOnlineStatus(socket)
  events.onUpdateUsers(socket)
  events.updateOnlineBubbles(socket)
  events.updateConversationsNotifications(socket)
  events.spawnChatWindow(socket)
  events.getOpenChatWindows(socket)
  events.onChatMessage(socket)
  events.onChatTyping(socket)
  events.onChatStopTyping(socket)
  events.saveChatWindow(socket)
  events.onDisconnect(socket)

  if ((socket.request as any).user.logged_in) {
    joinChatServer(socket)
  }
}

function eventLoop(): void {
  updateUsers()
  updateOnlineBubbles()
}

function pickUserFields(u: any): object {
  return {
    _id: u._id,
    email: u.email,
    username: u.username,
    fullname: u.fullname,
    image: u.image,
    title: u.title,
    lastOnline: u.lastOnline,
    id: u._id
  }
}

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

events.onUpdateUsers = function (socket: Socket): void {
  socket.on('updateUsers', updateUsers)
}

events.onSetUserOnlineStatus = function (socket: Socket): void {
  socket.on(socketEventConst.UI_ONLINE_STATUS_SET, (data: any) => {
    const state = data.state
    const user = (socket.request as any).user
    const key = user.username.toLowerCase()

    if (!user.username.length) return

    if (state === 'idle') {
      if (hasOwn(sharedVars.idleUsers, key)) {
        sharedVars.idleUsers[key]?.sockets.push(socket.id)
      } else {
        sharedVars.idleUsers[key] = { sockets: [socket.id], user }
      }
      updateOnlineBubbles()
    } else if (state === 'active') {
      if (hasOwn(sharedVars.idleUsers, key)) {
        delete sharedVars.idleUsers[key]
        updateOnlineBubbles()
      }
    }
  })
}

function updateUsers(): void {
  const sortedUserList = sharedUtils.sortByKeys(sharedVars.usersOnline)
  _.forEach(sortedUserList, function (v: any) {
    const { user, sockets } = v
    if (!user || sockets.length === 0) return

    _.forEach(sockets, function (sock: string) {
      const socket = _.find(sharedVars.sockets, (s: Socket) => s.id === sock)
      if (!socket) return

      if (user.role.isAdmin || user.role.isAgent) {
        socket.emit('updateUsers', sortedUserList)
        return
      }

      GroupModel.getAllGroupsOfUser(user._id)
        .then(function (groups: any[]) {
          const agentsAndAdmins = _.filter(sortedUserList, (u: any) => u.user.role.isAdmin || u.user.role.isAgent)

          const groupMembers: any[] = _.flattenDeep(
            _.map(groups, (g: any) => _.map(g.members, (m: any) => ({ user: m })))
          )

          const combined = _.concat(groupMembers, agentsAndAdmins)

          const onlineUsernames: string[] = _.map(sortedUserList, (u: any) => u.user.username as string)

          const groupUsernames: string[] = (_.chain(combined)
            .flattenDeep()
            .map((u: any) => u.user.username as string)
            .value() as unknown) as string[]

          const visible = _.intersection(onlineUsernames, groupUsernames)

          const visibleUsers = _.chain(combined)
            .flattenDeep()
            .filter((i: any) => visible.indexOf(i.user.username) !== -1)
            .uniqBy((i: any) => i.user._id)
            .value()

          const keys = _.map(visibleUsers, (m: any) => m.user.username as string)
          socket.emit('updateUsers', _.zipObject(keys, visibleUsers))
        })
        .catch((err: any) => winston.warn(err))
    })
  })
}

function updateOnlineBubbles(): void {
  const sort = (obj: Record<string, any>) =>
    _.fromPairs(_.sortBy(_.toPairs(obj), ([key]) => key))

  utils.sendToAllConnectedClients(io, socketEventConst.UI_ONLINE_STATUS_UPDATE, {
    sortedUserList: sort(sharedVars.usersOnline),
    sortedIdleList: sort(sharedVars.idleUsers)
  })
}

events.updateOnlineBubbles = function (socket: Socket): void {
  socket.on(socketEventConst.UI_ONLINE_STATUS_UPDATE, function () {
    updateOnlineBubbles()
  })
}

async function updateConversationsNotifications(socket: Socket): Promise<void> {
  if (!socket?.request || !(socket.request as any).user) return

  const user = (socket.request as any).user

  try {
    const conversations = await Conversation.getConversationsWithLimit(user._id, 1000000)
    const convos: any[] = []

    for (const convo of conversations) {
      const c: any = (convo as any).toObject ? (convo as any).toObject() : { ...(convo as any) }

      const idx = _.findIndex(convo.userMeta as any[], (i: any) => i.userId.toString() === user._id.toString())
      const userMeta = (convo.userMeta as any[])[idx]
      if (!_.isUndefined(userMeta?.deletedAt) && userMeta.deletedAt > convo.updatedAt) continue

      _.each(c.participants, (p: any) => {
        if (p._id.toString() !== user._id.toString()) c.partner = p
      })

      const rmArr = await Message.getMostRecentMessage(c._id)
      const rm = rmArr[0]

      if (!_.isUndefined(rm)) {
        if (!c.partner || !rm.owner) continue
        const owner = rm.owner as any
        c.recentMessage =
          c.partner._id.toString() === owner._id.toString()
            ? c.partner.fullname + ': ' + rm.body
            : 'You: ' + rm.body
      } else {
        c.recentMessage = 'New Conversation'
      }

      convos.push(c)
    }

    utils.sendToSelf(socket, socketEventConst.MESSAGES_UPDATE_UI_CONVERSATION_NOTIFICATIONS, {
      conversations: convos.length >= 10 ? convos.slice(0, 9) : convos
    })
  } catch (e) {
    winston.warn(e)
  }
}

events.updateConversationsNotifications = function (socket: Socket): void {
  socket.on(socketEventConst.MESSAGES_UPDATE_UI_CONVERSATION_NOTIFICATIONS, function () {
    updateConversationsNotifications(socket)
  })
}

async function spawnOpenChatWindows(socket: Socket): Promise<void> {
  const loggedInAccountId = (socket.request as any).user._id
  try {
    const user = await userSchema.getUser(loggedInAccountId)
    if (!user) return

    for (const convoId of user.preferences?.openChatWindows ?? []) {
      try {
        const conversation = await Conversation.getConversation(convoId as any)
        if (!conversation) continue

        let partner: any = null
        _.each((conversation as any).participants, function (i: any) {
          if (i._id.toString() !== loggedInAccountId.toString()) {
            partner = i.toObject ? i.toObject() : { ...i }
          }
        })

        if (!partner) continue

        const sensitiveFields = ['password', 'resetPassHash', 'resetPassExpire', 'accessToken', 'iOSDeviceTokens', 'deleted']
        sensitiveFields.forEach(f => delete partner[f])

        utils.sendToSelf(socket, 'spawnChatWindow', partner)
      } catch {
        // skip failed conversation
      }
    }
  } catch (err) {
    winston.warn(err)
  }
}

events.getOpenChatWindows = function (socket: Socket): void {
  socket.on('getOpenChatWindows', function () {
    spawnOpenChatWindows(socket)
  })
}

events.spawnChatWindow = function (socket: Socket): void {
  socket.on(socketEventConst.MESSAGES_SPAWN_CHAT_WINDOW, async function ({ convoId }: { convoId: string }) {
    if (!(socket.request as any).user || !convoId) return

    try {
      const user = await userSchema.getUser((socket.request as any).user._id)
      if (!user) return

      ;(user as any).addOpenChatWindow(convoId)

      utils.sendToUser(
        sharedVars.sockets,
        sharedVars.usersOnline,
        user.username,
        socketEventConst.MESSAGES_UI_SPAWN_CHAT_WINDOW,
        user
      )
    } catch (err) {
      winston.warn(err)
    }
  })
}

events.saveChatWindow = function (socket: Socket): void {
  socket.on(socketEventConst.MESSAGES_SAVE_CHAT_WINDOW, async function (data: any) {
    const { userId, convoId, remove } = data

    try {
      const user = await userSchema.getUser(userId)
      if (!user) return

      if (remove) {
        ;(user as any).removeOpenChatWindow(convoId)
      } else {
        ;(user as any).addOpenChatWindow(convoId)
      }

      utils.sendToUser(
        sharedVars.sockets,
        sharedVars.usersOnline,
        user.username,
        socketEventConst.MESSAGES_SAVE_CHAT_WINDOW_COMPLETE
      )
    } catch (err) {
      winston.warn(err)
    }
  })
}

events.onChatMessage = function (socket: Socket): void {
  socket.on(socketEventConst.MESSAGES_SEND, async function (data: any) {
    const { to, from } = data
    data.message.owner = pickUserFields(data.message.owner)

    try {
      const [toUser, fromUser] = await Promise.all([userSchema.getUser(to), userSchema.getUser(from)])
      if (!fromUser) throw new Error('User Not Found')

      data.toUser = pickUserFields(toUser)
      data.fromUser = pickUserFields(fromUser)

      utils.sendToUser(sharedVars.sockets, sharedVars.usersOnline, data.toUser.username, socketEventConst.MESSAGES_UI_RECEIVE, data)
      utils.sendToUser(sharedVars.sockets, sharedVars.usersOnline, data.fromUser.username, socketEventConst.MESSAGES_UI_RECEIVE, data)
    } catch (err) {
      utils.sendToSelf(socket, socketEventConst.MESSAGES_UI_RECEIVE, { error: true, message: err })
    }
  })
}

function findOnlineUser(id: any): any {
  let found: any = null
  _.forEach(sharedVars.usersOnline, function (v: any) {
    if (String(v.user._id) === String(id)) found = v.user
  })
  return found
}

events.onChatTyping = function (socket: Socket): void {
  socket.on(socketEventConst.MESSAGES_USER_TYPING, function (data: any) {
    const toUser = findOnlineUser(data.to)
    const fromUser = findOnlineUser(data.from)

    if (!toUser || !fromUser) return

    data.toUser = toUser
    data.fromUser = fromUser

    utils.sendToUser(sharedVars.sockets, sharedVars.usersOnline, toUser.username, socketEventConst.MESSAGES_UI_USER_TYPING, data)
  })
}

events.onChatStopTyping = function (socket: Socket): void {
  socket.on(socketEventConst.MESSAGES_USER_STOP_TYPING, function (data: any) {
    const toUser = findOnlineUser(data.to)
    if (!toUser) return

    data.toUser = toUser

    utils.sendToUser(sharedVars.sockets, sharedVars.usersOnline, toUser.username, socketEventConst.MESSAGES_UI_USER_STOP_TYPING, data)
  })
}

function joinChatServer(socket: Socket): void {
  const user = (socket.request as any).user
  if (!user.username.length) return

  if (hasOwn(sharedVars.usersOnline, user.username)) {
    const entry = sharedVars.usersOnline[user.username]
    if (entry) entry.sockets.push(socket.id)
  } else {
    sharedVars.usersOnline[user.username] = { sockets: [socket.id], user }
  }

  utils.sendToSelf(socket, 'joinSuccessfully')
  sharedVars.sockets.push(socket)
  spawnOpenChatWindows(socket)
  updateOnlineBubbles()
}

events.onDisconnect = function (socket: Socket): void {
  socket.on('disconnect', function (reason: string) {
    const user = (socket.request as any).user

    const onlineEntry = sharedVars.usersOnline[user.username]
    if (!_.isUndefined(onlineEntry)) {
      if (_.size(onlineEntry.sockets) < 2) {
        delete sharedVars.usersOnline[user.username]
      } else {
        onlineEntry.sockets = _.without(onlineEntry.sockets, socket.id)
      }
      sharedVars.sockets = sharedVars.sockets.filter(s => s.id !== socket.id)
    }

    const idleEntry = sharedVars.idleUsers[user.username]
    if (!_.isUndefined(idleEntry)) {
      if (_.size(idleEntry.sockets) < 2) {
        delete sharedVars.idleUsers[user.username]
      } else {
        idleEntry.sockets = _.without(idleEntry.sockets, socket.id)
      }
      sharedVars.sockets = sharedVars.sockets.filter(s => s.id !== socket.id)
    }

    userSchema
      .getUser(user._id)
      .then((u) => {
        if (u) {
          u.lastOnline = new Date()
          u.save()
        }
      })
      .catch((err: any) => winston.warn(err))

    winston.debug('User disconnected (' + (reason === 'transport error' ? 'client terminated' : reason) + '): ' + user.username + ' - ' + socket.id)
  })
}

export { events, eventLoop, register }
export default { events, eventLoop, register }
