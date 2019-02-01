// Ionic trudesk App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'trudesk' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'trudesk.services' is found in services.js
// 'trudesk.controllers' is found in controllers.js
angular.module('underscore', []).factory('_', [
  '$window',
  function ($window) {
    return $window._
  }
])

angular.module('snackbar', []).factory('Snackbar', [
  '$window',
  function ($window) {
    return $window.Snackbar
  }
])

angular
  .module('trudesk', [
    'ionic',
    'ngCordova',
    'ngStorage',
    'underscore',
    'trudesk.controllers',
    'trudesk.services',
    'fileOnChange',
    'angular-peity',
    'snackbar',
    'ngCropper',
    'monospaced.elastic',
    'angularMoment',
    'jett.ionic.filter.bar',
    'angular.img'
  ])

  .run(function ($ionicPlatform, $rootScope, $location, $localStorage, $state, $http) {
    if ($localStorage.accessToken) {
      $http.defaults.headers.common.accesstoken = $localStorage.accessToken
    } else {
      $http.defaults.headers.common.accesstoken = ''
    }

    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true)
        cordova.plugins.Keyboard.disableScroll(true)
      }

      // Lock screen in Portrait if on anything but iPad
      if (!ionic.Platform.isIPad()) {
        if (window.screen) {
          window.screen.orientation.lock('portrait')
        }
      } else {
        if (window.screen) {
          window.screen.orientation.unlock()
        }
      }

      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        window.StatusBar.styleLightContent()
      }

      var notificationOpenedCallback = function (jsonData) {
        if (jsonData.notification.payload && jsonData.notification.payload.additionalData) {
          var ticketUid = jsonData.notification.payload.additionalData.ticketUid
          if (ticketUid) {
            //          console.log('Moving to ticket: ' + ticketUid);
            $state.go('tab.tickets')
            setTimeout(function () {
              return $state.go('tab.tickets-details', { ticketuid: ticketUid })
            }, 850)
          }
        }
      }

      if (window.plugins && window.plugins.OneSignal) {
        window.plugins.OneSignal.startInit('f8e19190-b53b-4b72-bac8-210e7f31bebb')
          .handleNotificationOpened(notificationOpenedCallback)
          .endInit()
      }

      $rootScope.$on('$stateChangeStart', function (event, next, current) {
        if (
          $location.url() !== '/login' &&
          ($localStorage.accessToken == undefined || $localStorage.server == undefined)
        ) {
          return $location.path('/login')
        }
      })

      setTimeout(function () {
        angular.element(document.querySelector('#loader')).addClass('hide')
      }, 900)
    })
  })

  .filter('htmlToPlaintext', function () {
    return function (text) {
      text = text ? String(text).replace(/<[^>]+>/gm, '') : ''
      text = text ? String(text).replace(/&amp;/gm, '&') : ''
      text = text ? String(text).replace(/&quot;/gm, '"') : ''
      text = text ? String(text).replace(/&#39;/gm, "'") : ''
      return text
    }
  })

  .filter('removeHTMLTags', function () {
    return function (text) {
      return text ? String(text).replace(/<[^>]+>/gm, ' ') : ''
    }
  })

  .filter('nl2br', [
    '$filter',
    function ($filter) {
      return function (data) {
        if (!data) return data
        return data.replace(/\n\r?/g, '<br>')
      }
    }
  ])

  .filter('sanitize', [
    '$sce',
    function ($sce) {
      return function (htmlCode) {
        return $sce.trustAsHtml(htmlCode)
      }
    }
  ])

  .filter('currentdate', [
    '$filter',
    function ($filter) {
      return function () {
        return $filter('date')(new Date(), 'M/dd/yy h:mm a')
      }
    }
  ])

  .filter('statusMap', function () {
    return function (s) {
      var status
      switch (s) {
        case 0:
          status = 'New'
          break
        case 1:
          status = 'Open'
          break
        case 2:
          status = 'Pending'
          break
        case 3:
          status = 'Closed'
          break
      }

      return status
    }
  })

  .filter('assigneeMap', function () {
    return function (a) {
      if (a === undefined || a === null) {
        return 'No Assignee'
      } else {
        return a
      }
    }
  })

  //Conversation Stuff
  .filter('conversationFrom', function () {
    return function (p, loggedInUser) {
      var final
      for (var i = 0; i < p.length; i++) {
        if (p[i].username != loggedInUser.username) final = p[i]
      }

      return final
    }
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    ionic.Platform.setPlatform('ios')
    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      //Login
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      })

      // setup an abstract state for the tabs directive
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html'
      })

      // Each tab has its own nav history stack:

      .state('tab.dash', {
        url: '/dash',
        views: {
          'tab-dash': {
            templateUrl: 'templates/tab-dash.html',
            controller: 'DashCtrl'
          }
        }
      })

      .state('tab.tickets', {
        url: '/tickets',
        views: {
          'tab-tickets': {
            templateUrl: 'templates/tab-tickets.html',
            controller: 'TicketsCtrl'
          }
        }
      })

      .state('tab.tickets-details', {
        url: '/tickets/:ticketuid',
        views: {
          'tab-tickets': {
            templateUrl: 'templates/ticket-detail.html',
            controller: 'TicketsDetailCtrl'
          }
        }
      })

      .state('tab.messages', {
        url: '/messages',
        views: {
          'tab-messages': {
            templateUrl: 'templates/tab-messages.html',
            controller: 'MessagesCtrl'
          }
        }
      })

      .state('tab.messages-conversation', {
        url: '/messages/:conversationid',
        views: {
          'tab-messages': {
            templateUrl: 'templates/conversation.html',
            controller: 'ConversationCtrl',
            controllerAs: 'ConversationCtrl'
          }
        }
      })

      .state('tab.account', {
        url: '/account',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account.html',
            controller: 'AccountCtrl'
          }
        }
      })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login')
  })
