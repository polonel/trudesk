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

var angularPeity = angular.module('angular-peity', [])

var peityDirective = function (type) {
  'user strict'

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      options: '='
    },
    link: function (scope, element, attrs, ngModel) {
      var options = {}

      if (scope.options) options = scope.options

      element[0].innerText = ngModel.$viewValue
      attrs.val = ngModel.$viewValue

      ngModel.$render = function () {
        element[0].innerText = ngModel.$viewValue
        jQuery(element[0]).peity(type, options)
      }
    }
  }
}

angularPeity.directive('pieChart', function () {
  return peityDirective('donut')
})

angularPeity.directive('barChart', function () {
  return peityDirective('bar')
})

angularPeity.directive('lineChart', function () {
  return peityDirective('line')
})

var fileOnChange = angular.module('fileOnChange', [])

fileOnChange.directive('fileOnChange', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeHandler = scope.$eval(attrs.fileOnChange)
      element.bind('change', onChangeHandler)
    }
  }
})

var autoLinker = angular.module('autolinker', [])
autoLinker.directive('autolinker', [
  '$timeout',
  function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        $timeout(function () {
          var eleHtml = element.html()
          if (eleHtml === '') {
            return false
          }

          var text = AutoLinker.link(eleHtml, {
            className: 'autolinker',
            newWindow: false
          })

          element.html(text)

          var autolinks = element[0].getElementsByClassName('autolinker')

          for (var i = 0; i < autolinks.length; i++) {
            angular.element(
              autolinks[i].bind('click', function (e) {
                var href = e.target.href

                if (href) {
                  window.open(href, '_blank')
                }

                e.preventDefault()

                return false
              })
            )
          }
        }, 0)
      }
    }
  }
])

var hideTabBar = angular.module('hideTabBar', [])

hideTabBar.directive('hideTabBar', function ($timeout) {
  var style = angular
    .element('<style>')
    .html('.has-tabs.no-tabs:not(.has-tabs-top) { bottom: 0; }\n' + '.no-tabs.has-tabs-top { top: 44px; }')
  document.body.appendChild(style[0])
  return {
    restrict: 'A',
    compile: function (element, attr) {
      var tabBar = document.querySelector('.tab-nav')

      return function ($scope, $element, $attr) {
        var scroll = $element[0].querySelector('.scroll-content')
        $scope.$on('$ionicView.beforeEnter', function () {
          tabBar.classList.add('slide-away')
          scroll.classList.add('no-tabs')
        })
        $scope.$on('$ionicView.beforeLeave', function () {
          tabBar.classList.remove('slide-away')
          scroll.classList.remove('no-tabs')
        })
      }
    }
  }
})
/**
 * @ngdoc directive
 * @name ionInfiniteScrollReverse
 * @module ionic
 * @parent ionic.directive:ionContent, ionic.directive:ionScroll
 * @restrict E
 *
 * @description
 * The ionInfiniteScrollReverse directive allows you to call a function whenever
 * the user gets to the bottom of the page or near the bottom of the page.
 *
 * The expression you pass in for `on-infinite` is called when the user scrolls
 * greater than `distance` away from the bottom of the content.  Once `on-infinite`
 * is done loading new data, it should broadcast the `scroll.infiniteScrollComplete`
 * event from your controller (see below example).
 *
 * @param {expression} on-infinite What to call when the scroller reaches the
 * bottom.
 * @param {string=} distance The distance from the bottom that the scroll must
 * reach to trigger the on-infinite expression. This can be either a percentage
 * or the number of pixels. Default: 2.5%.
 * @param {string=} spinner The {@link ionic.directive:ionSpinner} to show while loading. The SVG
 * {@link ionic.directive:ionSpinner} is now the default, replacing rotating font icons.
 * @param {string=} icon The icon to show while loading. Default: 'ion-load-d'.  This is depreicated
 * in favor of the SVG {@link ionic.directive:ionSpinner}.
 * @param {boolean=} immediate-check Whether to check the infinite scroll bounds immediately on load.
 * @param {boolean=} reverse Whether to reverse the infinite scroller trigger from right/bottom to left/top.
 *
 * @usage
 * ```html
 * <ion-content ng-controller="MyController">
 *   <ion-list>
 *   ....
 *   ....
 *   </ion-list>
 *
 *   <ion-infinite-scroll-reverse
 *     on-infinite="loadMore()"
 *     distance="2.5%"
 *     reverse="true">
 *   </ion-infinite-scroll-reverse>
 * </ion-content>
 * ```
 * ```js
 * function MyController($scope, $http) {
 *   $scope.items = [];
 *   $scope.loadMore = function() {
 *     $http.get('/more-items').success(function(items) {
 *       useItems(items);
 *       $scope.$broadcast('scroll.infiniteScrollComplete');
 *     });
 *   };
 *
 *   $scope.$on('$stateChangeSuccess', function() {
 *     $scope.loadMore();
 *   });
 * }
 * ```
 *
 * An easy to way to stop infinite scroll once there is no more data to load
 * is to use angular's `ng-if` directive:
 *
 * ```html
 * <ion-infinite-scroll-reverse
 *   ng-if="moreDataCanBeLoaded()"
 *   icon="ion-loading-c"
 *   on-infinite="loadMoreData()"
 *   reverse="true">
 * </ion-infinite-scroll-reverse>
 * ```
 */
angular.module('ionic').directive('ionInfiniteScrollReverse', [
  '$timeout',
  function ($timeout) {
    return {
      restrict: 'E',
      require: ['?^$ionicScroll', 'ionInfiniteScrollReverse'],
      template: function ($element, $attrs) {
        if ($attrs.icon) return '<i class="icon {{icon()}} icon-refreshing {{scrollingType}}"></i>'
        return '<ion-spinner icon="{{spinner()}}"></ion-spinner>'
      },
      scope: true,
      controller: '$ionInfiniteScrollReverse',
      link: function ($scope, $element, $attrs, ctrls) {
        var infiniteScrollCtrl = ctrls[1]
        var scrollCtrl = (infiniteScrollCtrl.scrollCtrl = ctrls[0])
        var jsScrolling = (infiniteScrollCtrl.jsScrolling = !scrollCtrl.isNative())

        // if this view is not beneath a scrollCtrl, it can't be injected, proceed w/ native scrolling
        if (jsScrolling) {
          infiniteScrollCtrl.scrollView = scrollCtrl.scrollView
          $scope.scrollingType = 'js-scrolling'
          //bind to JS scroll events
          scrollCtrl.$element.on('scroll', infiniteScrollCtrl.checkBounds)
        } else {
          // grabbing the scrollable element, to determine dimensions, and current scroll pos
          var scrollEl = ionic.DomUtil.getParentOrSelfWithClass($element[0].parentNode, 'overflow-scroll')
          infiniteScrollCtrl.scrollEl = scrollEl
          // if there's no scroll controller, and no overflow scroll div, infinite scroll wont work
          if (!scrollEl) {
            throw 'Infinite scroll must be used inside a scrollable div'
          }
          //bind to native scroll events
          infiniteScrollCtrl.scrollEl.addEventListener('scroll', infiniteScrollCtrl.checkBounds)
        }

        // Optionally check bounds on start after scrollView is fully rendered
        var doImmediateCheck = angular.isDefined($attrs.immediateCheck) ? $scope.$eval($attrs.immediateCheck) : true
        if (doImmediateCheck) {
          $timeout(function () {
            infiniteScrollCtrl.checkBounds()
          })
        }
      }
    }
  }
])
angular.module('ionic').controller('$ionInfiniteScrollReverse', [
  '$scope',
  '$attrs',
  '$element',
  '$timeout',
  function ($scope, $attrs, $element, $timeout) {
    var self = this
    self.isLoading = false

    $scope.icon = function () {
      return angular.isDefined($attrs.icon) ? $attrs.icon : 'ion-load-d'
    }

    $scope.spinner = function () {
      return angular.isDefined($attrs.spinner) ? $attrs.spinner : ''
    }

    $scope.$on('scroll.infiniteScrollComplete', function () {
      finishInfiniteScroll()
    })

    $scope.$on('$destroy', function () {
      if (self.scrollCtrl && self.scrollCtrl.$element) self.scrollCtrl.$element.off('scroll', self.checkBounds)
      if (self.scrollEl && self.scrollEl.removeEventListener) {
        self.scrollEl.removeEventListener('scroll', self.checkBounds)
      }
    })

    // debounce checking infinite scroll events
    self.checkBounds = ionic.Utils.throttle(checkInfiniteBounds, 300)

    function onInfinite () {
      ionic.requestAnimationFrame(function () {
        $element[0].classList.add('active')
      })
      self.isLoading = true
      $scope.$parent && $scope.$parent.$apply($attrs.onInfinite || '')
    }

    function finishInfiniteScroll () {
      ionic.requestAnimationFrame(function () {
        $element[0].classList.remove('active')
      })
      $timeout(
        function () {
          if (self.jsScrolling) self.scrollView.resize()
          // only check bounds again immediately if the page isn't cached (scroll el has height)
          if (
            (self.jsScrolling && self.scrollView.__container && self.scrollView.__container.offsetHeight > 0) ||
            !self.jsScrolling
          ) {
            self.checkBounds()
          }
        },
        30,
        false
      )
      self.isLoading = false
    }

    // check if we've scrolled far enough to trigger an infinite scroll
    function checkInfiniteBounds () {
      if (self.isLoading) return
      var maxScroll = {}

      if (self.jsScrolling) {
        maxScroll = self.getJSMaxScroll()
        var scrollValues = self.scrollView.getValues()
        if ($attrs.reverse) {
          if (
            (maxScroll.left !== -1 && scrollValues.left <= maxScroll.left) ||
            (maxScroll.top !== -1 && scrollValues.top <= maxScroll.top)
          ) {
            onInfinite()
          }
        } else {
          if (
            (maxScroll.left !== -1 && scrollValues.left >= maxScroll.left) ||
            (maxScroll.top !== -1 && scrollValues.top >= maxScroll.top)
          ) {
            onInfinite()
          }
        }
      } else {
        maxScroll = self.getNativeMaxScroll()
        if ($attrs.reverse) {
          if (
            (maxScroll.left !== -1 && self.scrollEl.scrollLeft <= maxScroll.left) ||
            (maxScroll.top !== -1 && self.scrollEl.scrollTop <= maxScroll.top)
          ) {
            onInfinite()
          }
        } else {
          if (
            (maxScroll.left !== -1 && self.scrollEl.scrollLeft >= maxScroll.left - self.scrollEl.clientWidth) ||
            (maxScroll.top !== -1 && self.scrollEl.scrollTop >= maxScroll.top - self.scrollEl.clientHeight)
          ) {
            onInfinite()
          }
        }
      }
    }

    // determine the threshold at which we should fire an infinite scroll
    // note: this gets processed every scroll event, can it be cached?
    self.getJSMaxScroll = function () {
      var maxValues = self.scrollView.getScrollMax()
      return {
        left: self.scrollView.options.scrollingX ? calculateMaxValue(maxValues.left) : -1,
        top: self.scrollView.options.scrollingY ? calculateMaxValue(maxValues.top) : -1
      }
    }

    self.getNativeMaxScroll = function () {
      var maxValues = {
        left: self.scrollEl.scrollWidth,
        top: self.scrollEl.scrollHeight
      }
      var computedStyle = window.getComputedStyle(self.scrollEl) || {}
      return {
        left:
          maxValues.left &&
          (computedStyle.overflowX === 'scroll' ||
            computedStyle.overflowX === 'auto' ||
            self.scrollEl.style['overflow-x'] === 'scroll')
            ? calculateMaxValue(maxValues.left)
            : -1,
        top:
          maxValues.top &&
          (computedStyle.overflowY === 'scroll' ||
            computedStyle.overflowY === 'auto' ||
            self.scrollEl.style['overflow-y'] === 'scroll')
            ? calculateMaxValue(maxValues.top)
            : -1
      }
    }

    // determine pixel refresh distance based on % or value
    function calculateMaxValue (maximum) {
      var distance = ($attrs.distance || '2.5%').trim()
      var isPercent = distance.indexOf('%') !== -1
      if ($attrs.reverse) {
        return isPercent ? maximum - maximum * (1 - parseFloat(distance) / 100) : parseFloat(distance)
      } else {
        return isPercent ? maximum * (1 - parseFloat(distance) / 100) : maximum - parseFloat(distance)
      }
    }

    //for testing
    self.__finishInfiniteScroll = finishInfiniteScroll
  }
])
angular
  .module('trudesk.services', [])
  .factory('WebSocket', function ($q, $rootScope, $timeout, $http, $localStorage) {
    var dataStream = io.connect('/', {
      query: 'token=' + $localStorage.accessToken
    })

    var message

    //Socket.io events
    dataStream.on('connect', function () {
      console.log('Connected to Server: ' + $localStorage.server)
    })

    dataStream.on('disconnect', function () {
      console.log('Disconnected from Server: ' + $localStorage.server)
    })

    dataStream.on('error', function (e) {
      console.log('Error', e)
    })

    dataStream.on('joinSuccessfully', function () {
      console.log('Joined Messaging Server.')
    })

    dataStream.removeAllListeners('chatMessage')
    dataStream.on('chatMessage', function (data) {
      // console.log('Chat Message Receieved: ', data);
      window.dispatchEvent(new CustomEvent('$trudesk.converstation.chatmessage', { detail: data }))
      // ionic.trigger('$trudesk.conversation.chatmessage', data);
    })

    dataStream.on('updateUsers', function (users) {
      window.dispatchEvent(new CustomEvent('$trudesk.conversation.updateusers', { detail: users }))
      // ionic.trigger('$trudesk.conversation.updateusers', users);
    })

    dataStream.on('chatTyping', function (data) {
      ionic.trigger('$trudesk.conversation.usertyping', data)
    })

    dataStream.on('chatStopTyping', function (data) {
      ionic.trigger('$trudesk.conversation.userstoptyping', data)
    })

    return {
      message: message,
      socket: dataStream,
      startTyping: function (convoId, partnerId, loggedInUserId) {
        dataStream.emit('chatTyping', {
          cid: convoId,
          to: partnerId,
          from: loggedInUserId
        })
      },
      stopTyping: function (convoId, partnerId) {
        dataStream.emit('chatStopTyping', {
          cid: convoId,
          to: partnerId
        })
      },
      send: function (convoId, partnerId, loggedInUserId, messageId, messageBody) {
        dataStream.emit('chatMessage', {
          conversation: convoId,
          to: partnerId,
          from: loggedInUserId,
          type: 's',
          messageId: messageId,
          message: messageBody
        })
      },
      updateUsers: function () {
        return dataStream.emit('updateUsers')
      },
      checkConnection: function () {
        if (dataStream == undefined || !dataStream.connected) {
          console.log('Reconnecting to: ' + $localStorage.server)
          dataStream = undefined
          dataStream = io.connect('http://' + $localStorage.server, {
            query: 'token=' + $localStorage.accessToken
          })
        }
      },
      close: function () {
        console.log('Closing Socket...')
        return dataStream.disconnect()
      }
    }
  })
  .factory('Roles', function ($q, $http, $localStorage) {
    return {
      flushRoles: function () {
        return new Promise(function (resolve, reject) {
          $http
            .get('http://' + $localStorage.server + '/api/v1/roles', {
              headers: {
                accesstoken: $localStorage.accessToken
              }
            })
            .then(function (res) {
              if (res.data) {
                var obj = { roles: $localStorage.roles.roles, roleOrder: $localStorage.roles.roleOrder }
                if (res.data.roles) obj.roles = res.data.roles
                if (res.data.roleOrder) obj.roleOrder = res.data.roleOrder

                $localStorage.roles = obj

                return resolve(obj)
              }
            })
            .catch(function (err) {
              return reject(err)
            })
        })
      },
      canUser: function (a) {
        var roles = $localStorage.roles.roles
        var rolePerm = _.find(roles, function (r) {
          return r._id.toString() === $localStorage.loggedInUser.role._id.toString()
        })

        if (_.isUndefined(rolePerm)) return false

        var role = rolePerm._id
        if (_.indexOf(rolePerm.grants, '*') !== -1) return true

        var actionType = a.split(':')[0]
        var action = a.split(':')[1]

        if (_.isUndefined(actionType) || _.isUndefined(action)) return false

        var result = _.filter(rolePerm.grants, function (value) {
          if (value.lastIndexOf(actionType + ':') === 0) return value
          // if (_.startsWith(value, actionType + ':')) return value
        })

        if (_.isUndefined(result) || _.size(result) < 1) return false
        if (_.size(result) === 1) {
          if (result[0] === '*') return true
        }

        var typePerm = result[0].split(':')[1].split(' ')
        typePerm = _.uniq(typePerm)

        if (_.indexOf(typePerm, '*') !== -1) return true

        return _.indexOf(typePerm, action) !== -1
      }
    }
  })
  .factory('Users', function ($q, $http, $localStorage) {
    return {
      getImage: function (url) {
        return new Promise(function (resolve, reject) {
          $http
            .get(url, {
              method: 'GET',
              headers: {
                accesstoken: $localStorage.accessToken
              }
            })
            .then(function (response) {
              var objectUrl = URL.createObjectURL(response.blob())
              return resolve(objectUrl)
            })
            .catch(function (err) {
              return reject(err)
            })
        })
      },
      get: function (username) {
        return $http.get('/api/v1/users/' + username, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      getUsers: function () {
        return $http.get('/api/v1/users?limit=-1', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      getAssignees: function () {
        return $http.get('/api/v1/users/getassignees', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      getRoles: function () {
        return $http.get('/api/v1/roles', {
          headers: {
            accesstoken: $localStroage.accessToken
          }
        })
      },
      getLoggedInUser: function () {
        var deferred = $q.defer()
        if ($localStorage.loggedInUser) {
          deferred.resolve($localStorage.loggedInUser)
          return deferred.promise
        }

        if (!$localStorage.username) deferred.reject('No username stored.')
        else {
          $http
            .get('/api/v1/users/' + $localStorage.username, {
              headers: {
                accesstoken: $localStorage.accessToken
              }
            })
            .then(
              function successCallback (response) {
                if (response.data.user) {
                  $localStorage.loggedInUser = response.data.user
                  if ($localStorage.loggedInUser.image === undefined)
                    $localStorage.loggedInUser.image = 'defaultProfile.jpg'
                  deferred.resolve($localStorage.loggedInUser)
                } else {
                  deferred.reject('Unable to get user')
                }
              },
              function errorCallback (response) {
                console.log(response)
                deferred.reject('Error Occured!')
              }
            )
        }

        return deferred.promise
      },
      isUserOnline: function (onlineUsers, userObj) {
        if (userObj === undefined) return false
        if (onlineUsers === undefined) return false
        return onlineUsers[userObj.username] !== undefined
      }
    }
  })

  .factory('Tickets', function ($http, $localStorage) {
    return {
      all: function (page) {
        if (page === undefined) page = 0

        var queryString = '/api/v1/tickets?limit=' + 10 + '&status[]=0&status[]=1&status[]=2&page=' + page
        if ($localStorage.showClosedTickets !== undefined && $localStorage.showClosedTickets === true)
          queryString += '&status[]=3'
        if ($localStorage.showOnlyAssigned !== undefined && $localStorage.showOnlyAssigned === true)
          queryString += '&assignedself=true'
        return $http.get(queryString, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      get: function (uid) {
        return $http.get('/api/v1/tickets/' + uid, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      create: function (ticket) {
        return $http.post('/api/v1/tickets/create', ticket, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      search: function (search) {
        return $http.get('/api/v1/tickets/search/?search=' + search, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      update: function (ticket) {
        return $http.put('/api/v1/tickets/' + ticket._id, ticket, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      addComment: function (ticket, comment) {
        return $http.post(
          '/api/v1/tickets/addcomment',
          {
            _id: ticket._id,
            comment: comment.comment,
            ownerId: comment.ownerId
          },
          {
            headers: {
              accesstoken: $localStorage.accessToken
            }
          }
        )
      },
      addNote: function (ticket, note) {
        return $http.post(
          '/api/v1/tickets/addnote',
          {
            ticketid: ticket._id,
            note: note.note,
            owner: note.ownerId
          },
          {
            headers: {
              accesstoken: $localStorage.accessToken
            }
          }
        )
      },
      ticketStats: function (timespan) {
        return $http.get('/api/v1/tickets/stats/' + timespan, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Groups', function ($http, $localStorage) {
    return {
      all: function () {
        return $http.get('/api/v1/groups', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      get: function (_id) {
        return $http.get('/api/v1/groups/' + _id, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('TicketTypes', function ($http, $localStorage) {
    return {
      all: function () {
        return $http.get('/api/v1/tickets/types', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      get: function (typeId) {
        return $http.get('http://' + $localStorage.server + '/api/v1/tickets/type/' + typeId, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Priorities', function ($http, $localStorage) {
    return {
      all: function () {
        return $http.get('http://' + $localStorage.server + '/api/v1/tickets/priorities', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Messages', function ($http, $localStorage) {
    return {
      getConversation: function (convoId, page) {
        if (page === undefined) page = 0

        var queryString = '/api/v1/messages/conversation/' + convoId + '?page=' + page
        return $http.get(queryString, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      getRecent: function () {
        return $http.get('/api/v1/messages/conversations/recent', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      },
      sendMessage: function (convoId, message) {
        return $http.post(
          '/api/v1/messages/send',
          {
            cId: convoId,
            owner: message.ownerId,
            body: message.body
          },
          {
            headers: {
              accesstoken: $localStorage.accessToken
            }
          }
        )
      },
      startConversation: function (userId) {
        return $http.post(
          '/api/v1/messages/conversation/start',
          {
            owner: $localStorage.loggedInUser._id,
            participants: [$localStorage.loggedInUser._id, userId]
          },
          {
            headers: {
              accesstoken: $localStorage.accessToken
            }
          }
        )
      },
      deleteConversation: function (convoId) {
        return $http.delete('/api/v1/messages/conversation/' + convoId, {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Graphs', function ($http, $localStorage) {
    return {
      topGroups: function () {
        return $http.get('/api/v1/tickets/count/topgroups', {
          headers: {
            accesstoken: $localStorage.accessToken
          }
        })
      }
    }
  })

  .factory('Camera', function ($q, $cordovaCamera, $ionicPlatform) {
    return {
      open: function () {
        var deferred = $q.defer()
        if (ionic.Platform.isWebView()) {
          var options = {
            quality: 80,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG
          }

          $cordovaCamera.getPicture(options).then(function (fileURL) {
            deferred.resolve(fileURL)
          })
        } else {
          deferred.reject('Not Supported in browser')
        }

        return deferred.promise
      },
      library: function () {
        var deferred = $q.defer()
        if (ionic.Platform.isWebView()) {
          var options = {
            quality: 80,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            encodingType: Camera.EncodingType.JPEG
          }

          $cordovaCamera.getPicture(options).then(function (fileURL) {
            if ($ionicPlatform.is('ios')) return deferred.resolve(fileURL)
            else if ($ionicPlatform.is('android'))
              // Fixed content:// Paths when loading library files on Android 4.4+
              window.FilePath.resolveNativePath(fileURL, function (resolvedFileURI) {
                return deferred.resolve(resolvedFileURI)
              })
            else return deferred.reject('Unsupported Platform')
          })
        } else {
          deferred.reject('Not Supported in browser')
        }

        return deferred.promise
      }
    }
  })

  .factory('Upload', function ($q, $cordovaCamera, $cordovaFileTransfer, $localStorage) {
    return {
      profilePicture: function (fileURL) {
        var deferred = $q.defer()
        if (ionic.Platform.isWebView()) {
          var serverURL = '/api/v1/users/' + $localStorage.username + '/uploadprofilepic'

          var uploadOptions = new FileUploadOptions()
          uploadOptions.fileKey = 'file'
          uploadOptions.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1)
          uploadOptions.mimeType = 'image/jpeg'

          var ft = new FileTransfer()

          ft.upload(
            fileURL,
            encodeURI(serverURL),
            function (result) {
              var response = result.response
              var responseObj = JSON.parse(response)
              deferred.resolve(responseObj)
            },
            function (err) {
              deferred.reject(err)
            },
            uploadOptions
          )
        } else {
          deferred.reject('Not Supported')
        }

        return deferred.promise
      }
    }
  })
;(function () {
  return angular.module('trudesk.controllers', [
    'trudesk.controllers.login',
    'trudesk.controllers.dashboard',
    'trudesk.controllers.tickets',
    'trudesk.controllers.ticketDetails',
    'trudesk.controllers.accounts',
    'trudesk.controllers.messages',
    'trudesk.controllers.messages.conversation',

    'trudesk.controllers.imgCrop',
    'trudesk.controllers.graphs'
  ])
})()

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

angular
  .module('trudesk.controllers.accounts', [])
  .controller('AccountCtrl', function (
    $q,
    $scope,
    $state,
    $http,
    $timeout,
    $localStorage,
    $ionicHistory,
    $ionicActionSheet,
    $ionicModal,
    $cordovaCamera,
    Camera,
    Users,
    Upload
  ) {
    $scope.server = $localStorage.server

    $ionicModal
      .fromTemplateUrl('templates/modals/modal-imgcrop.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function (modal) {
        $scope.imgcropModal = modal
      })

    ionic.on('$trudesk.showCropper', function () {
      $scope.imgcropModal.show()
    })

    ionic.on('$trudesk.hideCropper', function () {
      $scope.imgcropModal.hide()
    })

    $scope.showActionSheet = function (event) {
      if (!ionic.Platform.isWebView()) return
      var sheet = $ionicActionSheet.show({
        buttons: [{ text: 'Take Photo' }, { text: 'Open Photo Library' }],
        titleText: 'Account Picture',
        cancelText: 'Cancel',
        cancel: function () {},
        buttonClicked: function (index) {
          switch (index) {
            case 0:
              $scope.openCamera()
              return true
            case 1:
              $scope.openPhotoLibrary()
              return true
            default:
              return true
          }
        }
      })
    }

    $scope.openCamera = function () {
      Camera.open().then(function (fileURL) {
        ionic.trigger('$trudesk.imgcrop.setImage', { image: window.Ionic.WebView.convertFileSrc(fileURL) })
        ionic.trigger('$trudesk.imgcrop.showCropper', {})
        $scope.imgcropModal.show()
      })
    }

    $scope.openPhotoLibrary = function () {
      Camera.library().then(function (fileURL) {
        ionic.trigger('$trudesk.imgcrop.setImage', { image: window.Ionic.WebView.convertFileSrc(fileURL) })
        ionic.trigger('$trudesk.imgcrop.showCropper', {})
        $scope.imgcropModal.show()
      })

      ionic.on('$trudesk.account.updateImage', function (data) {
        $scope.updateAccountImage()
      })
    }

    $scope.logout = function ($event) {
      $event.preventDefault()
      $http
        .get('/logout/', {
          timeout: 2000
        })
        .then(function successCallback (response) {}, function errorCallback (response) {})
        .finally(function () {
          ionic.trigger('$trudesk.clearLoginForm', {})
          $localStorage.server = undefined
          $localStorage.accessToken = undefined
          $http.defaults.headers.common.accesstoken = $localStorage.accessToken
          if (window.plugins && window.plugins.OneSignal) window.plugins.OneSignal.setSubscription(false)
          $ionicHistory.clearCache()
          return $state.go('login')
        })
    }

    $scope.updateAccountImage = function () {
      $localStorage.loggedInUser = null
      Users.getLoggedInUser().then(
        function (user) {
          $scope.loggedInUser = user
          if (user.image)
            $scope.accountProfile = '/uploads/users/' + $scope.loggedInUser.image + '?time=' + new Date().getTime()
          else $scope.accountProfile = '/uploads/users/defaultProfile.jpg'
        },
        function (err) {
          console.log(err)
        }
      )
    }

    $scope.$on('$ionicView.beforeEnter', function () {
      if (!$scope.accountProfile) $scope.accountProfile = '/uploads/users/defaultProfile.jpg'
      $scope.updateAccountImage()
    })
  })

angular
  .module('trudesk.controllers.dashboard', [])
  .controller('DashCtrl', function ($http, $scope, $state, $location, $ionicNavBarDelegate, $localStorage, Tickets) {
    var path = $location.path()
    if (path.indexOf('dashboard') === -1) $ionicNavBarDelegate.showBackButton(false)
    else $ionicNavBarDelegate.showBackButton(true)

    $scope.totalTickets = 0
    $scope.timespans = [
      { label: '30 Days', value: 30 },
      { label: '60 Days', value: 60 },
      { label: '90 Days', value: 90 },
      { label: '180 Days', value: 180 },
      { label: '365 Days', value: 365 }
    ]

    $scope.selectedTimespan = 30

    $scope.barChart = [5, 3, 9, 6, 5, 9, 7]
    $scope.lineChart = [5, 3, 9, 6, 5, 9, 7, 3, 5, 2]

    function getStats (timespan) {
      Tickets.ticketStats(timespan).then(function successCallback (response) {
        $scope.totalTickets = response.data.ticketCount ? response.data.ticketCount : 0
        var closedCount = Number(response.data.closedCount)
        $scope.closedPercent = Math.round((closedCount / $scope.totalTickets) * 100)
        $scope.closedPercent = isNaN($scope.closedPercent) ? '--' : $scope.closedPercent
        $scope.closedPercentPie = $scope.closedPercent + '/100'
        $scope.ticketAvg = response.data.ticketAvg ? response.data.ticketAvg : 0
      })
    }

    getStats(30)
    $scope.timespanChange = function ($event) {
      $scope.selectedTimespan = this.selectedTimespan
      getStats($scope.selectedTimespan)
    }

    $scope.$on('$ionicView.enter', function () {
      if (window.StatusBar) window.StatusBar.styleLightContent()
    })

    $scope.$on('$ionicView.beforeEnter', function () {
      ensureLogin($localStorage, $state)
    })
  })

angular.module('trudesk.controllers.graphs', []).controller('GraphCtrl', function ($scope, $http, _, Graphs) {
  $scope.renderGraphs = function () {
    Graphs.topGroups().then(
      function successCallback (response) {
        var arr = []
        if (_.size(response.data.items) < 1) {
          response.data.items = [{ name: 'No Data', count: 1 }]
        }

        arr = _.map(response.data.items, function (v, k) {
          return [v.name, v.count]
        })

        var colors = [
          '#e74c3c',
          '#3498db',
          '#9b59b6',
          '#34495e',
          '#1abc9c',
          '#2ecc71',
          '#03A9F4',
          '#00BCD4',
          '#009688',
          '#4CAF50',
          '#FF5722',
          '#CDDC39',
          '#FFC107',
          '#00E5FF',
          '#E040FB',
          '#607D8B'
        ]

        colors = _.shuffle(colors)

        var c = _.object(
          _.map(arr, function (v, i) {
            return v[0]
          }),
          colors
        )

        c3.generate({
          bindto: '#topGroupsChart',
          size: {
            height: 150,
            width: 315
          },
          data: {
            columns: arr,
            type: 'pie',
            colors: c
          },
          tooltip: {
            show: false
          },
          pie: {
            label: {
              format: function (v, r, id) {
                return ''
              }
            }
          }
        })
      },
      function errorCallback (err) {
        console.error(err)
      }
    )
  }
})

angular
  .module('trudesk.controllers.imgCrop', [])
  .controller('imgCrop', function (
    $scope,
    $state,
    $timeout,
    $localStorage,
    $cordovaCamera,
    Cropper,
    Camera,
    Upload,
    Users
  ) {
    $scope.options = {
      maximize: true,
      aspectRatio: 1 / 1,
      checkImageOrigin: true,
      rotatable: true,
      //zoomable: false,
      viewMode: 1,
      dragMode: 'move',
      checkOrientation: true
    }

    $scope.cropper = {}
    $scope.cropperProxy = 'cropper.first'

    Users.getLoggedInUser().then(
      function (user) {
        $scope.loggedInUser = user
      },
      function (error) {
        console.log(error)
      }
    )

    $scope.showEvent = 'showCropper'
    $scope.hideEvent = 'hideCropper'

    function showCropper () {
      $scope.$broadcast($scope.showEvent)
    }
    function hideCropper () {
      $scope.$broadcast($scope.hideEvent)
    }

    $scope.close = function () {
      ionic.trigger('$trudesk.hideCropper', {})
    }

    $scope.save = function () {
      if (!$scope.cropper.first) return
      var canvas = $scope.cropper.first('getCroppedCanvas', { width: 256, height: 256 })

      var image = canvas.toDataURL()
      Upload.profilePicture(image)
        .then(
          function (response) {
            ionic.trigger('$trudesk.account.updateImage', { image: response.user.image })
          },
          function (err) {
            console.log(err)
          }
        )
        .finally(function () {
          $scope.close()
        })
    }

    ionic.on('$trudesk.imgcrop.showCropper', function () {
      $timeout(function () {
        hideCropper()
        showCropper()
      }, 0)
    })

    ionic.on('$trudesk.imgcrop.setImage', function (data) {
      if (data.detail === undefined || data.detail.image === undefined) return console.log('Invalid data.detail.image')
      // hideCropper();
      $scope.o = data.detail.image
      // showCropper();
    })
  })

angular
  .module('trudesk.controllers.messages', [])
  .controller('MessagesCtrl', function (
    $scope,
    $state,
    $stateParams,
    $localStorage,
    $ionicListDelegate,
    $ionicNavBarDelegate,
    $ionicModal,
    $ionicPopup,
    $ionicActionSheet,
    $ionicLoading,
    $ionicScrollDelegate,
    $ionicFilterBarConfig,
    $ionicFilterBar,
    $timeout,
    $q,
    WebSocket,
    Messages,
    Users
  ) {
    $ionicNavBarDelegate.showBackButton(true)
    $ionicFilterBarConfig.theme = 'dark'

    //Modals
    $ionicModal
      .fromTemplateUrl('templates/modals/modal-messages-newconversation.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function (modal) {
        $scope.newConversation = modal
      })

    $scope.server = $localStorage.server

    //Socket.io
    $scope.socket = WebSocket
    $scope.recentConversations = []
    $scope.isUserOnline = Users.isUserOnline
    $scope.onlineUsers = []
    $scope.userList = []

    //EVENTS
    $scope.$on('$ionicView.beforeEnter', function () {
      ensureLogin($localStorage, $state)
      $scope.server = $localStorage.server
      Users.getLoggedInUser()
        .then(
          function (user) {
            $scope.loggedInUser = user
          },
          function (err) {
            console.log(err)
          }
        )
        .then(function () {
          ionic.on('$trudesk.conversation.updateusers', onUpdateUsers, window)
          $timeout(function () {
            $scope.loadRecentConversations()
          }, 0)
        })
    })

    $scope.$on('$ionicView.enter', function (scopes, states) {})

    $scope.$on('$stateChangeStart', function (e) {
      ionic.off('$trudesk.conversation.updateusers', onUpdateUsers, window)
    })

    // Functions
    $scope.loadRecentConversations = function () {
      Messages.getRecent().then(
        function (response) {
          //Success
          $scope.recentConversations = response.data.conversations
          $scope.showRecentConversations = _.size($scope.recentConversations) >= 1
        },
        function (err) {
          console.log(err)
          $scope.showRecentConversations = false
        }
      )
    }

    $scope.showNewConversation = function () {
      $scope.getUserList().then(function () {
        $scope.newConversation.show()
      })
    }

    $scope.hideNewConversation = function () {
      if (filterBarInstance) {
        filterBarInstance()
        filterBarInstance = null
      }

      $scope.newConversation.hide()
    }

    $scope.startConversation = function (userId) {
      Messages.startConversation(userId).then(
        function (response) {
          var convoId = response.data.conversation._id
          if (convoId === undefined) {
            $scope.showSnackbar('Invalid Conversation Id', true)
          } else {
            if ($scope.newConversation !== undefined) $scope.hideNewConversation()
            return $state.go('tab.messages-conversation', {
              conversationid: convoId
            })
          }
        },
        function (error) {
          $scope.showSnackbar(error, true)
          console.log(error)
        }
      )
    }

    $scope.deleteConversation = function (convoId) {
      Messages.deleteConversation(convoId)
        .then(
          function (response) {
            if (response.data.success) {
              var convo = _.find($scope.recentConversations, function (obj) {
                return obj._id.toString() === convoId.toString()
              })
              var idx = $scope.recentConversations.indexOf(convo)
              if (idx !== -1) $scope.recentConversations.splice(idx, 1)
            }
          },
          function (error) {
            $scope.showSnackbar(error, true)
            console.log(error)
          }
        )
        .finally(function () {
          //check for 0 recent Convo, and load the last;
          $timeout(function () {
            $scope.loadRecentConversations()
          }, 0)
        })
    }

    $scope.getUserList = function () {
      return Users.getUsers().then(
        function (res) {
          var list = res.data.users
          for (var i = 0; i < list.length; i++) {
            if (list[i].username === $localStorage.loggedInUser.username) list.splice(i, 1)
            else {
              delete list[i].__v
              delete list[i].accessToken
              delete list[i].deleted
              delete list[i].groups
              delete list[i].lastOnline
              delete list[i].preferences
              delete list[i].role
              delete list[i].title
            }
          }

          $scope.userList = list
        },
        function (err) {
          $scope.showSnackbar(err, true)
          console.log(err)
        }
      )
    }

    var filterBarInstance
    $scope.showFilterBar = function () {
      filterBarInstance = $ionicFilterBar.show({
        items: $scope.userList,
        container: '.modal',
        debounce: true,
        delay: 100,
        update: function (filteredItems, filterText) {
          $scope.userList = filteredItems
        }
      })
    }

    $scope.showSnackbar = function (text, error) {
      if (_.isUndefined(error)) error = false

      var textColor = '#FFFFFF'

      if (error) textColor = '#ef473a'

      Snackbar.show({
        text: text,
        showAction: false,
        duration: 3000,
        textColor: textColor
      })
    }

    function onUpdateUsers (data) {
      $timeout(function () {
        $scope.onlineUsers = data.detail
        delete $scope.onlineUsers[$scope.loggedInUser.username]
        $ionicScrollDelegate.$getByHandle('activeUsersScroll').resize()
      }, 0)
    }

    $scope.isEmpty = function (items) {
      var bar
      for (bar in items) {
        if (items.hasOwnProperty(bar)) {
          return false
        }
      }

      return true
    }
  })

function ensureLogin ($localStorage, $state) {
  if ($localStorage.server === undefined || $localStorage.accessToken === undefined) return $state.go('login')
}

angular
  .module('trudesk.controllers.messages.conversation', [])
  .controller('ConversationCtrl', function (
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $localStorage,
    $ionicListDelegate,
    $ionicNavBarDelegate,
    $ionicModal,
    $ionicPopup,
    $ionicPopover,
    $ionicActionSheet,
    $ionicLoading,
    $ionicScrollDelegate,
    $ionicHistory,
    $interval,
    $timeout,
    $q,
    moment,
    WebSocket,
    Messages,
    Users
  ) {
    $ionicNavBarDelegate.showBackButton(true)

    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll')

    //Vars
    $scope.server = $localStorage.server
    $scope.isUserOnline = Users.isUserOnline
    $scope.onlineUsers = {}
    $scope.message = {
      body: ''
    }
    $scope.messages = []
    $scope.partnerTyping = false

    $ionicPopover
      .fromTemplateUrl('templates/popover/popover-messages-conversation.html', {
        scope: $scope
      })
      .then(function (popover) {
        $scope.popover = popover
      })

    //Private
    var txtInput // gets set in $ionicView.enter
    var typingTimer = null
    var partnerTypingTimer = null
    var isTyping = false

    //EVENTS
    $scope.$on('$ionicView.beforeEnter', function () {
      ensureLogin($localStorage, $state)
      $scope.server = $localStorage.server
      Users.getLoggedInUser()
        .then(
          function (user) {
            $scope.loggedInUser = user
            $scope.getConversation()
          },
          function (err) {
            console.log(err)
          }
        )
        .then(function () {
          window.addEventListener('native.keyboardshow', onKeyboardShow)
          window.addEventListener('native.keyboardhide', onKeyboardHide)
          window.addEventListener('$trudesk.converstation.chatmessage', onChatMessage)
          window.addEventListener('$trudesk.conversation.updateusers', onUpdateUsers)
          // ionic.on('$trudesk.conversation.chatmessage', onChatMessage, window);
          ionic.on('$trudesk.conversation.usertyping', onPartnerTyping, window)
          ionic.on('$trudesk.conversation.userstoptyping', onPartnerStopTyping, window)
          // ionic.on('$trudesk.conversation.updateusers', onUpdateUsers, window);
        })
        .then(function () {
          $timeout(function () {
            WebSocket.updateUsers()
          }, 0)
        })
    })

    $scope.$on('$ionicView.enter', function () {
      txtInput = angular.element(document.body.querySelector('#message-textarea'))
    })

    $scope.$on('$stateChangeStart', function (e) {
      window.removeEventListener('native.keyboardshow', onKeyboardShow)
      window.removeEventListener('native.keyboardhide', onKeyboardHide)
      window.removeEventListener('$trudesk.conversation.chatmessage', onChatMessage)

      ionic.off('$trudesk.conversation.usertyping', onPartnerTyping, window)
      ionic.off('$trudesk.conversation.userstoptyping', onPartnerStopTyping, window)
      window.removeEventListener('$trudesk.conversation.updateusers', onUpdateUsers)

      stopTyping()
      typingTimer = undefined
      partnerTypingTimer = undefined
    })

    function scrollBottom () {
      $timeout(function () {
        viewScroll.scrollBottom()
      }, 10)
    }

    function onKeyboardShow (e) {
      scrollBottom()
    }

    function onKeyboardHide (e) {
      scrollBottom()
    }

    function onPartnerTyping (data) {
      if ($scope.partnerTyping) {
        clearTimeout(partnerTypingTimer)
        partnerTypingTimer = setTimeout(cancelPartnerTyping, 15000)
        return
      }

      $scope.partnerTyping = true
      scrollBottom()

      if (partnerTypingTimer == undefined) partnerTypingTimer = setTimeout(cancelPartnerTyping, 15000)
    }

    function onPartnerStopTyping (data) {
      $timeout(function () {
        $scope.partnerTyping = false
      }, 0)
    }

    function cancelPartnerTyping () {
      $timeout(function () {
        $scope.partnerTyping = false
        partnerTypingTimer = undefined
      }, 0)
    }

    function onChatMessage (data) {
      var m = {
        _id: data.detail.messageId,
        createdAt: new Date().toISOString(),
        owner: data.detail.fromUser,
        body: data.detail.message
      }

      $timeout(function () {
        $scope.messages.push(m)

        if (viewScroll != undefined) scrollBottom()
      }, 0)
    }

    function onUpdateUsers (data) {
      $timeout(function () {
        $scope.onlineUsers = data.detail
      }, 0)
    }

    //IF CACHE-VIEW="FALSE" THIS IS NEEDED TO REMOVE THE LISTENER
    // var TIMER = $interval(function() {
    //     if ($ionicHistory.currentView().stateName != 'tab.messages-conversation') {
    //         console.log('OFF CONVERSATION');
    //         ionic.off('$trudesk.conversation.chatmessage', onChatMessage, window);
    //         $interval.cancel(TIMER);
    //         return;
    //     }
    // });

    $scope.getConversation = function () {
      if ($scope.page == undefined) $scope.page = 0

      return Messages.getConversation($stateParams.conversationid, $scope.page)
        .then(
          function (response) {
            $scope.conversation = response.data.conversation

            //Set partner ID
            for (var i = 0; i < $scope.conversation.participants.length; i++) {
              if ($scope.conversation.participants[i].username != $scope.loggedInUser.username)
                $scope.conversation.partner = $scope.conversation.participants[i]
            }

            if (_.size(response.data.messages) < 1) {
              $scope.hasMore = false
              return
            }

            if ($scope.page == 0) $scope.messages = response.data.messages.reverse()
            else {
              var a = $scope.messages
              if (_.size(a) > 0)
                $scope.messages = _.uniq(_.union(a, response.data.messages), false, function (i, k, a) {
                  return i._id
                })
              $scope.messages = _.sortBy($scope.messages, function (message) {
                return message.createdAt
              })
            }

            if (_.size(response.data.messages) < 10) {
              $scope.hasMore = false
            }
          },
          function (err) {
            console.log(err)
          }
        )
        .then(function () {
          $timeout(function () {
            if ($scope.page == 0) scrollBottom()
            else
              $timeout(function () {
                viewScroll.scrollBy(0, 150, true)
              })

            $scope.page++
            $scope.$broadcast('scroll.infiniteScrollComplete')
          }, 0)
        })
    }

    $scope.$on('elastic:resize', function (event, element, oldHeight, newHeight) {
      $('.message-textbox')
        .css('max-height', newHeight + 'px')
        .css('height', newHeight + 'px')
      element.css('max-height', newHeight - 1 + 'px')
      if (newHeight >= 100) {
        element.css('max-height', '99px')
        element.css({
          bottom: '5px'
        })
        $('.message-textbox')
          .css('max-height', '105px')
          .css('height', '105px')
      } else {
        element.css({
          bottom: '0'
        })
      }
    })

    $scope.chatTyping = function (event) {
      if (event.shiftKey & (event.keyCode === 13) || (event.keyCode === 13 && ionic.Platform.isWebView())) {
        return
      }
      if (event.keyCode === 13 && !ionic.Platform.isWebView()) {
        //Send
        event.preventDefault()
        return $scope.sendChatMessage()
      }

      if (isTyping) {
        clearTimeout(typingTimer)
        typingTimer = setTimeout(stopTyping, 5000)
        return
      }

      isTyping = true

      if (typingTimer == undefined) typingTimer = setTimeout(stopTyping, 5000)
      WebSocket.startTyping($scope.conversation._id, $scope.conversation.partner._id, $localStorage.loggedInUser._id)
    }

    function partnerTyping (data) {
      $timeout(function () {
        partnerTyping = true
      }, 0)
    }

    // Functions
    function stopTyping () {
      typingTimer = undefined
      isTyping = false
      if ($scope.conversation === undefined) return
      WebSocket.stopTyping($scope.conversation._id, $scope.conversation.partner._id)
    }
    // this keeps the keyboard open on a device only after sending a message, it is non obtrusive
    function keepKeyboardOpen () {
      txtInput.one('blur', function () {
        txtInput[0].focus()
      })
    }

    $scope.shouldShowDate = function (date) {
      var now = moment()
      var dMoment = moment(date)
      var timeDiff = now.diff(dMoment, 'minutes')
      if (timeDiff > 60) return true
      else return false
    }

    //Loading more messages on Scrolling
    $scope.canFetchMoreMessages = function () {
      if ($scope.hasMore === undefined) $scope.hasMore = true

      return $scope.hasMore
    }

    $scope.loadMore = function () {
      console.log('loading more')
      i++
      if (i > 10) $scope.hasMore = false

      if ($scope.conversation !== undefined) {
        for (var j = 0; j < 11; j++) {
          var message = {
            createdAt: new Date(),
            body: 'here',
            owner: $localStorage.loggedInUser,
            _id: Math.random()
          }
          $scope.conversation.messages.unshift(message)
        }
      }

      $timeout(function () {
        viewScroll.scrollBy(0, 150, true)
      })
      $timeout(function () {
        $scope.$broadcast('scroll.infiniteScrollComplete')
      }, 3000)
    }

    $scope.sendChatMessage = function () {
      if (_.isEmpty($scope.message.body)) return false
      $scope.message.ownerId = $scope.loggedInUser._id
      var scopeMessageClone = _.clone($scope.message)
      $scope.message.body = ''
      Messages.sendMessage($scope.conversation._id, scopeMessageClone).then(
        function (response) {
          var message = response.data.message
          WebSocket.send(
            $scope.conversation._id,
            $scope.conversation.partner._id,
            $scope.loggedInUser._id,
            message._id,
            message.body
          )
          stopTyping()
          keepKeyboardOpen()
          scrollBottom()
        },
        function (err) {
          console.log(err)
        }
      )
    }
  })

function ensureLogin ($localStorage, $state) {
  if ($localStorage.server === undefined || $localStorage.accessToken === undefined) return $state.go('login')
}

angular
  .module('trudesk.controllers.ticketDetails', [])
  .controller('TicketsDetailCtrl', function (
    $scope,
    $state,
    $stateParams,
    $ionicHistory,
    $ionicNavBarDelegate,
    $localStorage,
    $ionicModal,
    $ionicPopover,
    $ionicActionSheet,
    Tickets,
    Users,
    Roles
  ) {
    $ionicNavBarDelegate.showBackButton(true)

    $scope.showSnackbar = function (text, error) {
      if (_.isUndefined(error)) error = false

      var textColor = '#FFFFFF'

      if (error) textColor = '#ef473a'

      Snackbar.show({
        text: text,
        showAction: false,
        duration: 3000,
        textColor: textColor
      })
    }

    $scope.server = $localStorage.server
    $scope.loggedInUser = undefined
    $scope.commentModalForm = {
      comment: ''
    }
    $scope.noteModalForm = {
      note: ''
    }

    $scope.hasNotes = Roles.canUser('tickets:notes')
    $scope.isAgent = Roles.canUser('agent:*') || Roles.canUser('admin:*')
    Roles.flushRoles().then(function () {
      $scope.hasNotes = Roles.canUser('tickets:notes')
      $scope.isAgent = Roles.canUser('agent:*') || Roles.canUser('admin:*')
    })

    $ionicModal
      .fromTemplateUrl('templates/modals/modal-ticket-details.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function (modal) {
        $scope.ticketDetailModal = modal
      })

    $ionicModal
      .fromTemplateUrl('templates/modals/modal-addComment.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function (modal) {
        $scope.addCommentModal = modal
      })

    $ionicModal
      .fromTemplateUrl('templates/modals/modal-addNote.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function (modal) {
        $scope.addNoteModal = modal
      })

    $ionicModal
      .fromTemplateUrl('templates/modals/modal-ticket-setAssignee.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
      })
      .then(function (modal) {
        $scope.setAssigneeModal = modal
      })

    Tickets.get($stateParams.ticketuid).then(function successCallback (response) {
      $scope.ticket = response.data.ticket
      if ($scope.ticket.assignee) $scope.selectedAssignee = $scope.ticket.assignee._id
      if ($scope.ticket.owner.image === undefined) $scope.ticket.owner.image = 'defaultProfile.jpg'
      $scope.hasAssignee = 'hide'
      if ($scope.ticket.assignee !== undefined) $scope.hasAssignee = 'show'
      if ($scope.ticket.assignee !== undefined && $scope.ticket.assignee.image === undefined)
        $scope.ticket.assignee.image = 'defaultProfile.jpg'

      if ($scope.hasNotes)
        $scope.ticket.commentsMerged = _.sortBy(_.union($scope.ticket.comments, $scope.ticket.notes), 'date')
      else $scope.ticket.commentsMerged = $scope.ticket.comments
    })

    Users.getAssignees().then(
      function successCallback (response) {
        $scope.assignees = response.data.users
      },
      function errorCallback (response) {
        console.log(response)
      }
    )

    //Right Nav Popover
    $scope.popover = $ionicPopover
      .fromTemplateUrl('templates/popover/popover-ticket-details.html', {
        scope: $scope
      })
      .then(function (popover) {
        $scope.popover = popover
      })

    $scope.showStatusActionSheet = function () {
      $scope.popover.hide()
      $ionicActionSheet.show({
        buttons: [{ text: 'Open' }, { text: 'Pending' }, { text: 'Closed' }],
        titleText: 'Set Ticket Status',
        cancelText: 'Cancel',
        cancel: function () {
          return true
        },
        buttonClicked: function (index) {
          switch (index) {
            case 0:
              var reqTicket = { _id: $scope.ticket._id }
              reqTicket.status = 1
              Tickets.update(reqTicket).then(
                function successCallback (response) {
                  $scope.ticket.status = 1
                  $scope.showSnackbar('Ticket status set to Open')
                },
                function errorCallback (response) {
                  console.log(response)
                }
              )
              return true
            case 1:
              var reqTicket = { _id: $scope.ticket._id }
              reqTicket.status = 2
              Tickets.update(reqTicket).then(
                function successCallback (response) {
                  $scope.ticket.status = 2
                  $scope.showSnackbar('Ticket status set to Pending')
                },
                function errorCallback (response) {
                  console.log(response)
                }
              )
              return true
            case 2:
              var reqTicket = { _id: $scope.ticket._id }
              reqTicket.status = 3
              $scope.ticket.status = 3
              Tickets.update(reqTicket).then(
                function successCallback (response) {
                  ionic.trigger('$trudesk.refreshTickets', {})
                  $scope.popover.hide()
                  $ionicHistory.goBack()
                },
                function errorCallback (response) {
                  console.log(response)
                }
              )
              return true
            default:
              return true
          }
        }
      })
    }

    $scope.setAssigneeChanged = function () {
      $scope.selectedAssignee = this.selectedAssignee
    }

    $scope.showAddComment = function ($event) {
      Users.getLoggedInUser()
        .then(function (user) {
          $scope.loggedInUser = user
        })
        .then(function () {
          $scope.popover.hide()
          $scope.addCommentModal.show()
        })
    }

    $scope.closeAddComment = function () {
      $scope.commentModalForm.comment = ''
      $scope.addCommentModal.hide()
    }

    $scope.showAddNote = function ($event) {
      Users.getLoggedInUser()
        .then(function (user) {
          $scope.loggedInUser = user
        })
        .then(function () {
          $scope.addNoteModal.show()
          $scope.popover.hide()
        })
    }

    $scope.closeAddNote = function () {
      $scope.noteModalForm.note = ''
      $scope.addNoteModal.hide()
    }

    $scope.openSetAssigneeModal = function () {
      $scope.setAssigneeModal.show()
      $scope.popover.hide()
    }

    $scope.closeSetAssigneeModal = function () {
      if ($scope.setAssigneeModal !== undefined) $scope.setAssigneeModal.hide()
    }

    $scope.showTicketDetails = function () {
      $scope.ticketDetailModal.show()
      $scope.popover.hide()
    }

    $scope.closeTicketDetailsModal = function () {
      $scope.ticketDetailModal.hide()
    }

    $scope.closeTicket = function () {
      $scope.ticket.status = 3
      Tickets.update($scope.ticket).then(
        function successCallback (response) {
          ionic.trigger('$trudesk.refreshTickets', {})
          $scope.popover.hide()
          $ionicHistory.goBack()
        },
        function errorCallback (response) {
          console.log(response)
        }
      )
    }

    //Form Submits
    $scope.addCommentFormSubmit = function () {
      var comment = {
        ownerId: $scope.loggedInUser._id,
        comment: this.commentModalForm.comment
      }

      Tickets.addComment($scope.ticket, comment)
        .then(
          function successCallback (response) {
            //Comment Added
          },
          function errorCallback (err) {
            console.log(err)
            $scope.showSnackbar(err, true)
          }
        )
        .then(function () {
          Tickets.get($stateParams.ticketuid)
            .then(function successCallback (response) {
              $scope.ticket = response.data.ticket
              //Merge Arrays for Note Displaying
              if ($scope.hasNotes)
                $scope.ticket.commentsMerged = _.sortBy(_.union($scope.ticket.comments, $scope.ticket.notes), 'date')
              else $scope.ticket.commentsMerged = $scope.ticket.comments

              if ($scope.ticket.owner.image === undefined) $scope.ticket.owner.image = 'defaultProfile.jpg'
            })
            .then(function () {
              $scope.commentModalForm.comment = ''
              $scope.closeAddComment()
            })
        })
    }

    $scope.addNoteFormSubmit = function () {
      var note = {
        ownerId: $scope.loggedInUser._id,
        note: this.noteModalForm.note
      }

      Tickets.addNote($scope.ticket, note)
        .then(
          function successCallback (response) {
            //Note Added
          },
          function errorCallback (err) {
            console.log(err)
            $scope.showSnackbar(err, true)
          }
        )
        .then(function () {
          Tickets.get($stateParams.ticketuid)
            .then(function successCallback (response) {
              $scope.ticket = response.data.ticket

              if ($scope.hasNotes)
                $scope.ticket.commentsMerged = _.sortBy(_.union($scope.ticket.comments, $scope.ticket.notes), 'date')
              else $scope.ticket.commentsMerged = $scope.tickets.comments

              if ($scope.ticket.owner.image === undefined) $scope.ticket.owner.image = 'defaultProfile.jpg'
            })
            .then(function () {
              $scope.noteModalForm.note = ''
              $scope.closeAddNote()
            })
        })
    }

    $scope.setAssigneeFormSubmit = function () {
      if (!$scope.ticket) {
        $scope.showSnackbar('Invalid Ticket Object', true)
        return
      }

      if ($scope.ticket.assignee && $scope.ticket.assignee._id === $scope.selectedAssignee) {
        $scope.setAssigneeModal.hide()
        return
      }

      $scope.ticket.assignee = $scope.selectedAssignee

      Tickets.update($scope.ticket).then(
        function successCallback (response) {
          $scope.ticket = response.data.ticket

          $scope.hasAssignee = 'hide'
          if ($scope.ticket.assignee !== undefined) $scope.hasAssignee = 'show'
          if ($scope.ticket.assignee !== undefined && $scope.ticket.assignee.image === undefined)
            $scope.ticket.assignee.image = 'defaultProfile.jpg'

          if ($scope.hasNotes)
            $scope.ticket.commentsMerged = _.sortBy(_.union($scope.ticket.comments, $scope.ticket.notes), 'date')
          else $scope.ticket.commentsMerged = $scope.ticket.comments

          $scope.setAssigneeModal.hide()
        },
        function errorCallback (response) {
          console.log(response.data)
          $scope.showSnackbar('Error: ' + response.data, true)
        }
      )
    }

    $scope.$on('$ionicView.beforeEnter', function () {
      ensureLogin($localStorage, $state)
    })

    $scope.$on('$destroy', function () {
      $scope.popover.remove()
      $scope.addCommentModal.remove()
      $scope.addNoteModal.remove()
      $scope.ticketDetailModal.remove()
      $scope.setAssigneeModal.remove()
    })
  })

function ensureLogin ($localStorage, $state) {
  if ($localStorage.server === undefined || $localStorage.accessToken === undefined) return $state.go('login')
}

angular
  .module('trudesk.controllers.tickets', [])
  .controller('TicketsCtrl', function (
    $scope,
    $state,
    $timeout,
    $stateParams,
    $localStorage,
    $ionicListDelegate,
    $ionicNavBarDelegate,
    $ionicModal,
    $ionicPopup,
    $ionicActionSheet,
    $ionicLoading,
    $q,
    Tickets,
    Users,
    Groups,
    TicketTypes,
    Roles
  ) {
    $ionicNavBarDelegate.showBackButton(true)

    $ionicModal
      .fromTemplateUrl('templates/modals/modal-newticket.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function (modal) {
        $scope.newTicketModal = modal
      })

    $ionicModal
      .fromTemplateUrl('templates/modals/modal-ticket-filter.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function (modal) {
        $scope.filterTicketModal = modal
      })

    $ionicModal
      .fromTemplateUrl('templates/modals/modal-addComment.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function (modal) {
        $scope.addCommentModal = modal
      })

    //SETUP VARS
    // $scope.server = $localStorage.server;
    $scope.showLoadingTickets = true
    $scope.search = {
      term: ''
    }
    $scope.filter = {}
    $scope.filter.showClosedTickets = $localStorage.showClosedTickets
    $scope.filter.showOnlyAssigned = $localStorage.showOnlyAssigned
    $scope.commentModalForm = {
      comment: '',
      ticket: ''
    }

    $scope.hasNotes = Roles.canUser('tickets:notes')
    $scope.isAgent = Roles.canUser('agent:*') || Roles.canUser('admin:*')
    Roles.flushRoles().then(function () {
      $timeout(function () {
        $scope.hasNotes = Roles.canUser('tickets:notes')
        $scope.isAgent = Roles.canUser('agent:*') || Roles.canUser('admin:*')
      }, 1)
    })

    $scope.showSnackbar = function (text, error) {
      if (_.isUndefined(error)) error = false

      var textColor = '#FFFFFF'

      if (error) textColor = '#ef473a'

      Snackbar.show({
        text: text,
        showAction: true,
        actionText: 'X',
        actionTextColor: '#ccc',
        duration: 3000,
        textColor: textColor
      })
    }

    $scope.showActionSheet = function ($event, $ticket) {
      $ionicListDelegate.closeOptionButtons()
      var buttons = [{ text: 'Add Comment' }]

      if ($scope.isAgent) {
        buttons.push({ text: 'Open' })
        buttons.push({ text: 'Pending' })
        buttons.push({ text: 'Closed' })
      }
      var sheet = $ionicActionSheet.show({
        buttons: buttons,
        titleText: 'Ticket Options',
        cancelText: 'Cancel',
        cancel: function () {},
        buttonClicked: function (index) {
          switch (index) {
            case 0:
              var t = _.find($scope.tickets, function (obj) {
                return obj._id == $ticket._id
              })
              $scope.commentModalForm.ticket = t
              $scope.addCommentModal.show()
              return true
              break
            case 1:
              var t = _.find($scope.tickets, function (obj) {
                return obj._id == $ticket._id
              })
              var reqTicket = { _id: t._id }
              reqTicket.status = 1
              Tickets.update(reqTicket).then(
                function successCallback (response) {
                  t.status = 1
                  $scope.showSnackbar('Ticket status set to Open')
                },
                function errorCallback (response) {
                  console.log(response)
                }
              )
              return true
            case 2:
              var t = _.find($scope.tickets, function (obj) {
                return obj._id == $ticket._id
              })
              var reqTicket = { _id: t._id }
              reqTicket.status = 2
              Tickets.update(reqTicket).then(
                function successCallback (response) {
                  t.status = 2
                  $scope.showSnackbar('Ticket status set to Pending')
                },
                function errorCallback (response) {
                  console.log(response)
                }
              )
              return true
            case 3:
              var t = _.find($scope.tickets, function (obj) {
                return obj._id == $ticket._id
              })
              var reqTicket = { _id: t._id }
              reqTicket.status = 3
              Tickets.update(reqTicket)
                .then(
                  function successCallback (response) {
                    var idx = $scope.tickets.indexOf(t)
                    if (idx != -1) $scope.tickets.splice(idx, 1)
                    $scope.showSnackbar('Ticket status set to Closed')
                  },
                  function errorCallback (response) {
                    console.log(response)
                  }
                )
                .finally(function () {
                  if (_.size($scope.tickets) < 1) $scope.showNoTickets = true
                  else $scope.showNoTickets = false
                })
              return true
            default:
              return true
          }
        }
      })
    }

    $scope.doRefresh = function () {
      $scope.search.term = ''
      $scope.shouldRefresh = true
      $scope.fetchTickets().finally(function () {
        $scope.$broadcast('scroll.refreshComplete')
      })
    }

    $scope.getUserImage = function (imageFile) {
      var url = 'http://' + $localStorage.server + '/uploads/users/' + imageFile

      return Users.getImage(url).then(function (image) {
        console.log(image)
      })
    }

    $scope.fetchTickets = function () {
      angular
        .element(document)
        .find('ion-item')
        .removeClass('item-remove-animate')
      if ($scope.page == undefined) $scope.page = 0

      if ($scope.shouldRefresh) {
        $scope.page = 0
        $scope.hasMoreTickets = true
        $scope.shouldRefresh = false
      }

      return Tickets.all($scope.page)
        .then(
          function successCallback (response) {
            if (_.size(response.data) < 1) {
              $scope.hasMoreTickets = false
              return
            }

            if ($scope.page == 0) {
              $scope.tickets = response.data
            } else {
              var a = $scope.tickets
              if (_.size(a) > 0)
                $scope.tickets = _.uniq(_.union(a, response.data), false, function (i, k, a) {
                  return i._id
                })
            }
          },
          function errorCallback (error) {
            $scope.$broadcast('scroll.infiniteScrollComplete')
            $scope.hasMoreTickets = false
            if (error.status === -1) return $scope.showAlert('Error', 'Connection Refused.')
            if (error.status === 401) {
              ionic.trigger('$trudesk.clearLoginForm', {})
              $localStorage.server = undefined
              $localStorage.accessToken = undefined
              $state.go('login')
              return $scope.showAlert('Error', 'You have been logged out.')
            }
            $scope.showAlert('Error', 'Error Status: ' + error.status)
          }
        )
        .finally(function () {
          $scope.showLoadingTickets = false
          if (_.size($scope.tickets) > 0) $scope.showNoTickets = false
          else $scope.showNoTickets = true

          $scope.page++
          $scope.$broadcast('scroll.infiniteScrollComplete')
        })
    }

    $scope.canFetchMoreTickets = function () {
      if ($scope.hasMoreTickets === undefined) $scope.hasMoreTickets = true

      return $scope.hasMoreTickets
    }

    $scope.selected = {
      group: '',
      ticketType: '',
      priority: ''
    }

    $scope.$watch(
      'selected.ticketType',
      function (newValue, oldValue, scope) {
        if (newValue && newValue.priorities) $scope.selected.priority = newValue.priorities[0]
      },
      true
    )

    $scope.openNewTicket = function () {
      var groups = Groups.all(),
        types = TicketTypes.all()

      $q.all([groups, types])
        .then(
          function successCallback (results) {
            $scope.groups = results[0].data.groups
            $scope.ticketTypes = results[1].data
            if ($scope.ticketTypes[0] && $scope.ticketTypes[0]._id) $scope.selected.ticketType = $scope.ticketTypes[0]
            $scope.modalNewTicketForm = {
              subject: '',
              issue: ''
            }
            $scope.selected.group = ''
          },
          function errorCallback (error) {
            console.error('Error - ' + error)
          }
        )
        .then(function () {
          $scope.newTicketModal.show()
        })
    }

    $scope.closeNewTicket = function () {
      $scope.newTicketModal.hide()
    }

    $scope.openFilterTicket = function () {
      $scope.filterTicketModal.show()
    }

    $scope.applyTicketFilter = function () {
      $scope.closeTicketFilter()
    }

    $scope.closeTicketFilter = function () {
      if ($scope.search.term !== '') {
        $scope.tickets = []
        $scope.filterTicketModal.hide()
        Snackbar.show({
          text: 'Loading...',
          showAction: false,
          duration: 2147483647, // Max duration..24days
          textColor: '#FFFFFF'
        })

        return Tickets.search($scope.search.term).then(
          function successCallback (response) {
            $scope.tickets = response.data.tickets

            $timeout(function () {
              if (_.size($scope.tickets) < 1) $scope.showNoTickets = true
              else $scope.showNoTickets = false
            }, 0)

            $scope.hasMoreTickets = false
            Snackbar.close()
          },
          function errorCallback (response) {
            console.log(response)
          }
        )
      }

      $scope.filterTicketModal.hide()
      if ($scope.shouldRefresh) $scope.fetchTickets()
    }

    $scope.clearTicketFilter = function () {
      $scope.search.term = ''
      $scope.tickets = null
      $scope.filter.showClosedTickets = false
      $scope.filter.showOnlyAssigned = false
      $localStorage.showClosedTickets = false
      $localStorage.showOnlyAssigned = false

      ionic.trigger('$trudesk.refreshTickets', {})
      $scope.filterTicketModal.hide()
    }

    $scope.searchTermChanged = function () {
      $scope.shouldRefresh = true
    }

    $scope.showClosedTicketsChanged = function () {
      $scope.filter.showClosedTickets = this.filter.showClosedTickets
      $localStorage.showClosedTickets = $scope.filter.showClosedTickets
      $scope.shouldRefresh = true
    }

    $scope.showOnlyAssigneedChanged = function () {
      $scope.filtershowOnlyAssigneed = this.filter.showOnlyAssigned
      $localStorage.showOnlyAssigned = $scope.filter.showOnlyAssigned
      $scope.shouldRefresh = true
    }

    $scope.closeAddComment = function () {
      $scope.addCommentModal.hide()
    }

    $scope.modalNewTicketForm = {
      subject: '',
      issue: ''
    }

    $scope.addCommentFormSubmit = function () {
      var comment = {
        ownerId: $scope.loggedInUser._id,
        comment: this.commentModalForm.comment
      }

      Tickets.addComment($scope.commentModalForm.ticket, comment)
        .then(
          function successCallback (response) {
            //Comment Added
          },
          function errorCallback (err) {
            console.log(err)
            $scope.showSnackbar(err, true)
          }
        )
        .then(function () {
          $scope.commentModalForm.comment = ''
          $scope.commentModalForm.ticket = ''
          $scope.closeAddComment()
        })
    }

    $scope.submitNewTicket = function ($event) {
      $event.preventDefault()
      var ticket = {
        type: $scope.selected.ticketType,
        subject: this.modalNewTicketForm.subject,
        issue: this.modalNewTicketForm.issue,
        group: $scope.selected.group,
        priority: $scope.selected.priority
      }

      if (!ticket.type || !ticket.subject || !ticket.issue || !ticket.group || !ticket.priority) {
        // Show Error

        return
      }

      Tickets.create(ticket)
        .then(
          function successCallback (response) {
            ionic.trigger('$trudesk.refreshTickets', {})
            $scope.modalNewTicketForm = {
              subject: '',
              issue: ''
            }
            $scope.closeNewTicket()
          },
          function errorCallback (response) {
            console.log('Error----')
            console.log(response)
            $scope.showAlert('Error: ' + response.statusText, response.data.error.message)
          }
        )
        .then(function () {})
    }

    $scope.showAlert = function (title, text, button) {
      if (button === undefined) button = 'button-assertive'
      return $ionicPopup.alert({
        title: title,
        template: text,
        okType: button
      })
    }

    ionic.on('$trudesk.refreshTickets', function () {
      $scope.doRefresh()
    })

    $scope.$on('$ionicView.beforeEnter', function () {
      ensureLogin($localStorage, $state)
      $scope.server = $localStorage.server
      Users.getLoggedInUser().then(
        function (user) {
          $scope.loggedInUser = user
        },
        function (err) {
          console.log(err)
        }
      )
    })

    $scope.$on('$ionicView.enter', function () {
      if (_.size($scope.tickets) < 1) $scope.doRefresh()
    })

    $scope.$on('$destroy', function () {
      $scope.newTicketModal.remove()
      $scope.filterTicketModal.remove()
      $scope.addCommentModal.remove()
    })
  })

function ensureLogin ($localStorage, $state) {
  if ($localStorage.server === undefined || $localStorage.accessToken === undefined) return $state.go('login')
}
