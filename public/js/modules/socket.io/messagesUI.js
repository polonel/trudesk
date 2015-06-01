/**
 .                              .o8                     oooo
 .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    05/22/2015
 Author:     Chris Brame

 **/

define('modules/socket.io/messagesUI', [
    'jquery',
    'underscore',
    'moment',
    'modules/helpers',
    'modules/navigation',
    'history'

], function($, _, moment, helpers, nav) {
    var messagesUI = {};

    messagesUI.setMessageRead = function(socket, messageId) {
        socket.emit('setMessageRead', messageId);
    };

    messagesUI.updateSingleMessageItem = function(socket) {
        socket.removeAllListeners('updateSingleMessageItem');
        socket.on('updateSingleMessageItem', function(message) {
            var messageItem = $('.message-items').find('li[data-messageid="' + message._id + '"]');
            if (messageItem.length > 0) {
                messageItem.removeClass('unread');
                messageItem.removeClass('message-tag');
            }
        });
    };

    messagesUI.updateMessagesFolder = function(socket) {
        socket.removeAllListeners('updateMessagesFolder');
        socket.on('updateMessagesFolder', function(data) {
            var folderNum = parseInt(data.folder);
            var messages = data.items;
            var folderName = undefined;
            switch (folderNum) {
                case 0:
                    folderName = 'inbox';
                    break;
                case 1:
                    folderName = 'sent items';
                    break;
                case 2:
                    folderName = 'trash';
                    break;
            }

            var messageItems = $('.message-items[data-folder="' + folderName + '"]');
            if (messageItems.length < 1) {
                console.log('cant find message-items container! [foldername=' + folderName + ']');
                return true;
            }

            var activeItemId = messageItems.find('li.active').attr('data-messageid');
            var checkedItems = [];
            messageItems.find('input[type="checkbox"]:checked').each(function() {
                var self = $(this);
                var $messageId = self.parents('li').attr('data-messageid');
                checkedItems.push($messageId);
            });

            var count = messageItems.find('li').not(':first').length;
            if (count < _.size(messages)) {
                var audio = $('audio#newmessageaudio');
                if (audio.length > 0) audio.trigger('play');
            }
            messageItems.find('li').not(':first').remove();
            var html = '';

            _.each(messages, function(message) {
                var unread = (message.unread) ? 'unread message-tag ' : '';
//                var dateFormated = moment(message.date).format('MM/DD/YYYY at hh:mmt');
                var dateFormated = moment(message.date).calendar();
                var active = '';
                if (message._id == activeItemId) active = ' active ';
                var checked = '';
                if (_.contains(checkedItems, message._id)) checked = ' checked ';

                html += '<li class="' + unread + active + '" data-messageId="' + message._id + '">' +
                        '   <input id="c_' + message._id + '" type="checkbox" ' + checked + '/>' +
                        '   <label for="c_' + message._id + '"></label>' +
                        '   <span class="message-date">' + dateFormated + '</span>' +
                        '   <span class="message-from">' + message.from.fullname + '</span>' +
                        '   <span class="message-subject">' + message.subject + '</span>' +
                        '</li>';
            });

            messageItems.append(html);
            var hasActive = messageItems.find('li.active').length > 0;
            if (!hasActive) helpers.clearMessageContent();

            var infoMessage = data.infoMessage;
            if (!_.isUndefined(infoMessage) && infoMessage.length > 0 && _.size(messages) > 0) {
                helpers.showFlash(infoMessage);
            }

            require(['pages/messages'], function(m) {
                m.init();
                m.startRefresh();
            });
        });
    };

    return messagesUI;
});
