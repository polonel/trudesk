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

                    var $ticketsAllCheck = $('input[name="perm-tickets-all"]');

                    $ticketsAllCheck.change(function(e) {
                        toggleAllPerm('tickets', e);
                    });

                    if ($ticketsAllCheck.is(':checked'))
                        toggleAll($ticketsAllCheck.parents('form'), 'tickets', true);

                    var $accountPermAllCheck = $('input[name="perm-accounts-all"]');
                    $accountPermAllCheck.change(function(e) {
                        toggleAllPerm('accounts', e, ['import']);
                    });

                    if ($accountPermAllCheck.is(':checked'))
                        toggleAll($accountPermAllCheck.parents('form'), 'accounts', true, ['import']);

                    $('input[name="perm-accounts-import"]').change(function(e) {
                        var checked = $(e.currentTarget).prop('checked');
                        if (checked)
                            $('input[name="perm-accounts-create"]').prop('checked', checked);
                    });

                }, 0);
            };

            function toggleAllPerm(type, e, specials) {
                var $currentTarget = $(e.currentTarget);
                var checked = e.target.checked;
                var $form = $currentTarget.parents('form');

                toggleAll($form, type, checked, specials);
            }

            function toggleAll($form, type, checked, specials) {
                $form.find('input[name="perm-' + type + '-create"]').prop('checked', checked).prop('disabled', checked);
                $form.find('input[name="perm-' + type + '-view"]').prop('checked', checked).prop('disabled', checked);
                $form.find('input[name="perm-' + type + '-edit"]').prop('checked', checked).prop('disabled', checked);
                $form.find('input[name="perm-' + type + '-delete"]').prop('checked', checked).prop('disabled', checked);

                if (specials && specials.length > 0) {
                    for (var i = 0; i < specials.length; i++) 
                        $form.find('input[name="perm-' + type + '-' + specials[i] + '"]').prop('checked', checked).prop('disabled', checked);
                }
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
                var arr = [];
                _.each(data, function(v, k) {
                    k = k.replace('perm', '').replace(/-/g, '');
                    tObj[k] = v;
                });

                tObj = _.mapObject(tObj, function(v) {
                    return v === 'on';
                });

                // Admin
                obj.admin = tObj.isadmin ? ['*'] : null;
                obj.setting = tObj.isadmin ? ['*'] : null;

                // Agent
                if (tObj.isagent)
                    obj.agent = ['*'];

                // Tickets
                if (tObj.ticketsall)
                    obj.ticket = ['*'];
                else {
                    if (tObj.ticketscreate) arr.push('create');
                    if (tObj.ticketsview) arr.push('view');
                    if (tObj.ticketsedit) arr.push('edit');
                    if (tObj.ticketsdelete) arr.push('delete');

                    if (arr.length > 0)
                        obj.ticket = arr;
                }

                // Accounts
                if (tObj.accountsall) 
                    obj.account = ['*'];
                 else {
                    if (tObj.accountscreate) arr.push('create');
                    if (tObj.accountsview) arr.push('view');
                    if (tObj.accountsedit) arr.push('edit');
                    if (tObj.accountsdelete) arr.push('delete');

                    //specials
                    if (tObj.accountsimport) arr.push('import');

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