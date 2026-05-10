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
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { DocumentType, modelOptions, plugin, post, pre, prop, Ref, ReturnModelType } from '@typegoose/typegoose'
import async from 'async'
import _ from 'lodash'
import moment from 'moment'
import mongooseAutoPopulate from 'mongoose-autopopulate'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sanitizeHtml from 'sanitize-html'
import type { Types } from 'mongoose'
import xss from 'xss'
import winston from '../logger'
import utils from '../helpers/utils'
import { GroupModel, TicketTypeModel, UserModel, TicketStatusModel } from '../models'
import permissions from '../permissions'
import { UserModelClass } from './user'
import { CommentClass } from './comment'
import { AttachmentClass } from './attachment'
import { NoteClass } from './note'
import { HistoryClass } from './history'
import type { TicketPriorityClass } from './ticketpriority'
import { TicketTagClass } from './tag'
import type { TicketTypeClass } from './tickettype'
import type { TicketStatusClass } from './ticketStatus'
import type { GroupModelClass } from './group'
import Counters from './counters'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { marked } from 'marked'

const COLLECTION = 'tickets'

type TicketQueryObject = {
  limit?: number
  page?: number
  status?: string | string[]
  closed?: boolean
  filter?: {
    groups?: string[]
    uid?: string | number
    priority?: Types.ObjectId[]
    types?: Types.ObjectId[]
    tags?: Types.ObjectId[]
    assignee?: Types.ObjectId[]
    unassigned?: boolean
    owner?: Types.ObjectId[]
    subject?: string
    issue?: string
    date?: {
      start?: string
      end?: string
    }
  }
  owner?: Types.ObjectId | string
  assignedSelf?: boolean
  user?: Types.ObjectId | string
  unassigned?: boolean
}



function buildQueryWithObject(SELF: any, grpId: any[], object: TicketQueryObject, count?: boolean): any {
  const limit = object.limit || 10
  const page = object.page || 0
  let _status = object.status

  if (_.isArray(_status)) {
    _status = _.join(_status, ',').split(',')
  }

  if (object.filter && object.filter.groups)
    grpId = _.intersection(
      object.filter.groups,
      _.map(grpId, (g: any) => g._id.toString())
    )

  let query: any
  if (count) query = SELF.countDocuments({ groups: { $in: grpId }, deleted: false })
  else {
    query = SELF.find({ group: { $in: grpId }, deleted: false })
      .populate('owner assignee subscribers comments.owner notes.owner history.owner', 'username fullname email role image title')
      .populate('assignee', 'username fullname email role image title')
      .populate('type tags group status')
      .sort({ uid: -1 })
  }

  if (limit !== -1) query.skip(page * limit).limit(limit)

  if (_.isArray(_status) && _status.length > 0) {
    query.where({ status: { $in: _status } })
  }

  if (object.filter) {
    if (object.filter.uid) {
      object.filter.uid = parseInt(String(object.filter.uid))
      if (!_.isNaN(object.filter.uid)) query.or([{ uid: object.filter.uid }])
    }
    if (object.filter.priority) query.where({ priority: { $in: object.filter.priority } })
    if (object.filter.types) query.where({ type: { $in: object.filter.types } })
    if (object.filter.tags) query.where({ tags: { $in: object.filter.tags } })
    if (object.filter.assignee) query.where({ assignee: { $in: object.filter.assignee } })
    if (object.filter.unassigned) query.where({ assignee: { $exists: false } })
    if (object.filter.owner) query.where({ owner: { $in: object.filter.owner } })
    if (object.filter.subject) query.or([{ subject: new RegExp(object.filter.subject, 'i') }])
    if (object.filter.issue) query.or([{ issue: new RegExp(object.filter.issue, 'i') }])

    if (object.filter.date) {
      let startDate = new Date(2000, 0, 1, 0, 0, 1)
      let endDate = new Date()
      if (object.filter.date.start) startDate = new Date(object.filter.date.start)
      if (object.filter.date.end) endDate = new Date(object.filter.date.end)
      query.where({ date: { $gte: startDate, $lte: endDate } })
    }
  }

  if (object.owner) query.where('owner', object.owner)
  if (object.assignedSelf) query.where('assignee', object.user)
  if (object.unassigned) query.where({ assignee: { $exists: false } })

  return query
}

@plugin(mongooseAutoPopulate as any)
@pre<TicketClass>(['findOne', 'find'], function () {
  this.populate('priority')
})
@pre<TicketClass>('save', async function (this: DocumentType<TicketClass>) {
  this.subject = utils.sanitizeFieldPlainText(this.subject.trim())
  this.wasNew = this.isNew

  if (!_.isUndefined(this.uid) || this.uid) return

  const res = await Counters.increment('tickets')
  this.uid = res.next
  if (_.isUndefined(this.uid)) throw new Error('Invalid UID.')
})
@post<TicketClass>('save', async function (doc: DocumentType<TicketClass>) {
  if (!(doc as any).wasNew) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const emitter = require('../emitter')
    try {
      const savedTicket = await doc.populate([
        {
          path: 'owner assignee comments.owner notes.owner subscribers history.owner',
          select: '_id username fullname email role image title'
        },
        { path: 'type tags' },
        {
          path: 'group',
          model: GroupModel,
          populate: [
            { path: 'members', model: UserModel, select: '-__v -accessToken -tOTPKey' },
            { path: 'sendMailTo', model: UserModel, select: '-__v -accessToken -tOTPKey' }
          ]
        }
      ])
      emitter.emit('ticket:updated', savedTicket)
    } catch (err) {
      winston.warn('WARNING: ' + err)
    }
  }
})
@modelOptions({ options: { customName: COLLECTION }, schemaOptions: { toJSON: { virtuals: true } } })
export class TicketClass {
  public _id!: Types.ObjectId
  public wasNew?: boolean

  @prop({ unique: true, index: true })
  public uid?: number

  @prop({ required: true, ref: 'accounts' })
  public owner!: Ref<UserModelClass>

  @prop({ required: true, ref: 'groups' })
  public group!: Ref<GroupModelClass>

  @prop({ ref: 'accounts' })
  public assignee?: Ref<UserModelClass>

  @prop({ required: true, default: Date.now, index: true })
  public date!: Date

  @prop()
  public updated?: Date

  @prop({ required: true, default: false, index: true })
  public deleted!: boolean

  @prop({ required: true, ref: 'tickettypes' })
  public type!: Ref<TicketTypeClass>

  @prop({ required: true, ref: 'statuses', index: true })
  public status!: Ref<TicketStatusClass>

  @prop({ required: true, ref: 'priorities' })
  public priority!: Ref<TicketPriorityClass>

  @prop({ ref: () => TicketTagClass, autopopulate: true })
  public tags!: Ref<TicketTagClass>[]

  @prop({ required: true })
  public subject!: string

  @prop({ required: true })
  public issue!: string

  @prop()
  public closedDate?: Date

  @prop()
  public dueDate?: Date

  @prop({ type: () => [CommentClass] })
  public comments!: DocumentType<CommentClass>[]

  @prop({ type: () => [NoteClass] })
  public notes!: DocumentType<NoteClass>[]

  @prop({ type: () => [AttachmentClass] })
  public attachments!: DocumentType<AttachmentClass>[]

  @prop({ type: () => [HistoryClass] })
  public history!: DocumentType<HistoryClass>[]

  @prop({ ref: () => UserModelClass })
  public subscribers!: Ref<UserModelClass>[]

  // Virtuals

  public get statusFormatted(): Promise<string> {
    return new Promise((resolve, reject) => {
      ;(async () => {
        try {
          const status = await TicketStatusModel.getStatusById(this.status as Types.ObjectId)
          if (!status) return reject(new Error('Invalid Status Id: ' + this.status))
          return resolve(status.name)
        } catch (e) {
          return reject(e)
        }
      })()
    })
  }

  public get commentsAndNotes(): (DocumentType<CommentClass> | DocumentType<NoteClass>)[] {
    _.each(this.comments, (i: any) => { i.isComment = true })
    _.each(this.notes, (i: any) => { i.isNote = true })
    let combined: any[] = _.union(this.comments as any[], this.notes as any[])
    combined = _.sortBy(combined, 'date')
    return combined
  }

  // Instance Methods

  public setStatus(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    status: Types.ObjectId | string,
    callback?: (err: Error | string | null, ticket?: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise((resolve, reject) => {
      ;(async () => {
        if (_.isUndefined(status)) {
          if (typeof callback === 'function') callback('Invalid Status')
          return reject(new Error('Invalid Status'))
        }

        try {
          const statusModel = await TicketStatusModel.getStatusById(status as Types.ObjectId)
          if (!statusModel) {
            if (typeof callback === 'function') return callback('Invalid Status')
            return reject(new Error('Invalid Status'))
          }

          self.closedDate = (statusModel.isResolved ? new Date() : null) as any
          self.status = status as any

          const historyItem = {
            action: 'ticket:set:status:' + statusModel.name,
            description: 'Ticket Status set to: ' + statusModel.name,
            owner: ownerId
          }
          self.history.push(historyItem as any)

          if (typeof callback === 'function') callback(null, self)
          return resolve(self)
        } catch (err: any) {
          if (typeof callback === 'function') return callback(err)
          return reject(err)
        }
      })()
    })
  }

  public setAssignee(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    userId: Types.ObjectId,
    callback?: (err: Error | null, ticket?: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise((resolve, reject) => {
      ;(async () => {
        try {
          if (!userId) {
            const err = new Error('Invalid User Id')
            if (typeof callback === 'function') return callback(err)
            return reject(err)
          }

          self.assignee = userId as any

          const user = await UserModel.findOne({ _id: userId })
          if (!user) {
            const err = new Error('Unable to get user with id: ' + userId)
            if (typeof callback === 'function') callback(err)
            return reject(err)
          }

          if (!permissions.canThis(user.role as any, 'tickets:update') && !permissions.canThis(user.role as any, 'agent:*')) {
            const err = new Error('User does not have permission to be set as an assignee.')
            if (typeof callback === 'function') callback(err)
            return reject(err)
          }

          const historyItem = {
            action: 'ticket:set:assignee',
            description: user.fullname + ' was set as assignee',
            owner: ownerId
          }
          self.history.push(historyItem as any)

          if (typeof callback === 'function') callback(null, self)
          return resolve(self)
        } catch (e: any) {
          if (typeof callback === 'function') callback(e)
          return reject(e)
        }
      })()
    })
  }

  public clearAssignee(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    callback?: (err: null, ticket: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise(resolve => {
      self.assignee = undefined
      const historyItem = {
        action: 'ticket:set:assignee',
        description: 'Assignee was cleared',
        owner: ownerId
      }
      self.history.push(historyItem as any)

      if (typeof callback === 'function') callback(null, self)
      return resolve(self)
    })
  }

  public setTicketType(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    typeId: Types.ObjectId,
    callback?: (err: Error | string | null, ticket?: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    return new Promise((resolve, reject) => {
      ;(async () => {
        this.type = typeId as any
        try {
          const type = await TicketTypeModel.findOne({ _id: typeId })
          if (!type) {
            if (typeof callback === 'function') return callback('Invalid Type Id: ' + typeId)
            return reject(new Error('Invalid Type Id: ' + typeId))
          }

          const historyItem = {
            action: 'ticket:set:type',
            description: 'Ticket type set to: ' + type.name,
            owner: ownerId
          }
          this.history.push(historyItem as any)

          if (typeof callback === 'function') return callback(null, this)
          return resolve(this)
        } catch (e: any) {
          if (typeof callback === 'function') return callback(e)
          return reject(e)
        }
      })()
    })
  }

  public setTicketPriority(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    priority: DocumentType<TicketPriorityClass>,
    callback?: (err: Error | string | null, ticket?: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    return new Promise((resolve, reject) => {
      ;(async () => {
        if (_.isUndefined(priority) || !_.isObject(priority)) {
          if (typeof callback === 'function') return callback('Priority must be a PriorityObject.')
          return reject(new Error('Priority must be a PriorityObject.'))
        }

        this.priority = priority._id as any

        const historyItem = {
          action: 'ticket:set:priority',
          description: 'Ticket Priority set to: ' + priority.name,
          owner: ownerId
        }
        this.history.push(historyItem as any)

        try {
          const populatedTicket = await (this as any).populate(['priority'])
          if (typeof callback === 'function') return callback(null, populatedTicket)
          return resolve(populatedTicket)
        } catch (err: any) {
          if (typeof callback === 'function') return callback(err)
        }
      })()
    })
  }

  public setTicketGroup(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    groupId: Types.ObjectId,
    callback: (err: Error | null, ticket?: DocumentType<TicketClass>) => void
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    self.group = groupId as any

    ;(self as any).populate('group').then((ticket: DocumentType<TicketClass>) => {
      const historyItem = {
        action: 'ticket:set:group',
        description: 'Ticket Group set to: ' + (ticket.group as any).name,
        owner: ownerId
      }
      self.history.push(historyItem as any)
      return callback(null, ticket)
    }).catch((err: Error) => callback(err))
  }

  public setTicketDueDate(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    dueDate: Date,
    callback: (err: null, ticket: DocumentType<TicketClass>) => void
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    self.dueDate = dueDate

    const historyItem = {
      action: 'ticket:set:duedate',
      description: 'Ticket Due Date set to: ' + self.dueDate,
      owner: ownerId
    }
    self.history.push(historyItem as any)

    return callback(null, self)
  }

  public setIssue(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    issue: string,
    callback?: (err: null, ticket: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise(resolve => {
      issue = issue.replace(/(\r\n|\n\r|\r|\n)/g, '<br>')
      issue = sanitizeHtml(issue).trim()
      self.issue = xss(marked.parse(issue))

      const historyItem = {
        action: 'ticket:update:issue',
        description: 'Ticket Issue was updated.',
        owner: ownerId
      }
      self.history.push(historyItem as any)

      if (typeof callback === 'function') callback(null, self)
      return resolve(self)
    })
  }

  public setSubject(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    subject: string,
    callback?: (err: null, ticket: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise(resolve => {
      self.subject = subject
      const historyItem = {
        action: 'ticket:update:subject',
        description: 'Ticket Subject was updated.',
        owner: ownerId
      }
      self.history.push(historyItem as any)

      if (typeof callback === 'function') callback(null, self)
      return resolve(self)
    })
  }

  public updateComment(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    commentId: Types.ObjectId | string,
    commentText: string,
    callback?: (err: Error | string | null, ticket?: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise((resolve, reject) => {
      const comment = _.find(self.comments, (c: any) => c._id.toString() === commentId.toString())

      if (_.isUndefined(comment)) {
        if (typeof callback === 'function') callback('Invalid Comment')
        return reject(new Error('Invalid Comment'))
      }

      comment.comment = commentText

      const historyItem = {
        action: 'ticket:comment:updated',
        description: 'Comment was updated: ' + commentId,
        owner: ownerId
      }
      self.history.push(historyItem as any)

      if (typeof callback === 'function') callback(null, self)
      return resolve(self)
    })
  }

  public removeComment(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    commentId: Types.ObjectId | string,
    callback?: (err: null, ticket: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise(resolve => {
      self.comments = _.reject(self.comments, (o: any) => o._id.toString() === commentId.toString()) as any

      const historyItem = {
        action: 'ticket:delete:comment',
        description: 'Comment was deleted: ' + commentId,
        owner: ownerId
      }
      self.history.push(historyItem as any)

      if (typeof callback === 'function') callback(null, self)
      return resolve(self)
    })
  }

  public updateNote(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    noteId: Types.ObjectId | string,
    noteText: string,
    callback?: (err: Error | string | null, ticket?: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise((resolve, reject) => {
      const note = _.find(self.notes, (c: any) => c._id.toString() === noteId.toString())

      if (_.isUndefined(note)) {
        if (typeof callback === 'function') callback('Invalid Note')
        return reject(new Error('Invalid Note'))
      }

      note.note = noteText

      const historyItem = {
        action: 'ticket:note:updated',
        description: 'Note was updated: ' + noteId,
        owner: ownerId
      }
      self.history.push(historyItem as any)

      if (typeof callback === 'function') callback(null, self)
      return resolve(self)
    })
  }

  public removeNote(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    noteId: Types.ObjectId | string,
    callback?: (err: null, ticket: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise(resolve => {
      self.notes = _.reject(self.notes, (o: any) => o._id.toString() === noteId.toString()) as any

      const historyItem = {
        action: 'ticket:delete:note',
        description: 'Note was deleted: ' + noteId,
        owner: ownerId
      }
      self.history.push(historyItem as any)

      if (typeof callback === 'function') callback(null, self)
      return resolve(self)
    })
  }

  public getAttachment(
    this: DocumentType<TicketClass>,
    attachmentId: Types.ObjectId | string,
    callback: (attachment: DocumentType<AttachmentClass> | undefined) => void
  ): void {
    const attachment = _.find(this.attachments, (o: any) => o._id.toString() === attachmentId.toString())
    return callback(attachment)
  }

  public removeAttachment(
    this: DocumentType<TicketClass>,
    ownerId: Types.ObjectId,
    attachmentId: Types.ObjectId | string,
    callback: (err: null, ticket: DocumentType<TicketClass>) => void
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const attachment = _.find(self.attachments, (o: any) => o._id.toString() === attachmentId.toString())
    self.attachments = _.reject(self.attachments, (o: any) => o._id.toString() === attachmentId.toString()) as any

    if (_.isUndefined(attachment)) {
      return callback(null, self)
    }

    const historyItem = {
      action: 'ticket:delete:attachment',
      description: 'Attachment was deleted: ' + attachment.name,
      owner: ownerId
    }
    self.history.push(historyItem as any)

    return callback(null, self)
  }

  public addSubscriber(
    this: DocumentType<TicketClass>,
    userId: Types.ObjectId,
    callback?: (err: null, ticket: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise((resolve, reject) => {
      const hasSub = _.some(self.subscribers, (i: any) => i._id.toString() === userId.toString())

      if (!hasSub) {
        self.subscribers.push(userId as any)
      }

      if (typeof callback === 'function') return callback(null, self)
      resolve(self)
    })
  }

  public removeSubscriber(
    this: DocumentType<TicketClass>,
    userId: Types.ObjectId,
    callback?: (err: null, ticket: DocumentType<TicketClass>) => void
  ): Promise<DocumentType<TicketClass>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise((resolve, reject) => {
      const user = _.find(self.subscribers, (i: any) => i._id.toString() === userId.toString())

      if (_.isUndefined(user) || _.isEmpty(user) || _.isNull(user)) {
        if (typeof callback === 'function') return callback(null, self)
        return resolve(self)
      }

      self.subscribers = _.reject(self.subscribers, (i: any) => i._id.toString() === userId.toString()) as any

      if (typeof callback === 'function') return callback(null, self)
      resolve(self)
    })
  }

  // Static Methods

  public static getAll(this: ReturnModelType<typeof TicketClass>, callback?: any): any {
    const p = this.find({ deleted: false })
      .populate('owner assignee', '-password -__v -preferences -iOSDeviceTokens -tOTPKey')
      .populate('type tags group')
      .sort({ status: 1 })
      .lean()
      .exec()
    if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
    return p
  }

  public static getForCache(
    this: ReturnModelType<typeof TicketClass>,
    callback?: (err: Error | null, tickets?: any[]) => void
  ): Promise<any[]> {
    const t365 = moment.utc().hour(23).minute(59).second(50).subtract(365, 'd').toDate()
    const p = this.find({ date: { $gte: t365 }, deleted: false }).sort('date').lean().exec()
    if (typeof callback === 'function') return p.then(r => callback(null, r as any[])).catch(e => callback(e)) as any
    return p as any
  }

  public static getAllNoPopulate(this: ReturnModelType<typeof TicketClass>, callback?: any): any {
    const p = this.find({ deleted: false }).sort({ status: 1 }).lean().exec()
    if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
    return p
  }

  public static getAllByStatus(this: ReturnModelType<typeof TicketClass>, status: any | any[], callback?: any): any {
    if (!_.isArray(status)) status = [status]

    const p = this.find({ status: { $in: status }, deleted: false })
      .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
      .populate('type tags group')
      .sort({ status: 1 })
      .lean()
      .exec()
    if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
    return p
  }

  public static getTickets(
    this: ReturnModelType<typeof TicketClass>,
    grpIds: Types.ObjectId[],
    callback: (err: Error | string | null, tickets?: any) => void
  ): any {
    if (_.isUndefined(grpIds)) return callback('Invalid GroupId - TicketSchema.GetTickets()', null)
    if (!_.isArray(grpIds)) return callback('Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()', null)

    const p = this.find({ group: { $in: grpIds }, deleted: false })
      .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
      .populate('type tags group')
      .sort({ status: 1 })
      .exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static getTicketsByDepartments(
    this: ReturnModelType<typeof TicketClass>,
    departments: any[],
    object: TicketQueryObject,
    callback: (err: any, tickets?: any) => void
  ): any {
    if (!departments || !_.isObject(departments) || !object)
      return callback('Invalid Data - TicketSchema.GetTicketsByDepartments()')

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    if (_.some(departments, { allGroups: true })) {
      GroupModel.find({}).exec().then((groups: any) => {
        return self.getTicketsWithObject(groups, object, callback)
      }).catch((err: Error) => callback({ error: err }))
    } else {
      const groups = _.flattenDeep(
        departments.map((d: any) => d.groups.map((g: any) => g._id))
      )
      return self.getTicketsWithObject(groups, object, callback)
    }
  }

  public static async getTicketsWithObject(
    this: ReturnModelType<typeof TicketClass>,
    grpId: any[],
    object: any,
    callback?: (err: Error | null, tickets?: any) => void
  ): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise((resolve, reject) => {
      ;(async () => {
        try {
          if (!grpId || !_.isArray(grpId) || !_.isObject(object))
            throw new Error('Invalid parameter in - TicketSchema.GetTicketsWithObject()')

          const query = buildQueryWithObject(self, grpId, object)
          const resTickets = await query.exec()
          if (typeof callback === 'function') return callback(null, resTickets)
          return resolve(resTickets)
        } catch (e: any) {
          if (typeof callback === 'function') return callback(e)
          return reject(e)
        }
      })()
    })
  }

  public static async getCountWithObject(
    this: ReturnModelType<typeof TicketClass>,
    grpId: any[],
    object: any,
    callback?: (err: Error | null, count?: number) => void
  ): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return new Promise((resolve, reject) => {
      ;(async () => {
        try {
          if (!grpId || !_.isArray(grpId) || !_.isObject(object))
            throw new Error('Invalid parameter in - TicketSchema.GetCountWithObject()')

          const query = buildQueryWithObject(self, grpId, object, true)
          const count = await query.lean().exec()
          if (typeof callback === 'function') return callback(null, count)
          return resolve(count)
        } catch (e: any) {
          if (typeof callback === 'function') return callback(e)
          return reject(e)
        }
      })()
    })
  }

  public static getTicketsByStatus(
    this: ReturnModelType<typeof TicketClass>,
    grpId: Types.ObjectId[],
    status: any,
    callback: (err: Error | string | null, tickets?: any) => void
  ): any {
    if (_.isUndefined(grpId)) return callback('Invalid GroupId - TicketSchema.GetTickets()', null)
    if (!_.isArray(grpId)) return callback('Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()', null)

    const p = this.find({ group: { $in: grpId }, status, deleted: false })
      .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
      .populate('type tags group status')
      .sort({ uid: -1 })
      .exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static getTicketByUid(
    this: ReturnModelType<typeof TicketClass>,
    uid: number,
    callback?: (err: Error | string | null, ticket?: any) => void
  ): any {
    if (_.isUndefined(uid)) {
      if (typeof callback === 'function') return callback('Invalid Uid - TicketSchema.GetTicketByUid()', null)
      return Promise.reject(new Error('Invalid Uid - TicketSchema.GetTicketByUid()'))
    }

    const p = this.findOne({ uid, deleted: false })
      .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
      .populate('type tags group status')
      .exec()
    if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
    return p
  }

  public static async getTicketById(
    this: ReturnModelType<typeof TicketClass>,
    id: Types.ObjectId | string,
    callback?: (err: Error | null, ticket?: any) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      ;(async () => {
        if (_.isUndefined(id)) {
          const error = new Error('Invalid Id - TicketSchema.GetTicketById()')
          if (typeof callback === 'function') return callback(error, null)
          return reject(error)
        }

        const q = this.findOne({ _id: id, deleted: false })
          .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
          .populate('type tags status')
          .populate({
            path: 'group',
            model: GroupModel,
            populate: [
              { path: 'members', model: UserModel, select: '-__v -iOSDeviceTokens -accessToken -tOTPKey' },
              { path: 'sendMailTo', model: UserModel, select: '-__v -iOSDeviceTokens -accessToken -tOTPKey' }
            ]
          })

        try {
          const result = await q.exec()
          if (typeof callback === 'function') return callback(null, result)
          return resolve(result)
        } catch (e: any) {
          if (typeof callback === 'function') return callback(e)
          winston.warn(e)
          return reject(e)
        }
      })()
    })
  }

  public static getTicketsByRequester(
    this: ReturnModelType<typeof TicketClass>,
    userId: Types.ObjectId,
    callback: (err: Error | string | null, tickets?: any) => void
  ): any {
    if (_.isUndefined(userId)) return callback('Invalid Requester Id - TicketSchema.GetTicketsByRequester()', null)

    const p = this.find({ owner: userId, deleted: false })
      .limit(10000)
      .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
      .populate('type tags status')
      .populate({
        path: 'group',
        model: GroupModel,
        populate: [
          { path: 'members', model: UserModel, select: '-__v -iOSDeviceTokens -accessToken -tOTPKey' },
          { path: 'sendMailTo', model: UserModel, select: '-__v -iOSDeviceTokens -accessToken -tOTPKey' }
        ]
      })
      .exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static getTicketsWithSearchString(
    this: ReturnModelType<typeof TicketClass>,
    grps: Types.ObjectId[],
    search: string,
    callback: (err: Error | string | null, tickets?: any[]) => void
  ): void {
    if (_.isUndefined(grps) || _.isUndefined(search))
      return callback('Invalid Post Data - TicketSchema.GetTicketsWithSearchString()')

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const tickets: any[][] = []

    async.parallel(
      [
        function (cb: (err?: Error | null) => void) {
          self.find({ group: { $in: grps }, deleted: false, $where: '/^' + search + '.*/.test(this.uid)' })
            .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
            .populate('type tags group status')
            .limit(100)
            .exec()
            .then((results: any) => { tickets.push(results); cb(null) })
            .catch((err: Error) => cb(err))
        },
        function (cb: (err?: Error | null) => void) {
          self.find({ group: { $in: grps }, deleted: false, subject: { $regex: search, $options: 'i' } })
            .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
            .populate('type tags group status')
            .limit(100)
            .exec()
            .then((results: any) => { tickets.push(results); cb(null) })
            .catch((err: Error) => cb(err))
        },
        function (cb: (err?: Error | null) => void) {
          self.find({ group: { $in: grps }, deleted: false, issue: { $regex: search, $options: 'i' } })
            .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
            .populate('type tags group status')
            .limit(100)
            .exec()
            .then((results: any) => { tickets.push(results); cb(null) })
            .catch((err: Error) => cb(err))
        }
      ],
      function (err) {
        if (err) return callback(err)
        const t = _.uniqBy(_.flatten(tickets), (i: any) => i.uid)
        return callback(null, t)
      }
    )
  }

  public static getOverdue(
    this: ReturnModelType<typeof TicketClass>,
    grpId: Types.ObjectId[],
    callback: (err: Error | string | null, tickets?: any[]) => void
  ): void {
    if (_.isUndefined(grpId)) return callback('Invalid Group Ids - TicketSchema.GetOverdue()')

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    async.waterfall(
      [
        function (next: (err: Error | null, tickets?: any) => void) {
          self
            .find({ group: { $in: grpId }, status: { $in: [0, 1] }, deleted: false })
            .select('_id date updated')
            .lean()
            .exec()
            .then((r: any) => next(null, r))
            .catch((e: Error) => next(e))
        },
        function (tickets: any[], next: (err: Error | null, tickets?: any) => void) {
          const t = _.map(tickets, (i: any) =>
            _.transform(
              i,
              function (result: any, value: any, key: string) {
                if (key === '_id') result._id = value
                if (key === 'priority') result.overdueIn = value.overdueIn
                if (key === 'date') result.date = value
                if (key === 'updated') result.updated = value
              },
              {}
            )
          )
          return next(null, t)
        },
        function (tickets: any[], next: (err: Error | null, ids?: any) => void) {
          const now = new Date()
          let ids: any[] = _.filter(tickets, (t: any) => {
            if (!t.date && !t.updated) return false

            let timeout: Date
            if (t.updated) {
              const updated = new Date(t.updated)
              timeout = new Date(updated)
              timeout.setMinutes(updated.getMinutes() + t.overdueIn)
            } else {
              const date = new Date(t.date)
              timeout = new Date(date)
              timeout.setMinutes(date.getMinutes() + t.overdueIn)
            }

            return now > timeout
          })

          ids = _.map(ids, '_id')
          return next(null, ids)
        },
        function (ids: Types.ObjectId[], next: (err: Error | null, tickets?: any) => void) {
          self
            .find({ _id: { $in: ids } })
            .limit(50)
            .select('_id uid subject updated date')
            .lean()
            .exec()
            .then((r: any) => next(null, r))
            .catch((e: Error) => next(e))
        }
      ],
      function (err: Error | null, tickets: any) {
        if (err) return callback(err)
        return callback(null, tickets)
      } as any
    )
  }

  public static getTicketsByTag(
    this: ReturnModelType<typeof TicketClass>,
    grpId: Types.ObjectId[],
    tagId: Types.ObjectId,
    callback: (err: Error | string | null, tickets?: any) => void
  ): any {
    if (_.isUndefined(grpId)) return callback('Invalid Group Ids - TicketSchema.GetTicketsByTag()', null)
    if (_.isUndefined(tagId)) return callback('Invalid Tag Id - TicketSchema.GetTicketsByTag()', null)

    const p = this.find({ group: { $in: grpId }, tags: tagId, deleted: false }).exec()
    if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
    return p
  }

  public static getAllTicketsByTag(
    this: ReturnModelType<typeof TicketClass>,
    tagId: Types.ObjectId,
    callback?: (err: Error | string | null, tickets?: any) => void
  ): any {
    if (_.isUndefined(tagId)) {
      if (typeof callback === 'function') return callback('Invalid Tag Id - TicketSchema.GetAllTicketsByTag()', null)
      return Promise.reject(new Error('Invalid Tag Id - TicketSchema.GetAllTicketsByTag()'))
    }

    const p = this.find({ tags: tagId, deleted: false }).exec()
    if (typeof callback === 'function') return p.then(r => callback(null, r)).catch(e => callback(e))
    return p
  }

  public static getTicketsByType(
    this: ReturnModelType<typeof TicketClass>,
    grpId: Types.ObjectId[],
    typeId: Types.ObjectId,
    callback: (err: Error | string | null, tickets?: any) => void,
    limit?: boolean
  ): any {
    if (_.isUndefined(grpId)) return callback('Invalid Group Ids = TicketSchema.GetTicketsByType()', null)
    if (_.isUndefined(typeId)) return callback('Invalid Ticket Type Id - TicketSchema.GetTicketsByType()', null)

    const q = this.find({ group: { $in: grpId }, type: typeId, deleted: false })
    if (limit) q.limit(1000)

    const p = q.lean().exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static getAllTicketsByType(
    this: ReturnModelType<typeof TicketClass>,
    typeId: Types.ObjectId,
    callback: (err: Error | string | null, tickets?: any) => void
  ): any {
    if (_.isUndefined(typeId)) return callback('Invalid Ticket Type Id - TicketSchema.GetAllTicketsByType()', null)

    const p = this.find({ type: typeId }).lean().exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static updateType(
    this: ReturnModelType<typeof TicketClass>,
    oldTypeId: Types.ObjectId,
    newTypeId: Types.ObjectId,
    callback?: (err: any) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      ;(async () => {
        if (!oldTypeId || !newTypeId) {
          if (typeof callback === 'function') return callback('Invalid IDs - TicketSchema.UpdateType()')
          return reject('Invalid IDs - TicketSchema.UpdateType()')
        }

        try {
          const res = await this.updateMany({ type: oldTypeId }, { $set: { type: newTypeId } }).exec()
          if (typeof callback === 'function') return callback(null, res)
          return resolve(res)
        } catch (e) {
          if (typeof callback === 'function') return callback(e)
          return reject(e)
        }
      })()
    })
  }

  public static getAssigned(
    this: ReturnModelType<typeof TicketClass>,
    userId: Types.ObjectId,
    callback: (err: Error | string | null, tickets?: any) => void
  ): any {
    if (_.isUndefined(userId)) return callback('Invalid Id - TicketSchema.GetAssigned()', null)

    const p = this.find({ assignee: userId, deleted: false })
      .populate('owner assignee comments.owner notes.owner subscribers history.owner', 'username fullname email role image title')
      .populate('type tags group status')
      .exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static async getTopTicketGroups(
    this: ReturnModelType<typeof TicketClass>,
    timespan: number,
    top: number,
    callback?: (result: any) => void
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      ;(async () => {
        if (_.isUndefined(timespan) || _.isNaN(timespan) || timespan === 0) timespan = -1
        if (_.isUndefined(top) || _.isNaN(top)) top = 5

        const today = moment.utc().hour(23).minute(59).second(59)
        const tsDate = today.clone().subtract(timespan, 'd')
        let queryFilter: any = { date: { $gte: tsDate.toDate(), $lte: today.toDate() }, deleted: false }
        if (timespan === -1) queryFilter = { deleted: false }

        const q = this.find(queryFilter).select('group').populate('group', 'name').lean()

        let topCount: any[] = []
        const ticketsDb: any[] = []

        try {
          const tickets = await q.exec()
          let arr: any[] = []

          for (const ticket of tickets) {
            if (ticket.group) {
              ticketsDb.push({ ticketId: ticket._id, groupId: (ticket.group as any)._id })
              const o = { _id: (ticket.group as any)._id, name: (ticket.group as any).name }
              if (!_.filter(arr, { name: o.name }).length) arr.push(o)
              arr = _.uniq(arr)
            }
          }

          for (const group of arr) {
            const ticketsArray = ticketsDb.filter(t => t.groupId === group._id)
            topCount.push({ name: group.name, count: ticketsArray.length })
          }

          topCount = _.sortBy(topCount, (o: any) => -o.count).slice(0, top)

          if (typeof callback === 'function') callback(topCount)
          return resolve(topCount)
        } catch (e: any) {
          if (typeof callback === 'function') callback(e)
          return reject(e)
        }
      })()
    })
  }

  public static getTagCount(
    this: ReturnModelType<typeof TicketClass>,
    tagId: Types.ObjectId,
    callback: (err: Error | string | null, count?: number) => void
  ): any {
    if (_.isUndefined(tagId)) return callback('Invalid Tag Id - TicketSchema.GetTagCount()')
    const p = this.countDocuments({ tags: tagId, deleted: false }).exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static getTypeCount(
    this: ReturnModelType<typeof TicketClass>,
    typeId: Types.ObjectId,
    callback: (err: Error | string | null, count?: number) => void
  ): any {
    if (_.isUndefined(typeId)) return callback('Invalid Type Id - TicketSchema.GetTypeCount()')
    const p = this.countDocuments({ type: typeId, deleted: false }).exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static getCount(
    this: ReturnModelType<typeof TicketClass>,
    callback: (err: Error | null, count?: number) => void
  ): any {
    const p = this.countDocuments({ deleted: false }).exec()
    return p.then(r => callback(null, r)).catch(e => callback(e))
  }

  public static async softDelete(
    this: ReturnModelType<typeof TicketClass>,
    oId: Types.ObjectId,
    callback: (err: Error | string | null, ticket?: any) => void
  ): Promise<any> {
    if (_.isUndefined(oId)) return callback('Invalid ObjectID - TicketSchema.SoftDelete()', null)
    try {
      const ticket = await this.findOneAndUpdate({ _id: oId }, { deleted: true }, { returnDocument: 'after' })
      return callback(null, ticket)
    } catch (err: any) {
      return callback(err, null)
    }
  }

  public static async softDeleteUid(
    this: ReturnModelType<typeof TicketClass>,
    uid: number,
    callback: (err: any, ticket?: any) => void
  ): Promise<any> {
    if (_.isUndefined(uid)) return callback({ message: 'Invalid UID - TicketSchema.SoftDeleteUid()' })
    try {
      const ticket = await this.findOneAndUpdate({ uid }, { deleted: true }, { returnDocument: 'after' })
      return callback(null, ticket)
    } catch (err: any) {
      return callback(err, null)
    }
  }

  public static async restoreDeleted(
    this: ReturnModelType<typeof TicketClass>,
    oId: Types.ObjectId,
    callback?: (err: Error | string | null, ticket?: any) => void
  ): Promise<any> {
    if (_.isUndefined(oId)) {
      if (typeof callback === 'function') return callback('Invalid ObjectID - TicketSchema.RestoreDeleted()', null)
      throw new Error('Invalid ObjectID - TicketSchema.RestoreDeleted()')
    }
    try {
      const ticket = await this.findOneAndUpdate({ _id: oId }, { deleted: false }, { returnDocument: 'after' })
      if (typeof callback === 'function') return callback(null, ticket)
      return ticket
    } catch (err: any) {
      if (typeof callback === 'function') return callback(err, null)
      throw err
    }
  }

  public static async getDeleted(this: ReturnModelType<typeof TicketClass>, callback: any): Promise<any> {
    try {
      const tickets = await this.find({ deleted: true }).populate('group').sort({ uid: -1 }).limit(1000)
      return callback(null, tickets)
    } catch (err: any) {
      return callback(err, null)
    }
  }

  public static async getTicketsPastDays(
    this: ReturnModelType<typeof TicketClass>,
    days?: number
  ): Promise<any[]> {
    if (!days) days = 30

    const today = moment().hour(23).minute(59).second(59)
    const lastX = today.clone().subtract(days, 'd')

    return this.find({ date: { $gte: lastX.toISOString() }, deleted: false })
      .populate('type tags group owner assignee')
      .populate('comments.owner')
      .lean()
      .sort({ status: 1 }) as any
  }
}
