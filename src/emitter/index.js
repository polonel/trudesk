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

'use strict'

var eventEmitter = new (require('events')).EventEmitter()

eventEmitter.all = function (events, callback) {
  var eventList = events.slice(0)

  function onEvent (event) {
    eventEmitter.on(events[event], function () {
      eventList.splice(eventList.indexOf(events[event]), 1)

      if (eventList.length === 0) {
        callback()
      }
    })
  }

  for (var ev in events) {
    if (events.hasOwnProperty(ev)) {
      onEvent(ev)
    }
  }
}

eventEmitter.any = function (events, callback) {
  function onEvent (event) {
    eventEmitter.on(events[event], function () {
      if (events !== null) {
        callback()
      }

      events = null
    })
  }

  for (var ev in events) {
    if (events.hasOwnProperty(ev)) {
      onEvent(ev)
    }
  }
}

module.exports = eventEmitter
