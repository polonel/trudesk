define([
    'jquery',
    'angular',
    'underscore',
    'history',

    'angularjs/controllers/common',
    'angularjs/controllers/profile',
    'angularjs/controllers/accounts',
    'angularjs/controllers/groups',
    'angularjs/controllers/tickets',
    'angularjs/controllers/singleTicket'

    ], function($, angular, _) {

    return angular.module('trudesk.controllers',
        [
            'trudesk.controllers.common',
            'trudesk.controllers.profile',
            'trudesk.controllers.accounts',
            'trudesk.controllers.groups',
            'trudesk.controllers.tickets',
            'trudesk.controllers.singleTicket'
        ])
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