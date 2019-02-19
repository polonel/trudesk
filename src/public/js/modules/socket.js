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

define('modules/socket', ['modules/chat', 'modules/ui', 'modules/socket.io/accountsImporter'], function (
  chat,
  ui,
  accountsImporter
) {
  var socket = io.connect({
    transports: ['polling', 'websocket']
  })

  var sClient = {
    socket: socket
  }

  ui.init(socket)
  sClient.ui = ui

  chat.init(socket)
  sClient.chat = chat

  accountsImporter.init(socket)
  sClient.accountsImporter = accountsImporter

  return sClient
})
