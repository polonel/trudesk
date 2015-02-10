define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'history'], function(angular, _, $, helpers, socket) {
    return angular.module('trudesk.controllers.tickets', [])
        .controller('ticketsCtrl', function($scope, $http, $window) {

            $scope.deleteTickets = function() {
                var $ids = getChecked();
                _.each($ids, function(id) {
                    $http.delete(
                        '/api/tickets/' + id
                    ).success(function() {
                            removeCheckedFromGrid();
                        }).error(function(err) {
                           console.log(err);
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