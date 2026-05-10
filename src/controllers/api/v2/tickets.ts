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

import async from 'async'
import _ from 'lodash'
// @ts-ignore
import * as marked from 'marked'
import type { Types } from "mongoose"
import type { Response } from 'express'
import path from "path"
// @ts-ignore
import sanitizeHtml from "sanitize-html"
import xss from 'xss'
import config from "../../../config"
import emitter from '../../../emitter'
import logger from '../../../logger'
import {
  DepartmentModel,
  GroupModel,
  PriorityModel,
  SettingModel,
  TicketModel,
  TicketStatusModel,
  TicketTagModel,
  TicketTypeModel,
  UserModel
} from '../../../models'
import type { IRole } from "../../../models/role"
import type { TicketStatusClass } from "../../../models/ticketStatus"
import permissions from '../../../permissions'
import type { RequestUser } from "../../../types/requestuser"
import apiUtils from '../apiUtils'

export interface TypedRequestBody<T> extends Express.Request {
  body: T
  headers: any
  query: any
  params: any
  user?: RequestUser
  pipe: (dest: any) => any
}

export interface TicketV2ApiModelEndpoint {
  create: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  get: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  update: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  delete: (req: TypedRequestBody<any>, res: Response) => Promise<any>
}

export interface StatusV2ApiModelEndpoint extends TicketV2ApiModelEndpoint {
  order: (req: TypedRequestBody<any>, res: Response) => Promise<any>
}

export interface TicketTypesEndpoint {
  create: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  update: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  delete: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  addPriority: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  removePriority: (req: TypedRequestBody<any>, res: Response) => Promise<any>
}

export interface TicketPriorityEndpoint {
  create: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  update: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  delete: (req: TypedRequestBody<any>, res: Response) => Promise<any>
}

export interface TicketInfoEndpoint {
  types: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  tags: (req: TypedRequestBody<any>, res: Response) => Promise<any>
}

export interface TicketV2Api {
  create: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  get: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  single: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  update: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  batchUpdate: (req: TypedRequestBody<any>, res: Response) => void
  delete: (req: TypedRequestBody<any>, res: Response) => void
  permDelete: (req: TypedRequestBody<any>, res: Response) => void
  postComment: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  postNote: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  uploadInline: (req: TypedRequestBody<any>, res: Response) => void
  transferToThirdParty: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  getDeleted: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  restoreDeleted: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  stats: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  topGroups: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  topTags: (req: TypedRequestBody<any>, res: Response) => Promise<any>
  types: TicketTypesEndpoint
  priority: TicketPriorityEndpoint
  info: TicketInfoEndpoint
  // Temp during conversion
  status: StatusV2ApiModelEndpoint
}

export interface TicketCreateBody {
  subject: string
  issue: string
  owner?: string | Types.ObjectId
  tags?: Array<string | Types.ObjectId>

  socketId?: string
}

export interface TicketQueryObject {
  limit: number
  page: number
  owner?: string | Types.ObjectId
  status?: string | string[] | Types.ObjectId | Types.ObjectId[]
  filter?: any
  unassigned?: boolean
}

const ticketCreate = async (req: TypedRequestBody<TicketCreateBody>, res: Response) => {
  if (!req.user) return apiUtils.sendApiError(res, 403)

  const postTicket = req.body
  if (!postTicket || !postTicket.subject || !postTicket.issue) return apiUtils.sendApiError_InvalidPostData(res)

  const socketId = postTicket.socketId ? postTicket.socketId : ''

  if (!postTicket.tags) {
    postTicket.tags = []
  } else if (!_.isArray(postTicket.tags)) {
    postTicket.tags = [postTicket.tags]
  }

  try {
    const requestUser = req.user as RequestUser
    const user = await UserModel.findOne({_id: requestUser._id})
    if (!user || user.deleted) return apiUtils.sendApiError_InvalidPostData(res)

    const statuses = await TicketStatusModel.getStatuses()
    if (statuses.length < 1) return apiUtils.sendApiError(res, 500, {error: new Error('Invalid Ticket Status')})

    const HistoryItem = {
      action: 'ticket:created',
      description: 'Ticket was created.',
      owner: requestUser._id
    }

    const ticket = new TicketModel(postTicket)
    if (postTicket.owner)
      ticket.owner = postTicket.owner as any
    else
      ticket.owner = requestUser._id as any

    ticket.subject = sanitizeHtml(ticket.subject).trim()
    ticket.status = statuses[0]?._id as any

    let tIssue = ticket.issue
    tIssue = tIssue.replace(/(\r\n|\n\r|\r|\n)/g, '<br>')
    tIssue = sanitizeHtml(tIssue).trim()
    ticket.issue = xss(marked.parse(tIssue) as string)
    ticket.history = [HistoryItem] as any
    ticket.subscribers = [user._id]

    let savedTicket = await ticket.save()
    savedTicket = await savedTicket.populate('group owner priority')

    emitter.emit('ticket:created', {
      hostname: req.headers.host,
      socketId: socketId,
      ticket: savedTicket
    })

    return apiUtils.sendApiSuccess(res, {ticket: savedTicket})
  } catch (e) {
    logger.warn (e)
    return apiUtils.sendApiError(res, 400, e)
  }
}

const ticketsGet = async (req: TypedRequestBody<any>, res: Response) => {
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

  const queryObject: TicketQueryObject = {
    limit,
    page,
  }

  try {
    let groups = []
    const requestUser = req.user as RequestUser
    if (requestUser.role.isAdmin || requestUser.role.isAgent) {
      const dbGroups = await DepartmentModel.getDepartmentGroupsOfUser(requestUser._id)
      groups = dbGroups.map((g) => g?._id)
    } else {
      groups = await GroupModel.getAllGroupsOfUser(requestUser._id)
    }

    const mappedGroups = groups.map((g) => g?._id) 
    const statuses = await TicketStatusModel.find({isResolved: false})

    switch (type.toLowerCase()) {
      case 'active':
        queryObject.status = statuses.map(i => i._id.toString())
        break
      case 'assigned':
        queryObject.filter = {
          assignee: [requestUser._id],
        }
        break
      case 'unassigned':
        queryObject.unassigned = true
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

    if (!permissions.canThis(requestUser.role as IRole, 'tickets:viewall', false)) queryObject.owner = requestUser._id

    const tickets = await TicketModel.getTicketsWithObject(mappedGroups, queryObject)
    const totalCount = await TicketModel.getCountWithObject(mappedGroups, queryObject)

    return apiUtils.sendApiSuccess(res, {
      tickets,
      count: tickets.length,
      totalCount,
      page,
      prevPage: page === 0 ? 0 : page - 1,
      nextPage: page * limit + limit <= totalCount ? page + 1 : page,
    })
  } catch (err: any) {
    logger.warn(err)
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

const ticketsV2: TicketV2Api = {
  create: ticketCreate,
  get: ticketsGet,
  single: undefined as any,
  update: undefined as any,
  batchUpdate: undefined as any,
  delete: undefined as any,
  permDelete: undefined as any,
  postComment: undefined as any,
  postNote: undefined as any,
  uploadInline: undefined as any,
  transferToThirdParty: undefined as any,
  getDeleted: undefined as any,
  restoreDeleted: undefined as any,
  stats: undefined as any,
  topGroups: undefined as any,
  topTags: undefined as any,
  types: undefined as any,
  priority: undefined as any,
  info: undefined as any,
  status: undefined as any,
}

ticketsV2.single = async function (req, res) {
  const requestUser = req.user as RequestUser
  try {
    const uid = req.params.uid
    if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

    return new Promise<void>((resolve) => {
      TicketModel.getTicketByUid(uid, async function (err, ticket) {
        if (err) { apiUtils.sendApiError(res, 500, err); return resolve() }
        if (!ticket) { apiUtils.sendApiError(res, 404, 'Ticket not found'); return resolve() }

        if ((requestUser.role as any).isAdmin || (requestUser.role as any).isAgent) {
          // Tickets with no group are accessible to all agents/admins
          if (!ticket.group) {
            apiUtils.sendApiSuccess(res, { ticket }); return resolve()
          }

          let dbGroups = await DepartmentModel.getDepartmentGroupsOfUser(requestUser._id)
          if (!dbGroups || dbGroups.length === 0) {
            dbGroups = await GroupModel.find({}).lean()
          }

          const groups = dbGroups.map((g) => g?._id.toString())

          if (groups.includes((ticket.group as any)._id.toString())) {
            apiUtils.sendApiSuccess(res, { ticket })
          } else {
            apiUtils.sendApiError(res, 403, 'Forbidden')
          }
          return resolve()
        } else {
          // Tickets with no group: allow if the user is the owner
          if (!ticket.group) {
            const isOwner = (ticket.owner as any)?._id.toString() === requestUser._id.toString()
            isOwner
              ? apiUtils.sendApiSuccess(res, { ticket })
              : apiUtils.sendApiError(res, 403, 'Forbidden')
            return resolve()
          }

          const userGroups = await GroupModel.getAllGroupsOfUser(requestUser._id)

          const groupIds = userGroups.map(function (m) {
            return m._id.toString()
          })

          if (groupIds.includes((ticket.group as any)._id.toString())) {
            apiUtils.sendApiSuccess(res, { ticket })
          } else {
            apiUtils.sendApiError(res, 403, 'Forbidden')
          }
          return resolve()
        }
      })
    })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.update = async function (req, res) {
  const uid = req.params.uid
  const putTicket = req.body.ticket
  if (!uid || !putTicket) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  try {
    let ticket = await TicketModel.getTicketByUid(uid)
    if (!ticket) return apiUtils.sendApiError(res, 404, 'Ticket not found')

    const requestUser = req.user as RequestUser
    const historyItems: { action: string; description: string; owner: any }[] = []

    if (putTicket.status !== undefined) {
      ticket.status = putTicket.status
      historyItems.push({ action: 'ticket:set:status', description: 'Status updated', owner: requestUser?._id })
    }
    if (putTicket.type !== undefined) {
      ticket.type = putTicket.type
      historyItems.push({ action: 'ticket:set:type', description: 'Type updated', owner: requestUser?._id })
    }
    if (putTicket.priority !== undefined) {
      ticket.priority = putTicket.priority
      historyItems.push({ action: 'ticket:set:priority', description: 'Priority updated', owner: requestUser?._id })
    }
    if (putTicket.group !== undefined) {
      ticket.group = putTicket.group || undefined
      historyItems.push({ action: 'ticket:set:group', description: 'Group updated', owner: requestUser?._id })
    }
    if (putTicket.assignee !== undefined) {
      ticket.assignee = putTicket.assignee || undefined
      historyItems.push({ action: 'ticket:set:assignee', description: 'Assignee updated', owner: requestUser?._id })
    }

    ticket.updated = Date.now()
    for (const h of historyItems) ticket.history.push(h)

    await ticket.save()
    ticket = await TicketModel.getTicketByUid(uid)

    emitter.emit('ticket:updated', ticket)
    if (global.io) global.io.sockets.emit('$trudesk:tickets:update', ticket)

    return apiUtils.sendApiSuccess(res, { ticket })
  } catch (e) {
    return apiUtils.sendApiError(res, 400, e)
  }
}

ticketsV2.batchUpdate = function (req, res) {
  const batch = req.body.batch
  if (!_.isArray(batch)) return apiUtils.sendApiError_InvalidPostData(res)

  const requestUser = req.user as RequestUser

  async.each(
    batch,
    async function (batchTicket: any) {
      const ticket = await TicketModel.getTicketById(batchTicket.id)

      if (!_.isUndefined(batchTicket.status)) {
        ticket.status = batchTicket.status
        const HistoryItem = {
          action: 'ticket:set:status',
          description: 'status set to: ' + batchTicket.status,
          owner: requestUser?._id,
        }

        ticket.history.push(HistoryItem)
      }

      return ticket.save()
    },
    function (err: any) {
      if (err) return apiUtils.sendApiError(res, 400, err)

      return apiUtils.sendApiSuccess(res)
    }
  )

  return undefined
}

ticketsV2.delete = function (req, res) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  TicketModel.softDelete(id, (err: any, success: any) => {
    if (err) return apiUtils.sendApiError(res, 500, err)
    if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete ticket')

    return apiUtils.sendApiSuccess(res, {deleted: true})
  })

  return undefined
}

ticketsV2.permDelete = function (req, res) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  TicketModel.deleteOne({ _id: id }).then(success => {
    if (!success) return apiUtils.sendApiError(res, 400, 'Unable to delete ticket')
    return apiUtils.sendApiSuccess(res, { deleted: true })
  }).catch((err: any) => {
    return apiUtils.sendApiError(res, 400, err)
  })

  return undefined
}

ticketsV2.postComment = async (req, res) => {
  const commentJson = req.body
  if (!commentJson) return apiUtils.sendApiError_InvalidPostData(res)

  const requestUser = req.user as RequestUser
  let comment = commentJson.comment
  const owner = commentJson.ownerId || requestUser?._id
  const ticketId = commentJson._id

  if (!ticketId || !comment || !owner) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    let ticket = await TicketModel.getTicketById(ticketId)
    if (!ticket) return apiUtils.sendApiError_InvalidPostData(res)

    const marked = require('marked')
    marked.setOptions({
      breaks: true
    })

    comment = sanitizeHtml(comment).trim()

    const Comment = {
      owner,
      date: new Date(),
      comment: xss(marked.parse(comment) as string)
    }

    ticket.updated = Date.now()
    ticket.comments.push(Comment)
    const HistoryItem = {
      action: 'ticket:comment:added',
      description: 'Comment was added',
      owner
    }

    ticket.history.push(HistoryItem)

    ticket = await ticket.save()

    if (!permissions.canThis(requestUser?.role as any, 'tickets:notes'))
      ticket.notes = []

    emitter.emit('ticket:comment:added', ticket, Comment, req.headers.host)

    return apiUtils.sendApiSuccess(res, { ticket})

  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.postNote = async (req, res) => {
  const payload = req.body
  if (!payload.ticketid || !payload.note) return apiUtils.sendApiError_InvalidPostData(res)
  try {
    const requestUser = req.user as RequestUser
    let ticket = await TicketModel.getTicketById(payload.ticketid)
    if (!ticket) return apiUtils.sendApiError_InvalidPostData(res)

    const Note = {
      owner: payload.owner || requestUser?._id,
      date: new Date(),
      note: xss(marked.parse(payload.note) as string),
    }

    ticket.updated = Date.now()
    ticket.notes.push(Note)
    const HistoryItem = {
      action: 'ticket:note:added',
      description: 'Internal note was added',
      owner: payload.owner || requestUser?._id,
    }

    ticket.history.push(HistoryItem)

    ticket = await ticket.save()
    ticket = await TicketModel.populate(ticket, 'subscribers notes.owner history.owner')

    emitter.emit('ticket:note:added', ticket, Note)

    return apiUtils.sendApiSuccess(res, { ticket })
  } catch (e) {
    console.log(e)
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.uploadInline = function (req, res) {
  const Chance = require('Chance')
  const chance = new Chance()
  const fs = require('fs-extra')
  const Busboy = require('busboy')
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: 5 * 1024 * 1024 // 5mb
    }
  })

  const object: { ticketId?: string; filePath?: string; filename?: string; mimetype?: string } = {}
  let error: { status: number; message: string } | undefined

  const rawTicketId = req.headers.ticketid
  if (!rawTicketId) return res.status(400).json({ success: false })
  object.ticketId = Array.isArray(rawTicketId) ? rawTicketId[0] : rawTicketId

  busboy.on('file', function (_name: any, file: any, info: any) {
    const filename = info.filename
    const mimetype = info.mimeType
    if (mimetype.indexOf('image/') === -1) {
      error = {
        status: 500,
        message: 'Invalid File Type',
      }

      return file.resume()
    }

    const ext = path.extname(filename)
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.jpe',
      '.jif',
      '.jfif',
      '.jfi',
      '.png',
      '.gif',
      '.webp',
      '.tiff',
      '.tif',
      '.bmp',
      '.dib',
      '.heif',
      '.heic',
    ]

    if (!allowedExtensions.includes(ext.toLocaleLowerCase())) {
      error = {
        status: 400,
        message: 'Invalid File Type',
      }

      return file.resume()
    }

    object.ticketId = (object.ticketId ?? '').replace('..', '')
    
    const savePath = path.resolve(config.trudeskRoot(), 'public/uploads/tickets', object.ticketId)
    // const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const sanitizedFilename = chance.hash({ length: 20 }) + ext
    if (!fs.existsSync(savePath)) fs.ensureDirSync(savePath)

    object.filePath = path.join(savePath, 'inline_' + sanitizedFilename)
    object.filename = sanitizedFilename
    object.mimetype = mimetype

    if (fs.existsSync(object.filePath)) {
      error = {
        status: 500,
        message: 'File already exists',
      }

      return file.resume()
    }

    file.on('limit', function () {
      error = {
        status: 500,
        message: 'File too large',
      }

      // Delete the temp file
      if (fs.existsSync(object.filePath)) fs.unlinkSync(object.filePath)

      return file.resume()
    })

    file.pipe(fs.createWriteStream(object.filePath))
  })

  busboy.on('finish', function () {
    if (error) return res.status(error.status).send(error.message)

    if (_.isUndefined(object.ticketId) || _.isUndefined(object.filename) || _.isUndefined(object.filePath)) {
      return res.status(400).send('Invalid Form Data')
    }

    // Everything Checks out lets make sure the file exists and then add it to the attachments array
    if (!fs.existsSync(object.filePath)) return res.status(500).send('File Failed to Save to Disk')

    const fileUrl = '/uploads/tickets/' + object.ticketId + '/inline_' + object.filename

    return res.json({ filename: fileUrl, ticketId: object.ticketId })
  })

  req.pipe(busboy)
  return undefined
}

ticketsV2.transferToThirdParty = async (req, res) => {
  const uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  try {
    const ticket = await TicketModel.findOne({ uid })
    if (!ticket) return apiUtils.sendApiError(res, 400, 'Ticket not found')

    ticket.status = 3 as any
    await ticket.save()

    const request = require('axios')
    const nconf = require('nconf')
    const thirdParty = nconf.get('thirdParty')
    const url = thirdParty.url + '/api/v2/tickets'

    const ticketObj = {
      subject: ticket.subject,
      description: ticket.issue,
      email: (ticket.owner as any)?.email,
      status: 2,
      priority: 2,
    }

    await request.post(url, ticketObj, { auth: { username: thirdParty.apikey, password: '1' } })
    return apiUtils.sendApiSuccess(res)
  } catch (error) {
    return apiUtils.sendApiError(res, 500, error)
  }
}

ticketsV2.getDeleted = async (_req, res) => {
  try {
    const deletedTickets = await TicketModel.find({ deleted: true })

    return apiUtils.sendApiSuccess(res, { deletedTickets, count: deletedTickets.length })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.restoreDeleted = async (req, res) => {
  try {
    const postData = req.body
    if (!postData || !postData._id) return apiUtils.sendApiError_InvalidPostData(res)

    await TicketModel.restoreDeleted(postData._id)

    return apiUtils.sendApiSuccess(res)
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.stats = async (req, res) => {
  const ticketStats = require('../../../lib/ticketStats')

  const timespan = req.params.timespan
  const acceptValues = ['30', '60', '90', '180', '365']
  if (acceptValues.indexOf(timespan) === -1) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const tickets = await TicketModel.getTicketsPastDays(parseInt(timespan))

    let mostActiveTicket = null
    for (const t of tickets) {
      if (!mostActiveTicket) {
        mostActiveTicket = t
      } else if (mostActiveTicket.history.length < t.history.length) mostActiveTicket = t
    }

    const result = {
      tickets,
      closedCount: tickets.filter((ticket) => ticket.status === 3).length,
      count: tickets.length,
      avgResponse: ticketStats.buildAvgResponse(tickets),
      graphData: ticketStats.buildGraphData(tickets, timespan),
      mostActiveTicket,
      mostCommenter: ticketStats.buildMostComments(tickets),
      mostRequester: ticketStats.buildMostRequester(tickets),
      mostAssignee: ticketStats.buildMostAssignee(tickets),
    }

    return apiUtils.sendApiSuccess(res, result)
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.topGroups = async (req, res) => {
  try {
    const top = req.params.top
    const timespan = req.params.timespan

    if (!top || !timespan) return apiUtils.sendApiError_InvalidPostData(res)

    const groups = await TicketModel.getTopTicketGroups(timespan, top)

    return apiUtils.sendApiSuccess(res, { groups })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.topTags = async (req, res) => {
  try {
    let timespan = req.params.timespan
    if (!timespan) timespan = 30

    const tickets = await TicketModel.getTicketsPastDays(parseInt(timespan))

    const tagStats = require('../../../cache/tagStats')
    const tags = await tagStats(tickets, timespan)
    return apiUtils.sendApiSuccess(res, { tags })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.types = {} as TicketTypesEndpoint
ticketsV2.types.create = async (req, res) => {
  const data = req.body
  if (!data || !data.name) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const type = await TicketTypeModel.create({
      name: data.name
    })

    return apiUtils.sendApiSuccess(res, { type})
  } catch (e) {
    return apiUtils.sendApiError(res, 400, e)
  }
}

ticketsV2.types.update = async (req, res) => {
  const id = req.params.id
  const data = req.body
  if (!id || !data) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    let type = await TicketTypeModel.getType(id)
    if (!type) return apiUtils.sendApiError(res, 404, 'Not Found')

    type.name = data.name

    type = await type.save()
    return apiUtils.sendApiSuccess(res, { type })
  } catch (e) {
    return apiUtils.sendApiError(res, 400, e)
  }
}

ticketsV2.types.delete = async (req, res) => {
  const newTypeId = req.body.newTypeId
  const delTypeId = req.params.id
  if (!delTypeId || !newTypeId) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const mailerTicketType = await SettingModel.getSettingsByName(['mailer:check:ticketype'])
    if (mailerTicketType && (mailerTicketType.value as any).toString().toLowerCase() === delTypeId.toString().toLowerCase()) {
      const error = {
        custom: true,
        message: 'Type currently "Default Ticket Type" for mailer check.'
      }

      return apiUtils.sendApiError(res, 400, error) 
    }

    await TicketModel.updateType(delTypeId, newTypeId)
    await TicketTypeModel.deleteOne({_id: delTypeId})

    return apiUtils.sendApiSuccess(res)
  } catch (e) {
    console.log(e)
    return apiUtils.sendApiError(res, 400, e)
  }
}

ticketsV2.types.addPriority = async (req, res) => {
  const id = req.params.id
  const data = req.body
  if (!id || !data || !data.priority) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    let type = await TicketTypeModel.getType(id)
    if (!type) return apiUtils.sendApiError(res, 404, 'Not Found')

    await type.addPriority(data.priority)
    type = await type.save()
    type = await type.populate('priorities')

    return apiUtils.sendApiSuccess(res, { type })
  } catch (e) {
    return apiUtils.sendApiError(res, 400, e)
  }
}

ticketsV2.types.removePriority = async (req, res) => {
  const id = req.params.id
  const data = req.body
  if (!id || !data || !data.priority) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    let type = await TicketTypeModel.getType(id)
    if (!type) return apiUtils.sendApiError(res, 404, 'Not Found')

    await type.removePriority(data.priority)
    type = await type.save()
    type = await type.populate('priorities')

    return apiUtils.sendApiSuccess(res, { type })

  } catch (e) {
    return apiUtils.sendApiError(res, 400, e)
  }
}

ticketsV2.priority = {} as TicketPriorityEndpoint
ticketsV2.priority.create = async (req, res) => {
  const data = req.body
  const name = data.name
  const overdueIn = data.overdueIn
  const htmlColor = data.htmlColor
  if (!name || !overdueIn || !htmlColor) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const priority = await PriorityModel.create({
      name,
      overdueIn,
      htmlColor
    })

    return apiUtils.sendApiSuccess(res, { priority })
  } catch (e) {
    return apiUtils.sendApiError(res, 400, e)
  }
}

ticketsV2.priority.update = async (req, res) => {
  const id = req.params.id
  const data = req.body
  if (!id || !data) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    let priority = await PriorityModel.getPriority(id)
    if (!priority) return apiUtils.sendApiError(res, 404, 'Not Found')
    if (data.name) priority.name = data.name
    if (data.htmlColor) priority.htmlColor = data.htmlColor
    if (data.overdueIn) priority.overdueIn = data.overdueIn

    priority = await priority.save()
    return apiUtils.sendApiSuccess(res, { priority})
  } catch (e) {
    return apiUtils.sendApiError(res, 400, e)
  }
}

ticketsV2.priority.delete = async (req, res) => {
  const id = req.params.id
  const data = req.body
  if (!id || !data || !data.newPriority) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    await TicketModel.updateMany({priority: id}, { priority: data.newPriority})

    const priority = await PriorityModel.findOne({_id: id})
    if (!priority) return apiUtils.sendApiError_InvalidPostData(res)
    if (priority.default)
      return apiUtils.sendApiError(res, 400, {message: 'Unable to delete default priority: ' + priority.name})

    const success = await PriorityModel.deleteOne({_id: id})
    if (!success) return apiUtils.sendApiError(res, 400, {message: `Unable to delete: ${id}`})

    return apiUtils.sendApiSuccess(res)
  } catch (e) {
    return apiUtils.sendApiError(res, 400, e)
  }
}

const statusGet = async (_req: TypedRequestBody<any>, res: Response) => {
  try {
    const status = await TicketStatusModel.getStatuses() as TicketStatusClass[]
    return apiUtils.sendApiSuccess(res, {status})
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

const statusCreate = async (req: TypedRequestBody<any>, res: Response) => {
  try {
    const payload = req.body
    const name = payload.name
    const htmlColor = payload.htmlColor
    const slatimer = payload.slatimer
    const isResolved = payload.isResolved
    if (!name) return apiUtils.sendApiError_InvalidPostData(res)

    const status = await TicketStatusModel.create({
      name,
      htmlColor,
      slatimer,
      isResolved,
    })

    return apiUtils.sendApiSuccess(res, { status})

  } catch (e) {
    console.log(e)
    return apiUtils.sendApiError(res, 500, e)
  }
}

const statusUpdate = async (req: TypedRequestBody<any>, res: Response) => {
  try {
    const id = req.params.id
    const payload = req.body
    if (!id || !payload) return apiUtils.sendApiError_InvalidPostData(res)

    let status = await TicketStatusModel.getStatusById(id)
    if (!status) return apiUtils.sendApiError(res, 404, {error: new Error('404: Invalid Status')})

    if (payload.name) status.name = payload.name
    if (payload.htmlColor) status.htmlColor = payload.htmlColor
    status.slatimer = payload.slatimer
    status.isResolved = payload.isResolved

    status = await status.save()

    return apiUtils.sendApiSuccess(res, {status})

  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }

}

const statusDelete = async (req: TypedRequestBody<any>, res: Response) => {
  try {
    const id = req.params.id
    const newStatusId = req.body.newStatusId
    if (!id || !newStatusId) return apiUtils.sendApiError_InvalidPostData(res)

    const status = await TicketStatusModel.findOne({_id: id})
    if (!status) return apiUtils.sendApiError(res, 404, {error: new Error('404: Invalid Status')})
    if (status.isLocked) return apiUtils.sendApiError(res, 400, {error: new Error(`Unable to delete default status: ${status.name}`)})

    await TicketModel.updateMany({status:id}, {status: newStatusId})

    await status.deleteOne()

    return apiUtils.sendApiSuccess(res)
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

const statusOrder = async (req: TypedRequestBody<any>, res: Response) => {
  try {
    const data = req.body
    if (!data || !data.order) return apiUtils.sendApiError_InvalidPostData(res)

    const order = data.order
    const statuses = await TicketStatusModel.getStatuses()

    for (const status of statuses) {
      const idx = order.findIndex((id: string) => status._id.toString() === id)
      if (idx === -1) continue
      status.order = idx
      await status.save()
    }

    return apiUtils.sendApiSuccess(res)

  } catch (e) {
    return apiUtils.sendApiError(res, 500, e)
  }
}

ticketsV2.status = {
  create: statusCreate,
  get: statusGet,
  update: statusUpdate,
  delete: statusDelete,
  order: statusOrder
}

ticketsV2.info = {} as TicketInfoEndpoint
ticketsV2.info.types = async (_req, res) => {
  try {
    const ticketTypes = await TicketTypeModel.find({})
    const priorities = await PriorityModel.find({})

    return apiUtils.sendApiSuccess(res, { ticketTypes, priorities })
  } catch (err) {
    logger.warn(err)
    return apiUtils.sendApiError(res, 500, err)
  }
}

ticketsV2.info.tags = async (_req, res) => {
  try {
    const tags = await TicketTagModel.find({}).sort('normalized')

    return apiUtils.sendApiSuccess(res, { tags })
  } catch (err) {
    logger.warn(err)
    return apiUtils.sendApiError(res, 500, err)
  }
}

module.exports = ticketsV2
