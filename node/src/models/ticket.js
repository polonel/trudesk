var mongoose = require('mongoose');
var _ = require('lodash');

var COLLECTION = 'tickets';

var commentsSchema = mongoose.Schema({
    owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
    date:       { type: Date },
    comment:    String
});

var ticketTypeSchema = mongoose.Schema({
    name:       String
});


var ticketSchema = mongoose.Schema({
    owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
    group:      { type: mongoose.Schema.Types.ObjectId, ref: 'groups' },
    assignee:   { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
    date:       { type: Date },
    updated:    { type: Date },
    type:       { type: mongoose.Schema.Types.ObjectId, ref: 'ticketTypes' },
    status:     Number,
    priority:   Number,
    tags:       [String],
    subject:    String,
    issue:      String,
    comments:   [commentsSchema]
});

ticketSchema.statics.getTickets = function(grpId, callback) {

};

module.exports.ticketTypes = mongoose.model('ticketTypes', ticketTypeSchema);
module.exports = mongoose.model(COLLECTION, ticketSchema);