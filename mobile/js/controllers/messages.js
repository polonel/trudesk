angular.module('trudesk.controllers.messages', []).controller('MessagesCtrl', function (
  $scope, $state, $stateParams, $localStorage, $ionicListDelegate, $ionicNavBarDelegate, $ionicModal,
  $ionicPopup, $ionicActionSheet, $ionicLoading, $ionicScrollDelegate, $ionicFilterBarConfig, $ionicFilterBar, $timeout, $q, WebSocket, Messages, Users) {

  $ionicNavBarDelegate.showBackButton(true);
  $ionicFilterBarConfig.theme = 'dark';

  //Modals
  $ionicModal.fromTemplateUrl('templates/modals/modal-messages-newconversation.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.newConversation = modal;
  });

  $scope.server = $localStorage.server;

  //Socket.io
  $scope.socket = WebSocket;
  $scope.recentConversations = [];
  $scope.isUserOnline = Users.isUserOnline;
  $scope.onlineUsers = [];
  $scope.userList = [];
  
  //EVENTS
  $scope.$on('$ionicView.beforeEnter', function () {
    ensureLogin($localStorage, $state);
    $scope.server = $localStorage.server;
    Users.getLoggedInUser().then(function (user) {
      $scope.loggedInUser = user;
    }, function (err) {
      console.log(err);
    }).then(function () {
      ionic.on('$trudesk.conversation.updateusers', onUpdateUsers, window);
      $timeout(function () {
        $scope.loadRecentConversations();
      }, 0);
    });
  });

  $scope.$on("$ionicView.enter", function (scopes, states) {
    
  });

  $scope.$on('$stateChangeStart', function (e) {
    ionic.off('$trudesk.conversation.updateusers', onUpdateUsers, window);
  });

  // Functions
  $scope.loadRecentConversations = function () {
    Messages.getRecent().then(function (response) {
      //Success
      $scope.recentConversations = response.data.conversations;
      $scope.showRecentConversations = _.size($scope.recentConversations) >= 1;
    }, function (err) {
      console.log(err);
      $scope.showRecentConversations = false;
    });
  };

  $scope.showNewConversation = function () {
    $scope.getUserList().then(function () {
      $scope.newConversation.show();
    });
  };

  $scope.hideNewConversation = function () {
    if (filterBarInstance) {
      filterBarInstance();
      filterBarInstance = null;
    }

    $scope.newConversation.hide();
  };

  $scope.startConversation = function (userId) {
    Messages.startConversation(userId).then(function (response) {
      var convoId = response.data.conversation._id;
      if (convoId === undefined) {
        $scope.showSnackbar('Invalid Conversation Id', true);
      } else {
        if ($scope.newConversation !== undefined)
          $scope.hideNewConversation();
        return $state.go('tab.messages-conversation', {
          conversationid: convoId
        });
      }
    }, function (error) {
      $scope.showSnackbar(error, true);
      console.log(error);
    });
  };

  $scope.deleteConversation = function(convoId) {
    Messages.deleteConversation(convoId).then(function (response) {
      if (response.data.success) {
        var convo = _.find($scope.recentConversations, function(obj) { return obj._id.toString() === convoId.toString()});
        var idx = $scope.recentConversations.indexOf(convo);
        if (idx !== -1)
          $scope.recentConversations.splice(idx, 1);
      }
    }, function (error) {
      $scope.showSnackbar(error, true);
      console.log(error);
    }).finally(function() {
      //check for 0 recent Convo, and load the last;
      $timeout(function () {
        $scope.loadRecentConversations();
      }, 0);
    });
  };

  $scope.getUserList = function () {
    return Users.getUsers().then(function (res) {
      var list = res.data.users;
      for (var i = 0; i < list.length; i++) {
        if (list[i].username === $localStorage.loggedInUser.username)
          list.splice(i, 1);
        else {
          delete list[i].__v;
          delete list[i].accessToken;
          delete list[i].deleted;
          delete list[i].groups;
          delete list[i].iOSDeviceTokens;
          delete list[i].lastOnline;
          delete list[i].preferences;
          delete list[i].role;
          delete list[i].title;
        }

      }

      $scope.userList = list;
    }, function (err) {
      $scope.showSnackbar(err, true);
      console.log(err);
    });
  };

  var filterBarInstance;
  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.userList,
      container: '.modal',
      debounce: true,
      delay: 100,
      update: function (filteredItems, filterText) {
        $scope.userList = filteredItems;
      }
    });
  };

  $scope.showSnackbar = function (text, error) {
    if (_.isUndefined(error)) error = false;

    var textColor = '#FFFFFF';

    if (error)
      textColor = '#ef473a';

    Snackbar.show({
      text: text,
      showAction: false,
      duration: 3000,
      textColor: textColor
    });
  };

  function onUpdateUsers(data) {
    $timeout(function () {
      $scope.onlineUsers = data.detail;
      delete $scope.onlineUsers[$scope.loggedInUser.username];
      $ionicScrollDelegate.$getByHandle('activeUsersScroll').resize();
    }, 0);
  }

  $scope.isEmpty = function (items) {
    var bar;
    for (bar in items) {
      if (items.hasOwnProperty(bar)) {
        return false;
      }
    }

    return true;
  }

});

function ensureLogin($localStorage, $state) {
  if ($localStorage.server === undefined || $localStorage.accessToken === undefined)
    return $state.go('login');
}
