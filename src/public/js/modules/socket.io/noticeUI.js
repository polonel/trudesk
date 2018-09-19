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
    'uikit',
    'modules/navigation',
    'history'

], function($, _, moment, helpers, UIkit) {
    var noticeUI = {};

    noticeUI.setShowNotice = function(socket, notice) {
        socket.emit('setShowNotice', notice);
    };

    noticeUI.updateShowNotice = function(socket) {
        socket.removeAllListeners('updateShowNotice');
        socket.on('updateShowNotice', function(notice) {
            var $noticeDiv = $('div#notice-banner');
            var $dateFormated = moment(notice.activeDate).format('MM/DD/YYYY HH:mm');
            var $message = ' - Important: ' + notice.message;
            var $bgColor = notice.color;
            var $fontColor = notice.fontColor;
            $noticeDiv.css('background', $bgColor);
            $noticeDiv.css('color', $fontColor);
            $noticeDiv.html($dateFormated + $message);
            $noticeDiv.removeClass('uk-hidden');
            $('.sidebar').css('top', '105px');

            helpers.resizeAll();

            if (notice.alertWindow)
                showNoticeAlertWindow(notice);
        });
    };

    noticeUI.setClearNotice = function(socket) {
        socket.emit('setClearNotice');
    };

    noticeUI.updateClearNotice = function(socket) {
        socket.removeAllListeners('updateClearNotice');
        socket.on('updateClearNotice', function() {
            $('div#notice-banner').addClass('uk-hidden');
            $('.sidebar').css('top', '75px');

            helpers.resizeAll();

            hideNoticeAlertWindow();
        });
    };

    function showNoticeAlertWindow(notice) {
        var noticeAlertWindow = $('#noticeAlertWindow');
        if (noticeAlertWindow.length < 1) return true;

        var noticeTitle = noticeAlertWindow.find('#noticeTitle');
        var noticeText = noticeAlertWindow.find('#noticeText');
        var noticeBG = noticeAlertWindow.find('#noticeBG');
        var noticeCookieName = noticeAlertWindow.find('#__noticeCookieName');
        noticeCookieName.html(notice.name + '_' + moment(notice.activeDate).format('MMMDDYYYY_HHmmss'));

        noticeBG.css('background-color', notice.color);
        noticeTitle.css('color', notice.fontColor);

        noticeTitle.html(notice.name);
        noticeText.html(notice.message);

        var modal = UIkit.modal(noticeAlertWindow, {
            bgclose: false
        });

        modal.show();
    }

    function hideNoticeAlertWindow() {
        var noticeAlertWindow = $('#noticeAlertWindow');
        if (noticeAlertWindow.length < 1) return true;

        UIkit.modal(noticeAlertWindow).hide();
    }

    return noticeUI;
});
