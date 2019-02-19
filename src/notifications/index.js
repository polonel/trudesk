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

var winston = require('winston')
var request = require('request')

module.exports.pushNotification = function (tpsUsername, tpsApiKey, notification) {
  var body = {
    title: notification.title,
    content: notification.content,
    data: {
      hostname: notification.hostname,
      users: notification.data.users
    }
  }

  if (notification.data.ticketId) {
    body.data.ticketId = notification.data.ticketId
  }

  if (notification.data.ticketUid) {
    body.data.ticketUid = notification.data.ticketUid
  }

  request(
    {
      url: 'http://push.trudesk.io/api/pushNotification',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accesstoken: tpsApiKey
      },
      body: JSON.stringify(body)
    },
    function (err, response) {
      if (err) {
        winston.debug(err)
      } else {
        if (response.statusCode === 401) {
          winston.warn('[trudesk:TPS:pushNotification] Error - Invalid API Key and or Username.')
        }
      }
    }
  )
}

module.exports.init = function () {
  // emitter.on('ticket:created', onTicketCreate);
  // emitter.on('notification:count:update', onNotificationCountUpdate);
}

// function onTicketCreate(ticketObj) {
//
// }
//
// function onNotificationCountUpdate(user) {
//
// }
