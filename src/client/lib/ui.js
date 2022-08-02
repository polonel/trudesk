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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define('modules/ui', ['serverSocket/socketEventConsts', 'jquery', 'lodash', 'uikit', 'helpers', 'history'], function (
  socketEvents,
  $,
  _,
  UIKit,
  helpers
) {
  const socketUi = {}

  let socket

  socketUi.init = function (sock) {
    socketUi.socket = socket = sock

    this.flushRoles()

    // Events
    this.onProfileImageUpdate()
  }

  socketUi.fetchServerLogs = function () {
    socket.emit('logs:fetch')
  }

  socketUi.flushRoles = function () {
    socket.removeAllListeners(socketEvents.ROLES_FLUSH)
    socket.on(socketEvents.ROLES_FLUSH, function () {
      helpers.flushRoles()
    })
  }

  socketUi.onProfileImageUpdate = function () {
    socket.removeAllListeners('trudesk:profileImageUpdate')
    socket.on('trudesk:profileImageUpdate', function (data) {
      var profileImage = $('#profileImage[data-userid="' + data.userid + '"]')
      if (profileImage.length > 0) {
        profileImage.attr('src', '/uploads/users/' + data.img + '?r=' + new Date().getTime())
      }
    })
  }

  return socketUi
})
