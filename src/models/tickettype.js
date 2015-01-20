var mongoose = require('mongoose');
var _ = require('underscore');

var COLLECTION = 'tickettypes';

var ticketTypeSchema = mongoose.Schema({
    name:       String
});

ticketTypeSchema.statics.getTypes = function(callback) {
    var q = this.model(COLLECTION).find({});

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, ticketTypeSchema);