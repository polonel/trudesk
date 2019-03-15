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

  // Common
  router.post('/api/v2/login', controllers.api.v2.common.login)
  router.post('/api/v2/token', controllers.api.v2.common.token)

  // Tickets
  router.get('/api/v2/tickets', apiv2Auth, apiv2.tickets.get)
  router.post('/api/v2/tickets', apiv2Auth, apiv2.tickets.create)
  router.get('/api/v2/tickets/:uid', apiv2Auth, apiv2.tickets.single)
  router.put('/api/v2/tickets/:uid', apiv2Auth, apiv2.tickets.update)
  router.delete('/api/v2/tickets/:uid', apiv2Auth, apiv2.tickets.delete)

  // Teams
  router.get('/api/v2/teams', apiv2Auth, apiv2.teams.get)
}
