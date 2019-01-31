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

var _ = require('lodash')
var nodeMailer = require('nodemailer')

var settings = require('../models/setting')

var mailer = {}

mailer.sendMail = function (data, callback) {
  createTransporter(function (err, mailSettings) {
    if (err) return callback(err)
    if (!mailSettings || !mailSettings.enabled) {
      // Mail Disabled
      return callback(null, 'Mail Disabled')
    }

    if (!mailSettings.from) return callback('No From Address Set.')

    data.from = mailSettings.from.value

    if (!data.from) return callback('No From Address Set.')

    mailSettings.transporter.sendMail(data, callback)
  })
}

mailer.verify = function (callback) {
  createTransporter(function (err, mailSettings) {
    if (err) return callback(err)

    if (!mailSettings.enabled) return callback({ code: 'Mail Disabled' })

    mailSettings.transporter.verify(function (err) {
      if (err) return callback(err)

      return callback()
    })
  })
}

function createTransporter (callback) {
  settings.getSettings(function (err, s) {
    if (err) return callback(err)

    var mailSettings = {}
    mailSettings.enabled = _.find(s, function (x) {
      return x.name === 'mailer:enable'
    })
    mailSettings.host = _.find(s, function (x) {
      return x.name === 'mailer:host'
    })
    mailSettings.ssl = _.find(s, function (x) {
      return x.name === 'mailer:ssl'
    })
    mailSettings.port = _.find(s, function (x) {
      return x.name === 'mailer:port'
    })
    mailSettings.username = _.find(s, function (x) {
      return x.name === 'mailer:username'
    })
    mailSettings.password = _.find(s, function (x) {
      return x.name === 'mailer:password'
    })
    mailSettings.from = _.find(s, function (x) {
      return x.name === 'mailer:from'
    })

    mailSettings.enabled = mailSettings.enabled && mailSettings.enabled.value ? mailSettings.enabled.value : false

    var transport = {
      host: mailSettings.host && mailSettings.host.value ? mailSettings.host.value : '127.0.0.1',
      port: mailSettings.port && mailSettings.port.value ? mailSettings.port.value : 25,
      secure: mailSettings.ssl && mailSettings.ssl.value ? mailSettings.ssl.value : false,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    }
    if (mailSettings.username && mailSettings.username.value) {
      transport.auth = {
        user: mailSettings.username.value,
        pass: mailSettings.password && mailSettings.password.value ? mailSettings.password.value : ''
      }
    }

    mailSettings.transporter = nodeMailer.createTransport(transport)
    mailer.transporter = mailSettings.transporter

    return callback(null, mailSettings)
  })
}

module.exports = mailer
