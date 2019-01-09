var angularPeity = angular.module('angular-peity', [] );

var peityDirective = function(type) {
    'user strict';

    return {
      restrict: 'E',
      require: 'ngModel',
      scope: {
        options: '='
      },
      link: function(scope, element, attrs, ngModel) {
        var options = {};

        if (scope.options)
          options = scope.options;

        element[0].innerText = ngModel.$viewValue;
        attrs.val = ngModel.$viewValue;

        ngModel.$render = function() {
          element[0].innerText = ngModel.$viewValue;
          jQuery(element[0]).peity(type, options);
        }
      }
    }
};

angularPeity.directive('pieChart', function() {
  return peityDirective('donut');
});

angularPeity.directive('barChart', function() {
    return peityDirective('bar');
});

angularPeity.directive('lineChart', function() {
    return peityDirective('line');
});

var fileOnChange = angular.module('fileOnChange', []);

fileOnChange.directive('fileOnChange', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var onChangeHandler = scope.$eval(attrs.fileOnChange);
        element.bind('change', onChangeHandler);
      }
    };
});

var autoLinker = angular.module('autolinker', []);
autoLinker.directive('autolinker', ['$timeout', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        $timeout(function() {
          var eleHtml = element.html();
          if (eleHtml === '') {
            return false;
          }

          var text = AutoLinker.link(eleHtml, {
            className: 'autolinker',
            newWindow: false
          });

          element.html(text);

          var autolinks = element[0].getElementsByClassName('autolinker');

          for(var i = 0; i < autolinks.length; i++) {
            angular.element(autolinks[i].bind('click', function(e) {
              var href = e.target.href;

              if (href) {
                window.open(href, '_blank');
              }

              e.preventDefault();

              return false;
            }));
          }
        }, 0);
      }
    }
}]);

var hideTabBar = angular.module('hideTabBar', []);

hideTabBar.directive('hideTabBar', function($timeout) {
  var style = angular.element('<style>').html(
    '.has-tabs.no-tabs:not(.has-tabs-top) { bottom: 0; }\n' +
    '.no-tabs.has-tabs-top { top: 44px; }');
  document.body.appendChild(style[0]);
  return {
    restrict: 'A',
    compile: function(element, attr) {
      var tabBar = document.querySelector('.tab-nav');
     
      return function($scope, $element, $attr) {
        var scroll = $element[0].querySelector('.scroll-content');
        $scope.$on('$ionicView.beforeEnter', function() {
          tabBar.classList.add('slide-away');
          scroll.classList.add('no-tabs');
        })
        $scope.$on('$ionicView.beforeLeave', function() {
          tabBar.classList.remove('slide-away');
          scroll.classList.remove('no-tabs')
        });
      }
    }
  };
});