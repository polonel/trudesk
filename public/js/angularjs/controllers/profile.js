define(['angular', 'underscore', 'jquery', 'history'], function(angular, _, $) {
    return angular.module('trudesk.controllers.profile', [])
        .controller('profileCtrl', function($scope, $http) {

            $scope.updateUser = function() {
                var id = $('div[data-user_id]').attr('data-user_id');
                if (_.isUndefined(id)) return;
                var data = getFormData();

                $http.put(
                    '/api/users/' + id,
                    {
                        _id: id,
                        fullname: data.fullname,
                        password: data.password,
                        cPassword: data.cPassword,
                        email: data.email
                    }
                ).success(function(d) {
                        resetForm(d);
                    }).error(function(e) {
                        console.log('Error: ' + e);
                    });
            };

            $scope.back = function($event) {
                History.go(-1);
                $event.preventDefault();
            };

            function getFormData() {
                var data = {};
                data.fullname = $('#aFullname').val();
                data.password = $('#aPass').val();
                data.cPassword = $('#aPassConfirm').val();
                data.email = $('#aEmail').val();

                return data;
            }

            function resetForm(data) {
                $('#aFullname').val(data.fullname);
                $('#aPass').val('');
                $('#aPassConfirm').val('');
                $('#aEmail').val(data.email);
            }
        });
});