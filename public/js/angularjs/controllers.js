define(['angular', 'underscore', 'history'], function(angular, _) {
    return angular.module('trudesk.controllers', [])
        .controller('truCtrl', function($scope) {
            $scope.editAccount = function($event) {
                if ($event.target.length < 1 ||
                    $event.target.tagName.toLowerCase() === 'label' ||
                    $event.target.tagName.toLowerCase() === 'input')
                    return true;

                var username = $event.currentTarget.dataset.username;
                History.pushState(null, null, '/accounts/' + username);
            }
        });
});