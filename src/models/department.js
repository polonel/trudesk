/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    11/1/2018
 Author:     Chris Brame

 **/

var _               = require('lodash');
var mongoose        = require('mongoose');

//Refs
require('./user');

var COLLECTION = 'departments';

var departmentSchema = mongoose.Schema({
    name:       { type: String, required: true, unique: true },
    members:    [{type: mongoose.Schema.Types.ObjectId, ref: 'accounts'}]
});

departmentSchema.pre('save', function(next) {
    this.name = this.name.trim();

    return next();
});

departmentSchema.methods.addMember = function(memberId, callback) {
    if (_.isUndefined(memberId)) return callback('Invalid MemberId - TeamSchema.AddMember()');

    if (this.members === null) this.members = [];

    if (isMember(this.members, memberId)) return callback(null, false);

    this.members.push(memberId);
    this.members = _.uniq(this.members);

    return callback(null, true);
};

departmentSchema.methods.removeMember = function(memberId, callback) {
    if (_.isUndefined(memberId)) return callback('Invalid MemberId - TeamSchema.RemoveMember()');

    if (!isMember(this.members, memberId)) return callback(null, false);

    this.members.splice(_.indexOf(this.members, _.find(this.members, {'_id' : memberId})), 1);

    this.members = _.uniq(this.members);

    return callback(null, true);
};

departmentSchema.methods.isMember = function(memberId) {
    return isMember(this.members, memberId);
};

departmentSchema.statics.getByName = function(name, callback) {
    if (_.isUndefined(name) || name.length < 1) return callback('Invalid Team Name - TeamSchema.GetTeamByName()');

    var q = this.model(COLLECTION).findOne({name: name})
        .populate('members', '_id username fullname email image title');

    return q.exec(callback);
};

departmentSchema.statics.getAll = function(callback) {
    var q = this.model(COLLECTION).find({})
        .populate('members', '_id username fullname email image title')
        .sort('name');

    return q.exec(callback);
};

departmentSchema.statics.getNoPopulate = function(callback) {
    var q = this.model(COLLECTION).find({}).sort('name');

    return q.exec(callback);
};

departmentSchema.statics.getByUser = function(userId, callback) {
    if (_.isUndefined(userId)) return callback('Invalid UserId - TeamSchema.GetTeamsOfUser()');

    var q = this.model(COLLECTION).find({members: userId})
        .populate('members', '_id username fullname email image title')
        .sort('name');

    return q.exec(callback);
};

departmentSchema.statics.getByUserNoPopulate = function(userId, callback) {
    if (_.isUndefined(userId)) return callback('Invalid UserId - TeamSchema.GetTeamsOfUserNoPopulate()');

    var q = this.model(COLLECTION).find({members: userId})
        .sort('name');

    return q.exec(callback);
};

departmentSchema.statics.get = function(id, callback) {
    if (_.isUndefined(id)) return callback('Invalid TeamId - TeamSchema.GetTeam()');

    var q = this.model(COLLECTION).findOne({_id: id})
        .populate('members', '_id username fullname email image title');

    return q.exec(callback);
};

function isMember(arr, id) {
    var matches = _.filter(arr, function (value) {
        if (value._id.toString() === id.toString()) 
            return value;
    });

    return matches.length > 0;
}

module.exports = mongoose.model(COLLECTION, departmentSchema);
