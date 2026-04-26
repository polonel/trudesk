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

import fs from 'fs-extra'
import path from 'path'
import { spawn } from 'child_process'
import os from 'os'
import { promisify } from 'util'
import AdmZip from 'adm-zip'
import rimrafCb from 'rimraf'
import { init as dbInit, trudeskDatabase } from '../database'
import winston from '../logger'
import config from '../config'

global.env = process.env.NODE_ENV || 'production'

const rimraf = promisify(rimrafCb)

const root = () => config.trudeskRoot()

let CONNECTION_URI = null
let databaseName = null

async function cleanup () {
  await rimraf(path.resolve(root(), 'restores/restore_*'))
}

async function cleanUploads () {
  await rimraf(path.resolve(root(), 'public/uploads/*'))
}

async function copyUploads (file) {
  const restoreBase = path.resolve(root(), `restores/restore_${file}`)
  const uploadsBase = path.resolve(root(), 'public/uploads')

  await Promise.all([
    fs.copy(path.join(restoreBase, 'assets'), path.join(uploadsBase, 'assets')),
    fs.copy(path.join(restoreBase, 'users'), path.join(uploadsBase, 'users')),
    fs.copy(path.join(restoreBase, 'tickets'), path.join(uploadsBase, 'tickets'))
  ])
}

function extractArchive (file) {
  const zip = new AdmZip(path.resolve(root(), 'backups', file))
  zip.extractAllTo(path.resolve(root(), `restores/restore_${file}/`), true)
}

async function cleanMongoDb () {
  await trudeskDatabase.connection.db.dropDatabase()
}

function runRestore (file) {
  return new Promise((resolve, reject) => {
    const platform = os.platform()
    winston.info(`Starting Restore... (${platform})`)

    const dbName = fs.readdirSync(path.resolve(root(), `restores/restore_${file}`, 'database'))[0]
    if (!dbName) return reject(new Error('Invalid Backup. Unable to get DBName'))

    const options = [
      '--uri', CONNECTION_URI,
      '-d', databaseName,
      path.resolve(root(), `restores/restore_${file}`, 'database', dbName),
      '--noIndexRestore'
    ]

    const mongorestore = platform === 'win32'
      ? spawn(path.resolve(root(), 'src/backup/bin', platform, 'mongorestore'), options, { env: { PATH: process.env.PATH } })
      : spawn('mongorestore', options, { env: { PATH: process.env.PATH } })

    mongorestore.stdout.on('data', data => winston.debug(data.toString()))
    mongorestore.stderr.on('data', data => winston.debug(data.toString()))
    mongorestore.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`mongorestore failed with code ${code}`))
    })
  })
}

function initDatabase (uri, opts) {
  return new Promise((resolve, reject) => {
    dbInit((err, db) => {
      if (err) return reject(err)
      if (!db) return reject(new Error('Unable to open database'))
      resolve(db)
    }, uri, opts)
  })
}

;(async function () {
  CONNECTION_URI = process.env.MONGOURI
  if (!CONNECTION_URI) return process.send({ success: false, error: 'Invalid connection uri' })

  const FILE = process.env.FILE
  if (!FILE) return process.send({ success: false, error: 'Invalid File' })

  if (!fs.existsSync(path.resolve(root(), 'backups', FILE))) {
    return process.send({ success: false, error: 'FILE NOT FOUND' })
  }

  try {
    await initDatabase(CONNECTION_URI, { keepAlive: true, connectTimeoutMS: 5000 })

    databaseName = trudeskDatabase.connection.db.databaseName
    if (!databaseName) throw new Error('Unable to get database name')

    fs.ensureDirSync(path.resolve(root(), 'restores'))

    await cleanup()
    await cleanUploads()
    extractArchive(FILE)
    await cleanMongoDb()
    await runRestore(FILE)
    await copyUploads(FILE)
    await cleanup()

    process.send({ success: true })
  } catch (err) {
    process.send({ success: false, error: err })
  }
})()
