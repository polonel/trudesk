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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import _ from 'lodash'
import path from 'path'
import fs from 'fs'
import winston from '../../logger'
import moment from 'moment'
import type { Request } from 'express'
import type { Types } from 'mongoose'
import {
  ConversationModel,
  DepartmentModel,
  GroupModel,
  MessageModel,
  NoticeModel,
  NotificationModel,
  PriorityModel,
  SettingModel,
  TeamModel,
  TicketTagModel,
  TicketTypeModel,
  UserModel,
} from '../../models'
import settingsUtil from '../../settings/settingsUtil'
import buildSass from '../../sass/buildsass'
import packageJson from '../../../package.json'
import permissions from '../../permissions'
import { trudeskRoot } from '../../config'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ViewdataRequest extends Request {
  user?: {
    _id: Types.ObjectId
    role: {
      isAdmin: boolean
      isAgent: boolean
    }
  }
}

export interface ViewData {
  version?: string
  timeFormat?: string
  shortDateFormat?: string
  longDateFormat?: string
  ticketSettings?: {
    playNewTicketSound?: boolean
    minSubject?: number
    minIssue?: number
    allowAgentUserTickets?: boolean
  }
  siteTitle?: string
  hostname?: string
  hosturl?: string
  timezone?: string
  hasCustomLogo?: boolean
  logoImage?: string
  hasCustomPageLogo?: boolean
  pageLogoImage?: string
  hasCustomFavicon?: boolean
  favicon?: string
  notice?: any
  noticeCookieName?: string | undefined
  defaultTicketType?: any
  showOverdue?: boolean
  hasThirdParty?: boolean | undefined
  accountsPasswordComplexity?: boolean
  plugins?: any[]
  users?: Record<string, unknown>
}

type NodeCallback<T = void> = (err?: Error | null, data?: T) => void

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Runs an async operation and swallows errors, logging them as warnings. */
async function safe(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (e) {
    winston.warn(`viewdata/${label}: ${e}`)
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

const viewController = {
  getData,
  getActiveNotice,
  getUserNotifications,
  getUnreadNotificationsCount,
  getConversations,
  getUsers,
  loggedInAccount,
  getTeams,
  getGroups,
  getTypes,
  getDefaultTicketType,
  getPriorities,
  getTags,
  getOverdueSetting,
  getShowTourSetting,
  getPluginsInfo,
}

async function getData(request: ViewdataRequest, cb: (data: ViewData) => void): Promise<void> {
  // Local per-request viewdata prevents concurrent requests from corrupting each other
  const viewdata: ViewData = { users: {} }

  try {
    if (global.env === 'development') {
      await new Promise<void>(resolve =>
        buildSass.build((err?: any) => { if (err) winston.warn(err); resolve() })
      )
    }

    viewdata.version = packageJson.version

    await Promise.all([
      // Date/time formats
      safe('dateFormats', async () => {
        const [tf, sdf, ldf] = await Promise.all([
          SettingModel.getSettingByName('gen:timeFormat'),
          SettingModel.getSettingByName('gen:shortDateFormat'),
          SettingModel.getSettingByName('gen:longDateFormat'),
        ])
        viewdata.timeFormat = (tf as any)?.value ?? 'hh:mma'
        viewdata.shortDateFormat = (sdf as any)?.value ?? 'MM/DD/YYYY'
        viewdata.longDateFormat = (ldf as any)?.value ?? 'MMM DD, YYYY'
      }),

      // Ticket settings
      safe('ticketSettings', async () => {
        viewdata.ticketSettings = {}
        const [playSound, minSub, minIss, allowAgent] = await Promise.all([
          SettingModel.getSettingByName('playNewTicketSound:enable'),
          SettingModel.getSettingByName('ticket:minlength:subject'),
          SettingModel.getSettingByName('ticket:minlength:issue'),
          SettingModel.getSettingByName('allowAgentUserTickets:enable'),
        ])
        viewdata.ticketSettings.playNewTicketSound = (playSound as any)?.value ?? true
        viewdata.ticketSettings.minSubject = (minSub as any)?.value ?? 10
        viewdata.ticketSettings.minIssue = (minIss as any)?.value ?? 10
        viewdata.ticketSettings.allowAgentUserTickets = (allowAgent as any)?.value ?? false
      }),

      // Site title
      safe('siteTitle', async () => {
        const s = await SettingModel.getSettingByName('gen:sitetitle') as any
        viewdata.siteTitle = s?.value ?? 'Trudesk'
      }),

      // Hostname and base URL
      safe('hosturl', async () => {
        viewdata.hostname = request.hostname
        viewdata.hosturl = `${request.protocol}://${request.get('host')}`
        const s = await SettingModel.getSettingByName('gen:siteurl') as any
        if (!s) {
          const created = await SettingModel.create({ name: 'gen:siteurl', value: viewdata.hosturl }) as any
          if (!(global as any).TRUDESK_BASEURL) (global as any).TRUDESK_BASEURL = created.value
        }
      }),

      // Timezone
      safe('timezone', async () => {
        const s = await SettingModel.getSettingByName('gen:timezone') as any
        viewdata.timezone = s?.value ?? 'America/New_York'
      }),

      // Custom logo
      safe('logo', async () => {
        const hasLogo = await SettingModel.getSettingByName('gen:customlogo') as any
        viewdata.hasCustomLogo = !!(hasLogo?.value)
        if (!viewdata.hasCustomLogo) {
          viewdata.logoImage = '/img/defaultLogoLight.png'
          return
        }
        const logoFile = await SettingModel.getSettingByName('gen:customlogofilename') as any
        viewdata.logoImage = logoFile?.value ? `/assets/${logoFile.value}` : '/img/defaultLogoLight.png'
      }),

      // Custom page logo
      safe('pageLogo', async () => {
        const hasLogo = await SettingModel.getSettingByName('gen:custompagelogo') as any
        viewdata.hasCustomPageLogo = !!(hasLogo?.value)
        if (!viewdata.hasCustomPageLogo) {
          viewdata.pageLogoImage = '/img/defaultLogoDark.png'
          return
        }
        const logoFile = await SettingModel.getSettingByName('gen:custompagelogofilename') as any
        viewdata.pageLogoImage = logoFile?.value ? `/assets/${logoFile.value}` : '/img/defaultLogoDark.png'
      }),

      // Custom favicon
      safe('favicon', async () => {
        viewdata.favicon = '/img/favicon.ico'
        const hasFavicon = await SettingModel.getSettingByName('gen:customfavicon') as any
        viewdata.hasCustomFavicon = !!(hasFavicon?.value === true)
        if (!viewdata.hasCustomFavicon) return
        const faviconFile = await SettingModel.getSettingByName('gen:customfaviconfilename') as any
        if (faviconFile?.value) viewdata.favicon = `/assets/${faviconFile.value}`
      }),

      // Active notice
      safe('notice', async () => {
        const notice = await NoticeModel.getActive() as any
        viewdata.notice = notice
        viewdata.noticeCookieName = undefined
        if (notice != null) {
          viewdata.noticeCookieName = `${notice.name}_${moment(notice.activeDate).format('MMMDDYYYY_HHmmss')}`
        }
      }),

      // Default ticket type
      safe('defaultTicketType', async () => {
        const defaultType = await SettingModel.getSettingByName('ticket:type:default') as any
        if (!defaultType?.value) return
        viewdata.defaultTicketType = await TicketTypeModel.getType(defaultType.value)
      }),

      // Overdue setting
      safe('overdue', async () => {
        const s = await SettingModel.getSettingByName('showOverdueTickets:enable') as any
        viewdata.showOverdue = s == null ? true : s.value
      }),

      // App-wide settings
      safe('appSettings', async () => {
        const res = await settingsUtil.getSettings(_.noop)
        viewdata.hasThirdParty = res?.settings?.hasThirdParty
        viewdata.accountsPasswordComplexity = (res?.settings?.accountsPasswordComplexity as any)?.value
      }),

      // Plugins
      safe('plugins', async () => {
        viewdata.plugins = await new Promise<any[]>((resolve, reject) =>
          getPluginsInfo(request, (err, data) => err ? reject(err) : resolve(data ?? []))
        )
      }),
    ])
  } catch (err) {
    winston.warn('Error in getData: ' + err)
  }

  return cb(viewdata)
}

async function getActiveNotice(callback: NodeCallback<any>): Promise<void> {
  try {
    const notice = await NoticeModel.getActive()
    return callback(null, notice)
  } catch (err: any) {
    winston.warn(err.message)
    return callback(err)
  }
}

async function getUserNotifications(request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    const data = await NotificationModel.findAllForUser(request.user!._id)
    return callback(null, data)
  } catch (err: any) {
    winston.warn(err.message)
    return callback(err)
  }
}

async function getUnreadNotificationsCount(request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    const count = await NotificationModel.getUnreadCount(request.user!._id)
    return callback(null, count)
  } catch (err: any) {
    winston.warn(err.message)
    return callback(err)
  }
}

async function getConversations(request: ViewdataRequest, callback: NodeCallback<any[]>): Promise<void> {
  try {
    const conversations = await (ConversationModel as any).getConversationsWithLimit(request.user!._id, 10)
    const convos: any[] = []

    for (const convo of conversations) {
      const c = convo.toObject()
      const userMeta = convo.userMeta[
        _.findIndex(convo.userMeta, (item: any) => item.userId.toString() === request.user!._id.toString())
      ]

      if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt) {
        continue
      }

      const rm = await MessageModel.getMostRecentMessage(c._id)

      _.each(c.participants, (p: any) => {
        if (p._id.toString() !== request.user!._id.toString()) c.partner = p
      })

      const first = _.first(rm as any[])
      if (!_.isUndefined(first)) {
        c.recentMessage =
          String(c.partner._id) === String((first as any).owner._id)
            ? c.partner.fullname + ': ' + (first as any).body
            : 'You: ' + (first as any).body
      } else {
        c.recentMessage = 'New Conversation'
      }

      convos.push(c)
    }

    return callback(null, convos)
  } catch (err: any) {
    winston.warn(err.message)
    return callback(err)
  }
}

async function getUsers(request: ViewdataRequest, callback: (data: any) => void): Promise<void> {
  if (request.user?.role.isAdmin || request.user?.role.isAgent) {
    try {
      const users = await UserModel.find({})
      if (!users) throw new Error('Unable to find any users...')

      let u: any = _.reject(users, u => u.deleted === true)
      u.password = null
      u.role = null
      u.resetPassHash = null
      u.resetPassExpire = null
      u.accessToken = null
      u.iOSDeviceTokens = null
      u.preferences = null
      u.tOTPKey = null
      u = _.sortBy(u, 'fullname')
      return callback(u)
    } catch (e) {
      winston.warn(e)
      return callback(e)
    }
  } else {
    const groups = await GroupModel.getAllGroupsOfUser(request.user!._id)
    let users: any = _.map(groups, g =>
      _.map((g as any).members, (m: any) => {
        m.password = null
        m.role = null
        m.resetPassHash = null
        m.resetPassExpire = null
        m.accessToken = null
        m.iOSDeviceTokens = null
        m.preferences = null
        m.tOTPKey = null
        return m
      })
    )
    users = _.chain(users).flattenDeep().uniqBy((i: any) => i._id).sortBy('fullname').value()
    return callback(users)
  }
}

async function loggedInAccount(request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    const user = await (UserModel as any).getUser(request.user!._id)
    return callback(null, user)
  } catch (e) {
    winston.warn(e)
    return callback(e as Error)
  }
}

async function getTeams(_request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    const teams = await TeamModel.getTeams()
    return callback(null, teams)
  } catch (err: any) {
    return callback(err)
  }
}

async function getGroups(request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  if (!request.user) return callback(new Error('Invalid User'))

  if (request.user.role.isAdmin || request.user.role.isAgent) {
    try {
      const groups = await DepartmentModel.getDepartmentGroupsOfUser(request.user._id)
      return callback(null, groups)
    } catch (err: any) {
      winston.debug(err)
      return callback(err)
    }
  } else {
    try {
      let data: any = await GroupModel.getAllGroupsOfUserNoPopulate(request.user._id)
      if (permissions.canThis(request.user.role as any, 'ticket:public')) {
        const publicGroups = await GroupModel.getAllPublicGroups()
        data = data.concat(publicGroups)
      }
      return callback(null, data)
    } catch (err: any) {
      winston.debug(err)
      return callback(err)
    }
  }
}

async function getTypes(_request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    const data = await TicketTypeModel.getTypes()
    return callback(null, data)
  } catch (err: any) {
    winston.debug(err)
    return callback(err)
  }
}

async function getDefaultTicketType(_request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    const defaultType = await SettingModel.getSettingByName('ticket:type:default') as any
    if (!defaultType?.value) return callback(null, null)
    const type = await TicketTypeModel.getType(defaultType.value)
    return callback(null, type)
  } catch (err: any) {
    winston.debug('Error viewController:getDefaultTicketType: ', err)
    return callback(err)
  }
}

async function getPriorities(_request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    let priorities: any = await (PriorityModel as any).getPriorities()
    priorities = _.sortBy(priorities, ['migrationNum', 'name'])
    return callback(null, priorities)
  } catch (err: any) {
    winston.debug('Error viewController:getPriorities: ' + err)
    return callback(err)
  }
}

async function getTags(_request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    const data = await TicketTagModel.getTags()
    return callback(null, data)
  } catch (err: any) {
    winston.debug(err)
    return callback(err)
  }
}

async function getOverdueSetting(_request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  try {
    const data = await SettingModel.getSettingByName('showOverdueTickets:enable') as any
    return callback(null, data == null ? true : data.value)
  } catch (err: any) {
    winston.debug(err)
    return callback(null, true)
  }
}

async function getShowTourSetting(request: ViewdataRequest, callback: NodeCallback<any>): Promise<void> {
  if (!request.user) return callback(new Error('Invalid User'))

  try {
    const data = await SettingModel.getSettingByName('showTour:enable') as any
    if (data !== null && data !== undefined && data === false) return callback(null, true)

    const user = await (UserModel as any).getUser(request.user._id)
    const hasTourCompleted = user?.preferences?.tourCompleted ?? false

    if (hasTourCompleted) return callback(null, false)
    if (data === null) return callback(null, true)
    return callback(null, data?.value)
  } catch (e) {
    winston.warn(e)
    return callback(e as Error)
  }
}

function getPluginsInfo(_request: ViewdataRequest, callback: NodeCallback<any[]>): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dive = require('dive')
  const pluginDir = path.resolve(trudeskRoot(), 'plugins')
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir)
  const plugins: any[] = []

  dive(
    pluginDir,
    { directories: true, files: false, recursive: false },
    function (err: Error, dir: string) {
      if (err) throw err
      delete require.cache[require.resolve(path.join(dir, '/plugin.json'))]
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      plugins.push(require(path.join(dir, '/plugin.json')))
    },
    function () {
      return callback(null, _.sortBy(plugins, 'name'))
    }
  )
}

export default viewController
