/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/13/2015
 Author:     Chris Brame

 **/

var mongoose            = require('mongoose');
var _                   = require('underscore');

var COLLECTION = 'mailqueue';

var mailqueue = mongoose.Schema({
    to: {type: String, required: true},
    type: {type: String, required: true},
    data: {type: String, required: true}
});

mailqueue.statics.getQueue = function(callback) {
    return this.model(COLLECTION).find({}, callback);
};

mailqueue.statics.removeQueue = function(oId, callback) {
    return this.model(COLLECTION).remove({_id: oId}, callback);
};

mailqueue.statics.clearQueue = function(callback) {
    this.model(COLLECTION).remove({}, callback);
};

module.exports = mongoose.model(COLLECTION, mailqueue);