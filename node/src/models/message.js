var mongoose = require('mongoose');
var _ = require('lodash');

var COLLECTION = 'messages';

var messageSchema = mongoose.Schema({
    _id:        { type: mongoose.Schema.Types.ObjectId},
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
        doc.unread = unread;
        doc.save();
    });
};

messageSchema.statics.getUserInbox = function(oId, callback) {
    if (_.isUndefined(oId)) {
        return callback("Invalid ObjectId - MessageSchema.GetAllForUser()", null);
    }

    var q = this.model(COLLECTION).find({owner: oId, folder: 0})
        .populate('from')
        .limit(50);

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, messageSchema);