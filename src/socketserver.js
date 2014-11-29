var winston = require('winston'),
    utils = require('./helpers/utils'),
    passportSocketIo = require('passport.socketio'),
    cookieparser = require('cookie-parser');

module.exports = function(ws) {
    var _ = require('lodash'),
        usersOnline = {},
        rooms = {},
        chatHistory = {},
        chatHistoryCounter = 1000,
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

        utils.sendToSelf(socket, 'connectingToSocketServer', {
            status: 'online'
        });

        setInterval(function() {
            var userId = socket.request.user._id;
            var messageSchema = require('./models/message');
            var ticketSchema = require('./models/ticket');

            messageSchema.getUnreadInboxCount(userId, function(err, objs) {
                if (err) return true;
                utils.sendToSelf(socket, 'updateMailNotifications', objs);
            });

        }, 5000);

        socket.on('updateMailNotifications', function(data) {
            var userId = socket.request.user._id;
            var messageSchema = require('./models/message');
            messageSchema.getUnreadInboxCount(userId, function(err, objs) {
                if (err) return true;
                utils.sendToSelf(socket, 'updateMailNotifications', objs);
            });
        });

        socket.on('updateComments', function(data) {
            var userId = socket.request.user._id;
            var ticketId = data.ticketId;
            var ticketSchema = require('./models/ticket');

            ticketSchema.getTicketById(ticketId, function(err, ticket) {
                if (err) return true;

                utils.sendToAllConnectedClients(io, 'updateComments', ticket);
            });
        });

        socket.on('updateUsers', function(data) {
            utils.sendToSelf(socket, 'updateUsers', usersOnline);
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
            var fromUser = null

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

            winston.info('User disconnected: ' + user.username + ' - ' + socket.id);
        });
    });

    winston.info('SocketServer Running');
};

function onAuthorizeSuccess(data, accept) {
    winston.info('User successfully connected: ' + data.user.username);

    accept();
}
