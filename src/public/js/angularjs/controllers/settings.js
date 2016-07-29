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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/ui', 'uikit', 'history'], function(angular, _, $, helpers, ui, UIkit) {
    return angular.module('trudesk.controllers.settings', [])
        .controller('settingsCtrl', function($scope, $http) {
            $scope.init = function() {
                //Fix Inputs if input is preloaded with a value
                setTimeout(function() {
                    $('input.md-input').each(function() {
                        var self = $(this);
                        if (!_.isEmpty(self.val())) {
                            var s = self.parent('.md-input-wrapper');
                            if (s.length > 0)
                                s.addClass('md-input-filled');
                        }
                    });
                }, 0);
            };

            $scope.$watch('mailerEnabled', function(newVal) {
                $('input#mailerHost').attr('disabled', !newVal);
                $('input#mailerSSL').attr('disabled', !newVal);
                $('input#mailerPort').attr('disabled', !newVal);
                $('input#mailerUsername').attr('disabled', !newVal);
                $('input#mailerPassword').attr('disabled', !newVal);
                $('input#mailerFrom').attr('disabled', !newVal);
                $('button#mailerSubmit').attr('disabled', !newVal);
            });

            $scope.mailerEnabledChange = function() {
                $scope.mailerEnabled = this.mailerEnabled;

                $http.put('/api/v1/settings', {
                    name: 'mailer:enable',
                    value: $scope.mailerEnabled
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(data) {

                }, function errorCallback(err) {
                    helpers.UI.showSnackbar('Error: ' + err, true);
                });
            };

            $scope.mailerSSLChange = function() {
                $scope.mailerSSL = this.mailerSSL;

                $http.put('/api/v1/settings', {
                    name: 'mailer:ssl',
                    value: $scope.mailerSSL
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(data) {

                }, function errorCallback(err) {
                    helpers.UI.showSnackbar('Error: ' + err, true);
                });
            };

            $scope.submitTestMailer = function($event) {
                $event.preventDefault();
                helpers.UI.showSnackbar('Testing...', false);
                $http.post('/api/v1/settings/testmailer', {
                    //Empty
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback() {
                    helpers.UI.showSnackbar('Successfully Connected', false);
                }, function errorCallback(response) {
                    helpers.UI.showSnackbar('Error: ' + response.data.error, true);
                });
            };

            $scope.mailerFormSubmit = function($event) {
                $event.preventDefault();
                $http.put('/api/v1/settings', [
                    {name: 'mailer:host', value: $scope.mailerHost},
                    {name: 'mailer:ssl', value: $scope.mailerSSL},
                    {name: 'mailer:port', value: $scope.mailerPort},
                    {name: 'mailer:username', value: $scope.mailerUsername},
                    {name: 'mailer:password', value: $scope.mailerPassword},
                    {name: 'mailer:from', value: $scope.mailerFrom}
                ], {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback() {
                    helpers.UI.showSnackbar('Mailer Settings Saved', false);
                }, function errorCallback(err) {
                    helpers.UI.showSnackbar(err, true);
                });
            };

            $scope.$watch('mailerCheckEnabled', function(newVal) {
                $('input#mailerCheckHost').attr('disabled', !newVal);
                $('input#mailerCheckPort').attr('disabled', !newVal);
                $('input#mailerCheckUsername').attr('disabled', !newVal);
                $('input#mailerCheckPassword').attr('disabled', !newVal);
                $('button#mailerCheckSubmit').attr('disabled', !newVal);
            });

            $scope.mailerCheckEnabledChange = function() {
                $scope.mailerCheckEnabled = this.mailerCheckEnabled;

                $http.put('/api/v1/settings', {
                    name: 'mailer:check:enable',
                    value: $scope.mailerCheckEnabled
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(data) {

                }, function errorCallback(err) {
                    helpers.UI.showSnackbar(err, true);
                });
            };

            $scope.mailerCheckFormSubmit = function($event) {
                $event.preventDefault();

                $http.put('/api/v1/settings', [
                    {name: 'mailer:check:host', value: $scope.mailerCheckHost},
                    {name: 'mailer:check:port', value: $scope.mailerCheckPort},
                    {name: 'mailer:check:username', value: $scope.mailerCheckUsername},
                    {name: 'mailer:check:password', value: $scope.mailerCheckPassword}

                ], {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback() {
                    helpers.UI.showSnackbar('Mail Check Settings Saved', false);
                }, function errorCallback(err) {
                    helpers.UI.showSnackbar(err, true);
                });
            };

            $scope.showOverdueTicketsChanged = function() {
                $scope.showOverdueTickets = this.showOverdueTickets;

                $http.put('/api/v1/settings', {
                    name: 'showOverdueTickets:enable',
                    value: $scope.showOverdueTickets
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(data) {

                }, function errorCallback(err) {
                    helpers.UI.showSnackbar(err, true);
                });
            };

            $scope.editTag = function($event) {
                if (_.isNull($event.target) || _.isUndefined($event.target) ||
                    $event.target.tagName.toLowerCase() === 'label' ||
                    $event.target.tagName.toLowerCase() === 'input')
                    return true;

                //currentTarget = ng-click() bound to. "<tr>"
                var id = $event.currentTarget.dataset.tagoid;
                if (!id) return true;

                History.pushState(null, null, '/settings/tags/' + id);
            };

            $scope.updateTag = function() {
                var $tagId = $('#__editTag_TagId');
                if ($tagId.length < 1) {
                    //Show invalid Tag Snackbar
                    helpers.UI.showSnackbar('Unable to get tag ID', true);
                    return true;
                }

                var id = $tagId.text();
                var tagName = $('#editTag_Name').val();

                $http.put('/api/v1/tickets/tags/' + id, {
                    name: tagName
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function successCallback(data) {
                    helpers.UI.showSnackbar('Tag: ' + tagName + ' updated successfully', false);

                }, function errorCallback(err) {
                    helpers.UI.showSnackbar(err, true);
                });
            };

            $scope.showDeleteConfirm = function() {
                var tagName = $('#__editTag_TagName').text();
                UIkit.modal.confirm("Really delete tag " + tagName + '<br /><i style="font-size: 13px; color: #e53935;">This will remove the tag from all associated tickets!</i>', function() {
                    return $scope.deleteTag();
                }, {
                    labels: {'Ok': 'Yes', 'Cancel': 'No'}
                });
            };

            $scope.deleteTag = function() {
                var $tagId = $('#__editTag_TagId');
                if ($tagId.length < 1) {
                    helpers.UI.showSnackbar('Unable to get tag ID', true);
                    return true;
                }

                var id = $tagId.text();
                var tagName = $('#__editTag_TagName').text();

                $http({
                    method: 'DELETE',
                    url: '/api/v1/tickets/tags/' + id
                }).then(function successCallback(response) {
                    if (response.data.success) {
                        helpers.UI.showSnackbar('Successfully removed tag: ' + tagName, false);

                        return History.pushState(null, null, '/settings/tags/');
                    }
                }, function errorCallback(response) {
                    console.log('[trudesk:settings:deleteTag] Error - ' + response.data.error);
                    helpers.UI.showSnackbar('Unable to remove Tag. Check console.', true);

                });
            };
        });
});