/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/24/18
 Author:     Chris Brame

 **/

var _               = require('lodash');
var async           = require('async');
var winston         = require('winston');

var settingsSchema  = require('../models/setting');

var settingsDefaults = {};

settingsDefaults.init = function(callback) {
    winston.debug('Checking Default Settings...');
    async.parallel([
        function(done) {
            return showTourSettingDefault(done);
        },
        function(done) {
            return ticketTypeSettingDefault(done);
        }
    ], function(err) {
        if (_.isFunction(callback))
            return callback(err);
    });
};

function showTourSettingDefault(callback) {
    settingsSchema.getSettingByName('showTour:enable', function(err, setting) {
        if (err) {
            winston.warn(err);
            if (_.isFunction(callback)) return callback(err);
            return;
        }

        if (!setting) {
            var defaultShowTour = new settingsSchema({
                name: 'showTour:enable',
                value: 0
            });

            defaultShowTour.save(function(err) {
                if (err) {
                    winston.warn(err);
                    if (_.isFunction(callback)) return callback(err);
                }

                if (_.isFunction(callback)) return callback();
            });
        } else {
            if (_.isFunction(callback)) return callback();
        }
    });
}

function ticketTypeSettingDefault(callback) {
    settingsSchema.getSettingByName('ticket:type:default', function(err, setting) {
        if (err) {
            winston.warn(err);
            if (_.isFunction(callback))
                return callback(err);
        }

        if (!setting) {
            var ticketTypeSchema = require('../models/tickettype');
            ticketTypeSchema.getTypes(function(err, types) {
                if (err) {
                    winston.warn(err);
                    if (_.isFunction(callback))
                        return callback(err);
                    return;
                }

                var type = _.first(types);
                // Save default ticket type
                var defaultTicketType = new settingsSchema({
                    name: 'ticket:type:default',
                    value: type._id
                });

                defaultTicketType.save(function(err) {
                    if (err) {
                        winston.warn(err);
                        if (_.isFunction(callback))
                            return callback(err);
                    }

                    if (_.isFunction(callback))
                        return callback();
                });
            });
        } else {
            if (_.isFunction(callback))
                return callback();
        }
    });
}

module.exports = settingsDefaults;