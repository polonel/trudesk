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
        .controller('messagesCtrl', ['$scope', '$http', '$window', function($scope, $http, $window) {

            $scope.loadConversation = function(convoId) {
                History.pushState(null, null, '/messages/' + convoId );
            };

            $scope.sendChatMessage = function(cid, toUserId, event) {
                var form = $(event.target);
                if (form.length < 1) return;

                var input = form.find('input[name="chatMessage"]');

                if (input.val().length < 1)
                    return false;

                socket.chat.sendChatMessage(cid, toUserId, input.val(), function(err) {
                    input.val('');

                    socket.chat.stopTyping(cid, toUserId);
                });

                event.preventDefault();
            };

            $scope.onKeyDown = function(cid, toUserId, $event) {
                if ($event.keyCode != 13) {
                    socket.chat.startTyping(cid, toUserId);
                }
            }

        }]);
});