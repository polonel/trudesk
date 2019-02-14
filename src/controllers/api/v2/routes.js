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
  // Common
  router.post('/api/v2/login', controllers.api.v2.common.login)
  router.get('/api/v2/token', controllers.api.v2.common.token)

  // Tickets
  router.get('/api/v2/tickets', middleware.apiv2, controllers.api.v2.tickets.get)
  router.get('/api/v2/tickets/:uid', middleware.apiv2, controllers.api.v2.tickets.single)
}
