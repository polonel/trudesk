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

var mongoose    = require('mongoose');
var _           = require('underscore');
var accountsSchema = require('./user');

var COLLECTION = 'groups';

var groupSchema = mongoose.Schema({
    name:       { type: String, required: true, unique: true },
    members:    [{type: mongoose.Schema.Types.ObjectId, ref: 'accounts'}]
});

groupSchema.statics.getGroupByName = function(name, callback) {
    if (_.isUndefined(name) || name.length < 1) return callback("Invalid Group Name - GroupSchema.GetGroupByName()");

    var q = this.model(COLLECTION).findOne({name: name}).populate('members');

    return q.exec(callback);
};

groupSchema.statics.getAllGroups = function(callback) {
    var q = this.model(COLLECTION).find({})
        .populate('members')
        .sort('name');

    return q.exec(callback);
};

groupSchema.statics.getAllGroupsOfUser = function(userId, callback) {
    if (_.isUndefined(userId)) return callback("Invalid UserId - GroupSchema.GetAllGroupsOfUser()");

    var q = this.model(COLLECTION).find({members: userId})
        .populate('members')
        .sort('name');

    return q.exec(callback)
};

groupSchema.statics.getGroupById = function(gId, callback) {
    if (_.isUndefined(gId)) return callback("Invalid GroupId - GroupSchema.GetGroupById()");

    var q = this.model(COLLECTION).findOne({_id: gId}).populate('members');

    return q.exec(callback);
};

groupSchema.methods.addMember = function(memberId, callback) {
    if (_.isUndefined(memberId)) return callback("Invalid MemberId - $Group.AddMember()");

    if (this.members === null) this.members = [];

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