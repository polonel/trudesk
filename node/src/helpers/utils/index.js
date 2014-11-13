module.exports.sendToSelf = function (socket, method, data) {
    socket.emit(method, data);
};

module.exports.sendToAllConnectedClients = function (io, method, data) {
    io.sockets.emit(method, data);
};

module.exports.sendToAllClientsInRoom = function (io, room, method, data) {
    io.sockets.in(room).emit(method, data);
};
