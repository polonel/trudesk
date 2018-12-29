angular.module('trudesk.controllers.tickets', []).controller('TicketsCtrl', function(
  $scope, $state, $timeout, $stateParams, $localStorage, $ionicListDelegate, $ionicNavBarDelegate, $ionicModal,
  $ionicPopup, $ionicActionSheet, $ionicLoading, $q, Tickets, Users, Groups, TicketTypes) {

  $ionicNavBarDelegate.showBackButton(true);

  $ionicModal.fromTemplateUrl('templates/modals/modal-newticket.html',  {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.newTicketModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/modals/modal-ticket-filter.html', {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.filterTicketModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/modals/modal-addComment.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
      $scope.addCommentModal = modal;
  });


  //SETUP VARS
  // $scope.server = $localStorage.server;
  $scope.showLoadingTickets = true;
  $scope.search = {
    term: ''
  };
  $scope.filter = {};
  $scope.filter.showClosedTickets = $localStorage.showClosedTickets;
  $scope.filter.showOnlyAssigned = $localStorage.showOnlyAssigned;
  $scope.commentModalForm = {
    comment: '',
    ticket: ''
  };

  $scope.isSupport = ($localStorage.loggedInUser.role == 'admin' || $localStorage.loggedInUser.role == 'mod' || $localStorage.loggedInUser.role == 'support');

  $scope.showSnackbar = function(text, error) {
      if (_.isUndefined(error)) error = false;

      var textColor = '#FFFFFF';

      if (error)
        textColor = '#ef473a';

      Snackbar.show({
        text: text,
        showAction: true,
        actionText: 'X',
        actionTextColor: '#ccc',
        duration: 3000,
        textColor: textColor
      });
  };

  $scope.showActionSheet = function($event, $ticket) {
      $ionicListDelegate.closeOptionButtons();
      var buttons = [
          { text: 'Add Comment' }
        ];

      if ($scope.isSupport) {
        buttons.push({ text: 'Open' });
        buttons.push({ text: 'Pending' });
        buttons.push({ text: 'Closed' });
      }
      var sheet = $ionicActionSheet.show({
        buttons: buttons,
        titleText: 'Ticket Options',
        cancelText: 'Cancel',
        cancel: function() {

        },
        buttonClicked: function(index) {
          switch (index) {
            case 0:
              var t = _.find($scope.tickets, function(obj){ return obj._id == $ticket._id; });
              $scope.commentModalForm.ticket = t;
              $scope.addCommentModal.show();
              return true;
              break;
            case 1:
              var t = _.find($scope.tickets, function(obj){ return obj._id == $ticket._id; });
              var reqTicket = {_id: t._id};
              reqTicket.status = 1;
              Tickets.update(reqTicket).then(function successCallback(response) {
                  t.status = 1;
                  $scope.showSnackbar('Ticket status set to Open');
              }, function errorCallback(response) {
                console.log(response);
              });
              return true;
          case 2:
            var t = _.find($scope.tickets, function(obj){ return obj._id == $ticket._id; });
            var reqTicket = {_id: t._id};
            reqTicket.status = 2;
            Tickets.update(reqTicket).then(function successCallback(response) {
              t.status = 2;
              $scope.showSnackbar('Ticket status set to Pending');
            }, function errorCallback(response) {
              console.log(response);
            });
            return true;
          case 3:
            var t = _.find($scope.tickets, function(obj){ return obj._id == $ticket._id; });
            var reqTicket = {_id: t._id};
            reqTicket.status = 3;
            Tickets.update(reqTicket).then(function successCallback(response) {
              var idx = $scope.tickets.indexOf(t);
              if (idx != -1)
                $scope.tickets.splice(idx, 1);
              $scope.showSnackbar('Ticket status set to Closed');
            }, function errorCallback(response) {
              console.log(response);
            }).finally(function() {
              if (_.size($scope.tickets) < 1)
                $scope.showNoTickets = true;
              else
                $scope.showNoTickets = false;
            });
            return true;
            default:
              return true;
          }
        }
      });
  };

  $scope.doRefresh = function() {
    $scope.search.term = '';
    $scope.shouldRefresh = true;
    $scope.fetchTickets().finally(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.getUserImage = function(imageFile) {
    var url = 'http://' + $localStorage.server + '/uploads/users/' + imageFile;
    
    return Users.getImage(url).then(function(image) {
      console.log(image);
    });
  }

  $scope.fetchTickets = function() {
      angular.element(document).find('ion-item').removeClass('item-remove-animate');
      if ($scope.page == undefined)
        $scope.page = 0;

      if ($scope.shouldRefresh) {
        $scope.page = 0;
        $scope.hasMoreTickets = true;
        $scope.shouldRefresh = false;
      }

      return Tickets.all($scope.page).then(function successCallback(response) {
          if (_.size(response.data) < 1) {
            $scope.hasMoreTickets = false;
            return;
          }

          if ($scope.page == 0) {
            $scope.tickets = response.data;
          } else {
            var a = $scope.tickets;
            if (_.size(a) > 0)
              $scope.tickets = _.uniq(_.union(a, response.data), false, function(i, k, a){ return i._id; });
          }

      }, function errorCallback(error) {
        $scope.$broadcast('scroll.infiniteScrollComplete');
        $scope.hasMoreTickets = false;
        if (error.status === -1)
          return $scope.showAlert('Error', 'Connection Refused.');
        if (error.status === 401) {
          ionic.trigger('$trudesk.clearLoginForm', {});
          $localStorage.server = undefined;
          $localStorage.accessToken = undefined;
          $state.go('login');
          return $scope.showAlert('Error', 'You have been logged out.');
        }
        $scope.showAlert('Error', 'Error Status: ' + error.status);

      }).finally(function() {
        $scope.showLoadingTickets = false;
        if (_.size($scope.tickets) > 0)
          $scope.showNoTickets = false;
        else
          $scope.showNoTickets = true;

        $scope.page++;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      });
  };

  $scope.canFetchMoreTickets = function() {
      if ($scope.hasMoreTickets === undefined)
        $scope.hasMoreTickets = true;

      return $scope.hasMoreTickets;
  };

  $scope.selected = {
    group: '',
    ticketType: '',
    priority: ''
  };

  $scope.$watch('selected.ticketType', function(newValue, oldValue, scope) {
      if (newValue && newValue.priorities)
        $scope.selected.priority = newValue.priorities[0];
  }, true);

  $scope.openNewTicket = function() {
    var groups = Groups.all(),
        types = TicketTypes.all();

    $q.all([groups, types]).then(function successCallback(results) {
        $scope.groups = results[0].data.groups;
        $scope.ticketTypes = results[1].data;
        if ($scope.ticketTypes[0] && $scope.ticketTypes[0]._id)
          $scope.selected.ticketType = $scope.ticketTypes[0];
        $scope.modalNewTicketForm = {
            subject: '',
            issue: ''
        };
        $scope.selected.group = '';

    }, function errorCallback(error) {
      console.error('Error - ' + error);
    }).then(function() {
      $scope.newTicketModal.show();
    });
  };

  $scope.closeNewTicket = function() {
      $scope.newTicketModal.hide();
  };

  $scope.openFilterTicket = function() {
      $scope.filterTicketModal.show();
  };

  $scope.applyTicketFilter = function() {
    $scope.closeTicketFilter();
  };

  $scope.closeTicketFilter = function() {
      if ($scope.search.term !== '') {
        $scope.tickets = [];
        $scope.filterTicketModal.hide();
        Snackbar.show({
          text: 'Loading...',
          showAction: false,
          duration: 2147483647, // Max duration..24days
          textColor: '#FFFFFF'
        });

        return Tickets.search($scope.search.term).then(function successCallback(response) {
            $scope.tickets = response.data.tickets;

            $timeout(function() { 
              if (_.size($scope.tickets) < 1)
                $scope.showNoTickets = true;
              else
                $scope.showNoTickets = false;           
            }, 0);

            $scope.hasMoreTickets = false;
            Snackbar.close();
        }, function errorCallback(response) {
          console.log(response);
        });
      }

      $scope.filterTicketModal.hide();
      if ($scope.shouldRefresh)
        $scope.fetchTickets();
  };

  $scope.clearTicketFilter = function() {
      $scope.search.term = '';
      $scope.tickets = null;
      $scope.filter.showClosedTickets = false;
      $scope.filter.showOnlyAssigned = false;
      $localStorage.showClosedTickets = false;
      $localStorage.showOnlyAssigned = false;

      ionic.trigger('$trudesk.refreshTickets', {});
      $scope.filterTicketModal.hide();
  };

  $scope.searchTermChanged = function() {
    $scope.shouldRefresh = true;
  }

  $scope.showClosedTicketsChanged = function() {
    $scope.filter.showClosedTickets = this.filter.showClosedTickets;
    $localStorage.showClosedTickets = $scope.filter.showClosedTickets;
    $scope.shouldRefresh = true;
  };

  $scope.showOnlyAssigneedChanged = function() {
    $scope.filtershowOnlyAssigneed = this.filter.showOnlyAssigned;
    $localStorage.showOnlyAssigned = $scope.filter.showOnlyAssigned;
    $scope.shouldRefresh = true;
  };

  $scope.closeAddComment = function() {
    $scope.addCommentModal.hide();
  };

  $scope.modalNewTicketForm = {
      subject: '',
      issue: ''
  };

  $scope.addCommentFormSubmit = function() {
      var comment = {
        ownerId: $scope.loggedInUser._id,
        comment: this.commentModalForm.comment
      };

      Tickets.addComment($scope.commentModalForm.ticket, comment).then(function successCallback(response) {
        //Comment Added
      }, function errorCallback(err) {
        console.log(err);
        $scope.showSnackbar(err, true);
      }).then(function() {
        $scope.commentModalForm.comment = '';
        $scope.commentModalForm.ticket = '';
        $scope.closeAddComment();
      });
  };

  $scope.submitNewTicket = function($event) {
      $event.preventDefault();
      var ticket = {
          type: $scope.selected.ticketType,
          subject: this.modalNewTicketForm.subject,
          issue: this.modalNewTicketForm.issue,
          group: $scope.selected.group,
          priority: $scope.selected.priority
      };

      if (!ticket.type || !ticket.subject || !ticket.issue || !ticket.group || !ticket.priority) {
        // Show Error

        return;
      }

      Tickets.create(ticket).then(function successCallback(response) {
          ionic.trigger('$trudesk.refreshTickets', {});
          $scope.modalNewTicketForm = {
            subject: '',
            issue: ''
          };
          $scope.closeNewTicket();

      }, function errorCallback(response) {
          console.log('Error----');
          console.log(response);
          $scope.showAlert('Error: ' + response.statusText, response.data.error.message);
      }).then(function() {

      });
  };

  $scope.showAlert = function(title, text, button) {
      if (button === undefined) button = 'button-assertive';
      return $ionicPopup.alert({
        title: title,
        template: text,
        okType: button
      });
  };

  ionic.on('$trudesk.refreshTickets', function() {
    $scope.doRefresh();
  });

  $scope.$on('$ionicView.beforeEnter', function() {
      ensureLogin($localStorage, $state);
      $scope.server = $localStorage.server;
      Users.getLoggedInUser().then(function(user) {
        $scope.loggedInUser = user;
      }, function(err) {
        console.log(err);
      });
  });

  $scope.$on('$ionicView.enter', function() {
    if (_.size($scope.tickets) < 1)
      $scope.doRefresh();
  });

  $scope.$on('$destroy', function() {
      $scope.newTicketModal.remove();
      $scope.filterTicketModal.remove();
      $scope.addCommentModal.remove();
  });
});

function ensureLogin($localStorage, $state) {
  if ($localStorage.server === undefined || $localStorage.accessToken === undefined)
    return $state.go('login');
}
