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

var utils = require('../helpers/utils')
var path = require('path')
var AnsiUp = require('ansi_up')
var ansiUp = new AnsiUp.default()
var fileTailer = require('file-tail')
var fs = require('fs-extra')

var logFile = path.join(__dirname, '../logs/output.log')

var events = {}

function register (socket) {
  events.onLogsFetch(socket)
}

function eventLoop () {}
events.onLogsFetch = function (socket) {
  socket.on('logs:fetch', function () {
    if (!fs.existsSync(logFile)) {
      utils.sendToSelf(socket, 'logs:data', 'Invalid Log File...')
    } else {
      var ft = fileTailer.startTailing(logFile)
      ft.on('line', function (line) {
        utils.sendToSelf(socket, 'logs:data', ansiUp.ansi_to_html(line))
      })
    }
  })
}

module.exports = {
  events: events,
  eventLoop: eventLoop,
  register: register
}
