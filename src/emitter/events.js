/*
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

var _                   = require('underscore');
var path                = require('path');
var async               = require('async');
var winston             = require('winston');
var emitter             = require('../emitter');
var util                = require('../helpers/utils');
var ticketSchema        = require('../models/ticket');
var historySchema       = require('../models/history');
var userSchema          = require('../models/user');
var notificationSchema  = require('../models/notification');
var mailqueue           = require('../mailer/mailqueue');
var emailTemplates      = require('email-templates');
var templateDir         = path.resolve(__dirname, '..', 'mailer', 'templates');

var notifications       = require('../notifications'); // Load Push Events

(function() {
    notifications.init(emitter);

    //winston.info('Binding to Events');
    emitter.on('ticket:created', function(data) {
         var socketId = data.socketId;
         var ticketObj = data.ticket;
         ticketSchema.getTicketById(ticketObj._id, function(err, ticket) {
             if (err) return true;

             async.parallel([
                 function(c) {
                     var mailer = require('../mailer');
                     var emails = [];
                     async.each(ticket.group.sendMailTo, function(member, cb) {
                         //winston.debug('Sending Mail To: ' + member.email);
                         if (_.isUndefined(member.email)) return cb();

                         emails.push(member.email);

                         cb();
                     }, function(err) {
                         if (err) return c(err);

                         emails = _.uniq(emails);

                         emailTemplates(templateDir, function(err, template) {
                             if (err) {
                                 winston.error(err);
                                 return c(err);
                             } else {
                                 var locals = {
                                     ticket: ticket
                                 };

                                 template('new-ticket', locals, function(err, html) {
                                     if (err) {
                                         winston.error(err);
                                         return c(err);
                                     } else {
                                         var mailOptions = {
                                             to: emails.join(),
                                             subject: 'Ticket #' + ticket.uid + '-' + ticket.subject,
                                             html: html,
                                             generateTextFromHTML: true
                                         };

                                         mailer.sendMail(mailOptions, function(err, info) {
                                             if (err) {
                                                 return c(err, null);
                                             }

                                             return c(null, info);
                                         });
                                     }
                                 });
                             }
                         });
                     });
                 },
                 function (c) {
                     async.each(ticket.group.members, function(member, cb) {
                         if (_.isUndefined(member)) return cb();

                         if (member.role != 'mod' && member.role != 'admin') return cb(null);

                         var notification = new notificationSchema({
                             owner: member,
                             title: 'Ticket #' + ticket.uid + ' Created',
                             message: ticket.subject,
                             type: 0,
                             data: {ticket: ticket},
                             unread: true
                         });

                         notification.save(function(err, data) {
                             if (err) return cb(err);

                             notifications.pushNotification(data);

                             cb(null, data);
                         });

                     }, function(err) {
                         c(err);
                     });
                 }
             ], function(err) {
                    if (err) {
                        return winston.warn('Error: [ticket:created]: ' + err);
                    }

                 //Send Ticket..
                 //io.sockets.emit('ticket:created', ticket);

                 util.sendToAllExcept(io, socketId, 'ticket:created', ticket);
             });
         });
    });

    emitter.on('ticket:updated', function(ticket) {
        io.sockets.emit('updateTicketStatus', {tid: ticket._id, status: ticket.status});

        io.sockets.emit('ticket:updategrid');
    });

    emitter.on('ticket:deleted', function(oId) {
        io.sockets.emit('ticket:delete', oId);
        //winston.warn('ticket deleted: ' + oId);
    });

    emitter.on('ticket:comment:added', function(ticket, comment) {
        //Goes to client
        io.sockets.emit('updateComments', ticket);

        if (ticket.owner._id.toString() == comment.owner.toString()) return;
        if (!_.isUndefined(ticket.assignee) && ticket.assignee._id.toString() == comment.owner.toString()) return;
        async.parallel([
            function(cb) {
                var notification = new notificationSchema({
                    owner: ticket.owner,
                    title: 'Comment Added to Ticket#' + ticket.uid,
                    message: ticket.subject,
                    type: 0,
                    data: {ticket: ticket},
                    unread: true
                });

                notification.save(function(err) {
                    if (err) return cb(err);

                    notifications.pushNotification(notification);

                    cb(null);
                });
            },
            function(cb) {
                if (_.isUndefined(ticket.assignee)) return cb();
                if (ticket.owner._id.toString() == ticket.assignee._id.toString()) return cb();

                var notification = new notificationSchema({
                    owner: ticket.assignee,
                    title: 'Comment Added to Ticket#' + ticket.uid,
                    message: ticket.subject,
                    type: 0,
                    data: {ticket: ticket},
                    unread: true
                });

                notification.save(function(err) {
                    if (err) return cb(err);

                    notifications.pushNotification(notification);

                    cb(null);
                });
            }

        ], function(err, result) {

        });
    });
})();
