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
const _ = require('lodash')
const async = require('async')
const winston = require('../logger')
const utils = require('../helpers/utils')
const userSchema = require('../models').UserModel
const GroupModel = require('../models').GroupModel

const sharedVars = require('./index').shared
const sharedUtils = require('./index').utils
const socketEventConst = require('./socketEventConsts')

const events = {}

function register (socket) {
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

  if (socket.request.user.logged_in) {
    joinChatServer(socket)
  }
}

function eventLoop () {
  updateUsers()
  updateOnlineBubbles()
}

events.onUpdateUsers = function (socket) {
  socket.on('updateUsers', updateUsers)
}

events.onSetUserOnlineStatus = function (socket) {
  socket.on(socketEventConst.UI_ONLINE_STATUS_SET, data => {
    const state = data.state
    const user = socket.request.user
    let exists = false

    if (state === 'idle') {
      if (sharedVars.idleUsers.hasOwnProperty(user.username.toLowerCase())) exists = true

      if (!exists) {
        if (user.username.length !== 0) {
          sharedVars.idleUsers[user.username.toLowerCase()] = {
            sockets: [socket.id],
            user
          }

          updateOnlineBubbles()
        }
      } else {
        const idleUser = sharedVars.idleUsers[user.username.toLowerCase()]
        if (!_.isUndefined(idleUser)) {
          idleUser.sockets.push(socket.id)

          updateOnlineBubbles()
        }
      }
    } else if (state === 'active') {
      if (sharedVars.idleUsers.hasOwnProperty(user.username.toLowerCase())) {
        delete sharedVars.idleUsers[user.username.toLowerCase()]

        updateOnlineBubbles()
      }
    }
  })
}

function updateUsers () {
  const sortedUserList = sharedUtils.sortByKeys(sharedVars.usersOnline)
  _.forEach(sortedUserList, function (v) {
    const user = v.user
    const sockets = v.sockets
    if (user && sockets.length > 0) {
      _.forEach(sockets, function (sock) {
        const socket = _.find(sharedVars.sockets, function (s) {
          return s.id === sock
        })

        if (socket) {
          if (user.role.isAdmin || user.role.isAgent) {
            socket.emit('updateUsers', sortedUserList)
          } else {
            GroupModel.getAllGroupsOfUser(user._id, function (err, groups) {
              if (!err) {
                let usersOfGroups = _.map(groups, function (g) {
                  return _.map(g.members, function (m) {
                    return { user: m }
                  })
                })

                const agentsAndAdmins = _.chain(sortedUserList)
                  .filter(function (u) {
                    return u.user.role.isAdmin || u.user.role.isAgent
                  })
                  .map(function (u) {
                    return u
                  })
                  .value()

                usersOfGroups = _.concat(usersOfGroups, agentsAndAdmins)

                let onlineUsernames = _.map(sortedUserList, function (u) {
                  return u.user.username
                })
                onlineUsernames = _.flattenDeep(onlineUsernames)

                const sortedUsernames = _.chain(usersOfGroups)
                  .flattenDeep()
                  .map(function (u) {
                    return u.user.username
                  })
                  .value()

                const actual = _.intersection(onlineUsernames, sortedUsernames)

                usersOfGroups = _.chain(usersOfGroups)
                  .flattenDeep()
                  .filter(function (i) {
                    return actual.indexOf(i.user.username) !== -1
                  })
                  .uniqBy(function (i) {
                    return i.user._id
                  })
                  .value()

                const sortedKeys = _.map(usersOfGroups, function (m) {
                  return m.user.username
                })

                const obj = _.zipObject(sortedKeys, usersOfGroups)

                socket.emit('updateUsers', obj)
              }
            })
          }
        }
      })
    }
  })
  // utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList)
}

function updateOnlineBubbles () {
  const sortedUserList = _.fromPairs(
    _.sortBy(_.toPairs(sharedVars.usersOnline), function (o) {
      return o[0]
    })
  )
  const sortedIdleList = _.fromPairs(
    _.sortBy(_.toPairs(sharedVars.idleUsers), function (o) {
      return o[0]
    })
  )

  utils.sendToAllConnectedClients(io, socketEventConst.UI_ONLINE_STATUS_UPDATE, {
    sortedUserList,
    sortedIdleList
  })
}

events.updateOnlineBubbles = function (socket) {
  socket.on(socketEventConst.UI_ONLINE_STATUS_UPDATE, function () {
    updateOnlineBubbles()
  })
}

async function updateConversationsNotifications (socket) {
  if (socket && socket.request && socket.request.user) {
    const user = socket.request.user
    const Message = require('../models/chat/message')
    const Conversation = require('../models/chat/conversation')

    Conversation.getConversationsWithLimit(user._id, null, (err, conversations) => {
      if (err) {
        winston.warn(err.message)
        return false
      }

      const convos = []

      async.eachSeries(
        conversations,
        (convo, done) => {
          const c = convo.toObject()

          const userMeta = convo.userMeta[_.findIndex(convo.userMeta, i => i.userId.toString() === user._id.toString())]
          if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt) {
            return done()
          }

          Message.getMostRecentMessage(c._id, (err, rm) => {
            if (err) return done(err)

            _.each(c.participants, p => {
              if (p._id.toString() !== user._id.toString()) {
                c.partner = p
              }
            })

            rm = _.first(rm)

            if (!_.isUndefined(rm)) {
              if (!c.partner || !rm.owner) return done()

              if (c.partner._id.toString() === rm.owner._id.toString()) {
                c.recentMessage = c.partner.fullname + ': ' + rm.body
              } else {
                c.recentMessage = 'You: ' + rm.body
              }
            } else {
              c.recentMessage = 'New Conversation'
            }

            convos.push(c)

            return done()
          })
        },
        err => {
          if (err) return false

          return utils.sendToSelf(socket, socketEventConst.MESSAGES_UPDATE_UI_CONVERSATION_NOTIFICATIONS, {
            conversations: convos.length >= 10 ? convos.slice(0, 9) : convos
          })
        }
      )
    })
  }
}

events.updateConversationsNotifications = function (socket) {
  socket.on(socketEventConst.MESSAGES_UPDATE_UI_CONVERSATION_NOTIFICATIONS, function () {
    updateConversationsNotifications(socket)
  })
}

function spawnOpenChatWindows (socket) {
  const loggedInAccountId = socket.request.user._id
  const conversationSchema = require('../models/chat/conversation')
  userSchema.getUser(loggedInAccountId, function (err, user) {
    if (err) return true

    async.eachSeries(user.preferences.openChatWindows, function (convoId, done) {
      let partner = null
      conversationSchema.getConversation(convoId, function (err, conversation) {
        if (err || !conversation) return done()
        _.each(conversation.participants, function (i) {
          if (i._id.toString() !== loggedInAccountId.toString()) {
            partner = i.toObject()
            return partner
          }
        })

        if (partner === null) return done()

        delete partner.password
        delete partner.resetPassHash
        delete partner.resetPassExpire
        delete partner.accessToken
        delete partner.iOSDeviceTokens
        delete partner.deleted

        utils.sendToSelf(socket, 'spawnChatWindow', partner)

        return done()
      })
    })
  })
}

events.getOpenChatWindows = function (socket) {
  socket.on('getOpenChatWindows', function () {
    spawnOpenChatWindows(socket)
  })
}

events.spawnChatWindow = function (socket) {
  socket.on(socketEventConst.MESSAGES_SPAWN_CHAT_WINDOW, function ({ convoId }) {
    if (!socket.request.user || !convoId) return true

    const User = require('../models').UserModel
    User.getUser(socket.request.user._id, function (err, user) {
      if (err) return true
      if (user !== null) {
        user.addOpenChatWindow(convoId)

        utils.sendToUser(
          sharedVars.sockets,
          sharedVars.usersOnline,
          user.username,
          socketEventConst.MESSAGES_UI_SPAWN_CHAT_WINDOW,
          user
        )
      }
    })
  })
}

events.saveChatWindow = function (socket) {
  socket.on(socketEventConst.MESSAGES_SAVE_CHAT_WINDOW, function (data) {
    const { userId, convoId, remove } = data

    const User = require('../models').UserModel
    User.getUser(userId, function (err, user) {
      if (err) return true
      if (user !== null) {
        if (remove) {
          user.removeOpenChatWindow(convoId)
        } else {
          user.addOpenChatWindow(convoId)
        }

        utils.sendToUser(
          sharedVars.sockets,
          sharedVars.usersOnline,
          user.username,
          socketEventConst.MESSAGES_SAVE_CHAT_WINDOW_COMPLETE
        )
      }
    })
  })
}

events.onChatMessage = function (socket) {
  socket.on(socketEventConst.MESSAGES_SEND, function (data) {
    const to = data.to
    const from = data.from

    const User = require('../models').UserModel

    data.message.owner = {
      _id: data.message.owner._id,
      email: data.message.owner.email,
      username: data.message.owner.username,
      fullname: data.message.owner.fullname,
      image: data.message.owner.image,
      title: data.message.owner.title,
      lastOnline: data.message.owner.lastOnline,
      id: data.message.owner._id
    }

    async.parallel(
      [
        function (next) {
          User.getUser(to, function (err, toUser) {
            if (err) return next(err)
            if (!toUser) return next('User Not Found!')

            // Strip
            data.toUser = {
              _id: toUser._id,
              email: toUser.email,
              username: toUser.username,
              fullname: toUser.fullname,
              image: toUser.image,
              title: toUser.title,
              lastOnline: toUser.lastOnline,
              id: toUser._id
            }

            return next()
          })
        },
        function (next) {
          User.getUser(from, function (err, fromUser) {
            if (err) return next(err)
            if (!fromUser) return next('User Not Found')

            // Strip
            data.fromUser = {
              _id: fromUser._id,
              email: fromUser.email,
              username: fromUser.username,
              fullname: fromUser.fullname,
              image: fromUser.image,
              title: fromUser.title,
              lastOnline: fromUser.lastOnline,
              id: fromUser._id
            }

            return next()
          })
        }
      ],
      function (err) {
        if (err) return utils.sendToSelf(socket, socketEventConst.MESSAGES_UI_RECEIVE, { message: err })

        utils.sendToUser(
          sharedVars.sockets,
          sharedVars.usersOnline,
          data.toUser.username,
          socketEventConst.MESSAGES_UI_RECEIVE,
          data
        )

        utils.sendToUser(
          sharedVars.sockets,
          sharedVars.usersOnline,
          data.fromUser.username,
          socketEventConst.MESSAGES_UI_RECEIVE,
          data
        )
      }
    )
  })
}

events.onChatTyping = function (socket) {
  socket.on(socketEventConst.MESSAGES_USER_TYPING, function (data) {
    const to = data.to
    const from = data.from

    let user = null
    let fromUser = null

    _.find(sharedVars.usersOnline, function (v) {
      if (String(v.user._id) === String(to)) {
        user = v.user
      }

      if (String(v.user._id) === String(from)) {
        fromUser = v.user
      }
    })

    if (_.isNull(user) || _.isNull(fromUser)) {
      return
    }

    data.toUser = user
    data.fromUser = fromUser

    utils.sendToUser(
      sharedVars.sockets,
      sharedVars.usersOnline,
      user.username,
      socketEventConst.MESSAGES_UI_USER_TYPING,
      data
    )
  })
}

events.onChatStopTyping = function (socket) {
  socket.on(socketEventConst.MESSAGES_USER_STOP_TYPING, function (data) {
    const to = data.to
    let user = null

    _.find(sharedVars.usersOnline, function (v) {
      if (String(v.user._id) === String(to)) {
        user = v.user
      }
    })

    if (_.isNull(user)) {
      return
    }

    data.toUser = user

    utils.sendToUser(
      sharedVars.sockets,
      sharedVars.usersOnline,
      user.username,
      socketEventConst.MESSAGES_UI_USER_STOP_TYPING,
      data
    )
  })
}

function joinChatServer (socket) {
  const user = socket.request.user
  let exists = false
  if (sharedVars.usersOnline.hasOwnProperty(user.username.toLowerCase())) {
    exists = true
  }

  if (!exists) {
    if (user.username.length !== 0) {
      sharedVars.usersOnline[user.username] = {
        sockets: [socket.id],
        user
      }
      // sortedUserList = sharedUtils.sortByKeys(sharedVars.usersOnline)

      utils.sendToSelf(socket, 'joinSuccessfully')
      // utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList)
      sharedVars.sockets.push(socket)

      spawnOpenChatWindows(socket, user._id)
    }
  } else {
    sharedVars.usersOnline[user.username].sockets.push(socket.id)
    utils.sendToSelf(socket, 'joinSuccessfully')

    // sortedUserList = sharedUtils.sortByKeys(sharedVars.usersOnline)
    // utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList)
    sharedVars.sockets.push(socket)

    spawnOpenChatWindows(socket, user._id)
  }

  updateOnlineBubbles()
}

events.onDisconnect = function (socket) {
  socket.on('disconnect', function (reason) {
    const user = socket.request.user

    if (!_.isUndefined(sharedVars.usersOnline[user.username])) {
      const userSockets = sharedVars.usersOnline[user.username].sockets

      if (_.size(userSockets) < 2) {
        delete sharedVars.usersOnline[user.username]
      } else {
        sharedVars.usersOnline[user.username].sockets = _.without(userSockets, socket.id)
      }

      const o = _.findKey(sharedVars.sockets, { id: socket.id })
      sharedVars.sockets = _.without(sharedVars.sockets, o)
    }

    if (!_.isUndefined(sharedVars.idleUsers[user.username])) {
      const idleSockets = sharedVars.idleUsers[user.username].sockets

      if (_.size(idleSockets) < 2) {
        delete sharedVars.idleUsers[user.username]
      } else {
        sharedVars.idleUsers[user.username].sockets = _.without(idleSockets, socket.id)
      }

      const i = _.findKey(sharedVars.sockets, { id: socket.id })
      sharedVars.sockets = _.without(sharedVars.sockets, i)
    }

    // Save lastOnline Time
    userSchema.getUser(user._id, function (err, u) {
      if (!err && u) {
        u.lastOnline = new Date()

        u.save()
      }
    })

    // updateOnlineBubbles()

    if (reason === 'transport error') {
      reason = 'client terminated'
    }

    winston.debug('User disconnected (' + reason + '): ' + user.username + ' - ' + socket.id)
  })
}

module.exports = {
  events,
  eventLoop,
  register
}
