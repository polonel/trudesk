/* eslint-disable no-unused-expressions */
/* globals server socketServer */
var expect = require('chai').expect
var winston = require('../src/logger')
var async = require('async')
var mongoose = require('mongoose')
var path = require('path')
var _ = require('lodash')

// Preload Models
require('../src/models')
const { webServerListen } = require('../src/webserver')

var database, db
var TEST_DB_NAME = 'polonel_trudesk31908899'
var CONNECTION_URI = 'mongodb://192.168.4.187:27017/' + TEST_DB_NAME

// Global Setup for tests
before(function (done) {
  this.timeout(15000) // Make it a longer timeout since we have to start the web server
  delete require.cache[require.resolve('../src/database')]
  delete require.cache[require.resolve('mongoose')]
  mongoose = require('mongoose')
  database = require('../src/database')

  mongoose.connection.close()
  database.init(function (err, d) {
    expect(err).to.not.exist
    expect(d).to.be.a('object')
    expect(d.connection).to.exist

    db = d

    async.series(
      [
        function (cb) {
          if (mongoose.connection.db.namespace !== TEST_DB_NAME) {
            return cb('Invalid Test Database. Existing...')
          }

          return cb()
        },
        function (cb) {
          var counter = require('../src/models/counters')
          counter.create(
            {
              _id: 'tickets',
              next: 1000
            },
            function (err) {
              expect(err).to.not.exist

              cb()
            }
          )
        },
        function (cb) {
          var typeSchema = require('../src/models/tickettype')
          typeSchema.insertMany([{ name: 'Task' }, { name: 'Issue' }], cb)
        },
        function (cb) {
          require('../src/settings/defaults').init(cb)
        },
        function (cb) {
          var roleSchema = require('../src/models/role')
          roleSchema.getRoles(function (err, r) {
            expect(err).to.not.exist
            expect(r).to.be.a('array')

            global.roles = r

            cb()
          })
        },
        function (cb) {
          const { UserModel } = require('../src/models')
          var adminRole = _.find(global.roles, { normalized: 'admin' })
          expect(adminRole).to.exist
          UserModel.create(
            {
              username: 'trudesk',
              password: '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW',
              fullname: 'Trudesk',
              email: 'trudesk@trudesk.io',
              role: adminRole._id,
              accessToken: 'da39a3ee5e6b4b0d3255bfef95601890afd80709'
            },
            function (err, user) {
              expect(err).to.not.exist
              expect(user).to.be.a('object')

              cb()
            }
          )
        },
        function (cb) {
          var { UserModel } = require('../src/models')
          var supportRole = _.find(global.roles, { normalized: 'support' })
          expect(supportRole).to.exist
          global.supportRoleId = supportRole._id

          UserModel.create(
            {
              username: 'fake.user',
              password: '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW',
              fullname: 'Fake user',
              email: 'fake.user@trudesk.io',
              role: supportRole._id,
              accessToken: '456'
            },
            function (err, user) {
              expect(err).to.not.exist
              expect(user).to.be.a('object')

              cb()
            }
          )
        },
        function (cb) {
          var { UserModel } = require('../src/models')
          var userRole = _.find(global.roles, { normalized: 'user' })
          expect(userRole).to.exist
          global.userRoleId = userRole._id
          UserModel.create(
            {
              username: 'deleted.user',
              password: '$2a$04$350Dkwcq9EpJLFhbeLB0buFcyFkI9q3edQEPpy/zqLjROMD9LPToW',
              fullname: 'Deleted User',
              email: 'deleted.user@trudesk.io',
              role: userRole._id,
              accessToken: '123',
              deleted: true
            },
            function (err, user) {
              expect(err).to.not.exist
              expect(user).to.be.a('object')

              cb()
            }
          )
        },
        function (cb) {
          var { GroupModel } = require('../src/models')
          GroupModel.create(
            {
              name: 'TEST'
            },
            function (err, group) {
              expect(err).to.not.exist
              expect(group).to.be.a('object')

              cb()
            }
          )
        },
        function (cb) {
          var ws = require('../src/webserver')
          ws.init(
            db,
            function (err) {
              expect(err).to.not.exist
              ws.webServerListen(function (err) {
                expect(err).to.not.exist
                global.server = ws.default.server

                const { SocketServer } = require('../src/socketserver')
                SocketServer(ws)

                cb()
              })
            },
            3111
          )
        }
      ],
      function (err) {
        if (err) {
          console.log(err)
          return done(err)
        }

        done()
      }
    )
  }, CONNECTION_URI)
})

// Global Teardown for tests
after(function (done) {
  this.timeout(5000)
  mongoose.connection.dropDatabase(function () {
    mongoose.connection.close(function () {
      global.socketServer.eventLoop.stop()
      global.server.close()

      done()
    })
  })
})

// Start DB Tests
describe('Database', function () {
  beforeEach(function (done) {
    // Need to invalid Database Module before each test runs.
    delete require.cache[path.join(__dirname, '../src/database')]
    database = require('../src/database')

    done()
  })

  it('should connect without error', function (done) {
    async.series(
      [
        function (cb) {
          database.init(function (err, db) {
            expect(err).to.not.exist
            expect(db).to.be.a('object')
            expect(db.connection._readyState).to.equal(1)

            cb()
          }, CONNECTION_URI)
        },
        function (cb) {
          // Test rerunning init and getting DB back without calling connect.
          database.init(function (err, db) {
            expect(err).to.not.exist
            expect(db).to.be.a('object')
            expect(db.connection._readyState).to.equal(1)

            cb()
          }, CONNECTION_URI)
        }
      ],
      function (err) {
        done()
      }
    )
  })
})
