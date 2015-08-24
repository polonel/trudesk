/**
 .                              .o8                     oooo
 .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    08/20/2015
 Author:     Chris Brame

 **/

define('modules/socket.io/noticeUI', [
    'jquery',
    'underscore',
    'moment',
    'modules/helpers',
    'modules/navigation',
    'history'

], function($, _, moment, helpers, nav) {
    var noticeUI = {};

    noticeUI.setShowNotice = function(socket, notice) {
        socket.emit('setShowNotice', notice);
    };

    noticeUI.updateShowNotice = function(socket) {
        socket.removeAllListeners('updateShowNotice');
        socket.on('updateShowNotice', function(notice) {
            var $noticeDiv = $('div#notice-banner');
            var $dateFormated = moment(notice.date).format('MM/DD/YYYY HH:mm');
            var $message = ' - Important: ' + notice.message;
            var $bgColor = notice.color;
            $noticeDiv.css('background', $bgColor);
            $noticeDiv.html($dateFormated + $message);
            $noticeDiv.removeClass('hide');
        });
    };

    noticeUI.setClearNotice = function(socket) {
        socket.emit('setClearNotice');
    };

    noticeUI.updateClearNotice = function(socket) {
        socket.removeAllListeners('updateClearNotice');
        socket.on('updateClearNotice', function() {
            $('div#notice-banner').addClass('hide');
        });
    };

    return noticeUI;
});
