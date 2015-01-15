define('modules/socket', [
    'socketio',
    'modules/chat',
    'modules/ui'

], function(io, chat, ui) {
    var sClient = {};
    sClient.ui = ui;
    ui.init();

    console.log(socket);

    return sClient;
});