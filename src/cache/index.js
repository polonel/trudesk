/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/16/2016
 Author:     Chris Brame

 */

var NodeCache   = require('node-cache'),
    async       = require('async'),
    path        = require('path'),
    nconf       = require('nconf'),
    _           = require('underscore'),
    winston     = require('winston');
    moment      = require('moment');
var emitter     = require('../emitter');

var truCache = {};
var cache;

global.env = process.env.NODE_ENV || 'production';

winston.setLevels(winston.config.cli.levels);
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    timestamp: function() {
        var date = new Date();
        return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.toTimeString().substr(0,8) + ' [Child:Cache:' + global.process.pid + ']';
    },
    level: global.env === 'production' ? 'info' : 'verbose'
});

function loadConfig() {
    nconf.file({
        file: path.join(__dirname, '/../../config.json')
    });

    nconf.defaults({
        base_dir: __dirname
    });
}

var refreshTimer;
var now = moment();
var lastUpdated = moment();

truCache.init = function(callback) {
    cache = new NodeCache({
        checkperiod: 0
    });


    truCache.refreshCache(function() {
        winston.debug('Cache Loaded');
        restartRefreshClock();

        return callback();
    });
};

function restartRefreshClock() {
    if (refreshTimer)
        clearInterval(refreshTimer);

    lastUpdated = moment();

    refreshTimer = setInterval(function() {
        truCache.refreshCache();
        winston.debug('Refreshing Cache...');
    }, 55 * 60 * 1000);
}

truCache.refreshCache = function(callback) {
    async.waterfall([
        function(done) {
            var ticketSchema = require('../models/ticket');
            ticketSchema.getAllNoPopulate(function(err, tickets) {
                if (err) return done(err);

                return done(null, tickets);
            });
        },

        function(tickets, cb) {
            async.parallel([
                function(done) {
                    var ticketStats = require('./ticketStats');
                    ticketStats(tickets, function(err, stats) {
                        if (err) return done(err);
                        cache.set('tickets:overview:lastUpdated', stats.lastUpdated, 3600);

                        cache.set('tickets:overview:e30:ticketCount', stats.e30.tickets, 3600);
                        cache.set('tickets:overview:e30:closedTickets', stats.e30.closedTickets, 3600);
                        cache.set('tickets:overview:e30:responseTime', stats.e30.avgResponse, 3600);
                        cache.set('tickets:overview:e30:graphData', stats.e30.graphData, 3600);

                        cache.set('tickets:overview:e60:ticketCount', stats.e60.tickets, 3600);
                        cache.set('tickets:overview:e60:closedTickets', stats.e60.closedTickets, 3600);
                        cache.set('tickets:overview:e60:responseTime', stats.e60.avgResponse, 3600);
                        cache.set('tickets:overview:e60:graphData', stats.e60.graphData, 3600);

                        cache.set('tickets:overview:e90:ticketCount', stats.e90.tickets, 3600);
                        cache.set('tickets:overview:e90:closedTickets', stats.e90.closedTickets, 3600);
                        cache.set('tickets:overview:e90:responseTime', stats.e90.avgResponse, 3600);
                        cache.set('tickets:overview:e90:graphData', stats.e90.graphData, 3600);

                        cache.set('tickets:overview:e180:ticketCount', stats.e180.tickets, 3600);
                        cache.set('tickets:overview:e180:closedTickets', stats.e180.closedTickets, 3600);
                        cache.set('tickets:overview:e180:responseTime', stats.e180.avgResponse, 3600);
                        cache.set('tickets:overview:e180:graphData', stats.e180.graphData, 3600);

                        cache.set('tickets:overview:e365:ticketCount', stats.e365.tickets, 3600);
                        cache.set('tickets:overview:e365:closedTickets', stats.e365.closedTickets, 3600);
                        cache.set('tickets:overview:e365:responseTime', stats.e365.avgResponse, 3600);
                        cache.set('tickets:overview:e365:graphData', stats.e365.graphData, 3600);

                        cache.set('tickets:overview:lifetime:ticketCount', stats.lifetime.tickets, 3600);
                        cache.set('tickets:overview:lifetime:closedTickets', stats.lifetime.closedTickets, 3600);
                        cache.set('tickets:overview:lifetime:responseTime', stats.lifetime.avgResponse, 3600);
                        cache.set('tickets:overview:lifetime:graphData', stats.lifetime.graphData, 3600);

                        return done();
                    });
                },
                function(done) {
                    var tagStats = require('./tagStats');
                    async.parallel([
                        function(c) {
                            tagStats(tickets, 30, function(err, stats) {
                                if (err) return c(err);

                                cache.set('tags:30:usage', stats, 3600);

                                return  c();
                            });
                        },
                        function(c) {
                            tagStats(tickets, 60, function(err, stats) {
                                if (err) return c(err);

                                cache.set('tags:60:usage', stats, 3600);

                                return c();
                            });
                        },
                        function(c) {
                            tagStats(tickets, 90, function(err, stats) {
                                if (err) return c(err);

                                cache.set('tags:90:usage', stats, 3600);

                                return c();
                            });
                        },
                        function(c) {
                            tagStats(tickets, 180, function(err, stats) {
                                if (err) return c(err);

                                cache.set('tags:180:usage', stats, 3600);

                                return c();
                            });
                        },
                        function(c) {
                            tagStats(tickets, 365, function(err, stats) {
                                if (err) return c(err);

                                cache.set('tags:365:usage', stats, 3600);

                                return c();
                            });
                        },
                        function(c) {
                            tagStats(tickets, 0, function(err, stats) {
                                if (err) return c(err);

                                cache.set('tags:0:usage', stats, 3600);

                                return c();
                            });
                        }
                    ], function(err) {
                        return done(err);
                    });
                },
                function(done) {
                    var quickStats = require('./quickStats');
                    quickStats(tickets, function(err, stats) {
                        if (err) return done(err);

                        cache.set('quickstats:mostRequester', stats.mostRequester, 3600);
                        cache.set('quickstats:mostCommenter', stats.mostCommenter, 3600);
                        cache.set('quickstats:mostAssignee', stats.mostAssignee, 3600);
                        cache.set('quickstats:mostActiveTicket', stats.mostActiveTicket, 3600);

                        return done();
                    });
                }
            ], function(err) {
                return cb(err);
            });
        }

    ], function(err) {
        if (err) return winston.warn(err);
        //Send to parent
        process.send({cache: cache});

        //var pm2 = require('pm2');
        //pm2.connect(function(err) {
        //    if (err) throw err;
        //
        //    pm2.list(function(err, list) {
        //        list.forEach(function(item) {
        //            if (item.name === 'trudesk') {
        //                pm2.sendDataToProcessId(item.pm_id, {
        //                     type: 'process:msg',
        //                     data: {
        //                         cache: cache
        //                     },
        //                     topic: 'trudesk'
        //                 }, function(err, res) {
        //                     console.log(err);
        //                 });
        //
        //                 pm2.disconnect();
        //             }
        //        });
        //
        //    });
        //});

        if (!_.isUndefined(callback) && _.isFunction(callback))
            callback(err);
    });
};

//Fork of Main
(function() {
    process.on('message', function(message) {
        if (message.name == 'cache:refresh') {
            winston.debug('Refreshing Cache....');
            var now = moment();
            var timeSinceLast = Math.round(moment.duration(now.diff(lastUpdated)).asMinutes());
            if (timeSinceLast < 30) {
                var i = 30 - timeSinceLast;
                winston.debug('Cannot refresh cache for another ' + i + ' minutes');
                return false;
            }

            truCache.refreshCache(function() {
                winston.debug('Cache Refreshed at ' + lastUpdated.format('hh:mm:ssa'));
                restartRefreshClock();
            });
        }
    });

    loadConfig();
    var db = require('../database');
    db.init(function(err, db) {
        if (err) return winston.error(err);
        truCache.init(function(err) {
            if (err) {
                winston.error(err);
                process.exit();
            }
        });
    });
})();

module.exports = truCache;