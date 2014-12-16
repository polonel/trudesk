define(['angular', 'angularjs/controllers', 'angularRoute'], function(angular) {
    return angular.module('trudesk', ['ngRoute', 'trudesk.controllers'])
        .config(function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[{');
            $interpolateProvider.endSymbol('}]}');
        });
});