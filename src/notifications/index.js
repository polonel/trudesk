/*
      .                             .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    05/3/2015
 Author:     Chris Brame

 **/

var _                   = require('underscore'),
    path                = require('path'),
    fs                  = require('fs'),
    nconf               = require('nconf'),
    async               = require('async'),
    winston             = require('winston'),
    request             = require('request'),
    notificationSchema  = require('../models/notification'),
    groupSchema         = require('../models/group'),
    userSchema          = require('../models/user'),
    ticketSchema        = require('../models/ticket');

module.exports.pushNotification = function(notification) {
    var enabled = nconf.get('tps:enable') ? nconf.get('tps:enable') : true;
    if (!enabled) return true;
    var apiKey = nconf.get("tps:apikey");
    var tps_username = nconf.get("tps:username");

    if (_.isUndefined(apiKey) || _.isUndefined(tps_username)) return true;

    async.parallel({
        badgeCount: function(cb) {
            notificationSchema.getUnreadCount(notification.owner, function(err, c) {
                var count = 1;
                if (!err) count = c;

                cb(null, count);
            });
        }
    }, function(err, results) {
        if (err) return winston.warn("[trudesk:TPS:pushNotification] Error - " + err);


        //TODO: Refractor this when Android support is complete
        var body = {
            "username": tps_username,
            "notification": {
                "title": notification.title,
                "deviceType": "ios",
                "deviceIds": notification.owner.iOSDeviceTokens,
                "data": {
                    "unreadCount": results.badgeCount,
                    "ticket": {
                        "_id": notification.data.ticket._id,
                        "uid": notification.data.ticket.uid
                    }
                }
            }
        };

        request({
            url: 'http://push.trudesk.io/api/pushNotification',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accesstoken': apiKey
            },
            body: JSON.stringify(body)
        }, function(err, response, body) {
            if (err)
                winston.debug(err);
            else {
                if (response.statusCode == 401)
                    winston.warn('[trudesk:TPS:pushNotification] Error - Invalid API Key and or Username.');
            }
        });
    });
};

module.exports.init = function(emitter) {
    emitter.on('ticket:created', onTicketCreate);
    emitter.on('notification:count:update', onNotificationCountUpdate);
};

function onTicketCreate(ticketObj) {

}

function onNotificationCountUpdate(user) {

}