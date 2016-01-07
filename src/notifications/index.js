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
    apn                 = require('apn'),
    winston             = require('winston'),
    notificationSchema  = require('../models/notification'),
    groupSchema         = require('../models/group'),
    userSchema          = require('../models/user'),
    ticketSchema        = require('../models/ticket');

var apnOptions = {
    production: nconf.get('apn:production'),
    pfx: nconf.get('apn:pfx'),
    passphrase: nconf.get('apn:passphrase')
};

module.exports.pushNotification = function(notification) {
    if (_.isUndefined(apnOptions.production) || _.isUndefined(apnOptions.pfx) || _.isUndefined(apnOptions.passphrase)) {
        winston.warn('[trudesk:ApplePushNotification] - Error: Invalid APN Options!');
        return true;
    }

    //Check Cert Exists
    try {
        if (fs.statSync(path.join(__dirname, '../../', apnOptions.pfx)).length < 1)
            return true;
    }
    catch (e) {
        winston.debug(e);
        //Exit out if the File Doesn't Exist
        return true;
    }

    var apnConnection = new apn.Connection(apnOptions);
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = 1;
    note.sound = 'chime';
    note.alert = notification.title;
    note.payload = {
        'ticketUID' : notification.data.ticket.uid,
        'ticketOID' : notification.data.ticket._id
    };

    notificationSchema.getUnreadCount(notification.owner, function(err, c) {
        var count = 1;
        if (!err) {
            count = c;
        }

        note.badge = count;

        if (!_.isUndefined(notification.owner.iOSDeviceTokens)) {
            async.each(notification.owner.iOSDeviceTokens, function(token, cb) {
                var device = new apn.Device(token);
                try {
                    apnConnection.pushNotification(note, device);
                } catch (e) {
                    winston.warn('[trudesk:iOSPush] - ' + e);
                }


                winston.debug('Sent push notification to iOS Device: ' + token);

                cb();
            });
        } else {
            cb();
        }
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