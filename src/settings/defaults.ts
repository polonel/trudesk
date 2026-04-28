/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b 888 `88b.
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

async function rolesDefault(): Promise<void> {
  const tasks = [
    async () => {
      const role = await RoleModel.getRoleByName('User')
      if (role) return
      
      const userRole = await RoleModel.create({
        name: 'User',
        description: 'Default role for users',
        grants: roleDefaults.userGrants
      })
      
      const roleUserDefault = await SettingModel.getSettingByName('role:user:default')
      if (!roleUserDefault) {
        await SettingModel.create({ name: 'role:user:default', value: userRole._id })
      }
    },
    async () => {
      const role = await RoleModel.getRoleByName('Support')
      if (role) return
      
      await RoleModel.create({
        name: 'Support',
        description: 'Default role for agents',
        grants: roleDefaults.supportGrants
      })
    },
    async () => {
      const role = await RoleModel.getRoleByName('Admin')
      if (role) return
      
      await RoleModel.create({
        name: 'Admin',
        description: 'Default role for admins',
        grants: roleDefaults.adminGrants
      })
    },
    async () => {
      const roleOrder = await (RoleOrderModel as any).getOrder()
      if (roleOrder) return

      const roles = await RoleModel.getRoles()
      
      const order = [
        _.find(roles, { name: 'Admin' })?._id,
        _.find(roles, { name: 'Support' })?._id,
        _.find(roles, { name: 'User' })?._id,
      ]
      
      await (RoleOrderModel as any).create({ order })
    }
  ]

  // Execute tasks sequentially
  for (const task of tasks) {
    await task()
  }
}

async function defaultUserRole(): Promise<void> {
  const roleOrder = await (RoleOrderModel as any).getOrderLean()
  if (!roleOrder) return

  const roleDefault = await SettingModel.getSettingByName('role:user:default')
  if (roleDefault) return

  const lastId = _.last(roleOrder.order)
  await SettingModel.create({ name: 'role:user:default', value: lastId })
}

async function createDirectories(): Promise<void> {
  await Promise.all([
    fs.ensureDir(path.resolve(config.trudeskRoot(), 'backups')),
    fs.ensureDir(path.resolve(config.trudeskRoot(), 'restores'))
  ])
}

async function downloadWin32MongoDBTools(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const os = require('os')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const semver = require('semver')
  const dbVersion = trudeskDatabase.version || '5.0.6'
  const fileVersion = semver.major(dbVersion) + '.' + semver.minor(dbVersion)

  if (os.platform() !== 'win32') return

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
    return
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
          .on('close', () => fs.unlink(path.join(savePath, filename), () => {}))
      })
    })
    .on('error', function (err: Error) {
      fs.unlink(path.join(savePath, filename))
      winston.debug(err)
    })
}

async function timezoneDefault(): Promise<void> {
  const setting = await SettingModel.getSettingByName('gen:timezone')
  if (!setting) {
    const defaultTimezone = new SettingModel({ name: 'gen:timezone', value: 'America/New_York' })
    const savedSetting = await defaultTimezone.save()
    winston.debug('Timezone set to ' + savedSetting.value)
    moment.tz.setDefault(savedSetting.value)
    global.timezone = savedSetting.value
  } else {
    winston.debug('Timezone set to ' + setting.value)
    moment.tz.setDefault(setting.value)
    global.timezone = setting.value
  }
}

async function showTourSettingDefault(): Promise<void> {
  const setting = await SettingModel.getSettingByName('showTour:enable')
  if (!setting) {
    const defaultShowTour = new SettingModel({ name: 'showTour:enable', value: 0 })
    await defaultShowTour.save()
  }
}

async function ticketTypeSettingDefault(): Promise<void> {
  const setting = await SettingModel.getSettingByName('ticket:type:default')
  if (!setting) {
    try {
      const types = await TicketTypeModel.getTypes()
      const type = _.first(types) as TicketTypeClass
      if (!type || !_.isObject(type) || _.isUndefined(type._id))
        throw new Error('Invalid Type. Skipping.')

      const defaultTicketType = new SettingModel({ name: 'ticket:type:default', value: type._id })
      await defaultTicketType.save()
    } catch (err) {
      winston.warn(err)
      throw err
    }
  }
}

async function defaultTicketStatus(): Promise<void> {
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

async function ticketPriorityDefaults(): Promise<void> {
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

async function normalizeTags(): Promise<void> {
  const tags = await TicketTagModel.find({})
  await Promise.all(tags.map(tag => tag.save()))
}

async function checkPriorities(): Promise<void> {
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

async function addedDefaultPrioritiesToTicketTypes(): Promise<void> {
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

async function mailTemplates(): Promise<void> {
  const tasks = [
    async () => {
      const template = await (TemplateModel as any).findOne({ name: newTicketTemplate.name })
      if (!template) {
        await (TemplateModel as any).create(newTicketTemplate)
      }
    },
    async () => {
      const template = await (TemplateModel as any).findOne({ name: passwordResetTemplate.name })
      if (!template) {
        await (TemplateModel as any).create(passwordResetTemplate)
      }
    }
  ]

  // Execute tasks sequentially
  for (const task of tasks) {
    await task()
  }
}

async function elasticSearchConfToDB(): Promise<void> {
  const elasticsearch = {
    enable: nconf.get('elasticsearch:enable') || false,
    host: nconf.get('elasticsearch:host') || 'http://localhost',
    port: nconf.get('elasticsearch:port') || 9200,
  }

  nconf.set('elasticsearch', {})

  await Promise.all([
    nconf.save(),
    async () => {
      const setting = await SettingModel.getSettingByName('es:enable')
      if (!setting) {
        await SettingModel.create({ name: 'es:enable', value: elasticsearch.enable })
      }
    },
    async () => {
      if (!elasticsearch.host) elasticsearch.host = 'localhost'
      const setting = await SettingModel.getSettingByName('es:host')
      if (!setting) {
        await SettingModel.create({ name: 'es:host', value: elasticsearch.host })
      }
    },
    async () => {
      if (!elasticsearch.port) return
      const setting = await SettingModel.getSettingByName('es:port')
      if (!setting) {
        await SettingModel.create({ name: 'es:port', value: elasticsearch.port.toString() })
      }
    }
  ])
}

async function installationID(): Promise<void> {
  const chance = new Chance()
  const setting = await SettingModel.getSettingByName('gen:installid')
  if (!setting) {
    await SettingModel.create({ name: 'gen:installid', value: chance.guid() })
  }
}

async function maintenanceModeDefault(): Promise<void> {
  const setting = await SettingModel.getSettingByName('maintenanceMode:enable')
  if (!setting) {
    await SettingModel.create({ name: 'maintenanceMode:enable', value: false })
  }
}

export function init(callback: AsyncCallback): void {
  winston.debug('Checking Default Settings...')
  
  const promise = async () => {
    try {
      await createDirectories()
      await downloadWin32MongoDBTools()
      await rolesDefault()
      await defaultUserRole()
      await timezoneDefault()
      await ticketTypeSettingDefault()
      await defaultTicketStatus()
      await ticketPriorityDefaults()
      await addedDefaultPrioritiesToTicketTypes()
      await checkPriorities()
      await normalizeTags()
      await mailTemplates()
      await elasticSearchConfToDB()
      await maintenanceModeDefault()
      await installationID()
      
      if (typeof callback === 'function') {
        callback()
      }
    } catch (err) {
      winston.warn(err)
      if (typeof callback === 'function') {
        callback(err as Error)
      }
    }
  }

  promise()
}

settingsDefaults.init = init

export default settingsDefaults