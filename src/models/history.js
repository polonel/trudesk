var mongoose            = require('mongoose');
var _                   = require('underscore');

var historySchema = mongoose.Schema({
    action:         { type: String, required: true},
    date:           { type: Date, required: true, default: Date.now },
    description:    { type: String }
});

module.exports = historySchema;