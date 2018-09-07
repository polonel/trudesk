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
var prioritySchema  = require('../models/ticketpriority');

var settingsDefaults = {};

settingsDefaults.init = function(callback) {
    winston.debug('Checking Default Settings...');
    async.series([
        function(done) {
            return showTourSettingDefault(done);
        },
        function(done) {
            return ticketTypeSettingDefault(done);
        },
        function(done) {
            return ticketPriorityDefaults(done);
        },
        function(done) {
            return addedDefaultPrioritesToTicketTypes(done);
        },
        function(done) {
            return checkPriorities(done);
        }
    ], function() {
        if (_.isFunction(callback))
            return callback();
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

function ticketPriorityDefaults(callback) {
    var priorities = [];

    var normal = new prioritySchema({
        name: 'Normal',
        migrationNum: 1,
        default: true
    });

    var urgent = new prioritySchema({
        name: 'Urgent',
        migrationNum: 2,
        htmlColor: '#8e24aa',
        default: true
    });

    var critical = new prioritySchema({
        name: 'Critical',
        migrationNum: 3,
        htmlColor: '#e65100',
        default: true
    });

    priorities.push(normal);
    priorities.push(urgent);
    priorities.push(critical);
    async.each(priorities, function(item, next) {
        prioritySchema.findOne({migrationNum: item.migrationNum}, function(err, priority) {
            if (!err && (_.isUndefined(priority) || _.isNull(priority))) {
                return item.save(next);
            } else {
                return next(err);
            }
        });
    }, callback);
}

function checkPriorities(callback) {
    var ticketSchema = require('../models/ticket');
    var migrateP1 = false,
        migrateP2 = false,
        migrateP3 = false;

    async.parallel([
        function(done) {
            ticketSchema.collection.countDocuments({priority: 1}).then(function(count) {
                migrateP1 = count > 0;
                return done();
            });
        },
        function(done) {
            ticketSchema.collection.countDocuments({priority: 2}).then(function(count) {
                migrateP2 = count > 0;
                return done();
            });
        },
        function(done) {
            ticketSchema.collection.countDocuments({priority: 3}).then(function(count) {
                migrateP3 = count > 0;
                return done();
            });
        }
    ], function() {
        async.parallel([
            function(done) {
                if (!migrateP1) return done();
                prioritySchema.getByMigrationNum(1, function(err, normal) {
                    if (!err) {
                        winston.debug('Converting Priority: Normal');
                        return ticketSchema.collection.update({priority: 1}, { $set: { priority: normal._id }}, {multi: true}).then(function(res) {
                            if (res && res.result) {
                                if (res.result.ok === 1)
                                    return done();
                                else {
                                    winston.warn(res.message);
                                    return done(res.message);
                                }
                            }
                        });
                    } else {
                        winston.warn(err.message);
                        return done();
                    }
                });
            },
            function(done) {
                if (!migrateP2) return done();
                prioritySchema.getByMigrationNum(2, function(err, urgent) {
                    if (!err) {
                        winston.debug('Converting Priority: Urgent');
                        return ticketSchema.collection.update({priority: 2 }, {$set: {priority: urgent._id }}, {multi: true}).then(function(res) {
                            if (res && res.result) {
                                if (res.result.ok === 1)
                                    return done();
                                else {
                                    winston.warn(res.message);
                                    return done(res.message);
                                }
                            }
                        });
                    } else {
                        winston.warn(err.message);
                        return done();
                    }
                });
            },
            function(done) {
                if (!migrateP3) return done();
                prioritySchema.getByMigrationNum(3, function(err, critical) {
                    if (!err) {
                        winston.debug('Converting Priority: Critical');
                        return ticketSchema.collection.update({priority: 3}, { $set: { priority: critical._id }}, {multi: true}).then(function(res) {
                            if (res && res.result) {
                                if (res.result.ok === 1)
                                    return done();
                                else {
                                    winston.warn(res.message);
                                    return done(res.message);
                                }
                            }
                        });
                    } else {
                        winston.warn(err.message);
                        return done();
                    }
                });
            }
        ], callback);
    });
}

function addedDefaultPrioritesToTicketTypes(callback) {
    async.waterfall([
        function(next) {
            prioritySchema.find({default: true})
                .then(function(results) {
                    return next(null, results);
                })
                .catch(next);
        },
        function(priorities, next) {
            priorities = _.sortBy(priorities, 'migrationNum');
            var ticketTypeSchema = require('../models/tickettype');
            ticketTypeSchema.getTypes(function(err, types) {
                if (err) return next(err);

                async.each(types, function(type, done) {
                    var prioritiesToAdd = [];
                    if (!type.priorities) {
                        type.priorities = [];
                        prioritiesToAdd = _.map(priorities, '_id');
                    } else if (type.priorities.length < 1) {
                        type.priorities = [];
                        prioritiesToAdd = _.map(priorities, '_id');
                    }
                    // } else {
                    //   _.each(priorities, function(priority) {
                    //       if (!_.find(type.priorities, {'_id': priority._id})) {
                    //           winston.debug('Adding default priority %s to ticket type %s', priority.name, type.name);
                    //           prioritiesToAdd.push(priority._id);
                    //       }
                    //   });
                    // }

                    if (prioritiesToAdd.length < 1)
                        return done();

                    type.priorities = _.concat(type.priorities, prioritiesToAdd);
                    type.save(done);

                }, function() {
                    next(null);
                });
            });
        }
    ], callback);
}

module.exports = settingsDefaults;