var async = require('async');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var _ = require('lodash');

var SALT_FACTOR = 10;
var COLLECTION = "accounts";

var userSchema = mongoose.Schema({
        username:   { type: String, required: true, unique: true },
        password:   { type: String, required: true },
        fullname:   { type: String, required: true },
        email:      { type: String, required: true, unique: true },
        role:       { type: String, required: true },
        title:      String,
        image:      String,

        resetPassHash: String,
        resetPassExpire: Date
    });

userSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    })
});

userSchema.statics.validate = function (password, dbPass) {
    return bcrypt.compareSync(password, dbPass);
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

userSchema.statics.getUserByUsername = function(user, callback) {
    if (_.isUndefined(user)) {
        return callback("Invalid Username - UserSchema.GetUserByUsername()", null);
    }

    return this.model(COLLECTION).findOne({username: user}, callback);
};

userSchema.statics.getUserByEmail = function(email, callback) {
    if (_.isUndefined(email)) {
        return callback("Invalid Email - UserSchema.GetUserByEmail()", null);
    }

    return this.model(COLLECTION).findOne({email: email}, callback);
};

userSchema.statics.getUserByResetHash = function(hash, callback) {
    if (_.isUndefined(hash)) {
        return callback("Invalid Hash - UserSchema.GetUserByResetHash()", null);
    }

    return this.model(COLLECTION).findOne({resetPassHash: hash}, callback);
};

userSchema.statics.getAssigneeUsers = function(callback) {
    return this.model(COLLECTION).find({$or: [{role: "mod"}, {role: "admin"}]}, callback);
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
