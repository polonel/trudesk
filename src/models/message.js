/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

var mongoose = require('mongoose');
var _ = require('lodash');

var COLLECTION = 'messages';

var messageSchema = mongoose.Schema({
    owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
    folder:     Number,
    unread:     Boolean,
    from:       { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
    to:         { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
    subject:    String,
    date:       { type: Date },
    message:    String
});

messageSchema.methods.updateUnread = function(unread, callback) {
    unread = _.isUndefined(unread) ? false : unread;

    this.model(COLLECTION).findOne({_id: this._id}, function(err, doc) {
        if (err) {
            return callback(err, doc);
        }

        doc.unread = unread;
        doc.save();

        callback(err, doc);
    });
};

messageSchema.statics.getUnreadInboxCount = function(oId, callback) {
    if (_.isUndefined(oId)) {
        return callback("Invalid OwnerId - MessageSchema.GetUnreadInbox()", null);
    }

    return this.model(COLLECTION).count({owner: oId, folder: 0, unread: true}, callback);
};

messageSchema.statics.getUserInbox = function(oId, callback) {
    if (_.isUndefined(oId)) {
        return callback("Invalid OwnerId - MessageSchema.GetUserInbox()", null);
    }

    var q = this.model(COLLECTION).find({owner: oId, folder: 0})
        .populate('from')
        .limit(50);

    return q.exec(callback);
};

messageSchema.statics.getUserSentBox = function(oId, callback) {
    if (_.isUndefined(oId)) {
        return callback("Invalid OwnerId - MessageSchema.GetUserSentBox()", null);
    }

    var q = this.model(COLLECTION).find({owner: oId, folder: 1})
        .populate('to')
        .limit(50);

    return q.exec(callback);
};

messageSchema.statics.getUserTrashBox = function(oId, callback) {
    if (_.isUndefined(oId)) {
        return callback("Invalid OwnerId - MessageSchema.GetUserTrashBox()", null);
    }

    var q = this.model(COLLECTION).find({owner: oId, folder: 2})
        .populate('to')
        .limit(50);

    return q.exec(callback);
};

messageSchema.statics.getMessageById = function(mId, callback) {
    if (_.isUndefined(mId)) {
        return callback("Invalid MessageId - MessageSchema.GetMessageById()", null);
    }

    var q = this.model(COLLECTION).findOne({_id: mId})
        .populate('to')
        .populate('from');

    return q.exec(callback);

};

module.exports = mongoose.model(COLLECTION, messageSchema);