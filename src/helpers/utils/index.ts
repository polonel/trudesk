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
import xss from 'xss'
import fs from 'fs'
import winston from '../../logger'
import piexifjs from 'piexifjs'

const MAX_FIELD_TEXT_LENGTH = 255
const MAX_SHORT_FIELD_TEXT_LENGTH = 25
const MAX_EXTREME_TEXT_LENGTH = 2000

export const applyMaxTextLength = function (text: string | number): string {
  return text.toString().substring(0, MAX_FIELD_TEXT_LENGTH)
}

export const applyMaxShortTextLength = function (text: string | number): string {
  return text.toString().substring(0, MAX_SHORT_FIELD_TEXT_LENGTH)
}

export const applyExtremeTextLength = function (text: string | number): string {
  return text.toString().substring(0, MAX_EXTREME_TEXT_LENGTH)
}

export const sanitizeFieldPlainText = function (text: string): string {
  return xss(text, {
    whileList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  })
}

export const stripExifData = function (path: string): void {
  try {
    const imgData = fs.readFileSync(path).toString('binary')
    const newImgData = piexifjs.remove(imgData)
    fs.writeFileSync(path, newImgData, 'binary')
  } catch (e) {
    winston.warn(e)
  }
}

export const sendToSelf = function (socket: any, method: string, data: any): void {
  socket.emit(method, data)
}

export const _sendToSelf = function (io: any, socketId: string, method: string, data: any): void {
  _.each(io.sockets.sockets, function (socket) {
    if (socket.id === socketId) {
      socket.emit(method, data)
    }
  })
}

export const sendToAllConnectedClients = function (io: any, method: string, data: any): void {
  io.sockets.emit(method, data)
}

export const sendToAllClientsInRoom = function (io: any, room: string, method: string, data: any): void {
  io.sockets.in(room).emit(method, data)
}

export const sendToUser = function (socketList: any[], userList: any, username: string, method: string, data: any): void {
  let userOnline = null

  _.forEach(userList, function (v, k) {
    if (k.toLowerCase() === username.toLowerCase()) {
      userOnline = v
      return true
    }
  })

  if (_.isNull(userOnline)) return

  _.forEach(userOnline.sockets, function (socket: any) {
    const o = _.findKey(socketList, { id: socket })
    const i = socketList[o]
    if (_.isUndefined(i)) return
    i.emit(method, data)
  })
}

export const sendToAllExcept = function (io: any, exceptSocketId: string, method: string, data: any): void {
  _.each(io.sockets.sockets, function (socket) {
    if (socket.id !== exceptSocketId) {
      socket.emit(method, data)
    }
  })
}

export const disconnectAllClients = function (io: any): void {
  Object.keys(io.sockets.sockets).forEach(function (sock) {
    io.sockets.sockets[sock].disconnect(true)
  })
}

// Export as default for compatibility with existing code
export default {
  applyMaxTextLength,
  applyMaxShortTextLength,
  applyExtremeTextLength,
  sanitizeFieldPlainText,
  stripExifData,
  sendToSelf,
  _sendToSelf,
  sendToAllConnectedClients,
  sendToAllClientsInRoom,
  sendToUser,
  sendToAllExcept,
  disconnectAllClients
}