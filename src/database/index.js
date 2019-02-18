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
var nconf = require('nconf')
var mongoose = require('mongoose')
var winston = require('winston')

var db = {}
var mongoConnectionUri = {
  server: process.env.TD_MONGODB_SERVER || nconf.get('mongo:host'),
  port: process.env.TD_MONGODB_PORT || nconf.get('mongo:port') || '27017',
  username: process.env.TD_MONGODB_USERNAME || nconf.get('mongo:username'),
  password: process.env.TD_MONGODB_PASSWORD || nconf.get('mongo:password'),
  database: process.env.TD_MONGODB_DATABASE ? 'trudesk_' + process.env.MONGODB_DATABASE : nconf.get('mongo:database')
}

var CONNECTION_URI = ''
if (!mongoConnectionUri.username)
  CONNECTION_URI =
    'mongodb://' + mongoConnectionUri.server + ':' + mongoConnectionUri.port + '/' + mongoConnectionUri.database
else {
  mongoConnectionUri.password = encodeURIComponent(mongoConnectionUri.password)
  CONNECTION_URI =
    'mongodb://' +
    mongoConnectionUri.username +
    ':' +
    mongoConnectionUri.password +
    '@' +
    mongoConnectionUri.server +
    ':' +
    mongoConnectionUri.port +
    '/' +
    mongoConnectionUri.database
}

var options = {
  keepAlive: 1,
  connectTimeoutMS: 30000,
  useNewUrlParser: true,
  useCreateIndex: true
}

module.exports.init = function (callback, connectionString, opts) {
  if (connectionString) CONNECTION_URI = connectionString
  if (opts) options = opts

  if (db.connection) {
    return callback(null, db)
  }

  mongoose.Promise = global.Promise
  mongoose.set('useFindAndModify', false)
  mongoose
    .connect(CONNECTION_URI, options)
    .then(function () {
      if (!process.env.FORK) {
        winston.info('Connected to MongoDB')
      }

      db.connection = mongoose.connection

      return callback(null, db)
    })
    .catch(function (e) {
      winston.error('Oh no, something went wrong with DB! - ' + e.message)
      db.connection = null

      return callback(e, null)
    })
}

module.exports.db = db
module.exports.connectionuri = CONNECTION_URI
