define('modules/socket', [
    'modules/chat',
    'modules/ui'

], function(chat, ui) {
    var sClient = {};
    sClient.ui = ui;
    ui.init();

    return sClient;
});