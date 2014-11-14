var mongoose = require('mongoose');
var _ = require('lodash');

var COLLECTION = 'groups';

var groupSchema = mongoose.Schema({
    name:       String,
    members:    [{type: mongoose.Schema.Types.ObjectId, ref: 'accounts'}]
});

groupSchema.statics.getAllGroups = function(callback) {
    var q = this.model(COLLECTION).find({}).populate('members');

    return q.exec(callback);
};

groupSchema.statics.getAllGroupsOfUser = function(userId, callback) {
    if (_.isUndefined(userId)) return callback("Invalid UserId - GroupSchema.GetAllGroupsOfUser()");

    var q = this.model(COLLECTION).find({members: userId})
        .populate('members');

    return q.exec(callback)
};

module.exports = mongoose.model(COLLECTION, groupSchema);