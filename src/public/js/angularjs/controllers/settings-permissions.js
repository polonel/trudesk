/**
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    11/15/2018
 Author:     Chris Brame

 **/

define([
    'angular',
    'underscore',
    'jquery',
    'modules/helpers',
    'uikit'
], function (angular, _, $, helpers, UIkit) {
    return angular.module('trudesk.controllers.settings.permissions', ['ngSanitize'])
        .controller('PermissionsCtrl', function($scope, $http, $timeout, $log) {
            $scope.init = function() {
                $timeout(function() {
                    // Permissions Sortable
                    var permissionList = $('#permissionList');
                    if (permissionList.length > 0) {
                        var permissionSort = UIkit.sortable(permissionList, {
                            handleClass: 'drag-handle'
                        });

                        permissionSort.on('change.uk.sortable', function() {
                            var items = permissionList.children('li');
                            var arr = [];
                            for (var k = 0; k < items.length; k++)
                                arr.push($(items[k]).attr('data-key'));

                            $http.put('/api/v1/settings/updateroleorder', {
                                roleOrder: arr
                            },{
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }).then(function successCallback() {
                            }, function errorCallback(response) {
                                $log.error(response);
                                helpers.UI.showSnackbar('Error: ' + response.data.error, true);
                            });

                        });
                    }

                    $('input[name="perm-tickets-all"]').change(function(e) {
                        toggleAllPerm('tickets', e);
                    });

                    $('input[name="perm-accounts-all"]').change(function(e) {
                        toggleAllPerm('accounts', e);
                    });

                    // $('input[name="perm-tickets-view-any"]').change(function(e) {
                    //     handleAnyChange('tickets-view', e);
                    // });
                    //
                    // $('input[name="perm-tickets-edit-any"]').change(function(e) {
                    //     handleAnyChange('tickets-edit', e);
                    // });
                    //
                    // $('input[name="perm-tickets-delete-any"]').change(function(e) {
                    //     handleAnyChange('tickets-delete', e);
                    // });

                }, 0);
            };

            function toggleAllPerm(type, e) {
                var $currentTarget = $(e.currentTarget);
                var checked = e.target.checked;
                var $form = $currentTarget.parents('form');

                $form.find('input[name="perm-' + type + '-create"]').prop('checked', checked).prop('disabled', checked);
                $form.find('input[name="perm-' + type + '-view"]').prop('checked', checked).prop('disabled', checked);
                $form.find('input[name="perm-' + type + '-edit"]').prop('checked', checked).prop('disabled', checked);
                $form.find('input[name="perm-' + type + '-delete"]').prop('checked', checked).prop('disabled', checked);
            }

            function handleAnyChange(type, e) {
                var checked = e.target.checked;
                var $form = $(e.target).parents('form');
                var $type = $form.find('input[name="perm-' + type + '"]');

                $type.prop('disabled', checked);
                if (checked) $type.prop('checked', false);
            }

            function sanitizePermissions(data) {
                var obj = {};
                var tObj = {};
                _.each(data, function(v, k) {
                    k = k.replace('perm', '').replace(/-/g, '');
                    tObj[k] = v;
                });

                tObj = _.mapObject(tObj, function(v) {
                    return v === 'on';
                });

                obj.admin = tObj.isadmin ? ['*'] : null;
                obj.setting = tObj.isadmin ? ['*'] : null;

                if (tObj.isagent)
                    obj.agent = ['*'];

                if (tObj.ticketsall)
                    obj.ticket = ['*'];
                else {
                    var arr = [];
                    if (tObj.ticketscreate)
                        arr.push('create');
                    if (tObj.ticketsview)
                        arr.push('view');
                    if (tObj.ticketsedit)
                        arr.push('edit');
                    if (tObj.ticketsdelete)
                        arr.push('delete');
                    if (arr.length > 0)
                        obj.ticket = arr;
                }

                if (tObj.accountsall) {
                    obj.account = ['*'];
                } else {
                    var arr = [];
                    if (tObj.accountscreate) arr.push('create');
                    if (tObj.accountsview) arr.push('view');
                    if (tObj.accountsedit) arr.push('edit');
                    if (tObj.accountsdelete) arr.push('delete');

                    if (arr.length > 0)
                        obj.account = arr;
                }

                return obj;
            }

            $scope.saveRolePermissions = function(roleId, $event) {
                $event.preventDefault();
                var $form = $($event.currentTarget);
                if ($form.length < 1) {
                    helpers.showSnackbar('Invalid Form. Check Console.', true);
                    $log.log($form);
                    return false;
                }

                var data = $form.serializeObject();
                var hierarchy = data['perm-enable-hierarchy'] === 'on';
                data = sanitizePermissions(data);
                data._id = roleId;
                data.hierarchy = hierarchy;
                console.log(data);

                $http.put('/api/v1/roles', data)
                    .success(function() {
                        helpers.UI.showSnackbar('Role Permissions Saved', false);
                    })
                    .error(function(err) {
                        $log.error(err);
                    });
            };

        });
});