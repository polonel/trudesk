/*
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

var async = require('async');
var mongoose = require('mongoose');
var winston = require('winston');
var bcrypt = require('bcrypt');
var _ = require('lodash');
var Chance = require('chance');

var SALT_FACTOR = 10;
var COLLECTION = "accounts";

/**
 * User Schema
 * @module models/user
 * @class User
 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} username ```Required``` ```unique``` Username of user
 * @property {String} password ```Required``` Bcrypt password
 * @property {String} fullname ```Required``` Full name of user
 * @property {String} email ```Required``` ```unique``` Email Address of user
 * @property {String} role ```Required``` Permission role of the given user. See {@link Permissions}
 * @property {String} title Job Title of user
 * @property {String} image Filename of user image
 * @property {String} resetPassHash Password reset has for recovery password link.
 * @property {Date} resetPassExpire Date when the password recovery link will expire
 * @property {Array} accessTokens Array of String based access tokens for API
 * @property {Array} iOSDeviceTokens Array of String based device Ids for Apple iOS devices. *push notifications*
 */
var userSchema = mongoose.Schema({
        username:   { type: String, required: true, unique: true },
        password:   { type: String, required: true },
        fullname:   { type: String, required: true },
        email:      { type: String, required: true, unique: true },
        role:       { type: String, required: true },
        title:      String,
        image:      String,

        resetPassHash: String,
        resetPassExpire: Date,

        accessTokens: [{ type: String, unique: true }],

        iOSDeviceTokens: [{type: String, unique: true}]
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

userSchema.methods.addAccessToken = function(callback) {
    var user = this;
    var chance = new Chance();
    var token = chance.hash();
    user.accessTokens.push(token);
    user.save(function(err, u) {
        if (err) return callback(err, null);

        callback(null, token);
    });
};

userSchema.methods.removeAccessToken = function(token, callback) {
    var user = this;
    if (!hasAccessToken(user.accessTokens, token)) return callback();

    user.accessTokens.splice(_.indexOf(this.accessTokens, token), 1);
    user.save(function(err, u) {
        if (err) return callback(err, null);

        callback(null, u.accessTokens);
    });
};

userSchema.methods.addDeviceToken = function(token, type, callback) {
    if (_.isUndefined(token)) return callback("Invalid token");
    var user = this;
    //type 1 = iOS
    //type 2 = Android
    if (type === 1) {
        if (hasDeviceToken(user, token, type)) return callback(null, token);

        user.iOSDeviceTokens.push(token);
        user.save(function(err, u) {
            if (err) return callback(err, null);

            callback(null, token);
        });
    }
};

userSchema.methods.removeDeviceToken = function(token, type, callback) {
    var user = this;
    if (type === 1) {
        if (!hasDeviceToken(user, token, type)) return callback();

        winston.debug('Removing Device: ' + token);
        user.iOSDeviceTokens.splice(_.indexOf(this.iOSDeviceTokens, token), 1);
        user.save(function(err, u) {
            if (err) return callback(err, null);

            callback(null, u.iOSDeviceTokens);
        });
    }
};

userSchema.statics.validate = function (password, dbPass) {
    return bcrypt.compareSync(password, dbPass);
};

/**
 * Gets all users
 *
 * @memberof User
 * @static
 * @method findAll
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.findAll = function(callback) {
    return this.model(COLLECTION).find({}, callback);
};

/**
 * Gets user via object _id
 *
 * @memberof User
 * @static
 * @method getUser
 *
 * @param {Object} oId Object _id to Query MongoDB
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.getUser = function(oId, callback) {
    if (_.isUndefined(oId)) {
        return callback("Invalid ObjectId - UserSchema.GetUser()", null);
    }

    return this.model(COLLECTION).findOne({_id: oId}, callback);
};

/**
 * Gets user via username
 *
 * @memberof User
 * @static
 * @method getUserByUsername
 *
 * @param {String} user Username to Query MongoDB
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.getUserByUsername = function(user, callback) {
    if (_.isUndefined(user)) {
        return callback("Invalid Username - UserSchema.GetUserByUsername()", null);
    }

    return this.model(COLLECTION).findOne({username: user}, callback);
};

/**
 * Gets user via email
 *
 * @memberof User
 * @static
 * @method getUserByEmail
 *
 * @param {String} email Email to Query MongoDB
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.getUserByEmail = function(email, callback) {
    if (_.isUndefined(email)) {
        return callback("Invalid Email - UserSchema.GetUserByEmail()", null);
    }

    return this.model(COLLECTION).findOne({email: email}, callback);
};

/**
 * Gets user via reset password hash
 *
 * @memberof User
 * @static
 * @method getUserByResetHash
 *
 * @param {String} hash Hash to Query MongoDB
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.getUserByResetHash = function(hash, callback) {
    if (_.isUndefined(hash)) {
        return callback("Invalid Hash - UserSchema.GetUserByResetHash()", null);
    }

    return this.model(COLLECTION).findOne({resetPassHash: hash}, callback);
};

/**
 * Gets user via API Access Token
 *
 * @memberof User
 * @static
 * @method getUserByAccessToken
 *
 * @param {String} token Access Token to Query MongoDB
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.getUserByAccessToken = function(token, callback) {
    if (_.isUndefined(token)) {
        return callback("Invalid Token - UserSchema.GetUserByAccessToken()", null);
    }

    return this.model(COLLECTION).findOne({accessTokens: token}, callback);
};

/**
 * Gets users based on permissions > mod
 *
 * @memberof User
 * @static
 * @method getAssigneeUsers
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.getAssigneeUsers = function(callback) {
    return this.model(COLLECTION).find({$or: [{role: "mod"}, {role: "admin"}]}, callback);
};

/**
 * Inserts a user with the given data object
 *
 * @memberof User
 * @static
 * @method insertUser
 *
 * @param {User} data JSON data object of new User
 * @param {QueryCallback} callback MongoDB Query Callback
 */
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

/**
 * Checks if a user has access token already
 *
 * @memberof User
 * @instance
 * @method hasAccessToken
 *
 * @param {Array} arr Array of access tokens to check
 * @param {String} token token to check for in given array
 * @return {Boolean}
 */
function hasAccessToken(arr, token) {
    var matches = _.filter(arr, function(value) {
        if (value == token) {
            return value;
        }
    });

    return matches.length > 0;
}

/**
 * Checks if a user has device token already
 *
 * @memberof User
 * @instance
 * @method hasDeviceToken
 *
 * @param {User} user User to check against
 * @param {String} token token to check for in given user
 * @param {Number} type Type of Device token to check.
 * @return {Boolean}
 * @example
 * type:
 *   1: iOS
 *   2: Android
 *   3: Windows
 */
function hasDeviceToken(user, token, type) {
    if (type === 1) {
        var mataches = _.filter(user.iOSDeviceTokens, function(value) {
            if (value == token) {
                return value;
            }
        });

        return mataches.length > 0;
    }

    return false;
}

module.exports = mongoose.model(COLLECTION, userSchema);
