define(['angular', 'underscore', 'history'], function(angular, _) {
    return angular.module('trudesk.controllers', [])
        .controller('truCtrl', function($scope) {
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

            $scope.submitForm = function(formName) {
                if (_.isNull(formName) || _.isUndefined(formName)) return true;

                var form = angular.element('#' + formName);
                if (!_.isUndefined(form)) {
                    form.submit();
                }
            }

        });
});