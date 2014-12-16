define(['angular', 'underscore', 'history', 'angularjs/controllers/accounts'], function(angular, _) {
    return angular.module('trudesk.controllers', ['trudesk.controllers.accounts'])
        .controller('truCtrl', function($scope) {
            $scope.submitForm = function(formName) {
                if (_.isNull(formName) || _.isUndefined(formName)) return true;

                var form = angular.element('#' + formName);
                if (!_.isUndefined(form)) {
                    form.submit();
                }
            }

        });
});