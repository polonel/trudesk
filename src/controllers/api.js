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

// Sub APIs
var apiTicketsV1 = require('./api/v1/tickets')
var apiTagsV1 = require('./api/v1/tags')
var apiNoticesV1 = require('./api/v1/notices')
var apiUsersV1 = require('./api/v1/users')
var apiMessagesV1 = require('./api/v1/messages')
var apiGroupsV1 = require('./api/v1/groups')
var apiReportsV1 = require('./api/v1/reports')
var apiSettingsV1 = require('./api/v1/settings')
var apiPluginsV1 = require('./api/v1/plugins')

var apiController = {}

apiController.index = function (req, res) {
  return res.json({ supported: ['v1', 'v2'] })
}

apiController.v1 = {}
apiController.v1.common = require('./api/v1/common')
apiController.v1.tickets = apiTicketsV1
apiController.v1.tags = apiTagsV1
apiController.v1.notices = apiNoticesV1
apiController.v1.users = apiUsersV1
apiController.v1.messages = apiMessagesV1
apiController.v1.groups = apiGroupsV1
apiController.v1.reports = apiReportsV1
apiController.v1.settings = apiSettingsV1
apiController.v1.plugins = apiPluginsV1
apiController.v1.roles = require('./api/v1/roles')

apiController.v2 = {}
apiController.v2.common = require('./api/v2/common')
apiController.v2.tickets = require('./api/v2/tickets')
apiController.v2.teams = require('./api/v2/teams')

module.exports = apiController
