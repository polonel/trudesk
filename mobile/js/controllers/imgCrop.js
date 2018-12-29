angular.module('trudesk.controllers.imgCrop', [])
.controller('imgCrop', function($scope, $state, $timeout, $localStorage, $cordovaCamera, Cropper, Camera, Upload, Users) {
  $scope.options = {
    maximize: true,
    aspectRatio: 1 / 1,
    checkImageOrigin: true,
    rotatable: true,
    //zoomable: false,
    viewMode: 1,
    dragMode: 'move',
    checkOrientation: true
  };

  $scope.cropper = {};
  $scope.cropperProxy = 'cropper.first';

  Users.getLoggedInUser().then(function(user) {
    $scope.loggedInUser = user;
  }, function(error) {
    console.log(error);
  });

  $scope.showEvent = 'showCropper';
  $scope.hideEvent = 'hideCropper';

  function showCropper() { $scope.$broadcast($scope.showEvent); }
  function hideCropper() { $scope.$broadcast($scope.hideEvent); }

  $scope.close = function() {
    ionic.trigger('$trudesk.hideCropper', {});
  };

  $scope.save = function() {
    if (!$scope.cropper.first) return;
    var canvas = $scope.cropper.first('getCroppedCanvas', {width: 256, height: 256});

    var image = canvas.toDataURL();
    Upload.profilePicture(image).then(function(response) {
      ionic.trigger('$trudesk.account.updateImage', {image: response.user.image});
    }, function(err) {
      console.log(err);
    }).finally(function() {
      $scope.close();
    });

  };

  ionic.on('$trudesk.imgcrop.showCropper', function() {
      $timeout(function() {
        hideCropper();
        showCropper();
      }, 0);
  });

  ionic.on('$trudesk.imgcrop.setImage', function(data) {
    if (data.detail === undefined || data.detail.image === undefined) return console.log('Invalid data.detail.image');
    // hideCropper();
    $scope.o = data.detail.image;
    // showCropper();
  });
});
