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

import async from 'async'
import path from 'path'
import _ from 'lodash'
import winston from '../logger'
import Chance from 'chance'
import { GroupModel, DepartmentModel } from '../models'

const pkg = require('../../package')

const installController: Record<string, any> = {}
installController.content = {}

installController.index = function (_req: any, res: any) {
  const content: Record<string, any> = {}
  content.title = 'Install Trudesk'
  content.layout = false

  content.bottom = 'Trudesk v' + pkg.version
  content.isDocker = process.env.TRUDESK_DOCKER || false

  res.render('install', content)
}

installController.elastictest = function (req: any, res: any) {
  const data = req.body
  const CONNECTION_URI = data.host + ':' + data.port

  const child = require('child_process').fork(path.join(__dirname, '../../src/install/elasticsearchtest'), {
    env: { FORK: 1, NODE_ENV: (global as any).env, ELASTICSEARCH_URI: CONNECTION_URI }
  })
  ;(global as any).forks.push({ name: 'elastictest', fork: child })

  child.on('message', function (data: any) {
    if (data.error) return res.status(400).json({ success: false, error: data.error })
    return res.json({ success: true })
  })

  child.on('close', function () {
    winston.debug('ElasticSearchTest process terminated.')
  })
}

installController.mongotest = function (req: any, res: any) {
  const data = req.body
  const dbPassword = encodeURIComponent(data.password)
  let CONNECTION_URI =
    'mongodb://' + data.username + ':' + dbPassword + '@' + data.host + ':' + data.port + '/' + data.database

  if (data.port === '---')
    CONNECTION_URI = 'mongodb+srv://' + data.username + ':' + dbPassword + '@' + data.host + '/' + data.database

  const child = require('child_process').fork(path.join(__dirname, '../../src/install/mongotest'), {
    env: { FORK: 1, NODE_ENV: (global as any).env, MONGOTESTURI: CONNECTION_URI }
  })

  ;(global as any).forks.push({ name: 'mongotest', fork: child })
  child.on('message', function (data: any) {
    if (data.error) return res.status(400).json({ success: false, error: data.error })

    return res.json({ success: true })
  })

  child.on('close', function () {
    ;(global as any).forks = _.without((global as any).forks, { name: 'mongotest' })
    winston.debug('MongoTest process terminated')
  })
}

installController.existingdb = function (req: any, res: any) {
  const data = req.body

  const host = data.host
  const port = data.port
  const database = data.database
  const username = data.username
  const password = data.password

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
      secret: chance.hash() + chance.hash(),
      expires: 900,
      refreshExpires: 604800
    }
  }

  fs.writeFile(configFile, YAML.stringify(conf), function (err: any) {
    if (err) {
      winston.error('FS Error: ' + err.message)
      return res.status(400).json({ success: false, error: err.message })
    }

    return res.json({ success: true })
  })
}

installController.install = function (req: any, res: any) {
  const db = require('../database')
  const roleSchema = require('../models/role')
  const InstallUserSchema = require('../models').UserModel
  const Counters = require('../models/counters').default
  const TicketTypeSchema = require('../models').TicketTypeModel
  const SettingsSchema = require('../models/setting')

  const data = req.body

  const host = data.mongo.host
  const port = data.mongo.port
  const database = data.mongo.database
  const username = data.mongo.username
  const password = data.mongo.password

  let eEnabled = data.elastic.enable
  if (typeof eEnabled === 'string') eEnabled = eEnabled.toLowerCase() === 'true'

  const eHost = data.elastic.host
  const ePort = data.elastic.port

  const user = {
    username: data.account.username,
    password: data.account.password,
    passconfirm: data.account.cpassword,
    email: data.account.email,
    fullname: data.account.fullname
  }

  const dbPassword = encodeURIComponent(password)
  let conuri = 'mongodb://' + username + ':' + dbPassword + '@' + host + ':' + port + '/' + database
  if (port === '---') conuri = 'mongodb+srv://' + username + ':' + dbPassword + '@' + host + '/' + database

  async.waterfall(
    [
      function (next: any) {
        db.init(function (err: any) {
          return next(err)
        }, conuri)
      },
      function (next: any) {
        const s = new SettingsSchema({
          name: 'gen:version',
          value: require('../../package.json').version
        })

        return s.save().then(function () { return next() }).catch(next)
      },
      function (next: any) {
        async.parallel(
          [
            function (done: any) {
              SettingsSchema.create(
                {
                  name: 'es:enable',
                  value: typeof eEnabled === 'undefined' ? false : eEnabled
                },
                done
              )
            },
            function (done: any) {
              if (!eHost) return done()
              SettingsSchema.create(
                {
                  name: 'es:host',
                  value: eHost
                },
                done
              )
            },
            function (done: any) {
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
          function (err: any) {
            return next(err)
          }
        )
      },
      function (next: any) {
        const Counter = new Counters({
          _id: 'tickets',
          next: 1001
        })

        Counter.save().then(function () { return next() }).catch(next)
      },
      function (next: any) {
        const Counter = new Counters({
          _id: 'reports',
          next: 1001
        })

        Counter.save().then(function () { return next() }).catch(next)
      },
      function (next: any) {
        const type = new TicketTypeSchema({
          name: 'Issue'
        })

        type.save().then(function () { return next() }).catch(next)
      },
      function (next: any) {
        const type = new TicketTypeSchema({
          name: 'Task'
        })

        type.save().then(function () { return next() }).catch(next)
      },
      function (next: any) {
        const defaults = require('../settings/defaults')
        const roleResults: Record<string, any> = {}
        async.parallel(
          [
            function (done: any) {
              roleSchema.create(
                {
                  name: 'Admin',
                  description: 'Default role for admins',
                  grants: defaults.roleDefaults.adminGrants
                },
                function (err: any, role: any) {
                  if (err) return done(err)
                  roleResults.adminRole = role
                  return done()
                }
              )
            },
            function (done: any) {
              roleSchema.create(
                {
                  name: 'Support',
                  description: 'Default role for agents',
                  grants: defaults.roleDefaults.supportGrants
                },
                function (err: any, role: any) {
                  if (err) return done(err)
                  roleResults.supportRole = role
                  return done()
                }
              )
            },
            function (done: any) {
              roleSchema.create(
                {
                  name: 'User',
                  description: 'Default role for users',
                  grants: defaults.roleDefaults.userGrants
                },
                function (err: any, role: any) {
                  if (err) return done(err)
                  roleResults.userRole = role
                  return done()
                }
              )
            }
          ],
          function (err: any) {
            return next(err, roleResults)
          }
        )
      },
      function (roleResults: any, next: any) {
        const TeamSchema = require('../models').TeamModel
        TeamSchema.create(
          {
            name: 'Support (Default)',
            members: []
          },
          function (err: any, team: any) {
            return next(err, team, roleResults)
          }
        )
      },
      function (defaultTeam: any, roleResults: any, next: any) {
        ;(async (next: any) => {
          try {
            const admin = await InstallUserSchema.getByUsername(user.username)

            if (!_.isNull(admin) && !_.isUndefined(admin) && !_.isEmpty(admin)) {
              return next('Username: ' + user.username + ' already exists.')
            }

            if (user.password !== user.passconfirm) {
              return next('Passwords do not match!')
            }

            const chance = new Chance()
            const adminUser = new InstallUserSchema({
              username: user.username,
              password: user.password,
              fullname: user.fullname,
              email: user.email,
              role: roleResults.adminRole._id,
              title: 'Administrator',
              accessToken: chance.hash()
            })

            const savedUser = await adminUser.save()
            const success = await defaultTeam.addMember(savedUser._id)

            if (!success) {
              return next('Unable to add user to Administrator group!')
            }

            const savedTeam = await defaultTeam.save()

            return next(null, savedTeam)
          } catch (err: any) {
            winston.error('Database Error: ' + err.message)
            return next('Database Error: ' + err.message)
          }
        })(next)
      },
      function (defaultTeam: any, next: any) {
        ;(async (next: any) => {
          try {
            await DepartmentModel.create({
              name: 'Support - All Groups (Default)',
              teams: [defaultTeam._id],
              allGroups: true,
              groups: []
            })

            next()
          } catch (err: any) {
            winston.error('Database Error: ' + err.message)
            next(err)
          }
        })(next)
      },
      function (next: any) {
        ;(async (next: any) => {
          try {
            await GroupModel.create({
              name: 'My First Group (Default)'
            })

            next()
          } catch (err: any) {
            next(err)
          }
        })(next)
      },
      function (done: any) {
        if (!process.env.TRUDESK_DOCKER) return done()
        const S = require('../models/setting')
        const installed = new S({
          name: 'installed',
          value: true
        })

        installed.save().then(function () { return done() }).catch(function (err: any) {
          winston.error('DB Error: ' + err.message)
          return done('DB Error: ' + err.message)
        })
      },
      function (next: any) {
        if (process.env.TRUDESK_DOCKER) return next()
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
            secret: chance.hash() + chance.hash(),
            expires: 900,
            refreshExpires: 604800
          }
        }

        fs.writeFile(configFile, YAML.stringify(conf), function (err: any) {
          if (err) {
            winston.error('FS Error: ' + err.message)
            return next('FS Error: ' + err.message)
          }

          return next(null)
        })
      }
    ],
    function (err: any) {
      if (err) {
        return res.status(400).json({ success: false, error: err })
      }

      res.json({ success: true })
    }
  )
}

installController.restart = function (_req: any, res: any) {
  const pm2 = require('pm2')
  pm2.connect(function (err: any) {
    if (err) {
      winston.error(err)
      res.status(400).send(err)
      return
    }
    pm2.restart('trudesk', function (err: any) {
      if (err) {
        winston.error(err)
        res.status(400).send(err)
        return
      }

      pm2.disconnect()
      res.send()
    })
  })
}

module.exports = installController
