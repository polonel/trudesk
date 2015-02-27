var mongoose            = require('mongoose');
var _                   = require('underscore');

var historySchema = mongoose.Schema({
    action:         { type: String, required: true},
    date:           { type: Date, default: Date.now, required: true },
    description:    { type: String }
});

module.exports = historySchema