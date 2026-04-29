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

import type { Socket } from 'socket.io'
import utils from '../helpers/utils'
import { shared as sharedVars } from './index'
import socketEvents from './socketEventConsts'

declare const io: any

interface BackupRestoreSocketEvents {
  showRestoreOverlay: (socket: Socket) => void
  emitRestoreComplete: (socket: Socket) => void
}

const events = {} as BackupRestoreSocketEvents

function register(socket: Socket): void {
  events.showRestoreOverlay(socket)
  events.emitRestoreComplete(socket)
}

events.showRestoreOverlay = function (socket: Socket): void {
  socket.on(socketEvents.BACKUP_RESTORE_SHOW_OVERLAY, function () {
    if (global.socketServer && (global.socketServer as any).eventLoop) {
      ;(global.socketServer as any).eventLoop.stop()
    }

    utils.sendToAllConnectedClients(io, socketEvents.BACKUP_RESTORE_UI_SHOW_OVERLAY)
  })
}

events.emitRestoreComplete = function (socket: Socket): void {
  socket.on(socketEvents.BACKUP_RESTORE_COMPLETE, function () {
    utils.sendToAllConnectedClients(io, socketEvents.BACKUP_RESTORE_UI_COMPLETE)
    utils.disconnectAllClients(io)
    sharedVars.sockets = []
    sharedVars.usersOnline = {}
    sharedVars.idleUsers = {}
  })
}

export { events, register }
export default { events, register }
