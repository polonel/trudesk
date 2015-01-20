define(['angular', 'underscore', 'jquery', 'modules/socket', 'history'], function(angular, _, $, socket) {
    return angular.module('trudesk.controllers.singleTicket', [])
        .controller('singleTicket', function($scope, $http, $q) {

            $scope.showStatusSelect = function() {
                var statusSelect = $('#statusSelect');
                if (statusSelect.length > 0) {
                    if (statusSelect.hasClass('hide')) {
                        statusSelect.removeClass('hide');
                    } else {
                        statusSelect.addClass('hide');
                    }
                }
            };

            $scope.changeStatus = function(status) {
                var id = $('#__ticketId').html();
                var statusSelectBox = $('#statusSelect');
                if (statusSelectBox.length > 0) statusSelectBox.addClass('hide');

                socket.ui.sendUpdateTicketStatus(id, status);
            };

            $scope.clearAssignee = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.clearAssignee(id);
                }
            };

            $scope.types = [];
            $scope.priorities = [
                {name: 'Normal', value: 1},
                {name: 'Urgent', value: 2},
                {name: 'Critical', value: 3}
            ];
            $scope.groups = [];

            $scope.selected_priority = _.findWhere($scope.priorities, {value: $scope.ticketPriority});
            var ticketTypes = $http.get('/api/tickets/types').
                                success(function(data) {
                                    _.each(data, function(item) {
                                        $scope.types.push(item);
                                    });
                                }).
                                error(function(data) {
                                });

            $q.all([ticketTypes]).then(function(ret) {
                $scope.selected_type = _.findWhere($scope.types, {_id: $scope.ticketType});
            });

            var groupHttpGet = $http.get('/api/groups').
                                success(function(data) {
                                    _.each(data, function(item) {
                                        $scope.groups.push(item);
                                    });
                                }).
                                error(function(data) {

                                });

            $q.all([groupHttpGet]).then(function(ret) {
                $scope.selected_group = _.findWhere($scope.groups, {_id: $scope.ticketGroup});
            });

            $scope.updateTicketType = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.setTicketType(id, $scope.selected_type);
                }
            };

            $scope.updateTicketPriority = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.setTicketPriority(id, $scope.selected_priority);
                }
            };

            $scope.updateTicketGroup = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.setTicketGroup(id, $scope.selected_group);
                }
            };
        })
        .directive('closeMouseUp', ['$document', function($document) {
            return {
                restrict: 'A',
                link: function(scope, element, attr) {
                    $document.off('mouseup', mouseup);
                    $document.on('mouseup', mouseup);

                    function mouseup($event) {
                        var target = $event.target.offsetParent;
                        if ($(target).length > 0 && $(target).hasClass('floating-ticket-status')) return false;

                        if (!element.hasClass('hide')) {
                            element.addClass('hide');
                        }
                    }
                }
            }
        }]);
});