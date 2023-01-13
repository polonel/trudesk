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

const _ = require('lodash')
const async = require('async')
const logger = require('../../../logger')
const apiUtils = require('../apiUtils')
const Models = require('../../../models')
const permissions = require('../../../permissions')
const path = require('path')
const fs = require('fs-extra')
const ticketsV2 = {}

ticketsV2.create = function (req, res) {
  const postTicket = req.body
  if (!postTicket) return apiUtils.sendApiError_InvalidPostData(res)
}

ticketsV2.get = async (req, res) => {
  const query = req.query
  const type = query.type || 'all'

  let limit = 50
  let page = 0

  try {
    limit = query.limit ? parseInt(query.limit) : limit
    page = query.page ? parseInt(query.page) : page
  } catch (e) {
    logger.warn(e)
    return apiUtils.sendApiError_InvalidPostData(res)
  }

  const queryObject = {
    limit,
    page
  }

  try {
    let groups = []
    if (req.user.role.isAdmin || req.user.role.isAgent) {
      const dbGroups = await Models.Department.getDepartmentGroupsOfUser(req.user._id)
      groups = dbGroups.map(g => g._id)
    } else {
      groups = await Models.Group.getAllGroupsOfUser(req.user._id)
    }

    const mappedGroups = groups.map(g => g._id)

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
          logger.warn(error)
        }
        break
    }

    // if (!permissions.canThis(req.user.role, 'tickets:viewall', false)) queryObject.owner = req.user._id
    if (!permissions.canThis(req.user.role, 'tickets:viewall', false)) queryObject.owner = req.user._id

    const tickets = await Models.Ticket.getTicketsWithObject(mappedGroups, queryObject)
    const totalCount = await Models.Ticket.getCountWithObject(mappedGroups, queryObject)

    return apiUtils.sendApiSuccess(res, {
      tickets,
      count: tickets.length,
      totalCount,
      page,
      prevPage: page === 0 ? 0 : page - 1,
      nextPage: page * limit + limit <= totalCount ? page + 1 : page
    })
  } catch (err) {
    logger.warn(err)
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

ticketsV2.single = async function (req, res) {
  const uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')
  Models.Ticket.getTicketByUid(uid, function (err, ticket) {
    if (err) return apiUtils.sendApiError(res, 500, err)

    if (req.user.role.isAdmin || req.user.role.isAgent) {
      Models.Department.getDepartmentGroupsOfUser(req.user._id, function (err, dbGroups) {
        if (err) return apiUtils.sendApiError(res, 500, err)

        const groups = dbGroups.map(function (g) {
          return g._id.toString()
        })

        if (groups.includes(ticket.group._id.toString())) {
          return apiUtils.sendApiSuccess(res, { ticket })
        } else {
          return apiUtils.sendApiError(res, 403, 'Forbidden')
        }
      })
    } else {
      Models.Group.getAllGroupsOfUser(req.user._id, function (err, userGroups) {
        if (err) return apiUtils.sendApiError(res, 500, err)

        const groupIds = userGroups.map(function (m) {
          return m._id.toString()
        })

        if (groupIds.includes(ticket.group._id.toString())) {
          return apiUtils.sendApiSuccess(res, { ticket })
        } else {
          return apiUtils.sendApiError(res, 403, 'Forbidden')
        }
      })
    }
  })
}

ticketsV2.update = function (req, res) {
  const uid = req.params.uid
  const putTicket = req.body.ticket
  if (!uid || !putTicket) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  // todo: complete this...
  Models.Ticket.getTicketByUid(uid, function (err, ticket) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res, ticket)
  })
}

ticketsV2.batchUpdate = function (req, res) {
  const batch = req.body.batch
  if (!_.isArray(batch)) return apiUtils.sendApiError_InvalidPostData(res)

  async.each(
    batch,
    function (batchTicket, next) {
      Models.Ticket.getTicketById(batchTicket.id, function (err, ticket) {
        if (err) return next(err)

        if (!_.isUndefined(batchTicket.status)) {
          ticket.status = batchTicket.status
          const HistoryItem = {
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
  const uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  Models.Ticket.softDeleteUid(uid, function (err, success) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete ticket')
    return apiUtils.sendApiSuccess(res, { deleted: true })
  })
}

ticketsV2.permDelete = function (req, res) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')
  Models.Ticket.findOne({ _id: id }, function (err, ticket) {

    if (err) return apiUtils.sendApiError(res, 400, err.message)
    const savePath = path.join(__dirname, '../../../../public/uploads/tickets', id)
    // const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    if (!fs.existsSync(savePath)) fs.ensureDirSync(savePath)
    if (fs.existsSync(savePath)) fs.emptyDirSync(savePath)
    if (fs.existsSync(savePath)) fs.rmdirSync(savePath)

    Models.Ticket.deleteOne({ _id: id }, function (err, success) {
      if (err) return apiUtils.sendApiError(res, 400, err.message)
      if (!success) return apiUtils.sendApiError(res, 400, 'Unable to delete ticket')

      return apiUtils.sendApiSuccess(res, { deleted: true })
    })
  })
}

ticketsV2.updateChecked = function (req, res) {
  const uid = req.params.uid
  const userId = req.body.userId
  const checked = req.body.checked
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')
  if (checked){
    Models.TCM.findOne({ ticketUid: uid},(err,tcm)=>{
      if (err) return apiUtils.sendApiError(res, 400, err.message)
      if(!tcm.users.includes(userId)){
        Models.TCM.updateMany({ ticketUid: uid }, { $push: { users: userId } }, (err,success)=>{
          if (err) return apiUtils.sendApiError(res, 400, err.message)
          return apiUtils.sendApiSuccess(res)
        })
      }  
    })
    
  } else {
    Models.TCM.updateMany({ ticketUid: uid }, { $pull: { users: userId } }, (err,success)=>{
      if (err) return apiUtils.sendApiError(res, 400, err.message)
      return apiUtils.sendApiSuccess(res)
    })
  }
  
}

ticketsV2.transferToThirdParty = async (req, res) => {
  const uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  try {
    const ticket = await Models.Ticket.findOne({ uid })
    if (!ticket) return apiUtils.sendApiError(res, 400, 'Ticket not found')

    ticket.status = 3
    await ticket.save()

    const request = require('axios')
    const nconf = require('nconf')
    const thirdParty = nconf.get('thirdParty')
    const url = thirdParty.url + '/api/v2/tickets'

    const ticketObj = {
      subject: ticket.subject,
      description: ticket.issue,
      email: ticket.owner.email,
      status: 2,
      priority: 2
    }

    await request.post(url, ticketObj, { auth: { username: thirdParty.apikey, password: '1' } })
    return apiUtils.sendApiSuccess(res)
  } catch (error) {
    return apiUtils.sendApiError(res, 500, error.message)
  }
}

ticketsV2.info = {}
ticketsV2.info.types = async (req, res) => {
  try {
    const ticketTypes = await Models.TicketType.find({})
    const priorities = await Models.Priority.find({})

    return apiUtils.sendApiSuccess(res, { ticketTypes, priorities })
  } catch (err) {
    logger.warn(err)
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

ticketsV2.info.tags = async (req, res) => {
  try {
    const tags = await Models.TicketTags.find({}).sort('normalized')

    return apiUtils.sendApiSuccess(res, { tags })
  } catch (err) {
    logger.warn(err)
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

module.exports = ticketsV2
