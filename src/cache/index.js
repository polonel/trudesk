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
    _           = require('underscore'),
    winston     = require('winston');

var truCache = {};

truCache.init = function(callback) {
    global.cache = new NodeCache({
        checkperiod: 0
    });

    this.refreshCache(function() {
        winston.info('Cache Loaded');
        setInterval(function() {
            truCache.refreshCache();
            winston.debug('Refreshing Cache...');
        }, 55 * 60 * 1000);

        callback();
    });

};

truCache.refreshCache = function(callback) {
    var ticketStats = require('./ticketStats');
    ticketStats(function(err, stats) {
        cache.set('tickets:overview:lastUpdated', stats.lastUpdated, 3600);

        cache.set('tickets:overview:e30:closedTickets', stats.e30.closedTickets, 3600);
        cache.set('tickets:overview:e30:responseTime', stats.e30.avgResponse, 3600);
        cache.set('tickets:overview:e30:graphData', stats.e30.graphData, 3600);

        cache.set('tickets:overview:e60:closedTickets', stats.e60.closedTickets, 3600);
        cache.set('tickets:overview:e60:responseTime', stats.e60.avgResponse, 3600);
        cache.set('tickets:overview:e60:graphData', stats.e60.graphData, 3600);

        cache.set('tickets:overview:e90:closedTickets', stats.e90.closedTickets, 3600);
        cache.set('tickets:overview:e90:responseTime', stats.e90.avgResponse, 3600);
        cache.set('tickets:overview:e90:graphData', stats.e90.graphData, 3600);

        cache.set('tickets:overview:e180:closedTickets', stats.e180.closedTickets, 3600);
        cache.set('tickets:overview:e180:responseTime', stats.e180.avgResponse, 3600);
        cache.set('tickets:overview:e180:graphData', stats.e180.graphData, 3600);

        cache.set('tickets:overview:e365:closedTickets', stats.e365.closedTickets, 3600);
        cache.set('tickets:overview:e365:responseTime', stats.e365.avgResponse, 3600);
        cache.set('tickets:overview:e365:graphData', stats.e365.graphData, 3600);

        if (!_.isUndefined(callback) && _.isFunction(callback))
            callback();
    });
};

module.exports = truCache;