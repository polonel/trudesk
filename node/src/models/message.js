var mongoose = require('mongoose');

var COLLECTION = 'messages';

var messageSchema = mongoose.Schema({

});

module.exports = mongoose.model(COLLECTION, messageSchema);