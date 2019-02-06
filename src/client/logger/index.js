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
 *  Updated:    2/3/19 3:32 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import debug from 'debug'

const BASE = 'trudesk'
const COLOURS = {
  debug: 'blue',
  info: 'green',
  warn: 'pink',
  error: 'red'
} // choose better colours :)

class Log {
  generateMessage (level, message, source) {
    // Set the prefix which will cause debug to enable the message
    const namespace = `${BASE}:${level}`
    const createDebug = debug(namespace)

    // Set the colour of the message based on the level
    createDebug.color = COLOURS[level]

    if (source) {
      createDebug(source, message)
    } else {
      createDebug(message)
    }
  }

  debug (message, source) {
    return this.generateMessage('debug', message, source)
  }

  info (message, source) {
    return this.generateMessage('info', message, source)
  }

  warn (message, source) {
    return this.generateMessage('warn', message, source)
  }

  error (message, source) {
    return this.generateMessage('error', message, source)
  }
}

export default new Log()
