/**
      .                             .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    10/10/2018
 Author:     Chris Brame

 **/

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'uikit', 'history', 'angularjs/services'], function(angular, _, $, helpers, socketClient, Uikit) {
     return angular.module('trudesk.controllers.settingsElasticSearch', ['trudesk.services.settings'])
         .controller('settingsElasticSearchCtrl', function(SettingsService, $scope, $http, $timeout, $document, $log) {

             // Local Functions
             function toggleAnimation(forceState, state) {
                 var animateItems = $('.setting-item-wrap.animate-in');
                 var docElemStyle = $document[0].documentElement.style;
                 var transitionProp = angular.isString(docElemStyle.transition) ? 'transition' : 'WebkitTransition';

                 for (var i = 0; i < animateItems.length; i++) {
                     var item = animateItems[i];
                     item.style[ transitionProp + 'Delay' ] = ( i * 50 ) + 'ms';
                     if (forceState) {
                         if (state)
                             item.classList.add('is-in');
                         else
                             item.classList.remove('is-in');
                     } else
                         item.classList.toggle('is-in');
                 }
             }

             function getStatus() {
                 console.log(SettingsService.getSettings().elasticSearchConfigured.value);
                 if (!SettingsService.getSettings().elasticSearchConfigured.value) {
                     $scope.esStatus = 'Not Configured';
                     $scope.indexCount = '0';
                     $scope.inSyncText = 'Not Configured';
                     return false;
                 }

                 // Get Elastic Search Status
                 $http.get('/api/v1/admin/elasticsearch/status')
                     .then(function success(response) {
                         $scope.esStatus = response.data.status.esStatus;
                         $scope.esStatusClass = 'none';
                         if ($scope.esStatus.toLowerCase() === 'connected')
                             $scope.esStatusClass = 'success';
                         if ($scope.esStatus.toLowerCase() === 'error')
                             $scope.esStatusClass = 'danger';

                         $scope.indexCount = response.data.status.indexCount;
                         $scope.indexCountFormatted = $scope.indexCount.toLocaleString();

                         if (response.data.status.inSync) {
                             $scope.inSyncText = 'In Sync';
                             $scope.inSyncClass = 'bg-success';
                         } else {
                             $scope.inSyncText = 'Out of Sync';
                             $scope.inSyncClass = 'bg-warning';
                         }

                        // Refresh on Rebuild every 5s
                        if ($scope.esStatus.toLowerCase() === 'rebuilding...') {
                            $timeout(getStatus, 5000);
                            $('#es-rebuild-btn').attr('disabled', true);
                        }
                     }, function error(err) {
                         $log.error(err);
                         $scope.esStatus = 'Error';
                         $scope.esStatusClass = 'danger';
                         $scope.inSyncText = 'Unknown';
                         if (err.data.error.message)
                             helpers.UI.showSnackbar('Error: ' + err.data.error.message, true);
                         else if (err.data.error.msg)
                             helpers.UI.showSnackbar('Error: An unknown error occurred. Check Console.', true);
                         else
                             helpers.UI.showSnackbar('Error: ' + err.data.error, true);
                     });
             }

             // Scope

             // Vars
             $scope.esStatus = 'Please Wait...';
             $scope.indexCount = 0;
             $scope.indexCountFormatted = 0;
             $scope.inSyncText = 'Please Wait...';

             $scope.init = function() {
                // Animate if enabled
                if ($scope.elasticSearchEnable)
                    toggleAnimation(true, true);

                getStatus();
             };

             $scope.elasticSearchEnableChange = function() {
                 toggleAnimation(true, $scope.elasticSearchEnable);

                 $http.put('/api/v1/settings', {
                     name: 'es:enable',
                     value: $scope.elasticSearchEnable
                 }, {
                     headers: {
                         'Content-Type': 'application/json'
                     }
                 }).then(function successCallback() {

                 }, function errorCallback(err) {
                     helpers.UI.showSnackbar('Error: ' + err, true);
                 });
             };

             $scope.esServerFormSubmit = function($event) {
                 $event.preventDefault();

                 $http.put('/api/v1/settings', [
                     { name: 'es:host', value: $scope.esServer },
                     { name: 'es:port', value: $scope.esPort }
                     ], {
                     headers: {
                         'Content-Type': 'application/json'
                     }
                 }).then(function successCallback() {
                     SettingsService.getSettings().elasticSearchConfigured.value = true;
                     SettingsService.getSettings().elasticSearchHost.value = $scope.esServer;
                     SettingsService.getSettings().elasticSearchPort.value = $scope.esPort;
                     helpers.UI.showSnackbar('Settings Saved', false);
                 }, function errorCallback(err) {
                     helpers.UI.showSnackbar('Error: ' + err, true);
                 });
             };

             $scope.rebuildIndexClicked = function($event) {
                $event.preventDefault();

                 Uikit.modal.confirm('Are you sure you want to rebuild the index?', function() {
                     $http.get(
                         '/api/v1/admin/elasticsearch/rebuild'
                     )
                         .success(function() {
                             $scope.esStatus = 'Rebuilding...';
                             $scope.esStatusClass = 'text-warning';
                             helpers.UI.showSnackbar('Rebuilding Index...', false);
                             $($event.currentTarget).attr('disabled', true);
                             $timeout(function() {
                                 getStatus();
                             }, 3000);
                         })
                         .error(function(err) {
                             $log.error('[trudesk:settings:es:RebuildIndex] - Error: ' + err.error);
                             helpers.UI.showSnackbar('Error: An unknown error occurred. Check Console.', true);
                         });
                 }, {
                     labels: {'Ok': 'Yes', 'Cancel': 'No'}, confirmButtonClass: 'md-btn-danger'
                 });
             };

         });
    });