/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    10/31/2018
 Author:     Chris Brame

 **/

var _ = require('lodash')
var async = require('async')
var winston = require('../logger')
var semver = require('semver')
var moment = require('moment')
var version = require('../../package.json').version

var SettingsSchema = require('../models/setting')
var userSchema = require('../models/user')
var roleSchema = require('../models/role')
var database = require('../database')
const path = require('path')

var migrations = {}

function performBackup (dbVersion, callback) {
  const child = require('child_process').fork(path.join(__dirname, '../../src/backup/backup'), {
    env: {
      FORK: 1,
      NODE_ENV: global.env,
      MONGOURI: database.connectionuri,
      PATH: process.env.PATH,
      FILENAME: 'PREUPGRADE--trudesk-v' + dbVersion + '-' + moment().format('MMDDYYYY_HHmm') + '.zip'
    }
  })
  global.forks.push({ name: 'backup', fork: child })

  let result = null

  child.on('message', function (data) {
    child.kill('SIGINT')
    global.forks = _.remove(global.forks, function (f) {
      return f.fork !== child
    })

    if (data.error) {
      result = { success: false, error: data.error }
    }

    if (data.success) {
      result = { success: true }
    } else {
      result = { success: false, error: data }
    }
  })

  child.on('close', function () {
    if (!result) {
      return callback({ success: false, error: 'An Unknown Error Occurred' })
    }

    if (result.error) {
      return callback(result)
    }

    return callback(null, result)
  })
}

function saveVersion (callback) {
  SettingsSchema.getSettingByName('gen:version', function (err, setting) {
    if (err) {
      winston.warn(err)
      if (_.isFunction(callback)) return callback(err)
      return false
    }

    if (!setting) {
      var s = new SettingsSchema({
        name: 'gen:version',
        value: version
      })
      s.save(function (err) {
        if (err) {
          if (_.isFunction(callback)) return callback(err)
          return false
        }

        if (_.isFunction(callback)) return callback()
      })
    } else {
      if (setting.value) setting.value = require('../../package').version
      setting.save(function (err) {
        if (err) {
          if (_.isFunction(callback)) return callback(err)
          return false
        }

        if (_.isFunction(callback)) return callback()
        return true
      })
    }
  })
}

function getDatabaseVersion (callback) {
  SettingsSchema.getSettingByName('gen:version', function (err, setting) {
    if (err) return callback(err)

    if (!setting) {
      if (semver.satisfies(version, '>=1.0.11')) {
        return saveVersion(callback)
      } else throw new Error('Please upgrade to v1.0.7 Exiting...')
    }

    return callback(null, setting.value)
  })
}

function migrateUserRoles (callback) {
  winston.debug('Migrating Roles...')
  async.waterfall(
    [
      function (next) {
        roleSchema.getRoles(next)
      },
      function (roles, next) {
        var adminRole = _.find(roles, { normalized: 'admin' })
        userSchema.collection
          .updateMany({ role: 'admin' }, { $set: { role: adminRole._id } })
          .then(function (res) {
            if (res && res.result) {
              if (res.result.ok === 1) return next(null, roles)
              else {
                winston.warn(res.message)
                return next(res.message)
              }
            } else {
              return next('Unknown Error Occurred')
            }
          })
          .catch(function (err) {
            return next(err)
          })
      },
      function (roles, next) {
        var supportRole = _.find(roles, { normalized: 'support' })
        userSchema.collection
          .updateMany({ $or: [{ role: 'support' }, { role: 'mod' }] }, { $set: { role: supportRole._id } })
          .then(function (res) {
            if (res && res.result) {
              if (res.result.ok === 1) return next(null, roles)
              else {
                winston.warn(res.message)
                return next(res.message)
              }
            } else {
              return next('Unknown Error Occurred')
            }
          })
          .catch(function (err) {
            return next(err)
          })
      },
      function (roles, next) {
        var userRole = _.find(roles, { normalized: 'user' })
        userSchema.collection
          .updateMany({ role: 'user' }, { $set: { role: userRole._id } })
          .then(function (res) {
            if (res && res.result) {
              if (res.result.ok === 1) return next(null, roles)
              else {
                winston.warn(res.message)
                return next(res.message)
              }
            } else {
              return next('Unknown Error Occurred')
            }
          })
          .catch(function (err) {
            return next(err)
          })
      }
    ],
    callback
  )
}

function createAdminTeamDepartment (callback) {
  const Team = require('../models/team')
  const Department = require('../models/department')
  const Account = require('../models/user')

  async.waterfall(
    [
      function (next) {
        Account.getAdmins({}, next)
      },
      function (admins, next) {
        const adminsIds = admins.map(admin => {
          return admin._id.toString()
        })

        Team.create(
          {
            name: 'Support (Default)',
            members: adminsIds
          },
          next
        )
      },
      function (adminTeam, next) {
        Department.create(
          {
            name: 'Support - All Groups (Default)',
            teams: adminTeam._id,
            allGroups: true,
            groups: []
          },
          next
        )
      }
    ],
    callback
  )
}

function removeAgentsFromGroups (callback) {
  // winston.debug('Migrating Agents from Groups...')
  var groupSchema = require('../models/group')
  groupSchema.getAllGroups(function (err, groups) {
    if (err) return callback(err)
    async.eachSeries(
      groups,
      function (group, next) {
        group.members = _.filter(group.members, function (member) {
          return !member.role.isAdmin && !member.role.isAgent
        })

        group.save(next)
      },
      callback
    )
  })
}

function createTicketStatus (callback) {
  const Status = require('../models/ticketStatus')
  const counterSchema = require('../models/counters')
  let newId = ''
  let openId = ''
  let pendingId = ''
  let closedId = ''
  async.series(
    [
      function (next) {
        Status.deleteMany({}, next)
      },
      function (next) {
        Status.create(
          [
            {
              name: 'New',
              htmlColor: '#29b955',
              uid: 0,
              order: 1,
              isResolved: false,
              slatimer: true,
              isLocked: true
            },
            {
              name: 'Open',
              htmlColor: '#d32f2f',
              uid: 1,
              order: 2,
              isResolved: false,
              slatimer: true,
              isLocked: true
            },
            {
              name: 'Pending',
              htmlColor: '#2196F3',
              uid: 2,
              order: 3,
              isResolved: false,
              slatimer: false,
              isLocked: true
            },
            {
              name: 'Closed',
              htmlColor: '#CCCCCC',
              uid: 3,
              order: 4,
              isResolved: true,
              slatimer: false,
              isLocked: true
            }
          ],
          function (err, result) {
            if (err) return next(err)
            newId = result[0]._id
            openId = result[1]._id
            pendingId = result[2]._id
            closedId = result[3]._id

            return next()
          }
        )
      },
      function (next) {
        winston.info('Updating ticket statuses for migration. Please Wait...')
        winston.debug('Status [New ID]: ' + newId)
        winston.debug('Status [Open ID]: ' + openId)
        winston.debug('Status [Pending ID]: ' + pendingId)
        winston.debug('Status [Closed ID]: ' + closedId)

        const newPromise = database.db.connection.db
          .collection('tickets')
          .updateMany({ status: 0 }, { $set: { status: newId } })

        const openPromise = database.db.connection.db
          .collection('tickets')
          .updateMany({ status: 1 }, { $set: { status: openId } })

        const pendingPromise = database.db.connection.db
          .collection('tickets')
          .updateMany({ status: 2 }, { $set: { status: pendingId } })

        const closedPromise = database.db.connection.db
          .collection('tickets')
          .updateMany({ status: 3 }, { $set: { status: closedId } })

        Promise.allSettled([newPromise, openPromise, pendingPromise, closedPromise])
          .then(res => {
            return next()
          })
          .catch(err => {
            return next(err)
          })
      },
      function (next) {
        winston.info('Completed updating ticket status.')
        counterSchema.setCounter('status', 4, next)
      }
    ],
    callback
  )
}

migrations.run = function (callback) {
  var databaseVersion

  async.series(
    [
      function (next) {
        getDatabaseVersion(function (err, dbVer) {
          if (err) return next(err)
          databaseVersion = dbVer

          if (semver.satisfies(databaseVersion, '<1.0.10')) {
            throw new Error('Please upgrade to v1.0.10 Exiting...')
          }
          return next()
        })
      },
      function (next) {
        if (semver.satisfies(semver.coerce(databaseVersion).version, '<1.0.11')) {
          async.parallel(
            [
              function (done) {
                removeAgentsFromGroups(done)
              },
              function (done) {
                createAdminTeamDepartment(done)
              }
            ],
            next
          )
        } else {
          return next()
        }
      },
      function (next) {
        if (semver.satisfies(semver.coerce(databaseVersion).version, '<1.2.8')) {
          performBackup(databaseVersion, function (err) {
            if (err) return next(err)

            return createTicketStatus(next)
          })
        } else {
          return next()
        }
      }
    ],
    function (err) {
      if (err) return callback(err)
      //  Update DB Version Num
      return saveVersion(callback)
    }
  )
}

module.exports = migrations
