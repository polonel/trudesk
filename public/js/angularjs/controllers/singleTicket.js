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