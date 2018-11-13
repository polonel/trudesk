/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    01/24/2016
 Author:     Chris Brame

 **/

define(['angular', 'underscore', 'jquery', 'moment', 'modules/helpers', 'history'], function(angular, _, $, moment, helpers) {
    return angular.module('trudesk.controllers.reports', [])
        .controller('reportsCtrl', function($scope, $http, $log, $timeout, $window) {

            var $filterDateStart = $('.filterDate_Start');
            $filterDateStart.each(function(index, element) {
                var $e = $(element);
                $e.off('hide.uk.datepicker');
                $e.on('hide.uk.datepicker', function(e) {
                    $timeout(function(){
                        $(e.target).validate();
                    }, 0);
                });
            });


            var $filterDateEnd = $('.filterDate_End');
            $filterDateEnd.each(function(index, element) {
                var $e = $(element);
                $e.off('hide.uk.datepicker');
                $e.on('hide.uk.datepicker', function(e) {
                    $timeout(function(){
                        $(e.target).validate();
                    }, 0);
                });
            });

            function changeView(selector) {
                var $activeReportType = $('.active_report_type');
                var $selector = $(selector);
                if ($selector.hasClass('active_report_type')) return true;
                $activeReportType.animate({opacity: 0}, 100, function() {
                    $activeReportType.removeClass('active_report_type');
                    $activeReportType.addClass('hide');
                    $selector.css({opacity: 0});
                    $selector.removeClass('hide');
                    $selector.addClass('active_report_type');
                    helpers.resizeFullHeight();
                    $selector.animate({opacity: 1}, 600);
                });
            }

            $scope.selectReport = function(event, type) {
                event.preventDefault();

                switch(type.toLowerCase()) {
                    case 'tickets_by_group':
                        changeView('#report_tickets_by_group');
                        break;
                    case 'tickets_by_priorities':
                        changeView('#report_tickets_by_priorities');
                        break;
                    case 'tickets_by_status':
                        changeView('#report_tickets_by_status');
                        break;
                    case 'tickets_by_tags':
                        changeView('#report_tickets_by_tags');
                        break;
                    case 'tickets_by_types':
                        changeView('#report_tickets_by_types');
                        break;
                    case 'tickets_by_users':
                        changeView('#report_tickets_by_users');
                        break;
                    default:
                        break;
                }
            };

            $scope.submitGenerateReport = function(event, type) {
                var form = $(event.target).parents('form');
                if (!form.isValid(null, null, false)) return true;

                event.preventDefault();

                var data = {};
                form.serializeArray().map(function(x){data[x.name] = x.value;});
                var startDate = moment(data['filterDate_Start']);
                var endDate = moment(data['filterDate_End']);

                var groups = [];

                switch (type.toLowerCase()) {
                    case 'group':
                        showLoader();
                        groups = form.find('select#groups').val();
                        $http({
                            method: 'POST',
                            url: '/api/v1/reports/generate/tickets_by_group',
                            data: {
                                startDate: startDate,
                                endDate: endDate,
                                groups: groups
                            },
                            headers: { 'Content-Type' : 'application/json'}
                        }).then(function successCallback(response) {
                            downloadReport(response, 'report_tickets_by_group__' + data['filterDate_Start']);

                        }, function errorCallback(response) {
                            $log.log(response.statusText);
                        }).then(function() {
                            hideLoader();
                        });
                        break;
                    case 'priorities':
                        showLoader();
                        var priorities = form.find('select#priorities').val();
                        groups = form.find('select#groups').val();
                        $http({
                            method: 'POST',
                            url: '/api/v1/reports/generate/tickets_by_priority',
                            data: {
                                startDate: startDate,
                                endDate: endDate,
                                groups: groups,
                                priorities: priorities
                            },
                            headers: { 'Content-Type' : 'application/json' }
                        }).then(function successCallback(response) {
                            downloadReport(response, 'report_tickets_by_priorities__' + data['filterDate_Start']);
                        }, function errorCallback(response) {
                            $log.log(response.statusText);
                        }).then(function() {
                            hideLoader();
                        });
                        break;
                    case 'status':
                        showLoader();
                        var status = form.find('select#status').val();
                        groups = form.find('select#groups').val();
                        $http({
                            method: 'POST',
                            url: '/api/v1/reports/generate/tickets_by_status',
                            data: {
                                startDate: startDate,
                                endDate: endDate,
                                groups: groups,
                                status: status
                            },
                            headers: { 'Content-Type' : 'application/json' }
                        }).then(function successCallback(response) {
                            downloadReport(response, 'report_tickets_by_status__' + data['filterDate_Start']);
                        }, function errorCallback(response) {
                            $log.log(response.statusText);
                        }).then(function() {
                            hideLoader();
                        });
                        break;
                    case 'tags':
                        showLoader();
                        var tags = form.find('select#tags').val();
                        groups = form.find('select#groups').val();
                        $http({
                            method: 'POST',
                            url: '/api/v1/reports/generate/tickets_by_tags',
                            data: {
                                startDate: startDate,
                                endDate: endDate,
                                groups: groups,
                                tags: tags
                            },
                            headers: { 'Content-Type' : 'application/json' }
                        }).then(function successCallback(response) {
                            downloadReport(response, 'report_tickets_by_tags__' + data['filterDate_Start']);
                        }, function errorCallback(response) {
                            $log.log(response.statusText);
                        }).then(function() {
                            hideLoader();
                        });
                        break;
                    case 'types':
                        showLoader();
                        var types = form.find('select#types').val();
                        groups = form.find('select#groups').val();
                        $http({
                            method: 'POST',
                            url: '/api/v1/reports/generate/tickets_by_type',
                            data: {
                                startDate: startDate,
                                endDate: endDate,
                                groups: groups,
                                types: types
                            },
                            headers: { 'Content-Type' : 'application/json' }
                        }).then(function successCallback(response) {
                            downloadReport(response, 'report_tickets_by_types__' + data['filterDate_Start']);
                        }, function errorCallback(response) {
                            $log.log(response.statusText);
                        }).then(function() {
                            hideLoader();
                        });
                        break;
                    case 'users':
                        showLoader();
                        var users = form.find('select#users').val();
                        groups = form.find('select#groups').val();
                        $http({
                            method: 'POST',
                            url: '/api/v1/reports/generate/tickets_by_user',
                            data: {
                                startDate: startDate,
                                endDate: endDate,
                                groups: groups,
                                users: users
                            },
                            headers: { 'Content-Type' : 'application/json' }
                        }).then(function successCallback(response) {
                            downloadReport(response, 'report_tickets_by_users__' + data['filterDate_Start']);
                        }, function errorCallback(response) {
                            $log.log(response.statusText);
                        }).then(function() {
                            hideLoader();
                        });
                        break;
                    default:
                        break;
                }
            };

            function showLoader() {
                var $loader = $('#loader-wrapper');
                $loader.css({opacity: 0, display: 'block'});
                $loader.animate({'opacity': 0.8}, 600);
            }

            function hideLoader() {
                var $loader = $('#loader-wrapper');
                $loader.animate({'opacity': 0}, 200, function() {
                    $loader.hide();
                });
            }

            function downloadReport(response, filename) {
                var headers = response.headers();
                var blob = new Blob([response.data],{type:headers['content-type']});
                var link = $window.document.createElement('a');
                link.href = $window.URL.createObjectURL(blob);
                link.download = filename + '.csv';
                link.click();
                link.remove();
            }

        });
});