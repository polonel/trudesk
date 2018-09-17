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

var _                   = require('lodash'),
    winston             = require('winston'),
    async               = require('async'),
    utils               = require('./helpers/utils'),
    passportSocketIo    = require('passport.socketio'),
    cookieparser        = require('cookie-parser'),
    emitter             = require('./emitter'),
    marked              = require('marked');

var socketServer = function(ws) {
    'use strict';
    var usersOnline = {},
        idleUsers = {},
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
                    }

                    data.emit('unauthorized');
                    data.disconnect('Unauthorized');
                    return next(new Error('Unauthorized'));
                });
            },
            function(data, accept) {
                if (data.request && data.request.user && data.request.user.logged_in) {
                    data.user = data.request.user;
                    return accept(null, true);
                }

                return passportSocketIo.authorize({
                    cookieParser: cookieparser,
                    key: 'connect.sid',
                    store: ws.sessionStore,
                    secret: 'trudesk$123#SessionKeY!2387',
                    success: onAuthorizeSuccess
                })(data, accept);
            }
        ], function(err) {
            if (err) 
                return accept(new Error(err));

            return accept();
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

    io.sockets.on('connection', function(socket) {
        // var totalOnline = _.size(usersOnline);

        setInterval(function() {
            updateConversationsNotifications();
            updateNotifications();
            updateOnlineBubbles();

        }, 5000);

        socket.on('$trudesk:chat:updateOnlineBubbles', function() {
           updateOnlineBubbles();
        });

        if (socket.request.user.logged_in)
            joinChatServer();

        function updateOnlineBubbles() {
            var sortedUserList = _.fromPairs(_.sortBy(_.toPairs(usersOnline), function(o) { return o[0]; }));
            var sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(idleUsers), function(o) { return o[0]; }));

            utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});
        }

        function updateConversationsNotifications() {
            var userId = socket.request.user._id;
            var messageSchema = require('./models/chat/message');
            var conversationSchema = require('./models/chat/conversation');
            conversationSchema.getConversationsWithLimit(userId, 10, function(err, conversations) {
                if (err) {
                    winston.warn(err.message);
                    return false;
                }

                var convos = [];

                async.eachSeries(conversations, function(convo, done) {
                    var c = convo.toObject();

                    var userMeta = convo.userMeta[_.findIndex(convo.userMeta, function(item) { return item.userId.toString() === userId.toString(); })];
                    if (!_.isUndefined(userMeta) && !_.isUndefined(userMeta.deletedAt) && userMeta.deletedAt > convo.updatedAt) 
                        return done();
                    

                    messageSchema.getMostRecentMessage(c._id, function(err, rm) {
                        if (err) return done(err);

                        _.each(c.participants, function(p) {
                            if (p._id.toString() !== userId.toString())
                                c.partner = p;
                        });

                        rm = _.first(rm);

                        if (!_.isUndefined(rm)) {
                            if (String(c.partner._id) === String(rm.owner._id)) 
                                c.recentMessage = c.partner.fullname + ': ' + rm.body;
                             else 
                                c.recentMessage = 'You: ' + rm.body;
                            
                        } else 
                            c.recentMessage = 'New Conversation';
                        

                        convos.push(c);

                        return done();
                    });

                }, function(err) {
                    if (err) return false;
                    return utils.sendToSelf(socket, 'updateConversationsNotifications', {conversations: convos});
                });
            });
        }

        socket.on('updateConversationsNotifications', function() {
            updateConversationsNotifications();
        });

        function updateNotifications() {
            var notifications = {};
            var notificationSchema = require('./models/notification');
            notificationSchema.findAllForUser(socket.request.user._id, function(err, items) {
                if (err) {
                    winston.warn(err);
                    return true;
                }

                // notifications.items = _.take(items, 5);
                notifications.items = items;
                var p = _.filter(items, {unread: true});
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
                    notification.save(function(err) {
                        if (err) return true;

                        updateNotifications();
                    });
                });
            });
        });

        socket.on('clearNotifications', function() {
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

        socket.on('updateUsers', function() {
            //utils.sendToUser(sockets, usersOnline, socket.request.user.username, 'updateUsers', sortedUserList);
            var sortedUserList = sortByKeys(usersOnline);

            utils.sendToSelf(socket, 'updateUsers', sortedUserList);
        });

        socket.on('updateAssigneeList', function() {
            var userSchema = require('./models/user');
            userSchema.getAssigneeUsers(function(err, users) {
                if (err) return true;

                utils.sendToSelf(socket, 'updateAssigneeList', users);
            });
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
                            emitter.emit('ticket:setAssignee', {assigneeId: ticket.assignee._id, ticketId: ticket._id, ticketUid: ticket.uid, hostname: socket.handshake.headers.host});
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
            var priority = data.priority;
            var ownerId = socket.request.user._id;
            var ticketSchema = require('./models/ticket');
            var prioritySchema = require('./models/ticketpriority');

            if (_.isUndefined(ticketId) || _.isUndefined(priority)) return true;
            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;
                prioritySchema.getPriority(priority, function(err, p) {
                    if (err) return true;

                    ticket.setTicketPriority(ownerId, p, function(err, t) {
                        if (err) return true;
                        t.save(function(err, tt) {
                            if (err) return true;

                            emitter.emit('ticket:updated', ticketId);
                            utils.sendToAllConnectedClients(io, 'updateTicketPriority', tt);
                        });
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
            issue = issue.replace(/(\r\n|\n\r|\r|\n)/g, '<br>');
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
            comment = comment.replace(/(\r\n|\n\r|\r|\n)/g, '<br>');
            var markedComment = marked(comment);

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return winston.error(err);

                ticket.updateComment(ownerId, commentId, markedComment, function(err) {
                    if (err) return winston.error(err);
                    ticket.save(function(err, tt) {
                        if (err) return winston.error(err);

                        utils.sendToAllConnectedClients(io, 'updateComments', tt);
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

                        utils.sendToAllConnectedClients(io, 'updateComments', tt);
                    });
                });
            });
        });

        socket.on('$trudesk:tickets:setNoteText', function(data) {
            var ownerId = socket.request.user._id;
            var ticketId = data.ticketId;
            var noteId = data.noteId;
            var note = data.noteText;
            var ticketSchema = require('./models/ticket');
            if (_.isUndefined(ticketId) || _.isUndefined(noteId) || _.isUndefined(note)) return true;
            note = note.replace(/(\r\n|\n\r|\r|\n)/g, '<br>');
            var markedNote = marked(note);

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return winston.error(err);

                ticket.updateNote(ownerId, noteId, markedNote, function(err) {
                    if (err) return winston.error(err);
                    ticket.save(function(err, tt) {
                        if (err) return winston.error(err);

                        utils.sendToAllConnectedClients(io, 'updateComments', tt);
                    });
                });
            });
        });

        socket.on('$trudesk:tickets:removeNote', function(data) {
            var ownerId = socket.request.user._id;
            var ticketId = data.ticketId;
            var noteId = data.noteId;
            if (_.isUndefined(ticketId) || _.isUndefined(noteId)) return true;

            var ticketSchema = require('./models/ticket');
            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                ticket.removeNote(ownerId, noteId, function(err, t) {
                    if (err) return true;

                    t.save(function(err, tt) {
                        if (err) return true;

                        utils.sendToAllConnectedClients(io, 'updateComments', tt);
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
                var canRemoveAttachments = permissions.canThis(user.role, 'ticket:removeAttachment');

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
            var AnsiUp = require('ansi_up');
            var ansi_up = new AnsiUp.default;
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

        socket.on('$trudesk:setUserIdle', function() {
            var user = socket.request.user;
            var exists = false;
            if (idleUsers.hasOwnProperty(user.username.toLowerCase()))
                exists = true;

            var sortedUserList = null;
            var sortedIdleList = null;

            if (!exists) {
                if (user.username.length !== 0) {
                    idleUsers[user.username.toLowerCase()] = {sockets: [socket.id], user:user};
                    sortedUserList = _.fromPairs(_.sortBy(_.toPairs(usersOnline), function(o) { return o[0]; }));
                    sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(idleUsers), function(o) { return o[0]; }));

                    utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});
                }
            } else {
                idleUsers[user.username].sockets.push(socket.id);
                sortedUserList = _.fromPairs(_.sortBy(_.toPairs(usersOnline), function(o) { return o[0]; }));
                sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(idleUsers), function(o) { return o[0]; }));

                utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});
            }
        });

        socket.on('$trudesk:setUserActive', function() {
            var user = socket.request.user;
            if (idleUsers.hasOwnProperty(user.username.toLowerCase())) {
                delete idleUsers[user.username.toLowerCase()];
                var sortedUserList = _.fromPairs(_.sortBy(_.toPairs(usersOnline), function(o) { return o[0]; }));
                var sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(idleUsers), function(o) { return o[0]; }));

                utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});
            }
        });

        function joinChatServer() {
            var user = socket.request.user;
            var exists = false;
            if (usersOnline.hasOwnProperty(user.username.toLowerCase()))
                exists = true;

            var sortedUserList = _.zipObject(_.sortBy(_.toPairs(usersOnline), function(o) { return o[0]; }));

            if (!exists) {
                if (user.username.length !== 0) {
                    usersOnline[user.username] = {sockets: [socket.id], user: user};
                    sortedUserList = sortByKeys(usersOnline);

                    utils.sendToSelf(socket, 'joinSuccessfully');
                    utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList);
                    sockets.push(socket);

                    spawnOpenChatWindows(socket, user._id);
                }
            } else {
                usersOnline[user.username].sockets.push(socket.id);
                utils.sendToSelf(socket, 'joinSuccessfully');

                sortedUserList = sortByKeys(usersOnline);
                utils.sendToAllConnectedClients(io, 'updateUsers', sortedUserList);
                sockets.push(socket);

                spawnOpenChatWindows(socket, user._id);
            }
        }

        socket.on('getOpenChatWindows', function() {
            spawnOpenChatWindows(socket, socket.request.user._id);
        });

        function spawnOpenChatWindows(socket, loggedInAccountId) {
            var userSchema = require('./models/user');
            var conversationSchema = require('./models/chat/conversation');
            userSchema.getUser(loggedInAccountId, function(err, user) {
                if (err) return true;

                async.eachSeries(user.preferences.openChatWindows, function(convoId, done) {
                    var partner = null;
                    conversationSchema.getConversation(convoId, function(err, conversation) {
                        if (err || !conversation) return done();
                        _.each(conversation.participants, function(i) {
                            if (i._id.toString() !== loggedInAccountId.toString()) {
                                partner = i.toObject();
                                return partner;
                            }
                        });

                        if (partner === null) return done();

                        delete partner.password;
                        delete partner.resetPassHash;
                        delete partner.resetPassExpire;
                        delete partner.accessToken;
                        delete partner.iOSDeviceTokens;
                        delete partner.deleted;

                        utils.sendToSelf(socket, 'spawnChatWindow', partner);

                        return done();
                    });
                });
            });
        }

        socket.on('spawnChatWindow', function(userId) {
            //Get user
            var userSchema = require('./models/user');
            userSchema.getUser(userId, function(err, user) {
                if (err) return true;
                if (user !== null) {
                    var u = user.toObject();
                    delete u.password;
                    delete u.resetPassHash;
                    delete u.resetPassExpire;
                    delete u.accessToken;
                    delete u.iOSDeviceTokens;
                    delete u.deleted;

                    utils.sendToSelf(socket,'spawnChatWindow', u);
                }
            });
        });

        socket.on('saveChatWindow', function(data) {
             var userId = data.userId;
             var convoId = data.convoId;
             var remove = data.remove;

             var userSchema = require('./models/user');
             userSchema.getUser(userId, function(err, user) {
                 if (err) return true;
                 if (user !== null) {
                     if (remove) 
                        user.removeOpenChatWindow(convoId);
                      else 
                         user.addOpenChatWindow(convoId);

                     
                 }
             });
        });

        socket.on('chatMessage', function(data) {
            var to = data.to;
            var from = data.from;
            var od = data.type;
            if (data.type === 's') 
                data.type = 'r';
             else 
                data.type = 's';
            

            var userSchema = require('./models/user');

            async.parallel([
                function(next) {
                    userSchema.getUser(to, function(err, toUser) {
                        if (err) return next(err);
                        if (!toUser) return next('User Not Found!');

                        data.toUser = toUser;

                        return next();
                    });
                },
                function(next) {
                    userSchema.getUser(from, function(err, fromUser) {
                        if (err) return next(err);
                        if (!fromUser) return next('User Not Found');

                        data.fromUser = fromUser;

                        return next();
                    });
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

            _.find(usersOnline, function(v) {
                if (String(v.user._id) === String(to)) 
                    user = v.user;
                
                if (String(v.user._id) === String(from)) 
                    fromUser = v.user;
                
            });

            if (_.isNull(user) || _.isNull(fromUser)) 
                return;
            

            data.toUser = user;
            data.fromUser = fromUser;

            utils.sendToUser(sockets, usersOnline, user.username, 'chatTyping', data);
        });

        socket.on('chatStopTyping', function(data) {
            var to = data.to;
            var user = null;

            _.find(usersOnline, function(v) {
                if (String(v.user._id) === String(to)) 
                    user = v.user;
                
            });

            if (_.isNull(user)) 
                return;
            

            data.toUser = user;

            utils.sendToUser(sockets, usersOnline, user.username, 'chatStopTyping', data);
        });

        //
        // Imports
        //

        // CSV
        socket.on('$trudesk:accounts:import:csv', function(data) {
            var UserSchema = require('./models/user');
            var authUser = socket.request.user;
            var permissions = require('./permissions');
            if (!permissions.canThis(authUser.role, 'accounts:import')) {
                //Send Error Socket Emit
                winston.warn('[$trudesk:accounts:import:csv] - Error: Invalid permissions.');
                utils.sendToSelf(socket, '$trudesk:accounts:import:error', {error: 'Invalid Permissions. Check Console.'});
                return;
            }

            var addedUsers = data.addedUsers;
            var updatedUsers = data.updatedUsers;

            var completedCount = 0;
            async.series([
                function(next) {
                    async.eachSeries(addedUsers, function(cu, done) {
                        var data = {
                            type: 'csv',
                            totalCount: addedUsers.length + updatedUsers.length,
                            completedCount: completedCount,
                            item: {
                                username: cu.username,
                                state: 1
                            }
                        };

                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);

                        var user = new UserSchema({
                            username: cu.username,
                            fullname: cu.fullname,
                            email: cu.email,
                            password: 'Password1!'
                        });

                        if (!_.isUndefined(cu.role)) 
                            user.role = cu.role;
                         else 
                            user.role = 'user';
                        

                        if (!_.isUndefined(cu.title))
                            user.title = cu.title;

                        user.save(function(err) {
                            if (err) {
                                winston.warn(err);
                                data.item.state = 3;
                                utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                            } else {
                                completedCount++;
                                // Send update
                                data.completedCount = completedCount;
                                data.item.state = 2; //Completed
                                setTimeout(function() {
                                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);

                                    done();
                                }, 150);
                            }
                        });

                    }, function() {
                        return next();
                    });
                },
                function(next) {
                    _.each(updatedUsers, function(uu) {
                        var data = {
                            type: 'csv',
                            totalCount: addedUsers.length + updatedUsers.length,
                            completedCount: completedCount,
                            item: {
                                username: uu.username,
                                state: 1 //Starting
                            }
                        };
                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                        UserSchema.getUserByUsername(uu.username, function(err, user) {
                            if (err) 
                                console.log(err);
                             else {
                                user.fullname = uu.fullname;
                                user.title = uu.title;
                                user.email = uu.email;
                                if (!_.isUndefined(uu.role))
                                    user.role = uu.role;

                                user.save(function(err) {
                                    if (err) {
                                        console.log(err);
                                        data.item.state = 3;
                                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                                    } else {
                                        completedCount++;
                                        data.item.state = 2;
                                        data.completedCount = completedCount;
                                        setTimeout(function() {
                                            utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                                        }, 150);
                                    }
                                });
                            }
                        });
                    });

                    return next();
                }
            ], function() {

            });
        });

        // JSON
        socket.on('$trudesk:accounts:import:json', function(data) {
            var UserSchema = require('./models/user');
            var authUser = socket.request.user;
            var permissions = require('./permissions');
            if (!permissions.canThis(authUser.role, 'accounts:import')) {
                //Send Error Socket Emit
                winston.warn('[$trudesk:accounts:import:json] - Error: Invalid permissions.');
                utils.sendToSelf(socket, '$trudesk:accounts:import:error', {error: 'Invalid Permissions. Check Console.'});
                return;
            }

            var addedUsers = data.addedUsers;
            var updatedUsers = data.updatedUsers;

            var completedCount = 0;
            async.series([
                function(next) {
                    async.eachSeries(addedUsers, function(cu, done) {
                        var data = {
                            type: 'json',
                            totalCount: addedUsers.length + updatedUsers.length,
                            completedCount: completedCount,
                            item: {
                                username: cu.username,
                                state: 1
                            }
                        };

                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);

                        var user = new UserSchema({
                            username: cu.username,
                            fullname: cu.fullname,
                            email: cu.email,
                            password: 'Password1!'
                        });

                        if (!_.isUndefined(cu.role)) 
                            user.role = cu.role;
                         else 
                            user.role = 'user';
                        

                        if (!_.isUndefined(cu.title))
                            user.title = cu.title;

                        user.save(function(err) {
                            if (err) {
                                winston.warn(err);
                                data.item.state = 3;
                                utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                            } else {
                                completedCount++;
                                // Send update
                                data.completedCount = completedCount;
                                data.item.state = 2; //Completed
                                setTimeout(function() {
                                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);

                                    done();
                                }, 150);
                            }
                        });

                    }, function() {
                        return next();
                    });
                },
                function(next) {
                    _.each(updatedUsers, function(uu) {
                        var data = {
                            type: 'json',
                            totalCount: addedUsers.length + updatedUsers.length,
                            completedCount: completedCount,
                            item: {
                                username: uu.username,
                                state: 1 //Starting
                            }
                        };
                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                        UserSchema.getUserByUsername(uu.username, function(err, user) {
                            if (err) 
                                console.log(err);
                             else {
                                user.fullname = uu.fullname;
                                user.title = uu.title;
                                user.email = uu.email;
                                if (!_.isUndefined(uu.role))
                                    user.role = uu.role;

                                user.save(function(err) {
                                    if (err) {
                                        console.log(err);
                                        data.item.state = 3;
                                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                                    } else {
                                        completedCount++;
                                        data.item.state = 2;
                                        data.completedCount = completedCount;
                                        setTimeout(function() {
                                            utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                                        }, 150);
                                    }
                                });
                            }
                        });
                    });

                    return next();
                }
            ], function() {

            });
        });

        // LDAP
        socket.on('$trudesk:accounts:import:ldap', function(data) {
            var UserSchema = require('./models/user');
            var authUser = socket.request.user;
            var permissions = require('./permissions');
            if (!permissions.canThis(authUser.role, 'accounts:import')) {
                //Send Error Socket Emit
                winston.warn('[$trudesk:accounts:import:ldap] - Error: Invalid permissions.');
                utils.sendToSelf(socket, '$trudesk:accounts:import:error', {error: 'Invalid Permissions. Check Console.'});
                return;
            }

            var addedUsers = data.addedUsers;
            var updatedUsers = data.updatedUsers;

            var completedCount = 0;
            async.series([
                function(next) {
                    async.eachSeries(addedUsers, function(lu, done) {
                        var data = {
                            type: 'ldap',
                            totalCount: addedUsers.length + updatedUsers.length,
                            completedCount: completedCount,
                            item: {
                                username: lu.sAMAccountName,
                                state: 1 //Starting
                            }
                        };

                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);

                        var user = new UserSchema({
                            username: lu.sAMAccountName,
                            fullname: lu.displayName,
                            email: lu.mail,
                            title: lu.title,
                            role: 'user',
                            password: 'Password1!'
                        });

                        user.save(function(err) {
                            if (err) {
                                winston.warn(err);
                                data.item.state = 3;
                                utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                            } else {
                                completedCount++;
                                // Send update
                                data.completedCount = completedCount;
                                data.item.state = 2; //Completed
                                setTimeout(function() {
                                    utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);

                                    done();
                                }, 150);
                            }
                        });
                    }, function() {
                        return next();
                    });
                },
                function(next) {
                    _.each(updatedUsers, function(uu) {
                        var data = {
                            type: 'ldap',
                            totalCount: addedUsers.length + updatedUsers.length,
                            completedCount: completedCount,
                            item: {
                                username: uu.username,
                                state: 1 //Starting
                            }
                        };
                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                        UserSchema.getUser(uu._id, function(err, user) {
                            if (err) 
                                console.log(err);
                             else {
                                user.fullname = uu.fullname;
                                user.title = uu.title;
                                user.email = uu.email;

                                user.save(function(err) {
                                    if (err) {
                                        console.log(err);
                                        data.item.state = 3;
                                        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                                    } else {
                                        completedCount++;
                                        data.item.state = 2;
                                        data.completedCount = completedCount;
                                        setTimeout(function() {
                                            utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', data);
                                        }, 150);
                                    }
                                });
                            }
                        });
                    });

                    return next();
                }
            ], function() {

            });
        });


        //
        socket.on('disconnect', function() {
            var user = socket.request.user;
            var sortedUserList = _.fromPairs(_.sortBy(_.toPairs(usersOnline), function(o) { return o[0]; }));
            var sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(idleUsers), function(o) { return o[0]; }));

            if (!_.isUndefined(usersOnline[user.username])) {
                var userSockets = usersOnline[user.username].sockets;

                if (_.size(userSockets) < 2) 
                    delete usersOnline[user.username];
                 else 
                    usersOnline[user.username].sockets = _.without(userSockets, socket.id);
                

                sortedUserList = _.fromPairs(_.sortBy(_.toPairs(usersOnline), function(o) { return o[0]; }));

                var o = _.findKey(sockets, {'id': socket.id});
                sockets = _.without(sockets, o);
            }

            if (!_.isUndefined(idleUsers[user.username])) {
                var idleSockets = idleUsers[user.username].sockets;

                if (_.size(idleSockets) < 2) 
                    delete idleUsers[user.username];
                 else 
                    idleUsers[user.username].sockets = _.without(idleSockets, socket.id);
                

                sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(idleUsers), function(o) { return o[0]; }));

                var i = _.findKey(sockets, {'id': socket.id});
                sockets = _.without(sockets, i);
            }

            //Save lastOnline Time
            var userSchema = require('./models/user');
            userSchema.getUser(user._id, function(err, u) {
                if (!err && u) {
                    u.lastOnline = new Date();

                    u.save();
                }
            });

            utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});

            winston.debug('User disconnected: ' + user.username + ' - ' + socket.id);
        });
    });


    global.io = io;
    winston.info('SocketServer Running');


};

function sortByKeys(obj) {
    var keys = Object.keys(obj);
    var sortedKeys = _.sortBy(keys);
    return _.fromPairs(
        _.map(sortedKeys, function(key) { return [key, obj[key]]; })
    );
}

function onAuthorizeSuccess(data, accept) {
    'use strict';

    winston.debug('User successfully connected: ' + data.user.username);

    accept();
}

module.exports = socketServer;