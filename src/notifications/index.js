/**
      .                              .o8                     oooo
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
    async               = require('async'),
    apn                 = require('apn'),
    winston             = require('winston'),
    notificationSchema  = require('../models/notification'),
    groupSchema         = require('../models/group'),
    userSchema          = require('../models/user'),
    ticketSchema        = require('../models/ticket');

var apnOptions = {
    production: false,
    cert: 'private/cert.pem',
    key: 'private/key.pem',
    passphrase: 'C04251986c'
};

module.exports.pushNotification = function(notification) {
    //Check Cert Exists
    fs.readFile(path.join(__dirname, '../../', apnOptions.cert), function(err) {
        if (err) {
            winston.warn(err);
        } else {
            //Check Key Exists
            fs.readFile(path.join(__dirname, '../../', apnOptions.key), function(err) {
               if (err) {
                   winston.warn(err);
               } else {
                   //Both exists. Fire Push notifications.
                   var apnConnection = new apn.Connection(apnOptions);
                   var note = new apn.Notification();
                   note.expiry = Math.floor(Date.now() / 1000) + 3600;
                   note.badge = 1;
                   note.sound = 'alert';
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
                               winston.debug('here');
                               try {
                                   apnConnection.pushNotification(note, device);
                               } catch (e) {
                                   winston.error(e);
                               }


                               winston.debug('Sending push notification to iOS Device: ' + token);

                               cb();
                           });
                       }
                   });
               }
            });
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