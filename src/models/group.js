var mongoose    = require('mongoose');
var _           = require('underscore');

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

groupSchema.statics.getGroupById = function(gId, callback) {
    if (_.isUndefined(gId)) return callback("Invalid GroupId - GroupSchema.GetGroupById()");

    var q = this.model(COLLECTION).findOne({_id: gId}).populate('members');

    return q.exec(callback);
};

groupSchema.methods.addMember = function(memberId, callback) {
    if (_.isUndefined(memberId)) return callback("Invalid MemberId - $Group.AddMember()");

    if (isMember(this.members, memberId)) return callback(null, false);

    this.members.push(memberId);
    this.members = _.uniq(this.members);

    return callback(null, true);
};

groupSchema.methods.removeMember = function(memberId, callback) {
    if (_.isUndefined(memberId)) return callback("Invalid MemberId - $Group.RemoveMember()");

    if (!isMember(this.members, memberId)) return callback();

    this.members.splice(_.indexOf(this.members, _.findWhere(this.members, {"_id" : memberId})), 1);

    return callback(null, true);
};

function isMember(arr, id) {
    var matches = _.filter(arr, function(value) {
        if (value._id == id) {
            return value;
        }
    });

    return matches.length > 0;
}

module.exports = mongoose.model(COLLECTION, groupSchema);