angular.module('trudesk.controllers.messages.conversation', []).controller('ConversationCtrl', function (
  $rootScope, $scope, $state, $stateParams, $localStorage, $ionicListDelegate, $ionicNavBarDelegate, $ionicModal,
  $ionicPopup, $ionicPopover, $ionicActionSheet, $ionicLoading, $ionicScrollDelegate, $ionicHistory, $interval, $timeout, $q, moment, WebSocket, Messages, Users) {

  $ionicNavBarDelegate.showBackButton(true);

  var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');

  //Vars
  $scope.server = $localStorage.server;
  $scope.isUserOnline = Users.isUserOnline;
  $scope.onlineUsers = {};
  $scope.message = {
    body: ''
  };
  $scope.messages = [];
  $scope.partnerTyping = false;

  $ionicPopover.fromTemplateUrl('templates/popover/popover-messages-conversation.html', {
    scope: $scope
  }).then(function (popover) {
    $scope.popover = popover;
  });

  //Private
  var txtInput; // gets set in $ionicView.enter
  var typingTimer = null;
  var partnerTypingTimer = null;
  var isTyping = false;

  //EVENTS
  $scope.$on('$ionicView.beforeEnter', function () {
    ensureLogin($localStorage, $state);
    $scope.server = $localStorage.server;
    Users.getLoggedInUser().then(function (user) {
      $scope.loggedInUser = user;
      $scope.getConversation();
    }, function (err) {
      console.log(err);
    }).then(function () {
      window.addEventListener('native.keyboardshow', onKeyboardShow);
      window.addEventListener('native.keyboardhide', onKeyboardHide);
      window.addEventListener('$trudesk.converstation.chatmessage', onChatMessage);
      window.addEventListener('$trudesk.conversation.updateusers', onUpdateUsers);
      // ionic.on('$trudesk.conversation.chatmessage', onChatMessage, window);
      ionic.on('$trudesk.conversation.usertyping', onPartnerTyping, window);
      ionic.on('$trudesk.conversation.userstoptyping', onPartnerStopTyping, window);
      // ionic.on('$trudesk.conversation.updateusers', onUpdateUsers, window);
    }).then(function() {
      $timeout(function() {
        WebSocket.updateUsers();
      }, 0);
    });
  });

  $scope.$on('$ionicView.enter', function () {
    txtInput = angular.element(document.body.querySelector('#message-textarea'));
  });

  $scope.$on('$stateChangeStart', function (e) {
    window.removeEventListener('native.keyboardshow', onKeyboardShow);
    window.removeEventListener('native.keyboardhide', onKeyboardHide);
    window.removeEventListener('$trudesk.conversation.chatmessage', onChatMessage);

    ionic.off('$trudesk.conversation.usertyping', onPartnerTyping, window);
    ionic.off('$trudesk.conversation.userstoptyping', onPartnerStopTyping, window);
    window.removeEventListener('$trudesk.conversation.updateusers', onUpdateUsers);

    stopTyping();
    typingTimer = undefined;
    partnerTypingTimer = undefined;
  });

  function scrollBottom() {
    $timeout(function () {
      viewScroll.scrollBottom();
    }, 10);
  }

  function onKeyboardShow(e) {
    scrollBottom();
  }

  function onKeyboardHide(e) {
    scrollBottom();
  }

  function onPartnerTyping(data) {
    if ($scope.partnerTyping) {
      clearTimeout(partnerTypingTimer);
      partnerTypingTimer = setTimeout(cancelPartnerTyping, 15000);
      return;
    }

    $scope.partnerTyping = true;
    scrollBottom();

    if (partnerTypingTimer == undefined)
      partnerTypingTimer = setTimeout(cancelPartnerTyping, 15000);
  }

  function onPartnerStopTyping(data) {
    $timeout(function () {
      $scope.partnerTyping = false;
    }, 0);
  }

  function cancelPartnerTyping() {
    $timeout(function () {
      $scope.partnerTyping = false;
      partnerTypingTimer = undefined;
    }, 0);
  };

  function onChatMessage(data) {
    var m = {
      _id: data.detail.messageId,
      createdAt: new Date().toISOString(),
      owner: data.detail.fromUser,
      body: data.detail.message
    };

    $timeout(function () {
      $scope.messages.push(m);

      if (viewScroll != undefined)
        scrollBottom();
    }, 0);
  }

  function onUpdateUsers(data) {
    $timeout(function () {
      $scope.onlineUsers = data.detail;
    }, 0);
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
    if ($scope.page == undefined)
      $scope.page = 0;

    return Messages.getConversation($stateParams.conversationid, $scope.page).then(function (response) {
      $scope.conversation = response.data.conversation;

      //Set partner ID
      for (var i = 0; i < $scope.conversation.participants.length; i++) {
        if ($scope.conversation.participants[i].username != $scope.loggedInUser.username)
          $scope.conversation.partner = $scope.conversation.participants[i];
      }

      if (_.size(response.data.messages) < 1) {
        $scope.hasMore = false;
        return;
      }

      if ($scope.page == 0)
        $scope.messages = response.data.messages.reverse();
      else {
        var a = $scope.messages;
        if (_.size(a) > 0)
          $scope.messages = _.uniq(_.union(a, response.data.messages), false, function(i, k, a){ return i._id });
          $scope.messages = _.sortBy($scope.messages, function(message){
            return message.createdAt;
          });
      }

      if (_.size(response.data.messages) < 10) {
        $scope.hasMore = false;
      }
    }, function (err) {
      console.log(err);
    }).then(function () {
      $timeout(function () {
        if ($scope.page == 0)
          scrollBottom();
        else
          $timeout(function () {
            viewScroll.scrollBy(0, 150, true);
          });

        $scope.page++;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }, 0);
    });
  };

  $scope.$on('elastic:resize', function (event, element, oldHeight, newHeight) {
    $('.message-textbox').css('max-height', newHeight + 'px').css('height', newHeight + 'px');
    element.css('max-height', newHeight - 1 + 'px');
    if (newHeight >= 100) {
      element.css('max-height', '99px');
      element.css({
        'bottom': '5px'
      });
      $('.message-textbox').css('max-height', '105px').css('height', '105px');
    } else {
      element.css({
        bottom: '0'
      });
    }
  });

  $scope.chatTyping = function (event) {
    if ((event.shiftKey & event.keyCode === 13) || (event.keyCode === 13 && ionic.Platform.isWebView())) {
      return;
    }
    if (event.keyCode === 13 && !ionic.Platform.isWebView()) {
      //Send
      event.preventDefault();
      return $scope.sendChatMessage();
    }

    if (isTyping) {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(stopTyping, 5000);
      return;
    }

    isTyping = true;

    if (typingTimer == undefined)
      typingTimer = setTimeout(stopTyping, 5000);
    WebSocket.startTyping($scope.conversation._id, $scope.conversation.partner._id, $localStorage.loggedInUser._id);
  };

  function partnerTyping(data) {
    $timeout(function () {
      partnerTyping = true;
    }, 0);
  };

  // Functions
  function stopTyping() {
    typingTimer = undefined;
    isTyping = false;
    if ($scope.conversation === undefined) return;
    WebSocket.stopTyping($scope.conversation._id, $scope.conversation.partner._id);
  }
  // this keeps the keyboard open on a device only after sending a message, it is non obtrusive
  function keepKeyboardOpen() {
    txtInput.one('blur', function () {
      txtInput[0].focus();
    });
  }

  $scope.shouldShowDate = function (date) {
    var now = moment();
    var dMoment = moment(date);
    var timeDiff = now.diff(dMoment, 'minutes');
    if (timeDiff > 60)
      return true;
    else
      return false;
  };


  //Loading more messages on Scrolling
  $scope.canFetchMoreMessages = function() {
    if ($scope.hasMore === undefined)
      $scope.hasMore = true;

      return $scope.hasMore;
  };

  $scope.loadMore = function () {
    console.log('loading more');
    i++;
    if (i > 10)
      $scope.hasMore = false;

    if ($scope.conversation !== undefined) {
      for (var j = 0; j < 11; j++) {
        var message = {
          createdAt: new Date(),
          body: 'here',
          owner: $localStorage.loggedInUser,
          _id: Math.random()
        };
        $scope.conversation.messages.unshift(message);
      }
    }

    $timeout(function () {
      viewScroll.scrollBy(0, 150, true);
    });
    $timeout(function () {
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }, 3000);
  };


  $scope.sendChatMessage = function () {
    if (_.isEmpty($scope.message.body)) return false;
    $scope.message.ownerId = $scope.loggedInUser._id;
    var scopeMessageClone = _.clone($scope.message);
    $scope.message.body = '';
    Messages.sendMessage($scope.conversation._id, scopeMessageClone).then(function (response) {

      var message = response.data.message;
      WebSocket.send($scope.conversation._id, $scope.conversation.partner._id, $scope.loggedInUser._id, message._id, message.body);
      stopTyping();
      keepKeyboardOpen();
      scrollBottom();
    }, function (err) {
      console.log(err);
    });
  };
});

function ensureLogin($localStorage, $state) {
  if ($localStorage.server === undefined || $localStorage.accessToken === undefined)
    return $state.go('login');
}
