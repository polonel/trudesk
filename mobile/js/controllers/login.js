angular
  .module('trudesk.controllers.login', [])
  .controller('LoginCtrl', function ($http, $scope, $state, $localStorage, $ionicLoading, $ionicPopup) {
    // if (window.StatusBar) {
    //   // org.apache.cordova.statusbar required
    //   window.StatusBar.styleDefault();
    // }

    $ionicLoading.show({
      templateUrl: 'templates/modals/modal-loading.html',
      noBackdrop: true,
      duration: 1200
    })

    $scope.auth = {
      server: '',
      username: '',
      password: ''
    }

    $scope.invalid = {
      server: false,
      username: false,
      password: false
    }

    function showError (err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Error',
        template: err,
        okType: 'button-assertive'
      })

      alertPopup.then(function () {})
    }

    $scope.login = function (loginForm) {
      if (loginForm.$valid) {
        $scope.invalid.server = false
        $scope.invalid.username = false
        $scope.invalid.password = false
        $ionicLoading.show({
          templateUrl: 'templates/modals/modal-loading.html',
          noBackdrop: true
        })
        $scope.auth.server = $scope.auth.server.replace(/^https?:\/\//, '')
        $http
          .post('/api/v1/login', {
            username: $scope.auth.username,
            password: $scope.auth.password
          })
          .then(
            function successCallback (response) {
              if (response.data.success === false) {
                showError(response.data.error)
              } else if (response.data.accessToken !== undefined) {
                $localStorage.server = ''
                $localStorage.username = $scope.auth.username
                $localStorage.accessToken = response.data.accessToken
                $localStorage.loggedInUser = response.data.user

                $http.defaults.headers.common.accesstoken = $localStorage.accessToken

                //OneSignal
                if (window.plugins && window.plugins.OneSignal) {
                  window.plugins.OneSignal.setSubscription(true)
                  window.plugins.OneSignal.sendTags({
                    host: $localStorage.server,
                    user: $localStorage.loggedInUser._id
                  })
                }

                $http
                  .get('/api/v1/roles', {
                    headers: {
                      accesstoken: $localStorage.accessToken
                    }
                  })
                  .then(
                    function successCallback (response) {
                      $localStorage.roles = response.data
                    },
                    function errorCallback (response) {
                      console.log('Error', response)
                    }
                  )
                  .then(function () {
                    $state.go('tab.dash')
                  })
              }
            },
            function errorCallback (response) {
              console.error(response)
              switch (response.status) {
                case -1:
                  showError('Could not connect. Please check server and try again.')
                  break
                case 401:
                  showError('Invalid Username / Password')
                  break
                default:
                  showError('Could not connect. Please check server and try again.')
              }
            }
          )
          .then(function finalCallback () {
            setTimeout(function () {
              $ionicLoading.hide()
            }, 500)
          })
      } else {
        $scope.invalid.server = loginForm.server.$invalid
        $scope.invalid.username = loginForm.username.$invalid
        $scope.invalid.password = loginForm.password.$invalid
      }
    }

    ionic.on('$trudesk.clearLoginForm', function () {
      $scope.auth.server = ''
      $scope.auth.username = ''
      $scope.auth.password = ''
    })

    $scope.$on('$ionicView.enter', function () {
      setTimeout(function () {
        if ($localStorage.server !== undefined && $localStorage.accessToken !== undefined) {
          return $state.go('tab.dash') // Change this for default page to load when logged in.
        }

        if (window.StatusBar) window.StatusBar.styleDefault()

        angular
          .element(document)
          .find('ion-view')
          .removeClass('hide')
        if (window.plugins && window.plugins.OneSignal) window.plugins.OneSignal.setSubscription(false)
      }, 600)
    })
  })
