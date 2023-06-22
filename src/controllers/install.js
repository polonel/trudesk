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

const async = require('async')
const path = require('path')
const _ = require('lodash')
const winston = require('../logger')
const pkg = require('../../package')
const Chance = require('chance')
const Status = require('../models/ticketStatus')
const counterSchema = require('../models/counters')

const installController = {}
installController.content = {}

installController.index = function (req, res) {
  const content = {}
  content.title = 'Install Trudesk'
  content.layout = false

  content.bottom = 'Trudesk v' + pkg.version
  content.isDocker = process.env.TRUDESK_DOCKER || false

  res.render('install', content)
}

installController.elastictest = function (req, res) {
  const data = req.body
  const CONNECTION_URI = data.host + ':' + data.port

  const child = require('child_process').fork(path.join(__dirname, '../../src/install/elasticsearchtest'), {
    env: { FORK: 1, NODE_ENV: global.env, ELASTICSEARCH_URI: CONNECTION_URI }
  })
  global.forks.push({ name: 'elastictest', fork: child })

  child.on('message', function (data) {
    if (data.error) return res.status(400).json({ success: false, error: data.error })
    return res.json({ success: true })
  })

  child.on('close', function () {
    winston.debug('ElasticSearchTest process terminated.')
  })
}

installController.mongotest = function (req, res) {
  const data = req.body
  const dbPassword = encodeURIComponent(data.password)
  let CONNECTION_URI =
    'mongodb://' + data.username + ':' + dbPassword + '@' + data.host + ':' + data.port + '/' + data.database

  if (data.port === '---')
    CONNECTION_URI = 'mongodb+srv://' + data.username + ':' + dbPassword + '@' + data.host + '/' + data.database

  const child = require('child_process').fork(path.join(__dirname, '../../src/install/mongotest'), {
    env: { FORK: 1, NODE_ENV: global.env, MONGOTESTURI: CONNECTION_URI }
  })

  global.forks.push({ name: 'mongotest', fork: child })
  child.on('message', function (data) {
    if (data.error) return res.status(400).json({ success: false, error: data.error })

    return res.json({ success: true })
  })

  child.on('close', function () {
    global.forks = _.without(global.forks, { name: 'mongotest' })
    winston.debug('MongoTest process terminated')
  })
}

installController.existingdb = function (req, res) {
  const data = req.body

  // Mongo
  const host = data.host
  const port = data.port
  const database = data.database
  const username = data.username
  const password = data.password

  // Write Configfile
  const fs = require('fs')
  const chance = new Chance()
  const configFile = path.join(__dirname, '../../config.yml')
  const YAML = require('yaml')
  const conf = {
    mongo: {
      host: host,
      port: port,
      username: username,
      password: password,
      database: database
    },
    tokens: {
      secret: chance.hash() + chance.md5(),
      expires: 900 // 15min
    }
  }

  fs.writeFile(configFile, YAML.stringify(conf), function (err) {
    if (err) {
      winston.error('FS Error: ' + err.message)
      return res.status(400).json({ success: false, error: err.message })
    }

    return res.json({ success: true })
  })
}

installController.install = function (req, res) {
  const db = require('../database')
  const roleSchema = require('../models/role')
  const roleOrderSchema = require('../models/roleorder')
  const UserSchema = require('../models/user')
  const GroupSchema = require('../models/group')
  const Counters = require('../models/counters')
  const TicketTypeSchema = require('../models/tickettype')
  const TicketStatusSchema = require('../models/ticketStatus')
  const SettingsSchema = require('../models/setting')

  const data = req.body

  // Mongo
  const host = data['mongo[host]']
  const port = data['mongo[port]']
  const database = data['mongo[database]']
  const username = data['mongo[username]']
  const password = data['mongo[password]']

  // ElasticSearch
  let eEnabled = data['elastic[enable]']
  if (typeof eEnabled === 'string') eEnabled = eEnabled.toLowerCase() === 'true'

  const eHost = data['elastic[host]']
  const ePort = data['elastic[port]']

  // Account
  const user = {
    username: data['account[username]'],
    password: data['account[password]'],
    passconfirm: data['account[cpassword]'],
    email: data['account[email]'],
    fullname: data['account[fullname]']
  }

  const dbPassword = encodeURIComponent(password)
  let conuri = 'mongodb://' + username + ':' + dbPassword + '@' + host + ':' + port + '/' + database
  if (port === '---') conuri = 'mongodb+srv://' + username + ':' + dbPassword + '@' + host + '/' + database

  async.waterfall(
    [
      function (next) {
        db.init(function (err) {
          return next(err)
        }, conuri)
      },
      function (next) {
        const s = new SettingsSchema({
          name: 'gen:version',
          value: require('../../package.json').version
        })

        return s.save(function (err) {
          return next(err)
        })
      },
      function (next) {
        // if (!eEnabled) return next()
        async.parallel(
          [
            function (done) {
              SettingsSchema.create(
                {
                  name: 'es:enable',
                  value: typeof eEnabled === 'undefined' ? false : eEnabled
                },
                done
              )
            },
            function (done) {
              if (!eHost) return done()
              SettingsSchema.create(
                {
                  name: 'es:host',
                  value: eHost
                },
                done
              )
            },
            function (done) {
              if (!ePort) return done()
              SettingsSchema.create(
                {
                  name: 'es:port',
                  value: ePort
                },
                done
              )
            }
          ],
          function (err) {
            return next(err)
          }
        )
      },
      function (next) {
        const Counter = new Counters({
          _id: 'tickets',
          next: 1001
        })

        Counter.save(function (err) {
          return next(err)
        })
      },
      function (next) {
        const Counter = new Counters({
          _id: 'reports',
          next: 1001
        })

        Counter.save(function (err) {
          return next(err)
        })
      },
      function (next) {
        TicketStatusSchema.create(
          [
            {
              name: 'New',
              htmlColor: '#29b955',
              uid: 0,
              order: 0,
              isResolved: false,
              slatimer: true,
              isLocked: true
            },
            {
              name: 'Open',
              htmlColor: '#d32f2f',
              uid: 1,
              order: 1,
              isResolved: false,
              slatimer: true,
              isLocked: true
            },
            {
              name: 'Pending',
              htmlColor: '#2196F3',
              uid: 2,
              order: 2,
              isResolved: false,
              slatimer: false,
              isLocked: true
            },
            {
              name: 'Closed',
              htmlColor: '#CCCCCC',
              uid: 3,
              order: 3,
              isResolved: true,
              slatimer: false,
              isLocked: true
            }
          ],
          function (err) {
            if (err) return next(err)

            return next()
          }
        )
      },
      function (next) {
        Counters.setCounter('status', 4, function (err) {
          if (err) return next(err)

          return next()
        })
      },
      function (next) {
        const type = new TicketTypeSchema({
          name: 'Issue'
        })

        type.save(function (err) {
          return next(err)
        })
      },
      function (next) {
        const type = new TicketTypeSchema({
          name: 'Task'
        })

        type.save(function (err) {
          return next(err)
        })
      },
      function (next) {
        GroupSchema.create({ name: 'Default Group' }, function (err) {
          if (err) return next(err)
          return next()
        })
      },
      function (next) {
        const defaults = require('../settings/defaults')
        const roleResults = {}
        async.parallel(
          [
            function (done) {
              roleSchema.create(
                {
                  name: 'Admin',
                  description: 'Default role for admins',
                  grants: defaults.roleDefaults.adminGrants
                },
                function (err, role) {
                  if (err) return done(err)
                  roleResults.adminRole = role
                  return done()
                }
              )
            },
            function (done) {
              roleSchema.create(
                {
                  name: 'Support',
                  description: 'Default role for agents',
                  grants: defaults.roleDefaults.supportGrants
                },
                function (err, role) {
                  if (err) return done(err)
                  roleResults.supportRole = role
                  return done()
                }
              )
            },
            function (done) {
              roleSchema.create(
                {
                  name: 'User',
                  description: 'Default role for users',
                  grants: defaults.roleDefaults.userGrants
                },
                function (err, role) {
                  if (err) return done(err)
                  roleResults.userRole = role
                  return done()
                }
              )
            }
          ],
          function (err) {
            return next(err, roleResults)
          }
        )
      },
      function (roleResults, next) {
        const TeamSchema = require('../models/team')
        TeamSchema.create(
          {
            name: 'Support (Default)',
            members: []
          },
          function (err, team) {
            return next(err, team, roleResults)
          }
        )
      },
      function (defaultTeam, roleResults, next) {
        UserSchema.getUserByUsername(user.username, function (err, admin) {
          if (err) {
            winston.error('Database Error: ' + err.message)
            return next('Database Error: ' + err.message)
          }

          if (!_.isNull(admin) && !_.isUndefined(admin) && !_.isEmpty(admin)) {
            return next('Username: ' + user.username + ' already exists.')
          }

          if (user.password !== user.passconfirm) {
            return next('Passwords do not match!')
          }

          const chance = new Chance()
          const adminUser = new UserSchema({
            username: user.username,
            password: user.password,
            fullname: user.fullname,
            email: user.email,
            role: roleResults.adminRole._id,
            title: 'Administrator',
            accessToken: chance.hash()
          })

          adminUser.save(function (err, savedUser) {
            if (err) {
              winston.error('Database Error: ' + err.message)
              return next('Database Error: ' + err.message)
            }

            defaultTeam.addMember(savedUser._id, function (err, success) {
              if (err) {
                winston.error('Database Error: ' + err.message)
                return next('Database Error: ' + err.message)
              }

              if (!success) {
                return next('Unable to add user to Administrator group!')
              }

              defaultTeam.save(function (err) {
                if (err) {
                  winston.error('Database Error: ' + err.message)
                  return next('Database Error: ' + err.message)
                }

                return next(null, defaultTeam)
              })
            })
          })
        })
      },
      function (defaultTeam, next) {
        const DepartmentSchema = require('../models/department')
        DepartmentSchema.create(
          {
            name: 'Support - All Groups (Default)',
            teams: [defaultTeam._id],
            allGroups: true,
            groups: []
          },
          function (err) {
            return next(err)
          }
        )
      },
      function (next) {
        if (!process.env.TRUDESK_DOCKER) return next()
        const S = require('../models/setting')
        const installed = new S({
          name: 'installed',
          value: true
        })

        installed.save(function (err) {
          if (err) {
            winston.error('DB Error: ' + err.message)
            return next('DB Error: ' + err.message)
          }

          return next()
        })
      },
      function (next) {
        if (process.env.TRUDESK_DOCKER) return next()
        // Write Configfile
        const fs = require('fs')
        const configFile = path.join(__dirname, '../../config.yml')
        const chance = new Chance()
        const YAML = require('yaml')

        const conf = {
          mongo: {
            host: host,
            port: port,
            username: username,
            password: password,
            database: database,
            shard: port === '---'
          },
          tokens: {
            secret: chance.hash() + chance.md5(),
            expires: 900 // 15min
          }
        }

        fs.writeFile(configFile, YAML.stringify(conf), function (err) {
          if (err) {
            winston.error('FS Error: ' + err.message)
            return next('FS Error: ' + err.message)
          }

          return next(null)
        })
      }
    ],
    function (err) {
      if (err) {
        return res.status(400).json({ success: false, error: err })
      }

      res.json({ success: true })
    }
  )
}

installController.restart = function (req, res) {
  const pm2 = require('pm2')
  pm2.connect(function (err) {
    if (err) {
      winston.error(err)
      res.status(400).send(err)
      return
    }
    pm2.restart('trudesk', function (err) {
      if (err) {
        res.status(400).send(err)
        return winston.error(err)
      }

      pm2.disconnect()
      res.send()
    })
  })
}

module.exports = installController
