/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

var DISABLE_MAIL = true;

var _           = require('underscore');
var async       = require('async');
var nodeMailer  = require('nodemailer');
var winston     = require('winston');

var transporter = nodeMailer.createTransport({
    host:   'smtp.zoho.com',
    port:   465,
    secure: true,
    auth: {
        user: 'no-reply@trudesk.io',
        pass: '#TruDesk$'
    }
});

var mailer = {};

mailer.queue = function() {
    checkQueue(handleQueue);

    setInterval(function() {
        checkQueue(handleQueue);
    }, 3600000); //1hour
};

mailer.sendMail = function(data, callback) {
    if (DISABLE_MAIL) {
        return callback(null, 'Mail Disabled');
    }

    transporter.sendMail(data, callback);
};

function handleQueue(err, size) {
    if (err) {
        return winston.warn(err.message);
    }

    //Todo: Handle processing of mailqueue here


    winston.log('debug', 'polling mailqueue: ' + size);
}

function checkQueue(callback) {
    var mailqueue = require('./mailqueue');
    mailqueue.getQueue(function(err, items) {
        if (err) return callback(err, null);

        var size = _.size(items);

        callback(null, size);
    });
}

module.exports = mailer;

