define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'history'], function(angular, _, $, helpers, socket) {
    return angular.module('trudesk.controllers.tickets', [])
        .controller('ticketsCtrl', function($scope, $http, $window) {

            $scope.submitTicketForm = function() {
                $http({
                    method: 'POST',
                    url: '/tickets/create',
                    data: $('#createTicketForm').serialize(),
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded'}
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
                    });
            };

            $scope.deleteTickets = function() {
                var $ids = getChecked();
                _.each($ids, function(id) {
                    $http.delete(
                        '/api/tickets/' + id
                    ).success(function() {
                            removeCheckedFromGrid();
                            helpers.showFlash('Ticket Deleted Successfully.')
                        }).error(function(err) {
                            console.log(err);
                           helpers.showFlash('Error: ' + err, true);
                        });
                });

                //hide Dropdown
                clearChecked();
                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            $scope.closeTickets = function() {
                var $ids = getChecked();

                _.each($ids, function(id) {
                    $http.put(
                        '/api/tickets/' + id,
                        {
                            "status": 3
                        }
                    ).success(function() {
                            console.log('updated! ' + id);
                        }).error(function(d) {
                            console.log(d);
                        });
                });

                //hide Dropdown
                clearChecked();
                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
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