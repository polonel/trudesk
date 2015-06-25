/**
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    06/19/2015
 Author:     Chris Brame

 **/

var _           = require('underscore');
var async       = require('async');
var Imap        = require('imap');
var inspect     = require('util').inspect;
var MailParser  = require('mailparser').MailParser;
var winston     = require('winston');
var nconf       = require('nconf');

var userSchema  = require('../models/user');
var Ticket      = require('../models/ticket');

var MAILER_ENABLED = nconf.get('mailer:check:enable');
var MAILERCHECK_USER = nconf.get('mailer:check:user') ? nconf.get('mailer:check:user') : MAILER_ENABLED = false;
var MAILERCHECK_PASS = nconf.get('mailer:check:pass') ? nconf.get('mailer:check:pass') : MAILER_ENABLED = false;
var MAILERCHECK_HOST = nconf.get('mailer:check:host') ? nconf.get('mailer:check:host') : MAILER_ENABLED = false;
var POOL_INTERVAL = nconf.get('mailer:check:polling') ? nconf.get('mailer:check:polling') : 3600000; //1hour

var mailCheck = {};
mailCheck.Imap = new Imap({
    user: MAILERCHECK_USER,
    password: MAILERCHECK_PASS,
    host: MAILERCHECK_HOST,
    port: 143
});

mailCheck.inbox = [];

mailCheck.init = function() {
    if (!MAILER_ENABLED) return true;

    setInterval(function() {
        mailCheck.fetchMail();
    }, 10000);
};

mailCheck.fetchMail = function() {
    mailCheck.Imap.connect();
    mailCheck.Imap.once('ready', function() {
        var messages = [];
        openInbox(function(err, box) {
            if (err) throw err;
            async.waterfall([
                function(next) {
                    mailCheck.Imap.search(['UNSEEN'], next);
                },
                function(results, next) {
                    if (_.size(results) < 1) {
                        winston.debug('MailCheck: Nothing to Fetch.');
                        mailCheck.Imap.end();
                        return next();
                    }

                    var message = {};

                    var f = mailCheck.Imap.fetch(results, {
                        markSeen: true,
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT)','TEXT']
                    });

                    f.on('message', function(msg, seqno) {
                        msg.on('body', function(stream, info) {
                            var buffer = '', count = 0;
                            stream.on('data', function(chunk) {
                                count += chunk.length;
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', function() {
                                if (info.which !== 'TEXT') {
                                    var header = Imap.parseHeader(buffer);
                                    if (_.isArray(header.subject) && _.size(header.subject) > 0)
                                        message.subject = header.subject[0];
                                    if (_.isArray(header.from) && _.size(header.from) > 0)
                                        message.from = parseEmail(header.from[0]);
                                } else
                                    message.body = buffer;
                            });
                        });
                        msg.once('attributes', function(attrs) {
                            //console.log('Attributes: %s', inspect(attrs, false, 8));
                        });
                        msg.once('end', function() {
                            userSchema.getUserByEmail(message.from, function(err, user) {
                                if (!err && user) {
                                    message.owner = user;

                                    messages.push(message);

                                    console.log(messages);
                                }
                            });
                        });
                    });
                    f.once('error', function(err) {
                        mailCheck.Imap.end();
                        winston.error('Fetch error: ' + err);
                    });
                    f.once('end', function() {
                        mailCheck.Imap.end();
                        next();
                    });
                }
            ], function(err) {
                if (err) winston.warn(err);
                mailCheck.Imap.end();
            });
        });
    });
};

function parseEmail(email) {
    var strArray1 = email.split('<');
    var strArray2 = strArray1[1].split('>');
    var actualEmail = strArray2[0];

    if (validateEmail(actualEmail))
        return actualEmail;
    else
        return '';
}

function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

function openInbox(cb) {
    mailCheck.Imap.openBox('INBOX', false, cb);
}

module.exports = mailCheck;

