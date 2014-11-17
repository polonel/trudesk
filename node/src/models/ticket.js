var mongoose            = require('mongoose');
var _                   = require('lodash');
var groupSchema         = require('./group');
var ticketTypeSchema    = require('./tickettype');

var COLLECTION = 'tickets';

var commentsSchema = mongoose.Schema({
    owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
    date:       { type: Date },
    comment:    String
});

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
    comments:   [commentsSchema]
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
        .populate('assignee')
        .populate('type');

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, ticketSchema);