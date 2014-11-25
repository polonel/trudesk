define('modules/socket', [
    'modules/chat',
    'modules/ui'

], function(chat, ui) {
    var sClient = {};

    chat.init();
    ui.init();

    return sClient;
});