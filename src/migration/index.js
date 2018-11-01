/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    10/31/2018
 Author:     Chris Brame

 **/

var _               = require('lodash');
var async           = require('async');
var winston         = require('winston');
var moment          = require('moment-timezone');

var SettingsSchema  = require('../models/setting');
var userSchema      = require('../models/user');
var roleSchema      = require('../models/role');

var migrations = {};

function migrateUserRoles(callback) {
    async.waterfall([
        function(next) {
            roleSchema.getRoles(next);
        },
        function(roles, next) {
            var adminRole = _.find(roles, {normalized: 'admin'});
            userSchema.collection.update({role: 'admin'}, { $set: { role: adminRole._id }}, {multi: true}).then(function(res) {
                if (res && res.result) {
                    if (res.result.ok === 1)
                        return next(null, roles);

                    winston.warn(res.message);
                    return next(res.message);
                }
            });
        },
        function(roles, next) {
            var supportRole = _.find(roles, {normalized: 'support'});
            userSchema.collection.update({$or: [{role: 'support'}, {role:'mod'}]}, { $set: { role: supportRole._id }}, {multi: true}).then(function(res) {
                if (res && res.result) {
                    if (res.result.ok === 1)
                        return next(null, roles);

                    winston.warn(res.message);
                    return next(res.message);
                }
            });
        },
        function(roles, next) {
            var userRole = _.find(roles, {normalized: 'user'});
            userSchema.collection.update({role: 'user'}, { $set: { role: userRole._id }}, {multi: true}).then(function(res) {
                if (res && res.result) {
                    if (res.result.ok === 1)
                        return next(null, roles);

                    winston.warn(res.message);
                    return next(res.message);
                }
            });
        }
    ], callback);
}

migrations.run = function(callback) {
    async.series([
        function(next) {
            migrateUserRoles(next);
        }
    ], callback);
};

module.exports = migrations;