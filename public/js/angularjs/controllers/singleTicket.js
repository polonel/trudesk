define(['angular', 'underscore', 'jquery', 'modules/socket', 'history'], function(angular, _, $, socket) {
    return angular.module('trudesk.controllers.singleTicket', [])
        .controller('singleTicket', function($scope, $http) {

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