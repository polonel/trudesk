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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'tomarkdown', 'uikit', 'history'], function(angular, _, $, helpers, socket, md, UIkit) {
    return angular.module('trudesk.controllers.messages', [])
        .controller('messagesCtrl', ['openNewMessageWindow', '$scope', '$http', '$window', function(openNewMessageWindow, $scope, $http, $window) {
            $scope.showNewMessage = function() {
                openNewMessageWindow.openWindow();
            };

            $scope.replyClicked = function($event) {
                $event.preventDefault();
                var messageContent = $('#message-content');
                if (messageContent.length < 1) return true;
                var replyToId = messageContent.find('.message-from-id').text().trim();
                var subjectText = messageContent.find('.message-header > h1').text().trim();
                subjectText = 'RE: ' + subjectText;

                if (replyToId.length < 1 || subjectText.length < 1) return true;

                openNewMessageWindow.openWindowWithOptions(replyToId, subjectText, '');
            };

            $scope.forwardClicked = function($event) {
                $event.preventDefault();
                var messageContent = $('#message-content');
                if (messageContent.length < 1) return true;

                var subjectText = messageContent.find('.message-header > h1').text().trim();
                subjectText = 'Fwd: ' + subjectText;
                var messageText = messageContent.find('.message').html();

                if (messageText.length < 1 || subjectText.length < 1) return true;

                openNewMessageWindow.openWindowWithOptions(null, subjectText, messageText);
            };

            $scope.updateMessagesInbox = function($event) {
                $event.preventDefault();

                socket.ui.sendUpdateMessageFolder(0);
            };

            $scope.deleteSelectedMessages = function($event) {
                $event.preventDefault();

                var checkMessages = getChecked();
                if (_.size(checkMessages) < 1) {
                    var activeMessage = $('.message-items').find('li.active');
                    if (activeMessage.length > 0) {
                        var messageId = activeMessage.attr('data-messageid');
                        checkMessages.push(messageId);
                    }
                }

                if (_.size(checkMessages) < 1) return true;

                socket.ui.deletedMessages(checkMessages);
            };

            $scope.moveSelectedMessagesToTrash = function($event) {
                $event.preventDefault();

                var checkMessages = getChecked();
                var folder = $('#__folder').html();

                if (_.size(checkMessages) < 1) {
                    var activeMessage = $('.message-items').find('li.active');
                    if (activeMessage.length > 0) {
                        var messageId = activeMessage.attr('data-messageid');
                        checkMessages.push(messageId);
                    }
                }

                if (_.size(checkMessages) < 1) return true;

                socket.ui.moveMessageToFolder(checkMessages, 2, folder);
            };

            function getChecked() {
                var checkedIds = [];
                $('#messagesForm input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $messageList = self.parents('li');
                    if (!_.isUndefined($messageList)) {
                        var messageOid = $messageList.attr('data-messageid');

                        if (!_.isUndefined(messageOid) && messageOid.length > 0) {
                            checkedIds.push(messageOid);
                        }
                    }
                });

                return checkedIds;
            }
        }])
        .factory('openNewMessageWindow', function() {
            return {
                openWindow: function openWindow() {
                    helpers.hideAllpDropDowns();
                    var $newMessageModal = $('#newMessageModal');
                    var $newMessageTo = $('#newMessageTo');
                    $newMessageTo.find("option").prop('selected', false);
                    $newMessageTo.trigger('chosen:updated');
                    $('#newMessageSubject').val('');
                    $('#newMessageText').val('');

                    UIkit.modal($newMessageModal).show();
                },
                openWindowWithOptions: function openWindowWithOptions(to, subject, text) {
                    helpers.hideAllpDropDowns();
                    var $newMessageModal = $('#newMessageModal');
                    var $newMessageTo = $('#newMessageTo');
                    $newMessageTo.find("option").prop('selected', false);
                    $newMessageTo.find("option[value='" + to + "']").prop('selected', true);
                    $newMessageTo.trigger('chosen:updated');
                    $('#newMessageSubject').val(subject);
                    var $mText = md(text);
                    $mText = $mText.trim();
                    $('#newMessageText').val($mText);

                    UIkit.modal($newMessageModal).show();
                },
                closeWindow: function closeWindow() {
                    //Close reveal and refresh page.
                    var $newMessageModal = $('#newMessageModal');
                    UIkit.modal($newMessageModal).hide();

                    //Clear Fields
                    var $newMessageTo = $('#newMessageTo');
                    $newMessageTo.find("option").prop('selected', false);
                    $newMessageTo.trigger('chosen:updated');
                    $('#newMessageSubject').val('');
                    $('#newMessageText').val('');
                }
            }
        });
});