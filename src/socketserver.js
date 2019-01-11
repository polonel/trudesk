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
 Updated:    01/09/2019
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

// Submodules
var sharedVars          = require('./socketio').shared;
var sharedUtils         = require('./socketio').utils;

var chatSocket          = require('./socketio/chatSocket');
var notificationSocket  = require('./socketio/notificationSocket');
var backuprestore       = require('./socketio/backuprestore');

var socketServer = function(ws) {
    'use strict';
    var io = require('socket.io')(ws.server);

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
        //Register Submodules
        chatSocket.register(socket);
        notificationSocket.register(socket);
        backuprestore.register(socket);

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

            marked.setOptions({
                breaks: true
            });
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

            marked.setOptions({
                breaks: true
            });

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

            marked.setOptions({
                breaks: true
            });
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
            if (sharedVars.idleUsers.hasOwnProperty(user.username.toLowerCase()))
                exists = true;

            var sortedUserList = null;
            var sortedIdleList = null;

            if (!exists) {
                if (user.username.length !== 0) {
                    sharedVars.idleUsers[user.username.toLowerCase()] = {sockets: [socket.id], user:user};
                    sortedUserList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.usersOnline), function(o) { return o[0]; }));
                    sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.idleUsers), function(o) { return o[0]; }));

                    utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});
                }
            } else {
                var idleUser = sharedVars.idleUsers[user.username.toLowerCase()];
                if (!_.isUndefined(idleUser)) {
                    idleUser.sockets.push(socket.id);

                    sortedUserList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.usersOnline), function (o) {
                        return o[0];
                    }));
                    sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.idleUsers), function (o) {
                        return o[0];
                    }));

                    utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {
                        sortedUserList: sortedUserList,
                        sortedIdleList: sortedIdleList
                    });
                }
            }
        });

        socket.on('$trudesk:setUserActive', function() {
            var user = socket.request.user;
            if (sharedVars.idleUsers.hasOwnProperty(user.username.toLowerCase())) {
                delete sharedVars.idleUsers[user.username.toLowerCase()];
                var sortedUserList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.usersOnline), function(o) { return o[0]; }));
                var sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.idleUsers), function(o) { return o[0]; }));

                utils.sendToSelf(socket, '$trudesk:chat:updateOnlineBubbles', {sortedUserList: sortedUserList, sortedIdleList: sortedIdleList});
            }
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
            var sortedUserList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.usersOnline), function(o) { return o[0]; }));
            var sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.idleUsers), function(o) { return o[0]; }));

            if (!_.isUndefined(sharedVars.usersOnline[user.username])) {
                var userSockets = sharedVars.usersOnline[user.username].sockets;

                if (_.size(userSockets) < 2) 
                    delete sharedVars.usersOnline[user.username];
                 else
                    sharedVars.usersOnline[user.username].sockets = _.without(userSockets, socket.id);
                

                sortedUserList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.usersOnline), function(o) { return o[0]; }));

                var o = _.findKey(sharedVars.sockets, {'id': socket.id});
                sharedVars.sockets = _.without(sharedVars.sockets, o);
            }

            if (!_.isUndefined(sharedVars.idleUsers[user.username])) {
                var idleSockets = sharedVars.idleUsers[user.username].sockets;

                if (_.size(idleSockets) < 2) 
                    delete sharedVars.idleUsers[user.username];
                 else
                    sharedVars.idleUsers[user.username].sockets = _.without(idleSockets, socket.id);
                

                sortedIdleList = _.fromPairs(_.sortBy(_.toPairs(sharedVars.idleUsers), function(o) { return o[0]; }));

                var i = _.findKey(sharedVars.sockets, {'id': socket.id});
                sharedVars.sockets = _.without(sharedVars.sockets, i);
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

    // Register Intervals
    chatSocket.registerInterval();

    winston.info('SocketServer Running');
};

function onAuthorizeSuccess(data, accept) {
    'use strict';

    winston.debug('User successfully connected: ' + data.user.username);

    accept();
}

module.exports = socketServer;