/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/24/18
 Author:     Chris Brame

 **/

import { DocumentType } from '@typegoose/typegoose'
import { parallel, series } from 'async'
import fs from 'fs-extra'
import _ from 'lodash'
import moment from 'moment-timezone'
import type { Types } from 'mongoose'
import path from 'path'
import config from '../config'
import { trudeskDatabase } from '../database'
import winston from '../logger'
import {
  PriorityModel,
  RoleModel,
  RoleOrderModel,
  SettingModel,
  TemplateModel,
  TicketModel,
  TicketStatusModel,
  TicketTagModel,
  TicketTypeModel,
} from '../models'
import type { TicketTypeClass } from '../models/tickettype'
import { TicketStatusClass } from '../models/ticketStatus'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nconf = require('nconf')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Chance = require('chance')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const newTicketTemplate = require('./json/mailer-new-ticket')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const passwordResetTemplate = require('./json/mailer-password-reset')

type AsyncCallback = (err?: Error | null) => void

type DefaultGrants = {
  userGrants: Array<string>
  supportGrants: Array<string>
  adminGrants: Array<string>
}

type SettingsDefaults = {
  init?: (callback: AsyncCallback) => void
  roleDefaults?: DefaultGrants
}

const settingsDefaults: SettingsDefaults = {}
const roleDefaults: DefaultGrants = {
  userGrants: ['tickets:create view update', 'comments:create view update'],
  supportGrants: [
    'tickets:*',
    'agent:*',
    'accounts:create update view import',
    'teams:create update view',
    'comments:create view update create delete',
    'reports:view create',
    'notices:*',
  ],
  adminGrants: [
    'admin:*',
    'agent:*',
    'chat:*',
    'tickets:*',
    'accounts:*',
    'groups:*',
    'teams:*',
    'departments:*',
    'comments:*',
    'reports:*',
    'notices:*',
    'settings:*',
    'api:*',
  ],
}

settingsDefaults.roleDefaults = roleDefaults

function rolesDefault(callback: AsyncCallback) {
  series(
    [
      function (done) {
        RoleModel.getRoleByName('User', function (err, role) {
          if (err) return done(err)
          if (role) return done()

          RoleModel.create(
            { name: 'User', description: 'Default role for users', grants: roleDefaults.userGrants },
            function (err, userRole) {
              if (err) return done(err)
              SettingModel.getSettingByName('role:user:default', function (err, roleUserDefault) {
                if (err) return done(err)
                if (roleUserDefault) return done()
                SettingModel.create({ name: 'role:user:default', value: userRole._id }, done)
              })
            }
          )
        })
      },
      function (done) {
        RoleModel.getRoleByName('Support', function (err, role) {
          if (err) return done(err)
          if (role) return done()
          RoleModel.create(
            { name: 'Support', description: 'Default role for agents', grants: roleDefaults.supportGrants },
            done
          )
        })
      },
      function (done) {
        RoleModel.getRoleByName('Admin', function (err, role) {
          if (err) return done(err)
          if (role) return done()
          RoleModel.create(
            { name: 'Admin', description: 'Default role for admins', grants: roleDefaults.adminGrants },
            done
          )
        })
      },
      function (done) {
        ;(RoleOrderModel as any).getOrder(function (err: Error, roleOrder: any) {
          if (err) return done(err)
          if (roleOrder) return done()

          RoleModel.getRoles(function (err, roles) {
            if (err) return done(err)

            const order = [
              _.find(roles, { name: 'Admin' })?._id,
              _.find(roles, { name: 'Support' })?._id,
              _.find(roles, { name: 'User' })?._id,
            ]
            ;(RoleOrderModel as any).create({ order }, done)
          })
        })
      },
    ],
    function (err) {
      if (err) throw err
      return callback()
    }
  )
}

function defaultUserRole(callback: AsyncCallback) {
  ;(RoleOrderModel as any).getOrderLean(function (err: Error, roleOrder: any) {
    if (err) return callback(err)
    if (!roleOrder) return callback()

    SettingModel.getSettingByName('role:user:default', function (err, roleDefault) {
      if (err) return callback(err)
      if (roleDefault) return callback()

      const lastId = _.last(roleOrder.order)
      SettingModel.create({ name: 'role:user:default', value: lastId }, callback)
    })
  })
}

function createDirectories(callback: AsyncCallback) {
  parallel(
    [
      (done: AsyncCallback) => fs.ensureDir(path.resolve(config.trudeskRoot(), 'backups'), done),
      (done: AsyncCallback) => fs.ensureDir(path.resolve(config.trudeskRoot(), 'restores'), done),
    ],
    callback
  )
}

function downloadWin32MongoDBTools(callback: AsyncCallback) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const os = require('os')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const semver = require('semver')
  const dbVersion = trudeskDatabase.version || '5.0.6'
  const fileVersion = semver.major(dbVersion) + '.' + semver.minor(dbVersion)

  if (os.platform() !== 'win32') return callback()

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const http = require('http')
  winston.debug('MongoDB version ' + fileVersion + ' detected.')
  const filename = 'mongodb-tools.' + fileVersion + '-win32x64.zip'
  const savePath = path.resolve(config.trudeskRoot(), 'src/backup/bin/win32/')
  fs.ensureDirSync(savePath)

  if (
    fs.existsSync(path.join(savePath, 'mongodump.exe')) &&
    fs.existsSync(path.join(savePath, 'mongorestore.exe'))
  ) {
    return callback()
  }

  winston.debug('Windows platform detected. Downloading MongoDB Tools [' + filename + ']')
  fs.emptyDirSync(savePath)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const unzipper = require('unzipper')
  const file = fs.createWriteStream(path.join(savePath, filename))
  http
    .get('http://storage.trudesk.io/tools/' + filename, function (response: any) {
      response.pipe(file)
      file.on('finish', () => file.close())
      file.on('close', () => {
        fs.createReadStream(path.join(savePath, filename))
          .pipe(unzipper.Extract({ path: savePath }))
          .on('close', () => fs.unlink(path.join(savePath, filename), callback))
      })
    })
    .on('error', function (err: Error) {
      fs.unlink(path.join(savePath, filename))
      winston.debug(err)
      return callback()
    })
}

function timezoneDefault(callback: AsyncCallback) {
  SettingModel.getSettingByName('gen:timezone', function (err, setting) {
    if (err) {
      winston.warn(err)
      return callback(err)
    }

    if (!setting) {
      const defaultTimezone = new SettingModel({ name: 'gen:timezone', value: 'America/New_York' })
      defaultTimezone.save(function (err, setting) {
        if (err) {
          winston.warn(err)
          return callback(err)
        }
        winston.debug('Timezone set to ' + setting.value)
        moment.tz.setDefault(setting.value)
        global.timezone = setting.value
        return callback()
      })
    } else {
      winston.debug('Timezone set to ' + setting.value)
      moment.tz.setDefault(setting.value)
      global.timezone = setting.value
      return callback()
    }
  })
}

function showTourSettingDefault(callback: AsyncCallback) {
  SettingModel.getSettingByName('showTour:enable', function (err, setting) {
    if (err) {
      winston.warn(err)
      return callback(err)
    }

    if (!setting) {
      const defaultShowTour = new SettingModel({ name: 'showTour:enable', value: 0 })
      defaultShowTour.save(function (err) {
        if (err) {
          winston.warn(err)
          return callback(err)
        }
        return callback()
      })
    } else {
      return callback()
    }
  })
}

function ticketTypeSettingDefault(callback: AsyncCallback) {
  SettingModel.getSettingByName('ticket:type:default', async function (err, setting) {
    if (err) {
      winston.warn(err)
      return callback(err)
    }

    if (!setting) {
      try {
        const types = await TicketTypeModel.getTypes()
        const type = _.first(types) as TicketTypeClass
        if (!type || !_.isObject(type) || _.isUndefined(type._id))
          throw new Error('Invalid Type. Skipping.')

        const defaultTicketType = new SettingModel({ name: 'ticket:type:default', value: type._id })
        await defaultTicketType.save()
        return callback()
      } catch (err) {
        winston.warn(err)
        return callback(err as Error)
      }
    } else {
      return callback()
    }
  })
}

async function defaultTicketStatus() {
  const statuses: DocumentType<TicketStatusClass>[] = []

  const newStatus = new TicketStatusModel({ name: 'New', htmlColor: '#29b955', uid: 0, order: 0, slatimer: false, isResolved: false, isLocked: true })
  const openStatus = new TicketStatusModel({ name: 'Open', htmlColor: '#d32f2f', uid: 1, order: 1, slatimer: true, isResolved: false, isLocked: true })
  const pendingStatus = new TicketStatusModel({ name: 'Pending', htmlColor: '#2196F3', uid: 2, order: 2, slatimer: false, isResolved: false, isLocked: true })
  const closedStatus = new TicketStatusModel({ name: 'Closed', htmlColor: '#CCCCCC', uid: 3, order: 3, slatimer: false, isResolved: true, isLocked: true })

  const hasNewStatus = (await TicketStatusModel.countDocuments({ name: 'New', isLocked: true, uid: 0 })) > 0
  if (!hasNewStatus) statuses.push(newStatus)

  const hasOpenStatus = (await TicketStatusModel.countDocuments({ name: 'Open', isLocked: true, uid: 1 })) > 0
  if (!hasOpenStatus) statuses.push(openStatus)

  const hasPendingStatus = (await TicketStatusModel.countDocuments({ name: 'Pending', isLocked: true, uid: 2 })) > 0
  if (!hasPendingStatus) statuses.push(pendingStatus)

  const hasClosedStatus = (await TicketStatusModel.countDocuments({ name: 'Closed', isLocked: true, uid: 3 })) > 0
  if (!hasClosedStatus) statuses.push(closedStatus)

  await Promise.all(statuses.map(s => s.save()))
}

async function ticketPriorityDefaults() {
  const priorities = [
    new PriorityModel({ name: 'Normal', migrationNum: 1, default: true }),
    new PriorityModel({ name: 'Urgent', migrationNum: 2, htmlColor: '#8e24aa', default: true }),
    new PriorityModel({ name: 'Critical', migrationNum: 3, htmlColor: '#e65100', default: true }),
  ]

  await Promise.all(
    priorities.map(async item => {
      const existing = await PriorityModel.findOne({ migrationNum: item.migrationNum })
      if (!existing) await item.save()
    })
  )
}

async function normalizeTags() {
  const tags = await TicketTagModel.find({})
  await Promise.all(tags.map(tag => tag.save()))
}

async function checkPriorities() {
  const [countP1, countP2, countP3] = await Promise.all([
    TicketModel.collection.countDocuments({ priority: 1 }),
    TicketModel.collection.countDocuments({ priority: 2 }),
    TicketModel.collection.countDocuments({ priority: 3 }),
  ])

  if (countP1 > 0) {
    const normal = await PriorityModel.getByMigrationNum(1)
    if (!normal) throw new Error('Invalid priority: Normal')
    winston.debug('Converting Priority: Normal')
    await TicketModel.collection.updateMany({ priority: 1 }, { $set: { priority: normal._id } })
  }

  if (countP2 > 0) {
    const urgent = await PriorityModel.getByMigrationNum(2)
    if (!urgent) throw new Error('Invalid priority: Urgent')
    winston.debug('Converting Priority: Urgent')
    await TicketModel.collection.updateMany({ priority: 2 }, { $set: { priority: urgent._id } })
  }

  if (countP3 > 0) {
    const critical = await PriorityModel.getByMigrationNum(3)
    if (!critical) throw new Error('Invalid priority: Critical')
    winston.debug('Converting Priority: Critical')
    await TicketModel.collection.updateMany({ priority: 3 }, { $set: { priority: critical._id } })
  }
}

async function addedDefaultPrioritiesToTicketTypes() {
  let priorities = await PriorityModel.find({ default: true })
  priorities = _.sortBy(priorities, 'migrationNum')
  const types = await TicketTypeModel.getTypes()
  for (const type of types) {
    let prioritiesToAdd: Types.ObjectId[] = []
    if (!type.priorities || type.priorities.length < 1) {
      type.priorities = []
      prioritiesToAdd = _.map(priorities, '_id')
    }

    if (prioritiesToAdd.length > 1) {
      type.priorities = _.concat(type.priorities, prioritiesToAdd)
      await type.save()
    }
  }
}

function mailTemplates(callback: AsyncCallback) {
  parallel(
    [
      function (done: AsyncCallback) {
        ;(TemplateModel as any).findOne({ name: newTicketTemplate.name }, function (err: Error, template: any) {
          if (err) return done(err)
          if (!template) return (TemplateModel as any).create(newTicketTemplate, done)
          return done()
        })
      },
      function (done: AsyncCallback) {
        ;(TemplateModel as any).findOne({ name: passwordResetTemplate.name }, function (err: Error, template: any) {
          if (err) return done(err)
          if (!template) return (TemplateModel as any).create(passwordResetTemplate, done)
          return done()
        })
      },
    ],
    callback
  )
}

function elasticSearchConfToDB(callback: AsyncCallback) {
  const elasticsearch = {
    enable: nconf.get('elasticsearch:enable') || false,
    host: nconf.get('elasticsearch:host') || 'http://localhost',
    port: nconf.get('elasticsearch:port') || 9200,
  }

  nconf.set('elasticsearch', {})

  parallel(
    [
      (done: AsyncCallback) => nconf.save(done),
      function (done: AsyncCallback) {
        SettingModel.getSettingByName('es:enable', function (err, setting) {
          if (err) return done(err)
          if (!setting) SettingModel.create({ name: 'es:enable', value: elasticsearch.enable }, done)
          else done()
        })
      },
      function (done: AsyncCallback) {
        if (!elasticsearch.host) elasticsearch.host = 'localhost'
        SettingModel.getSettingByName('es:host', function (err, setting) {
          if (err) return done(err)
          if (!setting) SettingModel.create({ name: 'es:host', value: elasticsearch.host }, done)
          else done()
        })
      },
      function (done: AsyncCallback) {
        if (!elasticsearch.port) return done()
        SettingModel.getSettingByName('es:port', function (err, setting) {
          if (err) return done(err)
          if (!setting) SettingModel.create({ name: 'es:port', value: elasticsearch.port }, done)
          else done()
        })
      },
    ],
    callback
  )
}

function installationID(callback: AsyncCallback) {
  const chance = new Chance()
  SettingModel.getSettingByName('gen:installid', function (err, setting) {
    if (err) return callback(err)
    if (!setting) SettingModel.create({ name: 'gen:installid', value: chance.guid() }, callback)
    else return callback()
  })
}

async function maintenanceModeDefault() {
  const setting = await SettingModel.getSettingByName('maintenanceMode:enable')
  if (!setting) {
    await SettingModel.create({ name: 'maintenanceMode:enable', value: false })
  }
}

export const init = function (callback: AsyncCallback) {
  winston.debug('Checking Default Settings...')
  series(
    [
      createDirectories,
      downloadWin32MongoDBTools,
      rolesDefault,
      defaultUserRole,
      timezoneDefault,
      ticketTypeSettingDefault,
      defaultTicketStatus,
      ticketPriorityDefaults,
      addedDefaultPrioritiesToTicketTypes,
      checkPriorities,
      normalizeTags,
      mailTemplates,
      elasticSearchConfToDB,
      maintenanceModeDefault,
      installationID,
    ],
    function (err) {
      if (err) winston.warn(err)
      if (typeof callback === 'function') return callback()
    }
  )
}

settingsDefaults.init = init

export default settingsDefaults
