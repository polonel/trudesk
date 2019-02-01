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
    Users
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

    $scope.isSupport =
      $localStorage.loggedInUser.role === 'admin' ||
      $localStorage.loggedInUser.role === 'mod' ||
      $localStorage.loggedInUser.role === 'support'

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

      if ($scope.isSupport)
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
              if ($scope.isSupport)
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

              if ($scope.isSupport)
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

          if ($scope.isSupport)
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
