var mongoose            = require('mongoose');
var _                   = require('lodash');
var deepPopulate        = require('mongoose-deep-populate');

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
    var q = this.model(COLLECTION).find({})
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

    var q = this.model(COLLECTION).find({group: {$in: grpId}})
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

    var q = this.model(COLLECTION).find({group: {$in: grpId}, status: status})
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

    var q = this.model(COLLECTION).findOne({uid: uid})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'comments', 'comments.owner']);

    return q.exec(callback);
};

ticketSchema.statics.getTicketById = function(id, callback) {
    if (_.isUndefined(id)) return callback("Invalid Id - TicketSchema.GetTicketById()", null);

    var q = this.model(COLLECTION).findOne({_id: id})
        .populate('owner')
        .populate('assignee')
        .populate('type')
        .deepPopulate(['group', 'group.members', 'comments', 'comments.owner']);

    return q.exec(callback);
};

ticketSchema.statics.getComments = function(tId, callback) {
    if (_.isUndefined(tId)) return callback("Invalid Ticket Id - TicketSchema.GetComments()", null);

    var q = this.model(COLLECTION).findOne({_id: tId})
        .deepPopulate('comments comments.owner');

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