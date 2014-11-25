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

    io.sockets.on('connection', function(socket) {
        var totalOnline = _.size(usersOnline);
        utils.sendToAllConnectedClients(io, 'updateUserCount', {count: totalOnline});

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

        socket.on('joinSocketServer', function(data) {
            var exists = false;
            _.find(usersOnline, function(k,v) {
                if (k.name.toLowerCase() === data.name.toLowerCase())
                    return exists = true;
            });

            if (!exists) {
                if (data.name.length !== 0) {
                    usersOnline[socket.id] = {name: data.name};

                    totalOnline = _.size(usersOnline);
                    utils.sendToAllConnectedClients(io, 'updateUserCount', {count: totalOnline});

                    utils.sendToSelf(socket, 'joinSuccessfully');
                    utils.sendToAllConnectedClients(io, 'updateUserDetails', usersOnline);
                    sockets.push(socket);
                }
            }
        });

        socket.on('sendChat', function(data) {
            if (typeof usersOnline[socket.id] === 'undefined') {
                utils.sendToSelf(socket, 'sendChatMessage', {name: 'Error', message: 'Invalid Socket!'});
            } else {
                if (io.sockets.manager.roomClients[socket.id]['/'+socket.room]) {
                    if (_.size(chatHistory[socket.room]) > chatHistoryCounter) {
                        chatHistory[socket.room].splice(0,1);
                    } else {
                        chatHistory[socket.room].push(data);
                    }
                    utils.sendToAllClientsInRoom(io, socket.room, 'sendChatMessage', data);
                } else {
                    utils.sendToSelf(socket, 'sendChatMessage', {name: 'Error', message: 'Invalid Chat Room'});
                }
            }
        });


        socket.on('disconnect', function() {
            if (typeof usersOnline[socket.id] !== 'undefined') {
                delete usersOnline[socket.id];
                totalOnline = _.size(usersOnline);
                utils.sendToAllConnectedClients(io, 'updateUserCount', {count: totalOnline});
                var o = _.findKey(sockets, {'id': socket.id});
                sockets = _.without(sockets, o);
            }
        });
    });

    winston.info('SocketServer Running');
};

function onAuthorizeSuccess(data, accept) {
    winston.info('User successfully connected: ' + data.user.username);

    accept();
}
