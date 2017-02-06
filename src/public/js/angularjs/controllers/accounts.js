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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'uikit', 'history', 'selectize', 'formvalidator'], function(angular, _, $, helpers, UIkit) {
    return angular.module('trudesk.controllers.accounts', [])
        .controller('accountsCtrl', function($scope, $http, $timeout, $log) {

            $scope.createAccount = function(event) {
                var data = {};
                var form = $('#createAccountForm');
                if (!form.isValid(null, null, false)) return true;
                event.preventDefault();
                form.serializeArray().map(function(x){data[x.name] = x.value;});
                data.aGrps = form.find('#aGrps').val();
                $http({
                    method: 'POST',
                    url: '/api/v1/users/create',
                    data: data,
                    headers: { 'Content-Type': 'application/json'}
                })
                    .success(function(data) {
                        if (!data.success) {
                            if (data.error) {
                                helpers.UI.showSnackbar('Error: ' + data.error, true);
                                return;
                            }

                            helpers.UI.showSnackbar('Error Submitting Ticket', true);
                        }

                        //helpers.showFlash('Ticket Created Successfully.');
                        helpers.UI.showSnackbar({text:   'Account Created'});

                        UIkit.modal("#accountCreateModal").hide();

                        //History.pushState(null, null, '/tickets/');

                    }).error(function(err) {
                        $log.log('[trudesk:accounts:createAccount] - ' + err.error.message);
                        helpers.UI.showSnackbar('Error: ' + err.error.message, true);
                });
            };

            var running = false;
            $scope.deleteAccount = function($event) {
                if (running)
                    return true;

                $event.preventDefault();
                var self = $($event.target);
                var username = self.attr('data-username');
                if (_.isUndefined(username))
                    return true;

                running = true;
                $http.delete(
                    '/api/v1/users/' + username
                ).success(function(data) {
                    if (!data.success) {
                        helpers.UI.showSnackbar(data.error, true);
                        running = false;
                        return true;
                    }

                    if (data.disabled) {
                        self.parents('.tru-card-head').addClass('tru-card-head-deleted');
                        self.addClass('hide');
                        self.parents('.uk-nav').find('.enable-account-action').removeClass('hide');

                        helpers.UI.showSnackbar('Account ' + username + ' Successfully Disabled', false);
                    } else {
                        self.parents('.tru-card[data-card-username]').parent().remove();
                        UIkit.$html.trigger('changed.uk.dom');

                        helpers.UI.showSnackbar('Account ' + username + ' Successfully Deleted', false);
                    }

                    running = false;
                }).error(function(err) {
                    $log.log('[trudesk:accounts:deleteAccount] - Error: ' + err.error);
                    helpers.UI.showSnackbar(err.error, true);

                    running = false;
                });
            };

            $scope.enableAccount = function($event) {
                $event.preventDefault();
                var self = $($event.target);
                var username = self.attr('data-username');
                if (_.isUndefined(username))
                    return true;

                $http.get(
                    '/api/v1/users/' + username + '/enable'
                ).success(function(data) {
                    if (!data.success) {
                        helpers.UI.showSnackbar(data.error, true);
                        return;
                    }

                    self.parents('.tru-card-head').removeClass('tru-card-head-deleted');
                    self.addClass('hide');
                    self.parents('.uk-nav').find('.delete-account-action').removeClass('hide');

                    helpers.UI.showSnackbar('Account successfully enabled', false);
                }).error(function(err) {
                    $log.log('[trudesk:accounts:enableAccount] - Error: ' + err.error);
                    helpers.UI.showSnackbar(err.error, true);
                });
            };

            $scope.editAccount = function($event) {
                $event.preventDefault();

                var self = $($event.target);
                var username = self.attr('data-username');
                if (_.isUndefined(username)) return true;

                $http.get(
                    '/api/v1/users/' + username
                ).success(function(data) {
                    var editAccountModal = $('#editAccountModal');
                    var form = editAccountModal.find('form#editAccountForm');
                    var user = data.user;
                    if (_.isUndefined(user) || _.isNull(user)) return true;

                    form.find('#aId').val(user._id);
                    form.find('#aUsername').val(user.username).prop('disabled', true).parent().addClass('md-input-filled');
                    form.find('#aFullname').val(user.fullname).parent().addClass('md-input-filled');
                    form.find('#aTitle').val(user.title).parent().addClass('md-input-filled');
                    form.find('#aEmail').val(user.email).parent().addClass('md-input-filled');
                    form.find('#aRole option[value="' + user.role + '"]').prop('selected', true);
                    var $selectizeRole = form.find('#aRole')[0].selectize;
                    $selectizeRole.setValue(user.role, true);
                    $selectizeRole.refreshItems();

                    var $selectizeGrps = form.find('#aGrps')[0].selectize;
                    var groups = data.groups;

                    _.each(groups, function(i) {
                        $selectizeGrps.addItem(i, true);
                    });

                    $selectizeGrps.refreshItems();
                    var modal = UIkit.modal('#editAccountModal');
                    if (!modal.isActive()) modal.show();

                }).error(function(err) {
                    $log.log('[trudesk:Accounts:editAccount] - Error: ' + err.error);
                    helpers.UI.showSnackbar(err.error, true);
                });
            };

            $scope.saveAccount = function() {
                var form = $('#editAccountForm');
                var data = form.serializeObject();
                data.aUsername = form.find('#aUsername').val();
                data.aGrps = form.find('#aGrps').val();
                data.saveGroups = true;

                $http({
                    method: 'PUT',
                    url: '/api/v1/users/' + data.aUsername,
                    data: data,
                    headers: { 'Content-Type': 'application/json'}
                })
                    .success(function(data) {
                        if (!data.success) {
                            if (data.error) {
                                helpers.UI.showSnackbar('Error: ' + data.error, true);
                                return;
                            }

                            helpers.UI.showSnackbar('Error Saving Account', true);
                        }

                        helpers.UI.showSnackbar('Account Saved', false);

                        UIkit.modal("#editAccountModal").hide();


                    }).error(function(err) {
                    $log.log('[trudesk:accounts:saveAccount] - ' + err.error.message);
                    helpers.UI.showSnackbar('Error: ' + err.error.message, true);
                });
            };

            $scope.accountEditPic = function() {
                $timeout(function() {
                    $('#profileImageInput').trigger('click');
                }, 0);
            };
        });
});