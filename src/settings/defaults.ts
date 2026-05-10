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
import { SettingsUtil } from './settingsUtil'

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

const settingsDefaults: SettingsDefaults = { roleDefaults }

async function createRoleIfMissing(
  name: string, 
  description: string,
  grants: string[]
): Promise<void> {
  const role = await RoleModel.getRoleByName(name)
  
  if (role) return

  await RoleModel.create({ name, description, grants })
}

async function rolesDefault(): Promise<void> {
  await Promise.all([
    createRoleIfMissing('User', 'Default role for users', roleDefaults.userGrants).then(async () => {
      const userRole = await RoleModel.getRoleByName('User')
      if (userRole) {
        const existing = await SettingModel.getSettingByName('role:user:default')
        if (!existing) await SettingsUtil.setSetting('role:user:default', userRole._id)
      }
    }),
    createRoleIfMissing('Support', 'Default role for agents', roleDefaults.supportGrants),
    createRoleIfMissing('Admin', 'Default role for admins', roleDefaults.adminGrants),
  ])

  const roleOrder = await RoleOrderModel.getOrder()
  if (roleOrder) return

  const roles = await RoleModel.getRoles()
  const order = [
    _.find(roles, { name: 'Admin' })?._id,
    _.find(roles, { name: 'Support' })?._id,
    _.find(roles, { name: 'User' })?._id,
  ]
  await RoleOrderModel.create({ order: order.filter((id): id is Types.ObjectId => id != null) })
}

async function defaultUserRole(): Promise<void> {
  const roleOrder = await RoleOrderModel.getOrderLean()
  if (!roleOrder) return

  const roleDefault = await SettingModel.getSettingByName('role:user:default')
  if (roleDefault) return

  const lastId = _.last(roleOrder.order)
  await SettingsUtil.setSetting('role:user:default', lastId as Types.ObjectId)
}

async function createDirectories(): Promise<void> {
  await Promise.all([
    fs.ensureDir(path.resolve(config.trudeskRoot(), 'backups')),
    fs.ensureDir(path.resolve(config.trudeskRoot(), 'restores')),
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
  await fs.ensureDir(savePath)

  if (
    fs.existsSync(path.join(savePath, 'mongodump.exe')) &&
    fs.existsSync(path.join(savePath, 'mongorestore.exe'))
  ) {
    return
  }

  winston.debug('Windows platform detected. Downloading MongoDB Tools [' + filename + ']')
  await fs.emptyDir(savePath)
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
          .on('close', () => fs.unlink(path.join(savePath, filename), _.noop))
      })
    })
    .on('error', function (err: Error) {
      fs.unlink(path.join(savePath, filename), _.noop)
      winston.debug(err)
    })
}

async function timezoneDefault(): Promise<void> {
  const setting = await SettingModel.getSettingByName('gen:timezone')
  const tz = (setting?.value ?? 'America/New_York') as string
  if (!setting) await SettingsUtil.setSetting('gen:timezone', tz)
  winston.debug('Timezone set to ' + tz)
  moment.tz.setDefault(tz)
  global.timezone = tz
}

async function ticketTypeSettingDefault(): Promise<void> {
  const setting = await SettingModel.getSettingByName('ticket:type:default')
  if (setting) return

  const types = await TicketTypeModel.getTypes()
  const type = _.first(types) as TicketTypeClass
  if (!type || !_.isObject(type) || _.isUndefined(type._id))
    throw new Error('Invalid Type. Skipping.')

  await SettingsUtil.setSetting('ticket:type:default', type._id)
}

async function defaultTicketStatus(): Promise<void> {
  const statusDefs = [
    { name: 'New',     htmlColor: '#29b955', uid: 0, order: 0, slatimer: false, isResolved: false, isLocked: true },
    { name: 'Open',    htmlColor: '#d32f2f', uid: 1, order: 1, slatimer: true,  isResolved: false, isLocked: true },
    { name: 'Pending', htmlColor: '#2196F3', uid: 2, order: 2, slatimer: false, isResolved: false, isLocked: true },
    { name: 'Closed',  htmlColor: '#CCCCCC', uid: 3, order: 3, slatimer: false, isResolved: true,  isLocked: true },
  ]

  const counts = await Promise.all(
    statusDefs.map(s => TicketStatusModel.countDocuments({ name: s.name, isLocked: true, uid: s.uid }))
  )

  const toCreate = statusDefs.filter((_, i) => counts[i] === 0).map(s => new TicketStatusModel(s))
  await Promise.all(toCreate.map(s => s.save()))
}

async function ticketPriorityDefaults(): Promise<void> {
  const priorities = [
    new PriorityModel({ name: 'Normal',   migrationNum: 1, default: true }),
    new PriorityModel({ name: 'Urgent',   migrationNum: 2, htmlColor: '#8e24aa', default: true }),
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
  const migrationMap = [
    { num: 1, name: 'Normal' },
    { num: 2, name: 'Urgent' },
    { num: 3, name: 'Critical' },
  ]

  const counts = await Promise.all(
    migrationMap.map(({ num }) => TicketModel.collection.countDocuments({ priority: num }))
  )

  await Promise.all(
    migrationMap.map(async ({ num, name }, i) => {
      if (counts[i] === 0) return
      const priority = await PriorityModel.getByMigrationNum(num)
      if (!priority) throw new Error(`Invalid priority: ${name}`)
      winston.debug('Converting Priority: ' + name)
      await TicketModel.collection.updateMany({ priority: num }, { $set: { priority: priority._id } })
    })
  )
}

async function addedDefaultPrioritiesToTicketTypes(): Promise<void> {
  const priorities = _.sortBy(await PriorityModel.find({ default: true }), 'migrationNum')
  const priorityIds = _.map(priorities, '_id') as Types.ObjectId[]
  const types = await TicketTypeModel.getTypes()

  await Promise.all(
    types.map(async type => {
      if (type.priorities && type.priorities.length > 0) return
      type.priorities = priorityIds
      await type.save()
    })
  )
}

async function mailTemplates(): Promise<void> {
  await Promise.all(
    [newTicketTemplate, passwordResetTemplate].map(async tpl => {
      const existing = await TemplateModel.findOne({ name: tpl.name })
      if (!existing) await TemplateModel.create(tpl)
    })
  )
}

async function elasticSearchConfToDB(): Promise<void> {
  const elasticsearch = {
    enable: nconf.get('elasticsearch:enable') || false,
    host:   nconf.get('elasticsearch:host')   || 'http://localhost',
    port:   nconf.get('elasticsearch:port')   || 9200,
  }

  nconf.set('elasticsearch', {})
  await nconf.save()

  await Promise.all([
    SettingModel.getSettingByName('es:enable').then(s =>
      s ? undefined : SettingsUtil.setSetting('es:enable', elasticsearch.enable)
    ),
    SettingModel.getSettingByName('es:host').then(s =>
      s ? undefined : SettingsUtil.setSetting('es:host', elasticsearch.host || 'localhost')
    ),
    elasticsearch.port
      ? SettingModel.getSettingByName('es:port').then(s =>
          s ? undefined : SettingsUtil.setSetting('es:port', elasticsearch.port.toString())
        )
      : Promise.resolve(),
  ])
}

async function installationID(): Promise<void> {
  const setting = await SettingModel.getSettingByName('gen:installid')
  if (!setting) {
    const chance = new Chance()
    await SettingsUtil.setSetting('gen:installid', chance.guid())
  }
}

async function maintenanceModeDefault(): Promise<void> {
  const setting = await SettingModel.getSettingByName('maintenanceMode:enable')
  if (!setting) await SettingsUtil.setSetting('maintenanceMode:enable', false)
}

export function init(callback: AsyncCallback): void {
  winston.debug('Checking Default Settings...')

  ;(async () => {
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

      callback()
    } catch (err) {
      winston.warn(err)
      callback(err as Error)
    }
  })()
}

settingsDefaults.init = init

export default settingsDefaults
