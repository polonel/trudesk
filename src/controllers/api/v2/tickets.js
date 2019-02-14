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
 *  Updated:    2/14/19 12:05 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var apiUtils = require('../apiUtils')
var Ticket = require('../../../models/ticket')

var ticketsV2 = {}

ticketsV2.get = function (req, res) {
  var query = req.query
  var limit = query.limit || 100

  var queryObject = {
    limit: limit
  }

  Ticket.getTicketsWithObject(req.user.groups, queryObject, function (err, tickets) {
    if (err) return apiUtils.sendApiError(res, 500, err)
    apiUtils.sendApiSuccess(res, { tickets: tickets, count: tickets.length })
  })
}

ticketsV2.single = function (req, res) {
  var uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')
  Ticket.getTicketByUid(uid, function (err, ticket) {
    if (err) return apiUtils.sendApiError(res, 500, err)

    return apiUtils.sendApiSuccess(res, { ticket: ticket })
  })
}

module.exports = ticketsV2
