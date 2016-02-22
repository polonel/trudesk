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
var winston         = require('winston');
var moment          = require('moment');

var userSchema      = require('../models/user');
var ticketSchema    = require('../models/ticket');
var tagSchema       = require('../models/tag');


var init = function(callback) {
    var tags = [];
    ticketSchema.getAll(function(err, tickets) {
        if (err) return callback(err);

        var t = [];

        async.each(tickets, function(ticket, done) {
            _.each(ticket.tags, function(tag) {
                t.push(tag.name);
            });

            done();

        }, function(err, results) {
            if (err) return callback(err);

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

            tags = _.sortKeysBy(tags, function(value, key) {
                return -value;
            });

            callback(null, tags);
        });
    })

};

module.exports = init;