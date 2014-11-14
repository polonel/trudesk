define('modules/socket', [
    'modules/chat',
    'modules/ui'

], function(chat, ui) {
    chat.init();
    ui.init();
});