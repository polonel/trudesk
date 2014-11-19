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
    date:       { type: Date, required: true },
    updated:    { type: Date },
    type:       { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'tickettypes' },
    status:     { type: Number, required: true },
    priority:   { type: Number, required: true },
    tags:       [String],
    subject:    { type: String, required: true },
    issue:      { type: String, required: true },
    comments:   [commentSchema]
});

ticketSchema.pre('save', function(next) {
    var c = require('./counters');
    var self = this;
    c.increment('tickets', function(err, res) {
        self.uid = res.next;
        next();
    });
});

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
    if (_.isUndefined(id)) return callback("Invalid Uid - TicketSchema.GetTicketById()", null);

    var q = this.model(COLLECTION).findOne({_id: id})
        .populate('owner')
        .populate('group')
        .populate('comments')
        .populate('comments.owner')
        .populate('assignee')
        .populate('type');

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, ticketSchema);