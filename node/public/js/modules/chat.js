define('modules/chat',[
    'jquery',
    'socketio'

], function($, io) {
    var chatClient = {};

    chatClient.init = function() {
        chatClient.user = {};
        chatClient.users = {};
        chatClient.rooms = [];
        chatClient.error = {};
        chatClient.username = '';
        chatClient.joined = false;
        chatClient.timeout = undefined;

        var socket = io.connect();
        socket.on('connectingToSocketServer', function(data) {
            console.log(data.status);
        });
    };

    return chatClient;
});