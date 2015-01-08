var mongoose            = require('mongoose');
var _                   = require('lodash');

//Needed!
var groupSchema         = require('./group');
var ticketTypeSchema    = require('./tickettype');
var commentSchema       = require('./comment');

var COLLECTION = 'tickets';



var ticketSchema = mongoose.Schema({
    uid:        { type: Number },
    owner:      { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'accounts' },
    group:      { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'groups' },
    assignee:   { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
    date:       { type: Date, default: Date.now, required: true },
    updated:    { type: Date},
    type:       { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'tickettypes' },
    status:     { type: Number, required: true },
    priority:   { type: Number, required: true },
    tags:       [String],
    subject:    { type: String, required: true },
    issue:      { type: String, required: true },
    comments:   [commentSchema]
});

ticketSchema.pre('save', function(next) {
    if (!_.isUndefined(this.uid)|| this.uid) return next();

    var c = require('./counters');
    var self = this;
    c.increment('tickets', function(err, res) {
        self.uid = res.next;
        next();
    });
});

ticketSchema.statics.getAll = function(callback) {
    var q = this.model(COLLECTION).find({})
        .populate('owner')
        .populate('group')
        .populate('comments')
        .populate('comments.owner')
        .populate('assignee')
        .populate('type')
        .sort({'status': 1});

    return q.exec(callback);
};

ticketSchema.statics.getTickets = function(grpId, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    var q = this.model(COLLECTION).find({group: {$in: grpId}})
        .populate('owner')
        .populate('group')
        .populate('comments')
        .populate('comments.owner')
        .populate('assignee')
        .populate('type')
        .sort({'status': 1})
        .limit(100);

    return q.exec(callback);
};

ticketSchema.statics.getTicketsByStatus = function(grpId, status, callback) {
    if (_.isUndefined(grpId)) {
        return callback("Invalid GroupId - TicketSchema.GetTickets()", null);
    }

    var q = this.model(COLLECTION).find({group: {$in: grpId}, status: status})
        .populate('owner')
        .populate('group')
        .populate('comments')
        .populate('comments.owner')
        .populate('assignee')
        .populate('type')
        .sort({'status': 1})
        .limit(100);

    return q.exec(callback);
};

ticketSchema.statics.getTicketByUid = function(uid, callback) {
    if (_.isUndefined(uid)) return callback("Invalid Uid - TicketSchema.GetTicketByUid()", null);

    var q = this.model(COLLECTION).findOne({uid: uid})
        .populate('owner')
        .populate('group')
        .populate('comments')
        .populate('comments.owner')
        .populate('assignee')
        .populate('type');

    return q.exec(callback);
};

ticketSchema.statics.getTicketById = function(id, callback) {
    if (_.isUndefined(id)) return callback("Invalid Id - TicketSchema.GetTicketById()", null);

    var q = this.model(COLLECTION).findOne({_id: id})
        .populate('owner')
        .populate('group')
        .populate('comments')
        .populate('comments.owner')
        .populate('assignee')
        .populate('type');

    return q.exec(callback);
};

ticketSchema.statics.getComments = function(tId, callback) {
    if (_.isUndefined(tId)) return callback("Invalid Ticket Id - TicketSchema.GetComments()", null);

    var q = this.model(COLLECTION).findOne({_id: tId})
        .populate('comments')
        .populate('comments.owner');

    return q.exec(callback);
};

ticketSchema.statics.getTotalCount = function(callback) {
    var q = this.model(COLLECTION).count({});

    return q.exec(callback);
};

ticketSchema.statics.getStatusCount = function(status, callback) {
    if (_.isUndefined(status)) return callback("Invalid Status - TicketSchema.GetStatusCount()", null);

    var q = this.model(COLLECTION).count({status: status});

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, ticketSchema);