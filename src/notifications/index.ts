/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b 888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import winston from 'winston'
import * as request from 'request'

interface NotificationData {
  hostname?: string
  users: string[]
  ticketId?: string
  ticketUid?: string
}

interface Notification {
  title: string
  content: string
  data: NotificationData
}

export function pushNotification(tpsUsername: string, tpsApiKey: string, notification: Notification): void {
  const body = {
    title: notification.title,
    content: notification.content,
    data: {
      hostname: notification.data.hostname,
      users: notification.data.users
    }
  }

  if (notification.data.ticketId) {
    (body.data as any).ticketId = notification.data.ticketId
  }

  if (notification.data.ticketUid) {
    (body.data as any).ticketUid = notification.data.ticketUid
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
    function (err: any, response: any) {
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

export function init(): void {
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