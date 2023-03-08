/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

const async = require('async');
const mongoose = require('mongoose');
const winston = require('winston');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const Chance = require('chance');
const utils = require('../helpers/utils');

// Required for linkage
require('./role');

const SALT_FACTOR = 10;
const COLLECTION = 'accounts';

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
 * @property {Object} preferences Object to hold user preferences
 * @property {Boolean} preferences.autoRefreshTicketGrid Enable the auto refresh of the ticket grid.
 * @property {Boolean} deleted Account Deleted
 */
var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, maxLength: 100 },
  password: { type: String, required: true, select: false },
  fullname: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, maxLength: 100 },
  phone: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'roles', required: true },
  lastOnline: Date,
  title: String,
  image: String,

  workNumber: { type: String },
  mobileNumber: { type: String },
  companyName: { type: String },
  facebookUrl: { type: String },
  linkedinUrl: { type: String },
  twitterUrl: { type: String },
  chatwootApiKey: { type: String },

  resetPassHash: { type: String, select: false },
  resetPassExpire: { type: Date, select: false },
  tOTPKey: { type: String, select: false },
  tOTPPeriod: { type: Number, select: false },
  resetL2AuthHash: { type: String, select: false },
  resetL2AuthExpire: { type: Date, select: false },
  hasL2Auth: { type: Boolean, required: true, default: false },
  accessToken: { type: String, sparse: true, select: false },

  preferences: {
    tourCompleted: { type: Boolean, default: false },
    autoRefreshTicketGrid: { type: Boolean, default: true },
    openChatWindows: [{ type: String, default: [] }],
    keyboardShortcuts: { type: Boolean, default: true },
    timezone: { type: String },
  },

  deleted: { type: Boolean, default: false },
});

userSchema.set('toObject', { getters: true });

const autoPopulateRole = function (next) {
  this.populate('role', 'name description normalized _id');
  next();
};

userSchema.pre('findOne', autoPopulateRole).pre('find', autoPopulateRole);

userSchema.pre('save', function (next) {
  const user = this;

  user.username = utils.applyMaxShortTextLength(utils.sanitizeFieldPlainText(user.username.toLowerCase().trim()));
  user.email = utils.sanitizeFieldPlainText(user.email.trim());

  if (user.fullname) user.fullname = utils.applyMaxShortTextLength(utils.sanitizeFieldPlainText(user.fullname.trim()));
  if (user.title) user.title = utils.applyMaxShortTextLength(utils.sanitizeFieldPlainText(user.title.trim()));

  if (!user.isModified('password')) {
    return next();
  }

  if (user.password.toString().length > 255) user.password = utils.applyMaxTextLength(user.password);

  bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      user.password = hash;
      return next();
    });
  });
});

userSchema.methods.addAccessToken = function (callback) {
  var user = this;
  var date = new Date();
  var salt = user.username.toString() + date.toISOString();
  var chance = new Chance(salt);
  user.accessToken = chance.hash();
  user.save(function (err) {
    if (err) return callback(err, null);

    return callback(null, user.accessToken);
  });
};

userSchema.methods.removeAccessToken = function (callback) {
  var user = this;
  if (!user.accessToken) return callback();

  user.accessToken = undefined;
  user.save(function (err) {
    if (err) return callback(err, null);

    return callback();
  });
};

userSchema.methods.generateL2Auth = function (callback) {
  const user = this;
  return new Promise((resolve, reject) => {
    (async () => {
      if (_.isUndefined(user.tOTPKey) || _.isNull(user.tOTPKey)) {
        const chance = new Chance();
        const base32 = require('thirty-two');

        const genOTPKey = chance.string({
          length: 7,
          pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789',
        });

        const base32GenOTPKey = base32.encode(genOTPKey).toString().replace(/=/g, '');

        if (typeof callback === 'function') return callback(null, base32GenOTPKey);

        return resolve(base32GenOTPKey);
      } else {
        const error = new Error('FATAL: Key already assigned!');
        if (typeof callback === 'function') return callback(error);

        return reject(error);
      }
    })();
  });
};

userSchema.methods.removeL2Auth = function (callback) {
  var user = this;

  user.tOTPKey = undefined;
  user.hasL2Auth = false;
  user.save(function (err) {
    if (err) return callback(err, null);

    return callback();
  });
};

userSchema.methods.addOpenChatWindow = function (convoId, callback) {
  if (convoId === undefined) {
    if (!_.isFunction(callback)) return false;
    return callback('Invalid convoId');
  }
  var user = this;
  var hasChatWindow =
    _.filter(user.preferences.openChatWindows, function (value) {
      return value.toString() === convoId.toString();
    }).length > 0;

  if (hasChatWindow) {
    if (!_.isFunction(callback)) return false;
    return callback();
  }
  user.preferences.openChatWindows.push(convoId.toString());
  user.save(function (err, u) {
    if (err) {
      if (!_.isFunction(callback)) return false;
      return callback(err);
    }

    if (!_.isFunction(callback)) return false;
    return callback(null, u.preferences.openChatWindows);
  });
};

userSchema.methods.removeOpenChatWindow = function (convoId, callback) {
  if (convoId === undefined) {
    if (!_.isFunction(callback)) return false;
    return callback('Invalid convoId');
  }
  var user = this;
  var hasChatWindow =
    _.filter(user.preferences.openChatWindows, function (value) {
      return value.toString() === convoId.toString();
    }).length > 0;

  if (!hasChatWindow) {
    if (!_.isFunction(callback)) return false;
    return callback();
  }
  user.preferences.openChatWindows.splice(
    _.findIndex(user.preferences.openChatWindows, function (item) {
      return item.toString() === convoId.toString();
    }),
    1
  );

  user.save(function (err, u) {
    if (err) {
      if (!_.isFunction(callback)) return false;
      return callback(err);
    }

    if (!_.isFunction(callback)) return false;
    return callback(null, u.preferences.openChatWindows);
  });
};

userSchema.methods.softDelete = function (callback) {
  var user = this;

  user.deleted = true;

  user.save(function (err) {
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
userSchema.statics.findAll = function (callback) {
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
userSchema.statics.getUser = function (oId, callback) {
  if (_.isUndefined(oId)) {
    return callback('Invalid ObjectId - UserSchema.GetUser()', null);
  }

  return this.model(COLLECTION).findOne({ _id: oId }, callback);
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
userSchema.statics.getUserByUsername = function (user, callback) {
  if (_.isUndefined(user)) {
    return callback('Invalid Username - UserSchema.GetUserByUsername()', null);
  }

  return this.model(COLLECTION)
    .findOne({ username: new RegExp('^' + user + '$', 'i') })
    .select('+password +accessToken')
    .exec(callback);
};

userSchema.statics.getByUsername = userSchema.statics.getUserByUsername;

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
userSchema.statics.getUserByEmail = function (email, callback) {
  if (_.isUndefined(email)) {
    return callback('Invalid Email - UserSchema.GetUserByEmail()', null);
  }

  return this.model(COLLECTION).findOne({ email: email.toLowerCase() }, callback);
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
userSchema.statics.getUserByResetHash = function (hash, callback) {
  if (_.isUndefined(hash)) {
    return callback('Invalid Hash - UserSchema.GetUserByResetHash()', null);
  }

  return this.model(COLLECTION).findOne(
    { resetPassHash: hash, deleted: false },
    '+resetPassHash +resetPassExpire',
    callback
  );
};

userSchema.statics.getUserByL2ResetHash = function (hash, callback) {
  if (_.isUndefined(hash)) {
    return callback('Invalid Hash - UserSchema.GetUserByL2ResetHash()', null);
  }

  return this.model(COLLECTION).findOne(
    { resetL2AuthHash: hash, deleted: false },
    '+resetL2AuthHash +resetL2AuthExpire',
    callback
  );
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
userSchema.statics.getUserByAccessToken = function (token, callback) {
  if (_.isUndefined(token)) {
    return callback('Invalid Token - UserSchema.GetUserByAccessToken()', null);
  }

  return this.model(COLLECTION).findOne({ accessToken: token, deleted: false }, '+password', callback);
};

userSchema.statics.getUserWithObject = function (object, callback) {
  if (!_.isObject(object)) {
    return callback('Invalid Object (Must be of type Object) - UserSchema.GetUserWithObject()', null);
  }

  var self = this;

  var limit = object.limit === null ? 10 : object.limit;
  var page = object.page === null ? 0 : object.page;
  var search = object.search === null ? '' : object.search;

  var q = self
    .model(COLLECTION)
    .find({}, '-password -resetPassHash -resetPassExpire')
    .sort({ fullname: 1 })
    .skip(page * limit);
  if (limit !== -1) {
    q.limit(limit);
  }

  // if (!object.showDeleted) q.where({ deleted: false });

  if (!_.isEmpty(search)) {
    q.where({
      $or: [
        {
          fullname: new RegExp('^' + search.toLowerCase(), 'i'),
        },
        {
          email: new RegExp('^' + search.toLowerCase(), 'i'),
        },
        {
          username: new RegExp('^' + search.toLowerCase(), 'i'),
        },
        {
          deleted: !object.showDeleted,
        },
      ],
    });
  }

  return q.exec(callback);
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
userSchema.statics.getAssigneeUsers = function (callback) {
  var roles = global.roles;
  if (_.isUndefined(roles)) return callback(null, []);

  var assigneeRoles = [];
  async.each(roles, function (role) {
    if (role.isAgent) assigneeRoles.push(role._id);
  });

  assigneeRoles = _.uniq(assigneeRoles);
  this.model(COLLECTION).find({ role: { $in: assigneeRoles }, deleted: false }, function (err, users) {
    if (err) {
      winston.warn(err);
      return callback(err, null);
    }

    return callback(null, _.sortBy(users, 'fullname'));
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
userSchema.statics.getUsersByRoles = function (roles, callback) {
  if (_.isUndefined(roles)) return callback('Invalid roles array', null);
  if (!_.isArray(roles)) {
    roles = [roles];
  }

  var q = this.model(COLLECTION).find({ role: { $in: roles }, deleted: false });

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
userSchema.statics.createUser = function (data, callback) {
  if (_.isUndefined(data) || _.isUndefined(data.username)) {
    return callback('Invalid User Data - UserSchema.CreateUser()', null);
  }

  var self = this;

  self.model(COLLECTION).find({ username: data.username }, function (err, items) {
    if (err) {
      return callback(err, null);
    }

    if (_.size(items) > 0) {
      return callback('Username Already Exists', null);
    }

    return self.collection.insert(data, callback);
  });
};

/**
 * Creates a user with only Email address. Emails user password.
 *
 * @param email
 * @param callback
 */
userSchema.statics.createUserFromEmail = async function (email, fullname, callback) {
  if (_.isUndefined(email)) {
    return callback('Invalid User Data - UserSchema.CreatePublicUser()', null);
  }

  var self = this;

  var settingSchema = require('./setting');
  settingSchema.getSetting('role:user:default', function (err, userRoleDefault) {
    if (err || !userRoleDefault) return callback('Invalid Setting - UserRoleDefault');

    var Chance = require('chance');

    var chance = new Chance();

    function passGenerate() {
      let passResult = false;
      while (passResult == false) {
        let pass = chance.string({
          length: 8,
          pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890',
          alpha: true,
          numeric: true,
          casing: 'lower',
        });
        if (pass.match(/[0-9]/) && pass.match(/[a-z]/) && pass.match(/[A-Z]/)) {
          passResult = true;
          return pass;
        }
      }
    }

    var plainTextPass = passGenerate();

    var user = new self({
      // username: email.split('@')[0],
      username: email,
      email: email,
      password: plainTextPass,
      fullname: fullname,
      role: userRoleDefault.value,
    });

    self.model(COLLECTION).find({ username: user.username }, function (err, items) {
      if (err) return callback(err);
      if (_.size(items) > 0) return callback('Username already exists');

      user.save(function (err, savedUser) {
        if (err) return callback(err);
        //++ ShaturaPro LIN 03.08.2022
        var DomainSchema = require('./domain'); //Получение модели домена
        var domain = new DomainSchema({
          name: savedUser.email.split('@')[1],
        });
        mongoose.model('domains').find({ name: domain.name }, function (err, items) {
          // Поиск домена в базе данных
          if (err) return callback(err);
          if (items.length > 0) return true; //callback('Domain already exist');
          domain.save(function (err, domain) {
            if (err) return callback(err);
          });
        });
        // Если уже существует группа с данным доменом, то добавить туда пользователя
        mongoose.model('groups').findOne({ domainName: email.split('@')[1] }, function (err, group) {
          if (err) return callback(err);
          if (group == null) {
            mongoose.model('settings').findOne({ name: 'gen:defaultGroup' }, function (err, setting) {
              mongoose.model('groups').findById(setting.value, function (err, group) {
                if (err) return callback(err);
                if (group) {
                  group.members.push(user._id);
                  group.save();
                  return callback(null, { user: user, group: group, userPassword: plainTextPass });
                } else {
                  return callback(null, { user: user, group: group, userPassword: plainTextPass });
                }
              });
            });
          } else {
            group.addMember(user._id, function (err, userGroup) {
              if (err) return callback(err);
              group.save(); //Сохранение добавления члена группы
              return callback(null, { user: user, group: group, userPassword: plainTextPass });
            });
          }
        });
      });
      //-- ShaturaPRO LIN
    });
  });
};

//++ ShaturaPRO LIN Chatwoot login
userSchema.statics.createUserFromChatwoot = async function (payload, callback) {
  email = payload.email;

  if (_.isUndefined(email)) {
    return callback('Invalid User Data - UserSchema.CreatePublicUser()', null);
  }

  var self = this;

  var settingSchema = require('./setting');
  settingSchema.getSetting('role:user:default', function (err, userRoleDefault) {
    if (err || !userRoleDefault) return callback('Invalid Setting - UserRoleDefault');

    var Chance = require('chance');

    var chance = new Chance();

    function passGenerate() {
      let passResult = false;
      while (passResult == false) {
        let pass = chance.string({
          length: 8,
          pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890',
          alpha: true,
          numeric: true,
          casing: 'lower',
        });
        if (pass.match(/[0-9]/) && pass.match(/[a-z]/) && pass.match(/[A-Z]/)) {
          passResult = true;
          return pass;
        }
      }
    }

    var plainTextPass = passGenerate();

    var user = new self({
      username: payload.username,
      email: email,
      password: plainTextPass,
      fullname: email.split('@')[0],
      role: userRoleDefault.value,
      phone: payload.phone,
    });

    self.model(COLLECTION).find({ username: user.username }, function (err, items) {
      if (err) return callback(err);
      if (_.size(items) > 0) return callback('Username already exists');

      user.save(function (err, savedUser) {
        if (err) return callback(err);

        var DomainSchema = require('./domain'); //Получение модели домена
        var domain = new DomainSchema({
          name: savedUser.email.split('@')[1],
        });

        mongoose.model('domains').find({ name: domain.name }, function (err, items) {
          // Поиск домена в базе данных
          if (err) return callback(err);
          if (_.size(items) > 0) return true; //callback('Domain already exist');
          domain.save(function (err, domain) {
            if (err) return callback(err);
            console.log('Domain found');
            return true;
          });
        });

        // Если уже существует группа с данным доменом, то добавить туда пользователя
        mongoose.model('groups').findOne({ domainName: email.split('@')[1] }, function (err, group) {
          if (err) return callback(err);
          if (group == null) return callback('The group with this domain does not exist. Link the domain to the group');
          group.addMember(user._id, function (err, user) {
            if (err) return callback(err);
            group.save(); //Сохранение добавления члена группы
            console.log('The user has been added to the group');
            return true;
          });
        });
      });
      //-- ShaturaPRO LIN
    });
  });
};
//-- ShaturaPRO LIN Chatwoot login

userSchema.statics.getCustomers = function (obj, callback) {
  var limit = obj.limit || 10;
  var page = obj.page || 0;
  var self = this;
  var search = obj.search === null ? '' : obj.search;
  return self
    .model(COLLECTION)
    .find({}, '-password -resetPassHash -resetPassExpire')
    .exec(function (err, accounts) {
      if (err) return callback(err);

      var customerRoleIds = _.filter(accounts, function (a) {
        return !a.role.isAdmin && !a.role.isAgent;
      }).map(function (a) {
        return a.role._id;
      });

      var q = self
        .find({ role: { $in: customerRoleIds } }, '-password -resetPassHash -resetPassExpire')
        .sort({ fullname: 1 })
        .skip(page * limit)
        .limit(limit);

      if (!obj.showDeleted)
        q.where({
          $or: [
            {
              fullname: new RegExp('^' + search.toLowerCase(), 'i'),
            },
            {
              email: new RegExp('^' + search.toLowerCase(), 'i'),
            },
            {
              username: new RegExp('^' + search.toLowerCase(), 'i'),
            },
            {
              deleted: !object.showDeleted,
            },
          ],
        });

      q.exec(callback);
    });
};

userSchema.statics.getAgents = function (obj, callback) {
  var limit = obj.limit || 10;
  var page = obj.page || 0;
  var self = this;

  return self
    .model(COLLECTION)
    .find({})
    .exec(function (err, accounts) {
      if (err) return callback(err);

      var agentRoleIds = _.filter(accounts, function (a) {
        return a.role.isAgent;
      }).map(function (a) {
        return a.role._id;
      });

      var q = self
        .model(COLLECTION)
        .find({ role: { $in: agentRoleIds } }, '-password -resetPassHash -resetPassExpire')
        .sort({ fullname: 1 })
        .skip(page * limit)
        .limit(limit);

      if (!obj.showDeleted) q.where({ deleted: false });

      q.exec(callback);
    });
};

userSchema.statics.getAdmins = function (obj, callback) {
  var limit = obj.limit || 10;
  var page = obj.page || 0;
  var self = this;

  return self
    .model(COLLECTION)
    .find({})
    .exec(function (err, accounts) {
      if (err) return callback(err);

      var adminRoleIds = _.filter(accounts, function (a) {
        return a.role.isAdmin;
      }).map(function (a) {
        return a.role._id;
      });

      var q = self
        .model(COLLECTION)
        .find({ role: { $in: adminRoleIds } }, '-password -resetPassHash -resetPassExpire')
        .sort({ fullname: 1 })
        .skip(page * limit)
        .limit(limit);

      if (!obj.showDeleted) q.where({ deleted: false });

      q.exec(callback);
    });
};

module.exports = mongoose.model(COLLECTION, userSchema);
