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
    'modules/socket',
    'uikit'
], function (angular, _, $, helpers, socket, UIkit) {
    return angular.module('trudesk.controllers.settings.backup', ['ngSanitize'])
        .controller('BackupCtrl', function($scope, $http, $timeout, $log) {

            function initBackupUpload() {
                var progressbar = $('#backupUploadProgress'),
                    $backupUploadSelect = $('#backup-upload-select'),
                    $uploadButton = $backupUploadSelect.parent(),
                    bar = progressbar.find('.uk-progress-bar'),
                    settings = {
                        action: '/api/v1/backup/upload',
                        allow: '*.zip',
                        type: 'json',

                        loadstart: function() {
                            bar.css('width', '0%').text('0%');
                            progressbar.removeClass('hide');
                            $uploadButton.addClass('hide');
                        },
                        notallowed: function() {
                            helpers.UI.showSnackbar('Invalid File Type. Please upload a Zip file.', true);
                        },
                        error: function(err) {
                            $log.error(err);
                            helpers.UI.showSnackbar('An unknown error occurred. Check Console', true);
                        },
                        progress: function(percent) {
                            percent = Math.ceil(percent);
                            bar.css('width', percent + '%').text(percent + '%');
                        },

                        allcomplete: function(response) {
                            $log.log(response);
                            if (!response.success)
                                helpers.UI.showSnackbar(response.error, true);

                            bar.css('width', '100%').text('100%');

                            $timeout(function() {
                                progressbar.addClass('hide');
                                $uploadButton.removeClass('hide');
                                $scope.getBackups();
                                $backupUploadSelect.val(null);
                            }, 1500);
                        }
                    };

                UIkit.uploadSelect($backupUploadSelect, settings);
            }

            $scope.init = function() {
                $timeout(function() {
                    initBackupUpload();

                    $scope.checkTools();
                    $scope.getBackups();
                }, 0);
            };

            $scope.backupFiles = [];

            $scope.loadingTools = true;
            $scope.checkTools = function() {
                $http.get('/api/v1/backup/hastools')
                    .then(function success(res) {
                        $scope.hasTools = (res.data && res.data.success);
                    }, function error(err) {
                        $scope.hasTools = false;
                    }).then(function() {
                        $scope.loadingTools = false;
                        $scope.showNoTools = (!$scope.loading && !$scope.hasTools);
                });
            };

            $scope.getBackups = function() {
                $http.get('/api/v1/backups')
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
                $http.post('/api/v1/backup')
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

                UIkit.modal.confirm('<h2 class="text-light">Are you sure?</h2><p style="font-size: 14px;">This action is permanent and will destroy the backup file: <strong>' + filename + '</p>', function() {
                    $http.delete('/api/v1/backup/' + filename)
                        .then(function success(res) {
                            $log.log(res);
                            if (res.data && res.data.success) {
                                $scope.getBackups();
                                helpers.UI.showSnackbar('Backup successfully deleted', false);
                            } else
                                helpers.UI.showSnackbar('Unable to delete backup', true);
                        }, function error(err) {
                            $log.error(err);
                        });
                }, {
                    labels: {'Ok': 'Yes', 'Cancel': 'No'}, confirmButtonClass: 'md-btn-danger'
                });
            };

            $scope.restoreFile = function(idx) {
                var file = $scope.backupFiles[idx];
                if (!file)
                    return false;

                var filename = file.filename;

                UIkit.modal.confirm(
                    '<h2>Are you sure?</h2>' +
                    '<p style="font-size: 15px;"><span class="uk-text-danger" style="font-size: 15px;">This is a permanent action.</span> All data will be wiped from the database and restored with the selected backup file: <strong>' + filename + '</strong></p>' +
                    '<p style="font-size: 12px;">Any users currently logged in will be presented with a blocking restore page. Preventing any further actions.' +
                    'Once complete all users are required to log in again.</p><br /><p style="font-size: 12px; font-style: italic;">This process may take a while depending on the size of the backup.</p>',
                    function() {
                        socket.ui.emitShowRestoreOverlay();

                        $http.post('/api/v1/backup/restore', {
                            file: filename
                        }).then(function success(res) {
                            $log.log(res);
                            helpers.UI.showSnackbar('Restore Complete. Logging all users out...', false);
                            $timeout(function() {
                                socket.ui.emitRestoreComplete();
                            }, 2000);
                        }, function error(err) {
                            $log.error(err);
                            helpers.UI.showSnackbar('An Error Occurred. Check Console.', true);
                        });
                }, {
                    labels: {'Ok': 'Yes', 'Cancel': 'No'}, confirmButtonClass: 'md-btn-danger'
                });
            };

        });
});