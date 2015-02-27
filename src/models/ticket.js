/**
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
var _                   = require('lodash');
var deepPopulate        = require('mongoose-deep-populate');
var moment              = require('moment');

//Needed!
var groupSchema         = require('./group');
var ticketTypeSchema    = require('./tickettype');
var commentSchema       = require('./comment');
var historySchema       = require('./history');

var COLLECTION = 'tickets';

var ticketSchema = mongoose.Schema({
    uid:        { type: Number },
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
    comments:   [commentSchema],
    history:    [historySchema]
});

ticketSchema.plugin(deepPopulate);

ticketSchema.pre('save', function(next) {
    if (!_.isUndefined(this.uid)|| this.uid) return next();

    var c = require('./counters');
    var self = this;
    c.increment('tickets', function(err, res) {
        self.uid = res.next;
        next();
    });
});

ticketSchema.methods.setStatus = function(status, callback) {
    if (_.isUndefined(status)) return callback('Invalid Status', null);

    this.status = status;

    callback(null, this);
};

ticketSchema.methods.setAssignee = function(userId, callback) {
    if (_.isUndefined(userId)) return callback('Invalid User Id', null);

    this.assignee = userId;
    var historyItem = {
        action: 'ticket:set:assignee',
        description: userId + ' was set as assignee'
    };
    this.history.push(historyItem);

    callback(null, this);
};

ticketSchema.methods.clearAssignee = function(callback) {
    this.assignee = undefined;

    callback(null, this);
};

ticketSchema.methods.setTicketType = function(typeId, callback) {
    this.type = typeId;

    callback(null, this);
};

ticketSchema.methods.setTicketPriority = function(priority, callback) {
    this.priority = priority;

    callback(null, this);
};

ticketSchema.methods.setTicketGroup = function(groupId, callback) {
    this.group = groupId;

    callback(null, this);
};

ticketSchema.methods.removeComment = function(commentId, callback) {
    this.comments = _.reject(this.comments, function(o) { return o._id == commentId; });

    callback(null, this);
};

ticketSchema.statics.getAll = function(callback) {
    var q = this.model(COLLECTION).find({deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'comments', 'comments.owner'])
        .sort({'status': 1});

    return q.exec(callback);
};

ticketSchema.statics.getTickets = function(grpId, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    if (!_.isArray(grpId)) {
        return callback("Invalid GroupId (Must be of type Array) - TicketSchema.GetTickets()", null);
    }

    var q = this.model(COLLECTION).find({group: {$in: grpId}, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'comments', 'comments.owner'])
        .sort({'status': 1})
        .limit(100);

    return q.exec(callback);
};

ticketSchema.statics.getTicketsByStatus = function(grpId, status, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    var q = this.model(COLLECTION).find({group: {$in: grpId}, status: status, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'comments', 'comments.owner'])
        .sort({'status': 1})
        .limit(100);

    return q.exec(callback);
};

ticketSchema.statics.getTicketByUid = function(uid, callback) {
    if (_.isUndefined(uid)) return callback("Invalid Uid - TicketSchema.GetTicketByUid()", null);

    var q = this.model(COLLECTION).findOne({uid: uid, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'comments', 'comments.owner']);

    return q.exec(callback);
};

ticketSchema.statics.getTicketById = function(id, callback) {
    if (_.isUndefined(id)) return callback("Invalid Id - TicketSchema.GetTicketById()", null);

    var q = this.model(COLLECTION).findOne({_id: id, deleted: false})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'comments', 'comments.owner']);

    return q.exec(callback);
};

ticketSchema.statics.getComments = function(tId, callback) {
    if (_.isUndefined(tId)) return callback("Invalid Ticket Id - TicketSchema.GetComments()", null);

    var q = this.model(COLLECTION).findOne({_id: tId, deleted: false})
        .deepPopulate('comments comments.owner');

    return q.exec(callback);
};

ticketSchema.statics.getTotalCount = function(callback) {
    var q = this.model(COLLECTION).count({deleted: false});

    return q.exec(callback);
};

ticketSchema.statics.getStatusCount = function(status, callback) {
    if (_.isUndefined(status)) return callback("Invalid Status - TicketSchema.GetStatusCount()", null);

    var q = this.model(COLLECTION).count({status: status, deleted: false});

    return q.exec(callback);
};

ticketSchema.statics.getStatusCountByDate = function(status, date, callback) {
    if (_.isUndefined(status)) return callback("Invalid Status - TicketSchema.GetStatusCount()", null);
    if (_.isUndefined(date)) return callback("Invalid Date - TicketSchema.GetStatusCount()", null);

    var today = new Date(date);
    var yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate()-1);

    var q = this.model(COLLECTION).count({status: status, date: {$lte: new Date(today), $gte: new Date(yesterday)}, deleted: false});

    return q.exec(callback);
};

ticketSchema.statics.getDateCount = function(date, callback) {
    if (_.isUndefined(date)) return callback("Invalid Date - TicketSchema.GetDateCount()", null);

    var today = new Date(date);
    var yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate()-1);

    var q = this.model(COLLECTION).count({date: {$lte: new Date(today), $gte: new Date(yesterday)}, deleted: false});

    return q.exec(callback);
};

ticketSchema.statics.softDelete = function(oId, callback) {
    if (_.isUndefined(oId)) return callback("Invalid ObjectID - TicketSchema.SoftDelete()", null);

    return this.model(COLLECTION).findOneAndUpdate({_id: oId}, {deleted: true}, callback);
};

module.exports = mongoose.model(COLLECTION, ticketSchema);