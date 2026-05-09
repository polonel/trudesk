/* eslint-disable no-unused-expressions */
/* globals server socketServer */

const { TicketTypeModel, UserModel, GroupModel } = require('../src/models')
const mongoose = require('mongoose')
const _ = require('lodash')
const { MongoMemoryServer } = require('mongodb-memory-server')

const expect = require('chai').expect
const path = require('path')

require('../src/config').default.loadConfig()
require('../src/models')

const TEST_DB_NAME = 'polonel_trudesk31908899'

let database, db, mongod, CONNECTION_URI

before(async function () {
  this.timeout(60000)

  delete require.cache[require.resolve('../src/database')]
  delete require.cache[require.resolve('mongoose')]

  database = require('../src/database')
  await mongoose.connection.close()

  mongod = new MongoMemoryServer({
    binary: {
      version: "5.0.6",
    }
  })

  await mongod.start();

  CONNECTION_URI = mongod.getUri() + TEST_DB_NAME;

  await new Promise((resolve, reject) => {
    database.init(function (err, d) {
      if (err) return reject(err)
      expect(d).to.be.a('object')
      expect(d.connection).to.exist
      db = d
      resolve()
    }, CONNECTION_URI)
  })

  if (mongoose.connection.db.namespace !== TEST_DB_NAME) {
    throw new Error('Invalid Test Database. Exiting...')
  }

  const counter = require('../src/models/counters')
  await counter.default.setCounter('tickets', 1000)

  await TicketTypeModel.insertMany([{ name: 'Task' }, { name: 'Issue' }])

  await new Promise((resolve, reject) => {
    require('../src/settings/defaults').init(err => (err ? reject(err) : resolve()))
  })

  const roleSchema = require('../src/models/role')
  global.roles = await new Promise((resolve, reject) => {
    roleSchema.getRoles(function (err, r) {
      if (err) return reject(err)
      expect(r).to.be.a('array')
      resolve(r)
    })
  })

  const adminRole = _.find(global.roles, { normalized: 'admin' })
  expect(adminRole).to.exist
  await UserModel.collection.insertOne({
    username: 'trudesk',
    password: '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW',
    fullname: 'Trudesk',
    email: 'trudesk@trudesk.io',
    role: adminRole._id,
    accessToken: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    deleted: false
  })

  const supportRole = _.find(global.roles, { normalized: 'support' })
  expect(supportRole).to.exist
  global.supportRoleId = supportRole._id
  await UserModel.collection.insertOne({
    username: 'fake.user',
    password: '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW',
    fullname: 'Fake user',
    email: 'fake.user@trudesk.io',
    role: supportRole._id,
    accessToken: '456',
    deleted: false
  })

  const userRole = _.find(global.roles, { normalized: 'user' })
  expect(userRole).to.exist
  global.userRoleId = userRole._id
  await UserModel.collection.insertOne({
    username: 'deleted.user',
    password: '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW',
    fullname: 'Deleted User',
    email: 'deleted.user@trudesk.io',
    role: userRole._id,
    accessToken: '123',
    deleted: true
  })

  await GroupModel.create({ name: 'TEST' })

  const ws = require('../src/testserver')
  await new Promise((resolve, reject) => {
    ws.init(
      db,
      function (err) {
        if (err) return reject(err)
        ws.webServerListen(function (err) {
          if (err) return reject(err)
          global.server = ws.default.server
          const { SocketServer } = require('../src/socketserver')
          SocketServer(ws)
          resolve()
        })
      },
      3111
    )
  })
})

after(async function () {
  this.timeout(5000)
  await mongoose.connection.dropDatabase()
  global.socketServer.eventLoop.stop()
  await mongoose.connection.close()
  global.server.close()
  
  await mongod.stop();
})

describe('Database', function () {
  beforeEach(function (done) {
    delete require.cache[path.join(__dirname, '../src/database')]
    database = require('../src/database')
    done()
  })

  it('should connect without error', async function () {
    const connect = () =>
      new Promise((resolve, reject) => {
        database.init(function (err, db) {
          if (err) return reject(err)
          expect(db).to.be.a('object')
          expect(db.connection._readyState).to.equal(1)
          resolve()
        }, CONNECTION_URI)
      })

    await connect()
    await connect()
  })
})
