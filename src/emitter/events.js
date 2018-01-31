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

var _                   = require('lodash');
var path                = require('path');
var async               = require('async');
var winston             = require('winston');
var emitter             = require('../emitter');
var util                = require('../helpers/utils');
var ticketSchema        = require('../models/ticket');
var userSchema          = require('../models/user');
var notificationSchema  = require('../models/notification');
var Email               = require('email-templates');
var templateDir         = path.resolve(__dirname, '..', 'mailer', 'templates');
var permissions         = require('../permissions');

var notifications       = require('../notifications'); // Load Push Events

(function() {
    notifications.init(emitter);

    emitter.on('ticket:created', function(data) {
         var ticketObj = data.ticket;
         ticketSchema.getTicketById(ticketObj._id, function(err, ticket) {
             if (err) return true;

             async.parallel([
                 function(c) {
                     var mailer = require('../mailer');
                     var emails = [];
                     async.each(ticket.group.sendMailTo, function(member, cb) {
                         if (_.isUndefined(member.email)) return cb();
                         if (member.deleted) return cb();

                         emails.push(member.email);

                         return cb();
                     }, function(err) {
                         if (err) return c(err);

                         emails = _.uniq(emails);

                         var email = new Email({
                             views: {
                                 root: templateDir,
                                 options: {
                                     extension: 'handlebars'
                                 }
                             }
                         });

                         email.render('new-ticket', {ticket: ticket})
                             .then(function(html) {
                                 var mailOptions = {
                                     to: emails.join(),
                                     subject: 'Ticket #' + ticket.uid + '-' + ticket.subject,
                                     html: html,
                                     generateTextFromHTML: true
                                 };

                                 mailer.sendMail(mailOptions, function(err) {
                                     throw new Error(err);
                                 });
                             }).catch(function(err) {
                                winston.warn('[trudesk:events:ticket:created] - ' + err);
                                return c(err);
                             })
                             .finally(function() {
                                 return c();
                             });
                     });
                 },
                 function (c) {
                     if (!ticket.group.public) return c();
                     var rolesWithPublic = permissions.getRoles('ticket:public');
                     rolesWithPublic = _.map(rolesWithPublic, 'id');
                     userSchema.getUsersByRoles(rolesWithPublic, function(err, users) {
                         if (err) return c();
                         async.each(users, function(user, cb) {
                             if (!permissions.canThis(user.role, 'ticket:notifications_create')) return cb();

                             var notification = new notificationSchema({
                                 owner: user,
                                 title: 'Ticket #' + ticket.uid + ' Created',
                                 message: ticket.subject,
                                 type: 0,
                                 data: {ticket: ticket},
                                 unread: true
                             });

                             notification.save(function(err, data) {
                                 if (err) return cb(err);

                                 notifications.pushNotification(data);

                                 return cb(null, data);
                             });

                         }, function(err) {
                             return c(err);
                         });
                     });
                 },
                 function (c) {
                     // Public Ticket Notification is handled above.
                     if (ticket.group.public) return c();
                     async.each(ticket.group.members, function(member, cb) {
                         if (_.isUndefined(member)) return cb();

                         if (!permissions.canThis(member.role, 'ticket:notifications_create')) return cb();

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
                        return winston.warn('[trudesk:events:ticket:created] - Error: ' + err);
                    }

                 //Send Ticket..
                 util.sendToAllConnectedClients(io, 'ticket:created', ticket);
             });
         });
    });

    emitter.on('ticket:updated', function(ticket) {
        io.sockets.emit('updateTicketStatus', {tid: ticket._id, status: ticket.status});
        io.sockets.emit('updateAssignee', ticket);

        io.sockets.emit('ticket:updategrid');
    });

    emitter.on('ticket:deleted', function(oId) {
        io.sockets.emit('ticket:delete', oId);
    });

    emitter.on('ticket:subscriber:update', function(data) {
        io.sockets.emit('ticket:subscriber:update', data);
    });

    emitter.on('ticket:comment:added', function(ticket, comment) {
        //Goes to client
        io.sockets.emit('updateComments', ticket);

        if (ticket.owner._id.toString() === comment.owner.toString()) return;
        if (!_.isUndefined(ticket.assignee) && ticket.assignee._id.toString() === comment.owner.toString()) return;

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
                if (ticket.owner._id.toString() === ticket.assignee._id.toString()) return cb();

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
            },
            //Send email to subscribed users
            function(c) {
                var mailer = require('../mailer');
                var emails = [];
                async.each(ticket.subscribers, function(member, cb) {
                    if (_.isUndefined(member) || _.isUndefined(member.email)) return cb();
                    if (member._id.toString() === comment.owner.toString()) return cb();
                    if (member.deleted) return cb();

                    emails.push(member.email);

                    cb();
                }, function(err) {
                    if (err) return c(err);

                    emails = _.uniq(emails);

                    if (_.size(emails) < 1) {
                        return c();
                    }

                    var email = new Email({
                        views: {
                            root: templateDir,
                            options: {
                                extension: 'handlebars'
                            }
                        }
                    });

                    ticket.populate('comments.owner', function(err, ticket) {
                        if (err) winston.warn(err);
                        if (err) return c();

                        email.render('ticket-comment-added', {ticket: ticket, comment: comment})
                            .then(function(html) {
                                var mailOptions = {
                                    to: emails.join(),
                                    subject: 'Updated: Ticket #' + ticket.uid + '-' + ticket.subject,
                                    html: html,
                                    generateTextFromHTML: true
                                };

                                mailer.sendMail(mailOptions, function(err) {
                                    throw new Error(err);
                                });
                            }).catch(function(err) {
                                winston.warn('[trudesk:events:sendSubscriberEmail] - ' + err);
                                return c(err);
                            })
                            .finally(function() {
                                return c();
                            });
                    });
                });
            }
        ], function() {
            //Blank
        });
    });

    emitter.on('ticket:note:added', function(ticket) {
        //Goes to client
        io.sockets.emit('updateComments', ticket);
    });

    emitter.on('trudesk:profileImageUpdate', function(data) {
        io.sockets.emit('trudesk:profileImageUpdate', data);
    });
})();
