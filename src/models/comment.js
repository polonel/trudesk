var mongoose            = require('mongoose');
var _                   = require('lodash');

var commentsSchema = mongoose.Schema({
    owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'accounts'},
    date:       { type: Date, required: true },
    comment:    { type: String, required: true },
    deleted:    { type: Boolean, default: false, required: true }
});

module.exports = commentsSchema;