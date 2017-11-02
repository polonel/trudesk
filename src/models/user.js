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
 * @property {Date} lastOnline Last timestamp given user was online.
 * @property {String} title Job Title of user
 * @property {String} image Filename of user image
 * @property {String} resetPassHash Password reset has for recovery password link.
 * @property {Date} resetPassExpire Date when the password recovery link will expire
 * @property {String} tOTPKey One Time Password Secret Key
 * @property {Number} tOTPPeriod One Time Password Key Length (Time) - Default 30 Seconds
 * @property {String} accessToken API Access Token
 * @property {Array} iOSDeviceTokens Array of String based device Ids for Apple iOS devices. *push notifications*
 * @property {Object} preferences Object to hold user preferences
 * @property {Boolean} preferences.autoRefreshTicketGrid Enable the auto refresh of the ticket grid.
 * @property {Boolean} deleted Account Deleted
 */
var userSchema = mongoose.Schema({
        username:   { type: String, required: true, unique: true },
        password:   { type: String, required: true, select: false },
        fullname:   { type: String, required: true, index: true },
        email:      { type: String, required: true, unique: true },
        role:       { type: String, required: true },
        lastOnline: Date,
        title:      String,
        image:      String,

        resetPassHash: String,
        resetPassExpire: Date,
        tOTPKey: String,
        tOTPPeriod: Number,

        accessToken: { type: String, sparse: true},

        iOSDeviceTokens: [{type: String}],

        preferences: {
            tourCompleted: { type: Boolean, default: false },
            autoRefreshTicketGrid: { type: Boolean, default: true },
            openChatWindows: [{type: String, default: []}]
        },

        deleted:    { type: Boolean, default: false }
    });

userSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            user.password = hash;
            return next();
        });
    });
});

userSchema.methods.addAccessToken = function(callback) {
    var user = this;
    var chance = new Chance();
    user.accessToken = chance.hash();
    user.save(function(err) {
        if (err) return callback(err, null);

        return callback(null, user.accessToken);
    });
};

userSchema.methods.removeAccessToken = function(callback) {
    var user = this;
    if (!user.accessToken) return callback();

    user.accessToken = undefined;
    user.save(function(err) {
        if (err) return callback(err, null);

        return callback();
    });
};

userSchema.methods.generateL2Auth = function(callback) {
    var user = this;
    if (_.isUndefined(user.tOTPKey) || _.isNull(user.tOTPKey)) {
        var chance = new Chance();
        var base32 = require('thirty-two');

        var genOTPKey = chance.string({length: 7, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'});
        var base32GenOTPKey = base32.encode(genOTPKey).toString().replace(/=/g, '');

        user.tOTPKey = base32GenOTPKey;
        user.save(function(err) {
            if (err) return callback(err);

            return callback(null, base32GenOTPKey);
        });
    } else
        return callback();


};

userSchema.methods.removeL2Auth = function(callback) {
    var user = this;
    if (!user.tOTPKey) return callback();

    user.tOTPKey = undefined;
    user.save(function(err) {
        if (err) return callback(err, null);

        return callback();
    })
};

userSchema.methods.addDeviceToken = function(token, type, callback) {
    if (_.isUndefined(token)) return callback("Invalid token");
    var user = this;
    //type 1 = iOS
    //type 2 = Android
    if (type === 1) {
        if (hasDeviceToken(user, token, type)) return callback(null, token);

        user.iOSDeviceTokens.push(token);
        user.save(function(err) {
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

            return callback(null, u.iOSDeviceTokens);
        });
    }
};

userSchema.methods.addOpenChatWindow = function(convoId, callback) {
    if (convoId == undefined) {
        if (!_.isFunction(callback)) return;
        return callback('Invalid convoId');
    }
    var user = this;
    var hasChatWindow = (_.filter(user.preferences.openChatWindows, function(value) {
         return value.toString() === convoId.toString();
    }).length > 0);

    if (hasChatWindow) {
        if (!_.isFunction(callback)) return;
        return callback();
    }
    user.preferences.openChatWindows.push(convoId.toString());
    user.save(function(err, u) {
        if (err) {
            if (!_.isFunction(callback)) return;
            return callback(err);
        }

        if (!_.isFunction(callback)) return;
        return callback(null, u.preferences.openChatWindows);
    })
};

userSchema.methods.removeOpenChatWindow = function(convoId, callback) {
    if (convoId == undefined) {
        if (!_.isFunction(callback)) return;
        return callback('Invalid convoId');
    }
    var user = this;
    var hasChatWindow = (_.filter(user.preferences.openChatWindows, function(value) {
        return value.toString() === convoId.toString();
    }).length > 0);

    if (!hasChatWindow) {
        if (!_.isFunction(callback)) return;
        return callback();
    }
    user.preferences.openChatWindows.splice(_.findIndex(user.preferences.openChatWindows, function(item) {
        return item.toString() === convoId.toString();
    }), 1);

    user.save(function(err, u) {
        if (err) {
            if (!_.isFunction(callback)) return;
            return callback(err);
        }

        if (!_.isFunction(callback)) return;
        return callback(null, u.preferences.openChatWindows);
    });
};

userSchema.methods.softDelete = function(callback) {
    var user = this;

    user.deleted = true;

    user.save(function(err) {
        if (err) return callback(err, false);

        callback(null, true);
    });
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

    return this.model(COLLECTION).findOne({username: new RegExp("^" + user + "$", 'i') }).select('+password').exec(callback);
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

    return this.model(COLLECTION).findOne({resetPassHash: hash, deleted: false}, callback);
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

    return this.model(COLLECTION).findOne({accessToken: token, deleted: false}, callback);
};

userSchema.statics.getUserWithObject = function(object, callback) {
    if (!_.isObject(object)) {
        return callback("Invalid Object (Must be of type Object) - UserSchema.GetUserWithObject()", null);
    }

    var self = this;

    var limit = (object.limit == null ? 10 : object.limit);
    var page = (object.page == null ? 0 : object.page);
    var search = (object.search == null ? '' : object.search);

    var q = self.model(COLLECTION).find({}, '-password -resetPassHash -resetPassExpire')
        .sort({'fullname': 1})
        .skip(page*limit);
    if (limit != -1)
        q.limit(limit);

    if (!_.isEmpty(search))
        q.where({fullname: new RegExp("^" + search.toLowerCase(), 'i') });

    q.exec(callback);
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
    var permissions = require('../permissions');
    var roles = permissions.roles;
    var assigneeRoles = [];
    async.each(roles, function(role) {
        if (permissions.canThis(role.id, 'ticket:assignee'))
            assigneeRoles.push(role.id);
    });

    assigneeRoles = _.uniq(assigneeRoles);
    this.model(COLLECTION).find({role: {$in: assigneeRoles}, deleted: false}, function(err, users) {
        if (err) {
            winston.warn(err);
            return callback(err);
        }

        callback(null, users);
    });
};

/**
 * Gets users based on roles
 *
 * @memberof User
 * @static
 * @method getUsersByRoles
 *
 * @param {Array} roles Array of role ids
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.getUsersByRoles = function(roles, callback) {
    if (_.isUndefined(roles)) return callback('Invalid roles array', null);
    if (!_.isArray(roles))
        roles = [roles];

    var q = this.model(COLLECTION).find({role: {$in: roles}, deleted: false});

    return q.exec(callback);
};

/**
 * Creates a user with the given data object
 *
 * @memberof User
 * @static
 * @method createUser
 *
 * @param {User} data JSON data object of new User
 * @param {QueryCallback} callback MongoDB Query Callback
 */
userSchema.statics.createUser = function(data, callback) {
    if (_.isUndefined(data)) {
        return callback("Invalid User Data - UserSchema.CreateUser()", null);
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
