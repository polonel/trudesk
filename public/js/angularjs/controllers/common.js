define(['angular', 'underscore', 'jquery', 'modules/socket', 'history'], function(angular, _, $, socket) {
    return angular.module('trudesk.controllers.common', [])
        .controller('commonCtrl', function($scope, $http) {


            $scope.clearNotifications = function($event) {
                $event.preventDefault();
                $event.stopPropagation();

                socket.ui.clearNotifications();
            }

        });
});