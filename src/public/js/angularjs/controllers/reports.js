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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'history'], function(angular, _, $, helpers) {
    return angular.module('trudesk.controllers.reports', [])
        .controller('reportsCtrl', function($scope, $http) {

            $scope.editGroup = function($event) {
                if (_.isNull($event.target) || _.isUndefined($event.target) ||
                    $event.target.tagName.toLowerCase() === 'label' ||
                    $event.target.tagName.toLowerCase() === 'input')
                    return true;

                //currentTarget = ng-click() bound to. "<tr>"
                var id = $event.currentTarget.dataset.groupoid;
                if (!id) return true;

                History.pushState(null, null, '/groups/' + id);
            };

            $scope.submitCreateGroupForm = function() {
                var formData = $('#createGroupForm').serializeObject();
                var apiData = {
                    name: formData.gName,
                    members: formData.gMembers,
                    sendMailTo: formData.gSendMailTo
                };

                $http({
                    method: 'POST',
                    url: '/api/v1/groups/create',
                    data: apiData,
                    headers: { 'Content-Type': 'application/json'}
                })
                    .success(function() {
                        //helpers.showFlash('Group Created Successfully.');

                        helpers.UI.showSnackbar({
                            text: 'Group Created Successfully'
                        });

                        History.pushState(null, null, '/groups/');
                    })
                    .error(function(err) {
                        console.log('[trudesk:groups:submitCreateGroupForm] - ' + err);
                        //helpers.showFlash(err, true);
                        helpers.UI.showSnackbar({
                            text: err,
                            actionTextColor: '#B92929'
                        });
                    });
            };

            $scope.submitSaveGroup = function() {
                var formData = $('#editGroupForm').serializeObject();
                var apiData = {
                    id: formData.groupID,
                    name: formData.gName,
                    members: formData.gMembers,
                    sendMailTo: formData.gSendMailTo
                };

                $http({
                    method: 'PUT',
                    url: '/api/v1/groups/' + apiData.id,
                    data: apiData,
                    headers: {'Content-Type': 'application/json' }
                })
                    .success(function() {
                        //helpers.showFlash('Group Saved Successfully');
                        helpers.UI.showSnackbar({
                            text: 'Group Saved Successfully'
                        });

                        History.pushState(null, null, '/groups/');
                    })
                    .error(function(err) {
                        console.log('[trudesk:groups:submitSaveGroup] - ' + err);
                        //helpers.showFlash(err, true);
                        helpers.UI.showSnackbar({text: err, actionTextColor: '#B92929'});
                    });
            };

            $scope.deleteGroups = function() {
                var ids = getChecked();
                _.each(ids, function(id) {
                     $http.delete(
                         '/api/v1/groups/' + id
                     ).success(function(data) {
                        if (!data.success) {
                            //helpers.showFlash(data.error, true);
                            helpers.UI.showSnackbar({text: data.error, actionTextColor: '#B92929'});
                            return;
                        }
                            removeCheckedFromGrid(id);
                            //helpers.showFlash('Group Successfully Deleted');
                            helpers.UI.showSnackbar({text: 'Group Successfully Deleted'});
                        }).error(function(err) {
                            console.log('[trudesk:groups:deleteGroups] - ' + err);
                            //helpers.showFlash(err, true);
                            helpers.UI.showSnackbar({text: err, actionTextColor: '#B92929'});
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