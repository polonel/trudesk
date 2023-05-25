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
 *  Updated:    5/17/22 2:15 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

module.exports = function (middleware, router, controllers) {
  // Shorten Vars
  const apiv2Auth = middleware.apiv2
  const apiv2 = controllers.api.v2
  const isAdmin = middleware.isAdmin
  const isAgent = middleware.isAgent
  const isAgentOrAdmin = middleware.isAgentOrAdmin
  const csrfCheck = middleware.csrfCheck
  const canUser = middleware.canUser

  // Common
  router.get('/api/v2/login', apiv2Auth, apiv2.accounts.sessionUser)
  router.post('/api/v2/login', controllers.api.v2.common.login)
  router.get('/api/v2/logout', controllers.api.v2.common.logout)
  router.post('/api/v2/token', controllers.api.v2.common.token)
  router.get('/api/v2/viewdata', middleware.loadCommonData, controllers.api.v2.common.viewData)
  router.get('/api/v2/about/stats', apiv2Auth, controllers.api.v2.common.aboutStats)
  router.get('/api/v2/releases', controllers.api.v2.common.getReleases)

  // Accounts
  router.get('/api/v2/accounts', apiv2Auth, canUser('accounts:view'), apiv2.accounts.get)
  router.post('/api/v2/accounts', apiv2Auth, canUser('accounts:create'), apiv2.accounts.create)
  router.put('/api/v2/accounts/profile', apiv2Auth, csrfCheck, apiv2.accounts.saveProfile)
  router.post('/api/v2/accounts/profile/mfa', apiv2Auth, csrfCheck, apiv2.accounts.generateMFA)
  router.post('/api/v2/accounts/profile/mfa/verify', apiv2Auth, csrfCheck, apiv2.accounts.verifyMFA)
  router.post('/api/v2/accounts/profile/mfa/disable', apiv2Auth, csrfCheck, apiv2.accounts.disableMFA)
  router.post('/api/v2/accounts/profile/update-password', apiv2Auth, csrfCheck, apiv2.accounts.updatePassword)
  router.put('/api/v2/accounts/:username', apiv2Auth, canUser('accounts:update'), apiv2.accounts.update)

  // Account Roles
  router.get('/api/v2/roles', apiv2Auth, apiv2.accounts.getRoles)
  router.post('/api/v2/roles', apiv2Auth, isAdmin, apiv2.roles.create)
  router.put('/api/v2/roles/order', apiv2Auth, isAdmin, apiv2.roles.updateOrder)
  router.put('/api/v2/roles/:id', apiv2Auth, isAdmin, apiv2.roles.update)
  router.delete('/api/v2/roles/:id', apiv2Auth, isAdmin, apiv2.roles.delete)

  // Ticket Info
  router.get('/api/v2/tickets/info/types', apiv2Auth, apiv2.tickets.info.types)

  // Types
  router.post('/api/v2/tickets/types/create', apiv2Auth, isAdmin, apiv2.tickets.types.create)
  router.put('/api/v2/tickets/types/:id', apiv2Auth, isAdmin, apiv2.tickets.types.update)
  router.delete('/api/v2/tickets/types/:id', apiv2Auth, isAdmin, apiv2.tickets.types.delete)
  router.post('/api/v2/tickets/types/:id/addpriority', apiv2Auth, isAdmin, apiv2.tickets.types.addPriority)
  router.post('/api/v2/tickets/types/:id/removepriority', apiv2Auth, isAdmin, apiv2.tickets.types.removePriority)

  // Priorities
  router.post('/api/v2/tickets/priority', apiv2Auth, isAgentOrAdmin, apiv2.tickets.priority.create)
  router.put('/api/v2/tickets/priority/:id', apiv2Auth, isAgentOrAdmin, apiv2.tickets.priority.update)
  router.post('/api/v2/tickets/priority/:id/delete', apiv2Auth, isAgentOrAdmin, apiv2.tickets.priority.delete)

  // Tickets
  router.get('/api/v2/tickets', apiv2Auth, canUser('tickets:view'), apiv2.tickets.get)
  router.post('/api/v2/tickets', apiv2Auth, canUser('tickets:create'), apiv2.tickets.create)
  router.post('/api/v2/tickets/create', apiv2Auth, canUser('tickets:create'), apiv2.tickets.create)
  router.post('/api/v2/tickets/transfer/:uid', apiv2Auth, isAdmin, apiv2.tickets.transferToThirdParty)
  router.get('/api/v2/tickets/deleted', apiv2Auth, isAdmin, apiv2.tickets.getDeleted)
  router.post('/api/v2/tickets/addcomment', apiv2Auth, canUser('comments:create'), apiv2.tickets.postComment)
  router.post('/api/v2/tickets/addnote', apiv2Auth, canUser('tickets:notes'), apiv2.tickets.postNote)
  router.get('/api/v2/tickets/:uid', apiv2Auth, canUser('tickets:view'), apiv2.tickets.single)
  router.post(
    '/api/v2/tickets/:uid/upload/inline',
    apiv2Auth,
    canUser('comments:create'),
    canUser('comments:update'),
    apiv2.tickets.uploadInline
  )
  router.put('/api/v2/tickets/batch', apiv2Auth, canUser('tickets:update'), apiv2.tickets.batchUpdate)
  router.put('/api/v2/tickets/:uid', apiv2Auth, canUser('tickets:update'), apiv2.tickets.update)
  router.delete('/api/v2/tickets/:id', apiv2Auth, canUser('tickets:delete'), apiv2.tickets.delete)
  router.delete('/api/v2/tickets/deleted/:id', apiv2Auth, isAdmin, apiv2.tickets.permDelete)
  router.get('/api/v2/tickets/stats/tags', apiv2Auth, isAgentOrAdmin, apiv2.tickets.topTags)
  router.get('/api/v2/tickets/stats/tags/:timespan', apiv2Auth, isAgentOrAdmin, apiv2.tickets.topTags)
  router.get('/api/v2/tickets/stats/groups/:timespan/:top', apiv2Auth, isAgentOrAdmin, apiv2.tickets.topGroups)
  router.get('/api/v2/tickets/stats/:timespan', apiv2Auth, isAgentOrAdmin, apiv2.tickets.stats)

  // Tags
  router.post('/api/v2/tags/create', apiv2Auth, apiv2.tags.create)
  router.get('/api/v2/tags/limit', apiv2Auth, apiv2.tags.getTagsWithLimit)
  router.put('/api/v2/tags/:id', apiv2Auth, isAgentOrAdmin, apiv2.tags.updateTag)
  router.delete('/api/v2/tags/:id', apiv2Auth, isAgentOrAdmin, apiv2.tags.deleteTag)

  // Groups
  router.get('/api/v2/groups', apiv2Auth, apiv2.groups.get)
  router.post('/api/v2/groups', apiv2Auth, canUser('groups:create'), apiv2.groups.create)
  router.put('/api/v2/groups/:id', apiv2Auth, canUser('groups:update'), apiv2.groups.update)
  router.delete('/api/v2/groups/:id', apiv2Auth, canUser('groups:delete'), apiv2.groups.delete)

  // Teams
  router.get('/api/v2/teams', apiv2Auth, canUser('teams:view'), apiv2.teams.get)
  router.post('/api/v2/teams', apiv2Auth, canUser('teams:create'), apiv2.teams.create)
  router.put('/api/v2/teams/:id', apiv2Auth, canUser('teams:update'), apiv2.teams.update)
  router.delete('/api/v2/teams/:id', apiv2Auth, canUser('teams:delete'), apiv2.teams.delete)

  // Departments
  router.get('/api/v2/departments', apiv2Auth, canUser('departments:view'), apiv2.departments.get)
  router.post('/api/v2/departments', apiv2Auth, canUser('departments:create'), apiv2.departments.create)
  router.put('/api/v2/departments/:id', apiv2Auth, canUser('departments:update'), apiv2.departments.update)
  router.delete('/api/v2/departments/:id', apiv2Auth, canUser('departments:delete'), apiv2.departments.delete)

  // Notices
  router.get('/api/v2/notices', apiv2Auth, apiv2.notices.get)
  router.post('/api/v2/notices', apiv2Auth, canUser('notices:create'), apiv2.notices.create)
  // router.get('/api/v2/notices/active', apiv2Auth, apiv2.notices.getActive)
  router.put('/api/v2/notices/:id', apiv2Auth, canUser('notices:update'), apiv2.notices.update)
  router.put('/api/v2/notices/:id/activate', apiv2Auth, canUser('notices:activate'), apiv2.notices.activate)
  router.get('/api/v2/notices/clear', apiv2Auth, canUser('notices:deactivate'), apiv2.notices.clear)
  router.delete('/api/v2/notices/:id', apiv2Auth, canUser('notices:delete'), apiv2.notices.delete)

  router.get('/api/v2/messages/conversations', apiv2Auth, apiv2.messages.getConversations)
  router.get('/api/v2/messages/conversations/:id', apiv2Auth, apiv2.messages.single)
  router.delete('/api/v2/messages/conversations/:id', apiv2Auth, apiv2.messages.deleteConversation)

  // Settings
  router.get('/api/v2/settings', apiv2Auth, isAdmin, apiv2.settings.get)
  // router.get('/api/v2/settings/common', apiv2.settings.common)
  router.get('/api/v2/settings/theme', apiv2.settings.theme)
  router.put('/api/v2/settings', apiv2Auth, isAdmin, apiv2.settings.updateBatch)
  // router.put('/api/v2/settings/:id', apiv2Auth, isAdmin, apiv2.settings.update)
  // router.get('/api/v2/backups', apiv2Auth, isAdmin, apiv2.settings.backups)
  // router.post('/api/v2/backups/restore', apiv2Auth, isAdmin, apiv2.settings.restore)

  // Backups
  router.get('/api/v2/backups', apiv2Auth, isAdmin, controllers.backuprestore.getBackups)
  router.post('/api/v2/backup', apiv2Auth, isAdmin, controllers.backuprestore.runBackup)
  router.delete('/api/v2/backup/:backup', apiv2Auth, isAdmin, controllers.backuprestore.deleteBackup)
  router.post('/api/v2/backup/restore', apiv2Auth, isAdmin, controllers.backuprestore.restoreBackup)
  router.post('/api/v2/backup/upload', apiv2Auth, isAdmin, controllers.backuprestore.uploadBackup)
  router.get('/api/v2/backup/hastools', apiv2Auth, isAdmin, controllers.backuprestore.hasBackupTools)

  // ElasticSearch
  router.get('/api/v2/es/search', middleware.api, apiv2.elasticsearch.search)
  router.get('/api/v2/es/rebuild', apiv2Auth, isAdmin, apiv2.elasticsearch.rebuild)
  router.get('/api/v2/es/status', apiv2Auth, isAdmin, apiv2.elasticsearch.status)

  router.get('/api/v2/mailer/check', apiv2Auth, isAdmin, apiv2.mailer.check)

  router.get('/api/v2/*', (req, res) => {
    res.status(404).send('Not Found')
  })
}
