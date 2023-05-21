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

import cookie from 'cookie'
import type { IncomingMessage } from 'http'
import jwt from 'jsonwebtoken'
import { Server, Socket } from 'socket.io'
import type { ExtendedError } from 'socket.io/dist/namespace'
import config from './config'
import winston from './logger'
import { SessionModel, UserModel } from './models'
import type { UserModelClass } from './models/user'
import accountsImportSocket from './socketio/accountImportSocket'
import backupRestoreSocket from './socketio/backupRestoreSocket'
import chatSocket from './socketio/chatSocket'
import logsSocket from './socketio/logsSocket'
import noticeSocket from './socketio/noticeSocket'
import notificationSocket from './socketio/notificationSocket'
import ticketSocket from './socketio/ticketSocket'
import type { WebServer } from './webserver'

interface ServerToClientEvents {
  unauthorized: () => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ClientToServerEvents {
}

interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  name: string
  user: any
}

interface ExtendedUser extends UserModelClass {
  logged_in?: boolean
}

interface ExtendedSocket extends Socket {
  token: string
  user: ExtendedUser
}

interface DecodedSocketJWT {
  s: string
  r: string
}

interface QueryIncomingMessage extends IncomingMessage {
  name: string
  _query: { token: string }
  user: ExtendedUser
}

export const SocketServer = function (ws: WebServer) {
  const socketConfig = {
    pingTimeout: config.get('socket:pingTimeout') ? config.get('socket:pingTimeout') : 15000,
    pingInterval: config.get('socket:pingInterval') ? config.get('socket:pingInterval') : 30000,
    secret: config.get('tokens:secret') ? config.get('tokens:secret') : 'trudesk$1234#SessionKeY!2288',
  }

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(ws.server, {
    pingTimeout: socketConfig.pingTimeout,
    pingInterval: socketConfig.pingInterval,
  })

  io.use(function (data, accept) {
    ;(async () => {
      try {
        const queryRequest = data.request as QueryIncomingMessage
        const _query = queryRequest?._query
        const extendedSocket = data as ExtendedSocket
        if (_query.token) {
          const user = (await UserModel.findOne({ accessToken: _query.token, deleted: false })) as UserModelClass
          if (user) {
            winston.debug('Authenticated socket ' + data.id + ' - ' + user.username)
            queryRequest.user = user
            queryRequest.user.logged_in = true
            extendedSocket.token = queryRequest._query.token
          } else {
            data.emit('unauthorized')
            data.disconnect(true)
          }
        }

        if (queryRequest && queryRequest.user && queryRequest.user.logged_in) {
          extendedSocket.user = queryRequest.user
          return accept()
        }

        const parsedCookies = cookie.parse(extendedSocket.handshake?.headers?.cookie as string)
        const rftJWT = parsedCookies['_rft_']

        if (!rftJWT) {
          data.emit('unauthorized')
          data.disconnect(true)
          return accept(new Error('Invalid Token'))
        }

        const decoded = jwt.verify(rftJWT, config.get('tokens:secret')) as DecodedSocketJWT
        const session = await SessionModel.findOne({ _id: decoded.s, refreshToken: decoded.r }).populate('user')
        if (!session) throw new Error('Invalid Session')

        queryRequest.user = session.user as ExtendedUser
        queryRequest.user.logged_in = true

        onAuthorizeSuccess(queryRequest, accept)

        // return passportSocketIo.authorize({
        //   key: 'connect.sid',
        //   store: ws.sessionStore,
        //   secret: socketConfig.secret,
        //   success: onAuthorizeSuccess,
        // })(extendedSocket, accept)
      } catch (err) {
        data.emit('unauthorized')
        winston.warn((err as ExtendedError).message)
        return accept(err as ExtendedError)
      }
    })()
  })

  // io.set('transports', ['polling', 'websocket'])

  io.sockets.on('connection', (socket) => {
    // Register Submodules
    ticketSocket.register(socket)
    chatSocket.register(socket)
    notificationSocket.register(socket)
    noticeSocket.register(socket)
    accountsImportSocket.register(socket)
    backupRestoreSocket.register(socket)
    logsSocket.register(socket)
  })

  global.io = io

  // Register Event Loop
  global.socketServer = {
    eventLoop: {
      _loop: 0,
      start: () => {
        global.socketServer.eventLoop._loop = setInterval(() => {
          // The main socket event loop.
          notificationSocket.eventLoop()
          chatSocket.eventLoop()
        }, 5000)
      },
      stop: () => {
        clearInterval(global.socketServer.eventLoop._loop)
      },
    },
  }

  global.socketServer.eventLoop.start()

  winston.info('SocketServer Running')
}

function onAuthorizeSuccess(data: SocketData, accept: () => void) {
  winston.debug('User successfully connected: ' + data.user.username)

  accept()
}
