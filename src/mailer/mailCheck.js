/*
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
var winston     = require('winston');
var marked      = require('marked');
var simpleParser = require('mailparser').simpleParser;

var emitter     = require('../emitter');
var userSchema  = require('../models/user');
var groupSchema = require('../models/group');
var ticketTypeSchema = require('../models/tickettype');
var Ticket      = require('../models/ticket');

var mailCheck = {};
mailCheck.inbox = [];

mailCheck.init = function(settings) {
    var s = {};
    s.mailerCheckEnabled = _.find(settings, function(x) { return x.name === 'mailer:check:enable' });
    s.mailerCheckHost = _.find(settings, function(x) { return x.name === 'mailer:check:host' });
    s.mailerCheckPort = _.find(settings, function(x) { return x.name === 'mailer:check:port' });
    s.mailerCheckUsername = _.find(settings, function(x) { return x.name === 'mailer:check:username' });
    s.mailerCheckPassword = _.find(settings, function(x) { return x.name === 'mailer:check:password' });
    s.mailerCheckTicketType = _.find(settings, function(x) { return x.name === 'mailer:check:ticketype' });

    s.mailerCheckEnabled = (s.mailerCheckEnabled === undefined) ? {value: false} : s.mailerCheckEnabled;
    s.mailerCheckHost = (s.mailerCheckHost === undefined) ? {value: ''} : s.mailerCheckHost;
    s.mailerCheckPort = (s.mailerCheckPort === undefined) ? {value: 143} : s.mailerCheckPort;
    s.mailerCheckUsername = (s.mailerCheckUsername === undefined) ? {value: ''} : s.mailerCheckUsername;
    s.mailerCheckPassword = (s.mailerCheckPassword === undefined) ? {value: ''} : s.mailerCheckPassword;
    s.mailerCheckTicketType = (s.mailerCheckTicketType === undefined) ? {value: 'Issue'} : s.mailerCheckTicketType;

    var MAILERCHECK_ENABLED = s.mailerCheckEnabled.value;
    var MAILERCHECK_HOST = s.mailerCheckHost.value;
    var MAILERCHECK_USER = s.mailerCheckUsername.value;
    var MAILERCHECK_PASS = s.mailerCheckPassword.value;
    var POLLING_INTERVAL = 600000; //10 min
    var DEFAULT_TICKET_TYPE = s.mailerCheckTicketType.value;

    if (!MAILERCHECK_ENABLED) return true;

    mailCheck.Imap = new Imap({
        user: MAILERCHECK_USER,
        password: MAILERCHECK_PASS,
        host: MAILERCHECK_HOST,
        port: 143
    });

    mailCheck.fetchMail(DEFAULT_TICKET_TYPE);
    setInterval(function() {
        mailCheck.fetchMail(DEFAULT_TICKET_TYPE);
    }, POLLING_INTERVAL);
};

mailCheck.fetchMail = function(DEFAULT_TICKET_TYPE) {
    mailCheck.Imap.connect();
    mailCheck.Imap.once('error', function(err) {
        winston.warn(err);
    });

    mailCheck.Imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) {
                mailCheck.Imap.end();
                winston.debug(err);
                //throw err;
            }

            async.waterfall([
                function(next) {
                    mailCheck.Imap.search(['UNSEEN'], next);
                },
                function(results, next) {
                    if (_.size(results) < 1) {
                        winston.debug('MailCheck: Nothing to Fetch.');
                        return next();
                    }

                    winston.debug('Processed %s Mail > Ticket', _.size(results));

                    var message = {};

                    var f = mailCheck.Imap.fetch(results, {
                        //markSeen: true,
                       // bodies: ['HEADER.FIELDS (FROM SUBJECT CONTENT-TYPE)','TEXT']
                        bodies: ''
                    });

                    f.on('message', function(msg, seqno) {
                        msg.on('body', function(stream, info) {
                            var buffer = '', count = 0;
                            stream.on('data', function(chunk) {
                                count += chunk.length;
                                buffer += chunk.toString('utf8');
                            });

                            stream.once('end', function() {
                                simpleParser(buffer, function(err, mail) {
                                    if (err) winston.warn(err);

                                    if (mail.headers.has('from')) {
                                        message.from = mail.headers.get('from').value[0].address;
                                    }
                                    if (mail.subject) {
                                        message.subject = mail.subject;
                                    } else {
                                        message.subject = message.from;
                                    }

                                    message.body = mail.textAsHtml;
                                });

                                // if (info.which !== 'TEXT') {
                                //     var header = Imap.parseHeader(buffer);
                                //     if (_.isArray(header.subject) && _.size(header.subject) > 0)
                                //         message.subject = header.subject[0];
                                //     if (_.isArray(header.from) && _.size(header.from) > 0)
                                //         message.from = parseEmail(header.from[0]);
                                //     if (_.isArray(header['content-type']) && _.size(header['content-type']) > 0)
                                //         message.contentType = header['content-type'][0];
                                // } else
                                //     message.body = buffer;
                            });
                        });

                        async.series([
                            function(cb) {
                                msg.once('end', function() {
                                    mailCheck.Imap.seq.addFlags(seqno, '\\Seen', function(err){
                                        if (err) winston.warn(err);
                                        userSchema.getUserByEmail(message.from, function(err, user) {
                                            if (err) winston.warn(err);
                                            if (!err && user) {
                                                message.owner = user;
                                                if (!_.isUndefined(message.from) && !_.isEmpty(message.from) &&
                                                    !_.isUndefined(message.subject) && !_.isEmpty(message.subject)) {

                                                    groupSchema.getAllGroupsOfUser(message.owner._id, function(err, group) {
                                                        if (err) return cb(err);
                                                        if (!group) return cb("Unknown Group for user.");

                                                        if (_.size(group) < 1) return cb();

                                                        async.waterfall([
                                                            function(d) {
                                                                if (DEFAULT_TICKET_TYPE !== 'Issue') return d(null, null);
                                                                ticketTypeSchema.getTypeByName(DEFAULT_TICKET_TYPE, function(err, t) {
                                                                    if (err) return d(err);

                                                                    return d(null, t);
                                                                });
                                                            },
                                                            function(type, d) {
                                                                if (type !== null) return d(null, type);
                                                                ticketTypeSchema.getType(DEFAULT_TICKET_TYPE, function(err, t) {
                                                                    if (err) return d(err);

                                                                    return d(null, t);
                                                                });
                                                            }
                                                        ], function(err, type) {
                                                            if (err || type === null) return cb(err);

                                                            var HistoryItem = {
                                                                action: 'ticket:created',
                                                                description: 'Ticket was created.',
                                                                owner: message.owner._id
                                                            };

                                                            //Create the Ticket Here
                                                            Ticket.create({
                                                                owner: message.owner._id,
                                                                "group": group[0]._id,
                                                                "type": type._id,
                                                                status: 0,
                                                                priority: 1,
                                                                subject: message.subject,
                                                                issue: message.body,
                                                                history: [HistoryItem]
                                                            }, function(err, t) {
                                                                if (err) {
                                                                    winston.warn('Failed to Create ticket from Email: ' + err);
                                                                    return cb(err);
                                                                }

                                                                emitter.emit('ticket:created', {socketId: '', ticket: t});

                                                                return cb();
                                                            });
                                                        });
                                                    });

                                                } else
                                                    return cb();

                                            } else {
                                                mailCheck.Imap.seq.addFlags(seqno, '\\Deleted', function(err) {
                                                    if (err) winston.warn(err);

                                                    return cb();
                                                });
                                            }
                                        });
                                    });
                                });
                            }
                        ], function(err) {
                            if (err) winston.warn(err);

                            f.once('error', function(err) {
                                winston.error('Fetch error: ' + err);
                                return next(err);
                            });

                            f.once('end', function() {
                                return next();
                            });
                        });
                    });
                }
            ], function(err) {
                if (err) winston.warn(err);
                mailCheck.Imap.closeBox(true, function(err) {
                    if (err) winston.debug(err);
                    mailCheck.Imap.end();
                });
            });
        });
    });
};

// function parseEmail(email) {
//     var strArray1 = email.split('<');
//     var strArray2 = strArray1[1].split('>');
//     var actualEmail = strArray2[0];
//
//     if (validateEmail(actualEmail))
//         return actualEmail;
//     else
//         return '';
// }
//
// function parseBody(body) {
//     body = body.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
//     return marked(body);
// }

// function validateEmail(email) {
//     var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
//     return re.test(email);
// }

function openInbox(cb) {
    mailCheck.Imap.openBox('INBOX', false, cb);
}

module.exports = mailCheck;

