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
 *  Updated:    2/18/19 5:59 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var packagejson = require('../../../../package')

module.exports = function (middleware, router, controllers) {
  // ShortenVars
  var apiv1 = middleware.api
  var isAdmin = middleware.isAdmin
  var isAgent = middleware.isAgent
  var isAgentOrAdmin = middleware.isAgentOrAdmin
  var canUser = middleware.canUser
  var apiCtrl = controllers.api.v1

  // Common
  router.get('/api', controllers.api.index)
  router.get('/api/v1/version', function (req, res) {
    return res.json({ version: packagejson.version })
  })
  router.post('/api/v1/login', apiCtrl.common.login)
  router.get('/api/v1/login', apiv1, apiCtrl.common.getLoggedInUser)
  router.get('/api/v1/logout', apiv1, apiCtrl.common.logout)

  // Roles
  router.get('/api/v1/roles', apiv1, apiCtrl.roles.get)
  router.post('/api/v1/roles', apiv1, isAdmin, apiCtrl.roles.create)
  router.put('/api/v1/roles/:id', apiv1, isAdmin, apiCtrl.roles.update)
  router.delete('/api/v1/roles/:id', apiv1, isAdmin, apiCtrl.roles.delete)

  // Tickets
  router.get('/api/v1/tickets', apiv1, canUser('tickets:view'), apiCtrl.tickets.get)
  router.get('/api/v1/tickets/group/:id', apiv1, isAdmin, canUser('tickets:view'), apiCtrl.tickets.getByGroup)
  router.get('/api/v1/tickets/search', apiv1, canUser('tickets:view'), apiCtrl.tickets.search)
  router.post('/api/v1/tickets/create', apiv1, canUser('tickets:create'), apiCtrl.tickets.create)
  router.get('/api/v1/tickets/type/:id', apiv1, apiCtrl.tickets.getType)
  router.post('/api/v1/tickets/type/:id/removepriority', apiv1, isAdmin, apiCtrl.tickets.typeRemovePriority)
  router.post('/api/v1/tickets/type/:id/addpriority', apiv1, isAdmin, apiCtrl.tickets.typeAddPriority)
  router.get('/api/v1/tickets/types', apiv1, apiCtrl.tickets.getTypes)
  router.post('/api/v1/tickets/types/create', apiv1, isAdmin, apiCtrl.tickets.createType)
  router.put('/api/v1/tickets/types/:id', apiv1, isAdmin, apiCtrl.tickets.updateType)
  router.delete('/api/v1/tickets/types/:id', apiv1, isAdmin, apiCtrl.tickets.deleteType)
  router.post('/api/v1/tickets/priority/create', apiv1, isAdmin, apiCtrl.tickets.createPriority)
  router.post('/api/v1/tickets/priority/:id/delete', apiv1, isAdmin, apiCtrl.tickets.deletePriority)
  router.get('/api/v1/tickets/priorities', apiv1, apiCtrl.tickets.getPriorities)
  router.put('/api/v1/tickets/priority/:id', apiv1, isAdmin, apiCtrl.tickets.updatePriority)

  router.get('/api/v1/tickets/overdue', apiv1, canUser('tickets:view'), apiCtrl.tickets.getOverdue)
  router.post('/api/v1/tickets/addcomment', apiv1, canUser('comments:create'), apiCtrl.tickets.postComment)
  router.post('/api/v1/tickets/addnote', apiv1, canUser('tickets:notes'), apiCtrl.tickets.postInternalNote)
  router.get('/api/v1/tickets/tags', apiv1, apiCtrl.tickets.getTags)
  router.get('/api/v1/tickets/count/tags', apiv1, apiCtrl.tickets.getTagCount)
  router.get('/api/v1/tickets/count/tags/:timespan', apiv1, apiCtrl.tickets.getTagCount)
  router.get('/api/v1/tickets/count/days', apiv1, apiCtrl.tickets.getTicketStats)
  router.get('/api/v1/tickets/count/days/:timespan', apiv1, apiCtrl.tickets.getTicketStats)
  router.get('/api/v1/tickets/count/topgroups', apiv1, apiCtrl.tickets.getTopTicketGroups)
  router.get('/api/v1/tickets/count/topgroups/:top', apiv1, apiCtrl.tickets.getTopTicketGroups)
  router.get('/api/v1/tickets/count/topgroups/:timespan/:top', apiv1, apiCtrl.tickets.getTopTicketGroups)
  router.get(
    '/api/v1/tickets/count/group/:id',
    apiv1,
    isAgentOrAdmin,
    canUser('tickets:view'),
    apiCtrl.tickets.getCountByGroup
  )
  router.get('/api/v1/tickets/stats', apiv1, apiCtrl.tickets.getTicketStats)
  router.get('/api/v1/tickets/stats/group/:group', apiv1, apiCtrl.tickets.getTicketStatsForGroup)
  router.get('/api/v1/tickets/stats/user/:user', apiv1, apiCtrl.tickets.getTicketStatsForUser)
  router.get('/api/v1/tickets/stats/:timespan', apiv1, apiCtrl.tickets.getTicketStats)
  router.get('/api/v1/tickets/deleted', apiv1, isAdmin, apiCtrl.tickets.getDeletedTickets)
  router.post('/api/v1/tickets/deleted/restore', apiv1, isAdmin, apiCtrl.tickets.restoreDeleted)
  router.get('/api/v1/tickets/:uid', apiv1, canUser('tickets:view'), apiCtrl.tickets.single)
  router.put('/api/v1/tickets/:id', apiv1, canUser('tickets:update'), apiCtrl.tickets.update)
  router.delete('/api/v1/tickets/:id', apiv1, canUser('tickets:delete'), apiCtrl.tickets.delete)
  router.put('/api/v1/tickets/:id/subscribe', apiv1, apiCtrl.tickets.subscribe)
  router.delete(
    '/api/v1/tickets/:tid/attachments/remove/:aid',
    canUser('tickets:update'),
    apiv1,
    apiCtrl.tickets.removeAttachment
  )

  // Tags
  router.get('/api/v1/count/tags', middleware.api, function (req, res) {
    var tagSchema = require('../models/tag')
    tagSchema.countDocuments({}, function (err, count) {
      if (err) return res.status(500).json({ success: false, error: err })

      return res.json({ success: true, count: count })
    })
  })

  router.post('/api/v1/tags/create', apiv1, apiCtrl.tags.createTag)
  router.get('/api/v1/tags/limit', apiv1, apiCtrl.tags.getTagsWithLimit)
  router.put('/api/v1/tags/:id', apiv1, isAgentOrAdmin, apiCtrl.tags.updateTag)
  router.delete('/api/v1/tags/:id', apiv1, isAgentOrAdmin, apiCtrl.tags.deleteTag)

  // Public Tickets
  var checkCaptcha = middleware.checkCaptcha
  var checkOrigin = middleware.checkOrigin

  router.post('/api/v1/public/users/checkemail', checkCaptcha, checkOrigin, apiCtrl.users.checkEmail)
  router.post('/api/v1/public/tickets/create', checkCaptcha, checkOrigin, apiCtrl.tickets.createPublicTicket)
  router.post('/api/v1/public/account/create', checkCaptcha, checkOrigin, apiCtrl.users.createPublicAccount)

  // Groups
  router.get('/api/v1/groups', apiv1, apiCtrl.groups.get)
  router.get('/api/v1/groups/all', apiv1, canUser('groups:view'), apiCtrl.groups.getAll)
  router.post('/api/v1/groups/create', apiv1, canUser('groups:create'), apiCtrl.groups.create)
  router.get('/api/v1/groups/:id', apiv1, apiCtrl.groups.getSingleGroup)
  router.put('/api/v1/groups/:id', apiv1, canUser('groups:update'), apiCtrl.groups.updateGroup)
  router.delete('/api/v1/groups/:id', apiv1, canUser('groups:delete'), apiCtrl.groups.deleteGroup)

  // Users
  router.get('/api/v1/users', apiv1, canUser('accounts:view'), apiCtrl.users.getWithLimit)
  router.post('/api/v1/users/create', apiv1, canUser('accounts:create'), apiCtrl.users.create)
  router.get('/api/v1/users/notifications', apiv1, apiCtrl.users.getNotifications)
  router.get('/api/v1/users/notificationCount', apiv1, apiCtrl.users.notificationCount)
  router.get('/api/v1/users/getassignees', apiv1, isAgentOrAdmin, apiCtrl.users.getAssingees)
  router.get('/api/v1/users/:username', apiv1, canUser('accounts:view'), apiCtrl.users.single)
  router.put('/api/v1/users/:username', apiv1, canUser('accounts:update'), apiCtrl.users.update)
  router.get('/api/v1/users/:username/groups', apiv1, apiCtrl.users.getGroups)
  router.post('/api/v1/users/:username/uploadprofilepic', apiv1, apiCtrl.users.uploadProfilePic)
  router.put('/api/v1/users/:username/updatepreferences', apiv1, apiCtrl.users.updatePreferences)
  router.get('/api/v1/users/:username/enable', apiv1, canUser('accounts:update'), apiCtrl.users.enableUser)
  router.delete('/api/v1/users/:username', apiv1, canUser('accounts:delete'), apiCtrl.users.deleteUser)
  router.post('/api/v1/users/:id/generateapikey', apiv1, apiCtrl.users.generateApiKey)
  router.post('/api/v1/users/:id/removeapikey', apiv1, apiCtrl.users.removeApiKey)
  router.post('/api/v1/users/:id/generatel2auth', apiv1, apiCtrl.users.generateL2Auth)
  router.post('/api/v1/users/:id/removel2auth', apiv1, apiCtrl.users.removeL2Auth)

  // Messages
  router.get('/api/v1/messages', apiv1, apiCtrl.messages.get)
  router.post('/api/v1/messages/conversation/start', apiv1, apiCtrl.messages.startConversation)
  router.get('/api/v1/messages/conversation/:id', apiv1, apiCtrl.messages.getMessagesForConversation)
  router.delete('/api/v1/messages/conversation/:id', apiv1, apiCtrl.messages.deleteConversation)
  router.get('/api/v1/messages/conversations', apiv1, apiCtrl.messages.getConversations)
  router.get('/api/v1/messages/conversations/recent', apiv1, apiCtrl.messages.getRecentConversations)
  router.post('/api/v1/messages/send', apiv1, apiCtrl.messages.send)

  // Notices
  router.post('/api/v1/notices/create', apiv1, canUser('notices:create'), apiCtrl.notices.create)
  router.get('/api/v1/notices/clearactive', apiv1, canUser('notices:deactivate'), apiCtrl.notices.clearActive)
  router.put('/api/v1/notices/:id', apiv1, canUser('notices:update'), apiCtrl.notices.updateNotice)
  router.delete('/api/v1/notices/:id', apiv1, canUser('notices:delete'), apiCtrl.notices.deleteNotice)

  // Reports Generator
  var reportsGenCtrl = apiCtrl.reports.generate
  var genBaseUrl = '/api/v1/reports/generate/'
  router.post(genBaseUrl + 'tickets_by_group', apiv1, canUser('reports:create'), reportsGenCtrl.ticketsByGroup)
  router.post(genBaseUrl + 'tickets_by_status', apiv1, canUser('reports:create'), reportsGenCtrl.ticketsByStatus)
  router.post(genBaseUrl + 'tickets_by_priority', apiv1, canUser('reports:create'), reportsGenCtrl.ticketsByPriority)
  router.post(genBaseUrl + 'tickets_by_tags', apiv1, canUser('reports:create'), reportsGenCtrl.ticketsByTags)
  router.post(genBaseUrl + 'tickets_by_type', apiv1, canUser('reports:create'), reportsGenCtrl.ticketsByType)
  router.post(genBaseUrl + 'tickets_by_user', apiv1, canUser('reports:create'), reportsGenCtrl.ticketsByUser)
  router.post(genBaseUrl + 'tickets_by_assignee', apiv1, canUser('reports:create'), reportsGenCtrl.ticketsByAssignee)
  router.post(genBaseUrl + 'tickets_by_team', apiv1, canUser('reports:create'), reportsGenCtrl.ticketsByTeam)

  // Settings
  router.get('/api/v1/settings', apiv1, apiCtrl.settings.getSettings)
  router.put('/api/v1/settings', apiv1, isAdmin, apiCtrl.settings.updateSetting)
  router.post('/api/v1/settings/testmailer', apiv1, isAdmin, apiCtrl.settings.testMailer)
  router.put('/api/v1/settings/mailer/template/:id', apiv1, isAdmin, apiCtrl.settings.updateTemplateSubject)
  router.get('/api/v1/settings/buildsass', apiv1, isAdmin, apiCtrl.settings.buildsass)
  router.put('/api/v1/settings/updateroleorder', isAdmin, apiv1, apiCtrl.settings.updateRoleOrder)

  // Backups
  router.get('/api/v1/backups', apiv1, isAdmin, controllers.backuprestore.getBackups)
  router.post('/api/v1/backup', apiv1, isAdmin, controllers.backuprestore.runBackup)
  router.delete('/api/v1/backup/:backup', apiv1, isAdmin, controllers.backuprestore.deleteBackup)
  router.post('/api/v1/backup/restore', apiv1, isAdmin, controllers.backuprestore.restoreBackup)
  router.post('/api/v1/backup/upload', apiv1, isAdmin, controllers.backuprestore.uploadBackup)
  router.get('/api/v1/backup/hastools', apiv1, isAdmin, controllers.backuprestore.hasBackupTools)

  // Editor

  router.get('/api/v1/editor/load/:id', apiv1, isAdmin, controllers.editor.load)
  router.post('/api/v1/editor/save', apiv1, isAdmin, controllers.editor.save)
  router.get('/api/v1/editor/assets', apiv1, isAdmin, controllers.editor.getAssets)
  router.post('/api/v1/editor/assets/remove', apiv1, isAdmin, controllers.editor.removeAsset)
  router.post('/api/v1/editor/assets/upload', apiv1, isAdmin, controllers.editor.assetsUpload)
}
