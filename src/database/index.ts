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

import nconf from 'nconf'
import mongoose from 'mongoose'
import winston from '../logger'

// Type Defs
export type TrudeskDatabase = {
  connection: mongoose.Connection | null
  version?: string
}
type DBCallback = (err: Error | null, db: TrudeskDatabase | null) => void
type MongoConnectionUriObject = {
  server: string
  port: string
  username: string
  password: string
  database: string
  shard: boolean
}
// End Type Defs

const db: TrudeskDatabase = {
  connection: global.dbConnection
}

export function getConnectionUri(): string {
  let CONNECTION_URI

  const mongoConnectionUri: MongoConnectionUriObject = {
    server: process.env["TD_MONGODB_SERVER"] || nconf.get('mongo:host'),
    port: process.env["TD_MONGODB_PORT"] || nconf.get('mongo:port') || '27017',
    username: process.env["TD_MONGODB_USERNAME"] || nconf.get('mongo:username'),
    password: process.env["TD_MONGODB_PASSWORD"] || nconf.get('mongo:password'),
    database: process.env["TD_MONGODB_DATABASE"] || nconf.get('mongo:database'),
    shard: process.env["TD_MONGODB_SHARD"] || nconf.get('mongo:shard')
  }

  if (!mongoConnectionUri.username) {
    CONNECTION_URI =
      'mongodb://' + mongoConnectionUri.server + ':' + mongoConnectionUri.port + '/' + mongoConnectionUri.database
    if (mongoConnectionUri.shard)
      CONNECTION_URI = 'mongodb+srv://' + mongoConnectionUri.server + '/' + mongoConnectionUri.database
  } else {
    mongoConnectionUri.password = encodeURIComponent(mongoConnectionUri.password)
    if (mongoConnectionUri.shard)
      CONNECTION_URI =
        'mongodb+srv://' +
        mongoConnectionUri.username +
        ':' +
        mongoConnectionUri.password +
        '@' +
        mongoConnectionUri.server +
        '/' +
        mongoConnectionUri.database
    else
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

  return CONNECTION_URI
}

export async function init(callback: DBCallback, connectionString?: string, opts?: mongoose.ConnectOptions) {
  let options: mongoose.ConnectOptions = {
    keepAlive: true,
    connectTimeoutMS: 30000
  }

  if (opts) options = opts
  options.dbName = process.env["TD_MONGODB_DATABASE"] || nconf.get("mongo:database")

  let CONNECTION_URI
  if (connectionString) CONNECTION_URI = connectionString
  else if (process.env["TD_MONGODB_URI"]) CONNECTION_URI = process.env["TD_MONGODB_URI"]
  else {
    CONNECTION_URI = getConnectionUri()
  }

  if (db.connection) {
    return callback(null, db)
  }

  global.CONNECTION_URI = CONNECTION_URI

  mongoose.Promise = global.Promise
  mongoose
    .connect(CONNECTION_URI, options)
    .then(function () {
      if (!process.env["FORK"]) {
        winston.info('Connected to MongoDB')
      }

      db.connection = mongoose.connection
      global.dbConnection = db.connection
      mongoose.connection.db.admin()
        .command({ buildInfo: 1 }, function (err, result): void {
          if (err) winston.warn(err.message)
          db.version = result ? result["version"] : 'unknown'
          return callback(null, db)
        })
    })
    .catch(function (e) {
      winston.error('Oh no, something went wrong with DB! - ' + e.message)
      db.connection = null
      global.dbConnection = null
      return callback(e, null)
    })
}

export const trudeskDatabase = db
export const connectionuri = getConnectionUri()

export default trudeskDatabase
