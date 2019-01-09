angular.module('trudesk.controllers.accounts', [])
.controller('AccountCtrl', function($q, $scope, $state, $http, $timeout, $localStorage, $ionicHistory, $ionicActionSheet, $ionicModal, $cordovaCamera, Camera, Users, Upload) {

  $scope.server = $localStorage.server;

  $ionicModal.fromTemplateUrl('templates/modals/modal-imgcrop.html',  {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.imgcropModal = modal;
  });

  ionic.on('$trudesk.showCropper', function() {
      $scope.imgcropModal.show();
  });

  ionic.on('$trudesk.hideCropper', function() {
    $scope.imgcropModal.hide();
  });

  $scope.showActionSheet =  function(event) {
      if (!ionic.Platform.isWebView()) return;
      var sheet = $ionicActionSheet.show({
          buttons: [
            { text: 'Take Photo' },
            { text: 'Open Photo Library' }
          ],
          titleText: 'Account Picture',
          cancelText: 'Cancel',
          cancel: function() {

          },
          buttonClicked: function(index) {
            switch (index) {
              case 0:
                $scope.openCamera();
                return true;
              case 1:
                $scope.openPhotoLibrary();
                return true
              default:
                return true;
            }
          }
      });
  };

  $scope.openCamera = function() {
    Camera.open().then(function(fileURL) {
        ionic.trigger('$trudesk.imgcrop.setImage', {image: window.Ionic.WebView.convertFileSrc(fileURL)});
        ionic.trigger('$trudesk.imgcrop.showCropper', {});
        $scope.imgcropModal.show();
    });
  };

  $scope.openPhotoLibrary = function() {
    Camera.library().then(function(fileURL) {
      ionic.trigger('$trudesk.imgcrop.setImage', {image: window.Ionic.WebView.convertFileSrc(fileURL)});
      ionic.trigger('$trudesk.imgcrop.showCropper', {});
      $scope.imgcropModal.show();
    });

    ionic.on('$trudesk.account.updateImage', function(data) {
        $scope.updateAccountImage();
    });
  };

  $scope.logout = function($event) {
      $event.preventDefault();
      $http.get('/logout/', {
        timeout: 2000
      }).then(function successCallback(response) {

      }, function errorCallback(response) {

      }).finally(function() {
        ionic.trigger('$trudesk.clearLoginForm', {});    
        $localStorage.server = undefined;
        $localStorage.accessToken = undefined;
        $http.defaults.headers.common.accesstoken = $localStorage.accessToken;        
        if (window.plugins && window.plugins.OneSignal)
          window.plugins.OneSignal.setSubscription(false);
        $ionicHistory.clearCache();
        return $state.go('login');
      });
  };

  $scope.updateAccountImage = function() {
      $localStorage.loggedInUser = null;
      Users.getLoggedInUser().then(function(user) {
        $scope.loggedInUser = user;
        if (user.image)
          $scope.accountProfile = '/uploads/users/' + $scope.loggedInUser.image + '?time=' + new Date().getTime();
        else
          $scope.accountProfile = '/uploads/users/defaultProfile.jpg';
      }, function(err) {
        console.log(err);
      });
  };

  $scope.$on('$ionicView.beforeEnter', function() {
      if (!$scope.accountProfile)
        $scope.accountProfile = '/uploads/users/defaultProfile.jpg';
      $scope.updateAccountImage();
  });
});
