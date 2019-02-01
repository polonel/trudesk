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
