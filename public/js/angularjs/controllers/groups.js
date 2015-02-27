define(['angular', 'underscore', 'jquery', 'modules/helpers', 'history'], function(angular, _, $, helpers) {
    return angular.module('trudesk.controllers.groups', [])
        .controller('groupsCtrl', function($scope, $http) {

            $scope.editGroup = function($event) {
                if (_.isNull($event.target) || _.isUndefined($event.target) ||
                    $event.target.tagName.toLowerCase() === 'label' ||
                    $event.target.tagName.toLowerCase() === 'input')
                    return true;

                //currentTarget = ng-click() bound to. "<tr>"
                console.log($event.currentTarget.dataset);
                var id = $event.currentTarget.dataset.groupoid;
                if (!id) return true;

                History.pushState(null, null, '/groups/' + id);
            };

            $scope.submitCreateGroupForm = function() {
                var formData = $('#createGroupForm').serializeObject();
                var apiData = {
                    name: formData.gName,
                    members: formData.gMembers
                };

                $http({
                    method: 'POST',
                    url: '/api/groups/create',
                    data: apiData,
                    headers: { 'Content-Type': 'application/json'}
                })
                    .success(function() {
                        helpers.showFlash('Group Created Successfully.');

                        History.pushState(null, null, '/groups/');
                    })
                    .error(function(err) {
                        helpers.showFlash(err, true);
                    });
            };

            $scope.deleteGroups = function() {
                var ids = getChecked();
                _.each(ids, function(id) {
                     $http.delete(
                         '/api/groups/' + id
                     ).success(function(data) {
                        if (!data.success) {
                            helpers.showFlash(data.error, true);
                            return;
                        }
                            removeCheckedFromGrid(id);
                            helpers.showFlash('Group Successfully Deleted');
                        }).error(function(err) {
                            helpers.showFlash(err, true);
                         });
                });

                helpers.hideAllpDropDowns();
                helpers.hideDropDownScrolls();
            };

            function clearChecked() {
                $('#groupsTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    self.prop('checked', false);
                });
            }

            function getChecked() {
                var checkedIds = [];
                $('#groupsTable input[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $groupTR = self.parents('tr');
                    if (!_.isUndefined($groupTR)) {
                        var groupOId = $groupTR.attr('data-groupOId');

                        if (!_.isUndefined(groupOId) && groupOId.length > 0) {
                            checkedIds.push(groupOId);
                        }
                    }
                });

                return checkedIds;
            }

            function removeCheckedFromGrid(id) {
                $('#groupsTable #c_' + id + '[type="checkbox"]:checked').each(function() {
                    var self = $(this);
                    var $groupTR = self.parents('tr');
                    if (!_.isUndefined($groupTR)) {
                        $groupTR.remove();
                    }
                });
            }
        });
});