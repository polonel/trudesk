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

var winston             = require('winston'),
    utils               = require('./helpers/utils'),
    passportSocketIo    = require('passport.socketio'),
    cookieparser        = require('cookie-parser'),
    emitter             = require('./emitter'),
    async               = require('async'),
    marked              = require('marked');

module.exports = function(ws) {
    var _ = require('lodash'),
        __ = require('underscore'),
        usersOnline = {},
        sockets = [],
        io = require('socket.io')(ws.server);

    io.use(passportSocketIo.authorize({
        cookieParser: cookieparser,
        key: 'connect.sid',
        store: ws.sessionStore,
        secret: 'trudesk$123#SessionKeY!2387',
        success: onAuthorizeSuccess
    }));

    io.set('transports', [
        'websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling',
        'polling'
    ]);

    io.sockets.on('connection', function(socket) {
        var totalOnline = _.size(usersOnline);

        setInterval(function() {
            updateMailNotifications();
            updateNotifications();

        }, 5000);

        //Update Ticket Grid Every Min
//        setInterval(function() {
//            var userId = socket.request.user._id;
//            var ticketSchema = require('./models/ticket');
//            var groupSchema = require('./models/group');
//
//            async.waterfall([
//                function(callback) {
//                    groupSchema.getAllGroupsOfUser(socket.request.user._id, function(err, grps) {
//                        callback(err, grps);
//                    })
//                },
//                function(grps, callback) {
//                    ticketSchema.getTickets(grps, function(err, results) {
//
//                        callback(err, results);
//                    });
//                }
//            ], function(err, results) {
//                if (err) return handleError(res, err);
//
//                //winston.verbose('Updating Ticket Grid For: ' + socket.request.user.fullname);
//                //utils.sendToSelf(socket, 'updateTicketGrid', results);
//            });
//
//        }, 60000);

        function updateMailNotifications() {
            var userId = socket.request.user._id;
            var messageSchema = require('./models/message');
            var payload = {};
            async.parallel([
                function(callback) {
                    messageSchema.getUnreadInboxCount(userId, function(err, objs) {
                        if (err) return callback();
                        payload.unreadCount = objs;

                       callback();
                    });
                },

                function(callback){
                    messageSchema.getUserUnreadMessages(userId, function(err, objs) {
                        if (err) return callback();
                        payload.unreadItems = objs;

                        callback();
                    });
                }
            ], function(err) {
                if (err) return true;

                utils.sendToSelf(socket, 'updateMailNotifications', payload);
            });

        }

        socket.on('updateMailNotifications', function() {
            updateMailNotifications();
        });

        function updateNotifications() {
            var notifications = {};
            var notificationSchema = require('./models/notification');
            notificationSchema.findAllForUser(socket.request.user._id, function(err, items) {
                if (err) {
                    winston.warn(err);
                    return true;
                }

                notifications.items = items;
                var p = __.where(items, {unread: true});
                notifications.count = _.size(p);

                utils.sendToSelf(socket, 'updateNotifications', notifications);
            });
        }

        socket.on('updateNotifications', function() {
            updateNotifications();
        });

        socket.on('markNotificationRead', function(_id) {
            if (_.isUndefined(_id)) return true;
            var notificationSchema = require('./models/notification');
            notificationSchema.getNotification(_id, function(err, notification) {
                if (err) return true;

                notification.markRead(function() {
                    notification.save(function(err, final) {
                        if (err) return true;

                        updateNotifications();
                    });
                })
            });
        });

        socket.on('clearNotifications', function(data) {
            var userId = socket.request.user._id;
            if (_.isUndefined(userId)) return true;
            var notifications = {};
            notifications.items = [];
            notifications.count = 0;

            var notificationSchema = require('./models/notification');
            notificationSchema.clearNotifications(userId, function(err) {
                if (err) return true;

                utils.sendToSelf(socket, 'updateNotifications', notifications);
            });

        });

        socket.on('updateTicketStatus', function(data) {
            var ticketId = data.ticketId;
            var ownerId = socket.request.user._id;
            var status = data.status;
            var ticketSchema = require('./models/ticket');

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                ticket.setStatus(ownerId, status, function(err, t) {
                    if (err) return true;

                    t.save(function(err) {
                        if (err) return true;

                        emitter.emit('ticket:updated', ticketId);
                        utils.sendToAllConnectedClients(io, 'updateTicketStatus', {tid: t._id, status: status});
                    });
                });
            });
        });

        socket.on('updateComments', function(data) {
            var ticketId = data.ticketId;
            var ticketSchema = require('./models/ticket');

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                utils.sendToAllConnectedClients(io, 'updateComments', ticket);
            });
        });

        socket.on('updateMessageFolder', function(data) {
            var messageSchema = require('./models/message');
            var user = socket.request.user;
            var folder = data.folder;
            messageSchema.getUserFolder(user._id, folder, function(err, items) {
                if (err) return true;

                var payload = {
                    folder: folder,
                    items: items
                };

                utils.sendToSelf(socket, 'updateMessagesFolder', payload);
            });
        });

        socket.on('updateUsers', function(data) {
            utils.sendToSelf(socket, 'updateUsers', usersOnline);
        });

        socket.on('updateAssigneeList', function() {
            var userSchema = require('./models/user');
            userSchema.getAssigneeUsers(function(err, users) {
                if (err) return true;

                utils.sendToSelf(socket, 'updateAssigneeList', users);
            })
        });

        socket.on('setAssignee', function(data) {
            var userId = data._id;
            var ownerId = socket.request.user._id;
            var ticketId = data.ticketId;
            var ticketSchema = require('./models/ticket');
            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true

                ticket.setAssignee(ownerId, userId, function(err, t) {
                    if (err) {
                        winston.warn(err);
                        return true;
                    }

                    t.save(function(err, tt) {
                        if (err) return true;
                        ticketSchema.populate(tt, 'assignee', function(err){
                            if (err) return true;

                            emitter.emit('ticket:updated', ticketId);
                            utils.sendToAllConnectedClients(io, 'updateAssignee', tt);
                        });
                    });
                })
            });
        });

        socket.on('setTicketType', function(data) {
            var ticketId = data.ticketId;
            var typeId = data.typeId;
            var ownerId = socket.request.user._id;
            var ticketSchema = require('./models/ticket');

            if (_.isUndefined(ticketId) || _.isUndefined(typeId)) return true;
            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;
                ticket.setTicketType(ownerId, typeId, function(err, t) {
                    if (err) return true;

                    t.save(function(err, tt) {
                        if (err) return true;

                        ticketSchema.populate(tt, 'type', function(err) {
                            if (err) return true;

                            emitter.emit('ticket:updated', ticketId);
                            utils.sendToAllConnectedClients(io, 'updateTicketType', tt);
                        });
                    });
                });
            });
        });

        socket.on('setTicketPriority', function(data) {
            var ticketId = data.ticketId;
            var priority = data.priority.value;
            var ownerId = socket.request.user._id;
            var ticketSchema = require('./models/ticket');

            if (_.isUndefined(ticketId) || _.isUndefined(priority)) return true;
            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;
                ticket.setTicketPriority(ownerId, priority, function(err, t) {
                    if (err) return true;
                    t.save(function(err, tt) {
                        if (err) return true;

                        emitter.emit('ticket:updated', ticketId);
                        utils.sendToAllConnectedClients(io, 'updateTicketPriority', tt);
                    });
                });
            });
        });

        socket.on('clearAssignee', function(id) {
            var ticketId = id;
            var ownerId = socket.request.user._id;
            var ticketSchema = require('./models/ticket');
            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                ticket.clearAssignee(ownerId, function(err, t) {
                    if (err) return true;

                    t.save(function(err, tt) {
                        if (err) return true;

                        emitter.emit('ticket:updated', ticketId);
                        utils.sendToAllConnectedClients(io, 'updateAssignee', tt);
                    });
                });
            });
        });

        socket.on('setTicketGroup', function(data) {
            var ticketId = data.ticketId;
            var groupId = data.groupId;
            var ownerId = socket.request.user._id;
            var ticketSchema = require('./models/ticket');

            if (_.isUndefined(ticketId) || _.isUndefined(groupId)) return true;

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                ticket.setTicketGroup(ownerId, groupId, function(err, t) {
                    if (err) return true;

                    t.save(function(err, tt) {
                        if (err) return true;

                        ticketSchema.populate(tt, 'group', function(err) {
                            if (err) return true;

                            emitter.emit('ticket:updated', ticketId);
                            utils.sendToAllConnectedClients(io, 'updateTicketGroup', tt);
                        });
                    });
                });
            });
        });

        socket.on('setTicketIssue', function(data) {
            var ticketId = data.ticketId;
            var issue = data.issue;
            var ownerId = socket.request.user._id;
            var ticketSchema = require('./models/ticket');
            if (_.isUndefined(ticketId) || _.isUndefined(issue)) return true;
            issue = issue.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
            var markedIssue = marked(issue);

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                ticket.setIssue(ownerId, markedIssue, function(err, t) {
                    if (err) return true;

                    t.save(function(err, tt) {
                        if (err) return true;

                        //emitter.emit('ticket:updated', ticketId);
                        utils.sendToAllConnectedClients(io, 'updateTicketIssue', tt);
                    });
                });
            });
        });

        socket.on('setCommentText', function(data) {
            var ownerId = socket.request.user._id;
            var ticketId = data.ticketId;
            var commentId = data.commentId;
            var comment = data.commentText;
            var ticketSchema = require('./models/ticket');
            if (_.isUndefined(ticketId) || _.isUndefined(commentId) || _.isUndefined(comment)) return true;
            comment = comment.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
            var markedComment = marked(comment);

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return winston.error(err);

                ticket.updateComment(ownerId, commentId, markedComment, function(err, t) {
                    if (err) return winston.error(err);
                    ticket.save(function(err, tt) {
                        if (err) return winston.error(err);

                        ticketSchema.populate(tt, 'comments.owner', function(err) {
                            if (err) return winston.error(err);
                            utils.sendToAllConnectedClients(io, 'updateComments', tt);
                        });
                     });
                });
            });

        });

        socket.on('removeComment', function(data) {
            var ownerId = socket.request.user._id;
            var ticketId = data.ticketId;
            var commentId = data.commentId;
            var ticketSchema = require('./models/ticket');

            if (_.isUndefined(ticketId) || _.isUndefined(commentId)) return true;

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                ticket.removeComment(ownerId, commentId, function(err, t) {
                    if (err) return true;

                    t.save(function(err, tt) {
                        if (err) return true;

                        ticketSchema.populate(tt, 'comments.owner', function(err) {
                            if (err) return true;
                            utils.sendToAllConnectedClients(io, 'updateComments', tt);
                        });
                    });
                });
            });

        });

        socket.on('refreshTicketAttachments', function(data) {
            var ticketId = data.ticketId;
            var ticketSchema = require('./models/ticket');
            if (_.isUndefined(ticketId)) return true;

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                utils.sendToAllConnectedClients(io, 'updateTicketAttachments', ticket);
            });
        });

        socket.on('setMessageRead', function(messageId) {
            var messageSchema = require('./models/message');
            messageSchema.getMessageById(messageId, function(err, message) {
                if (err) {
                    winston.warn(err.message);
                    return true;
                }

                if (!message.unread) return true;

                message.updateUnread(false, function(err, m) {
                    if (err) {
                        winston.warn(err.message);
                        return true;
                    }

                    utils.sendToSelf(socket, 'updateSingleMessageItem', m);
                });
            });
        });

        socket.on('moveMessageToFolder', function(messageIds, toFolder, folderToRefresh) {
            var messageSchema = require('./models/message');
            var infoMessage = undefined;
            switch(toFolder) {
                case 2:
                    infoMessage = 'Message Successfully Move to Trash.';
                    break;
            }

            async.each(messageIds, function(mId, callback) {
                messageSchema.getMessageById(mId, function(err, message) {
                    message.moveToFolder(toFolder, function(err, m) {
                       callback(err);
                    });
                });
            }, function(err) {
                if (err) {
                    return true;
                }

                var user = socket.request.user;
                messageSchema.getUserFolder(user._id, folderToRefresh, function(err, items) {
                    if (err) return true;

                    var payload = {
                        folder: folderToRefresh,
                        items: items,
                        infoMessage: infoMessage
                    };

                    utils.sendToSelf(socket, 'updateMessagesFolder', payload);
                });
            });
        });

        socket.on('deleteMessages', function(messageIds) {
            var messageSchema = require('./models/message');
            async.each(messageIds, function(mId, callback) {
                messageSchema.deleteMessage(mId, function(err, message) {
                    callback(err);
                });
            }, function(err) {
                if (err) {
                    return true;
                }

                var user = socket.request.user;
                messageSchema.getUserFolder(user._id, 2, function(err, items) {
                    if (err) return true;

                    var payload = {
                        folder: 2,
                        items: items,
                        infoMessage: 'Message Successfully Deleted.'
                    };

                    utils.sendToSelf(socket, 'updateMessagesFolder', payload);
                });
            });
        });

        socket.on('setShowNotice', function(noticeId) {
            var noticeSchema = require('./models/notice');
            noticeSchema.getNotice(noticeId, function(err, notice) {
                if (err) return true;

                utils.sendToAllConnectedClients(io, 'updateShowNotice', notice);
            });
        });

        socket.on('setClearNotice', function() {
            utils.sendToAllConnectedClients(io, 'updateClearNotice');
        });

        socket.on('joinChatServer', function(data) {
            var user = socket.request.user;
            var exists = false;
            _.find(usersOnline, function(v,k) {
                if (k.toLowerCase() === user.username.toLowerCase())
                    return exists = true;
            });

            if (!exists) {
                if (user.username.length !== 0) {
                    usersOnline[user.username] = {sockets: [socket.id], user: user};

                    totalOnline = _.size(usersOnline);
                    utils.sendToSelf(socket, 'joinSuccessfully');
                    utils.sendToAllConnectedClients(io, 'updateUsers', usersOnline);
                    sockets.push(socket);
                }
            } else {
                usersOnline[user.username].sockets.push(socket.id);

                utils.sendToSelf(socket, 'joinSuccessfully');
                utils.sendToAllConnectedClients(io, 'updateUsers', usersOnline);
                sockets.push(socket);
            }
        });

        socket.on('spawnChatWindow', function(data) {
            var user = null;
            if (_.isUndefined(user)) return true;
            _.find(usersOnline, function(v,k) {
                if (String(v.user._id) === String(data))
                    return user = v.user;
            });

            if (_.isNull(user)) return true;

            utils.sendToSelf(socket,'spawnChatWindow', user);
        });

        socket.on('chatMessage', function(data) {
            var to = data.to;
            var from = data.from;
            var od = data.type;
            if (data.type === 's') {
                data.type = 'r'
            } else {
                data.type = 's';
            }

            var user = null;
            var fromUser = null;

            _.find(usersOnline, function(v,k) {
                 if (String(v.user._id) === String(to)) {
                     user = v.user;
                 }
                 if (String(v.user._id) === String(from)) {
                     fromUser = v.user;
                 }
            });

            if (_.isNull(user) || _.isNull(fromUser)) {
                socket.emit('chatMessage', {message: 'ERROR - Sending Message!'});
                return true;
            }

            data.toUser = user;
            data.fromUser = fromUser;

            utils.sendToUser(sockets, usersOnline, user.username, 'chatMessage', data);
            data.type = od;
            utils.sendToUser(sockets, usersOnline, fromUser.username, 'chatMessage', data);
        });


        socket.on('disconnect', function() {
            var user = socket.request.user;
            if (!_.isUndefined(usersOnline[user.username])) {
                var userSockets = usersOnline[user.username].sockets;
                if (_.size(userSockets) < 2) {
                    delete usersOnline[user.username];
                } else {
                    usersOnline[user.username].sockets = _.without(userSockets, socket.id);
                }

                utils.sendToAllConnectedClients(io, 'updateUsers', usersOnline);
                var o = _.findKey(sockets, {'id': socket.id});
                sockets = _.without(sockets, o);
            }

            winston.debug('User disconnected: ' + user.username + ' - ' + socket.id);
        });
    });


    global.io = io;
    winston.info('SocketServer Running');
};

function onAuthorizeSuccess(data, accept) {
    winston.debug('User successfully connected: ' + data.user.username);

    accept();
}
