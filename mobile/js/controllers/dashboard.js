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
