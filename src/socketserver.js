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
    async               = require('async'),
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

    io.use(function(data, accept) {
        async.waterfall([
            async.constant(data),
            function(data, next) {
                if (!data.request._query.token)
                    return next(null, data);
                var userSchema = require('./models/user');
                userSchema.getUserByAccessToken(data.request._query.token, function(err, user) {
                    if (!err && user) {
                        winston.debug('Authenticated socket ' + data.id + ' - ' + user.username);
                        data.request.user = user;
                        data.request.user.logged_in = true;
                        data.token = data.request._query.token;
                        return next(null,  data);
                    } else {
                        data.emit('unauthorized');
                        data.disconnect('Unauthorized');
                        return next(new Error('Unauthorized'));
                    }
                });
            },
            function(data, accept) {
                if (data.request && data.request.user && data.request.user.logged_in) {
                    data.user = data.request.user;
                    return accept(null, true);
                } else {
                    return passportSocketIo.authorize({
                        cookieParser: cookieparser,
                        key: 'connect.sid',
                        store: ws.sessionStore,
                        secret: 'trudesk$123#SessionKeY!2387',
                        success: onAuthorizeSuccess
                    })(data, accept);
                }
            }
        ], function(err) {
            if (err) {
                return accept(new Error(err));
            } else {
                return accept();
            }
        });
    });

    io.set('transports', [
        'websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling',
        'polling'
    ]);

    function onAuthorizeFail(data, message, error, accept) {
        winston.warn('Forcing Accept of socket connect! - (' + message + ') -- ' + 'Maybe iOS?');
        accept();
    }

    io.sockets.on('connection', function(socket) {
        var totalOnline = _.size(usersOnline);

        //TODO: This is a JANK lag that needs to be removed and optimized!!!!
        setInterval(function() {
            updateMailNotifications();
            updateNotifications();
            var sortedUserList = __.object(__.sortBy(__.pairs(usersOnline), function(o) { return o[0]}));
            utils.sendToSelf(socket, 'updateUsers', sortedUserList);

        }, 5000);

        function updateMailNotifications() {
            utils.sendToSelf(socket, 'updateMailNotifications', {unreadCount: 0, unreadItems: []});
            // var userId = socket.request.user._id;
            // var messageSchema = require('./models/message');
            // var payload = {};
            // async.parallel([
            //     function(callback) {
            //         messageSchema.getUnreadInboxCount(userId, function(err, objs) {
            //             if (err) return callback();
            //             payload.unreadCount = objs;
            //
            //            callback();
            //         });
            //     },
            //
            //     function(callback){
            //         messageSchema.getUserUnreadMessages(userId, function(err, objs) {
            //             if (err) return callback();
            //             payload.unreadItems = objs;
            //
            //             callback();
            //         });
            //     }
            // ], function(err) {
            //     if (err) return true;
            //
            //     utils.sendToSelf(socket, 'updateMailNotifications', payload);
            // });
        }

        socket.on('authenticate', function(data) {
            var userSchema = require('./models/user');
            userSchema.getUserByAccessToken(data.token, function(err, user) {
                if (!err && user) {
                    winston.debug('Authenticated socket ' + socket.id + ' - ' + user.username);
                    socket.request.user = user;
                    socket.auth = true;
                }

                setTimeout(function() {
                    if (!socket.auth) {
                        winston.debug('Disconnecting socket ' + socket.id + ' - (did not auth)');
                        socket.disconnect('unauthorized');
                    }
                }, 1000);
            });
        });

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

                notifications.items = __.first(items, 5);
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

        socket.on('ticket:updategrid', function() {
            utils.sendToAllConnectedClients(io, 'ticket:updategrid');
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
            // var messageSchema = require('./models/message');
            // var user = socket.request.user;
            // var folder = data.folder;
            // messageSchema.getUserFolder(user._id, folder, function(err, items) {
            //     if (err) return true;
            //
            //     var payload = {
            //         folder: folder,
            //         items: items
            //     };
            //
            //     utils.sendToSelf(socket, 'updateMessagesFolder', payload);
            // });
        });

        socket.on('updateUsers', function(data) {
            var sortedUserList = __.object(__.sortBy(__.pairs(usersOnline), function(o) { return o[0]}));
            utils.sendToUser(sockets, usersOnline, socket.request.user.username, 'updateUsers', sortedUserList);
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
                if (err) return true;

                async.parallel({
                    setAssignee: function(callback) {
                        ticket.setAssignee(ownerId, userId, function(err, ticket) {
                            callback(err, ticket);
                        });
                    },
                    subscriber: function(callback) {
                        ticket.addSubscriber(userId, function(err, ticket) {
                            callback(err, ticket);
                        });
                    }
                }, function(err, results) {
                    if (err) return true;

                    ticket = results.subscriber;
                    ticket.save(function(err, ticket) {
                        if (err) return true;
                        ticketSchema.populate(ticket, 'assignee', function(err) {
                            if (err) return true;

                            emitter.emit('ticket:subscriber:update', {user: userId, subscribe: true});
                            emitter.emit('ticket:updated', ticketId);
                            utils.sendToAllConnectedClients(io, 'updateAssignee', ticket);
                        });
                    });

                });
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

                var user = socket.request.user;
                if (_.isUndefined(user)) return true;

                var permissions = require('./permissions');
                var canRemoveAttachments = permissions.canThis(user.role, "ticket:removeAttachment");

                var data = {
                    ticket: ticket,
                    canRemoveAttachments: canRemoveAttachments
                };

                utils.sendToAllConnectedClients(io, 'updateTicketAttachments', data);
            });
        });

        socket.on('refreshTicketTags', function(data) {
            var ticketId = data.ticketId;
            var ticketSchema = require('./models/ticket');
            if (_.isUndefined(ticketId)) return true;

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                var data = {
                    ticket: ticket
                };

                utils.sendToAllConnectedClients(io, 'updateTicketTags', data);
            });
        });

        socket.on('logs:fetch', function() {
            var path = require('path');
            var ansi_up = require('ansi_up');
            var fileTailer = require('file-tail');
            var fs = require('fs');
            var logFile = path.join(__dirname, '../logs/output.log');
            if (!fs.existsSync(logFile))
                utils.sendToSelf(socket, 'logs:data', 'Invalid Log File...');
            else {
                var ft = fileTailer.startTailing(logFile);
                ft.on('line', function(line) {
                    utils.sendToSelf(socket, 'logs:data', ansi_up.ansi_to_html(line));
                });
            }
        });

        socket.on('setShowNotice', function(noticeId) {
            var noticeSchema = require('./models/notice');
            noticeSchema.getNotice(noticeId, function(err, notice) {
                if (err) return true;
                notice.activeDate = new Date();
                notice.save(function(err) {
                    if (err) {
                        winston.warn(err);
                        return true;
                    }

                    utils.sendToAllConnectedClients(io, 'updateShowNotice', notice);
                });
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

            var sortedUserList = __.object(__.sortBy(__.pairs(usersOnline), function(o) { return o[0]}));

            if (!exists) {
                if (user.username.length !== 0) {
                    usersOnline[user.username] = {sockets: [socket.id], user: user};

                    totalOnline = _.size(usersOnline);
                    sortedUserList = __.object(__.sortBy(__.pairs(usersOnline), function(o) { return o[0]}));
                    utils.sendToSelf(socket, 'joinSuccessfully');
                    utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList);
                    sockets.push(socket);
                }
            } else {
                usersOnline[user.username].sockets.push(socket.id);

                utils.sendToSelf(socket, 'joinSuccessfully');
                sortedUserList = __.object(__.sortBy(__.pairs(usersOnline), function(o) { return o[0]}));
                utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList);
                sockets.push(socket);
            }
        });

        socket.on('spawnChatWindow', function(data) {
            //Get user
            var userSchema = require('./models/user');
            userSchema.getUser(data, function(err, user) {
                if (err) return true;
                if (user != null)
                    utils.sendToSelf(socket,'spawnChatWindow', user);
            });
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

            var userSchema = require('./models/user');

            async.parallel([
                function(next) {
                    userSchema.getUser(to, function(err, toUser) {
                        if (err) return next(err);
                        if (!toUser) return next('User Not Found!');

                        data.toUser = toUser;

                        return next();
                    })
                },
                function(next) {
                    userSchema.getUser(from, function(err, fromUser) {
                        if (err) return next(err);
                        if (!fromUser) return next('User Not Found');

                        data.fromUser = fromUser;

                        return next();
                    })
                }
            ], function(err) {
                if (err) return utils.sendToSelf(socket, 'chatMessage', {message: err});

                utils.sendToUser(sockets, usersOnline, data.toUser.username, 'chatMessage', data);
                data.type = od;
                utils.sendToUser(sockets, usersOnline, data.fromUser.username, 'chatMessage', data);
            });
        });

        socket.on('chatTyping', function(data) {
            var to = data.to;
            var from = data.from;

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
                return;
            }

            data.toUser = user;
            data.fromUser = fromUser;

            utils.sendToUser(sockets, usersOnline, user.username, 'chatTyping', data);
        });

        socket.on('chatStopTyping', function(data) {
            var to = data.to;
            var user = null;

            _.find(usersOnline, function(v,k) {
                if (String(v.user._id) === String(to)) {
                    user = v.user;
                }
            });

            if (_.isNull(user)) {
                return;
            }

            data.toUser = user;

            utils.sendToUser(sockets, usersOnline, user.username, 'chatStopTyping', data);
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

                var sortedUserList = __.object(__.sortBy(__.pairs(usersOnline), function(o) { return o[0]}));
                utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList);
                var o = _.findKey(sockets, {'id': socket.id});
                sockets = _.without(sockets, o);
            }

            //Save lastOnline Time
            var userSchema = require('./models/user');
            userSchema.getUser(user._id, function(err, u) {
                if (!err) {
                    u.lastOnline = new Date();

                    u.save();
                }
            });

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
