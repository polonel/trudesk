var mongoose = require('mongoose');
var _ = require('lodash');

var COLLECTION = 'counters';

var countersSchema = mongoose.Schema({
    _id: String,
    next: Number
});

countersSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
};

countersSchema.statics.increment = function (counter, callback) {
    return this.collection.findAndModify({ _id: counter }, [], { $inc: { next: 1 } }, callback);
};

module.exports = mongoose.model(COLLECTION, countersSchema);