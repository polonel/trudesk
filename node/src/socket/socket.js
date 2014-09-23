var users = [];

module.exports = function(io) {
//    io.on('connection', function(socket) {
//        socket.on('userOnline', function(data) {
//            socket.set('username', data.id, function() {
//                console.log(data.id);
//                users[data.id] = socket;
//            });
//        });
//
//        socket.on('receivedMessage', function(data) {
//            console.log(data);
//            users[data.to].emit('receivedMessage', data);
//        });
//
//        socket.on('disconnect', function() {
//            socket.get('username', function(err, user) {
//                console.log('disconnect from ' + user);
//                delete users[user];
//                io.sockets.emit('update', users);
//            });
//        });
//    });
};

module.exports.users = users;