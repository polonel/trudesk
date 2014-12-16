define(['angular', 'underscore', 'history'], function(angular, _) {
    return angular.module('trudesk.controllers.accounts', [])
        .controller('accountsCtrl', function($scope, $http) {
            $scope.getRoles = function() {
                var roles = {};
                $http.get('/api/roles')
                    .success(function(data, status) {
                        roles = data;
                        return data;
                    });
            };

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

            $scope.accountEditPic = function($event) {
                console.log($event);
            };

        });
});