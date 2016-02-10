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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'uikit', 'history'], function(angular, _, $, helpers, UIkit) {
    return angular.module('trudesk.controllers.accounts', [])
        .controller('accountsCtrl', function($scope, $http, $timeout) {

            $scope.createAccount = function() {
                var data = {};
                var form = $('#createAccountForm');
                form.serializeArray().map(function(x){data[x.name] = x.value;});
                data.aGrps = form.find('#aGrps').val();
                data.socketId = socketId;
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
                        console.log('[trudesk:accounts:createAccount] - ' + err.error.message);
                        helpers.UI.showSnackbar('Error: ' + err.error.message, true);
                });
            };

            $scope.editAccount = function($event) {
                if (_.isNull($event.target) || _.isUndefined($event.target) ||
                    $event.target.tagName.toLowerCase() === 'label' ||
                    $event.target.tagName.toLowerCase() === 'input')
                    return true;

                //currentTarget = ng-click() bound to. "<tr>"
                var username = $event.currentTarget.dataset.username;
                if (!username) return true;

                History.pushState(null, null, '/accounts/' + username);
            };

            $scope.deleteAccount = function($event) {
                $event.preventDefault();
                var self = $($event.target);
                var username = self.attr('data-username');
                if (_.isUndefined(username))
                    return true;

                $http.delete(
                    '/api/v1/users/' + username
                ).success(function(data) {
                    if (!data.success) {
                        helpers.UI.showSnackbar(data.error, true);
                        return;
                    }

                    self.parents('[data-uk-filter]').remove();
                    UIkit.$html.trigger('changed.uk.dom');
                    helpers.UI.showSnackbar('Account ' + username + ' Successfully Deleted', false);
                }).error(function(err) {
                    console.log('[trudesk:accounts:deleteAccount] - Error: ' + err.error);
                    helpers.UI.showSnackbar(err.error, true);
                });
            };

            $scope.accountEditPic = function() {
                $timeout(function() {
                    $('#profileImageInput').trigger('click');
                }, 0);
            };
        });
});