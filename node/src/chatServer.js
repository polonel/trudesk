var winston = require('winston'),
    utils = require('./helpers/utils');

module.exports = function(server) {
    var _ = require('lodash'),
        usersOnline = {},
        rooms = {},
        chatHistory = {},
        chatHistoryCounter = 1000,
        sockets = [],
        io = require('socket.io').listen(server);

    //io.set('log level', 1);

    io.sockets.on('connection', function(socket) {
        var totalOnline = _.size(usersOnline);
        utils.sendToAllConnectedClients(io, 'updateUserCount', {count: totalOnline});

        utils.sendToSelf(socket, 'connectingToSocketServer', {
            status: 'online'
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

    winston.info('ChatServer Running');
};
