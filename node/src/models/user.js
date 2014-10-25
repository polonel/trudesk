var async = require('async');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var _ = require('lodash');

var COLLECTION = "accounts";

var userSchema = mongoose.Schema({
        _id:        { type: mongoose.Schema.Types.ObjectId },
        username:   String,
        password:   String,
        fullname:   String,
        email:      String
    });

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validate = function(password) {
    console.log(password.toString());
    return bcrypt.compareSync(password, this.password);
};

userSchema.statics.findAll = function(callback) {
    return this.model(COLLECTION).find({}, callback);
};

userSchema.statics.getUser = function(oId, callback) {
    if (_.isUndefined(oId)) {
        return callback("Invalid ObjectId - UserSchema.GetUser()", null);
    }

    return this.model(COLLECTION).findOne({_id: oId}, callback);
};

userSchema.statics.insertUser = function(data, callback) {
    if (_.isUndefined(data)) {
        return callback("Invalid User Data - UserSchema.InsertUser()", null);
    }
    var self = this;

    self.model(COLLECTION).find({"username": data.username}, function(err, items) {
        if (err) {
          return callback(err, null);
        }

        if (_.size(items) > 0) {
          return callback("Username Already Exists", null);
        }

        return self.collection.insert(data, callback);
    });
};

module.exports = mongoose.model(COLLECTION, userSchema);
