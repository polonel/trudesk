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

var MAILER_ENABLED = nconf.get('mailer:enable');
var POOL_INTERVAL = nconf.get('mailer:polling') ? nconf.get('mailer:polling') : 3600000; //1hour

var mailCheck = {};
mailCheck.Imap = new Imap({
    user: 'trudesk',
    password: 'Granville789',
    host: 'mail.granvillecounty.org',
    port: 143
});

mailCheck.inbox = [];

mailCheck.init = function() {
    setInterval(function() {
        mailCheck.fetchMail();
    }, 10000);
};

mailCheck.fetchMail = function() {
    mailCheck.Imap.connect();
    mailCheck.Imap.once('ready', function() {
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
                                    console.log(header.subject);
                                } else
                                    console.log('Message Buffer: ' + buffer);
                            });
                        });
                        msg.once('attributes', function(attrs) {
                            //console.log('Attributes: %s', inspect(attrs, false, 8));
                        });
                        msg.once('end', function() {

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
                mailCheck.Imap.end();
            });
        });
    });
};

function openInbox(cb) {
    mailCheck.Imap.openBox('INBOX', false, cb);
}

module.exports = mailCheck;

