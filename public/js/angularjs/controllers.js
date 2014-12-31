define(['jquery', 'angular', 'underscore', 'history', 'angularjs/controllers/accounts'], function($, angular, _) {
    return angular.module('trudesk.controllers', ['trudesk.controllers.accounts'])
        .controller('truCtrl', function($scope) {
            $scope.submitForm = function(formName, $event) {
                if (_.isNull(formName) || _.isUndefined(formName)) return true;

                $event.preventDefault();

                var form = $('#' + formName);
                if (!_.isUndefined(form)) {
                    form.submit();
                }
            }

        });
});