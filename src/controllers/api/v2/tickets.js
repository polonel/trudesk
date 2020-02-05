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

var _ = require('lodash')
var async = require('async')
var winston = require('winston')
var apiUtils = require('../apiUtils')
var Ticket = require('../../../models/ticket')
var Group = require('../../../models/group')
var Department = require('../../../models/department')

var ticketsV2 = {}

ticketsV2.create = function (req, res) {
  var postTicket = req.body
  if (!postTicket) return apiUtils.sendApiError_InvalidPostData(res)
}

ticketsV2.get = function (req, res) {
  var query = req.query
  var type = query.type || 'all'

  try {
    var limit = query.limit ? parseInt(query.limit) : 50
    var page = query.page ? parseInt(query.page) : 0
  } catch (e) {
    winston.debug(e)
    return apiUtils.sendApiError_InvalidPostData(res)
  }

  var queryObject = {
    limit: limit,
    page: page
  }

  async.waterfall(
    [
      function (next) {
        if (req.user.role.isAdmin || req.user.role.isAgent) {
          Department.getDepartmentGroupsOfUser(req.user._id, function (err, dbGroups) {
            if (err) return next(err)

            var groups = dbGroups.map(function (g) {
              return g._id
            })

            return next(null, groups)
          })
        } else {
          Group.getAllGroupsOfUser(req.user._id, next)
        }
      },
      function (groups, next) {
        var mappedGroups = groups.map(function (g) {
          return g._id
        })

        switch (type.toLowerCase()) {
          case 'active':
            queryObject.status = [0, 1, 2]
            break
          case 'assigned':
            queryObject.filter = {
              assignee: [req.user._id]
            }
            break
          case 'unassigned':
            queryObject.unassigned = true
            break
          case 'new':
            queryObject.status = [0]
            break
          case 'open':
            queryObject.status = [1]
            break
          case 'pending':
            queryObject.status = [2]
            break
          case 'closed':
            queryObject.status = [3]
            break
          case 'filter':
            try {
              queryObject.filter = JSON.parse(query.filter)
              queryObject.status = queryObject.filter.status
            } catch (error) {
              winston.warn(error)
            }
            break
        }

        Ticket.getTicketsWithObject(mappedGroups, queryObject, function (err, tickets) {
          if (err) return next(err)
          return next(null, mappedGroups, tickets)
        })
      },
      function (mappedGroups, tickets, done) {
        Ticket.getCountWithObject(mappedGroups, queryObject, function (err, count) {
          if (err) return done(err)

          return done(null, {
            tickets: tickets,
            totalCount: count
          })
        })
      }
    ],
    function (err, resultObject) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      return apiUtils.sendApiSuccess(res, {
        tickets: resultObject.tickets,
        count: resultObject.tickets.length,
        totalCount: resultObject.totalCount,
        page: page,
        prevPage: page === 0 ? 0 : page - 1,
        nextPage: page * limit + limit <= resultObject.totalCount ? page + 1 : page
      })
    }
  )
}

ticketsV2.single = function (req, res) {
  var uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')
  Ticket.getTicketByUid(uid, function (err, ticket) {
    if (err) return apiUtils.sendApiError(res, 500, err)

    return apiUtils.sendApiSuccess(res, { ticket: ticket })
  })
}

ticketsV2.update = function (req, res) {
  var uid = req.params.uid
  var putTicket = req.body.ticket
  if (!uid || !putTicket) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  // todo: complete this...
  Ticket.getTicketByUid(uid, function (err, ticket) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res, ticket)
  })
}

ticketsV2.batchUpdate = function (req, res) {
  var batch = req.body.batch
  if (!_.isArray(batch)) return apiUtils.sendApiError_InvalidPostData(res)

  async.each(
    batch,
    function (batchTicket, next) {
      Ticket.getTicketById(batchTicket.id, function (err, ticket) {
        if (err) return next(err)

        if (!_.isUndefined(batchTicket.status)) {
          ticket.status = batchTicket.status
          var HistoryItem = {
            action: 'ticket:set:status',
            description: 'status set to: ' + batchTicket.status,
            owner: req.user._id
          }

          ticket.history.push(HistoryItem)
        }

        return ticket.save(next)
      })
    },
    function (err) {
      if (err) return apiUtils.sendApiError(res, 400, err.message)

      return apiUtils.sendApiSuccess(res)
    }
  )
}

ticketsV2.delete = function (req, res) {
  var uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  Ticket.softDeleteUid(uid, function (err, success) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete ticket')

    return apiUtils.sendApiSuccess(res, { deleted: true })
  })
}

ticketsV2.permDelete = function (req, res) {
  var id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  Ticket.deleteOne({ _id: id }, function (err, success) {
    if (err) return apiUtils.sendApiError(res, 400, err.message)
    if (!success) return apiUtils.sendApiError(res, 400, 'Unable to delete ticket')

    return apiUtils.sendApiSuccess(res, { deleted: true })
  })
}

module.exports = ticketsV2
