/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
*/

var _               = require('underscore');
var async           = require('async');
var winston         = require('winston');
var taskSchema      = require('../models/task');
var reportSchema    = require('../models/report');

var userSchema      = require('../models/user');
var ticketSchema    = require('../models/ticket');

/**
 * @namespace
 */
(function() {
    //Start up Task Runners
    winston.debug('Starting Runners...');

    taskSchema.getTasks(function(err, items) {
        if (err) {
            return winston.warn('Task Runner Error: ' + err.message);
        }

        winston.debug('Number of Tasks: ' + _.size(items));
    });

    winston.debug('Report Runner Started.');
    ReportRunner();
    setInterval(ReportRunner, 60000);

})();

/**
 * Report Runner
 * @method
 */
function ReportRunner() {
    reportSchema.getRunnableReports(function(err, items) {
        if (err) return winston.warn('Report Runner Error: ' + err.message);

        async.eachSeries(items, function(item, next) {
            winston.debug('Processing Report: ' + item.name);

            if (item.type === 1) {
                ProcessUserReports(item, next);
            }


        }, function(err, results) {

        });
    });
}

/***
 * Generates an array of tickets the user owns or has commented on.
 * Includes history items.
 *
 * @param {ReportObject} item
 * @callback callback (err, array<tickets>)
 **/
function ProcessUserReports(item, callback) {
    if (_.isUndefined(item.data) ||
        _.isUndefined(item.data.user) ||
        _.isUndefined(item.data.period) ||
        _.isUndefined(item.data.period.start) ||
        _.isUndefined(item.data.period.end))

        callback();

    var user = item.data.user;
    var pStart = item.data.period.start;
    var pEnd = item.data.period.end;

    
}