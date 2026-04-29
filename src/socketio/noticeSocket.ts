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
import winston from '../logger'
import utils from '../helpers/utils'
import { NoticeModel as noticeSchema } from '../models'
import socketEventConst from './socketEventConsts'

declare const io: any

interface NoticeSocketEvents {
  onShowNotice: (socket: Socket) => void
  onClearNotice: (socket: Socket) => void
}

const events = {} as NoticeSocketEvents

function register(socket: Socket): void {
  events.onShowNotice(socket)
  events.onClearNotice(socket)
}

events.onShowNotice = (socket: Socket) => {
  socket.on(socketEventConst.NOTICE_SHOW, async function ({ noticeId }: { noticeId: string }) {
    try {
      const notice = await noticeSchema.getNotice(noticeId)
      if (!notice) return

      ;(notice as any).activeDate = new Date()
      await (notice as any).save()

      utils.sendToAllConnectedClients(io, socketEventConst.NOTICE_UI_SHOW, notice)
    } catch (err) {
      winston.warn((err as Error).message)
    }
  })
}

events.onClearNotice = function (socket: Socket): void {
  socket.on(socketEventConst.NOTICE_CLEAR, function () {
    utils.sendToAllConnectedClients(io, socketEventConst.NOTICE_UI_CLEAR)
  })
}

export { events, register }
export default { events, register }
