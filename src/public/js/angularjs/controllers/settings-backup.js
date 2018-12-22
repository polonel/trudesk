/**
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    12/19/2018
 Author:     Chris Brame

 **/

define([
    'angular',
    'underscore',
    'jquery',
    'modules/helpers',
    'uikit'
], function (angular, _, $, helpers, UIkit) {
    return angular.module('trudesk.controllers.settings.backup', ['ngSanitize'])
        .controller('BackupCtrl', function($scope, $http, $timeout, $log) {
            $scope.init = function() {
                $timeout(function() {

                    $scope.getBackups();
                }, 0);
            };

            $scope.backupFiles = [];

            $scope.getBackups = function() {
                $http.get('/debug/getbackups')
                    .then(function success(res) {
                        if (res.data && res.data.success === true)
                            $scope.backupFiles = res.data.files;
                    }, function error(err) {
                        console.log(err);
                    });
            };

            $scope.startbackup = function(e) {
                var $button = $(e.currentTarget);
                // $button.prop('disabled', true).addClass('disabled').text('Please Wait...');
                $button.hide().parent().find('.uk-progress').removeClass('hide');
                $http.get('/debug/backup')
                    .then(function success(res) {
                        $log.log(res);
                        $button.parent().find('.uk-progress').addClass('hide');
                        $button.show();
                        $scope.getBackups();
                    }, function error(err) {
                        $log.error(err);
                    });
            };

            $scope.deleteBackup = function(idx) {
                var file = $scope.backupFiles[idx];
                if (!file)
                    return false;
                var filename = file.filename;

                $http.delete('/debug/backup/' + filename)
                    .then(function success(res) {
                        $log.log(res);
                        if (res.data && res.data.success)
                            $scope.getBackups();
                        else
                            helpers.UI.showSnackbar('Unable to delete backup', true);
                    }, function error(err) {
                        $log.error(err);
                    });
            };

            $scope.restoreFile = function(idx) {
                var file = $scope.backupFiles[idx];
                if (!file)
                    return false;

                var filename = file.filename;

                $http.get('/debug/restore/' + filename)
                    .then(function success(res) {
                        $log.log(res);
                    }, function error(err) {
                        $log.error(err);
                    });
            };

        });
});