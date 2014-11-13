var mongoose = require('mongoose');
var _ = require('lodash');

var COLLECTION = 'groups';

var groupSchema = mongoose.Schema({
    name:       String,
    members:    [{type: mongoose.Schema.Types.ObjectId, ref: 'accounts'}]
});



module.exports = mongoose.model(COLLECTION, groupSchema);