/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/15/2016
 Author:     Chris Brame

 **/

var _               = require('underscore');
var async           = require('async');
var moment          = require('moment');

var userSchema      = require('../models/user');
var ticketSchema    = require('../models/ticket');

var ex = {};

var init = function(tickets, callback) {
    var ticketAvg   = {};
    var $tickets    = [];
    ex.e30          = {};
    ex.e60          = {};
    ex.e90          = {};
    ex.e180         = {};
    ex.e365         = {};
    ex.lifetime     = {};
    ex.lastUpdated = moment().format('MM-DD-YYYY hh:mm:ssa');
    var today = moment().hour(23).minute(59).second(59);
    var e30 = today.clone().subtract(30, 'd'),
        e60 = today.clone().subtract(60, 'd'),
        e90 = today.clone().subtract(90, 'd'),
        e180 = today.clone().subtract(180, 'd'),
        e365 = today.clone().subtract(365, 'd');

    async.series({
        allTickets: function(c) {
            if (tickets) {
                $tickets = tickets;

                c();
            } else {
                ticketSchema.getAllNoPopulate(function(err, tickets) {
                    if (err) return c(err);

                    $tickets = tickets;

                    c();
                });
            }
        },
        e30: function(c) {
            if (_.size($tickets) < 1) return c();
            ex.e30.tickets = _.filter($tickets, function(v) {
                return (v.date < today.toDate() && v.date > e30.toDate());
            });

            ex.e30.closedTickets = _.filter(ex.e30.tickets, function(v) {
                return v.status === 3;
            });

            buildGraphData(ex.e30.tickets, 30, function(graphData) {
                ex.e30.graphData = graphData;

                buildAvgResponse(ex.e30.tickets, function(obj) {
                    ex.e30.avgResponse = obj.avgResponse;
                    ex.e30.tickets = _.size(ex.e30.tickets);
                    ex.e30.closedTickets = _.size(ex.e30.closedTickets);
                    c();
                });
            });
        },
        e60: function(c) {
            if (_.size($tickets) < 1) return c();
            ex.e60.tickets = _.filter($tickets, function(v) {
                return (v.date < today.toDate() && v.date > e60.toDate());
            });

            ex.e60.closedTickets = _.filter(ex.e60.tickets, function(v) {
                return v.status === 3;
            });

            buildGraphData(ex.e60.tickets, 60, function(graphData) {
                ex.e60.graphData = graphData;

                buildAvgResponse(ex.e60.tickets, function(obj) {
                    ex.e60.avgResponse = obj.avgResponse;
                    ex.e60.tickets = _.size(ex.e60.tickets);
                    ex.e60.closedTickets = _.size(ex.e60.closedTickets);
                    c();
                });
            });
        },
        e90: function(c) {
            if (_.size($tickets) < 1) return c();
            ex.e90.tickets = _.filter($tickets, function(v) {
                return (v.date < today.toDate() && v.date > e90.toDate());
            });

            ex.e90.closedTickets = _.filter(ex.e90.tickets, function(v) {
                return v.status === 3;
            });

            buildGraphData(ex.e90.tickets, 90, function(graphData) {
                ex.e90.graphData = graphData;

                buildAvgResponse(ex.e90.tickets, function(obj) {
                    ex.e90.avgResponse = obj.avgResponse;
                    ex.e90.tickets = _.size(ex.e90.tickets);
                    ex.e90.closedTickets = _.size(ex.e90.closedTickets);
                    c();
                });
            });
        },
        e180: function(c) {
            if (_.size($tickets) < 1) return c();
            ex.e180.tickets = _.filter($tickets, function(v) {
                return (v.date < today.toDate() && v.date > e180.toDate());
            });

            ex.e180.closedTickets = _.filter(ex.e180.tickets, function(v) {
                return v.status === 3;
            });

            buildGraphData(ex.e180.tickets, 180, function(graphData) {
                ex.e180.graphData = graphData;

                buildAvgResponse(ex.e180.tickets, function(obj) {
                    ex.e180.avgResponse = obj.avgResponse;
                    ex.e180.tickets = _.size(ex.e180.tickets);
                    ex.e180.closedTickets = _.size(ex.e180.closedTickets);
                    c();
                });
            });
        },
        e365: function(c) {
            if (_.size($tickets) < 1) return c();
            ex.e365.tickets = _.filter($tickets, function(v) {
                return (v.date < today.toDate() && v.date > e365.toDate());
            });

            ex.e365.closedTickets = _.filter(ex.e365.tickets, function(v) {
                return v.status === 3;
            });

            buildGraphData(ex.e365.tickets, 365, function(graphData) {
                ex.e365.graphData = graphData;

                //Get average Response
                buildAvgResponse(ex.e365.tickets, function(obj) {
                    ex.e365.avgResponse = obj.avgResponse;
                    ex.e365.tickets = _.size(ex.e365.tickets);
                    ex.e365.closedTickets = _.size(ex.e365.closedTickets);

                    c();
                });
            });
        },
        lifetime: function(c) {
            if (_.size($tickets) < 1) return c();
            ex.lifetime.tickets = _.sortBy($tickets, 'uid');

            ex.lifetime.closedTickets = _.filter(ex.lifetime.tickets, function(v) {
                return v.status === 3;
            });

            var firstDate = moment(_.first(ex.lifetime.tickets).date).subtract(30, 'd');
            var diffDays = today.diff(firstDate, 'days');

            buildGraphData(ex.lifetime.tickets, diffDays, function(graphData) {
                ex.lifetime.graphData = graphData;

                //Get average Response
                buildAvgResponse(ex.lifetime.tickets, function(obj) {
                    ex.lifetime.avgResponse = obj.avgResponse;
                    ex.lifetime.tickets = _.size(ex.lifetime.tickets);
                    ex.lifetime.closedTickets = _.size(ex.lifetime.closedTickets);

                    c();
                });
            });
        }
    }, function(err) {
        $tickets = null; //Clear it
        callback(err, ex);
    });
};

function buildGraphData(arr, days, callback) {
    var graphData = [];
    var today = moment().hour(23).minute(59).second(59);
    var timespanArray = [];
    for (var i=days;i--;) {
        timespanArray.push(i);
    }
    async.eachSeries(timespanArray, function(day, next) {
        var obj = {};
        var d = today.clone().subtract(day, 'd');
        obj.date = d.format('YYYY-MM-DD');

        var $dateCount = _.filter(arr, function(v) {
            return (v.date <= d.toDate() && v.date >= d.clone().subtract(1, 'd').toDate())
        });

        $dateCount = _.size($dateCount);
        obj.value = $dateCount;
        graphData.push(obj);

        async.setImmediate(function() {
            next();
        });

    }, function() {
         callback(graphData);
    });
}

function buildAvgResponse(ticketArray, callback) {
    var cbObj = {};
    var $ticketAvg = [];
    for (var i = 0; i < ticketArray.length; i++) {
        var ticket = ticketArray[i];
        if (ticket.comments.length < 1) continue;

        var ticketDate = moment(ticket.date);
        var firstCommentDate = moment(ticket.comments[0].date);

        var diff = firstCommentDate.diff(ticketDate, 'seconds');
        $ticketAvg.push(diff);

        //Next Event Loop - async@2.0
        // async.setImmediate(function() {
        //     return callback();
        // });

    }

    var ticketAvgTotal = _($ticketAvg).reduce(function (m, x) {
        return m + x;
    }, 0);

    var tvt = moment.duration(Math.round(ticketAvgTotal / _.size($ticketAvg)), 'seconds').asHours();
    cbObj.avgResponse = Math.floor(tvt);

    return callback(cbObj);
}

module.exports = init;