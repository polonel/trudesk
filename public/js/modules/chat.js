define('modules/chat',[
    'jquery',
    'socketio'

], function($, io) {
    var chatClient = {};
    var socket = io.connect();

    chatClient.init = function() {
        chatClient.user = {};
        chatClient.users = {};
        chatClient.rooms = [];
        chatClient.error = {};
        chatClient.username = '';
        chatClient.joined = false;
        chatClient.timeout = undefined;
    };

    socket.removeListener('connect');
    socket.on('connect', function(data) {
        socket.emit('joinChatServer');
    });

    socket.removeListener('connectingToSocketServer');
    socket.on('connectingToSocketServer', function(data) {

    });

    socket.removeListener('updateUsers');
    socket.on('updateUsers', function(data) {

    });

    return chatClient;
});