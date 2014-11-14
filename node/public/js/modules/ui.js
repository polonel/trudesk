define('modules/ui', [
    'jquery',
    'socketio'

], function($, io) {
    var socketUi = {};
    var socket = io.connect();
    socketUi.init = function() {
        this.updateMailNotifications();
    };

    socketUi.updateMailNotifications = function() {
        $(document).ready(function() {
            $('#btn_mail-notifications').click(function(e) {
                socket.emit('updateMailNotifications');
                e.preventDefault();
            });
        });

        socket.on('updateMailNotifications', function(data) {
            var label = $('#btn_mail-notifications > span');
            if (data < 1) {
                label.hide();
            } else {
                label.html(data);
                label.show();
            }
        });
    };

    return socketUi;
});