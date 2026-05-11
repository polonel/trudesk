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
import path from 'path'
import { AnsiUp } from 'ansi_up'
 
// @ts-ignore
import { Tail } from 'tail'
import fs from 'fs-extra'

const ansiUp = new AnsiUp()
const logFile = path.join(__dirname, '../../logs/error.log')

interface LogsSocketEvents {
  onLogsFetch: (socket: Socket) => void
}

const events = {} as LogsSocketEvents

function register(socket: Socket): void {
  events.onLogsFetch(socket)
}

events.onLogsFetch = function (socket: Socket): void {
  socket.on('logs:fetch', function () {
    fs.exists(logFile, function (exists: boolean) {
      if (exists) {
        const contents = fs.readFileSync(logFile, 'utf8')
        utils.sendToSelf(socket, 'logs:data', ansiUp.ansi_to_html(contents))

        const tail = new Tail(logFile)

        tail.on('line', function (data: string) {
          utils.sendToSelf(socket, 'logs:data', ansiUp.ansi_to_html(data))
        })
      } else {
        utils.sendToSelf(socket, 'logs:data', '\r\nInvalid Log File...\r\n')
      }
    })
  })
}

export { events, register }
export default { events, register }
