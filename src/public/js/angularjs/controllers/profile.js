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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'history'], function(angular, _, $, helpers) {
    return angular.module('trudesk.controllers.profile', [])
        .controller('profileCtrl', function($scope, $http) {

            $scope.updateUser = function() {
                var id = $('div[data-user_id]').attr('data-user_id');
                if (_.isUndefined(id)) return;
                var data = getFormData();

                $http.put(
                    '/api/v1/users/' + id,
                    {
                        _id: id,
                        fullname: data.fullname,
                        password: data.password,
                        cPassword: data.cPassword,
                        email: data.email
                    }
                ).success(function(d) {
                        resetForm();
                        helpers.showFlash('Profile Successfully Saved!');
                    }).error(function(e) {
                        helpers.showFlash('Error: ' + e, true);
                    });
            };

            $scope.back = function($event) {
                History.go(-1);
                $event.preventDefault();
            };

            $scope.generateApiKey = function($event) {
                $event.preventDefault();

                var id = $('div[data-user_id]').attr('data-user_id');
                if (_.isUndefined(id)) return;

                $http.post(
                    '/api/v1/users/' + id + '/generateapikey'
                ).success(function(tokenJson) {
                        $('#aApiKey').val(tokenJson.token);
                        $('.removeApiButton').removeClass('hide');
                        $('.generateApiButton').addClass('hide');
                        helpers.showFlash('API Key Successfully Generated');
                    }).error(function(e) {
                        helpers.showFlash('Error: ' + e, true);
                    });

            };

            $scope.removeApiKey = function($event) {
                $event.preventDefault();

                var id = $('div[data-user_id]').attr('data-user_id');
                if (_.isUndefined(id)) return;

                $http.post(
                    '/api/v1/users/' + id + '/removeapikey'
                ).success(function(d) {
                        $('#aApiKey').val('');
                        $('.generateApiButton').removeClass('hide');
                        $('.removeApiButton').addClass('hide');
                        helpers.showFlash('API Key Successfully Revoked');
                    }).error(function(e) {
                        helpers.showFlash('Error: ' + e, true);
                    });
            };

            function getFormData() {
                var data = {};
                data.fullname = $('#aFullname').val();
                data.password = $('#aPass').val();
                data.cPassword = $('#aPassConfirm').val();
                data.email = $('#aEmail').val();

                return data;
            }

            function resetForm() {
                //$('#aFullname').val(data.fullname);
                $('#aPass').val('');
                $('#aPassConfirm').val('');
                //$('#aEmail').val(data.email);
            }
        });
});