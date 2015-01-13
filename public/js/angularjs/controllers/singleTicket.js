define(['angular', 'underscore', 'jquery', 'socketio', 'history'], function(angular, _, $, io) {
    return angular.module('trudesk.controllers.singleTicket', [])
        .controller('singleTicket', function($scope, $http) {
            var socket = io.connect();

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

                socket.emit('updateTicketStatus', {ticketId: id, status: status});
            };

        })
        .directive('closeMouseUp', ['$document', function($document) {
            return {
                restrict: 'A',
                link: function(scope, element, attr) {
                    $document.off('mouseup', mouseup);
                    $document.on('mouseup', mouseup);

                    function mouseup() {
                        if (!element.hasClass('hide')) {
                            element.addClass('hide');
                        }
                    }
                }
            }
        }]);
});