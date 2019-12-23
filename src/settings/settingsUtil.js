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

var _ = require('lodash')
var async = require('async')
var jsStringEscape = require('js-string-escape')
var settingSchema = require('../models/setting')
var ticketTypeSchema = require('../models/tickettype')
var roleSchema = require('../models/role')
var roleOrderSchema = require('../models/roleorder')

var util = {}

function parseSetting (settings, name, defaultValue) {
  var s = _.find(settings, function (x) {
    return x.name === name
  })
  s = _.isUndefined(s) ? { value: defaultValue } : s

  return s
}

util.setSetting = function (setting, value, callback) {
  var s = {
    name: setting,
    value: value
  }

  settingSchema.updateOne({ name: s.name }, s, { upsert: true }, callback)
}

util.getSettings = function (callback) {
  settingSchema.getSettings(function (err, settings) {
    if (err) return callback('Invalid Settings')

    var s = {}

    var content = {
      data: {}
    }

    s.emailBeta = parseSetting(settings, 'beta:email', false)

    s.siteTitle = parseSetting(settings, 'gen:sitetitle', 'Trudesk')
    s.siteUrl = parseSetting(settings, 'gen:siteurl', '')
    s.timezone = parseSetting(settings, 'gen:timezone', 'America/New_York')
    s.timeFormat = parseSetting(settings, 'gen:timeFormat', 'hh:mma')
    s.shortDateFormat = parseSetting(settings, 'gen:shortDateFormat', 'MM/DD/YYYY')
    s.longDateFormat = parseSetting(settings, 'gen:longDateFormat', 'MMM DD, YYYY')

    s.hasCustomLogo = parseSetting(settings, 'gen:customlogo', false)
    s.customLogoFilename = parseSetting(settings, 'gen:customlogofilename', '')
    s.hasCustomPageLogo = parseSetting(settings, 'gen:custompagelogo', false)
    s.customPageLogoFilename = parseSetting(settings, 'gen:custompagelogofilename', '')
    s.hasCustomFavicon = parseSetting(settings, 'gen:customfavicon', false)
    s.customFaviconFilename = parseSetting(settings, 'gen:customfaviconfilename', '')

    s.colorHeaderBG = parseSetting(settings, 'color:headerbg', '#42464d')
    s.colorHeaderPrimary = parseSetting(settings, 'color:headerprimary', '#f6f7fa')
    s.colorPrimary = parseSetting(settings, 'color:primary', '#545A63')
    s.colorSecondary = parseSetting(settings, 'color:secondary', '#f7f8fa')
    s.colorTertiary = parseSetting(settings, 'color:tertiary', '#E74C3C')
    s.colorQuaternary = parseSetting(settings, 'color:quaternary', '#E6E7E8')

    s.defaultTicketType = parseSetting(settings, 'ticket:type:default', '')
    s.minSubjectLength = parseSetting(settings, 'ticket:minlength:subject', 10)
    s.minIssueLength = parseSetting(settings, 'ticket:minlength:issue', 10)

    s.defaultUserRole = parseSetting(settings, 'role:user:default', '')

    s.mailerEnabled = parseSetting(settings, 'mailer:enable', false)
    s.mailerHost = parseSetting(settings, 'mailer:host', '')
    s.mailerSSL = parseSetting(settings, 'mailer:ssl', false)
    s.mailerPort = parseSetting(settings, 'mailer:port', 25)
    s.mailerUsername = parseSetting(settings, 'mailer:username', '')
    s.mailerPassword = parseSetting(settings, 'mailer:password', '')
    s.mailerFrom = parseSetting(settings, 'mailer:from', '')

    s.mailerCheckEnabled = parseSetting(settings, 'mailer:check:enable', false)
    s.mailerCheckPolling = parseSetting(settings, 'mailer:check:polling', 600000)
    s.mailerCheckHost = parseSetting(settings, 'mailer:check:host', '')
    s.mailerCheckPort = parseSetting(settings, 'mailer:check:port', 143)
    s.mailerCheckUsername = parseSetting(settings, 'mailer:check:username', '')
    s.mailerCheckPassword = parseSetting(settings, 'mailer:check:password', '')
    s.mailerCheckTicketType = parseSetting(settings, 'mailer:check:ticketype', '')
    s.mailerCheckTicketPriority = parseSetting(settings, 'mailer:check:ticketpriority', '')
    s.mailerCheckCreateAccount = parseSetting(settings, 'mailer:check:createaccount', false)
    s.mailerCheckDeleteMessage = parseSetting(settings, 'mailer:check:deletemessage', true)

    s.showTour = parseSetting(settings, 'showTour:enable', false)
    s.showOverdueTickets = parseSetting(settings, 'showOverdueTickets:enable', true)

    // Elasticsearch
    s.elasticSearchEnabled = parseSetting(settings, 'es:enable', false)
    s.elasticSearchHost = parseSetting(settings, 'es:host', '')
    s.elasticSearchPort = parseSetting(settings, 'es:port', 9200)
    s.elasticSearchConfigured = {
      value: s.elasticSearchEnabled.value !== false && !_.isEmpty(s.elasticSearchHost.value)
    }

    s.tpsEnabled = parseSetting(settings, 'tps:enable', false)
    s.tpsUsername = parseSetting(settings, 'tps:username', '')
    s.tpsApiKey = parseSetting(settings, 'tps:apikey', '')

    s.allowAgentUserTickets = parseSetting(settings, 'allowAgentUserTickets:enable', false)
    s.allowPublicTickets = parseSetting(settings, 'allowPublicTickets:enable', false)
    s.allowUserRegistration = parseSetting(settings, 'allowUserRegistration:enable', false)

    s.privacyPolicy = parseSetting(settings, 'legal:privacypolicy', '')
    s.privacyPolicy.value = jsStringEscape(s.privacyPolicy.value)

    async.parallel(
      [
        function (done) {
          ticketTypeSchema.getTypes(function (err, types) {
            if (err) return done(err)

            content.data.ticketTypes = _.sortBy(types, function (o) {
              return o.name
            })
            _.each(content.data.ticketTypes, function (type) {
              type.priorities = _.sortBy(type.priorities, ['migrationNum', 'name'])
            })

            return done()
          })
        },
        function (done) {
          var ticketPrioritySchema = require('../models/ticketpriority')
          ticketPrioritySchema.getPriorities(function (err, priorities) {
            if (err) return done(err)

            content.data.priorities = _.sortBy(priorities, ['migrationNum', 'name'])

            return done()
          })
        },
        function (done) {
          var templateSchema = require('../models/template')
          templateSchema.find({}, function (err, templates) {
            if (err) return done(err)

            content.data.mailTemplates = _.sortBy(templates, 'name')

            return done()
          })
        },
        function (done) {
          var tagSchema = require('../models/tag')
          tagSchema.getTagCount(function (err, count) {
            if (err) return done(err)

            content.data.tags = {
              count: count
            }

            return done()
          })
        },
        function (done) {
          roleSchema.getRoles(function (err, roles) {
            if (err) return done(err)
            roleOrderSchema.getOrder(function (err, roleOrder) {
              if (err) return done(err)
              roleOrder = roleOrder.order

              if (_.size(roleOrder) > 0) {
                content.data.roles = _.map(roleOrder, function (roID) {
                  return _.find(roles, { _id: roID })
                })
              } else content.data.roles = roles

              return done()
            })
          })
        }
      ],
      function (err) {
        if (err) return callback(err)
        content.data.settings = s

        return callback(null, content)
      }
    )
  })
}

module.exports = util
