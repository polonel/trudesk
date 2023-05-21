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

import jsStringEscape from 'js-string-escape'
import _ from 'lodash'
import config from '../config'
import {
  PriorityModel,
  RoleModel,
  RoleOrderModel,
  SettingModel,
  TemplateModel,
  TicketTagModel,
  TicketTypeModel,
} from '../models'
import type { SettingsObjectType, SettingsObjectType_Base } from './settings'

export interface ISettingsUtil {
  setSetting: (setting: string, value: string | object | boolean | number) => Promise<void>
  getSettings: (callback: (err?: Error | null | undefined, settings?: ContentData) => void) => Promise<ContentData>
}

function parseSetting(
  settings: Array<SettingsObjectType_Base>,
  name: string,
  defaultValue: string | boolean | object | number
) {
  let s = _.find(settings, function (x) {
    return x.name === name
  })

  s = _.isUndefined(s) ? { name, value: defaultValue } : s

  return s
}

async function setSetting(setting: string, value: string | object | boolean | number) {
  return new Promise<void>((resolve, reject) => {
    ;(async () => {
      try {
        const s = {
          name: setting,
          value: value,
        }

        await SettingModel.updateOne({ name: s.name }, s, { upsert: true })
        return resolve()
      } catch (e) {
        return reject(e)
      }
    })()
  })
}

interface ContentData {
  ticketTypes?: any
  priorities?: any
  mailTemplates?: any
  tags?: any
  roles?: any
  settings?: SettingsObjectType
}

async function getSettings(
  callback: (err?: Error | null | undefined, data?: ContentData) => void
): Promise<ContentData> {
  return new Promise<ContentData>((resolve, reject) => {
    ;(async () => {
      try {
        const settings = await SettingModel.getSettings() as Array<SettingsObjectType_Base>
        const result: ContentData = {}
        const s: SettingsObjectType = {
          emailBeta: parseSetting(settings, 'beta:email', false),
          hasThirdParty: !config.get('thirdParty') ? false : config.get('thirdParty').enable,

          siteTitle: parseSetting(settings, 'gen:sitetitle', 'Trudesk'),
          siteUrl: parseSetting(settings, 'gen:siteurl', ''),
          timezone: parseSetting(settings, 'gen:timezone', 'America/New_York'),
          timeFormat: parseSetting(settings, 'gen:timeFormat', 'hh:mma'),
          shortDateFormat: parseSetting(settings, 'gen:shortDateFormat', 'MM/DD/YYYY'),
          longDateFormat: parseSetting(settings, 'gen:longDateFormat', 'MMM DD, YYYY'),

          hasCustomLogo: parseSetting(settings, 'gen:customlogo', false),
          customLogoFilename: parseSetting(settings, 'gen:customlogofilename', ''),
          hasCustomPageLogo: parseSetting(settings, 'gen:custompagelogo', false),
          customPageLogoFilename: parseSetting(settings, 'gen:custompagelogofilename', ''),
          hasCustomFavicon: parseSetting(settings, 'gen:customfavicon', false),
          customFaviconFilename: parseSetting(settings, 'gen:customfaviconfilename', ''),

          colorHeaderBG: parseSetting(settings, 'color:headerbg', '#42464d'),
          colorHeaderPrimary: parseSetting(settings, 'color:headerprimary', '#f6f7fa'),
          colorPrimary: parseSetting(settings, 'color:primary', '#545A63'),
          colorSecondary: parseSetting(settings, 'color:secondary', '#f7f8fa'),
          colorTertiary: parseSetting(settings, 'color:tertiary', '#E74C3C'),
          colorQuaternary: parseSetting(settings, 'color:quaternary', '#E6E7E8'),

          defaultTicketType: parseSetting(settings, 'ticket:type:default', ''),
          minSubjectLength: parseSetting(settings, 'ticket:minlength:subject', 10),
          minIssueLength: parseSetting(settings, 'ticket:minlength:issue', 10),

          defaultUserRole: parseSetting(settings, 'role:user:default', ''),

          mailerEnabled: parseSetting(settings, 'mailer:enable', false),
          mailerHost: parseSetting(settings, 'mailer:host', ''),
          mailerSSL: parseSetting(settings, 'mailer:ssl', false),
          mailerPort: parseSetting(settings, 'mailer:port', 25),
          mailerUsername: parseSetting(settings, 'mailer:username', ''),
          mailerPassword: parseSetting(settings, 'mailer:password', ''),
          mailerFrom: parseSetting(settings, 'mailer:from', ''),

          mailerCheckEnabled: parseSetting(settings, 'mailer:check:enable', false),
          mailerCheckPolling: parseSetting(settings, 'mailer:check:polling', 600000),
          mailerCheckHost: parseSetting(settings, 'mailer:check:host', ''),
          mailerCheckPort: parseSetting(settings, 'mailer:check:port', 143),
          mailerCheckUsername: parseSetting(settings, 'mailer:check:username', ''),
          mailerCheckPassword: parseSetting(settings, 'mailer:check:password', ''),
          mailerCheckSelfSign: parseSetting(settings, 'mailer:check:selfsign', false),
          mailerCheckTicketType: parseSetting(settings, 'mailer:check:ticketype', ''),
          mailerCheckTicketPriority: parseSetting(settings, 'mailer:check:ticketpriority', ''),
          mailerCheckCreateAccount: parseSetting(settings, 'mailer:check:createaccount', false),
          mailerCheckDeleteMessage: parseSetting(settings, 'mailer:check:deletemessage', true),

          showTour: parseSetting(settings, 'showTour:enable', false),
          showOverdueTickets: parseSetting(settings, 'showOverdueTickets:enable', true),

          // Elasticsearch
          elasticSearchEnabled: parseSetting(settings, 'es:enable', false),
          elasticSearchHost: parseSetting(settings, 'es:host', ''),
          elasticSearchPort: parseSetting(settings, 'es:port', 9200),
          elasticSearchConfigured: {
            name: 'es:configured',
            value:
              parseSetting(settings, 'es:enable', false).value &&
              !_.isEmpty(parseSetting(settings, 'es:host', '').value),
          },

          allowAgentUserTickets: parseSetting(settings, 'allowAgentUserTickets:enable', false),
          allowPublicTickets: parseSetting(settings, 'allowPublicTickets:enable', false),
          allowUserRegistration: parseSetting(settings, 'allowUserRegistration:enable', false),
          playNewTicketSound: parseSetting(settings, 'playNewTicketSound:enable', true),

          privacyPolicy: parseSetting(settings, 'legal:privacypolicy', ' '),

          maintenanceMode: parseSetting(settings, 'maintenanceMode:enable', false),

          accountsPasswordComplexity: parseSetting(settings, 'accountsPasswordComplexity:enable', true),
        }

        s.privacyPolicy.value = jsStringEscape(s.privacyPolicy.value)

        const types = await TicketTypeModel.getTypes()
        result.ticketTypes = _.sortBy(types, (o) => o.name)

        _.each(result.ticketTypes, (type) => {
          type.priorities = _.sortBy(type.priorities, ['migrationNum', 'name'])
        })

        const priorities = await PriorityModel.getPriorities()
        result.priorities = _.sortBy(priorities, ['migrationNum', 'name'])

        const templates = await TemplateModel.find({})
        result.mailTemplates = _.sortBy(templates, 'name')

        const tagCount = await TicketTagModel.getTagCount()
        result.tags = { count: tagCount }

        const roles = await RoleModel.getRoles()
        const roleOrder = await RoleOrderModel.getOrder()
        if (!roleOrder) {
          if (typeof callback === 'function') callback(new Error('Invalid Role Order'))
          return reject(new Error('Invalid Role Order'))
        }

        const roleOrderIds = roleOrder.order

        if (roleOrderIds && roleOrderIds.length > 0) {
          result.roles = _.map(roleOrder, (roID) => {
            return _.find(roles, { _id: roID })
          })
        } else result.roles = roles

        result.settings = s

        if (typeof callback === 'function') callback(null, result)

        return resolve(result)
      } catch (e) {
        if (typeof callback === 'function') callback(e as Error)

        return reject(e)
      }
    })()
  })
}

export const SettingsUtil: ISettingsUtil = {
  setSetting,
  getSettings,
}

export default SettingsUtil

module.exports = SettingsUtil
