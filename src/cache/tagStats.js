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

var _               = require('lodash');
var async           = require('async');
var moment          = require('moment');

var ticketSchema    = require('../models/ticket');

var init = function(tickets, timespan, callback) {
    var tags = [];
    var $tickets = [];
    if (_.isUndefined(timespan) || _.isNaN(timespan) || timespan === 0) timespan = 99999;

    var today = moment().hour(23).minute(59).second(59);
    var tsDate = today.clone().subtract(timespan, 'd').toDate().getTime();
    today = today.toDate().getTime();

    async.series([
        function(done) {
            if (tickets) {
                ticketSchema.populate(tickets, {path: 'tags'}, function(err, _tickets) {
                    if (err) return done(err);

                    $tickets = _tickets;
                    return done();
                });
            } else {
                ticketSchema.getForCache(function(err, tickets) {
                    if (err) return done(err);
                    ticketSchema.populate(tickets, {path: 'tags'}, function(err, _tickets) {
                        if (err) return done(err);

                        $tickets = _tickets;

                        return done();
                    });
                });
            }
        },
        function(done) {
            var t = [];

            $tickets = _.filter($tickets, function(v) {
                return (v.date < today && v.date > tsDate);
            });

            for (var i = 0; i < $tickets.length; i++) {
                _.each(tickets[i].tags, function(tag) {
                    t.push(tag.name);
                });
            }

            var tags = _.map(t, function(tag){
                var length = _.reject(t, function(el){
                    return (el.indexOf(tag) < 0);
                }).length;
                return {name: tag, count: length};
            });

            tags = _.uniqBy(tags, 'name');

            // tags = _.first(tags);
            console.log(tags);

            return done();
        }

    ], function(err) {
        if (err) return callback(err);

        $tickets = null; //clear it

        return callback(null, tags);
    });
};

module.exports = init;