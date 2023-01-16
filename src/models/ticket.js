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

const async = require('async')
const mongoose = require('mongoose')
const winston = require('../logger')
const _ = require('lodash')
const moment = require('moment')
const sanitizeHtml = require('sanitize-html')
// const redisCache          = require('../cache/rediscache');
const xss = require('xss')
const utils = require('../helpers/utils')

// Needed - For Population
const groupSchema = require('./group')
require('./tickettype')
const userSchema = require('./user')
const tcmSchema = tequre('./tcm')
const commentSchema = require('./comment')
const noteSchema = require('./note')
const attachmentSchema = require('./attachment')
const historySchema = require('./history')
require('./tag')
require('./ticketpriority')

const COLLECTION = 'tickets'

/**
 * Ticket Schema
 * @module models/ticket
 * @class Ticket
 * @requires {@link Group}
 * @requires {@link TicketType}
 * @requires {@link User}
 * @requires {@link Comment}
 * @requires {@link Attachment}
 * @requires {@link History}
 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {Number} uid ```Required``` ```unique``` Readable Ticket ID
 * @property {User} owner ```Required``` Reference to User Object. Owner of this Object.
 * @property {Group} group ```Required``` Group this Ticket is under.
 * @property {User} assignee User currently assigned to this Ticket.
 * @property {Date} date ```Required``` [default: Date.now] Date Ticket was created.
 * @property {Date} updated Date ticket was last updated
 * @property {Boolean} deleted ```Required``` [default: false] If they ticket is flagged as deleted.
 * @property {TicketType} type ```Required``` Reference to the TicketType
 * @property {Number} status ```Required``` [default: 0] Ticket Status. (See {@link Ticket#setStatus})
 * @property {Number} priority ```Required```
 * @property {Array} tags An array of Tags.
 * @property {String} subject ```Required``` The subject of the ticket. (Overview)
 * @property {String} issue ```Required``` Detailed information about the ticket problem/task
 * @property {Date} closedDate show the datetime the ticket was moved to status 3.
 * @property {Array} comments An array of {@link Comment} items
 * @property {Array} notes An array of {@link Comment} items for internal notes
 * @property {Array} attachments An Array of {@link Attachment} items
 * @property {Array} history An array of {@link History} items
 * @property {Array} subscribers An array of user _ids that receive notifications on ticket changes.
 */
const ticketSchema = mongoose.Schema({
  uid: { type: Number, unique: true, index: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'accounts'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'groups'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'accounts'
  },
  date: { type: Date, default: Date.now, required: true, index: true },
  updated: { type: Date },
  deleted: { type: Boolean, default: false, required: true, index: true },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'tickettypes'
  },
  status: { type: Number, default: 0, required: true, index: true },

  priority: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'priorities',
    required: true
  },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tags', autopopulate: true }],
  subject: { type: String, required: true },
  issue: { type: String, required: true },
  chatwootAccountID: {type: String},
  chatwootConversationID: {type: String},
  closedDate: { type: Date },
  dueDate: { type: Date },
  comments: [commentSchema],
  notes: [noteSchema],
  attachments: [attachmentSchema],
  history: [historySchema],
  checked: {type: Boolean,  default: false},
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'accounts' }]
})

ticketSchema.index({ deleted: -1, group: 1, status: 1 })

const autoPopulate = function (next) {
  this.populate('priority')

  return next()
}

ticketSchema.pre('findOne', autoPopulate).pre('find', autoPopulate)

ticketSchema.pre('save', function (next) {
  this.subject = utils.sanitizeFieldPlainText(this.subject.trim())
  this.wasNew = this.isNew

  if (!_.isUndefined(this.uid) || this.uid) {
    return next()
  }

  const c = require('./counters')
  const self = this
  c.increment('tickets', function (err, res) {
    if (err) return next(err)

    self.uid = res.value.next

    if (_.isUndefined(self.uid)) {
      const error = new Error('Invalid UID.')
      return next(error)
    }

    return next()
  })
})

ticketSchema.post('save', async function (doc, next) {
  if (!this.wasNew) {
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
          model: groupSchema,
          populate: [
            {
              path: 'members',
              model: userSchema,
              select: '-__v -accessToken -tOTPKey'
            },
            {
              path: 'sendMailTo',
              model: userSchema,
              select: '-__v -accessToken -tOTPKey'
            }
          ]
        }
      ])

      emitter.emit('ticket:updated', savedTicket)
    } catch (err) {
      winston.warn('WARNING: ' + err)
    }

    return next()
  } else {
    return next()
  }
})

ticketSchema.virtual('statusFormatted').get(function () {
  const s = this.status
  let formatted
  switch (s) {
    case 0:
      formatted = 'New'
      break
    case 1:
      formatted = 'Open'
      break
    case 2:
      formatted = 'Pending'
      break
    case 3:
      formatted = 'Closed'
      break
    default:
      formatted = 'New'
  }

  return formatted
})

ticketSchema.virtual('commentsAndNotes').get(function () {
  _.each(this.comments, function (i) {
    i.isComment = true
  })
  _.each(this.notes, function (i) {
    i.isNote = true
  })
  let combined = _.union(this.comments, this.notes)
  combined = _.sortBy(combined, 'date')

  return combined
})

/**
 * Set Status on Instanced Ticket
 * @instance
 * @method setStatus
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Number} status Status to set
 * @param {function} callback Callback with the updated ticket.
 *
 * @example
 * Status:
 *      0 - New
 *      1 - Open
 *      2 - Pending
 *      3 - Closed
 */
ticketSchema.methods.setStatus = function (ownerId, status, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    if (_.isUndefined(status)) {
      if (typeof callback === 'function') callback('Invalid Status', null)
      return reject(new Error('Invalid Status'))
    }

    self.closedDate = status === 3 ? new Date() : null
    self.status = status
    if (self.status == 3){
      tcmSchema.updateOne({ ticketId: self._id}, {users:[]}, (err)=>{
        if (err) console.log(err);
      })
    }
    const historyItem = {
      action: 'ticket:set:status:' + status,
      description: 'Ticket Status set to: ' + statusToString(status),
      owner: ownerId
    }

    self.history.push(historyItem)

    if (typeof callback === 'function') callback(null, self)

    return resolve(self)
  })
}

/**
 * Set Assignee on Instanced Ticket
 * @instance
 * @method setAssignee
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} userId User ID to set as assignee
 * @param {function} callback Callback with the updated ticket.
 */
ticketSchema.methods.setAssignee = function (ownerId, userId, callback) {
  if (_.isUndefined(userId)) return callback('Invalid User Id', null)
  const permissions = require('../permissions')
  const self = this

  self.assignee = userId
  userSchema.getUser(userId, function (err, user) {
    if (err) return callback(err, null)

    if (!permissions.canThis(user.role, 'tickets:update') && !permissions.canThis(user.role, 'agent:*')) {
      return callback('User does not have permission to be set as an assignee.', null)
    }

    const historyItem = {
      action: 'ticket:set:assignee',
      description: user.fullname + ' was set as assignee',
      owner: ownerId
    }

    self.history.push(historyItem)

    return callback(null, self)
  })
}

/**
 * Clear the current assignee
 * @instance
 * @method clearAssignee
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {function} callback Callback with the updated ticket.
 */
ticketSchema.methods.clearAssignee = function (ownerId, callback) {
  const self = this
  return new Promise(resolve => {
    self.assignee = undefined
    const historyItem = {
      action: 'ticket:set:assignee',
      description: 'Assignee was cleared',
      owner: ownerId
    }

    self.history.push(historyItem)

    if (typeof callback === 'function') callback(null, self)

    return resolve(self)
  })
}

/**
 * Sets the ticket type for the instanced Ticket
 * @instance
 * @method setTicketType
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} typeId TicketType Id to set as ticket type
 * @param {function} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketType = function (ownerId, typeId, callback) {
  const typeSchema = require('./tickettype')
  const self = this
  self.type = typeId
  typeSchema.findOne({ _id: typeId }, function (err, type) {
    if (err) return callback(err)
    if (!type) return callback('Invalid Type Id: ' + typeId)

    const historyItem = {
      action: 'ticket:set:type',
      description: 'Ticket type set to: ' + type.name,
      owner: ownerId
    }

    self.history.push(historyItem)

    if (typeof callback === 'function') return callback(null, self)
  })
}

/**
 * Sets the ticket priority
 * @instance
 * @method setTicketPriority
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Number} priority Priority to set
 * @param {function} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketPriority = function (ownerId, priority, callback) {
  if (_.isUndefined(priority) || !_.isObject(priority)) return callback('Priority must be a PriorityObject.', null)

  const self = this
  self.priority = priority._id
  const historyItem = {
    action: 'ticket:set:priority',
    description: 'Ticket Priority set to: ' + priority.name,
    owner: ownerId
  }
  self.history.push(historyItem)

  self
    .populate(['priority'])
    .then(function (updatedSelf) {
      return callback(null, updatedSelf)
    })
    .catch(function (err) {
      return callback(err, null)
    })
}

/**
 * Sets this ticket under the given group Id
 * @instance
 * @method setTicketGroup
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} groupId MongoDB group Id to assign this ticket to
 * @param {function} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketGroup = function (ownerId, groupId, callback) {
  const self = this
  self.group = groupId

  self.populate('group', function (err, ticket) {
    if (err) return callback(err)

    const historyItem = {
      action: 'ticket:set:group',
      description: 'Ticket Group set to: ' + ticket.group.name,
      owner: ownerId
    }
    self.history.push(historyItem)

    return callback(null, ticket)
  })
}

ticketSchema.methods.setTicketDueDate = function (ownerId, dueDate, callback) {
  const self = this
  self.dueDate = dueDate

  const historyItem = {
    action: 'ticket:set:duedate',
    description: 'Ticket Due Date set to: ' + self.dueDate,
    owner: ownerId
  }

  self.history.push(historyItem)

  return callback(null, self)
}

/**
 * Sets this ticket's issue text
 * @instance
 * @method setIssue
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} issue Issue text to set on the ticket
 * @param {function} callback Callback with the updated ticket.
 * @example
 * ticket.setIssue({ownerId}, 'This is the new issue string.', function(err, t) {
 *    if (err) throw err;
 *
 *    ticket.save(function(err, t) {
 *       if (err) throw err;
 *    });
 * });
 */
ticketSchema.methods.setIssue = function (ownerId, issue, callback) {
  const marked = require('marked')
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

    self.history.push(historyItem)

    if (typeof callback === 'function') callback(null, self)

    return resolve(self)
  })
}

ticketSchema.methods.setSubject = function (ownerId, subject, callback) {
  const self = this
  return new Promise(resolve => {
    self.subject = subject
    const historyItem = {
      action: 'ticket:update:subject',
      description: 'Ticket Subject was updated.',
      owner: ownerId
    }

    self.history.push(historyItem)

    if (typeof callback === 'function') callback(null, self)

    return resolve(self)
  })
}

/**
 * Updates a given comment inside the comment array on this ticket
 * @instance
 * @method updateComment
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} commentId Comment ID to update
 * @param {String} commentText Text to update the comment to
 * @param {function} callback Callback with the updated ticket.
 * @example
 * ticket.updateComment({ownerId}, {commentId} 'This is the new comment string.', function(err, t) {
 *    if (err) throw err;
 *
 *    ticket.save(function(err, t) {
 *       if (err) throw err;
 *    });
 * });
 */
ticketSchema.methods.updateComment = function (ownerId, commentId, commentText, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    const comment = _.find(self.comments, function (c) {
      return c._id.toString() === commentId.toString()
    })

    if (_.isUndefined(comment)) {
      if (typeof callback === 'function') callback('Invalid Comment', null)
      return reject(new Error('Invalid Comment'))
    }

    comment.comment = commentText

    const historyItem = {
      action: 'ticket:comment:updated',
      description: 'Comment was updated: ' + commentId,
      owner: ownerId
    }
    self.history.push(historyItem)

    if (typeof callback === 'function') callback(null, self)

    return resolve(self)
  })
}

/**
 * Removes a comment from the comment array on this ticket.
 * @instance
 * @method removeComment
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} commentId Comment ID to remove
 * @param {function} callback Callback with the updated ticket.
 */
ticketSchema.methods.removeComment = function (ownerId, commentId, callback) {
  const self = this
  return new Promise(resolve => {
    self.comments = _.reject(self.comments, function (o) {
      return o._id.toString() === commentId.toString()
    })

    const historyItem = {
      action: 'ticket:delete:comment',
      description: 'Comment was deleted: ' + commentId,
      owner: ownerId
    }

    self.history.push(historyItem)

    if (typeof callback === 'function') callback(null, self)

    return resolve(self)
  })
}

/**
 * Updates a given Note inside the note array on this ticket
 * @instance
 * @method updateNote
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} noteId Note ID to update
 * @param {String} noteText Text to update the note to
 * @param {function} callback Callback with the updated ticket.
 * @example
 * ticket.updateNote({ownerId}, {noteId} 'This is the new note string.', function(err, t) {
 *    if (err) throw err;
 *
 *    ticket.save(function(err, t) {
 *       if (err) throw err;
 *    });
 * });
 */
ticketSchema.methods.updateNote = function (ownerId, noteId, noteText, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    const note = _.find(self.notes, function (c) {
      return c._id.toString() === noteId.toString()
    })
    if (_.isUndefined(note)) {
      if (typeof callback === 'function') callback('Invalid Note', null)
      return reject(new Error('Invalid Note'))
    }

    note.note = noteText

    const historyItem = {
      action: 'ticket:note:updated',
      description: 'Note was updated: ' + noteId,
      owner: ownerId
    }
    self.history.push(historyItem)

    if (typeof callback === 'function') callback(null, self)

    return resolve(self)
  })
}

/**
 * Removes a note from the note array on this ticket.
 * @instance
 * @method removeNote
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} noteId Comment ID to remove
 * @param {function} callback Callback with the updated ticket.
 */
ticketSchema.methods.removeNote = function (ownerId, noteId, callback) {
  const self = this
  return new Promise(resolve => {
    self.notes = _.reject(self.notes, function (o) {
      return o._id.toString() === noteId.toString()
    })

    const historyItem = {
      action: 'ticket:delete:note',
      description: 'Note was deleted: ' + noteId,
      owner: ownerId
    }
    self.history.push(historyItem)

    if (typeof callback === 'function') callback(null, self)

    return resolve(self)
  })
}

ticketSchema.methods.getAttachment = function (attachmentId, callback) {
  const self = this
  const attachment = _.find(self.attachments, function (o) {
    return o._id.toString() === attachmentId.toString()
  })

  return callback(attachment)
}

ticketSchema.methods.removeAttachment = function (ownerId, attachmentId, callback) {
  const self = this
  const attachment = _.find(self.attachments, function (o) {
    return o._id.toString() === attachmentId.toString()
  })
  self.attachments = _.reject(self.attachments, function (o) {
    return o._id.toString() === attachmentId.toString()
  })

  if (_.isUndefined(attachment)) {
    return callback(null, self)
  }

  const historyItem = {
    action: 'ticket:delete:attachment',
    description: 'Attachment was deleted: ' + attachment.name,
    owner: ownerId
  }

  self.history.push(historyItem)

  return callback(null, self)
}

ticketSchema.methods.addSubscriber = function (userId, callback) {
  const self = this

  const hasSub = _.some(self.subscribers, function (i) {
    return i._id.toString() === userId.toString()
  })

  if (!hasSub) {
    self.subscribers.push(userId)
  }

  return callback(null, self)
}

ticketSchema.methods.removeSubscriber = function (userId, callback) {
  const self = this

  const user = _.find(self.subscribers, function (i) {
    return i._id.toString() === userId.toString()
  })

  if (_.isUndefined(user) || _.isEmpty(user) || _.isNull(user)) return callback(null, self)

  self.subscribers = _.reject(self.subscribers, function (i) {
    return i._id.toString() === userId.toString()
  })

  return callback(null, self)
}

/**
 * Gets all tickets that are not marked as deleted <br> <br>
 *
 * **Deep populates: group, group.members, group.sendMailTo, comments, comments.owner**
 *
 * @memberof Ticket
 * @static
 * @method getAll
 * @param {function} callback MongoDB Query Callback
 *
 * @example
 * ticketSchema.getAll(function(err, tickets) {
 *    if (err) throw err;
 *
 *    //tickets is an array
 * });
 */
ticketSchema.statics.getAll = function (callback) {
  const self = this
  const q = self
    .model(COLLECTION)
    .find({ deleted: false })
    .populate('owner assignee', '-password -__v -preferences -iOSDeviceTokens -tOTPKey')
    .populate('type tags group')
    .sort({ status: 1 })
    .lean()

  return q.exec(callback)
}

ticketSchema.statics.getForCache = function (callback) {
  const self = this
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const t365 = moment
          .utc()
          .hour(23)
          .minute(59)
          .second(50)
          .subtract(365, 'd')
          .toDate()

        const query = self
          .model(COLLECTION)
          .find({ date: { $gte: t365 }, deleted: false })
          .sort('date')
          .lean()

        if (typeof callback === 'function') return query.exec(callback)

        const results = await query.exec()

        return resolve(results)
      } catch (err) {
        if (typeof callback === 'function') return callback(err)

        return reject(err)
      }
    })()
  })
}

ticketSchema.statics.getAllNoPopulate = function (callback) {
  const self = this
  const q = self
    .model(COLLECTION)
    .find({ deleted: false })
    .sort({ status: 1 })
    .lean()

  return q.exec(callback)
}

ticketSchema.statics.getAllByStatus = function (status, callback) {
  const self = this

  if (!_.isArray(status)) {
    status = [status]
  }

  const q = self
    .model(COLLECTION)
    .find({ status: { $in: status }, deleted: false })
    .populate(
      'owner assignee comments.owner notes.owner subscribers history.owner',
      'username fullname email role image title'
    )
    .populate('type tags group')
    .sort({ status: 1 })
    .lean()

  return q.exec(callback)
}

/**
 * Gets Tickets with a given group id.
 *
 * @memberof Ticket
 * @static
 * @method getTickets
 * @param {Array} grpIds Group Id to retrieve tickets for.
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getTickets = function (grpIds, callback) {
  if (_.isUndefined(grpIds)) {
    return callback('Invalid GroupId - TicketSchema.GetTickets()', null)
  }

  if (!_.isArray(grpIds)) {
    return callback('Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()', null)
  }

  const self = this

  const q = self
    .model(COLLECTION)
    .find({ group: { $in: grpIds }, deleted: false })
    .populate(
      'owner assignee comments.owner notes.owner subscribers history.owner',
      'username fullname email role image title'
    )
    .populate('type tags group')
    .sort({ status: 1 })

  return q.exec(callback)
}

/**
 * Gets Tickets with a given departments and a JSON Object <br/><br/>
 * *Sorts on UID desc.*
 * @memberof Ticket
 * @static
 * @method getTicketsByDepartments
 *
 * @param {Object} departments Departments to retrieve tickets for.
 * @param {Object} object JSON Object with query options
 * @param {function} callback MongoDB Query Callback
 *
 * @example
 * //Object Options
 * {
 *    limit: 10,
 *    page: 0,
 *    closed: false,
 *    status: 1
 * }
 */
ticketSchema.statics.getTicketsByDepartments = function (departments, object, callback) {
  if (!departments || !_.isObject(departments) || !object)
    return callback('Invalid Data - TicketSchema.GetTicketsByDepartments()')

  const self = this

  if (_.some(departments, { allGroups: true })) {
    groupSchema.find({}, function (err, groups) {
      if (err) return callback({ error: err })
      return self.getTicketsWithObject(groups, object, callback)
    })
  } else {
    const groups = _.flattenDeep(
      departments.map(function (d) {
        return d.groups.map(function (g) {
          return g._id
        })
      })
    )

    return self.getTicketsWithObject(groups, object, callback)
  }
}

function buildQueryWithObject (SELF, grpId, object, count) {
  const limit = object.limit || 10
  const page = object.page || 0
  let _status = object.status

  // Check up on status formatting
  if (_.isArray(_status)) {
    // This is a hack - querystring adds status in the array as [ "1,2,3" ]
    // This will convert the array to [ "1", "2", "3" ]
    _status = _.join(_status, ',').split(',')
  }

  if (object.filter && object.filter.groups)
    grpId = _.intersection(
      object.filter.groups,
      _.map(grpId, g => g._id.toString())
    )

  let query
  if (count) query = SELF.model(COLLECTION).countDocuments({ groups: { $in: grpId }, deleted: false })
  else {
    query = SELF.model(COLLECTION)
      .find({ group: { $in: grpId }, deleted: false })
      .populate(
        'owner assignee subscribers comments.owner notes.owner history.owner',
        'username fullname email role image title'
      )
      .populate('assignee', 'username fullname email role image title')
      .populate('type tags group')
      .sort({ uid: -1 })
  }

  // Query with Limit?
  if (limit !== -1) query.skip(page * limit).limit(limit)
  // Status Query
  if (_.isArray(_status) && _status.length > 0) {
    query.where({ status: { $in: _status } })
  }

  // Filter Query
  if (object.filter) {
    // Filter on UID
    if (object.filter.uid) {
      object.filter.uid = parseInt(object.filter.uid)
      if (!_.isNaN(object.filter.uid)) query.or([{ uid: object.filter.uid }])
    }

    // Priority Filter
    if (object.filter.priority) query.where({ priority: { $in: object.filter.priority } })

    // Ticket Type Filter
    if (object.filter.types) query.where({ type: { $in: object.filter.types } })

    // Tags Filter
    if (object.filter.tags) query.where({ tags: { $in: object.filter.tags } })

    // Assignee Filter
    if (object.filter.assignee) query.where({ assignee: { $in: object.filter.assignee } })

    // Unassigned Filter
    if (object.filter.unassigned) query.where({ assignee: { $exists: false } })

    // Owner Filter
    if (object.filter.owner) query.where({ owner: { $in: object.filter.owner } })

    // Subject Filter
    if (object.filter.subject) query.or([{ subject: new RegExp(object.filter.subject, 'i') }])

    // Issue Filter
    if (object.filter.issue) query.or([{ issue: new RegExp(object.filter.issue, 'i') }])

    // Date Filter
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

ticketSchema.statics.getTicketsWithObject = async function (grpId, object, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        if (!grpId || !_.isArray(grpId) || !_.isObject(object))
          throw new Error('Invalid parameter in - TicketSchema.GetTicketsWithObject()')

        const query = buildQueryWithObject(self, grpId, object)

        if (typeof callback === 'function') return query.exec(callback)

        const resTickets = await query.exec()

        return resolve(resTickets)
      } catch (e) {
        if (typeof callback === 'function') return callback(e)

        return reject(e)
      }
    })()
  })
}

ticketSchema.statics.getCountWithObject = async function (grpId, object, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        if (!grpId || !_.isArray(grpId) || !_.isObject(object))
          throw new Error('Invalid parameter in - TicketSchema.GetCountWithObject()')

        const query = buildQueryWithObject(self, grpId, object, true)

        if (typeof callback === 'function') return query.lean().exec(callback)

        const count = await query.lean().exec()

        return resolve(count)
      } catch (e) {
        if (typeof callback === 'function') return callback(e)

        return reject(e)
      }
    })()
  })
}

/**
 * Gets Tickets for status in given group. <br/><br/>
 * *Sorts on UID desc*
 * @memberof Ticket
 * @static
 * @method getTicketsByStatus
 *
 * @param {Object} grpId Group Id to retrieve tickets for.
 * @param {Number} status Status number to check
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketsByStatus = function (grpId, status, callback) {
  if (_.isUndefined(grpId)) {
    return callback('Invalid GroupId - TicketSchema.GetTickets()', null)
  }

  if (!_.isArray(grpId)) {
    return callback('Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()', null)
  }

  const self = this

  const q = self
    .model(COLLECTION)
    .find({ group: { $in: grpId }, status, deleted: false })
    .populate(
      'owner assignee comments.owner notes.owner subscribers history.owner',
      'username fullname email role image title'
    )
    .populate('type tags group')
    .sort({ uid: -1 })

  return q.exec(callback)
}

/**
 * Gets Single ticket with given UID.
 * @memberof Ticket
 * @static
 * @method getTicketByUid
 *
 * @param {Number} uid Unique Id for ticket.
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketByUid = function (uid, callback) {
  if (_.isUndefined(uid)) return callback('Invalid Uid - TicketSchema.GetTicketByUid()', null)

  const self = this

  const q = self
    .model(COLLECTION)
    .findOne({ uid, deleted: false })
    .populate(
      'owner assignee comments.owner notes.owner subscribers history.owner',
      'username fullname email role image title'
    )
    .populate('type tags group')

  return q.exec(callback)
}

/**
 * Gets Single ticket with given object _id.
 * @memberof Ticket
 * @static
 * @method getTicketById
 *
 * @param {Object} id MongoDb _id.
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketById = async function (id, callback) {
  const self = this

  return new Promise((resolve, reject) => {
    ;(async () => {
      if (_.isUndefined(id)) {
        const error = new Error('Invalid Id - TicketSchema.GetTicketById()')

        if (typeof callback === 'function') return callback(error, null)

        return reject(error)
      }

      const q = self
        .model(COLLECTION)
        .findOne({ _id: id, deleted: false })
        .populate(
          'owner assignee comments.owner notes.owner subscribers history.owner',
          'username fullname email role image title'
        )
        .populate('type tags')
        .populate({
          path: 'group',
          model: groupSchema,
          populate: [
            {
              path: 'members',
              model: userSchema,
              select: '-__v -iOSDeviceTokens -accessToken -tOTPKey'
            },
            {
              path: 'sendMailTo',
              model: userSchema,
              select: '-__v -iOSDeviceTokens -accessToken -tOTPKey'
            }
          ]
        })

      try {
        const result = await q.exec(callback)

        return resolve(result)
      } catch (e) {
        if (typeof callback === 'function') callback(e)

        return reject(e)
      }
    })()
  })
}

/**
 * Gets tickets by given Requester User Id
 * @memberof Ticket
 * @static
 * @method getTicketsByRequester
 *
 * @param {Object} userId MongoDb _id of user.
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketsByRequester = function (userId, callback) {
  if (_.isUndefined(userId)) return callback('Invalid Requester Id - TicketSchema.GetTicketsByRequester()', null)

  const self = this

  const q = self
    .model(COLLECTION)
    .find({ owner: userId, deleted: false })
    .limit(10000)
    .populate(
      'owner assignee comments.owner notes.owner subscribers history.owner',
      'username fullname email role image title'
    )
    .populate('type tags')
    .populate({
      path: 'group',
      model: groupSchema,
      populate: [
        {
          path: 'members',
          model: userSchema,
          select: '-__v -iOSDeviceTokens -accessToken -tOTPKey'
        },
        {
          path: 'sendMailTo',
          model: userSchema,
          select: '-__v -iOSDeviceTokens -accessToken -tOTPKey'
        }
      ]
    })

  return q.exec(callback)
}

ticketSchema.statics.getTicketsWithSearchString = function (grps, search, callback) {
  if (_.isUndefined(grps) || _.isUndefined(search))
    return callback('Invalid Post Data - TicketSchema.GetTicketsWithSearchString()', null)

  const self = this

  const tickets = []

  async.parallel(
    [
      function (callback) {
        const q = self
          .model(COLLECTION)
          .find({
            group: { $in: grps },
            deleted: false,
            $where: '/^' + search + '.*/.test(this.uid)'
          })
          .populate(
            'owner assignee comments.owner notes.owner subscribers history.owner',
            'username fullname email role image title'
          )
          .populate('type tags group')
          .limit(100)

        q.exec(function (err, results) {
          if (err) return callback(err)
          tickets.push(results)

          return callback(null)
        })
      },
      function (callback) {
        const q = self
          .model(COLLECTION)
          .find({
            group: { $in: grps },
            deleted: false,
            subject: { $regex: search, $options: 'i' }
          })
          .populate(
            'owner assignee comments.owner notes.owner subscribers history.owner',
            'username fullname email role image title'
          )
          .populate('type tags group')
          .limit(100)

        q.exec(function (err, results) {
          if (err) return callback(err)
          tickets.push(results)

          return callback(null)
        })
      },
      function (callback) {
        const q = self
          .model(COLLECTION)
          .find({
            group: { $in: grps },
            deleted: false,
            issue: { $regex: search, $options: 'i' }
          })
          .populate(
            'owner assignee comments.owner notes.owner subscribers history.owner',
            'username fullname email role image title'
          )
          .populate('type tags group')
          .limit(100)

        q.exec(function (err, results) {
          if (err) return callback(err)
          tickets.push(results)

          return callback(null)
        })
      }
    ],
    function (err) {
      if (err) return callback(err, null)

      const t = _.uniqBy(_.flatten(tickets), function (i) {
        return i.uid
      })

      return callback(null, t)
    }
  )
}

/**
 * Gets tickets that are overdue
 * @memberof Ticket
 * @static
 * @method getOverdue
 *
 * @param {Array} grpId Group Array of User
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getOverdue = function (grpId, callback) {
  if (_.isUndefined(grpId)) return callback('Invalid Group Ids - TicketSchema.GetOverdue()', null)

  const self = this

  // Disable cache (TEMP 01/04/2019)
  // const grpHash = hash(grpId);
  // const cache = global.cache;
  // if (cache) {
  //     const overdue = cache.get('tickets:overdue:' + grpHash);
  //     if (overdue)
  //         return callback(null, overdue);
  // }

  async.waterfall(
    [
      function (next) {
        return self
          .model(COLLECTION)
          .find({
            group: { $in: grpId },
            status: { $in: [0, 1] },
            deleted: false
          })
          .select('_id date updated')
          .lean()
          .exec(next)
      },
      function (tickets, next) {
        const t = _.map(tickets, function (i) {
          return _.transform(
            i,
            function (result, value, key) {
              if (key === '_id') result._id = value
              if (key === 'priority') result.overdueIn = value.overdueIn
              if (key === 'date') result.date = value
              if (key === 'updated') result.updated = value
            },
            {}
          )
        })

        return next(null, t)
      },
      function (tickets, next) {
        const now = new Date()
        let ids = _.filter(tickets, function (t) {
          if (!t.date && !t.updated) {
            return false
          }

          let timeout
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
      function (ids, next) {
        return self
          .model(COLLECTION)
          .find({ _id: { $in: ids } })
          .limit(50)
          .select('_id uid subject updated date')
          .lean()
          .exec(next)
      }
    ],
    function (err, tickets) {
      if (err) return callback(err, null)
      // Disable cache (TEMP 01/04/2019)
      // if (cache) cache.set('tickets:overdue:' + grpHash, tickets, 600); //10min

      return callback(null, tickets)
    }
  )

  // const q = self.model(COLLECTION).find({group: {$in: grpId}, status: {$in: [0,1]}, deleted: false})
  //     .$where(function() {
  //         return this.priority.overdueIn === undefined;
  //         const now = new Date();
  //         const timeout = null;
  //         if (this.updated) {
  //             timeout = new Date(this.updated);
  //             timeout.setMinutes(timeout.getMinutes() + this.priority.overdueIn);
  //         } else {
  //             timeout = new Date(this.date);
  //             timeout.setMinutes(timeout.getMinutes() + this.priority.overdueIn);
  //         }
  //         return now > timeout;
  //     }).select('_id uid subject updated');
  //
  // q.lean().exec(function(err, results) {
  //     if (err) return callback(err, null);
  //     if (cache) cache.set('tickets:overdue:' + grpHash, results, 600); //10min
  //
  //     return callback(null, results);
  // });

  // TODO: Turn on when REDIS is impl
  // This will be pres through server reload
  // redisCache.getCache('$trudesk:tickets:overdue' + grpHash, function(err, value) {
  //     if (err) return callback(err, null);
  //     if (value) {
  //         console.log('served from redis');
  //         return callback(null, JSON.parse(value.data));
  //     } else {
  //         const q = self.model(COLLECTION).find({group: {$in: grpId}, status: 1, deleted: false})
  //             .$where(function() {
  //                 const now = new Date();
  //                 const updated = new Date(this.updated);
  //                 const timeout = new Date(updated);
  //                 timeout.setDate(timeout.getDate() + 2);
  //                 return now > timeout;
  //             }).select('_id uid subject updated');
  //
  //         return q.lean().exec(function(err, results) {
  //             if (err) return callback(err, null);
  //             if (cache) {
  //                 cache.set('tickets:overdue:' + grpHash, results, 600);
  //             }
  //             redisCache.setCache('tickets:' + grpHash, results, function(err) {
  //                 return callback(err, results);
  //             }, 600);
  //         });
  //     }
  // });
}

/**
 * Gets tickets via tag id
 * @memberof Ticket
 * @static
 * @method getTicketsByTag
 *
 * @param {Array} grpId Group Array of User
 * @param {string} tagId Tag Id
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketsByTag = function (grpId, tagId, callback) {
  if (_.isUndefined(grpId)) return callback('Invalid Group Ids - TicketSchema.GetTicketsByTag()', null)
  if (_.isUndefined(tagId)) return callback('Invalid Tag Id - TicketSchema.GetTicketsByTag()', null)

  const self = this

  const q = self.model(COLLECTION).find({ group: { $in: grpId }, tags: tagId, deleted: false })

  return q.exec(callback)
}

/**
 * Gets all tickets via tag id
 * @memberof Ticket
 * @static
 * @method getAllTicketsByTag
 *
 * @param {string} tagId Tag Id
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getAllTicketsByTag = function (tagId, callback) {
  if (_.isUndefined(tagId)) return callback('Invalid Tag Id - TicketSchema.GetAllTicketsByTag()', null)

  const self = this

  const q = self.model(COLLECTION).find({ tags: tagId, deleted: false })

  return q.exec(callback)
}

/**
 * Gets tickets via type id
 * @memberof Ticket
 * @static
 * @method getTicketsByType
 *
 * @param {Array} grpId Group Array of User
 * @param {string} typeId Type Id
 * @param {function} callback MongoDB Query Callback
 * @param {Boolean} limit Should Limit results?
 */
ticketSchema.statics.getTicketsByType = function (grpId, typeId, callback, limit) {
  if (_.isUndefined(grpId)) return callback('Invalid Group Ids = TicketSchema.GetTicketsByType()', null)
  if (_.isUndefined(typeId)) return callback('Invalid Ticket Type Id - TicketSchema.GetTicketsByType()', null)

  const self = this

  const q = self.model(COLLECTION).find({ group: { $in: grpId }, type: typeId, deleted: false })
  if (limit) {
    q.limit(1000)
  }

  return q.lean().exec(callback)
}

/**
 * Gets all tickets via type id
 * @memberof Ticket
 * @static
 * @method getAllTicketsByType
 *
 * @param {string} typeId Type Id
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.getAllTicketsByType = function (typeId, callback) {
  if (_.isUndefined(typeId)) return callback('Invalid Ticket Type Id - TicketSchema.GetAllTicketsByType()', null)

  const self = this
  const q = self.model(COLLECTION).find({ type: typeId })

  return q.lean().exec(callback)
}

ticketSchema.statics.updateType = function (oldTypeId, newTypeId, callback) {
  if (_.isUndefined(oldTypeId) || _.isUndefined(newTypeId)) {
    return callback('Invalid IDs - TicketSchema.UpdateType()', null)
  }

  const self = this
  return self.model(COLLECTION).updateMany({ type: oldTypeId }, { $set: { type: newTypeId } }, callback)
}

ticketSchema.statics.getAssigned = function (userId, callback) {
  if (_.isUndefined(userId)) return callback('Invalid Id - TicketSchema.GetAssigned()', null)

  const self = this

  const q = self
    .model(COLLECTION)
    .find({ assignee: userId, deleted: false, status: { $ne: 3 } })
    .populate(
      'owner assignee comments.owner notes.owner subscribers history.owner',
      'username fullname email role image title'
    )
    .populate('type tags group')

  return q.exec(callback)
}

/**
 * Gets count of X Top Groups
 *
 * @memberof Ticket
 * @static
 * @method getTopTicketGroups
 *
 * @param {Number} timespan Timespan to get the top groups (default: 9999)
 * @param {Number} top Top number of Groups to return (default: 5)
 * @param {function} callback MongoDB Query Callback
 * @example
 * ticketSchema.getTopTicketGroups(5, function(err, results) {
 *    if (err) throw err;
 *
 *    //results is an array with name of group and count of total tickets
 *    results[x].name
 *    results[x].count
 * });
 */
ticketSchema.statics.getTopTicketGroups = function (timespan, top, callback) {
  if (_.isUndefined(timespan) || _.isNaN(timespan) || timespan === 0) timespan = -1
  if (_.isUndefined(top) || _.isNaN(top)) top = 5

  const self = this

  const today = moment
    .utc()
    .hour(23)
    .minute(59)
    .second(59)
  const tsDate = today.clone().subtract(timespan, 'd')
  let query = {
    date: { $gte: tsDate.toDate(), $lte: today.toDate() },
    deleted: false
  }
  if (timespan === -1) {
    query = { deleted: false }
  }

  const q = self
    .model(COLLECTION)
    .find(query)
    .select('group')
    .populate('group', 'name')
    .lean()

  let topCount = []
  const ticketsDb = []

  async.waterfall(
    [
      function (next) {
        q.exec(function (err, t) {
          if (err) return next(err)

          const arr = []

          for (let i = 0; i < t.length; i++) {
            const ticket = t[i]
            if (ticket.group) {
              ticketsDb.push({
                ticketId: ticket._id,
                groupId: ticket.group._id
              })
              const o = {}
              o._id = ticket.group._id
              o.name = ticket.group.name

              if (!_.filter(arr, { name: o.name }).length) {
                arr.push(o)
              }
            }
          }

          return next(null, _.uniq(arr))
        })
      },
      function (grps, next) {
        for (let g = 0; g < grps.length; g++) {
          const tickets = []
          const grp = grps[g]
          for (let i = 0; i < ticketsDb.length; i++) {
            if (ticketsDb[i].groupId === grp._id) {
              tickets.push(ticketsDb)
            }
          }

          topCount.push({ name: grp.name, count: tickets.length })
        }

        topCount = _.sortBy(topCount, function (o) {
          return -o.count
        })

        topCount = topCount.slice(0, top)

        return next(null, topCount)
      }
    ],
    function (err, result) {
      if (err) return callback(err, null)

      return callback(null, result)
    }
  )
}

ticketSchema.statics.getTagCount = function (tagId, callback) {
  if (_.isUndefined(tagId)) return callback('Invalid Tag Id - TicketSchema.GetTagCount()', null)

  const self = this

  const q = self.model(COLLECTION).countDocuments({ tags: tagId, deleted: false })

  return q.exec(callback)
}

ticketSchema.statics.getTypeCount = function (typeId, callback) {
  if (_.isUndefined(typeId)) return callback('Invalid Type Id - TicketSchema.GetTypeCount()', null)

  const self = this

  const q = self.model(COLLECTION).countDocuments({ type: typeId, deleted: false })

  return q.exec(callback)
}

ticketSchema.statics.getCount = function (callback) {
  const q = this.model(COLLECTION)
    .countDocuments({ deleted: false })
    .lean()
  return q.exec(callback)
}

/**
 * Mark a ticket as deleted in MongoDb <br/><br/>
 * *Ticket has its ```deleted``` flag set to true*
 *
 * @memberof Ticket
 * @static
 * @method softDelete
 *
 * @param {Object} oId Ticket Object _id
 * @param {function} callback MongoDB Query Callback
 */
ticketSchema.statics.softDelete = function (oId, callback) {
  if (_.isUndefined(oId)) return callback('Invalid ObjectID - TicketSchema.SoftDelete()', null)

  const self = this

  return self.model(COLLECTION).findOneAndUpdate({ _id: oId }, { deleted: true }, { new: true }, callback)
}

ticketSchema.statics.softDeleteUid = function (uid, callback) {
  if (_.isUndefined(uid)) return callback({ message: 'Invalid UID - TicketSchema.SoftDeleteUid()' })

  return this.model(COLLECTION).findOneAndUpdate({ uid }, { deleted: true }, { new: true }, callback)
}

ticketSchema.statics.restoreDeleted = function (oId, callback) {
  if (_.isUndefined(oId)) return callback('Invalid ObjectID - TicketSchema.RestoreDeleted()', null)

  const self = this

  return self.model(COLLECTION).findOneAndUpdate({ _id: oId }, { deleted: false }, { new: true }, callback)
}

ticketSchema.statics.getDeleted = function (callback) {
  return this.model(COLLECTION)
    .find({ deleted: true })
    .populate('group')
    .sort({ uid: -1 })
    .limit(1000)
    .exec(callback)
}

function statusToString (status) {
  let str
  switch (status) {
    case 0:
      str = 'New'
      break
    case 1:
      str = 'Open'
      break
    case 2:
      str = 'Pending'
      break
    case 3:
      str = 'Closed'
      break
    default:
      str = status
      break
  }

  return str
}

module.exports = mongoose.model(COLLECTION, ticketSchema)
