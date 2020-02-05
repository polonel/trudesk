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
 *  Updated:    2/14/19 12:07 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

module.exports = function (middleware, router, controllers) {
  // Shorten Vars
  var apiv2Auth = middleware.apiv2
  var apiv2 = controllers.api.v2
  var isAdmin = middleware.isAdmin
  var isAgent = middleware.isAgent
  var isAgentOrAdmin = middleware.isAgentOrAdmin
  var canUser = middleware.canUser

  // Common
  router.post('/api/v2/login', controllers.api.v2.common.login)
  router.post('/api/v2/token', controllers.api.v2.common.token)

  // Accounts
  router.get('/api/v2/accounts', apiv2Auth, apiv2.accounts.get)
  router.post('/api/v2/accounts', apiv2Auth, apiv2.accounts.create)
  router.put('/api/v2/accounts/:username', apiv2Auth, apiv2.accounts.update)

  // Tickets
  router.get('/api/v2/tickets', apiv2Auth, apiv2.tickets.get)
  router.post('/api/v2/tickets', apiv2Auth, apiv2.tickets.create)
  router.get('/api/v2/tickets/:uid', apiv2Auth, apiv2.tickets.single)
  router.put('/api/v2/tickets/batch', apiv2Auth, apiv2.tickets.batchUpdate)
  router.put('/api/v2/tickets/:uid', apiv2Auth, apiv2.tickets.update)
  router.delete('/api/v2/tickets/:uid', apiv2Auth, apiv2.tickets.delete)
  router.delete('/api/v2/tickets/deleted/:id', apiv2Auth, isAdmin, apiv2.tickets.permDelete)

  // Groups
  router.get('/api/v2/groups', apiv2Auth, apiv2.groups.get)
  router.post('/api/v2/groups', apiv2Auth, apiv2.groups.create)
  router.put('/api/v2/groups/:id', apiv2Auth, apiv2.groups.update)
  router.delete('/api/v2/groups/:id', apiv2Auth, apiv2.groups.delete)

  // Teams
  router.get('/api/v2/teams', apiv2Auth, apiv2.teams.get)
  router.post('/api/v2/teams', apiv2Auth, apiv2.teams.create)
  router.put('/api/v2/teams/:id', apiv2Auth, apiv2.teams.update)
  router.delete('/api/v2/teams/:id', apiv2Auth, apiv2.teams.delete)

  // Departments
  router.get('/api/v2/departments', apiv2Auth, apiv2.departments.get)
  router.post('/api/v2/departments', apiv2Auth, apiv2.departments.create)
  router.put('/api/v2/departments/:id', apiv2Auth, apiv2.departments.update)
  router.delete('/api/v2/departments/:id', apiv2Auth, apiv2.departments.delete)

  router.get('/api/v2/departments/test', middleware.api, apiv2.departments.test)

  // ElasticSearch
  router.get('/api/v2/es/search', middleware.api, apiv2.elasticsearch.search)
  router.get('/api/v2/es/rebuild', apiv2Auth, isAdmin, apiv2.elasticsearch.rebuild)
  router.get('/api/v2/es/status', apiv2Auth, isAdmin, apiv2.elasticsearch.status)

  router.get('/api/v2/mailer/check', apiv2Auth, isAdmin, apiv2.mailer.check)
}
