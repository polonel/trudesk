define(['angular', 'underscore', 'jquery', 'modules/socket', 'history'], function(angular, _, $, socket) {
    return angular.module('trudesk.controllers.common', [])
        .controller('commonCtrl', function($scope, $http) {

            console.log('Controller Common Loaded!');

        });
});