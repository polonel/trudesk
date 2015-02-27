define(['angular', 'underscore', 'jquery', 'modules/helpers', 'history'], function(angular, _, $, helpers) {
    return angular.module('trudesk.controllers.accounts', [])
        .controller('accountsCtrl', function($scope, $http) {

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

            $scope.deleteAccount = function() {
                var usernames = getChecked();
                _.each(usernames, function(username) {
                    $http.delete(
                            '/api/users/' + username
                    ).success(function(data) {
                            if (!data.success) {
                                helpers.showFlash(data.error, true);
                                return;
                            }
                            removeCheckedFromGrid(username);
                            helpers.showFlash('Account Successfully Deleted');
                        }).error(function(err) {
                            helpers.showFlash(err, true);
                        });
                });

                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.accountEditPic = function() {
                $('#inputFile').trigger('click');
            };

            function getChecked() {
                var checkedIds = [];
                $('#accountsTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $accountTR = self.parents('tr');
                    if (!_.isUndefined($accountTR)) {
                        var accountUsername = $accountTR.attr('data-username');

                        if (!_.isUndefined(accountUsername) && accountUsername.length > 0) {
                            checkedIds.push(accountUsername);
                        }
                    }
                });

                return checkedIds;
            }

            function removeCheckedFromGrid(username) {
                $('#accountsTable tr[data-username="' + username + '"] ' + 'input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $groupTR = self.parents('tr');
                    if (!_.isUndefined($groupTR)) {
                        $groupTR.remove();
                    }
                });
            }

        });
});