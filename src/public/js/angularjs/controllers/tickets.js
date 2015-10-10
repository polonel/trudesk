/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'history'], function(angular, _, $, helpers, socket) {
    return angular.module('trudesk.controllers.tickets', [])
        .controller('ticketsCtrl', function($scope, $http, $window) {

            $scope.submitTicketForm = function() {
                var socketId = socket.ui.socket.io.engine.id;
                var data = {};
                $('#createTicketForm').serializeArray().map(function(x){data[x.name] = x.value;});
                data.socketId = socketId;
                $http({
                    method: 'POST',
                    url: '/api/v1/tickets/create',
                    data: data,
                    headers: { 'Content-Type': 'application/json'}
                })
                    .success(function(data) {
                        if (!data.success) {
                            if (data.error) {
                                helpers.showFlash('Error: ' + data.error, true);
                                return;
                            }

                            helpers.showFlash('Error Submitting Ticket', true);
                        }

                        helpers.showFlash('Ticket Created Successfully.');

                        History.pushState(null, null, '/tickets/');

                    }).error(function(err) {
                        console.log(err.error);
                        helpers.showFlash('Error: ' + err.error.message, true);
                    });
            };

            $scope.deleteTickets = function() {
                var $ids = getChecked();
                _.each($ids, function(id) {
                    $http.delete(
                        '/api/v1/tickets/' + id
                    ).success(function() {
                            clearChecked();
                            removeCheckedFromGrid();
                            helpers.showFlash('Ticket Deleted Successfully.')
                        }).error(function(err) {
                           helpers.showFlash('Error: ' + err, true);
                        });
                });

                //hide Dropdown
                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.closeTickets = function() {
                var $ids = getChecked();

                _.each($ids, function(id) {
                    $http.put(
                        '/api/v1/tickets/' + id,
                        {
                            "status": 3
                        }
                    ).success(function() {

                        }).error(function(d) {
                            console.log('[trudesk:tickets] - ' + d);
                            helpers.showFlash('Error: ' + d, true);
                        });
                });

                //hide Dropdown
                clearChecked();
                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.GridRefreshChanged = function() {
                $http.put(
                    '/api/v1/users/' + $scope.username + '/updatepreferences',
                    {
                        "preference": 'autoRefreshTicketGrid',
                        "value": $scope.preferences_autoRefreshTicketGrid
                    }
                ).success(function() {

                    }).error(function(e) {
                        console.log('[trudesk:tickets:GridRefreshChanged] - ' + e);
                        helpers.showFlash('Error: ' + e.message, true);
                    });
            };

            $scope.RefreshTicketGrid = function(event) {
                var path = $window.location.pathname;
                History.pushState(null, null, path + '?r=' + Math.random());
                event.preventDefault();
            };

            function clearChecked() {
                $('#ticketTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    self.prop('checked', false);
                });
            }

            function getChecked() {
                var checkedIds = [];
                $('#ticketTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $ticketTR = self.parents('tr');
                    if (!_.isUndefined($ticketTR)) {
                        var ticketOid = $ticketTR.attr('data-ticketOid');

                        if (!_.isUndefined(ticketOid) && ticketOid.length > 0) {
                            checkedIds.push(ticketOid);
                        }
                    }
                });

                return checkedIds;
            }

            function removeCheckedFromGrid() {
                $('#ticketTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $ticketTR = self.parents('tr');
                    if (!_.isUndefined($ticketTR)) {
                        $ticketTR.remove();
                    }
                });
            }

        });
});