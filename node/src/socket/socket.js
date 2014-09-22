var users = {};

module.exports = function(io) {
    io.on('connection', function(socket) {
        socket.on('userOnline', function(data) {
            users[data.name] = socket;
        });

        socket.on('receivedMessage', function(data) {
            console.log(data);
            socket.emit('receivedMessage', data);
        });
    });

    io.on('disconnect', function(socket) {

    });
}