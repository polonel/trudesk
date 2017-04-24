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

var ticketSchema    = require('../models/ticket');

var init = function(tickets, timespan, callback) {
    var tags = [];
    var $tickets = [];
    if (_.isUndefined(timespan) || _.isNaN(timespan) || timespan == 0) timespan = 9999;

    var today = moment().hour(23).minute(59).second(59);
    var tsDate = today.clone().subtract(timespan, 'd');

    async.series([
        function(done) {
            if (tickets) {
                ticketSchema.populate(tickets, {path: 'tags'}, function(err, _tickets) {
                    if (err) return done(err);

                    $tickets = _tickets;
                    return done();
                });
            } else {
                ticketSchema.getAllNoPopulate(function(err, tickets) {
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
                return (v.date < today.toDate() && v.date > tsDate.toDate());
            });

            async.each($tickets, function(ticket, cb) {
                _.each(ticket.tags, function(tag) {
                    t.push(tag.name);
                });

                async.setImmediate(function() {
                    return cb();
                });
            }, function() {
                _.mixin({
                    'sortKeysBy': function (obj, comparator) {
                        var keys = _.sortBy(_.keys(obj), function (key) {
                            return comparator ? comparator(obj[key], key) : key;
                        });

                        return _.object(keys, _.map(keys, function (key) {
                            return obj[key];
                        }));
                    }
                });

                tags = _.reduce(t, function(counts, key) {
                    counts[key]++;
                    return counts;
                }, _.object(_.map(_.uniq(t), function(key) {
                    return [key, 0];
                })));

                tags = _.sortKeysBy(tags, function(value) {
                    return -value;
                });

                async.setImmediate(function() {
                    return done();
                });
            });
        }

    ], function(err) {
        if (err) return callback(err);

        $tickets = null; //clear it

        return callback(null, tags);
    });
};

module.exports = init;