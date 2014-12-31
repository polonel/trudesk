define(['angular', 'underscore', 'history'], function(angular, _) {
    return angular.module('trudesk.controllers.accounts', [])
        .controller('accountsCtrl', function($scope, $http, $timeout) {

            $scope.editAccount = function($event) {
                if (_.isNull($event.target) || _.isUndefined($event.target) ||
                    $event.target.tagName.toLowerCase() === 'label' ||
                    $event.target.tagName.toLowerCase() === 'input')
                    return true;

                //currentTarget = ng-click() bound to. "<tr>"
                var username = $event.currentTarget.dataset.username;
                if (!username) return true;

                History.pushState(null, null, '/accounts/' + username);
            };

            $scope.accountEditPic = function() {
                setTimeout(function() {
                    angular.element('#inputFile').trigger('click');
                }, 0);
            };

        });
});