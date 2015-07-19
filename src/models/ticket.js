/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

var mongoose            = require('mongoose');
var _                   = require('underscore');
var deepPopulate        = require('mongoose-deep-populate');
var moment              = require('moment');

//Needed!
var groupSchema         = require('./group');
var ticketTypeSchema    = require('./tickettype');
var userSchema          = require('./user');
var commentSchema       = require('./comment');
var attachmentSchema    = require('./attachment');
var historySchema       = require('./history');

var COLLECTION = 'tickets';

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
 * @property {Number} status ```Required``` Ticket Status. (See {@link Ticket#setStatus})
 * @property {Number} prioirty ```Required```
 * @property {Array} tags An array of Strings.
 * @property {String} subject ```Required``` The subject of the ticket. (Overview)
 * @property {String} issue ```Required``` Detailed information about the ticket problem/task
 * @property {Date} closedDate show the datetime the ticket was moved to status 3.
 * @property {Array} comments An array of {@link Comment} items
 * @property {Array} attachments An Array of {@link Attachment} items
 * @property {Array} histor An array of {@link History} items
 */
var ticketSchema = mongoose.Schema({
    uid:        { type: Number, unique: true},
    owner:      { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'accounts' },
    group:      { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'groups' },
    assignee:   { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
    date:       { type: Date, default: Date.now, required: true },
    updated:    { type: Date},
    deleted:    { type: Boolean, default: false, required: true },
    type:       { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'tickettypes' },
    status:     { type: Number, required: true },
    priority:   { type: Number, required: true },
    tags:       [String],
    subject:    { type: String, required: true },
    issue:      { type: String, required: true },
    closedDate: { type: Date },
    comments:   [commentSchema],
    attachments:[attachmentSchema],
    history:    [historySchema]
});

ticketSchema.plugin(deepPopulate);

ticketSchema.pre('save', function(next) {
    if (!_.isUndefined(this.uid) || this.uid) return next();

    var c = require('./counters');
    var self = this;
    c.increment('tickets', function(err, res) {
        if (err) return next(err);

        self.uid = res.value.next;

        if (_.isUndefined(self.uid)) {
            var error = new Error('Invalid UID.');
            return next(error);
        }

        return next();
    });
});

/**
 * Set Status on Instanced Ticket
 * @instance
 * @method setStatus
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Number} status Status to set
 * @param {TicketCallback} callback Callback with the updated ticket.
 *
 * @example
 * Status:
 *      0 - New
 *      1 - Open
 *      2 - Pending
 *      3 - Closed
 */
ticketSchema.methods.setStatus = function(ownerId, status, callback) {
    if (_.isUndefined(status)) return callback('Invalid Status', null);

    var self = this;

    if (status === 3) {
        self.closedDate = new Date();
    } else {
        self.closedDate = null;
    }

    self.status = status;
    var historyItem = {
        action: 'ticket:set:status',
        description: 'Ticket Status set to: ' + status,
        owner: ownerId
    };
    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Set Assignee on Instanced Ticket
 * @instance
 * @method setAssignee
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} userId User ID to set as assignee
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.setAssignee = function(ownerId, userId, callback) {
    if (_.isUndefined(userId)) return callback('Invalid User Id', null);
    var self = this;

    self.assignee = userId;
    userSchema.getUser(userId, function(err, user) {
        if (err) return callback(err, null);

        var historyItem = {
            action: 'ticket:set:assignee',
            description: user.username + ' was set as assignee',
            owner: ownerId
        };

        self.history.push(historyItem);

        callback(null, self);
    });
};

/**
 * Clear the current assignee
 * @instance
 * @method clearAssignee
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.clearAssignee = function(ownerId, callback) {
    var self = this;
    self.assignee = undefined;
    var historyItem = {
        action: 'ticket:set:assignee',
        description: 'Assignee was cleared',
        owner: ownerId
    };
    self.history.push(historyItem);
    callback(null, self);
};

/**
 * Sets the ticket type for the instanced Ticket
 * @instance
 * @method setTicketType
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} typeId TicketType Id to set as ticket type
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketType = function(ownerId, typeId, callback) {
    var self = this;
    self.type = typeId;
    var historyItem = {
        action: 'ticket:set:type',
        description: 'Ticket type set to: ' + typeId.name,
        owner: ownerId
    };

    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Sets the ticket priority
 * @instance
 * @method setTicketPriority
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Number} priority Priority to set
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketPriority = function(ownerId, priority, callback) {
    if (_.isNaN(priority)) return callback('Priority must be a number.');

    var self = this;
    self.priority = priority;
    var historyItem = {
        action: 'ticket:set:priority',
        description: 'Ticket Priority set to: ' + priority,
        owner: ownerId
    };
    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Sets this ticket under the given group Id
 * @instance
 * @method setTicketGroup
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} groupId MongoDB group Id to assign this ticket to
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.setTicketGroup = function(ownerId, groupId, callback) {
    var self = this;
    self.group = groupId;

    var historyItem = {
        action: 'ticket:set:group',
        description: 'Ticket Group set to: ' + groupId,
        owner: ownerId
    };
    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Sets this ticket's issue text
 * @instance
 * @method setIssue
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} issue Issue text to set on the ticket
 * @param {TicketCallback} callback Callback with the updated ticket.
 * @example
 * ticket.setIssue({ownerId}, 'This is the new issue string.', function(err, t) {
 *    if (err) throw err;
 *
 *    ticket.save(function(err, t) {
 *       if (err) throw err;
 *    });
 * });
 */
ticketSchema.methods.setIssue = function(ownerId, issue, callback) {
    var self = this;
    self.issue = issue;
    var historyItem = {
        action: 'ticket:update:issue',
        description: 'Ticket Issue was updated.',
        owner: ownerId
    };

    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Updates a given comment inside the comment array on this ticket
 * @instance
 * @method updateComment
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} commentId Comment ID to update
 * @param {String} commentText Text to update the comment to
 * @param {TicketCallback} callback Callback with the updated ticket.
 * @example
 * ticket.updateComment({ownerId}, {commentId} 'This is the new comment string.', function(err, t) {
 *    if (err) throw err;
 *
 *    ticket.save(function(err, t) {
 *       if (err) throw err;
 *    });
 * });
 */
ticketSchema.methods.updateComment = function(ownerId, commentId, commentText, callback) {
    var self = this;
    var comment = _.find(self.comments, function(c){return c._id.toString() == commentId.toString()});
    if (_.isUndefined(comment)) return callback("Invalid Comment");

    comment.comment = commentText;

    var historyItem = {
        action: 'ticket:comment:updated',
        description: 'Comment was updated: ' + commentId,
        owner: ownerId
    };
    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Removes a comment from the comment array on this ticket.
 * @instance
 * @method removeComment
 * @memberof Ticket
 *
 * @param {Object} ownerId Account ID preforming this action
 * @param {Object} commentId Comment ID to remove
 * @param {TicketCallback} callback Callback with the updated ticket.
 */
ticketSchema.methods.removeComment = function(ownerId, commentId, callback) {
    var self = this;
    self.comments = _.reject(self.comments, function(o) { return o._id == commentId; });

    var historyItem = {
        action: 'ticket:delete:comment',
        description: 'Comment was deleted: ' + commentId,
        owner: ownerId
    };
    self.history.push(historyItem);

    callback(null, self);
};

ticketSchema.methods.removeAttachment = function(ownerId, attachmentId, callback) {
    var self = this;
    self.attachments = _.reject(self.attachments, function(o) { return o._id == attachmentId; });

    var historyItem = {
        action: 'ticket:delete:attachment',
        description: 'Attachment was deleted: ' + attachmentId,
        owner: ownerId
    };
    self.history.push(historyItem);

    callback(null, self);
};

/**
 * Gets all tickets that are not marked as deleted <br> <br>
 *
 * **Deep populates: group, group.members, group.sendMailTo, comments, comments.owner**
 *
 * @memberof Ticket
 * @static
 * @method getAll
 * @param {QueryCallback} callback MongoDB Query Callback
 *
 * @example
 * ticketSchema.getAll(function(err, tickets) {
 *    if (err) throw err;
 *
 *    //tickets is an array
 * });
 */
ticketSchema.statics.getAll = function(callback) {
    var self = this;
    var q = self.model(COLLECTION).find({deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'group.sendMailTo', 'comments', 'comments.owner'])
        .sort({'status': 1});

    return q.exec(callback);
};

/**
 * Gets Tickets with a given group id.
 *
 * @memberof Ticket
 * @static
 * @method getTickets
 * @param {Object} grpId Group Id to retrieve tickets for.
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTickets = function(grpId, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    if (!_.isArray(grpId)) {
        return callback("Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()", null);
    }

    var self = this;

    var q = self.model(COLLECTION).find({group: {$in: grpId}, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'group.sendMailTo', 'comments', 'comments.owner'])
        .sort({'status': 1});

    return q.exec(callback);
};

/**
 * Gets Tickets with a given group id and a JSON Object <br/><br/>
 * *Sorts on UID desc.*
 * @memberof Ticket
 * @static
 * @method getTicketsWithObject
 *
 * @param {Object} grpId Group Id to retrieve tickets for.
 * @param {Object} object JSON Object with various options
 * @param {QueryCallback} callback MongoDB Query Callback
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
ticketSchema.statics.getTicketsWithObject = function(grpId, object, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    if (!_.isArray(grpId)) {
        return callback("Invalid GroupId (Must be of type Array) - TicketSchema.GetTicketsWithObject()", null);
    }

    if (!_.isObject(object)) {
        return callback("Invalid Object (Must be of type Object) - TicketSchema.GetTicketsWithObject()", null);
    }

    var self = this;

    var limit = (object.limit == null ? 10 : object.limit);
    var page = (object.page == null ? 0 : object.page);
    var closed = object.closed;
    var status = object.status;

    var q = self.model(COLLECTION).find({group: {$in: grpId}, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'group.sendMailTo', 'comments', 'comments.owner'])
        .sort('-uid')
        //.sort({'status': 1})
        .skip(page*limit)
        .limit(limit);

    if (!_.isUndefined(status) && !_.isNull(status) && _.isNumber(status)) {
        q.where('status').equal(status);
    } else {
        if (!closed) q.where('status').ne(3);
    }

    if (!_.isUndefined(object.assignedSelf) && !_.isNull(object.assignedSelf)) q.where('assignee').equals(object.user);

    return q.exec(callback);
};

/**
 * Gets Tickets with a limit on given group id. <br/><br/>
 * *Sorts on UID Desc -> STATUS Asc*
 * @memberof Ticket
 * @static
 * @method getTicketsWithLimit
 *
 * @param {Object} grpId Group Id to retrieve tickets for.
 * @param {Number} limit Number of tickets to return
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketsWithLimit = function(grpId, limit, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    if (!_.isArray(grpId)) {
        return callback("Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()", null);
    }

    var self = this;

    var q = self.model(COLLECTION).find({group: {$in: grpId}, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'group.sendMailTo', 'comments', 'comments.owner'])
        .sort({'uid': -1})
        .sort({'status': 1})
        .limit(limit);

    return q.exec(callback);
};

/**
 * Gets Tickets for status in given group. <br/><br/>
 * *Sorts on UID desc*
 * @memberof Ticket
 * @static
 * @method getTicketsByStatus
 *
 * @param {Object} grpId Group Id to retrieve tickets for.
 * @param {Number} status Status number to check
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketsByStatus = function(grpId, status, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    var self = this;

    var q = self.model(COLLECTION).find({group: {$in: grpId}, status: status, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'group.sendMailTo', 'comments', 'comments.owner'])
        .sort({'uid': -1});

    return q.exec(callback);
};

/**
 * Gets Single ticket with given UID.
 * @memberof Ticket
 * @static
 * @method getTicketByUid
 *
 * @param {Number} uid Unique Id for ticket.
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketByUid = function(uid, callback) {
    if (_.isUndefined(uid)) return callback("Invalid Uid - TicketSchema.GetTicketByUid()", null);

    var self = this;

    var q = self.model(COLLECTION).findOne({uid: uid, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'comments', 'comments.owner']);

    return q.exec(callback);
};

/**
 * Gets Single ticket with given object _id.
 * @memberof Ticket
 * @static
 * @method getTicketById
 *
 * @param {Object} id MongoDb _id.
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getTicketById = function(id, callback) {
    if (_.isUndefined(id)) return callback("Invalid Id - TicketSchema.GetTicketById()", null);

    var self = this;

    var q = self.model(COLLECTION).findOne({_id: id, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'group.sendMailTo', 'comments', 'comments.owner']);

    return q.exec(callback);
};

ticketSchema.statics.getAssigned = function(user_id, callback) {
    if (_.isUndefined(user_id)) return callback("Invalid Id - TicketSchema.GetAssigned()", null);

    var self = this;

    var q = self.model(COLLECTION).find({assignee: user_id, deleted: false, status: {$ne: 3}})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'group.sendMailTo', 'comments', 'comments.owner']);

    return q.exec(callback);
};

/**
 * Gets Tickets and populates just comments.
 * @todo This method is redundant and needs to be refactored.
 * @deprecated
 * @memberof Ticket
 * @static
 * @method getComments
 *
 * @param {Object} tId Ticket Id
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.getComments = function(tId, callback) {
    if (_.isUndefined(tId)) return callback("Invalid Ticket Id - TicketSchema.GetComments()", null);

    var self = this;

    var q = self.model(COLLECTION).findOne({_id: tId, deleted: false})
        .deepPopulate('comments comments.owner');

    return q.exec(callback);
};

/**
 * Gets total count of all tickets
 *
 * @memberof Ticket
 * @static
 * @method getTotalCount
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 * @example
 * ticketSchema.getTotalCount(function(err, count) {
 *    if (err) throw err;
 *    //Count
 *    var totalCount = count;
 * });
 */
ticketSchema.statics.getTotalCount = function(callback) {
    var self = this;
    var q = self.model(COLLECTION).count({deleted: false});

    return q.exec(callback);
};

/**
 * Gets count of all tickets with a given status
 *
 * @memberof Ticket
 * @static
 * @method getStatusCount
 *
 * @param {Number} status Status Number to query
 * @param {QueryCallback} callback MongoDB Query Callback
 * @example
 * ticketSchema.getStatusCount(0, function(err, count) {
 *    if (err) throw err;
 *    //Count
 *    var statusCount = count;
 * });
 */
ticketSchema.statics.getStatusCount = function(status, callback) {
    if (_.isUndefined(status)) return callback("Invalid Status - TicketSchema.GetStatusCount()", null);

    var self = this;

    var q = self.model(COLLECTION).count({status: status, deleted: false});

    return q.exec(callback);
};

/**
 * Gets count of all tickets with a given status and 24 hour period of the given date.
 *
 * @memberof Ticket
 * @static
 * @method getStatusCountByDate
 *
 * @param {Number} status Status Number to query
 * @param {Date} date Period to query
 * @param {QueryCallback} callback MongoDB Query Callback
 * @example
 * ticketSchema.getStatusCountByDate(0, new Date(2015, 07, 12), function(err, count) {
 *    if (err) throw err;
 *    //Count
 *    var statusCount = count;
 * });
 */
ticketSchema.statics.getStatusCountByDate = function(status, date, callback) {
    if (_.isUndefined(status)) return callback("Invalid Status - TicketSchema.GetStatusCount()", null);
    if (_.isUndefined(date)) return callback("Invalid Date - TicketSchema.GetStatusCount()", null);

    var self = this;

    var today = new Date(date);
    var yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate()-1);

    var q = self.model(COLLECTION).count({status: status, date: {$lte: new Date(today), $gte: new Date(yesterday)}, deleted: false});
    if (status === 3) {
        q = self.model(COLLECTION).count({status: status, closedDate: {$lte: new Date(today), $gte: new Date(yesterday)}, deleted: false});
    }

    return q.exec(callback);
};

/**
 * Gets count of all tickets within a 24 hour period of the given date.
 *
 * @memberof Ticket
 * @static
 * @method getDateCount
 *
 * @param {Date} date Period to query
 * @param {QueryCallback} callback MongoDB Query Callback
 * @example
 * ticketSchema.getDateCount(new Date(2015, 07, 12), function(err, count) {
 *    if (err) throw err;
 *    //Count
 *    var statusCount = count;
 * });
 */
ticketSchema.statics.getDateCount = function(date, callback) {
    if (_.isUndefined(date)) return callback("Invalid Date - TicketSchema.GetDateCount()", null);

    var self = this;

    var today = new Date(date);
    var yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate()-1);

    var q = self.model(COLLECTION).count({date: {$lte: new Date(today), $gte: new Date(yesterday)}, deleted: false});

    return q.exec(callback);
};

/**
 * Gets count of all tickets within a month **0 based**
 *
 * @memberof Ticket
 * @static
 * @method getTotalMonthCount
 *
 * @param {Number} month Month to query
 * @param {QueryCallback} callback MongoDB Query Callback
 * @example
 * ticketSchema.getTotalMonthCount(7, function(err, count) {
 *    if (err) throw err;
 *    //Count
 *    var totalMonthCount = count;
 * });
 */
ticketSchema.statics.getTotalMonthCount = function(month, callback) {
    if (_.isUndefined(month)) return callback("Invalid Month - TicketSchema.GetTotalMonthCount()", null);

    var self = this;

    month = Number(month);

    var now = new Date();
    var date = new Date(now.getFullYear(), month, 1);
    var endDate = new Date(date).setMonth(date.getMonth() + 1);

    var q = self.model(COLLECTION).count({date: {$lte: new Date(endDate), $gte: new Date(date)}, deleted: false});

    return q.exec(callback);
};

/**
 * Gets count of all tickets within a month **0 based** and with a given status
 *
 * @memberof Ticket
 * @static
 * @method getMonthCount
 *
 * @param {Number} month Month to query
 * @param {Number} status Status to query
 * @param {QueryCallback} callback MongoDB Query Callback
 * @example
 * ticketSchema.getMonthCount(7, 0, function(err, count) {
 *    if (err) throw err;
 *    //Count
 *    var totalMonthCount = count;
 * });
 */
ticketSchema.statics.getMonthCount = function(month, status, callback) {
    if (_.isUndefined(month)) return callback("Invalid Month - TicketSchema.GetMonthCount()", null);

    var self = this;
    month = Number(month);

    var now = new Date();
    var date = new Date(now.getFullYear(), month, 1);
    var endDate = new Date(date).setMonth(date.getMonth() + 1);

    var q = self.model(COLLECTION).count({date: {$lte: new Date(endDate), $gte: new Date(date)}, deleted: false});

    if (!_.isUndefined(status)) {
        status = Number(status);
        if (status === 0) {
            q = self.model(COLLECTION).count({date: {$lte: new Date(endDate), $gte: new Date(date)}, deleted: false});
        } else if (status === 3) {
            q = self.model(COLLECTION).count({status: status, closedDate: {$lte: new Date(endDate), $gte: new Date(date)}, deleted: false});
        } else {
            q = self.model(COLLECTION).count({status: status, date: {$lte: new Date(endDate), $gte: new Date(date)}, deleted: false});
        }
    }

    return q.exec(callback);
};

/**
 * Gets count of all tickets within a given year with a given status
 *
 * @memberof Ticket
 * @static
 * @method getYearCount
 *
 * @param {Number} year Year to query
 * @param {Number} status Status to query
 * @param {QueryCallback} callback MongoDB Query Callback
 * @example
 * ticketSchema.getYearCount(2015, 0, function(err, count) {
 *    if (err) throw err;
 *    //Count
 *    var totalMonthCount = count;
 * });
 */
ticketSchema.statics.getYearCount = function(year, status, callback) {
    if (_.isUndefined(year)) return callback("Invalid Year - TicketSchema.GetYearCount()", null);

    var self = this;

    year = Number(year);

    var date = new Date(year, 0, 1);
    var endDate = date;
    endDate.setYear(endDate.getFullYear() + 1);

    var q = self.model(COLLECTION).count({date: {$lte: endDate, $gte: date}, deleted: false});

    if (!_.isUndefined(status) && _.isNumber(status)) {
        q = self.model(COLLECTION).count({date: {$lte: endDate, $gte: date}, deleted: false, status: status});
    }

    return q.exec(callback);
};

/**
 * Mark a ticket as deleted in MongoDb <br/><br/>
 * *Ticket has its ```deleted``` flag set to true*
 *
 * @memberof Ticket
 * @static
 * @method softDelete
 *
 * @param {Object} oId Ticket Object _id
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketSchema.statics.softDelete = function(oId, callback) {
    if (_.isUndefined(oId)) return callback("Invalid ObjectID - TicketSchema.SoftDelete()", null);

    var self = this;

    return self.model(COLLECTION).findOneAndUpdate({_id: oId}, {deleted: true}, callback);
};

module.exports = mongoose.model(COLLECTION, ticketSchema);