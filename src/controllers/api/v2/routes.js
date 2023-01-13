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
  router.post('/api/v2/loginChatwoot', controllers.api.v2.common.loginChatwoot)
  router.post('/api/v2/token', controllers.api.v2.common.token)
  router.get('/api/v2/viewdata', middleware.loadCommonData, controllers.api.v2.common.viewData)
  router.post('/api/v2/loginLDAP', controllers.api.v2.common.loginLDAP) //++ ShaturaPro LIN 24.08.2022
  router.post('/api/v2/pushLDAPGroup', controllers.api.v2.common.pushLDAPGroup) //++ ShaturaPro LIN 24.08.2022

  // Chatwoot
  router.post('/api/v2/requestChatwoot', controllers.api.v2.common.requestChatwoot)
  router.post('/api/v2/unloadingTheDialog', controllers.api.v2.common.unloadingTheDialogChatwoot)
  router.post('/api/v2/sendNotificationChatwoot', controllers.api.v2.common.sendNotificationChatwoot)
  
  // Accounts
  router.get('/api/v2/accounts', apiv2Auth, canUser('accounts:view'), apiv2.accounts.get)
  router.post('/api/v2/accounts', apiv2Auth, canUser('accounts:create'), apiv2.accounts.create)
  // router.post('/api/v2/accountsFromChatwoot', apiv2Auth, apiv2.accounts.create)
  router.put('/api/v2/accounts/profile', apiv2Auth, csrfCheck, apiv2.accounts.saveProfile)
  router.post('/api/v2/accounts/profile/mfa', apiv2Auth, csrfCheck, apiv2.accounts.generateMFA)
  router.post('/api/v2/accounts/profile/mfa/verify', apiv2Auth, csrfCheck, apiv2.accounts.verifyMFA)
  router.post('/api/v2/accounts/profile/mfa/disable', apiv2Auth, csrfCheck, apiv2.accounts.disableMFA)
  router.post('/api/v2/accounts/profile/update-password', apiv2Auth, csrfCheck, apiv2.accounts.updatePassword)
  router.put('/api/v2/accounts/:username', apiv2Auth, canUser('accounts:update'), apiv2.accounts.update)

  // Ticket Info
  router.get('/api/v2/tickets/info/types', apiv2Auth, apiv2.tickets.info.types)

  // Tickets
  router.get('/api/v2/tickets', apiv2Auth, canUser('tickets:view'), apiv2.tickets.get)
  router.post('/api/v2/tickets', apiv2Auth, canUser('tickets:create'), apiv2.tickets.create)
  router.post('/api/v2/tickets/transfer/:uid', apiv2Auth, isAdmin, apiv2.tickets.transferToThirdParty)
  router.get('/api/v2/tickets/:uid', apiv2Auth, canUser('tickets:view'), apiv2.tickets.single)
  router.put('/api/v2/tickets/batch', apiv2Auth, canUser('tickets:update'), apiv2.tickets.batchUpdate)
  router.put('/api/v2/tickets/:uid', apiv2Auth, canUser('tickets:update'), apiv2.tickets.update)
  router.delete('/api/v2/tickets/:uid', apiv2Auth, canUser('tickets:delete'), apiv2.tickets.delete)
  router.delete('/api/v2/tickets/deleted/:id', apiv2Auth, isAdmin, apiv2.tickets.permDelete)
  router.put('/api/v2/tickets/checked/:uid', apiv2Auth, canUser('tickets:view'), apiv2.tickets.updateChecked)
  //TCM
  router.get('/api/v2/tcms', apiv2Auth, canUser('tickets:view'), apiv2.tcms.get)
  // Groups
  router.get('/api/v2/groups', apiv2Auth, apiv2.groups.get)
  router.post('/api/v2/groups', apiv2Auth, canUser('groups:create'), apiv2.groups.create)
  router.put('/api/v2/groups/:id', apiv2Auth, canUser('groups:update'), apiv2.groups.update)
  router.delete('/api/v2/groups/:id', apiv2Auth, canUser('groups:delete'), apiv2.groups.delete)

  // Groups LDAP
  router.get('/api/v2/ldapGroups', apiv2Auth, apiv2.ldapGroups.get)
  router.put('/api/v2/ldapGroups/updateMapping', apiv2Auth, apiv2.ldapGroups.updateMapping)
  // router.post('/api/v2/ldapGroups', apiv2Auth, canUser('ldapGroups:create'), apiv2.ldapGroups.create)
  // router.put('/api/v2/ldapGroups/:id', apiv2Auth, canUser('ldapGroups:update'), apiv2.ldapGroups.update)
  // router.delete('/api/v2/ldapGroups/:id', apiv2Auth, canUser('ldapGroups:delete'), apiv2.ldapGroups.delete)

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

  // ElasticSearch
  router.get('/api/v2/es/search', middleware.api, apiv2.elasticsearch.search)
  router.get('/api/v2/es/rebuild', apiv2Auth, isAdmin, apiv2.elasticsearch.rebuild)
  router.get('/api/v2/es/status', apiv2Auth, isAdmin, apiv2.elasticsearch.status)

  //MailerCheck
  router.get('/api/v2/mailer/check', apiv2Auth, isAdmin, apiv2.mailer.check)

  //LDAP Settings
  router.post('/api/v2/LDAPMapping/check', apiv2Auth, isAdmin, apiv2.accounts.LDAPMapping)

}
