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

var database = require('../database')
var winston = require('winston')

global.env = process.env.NODE_ENV || 'production'

winston.setLevels(winston.config.cli.levels)
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  colorize: true,
  timestamp: function () {
    var date = new Date()
    return (
      date.getMonth() +
      1 +
      '/' +
      date.getDate() +
      ' ' +
      date.toTimeString().substr(0, 8) +
      ' [Child:MongoTest:' +
      global.process.pid +
      ']'
    )
  },
  level: global.env === 'production' ? 'info' : 'verbose'
})
;(function () {
  var CONNECTION_URI = process.env.MONGOTESTURI
  if (!CONNECTION_URI) return process.send({ error: { message: 'Invalid connection uri' } })
  var options = {
    keepAlive: 0,
    auto_reconnect: false,
    connectTimeoutMS: 5000,
    useNewUrlParser: true
  }
  database.init(
    function (e, db) {
      if (e) {
        return process.send({ error: e })
        // return process.kill(0)
      }

      if (!db) {
        return process.send({ error: { message: 'Unable to open database' } })
        // return process.kill(0)
      }

      return process.send({ success: true })
    },
    CONNECTION_URI,
    options
  )
})()
