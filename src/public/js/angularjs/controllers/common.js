/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

define(['angular', 'underscore', 'jquery', 'modules/socket', 'uikit', 'modules/tour', 'modules/helpers', 'history'], function(angular, _, $, socket, UI, tour, helpers) {
    return angular.module('trudesk.controllers.common', ['trudesk.controllers.messages'])
        .controller('commonCtrl', function($scope, $window, $http, $cookies, $timeout, $log) {

            //NG Init function
            $scope.setDefaultCreateTicketValues = function() {
              $timeout(function() {
                  UI.$html.on('show.uk.modal', function(event) {
                      var modal = $(event.target);
                      if (modal.length > 0) {
                          var $group = modal.find('select#group');
                          if (angular.isDefined($group[0])) {
                              var $group_selectize = $group[0].selectize;
                              var options = $group_selectize.options;
                              var first = _.chain(options).map(function(v, k) {
                                  if (angular.isDefined(v.$order) && v.$order === 1) return k;
                              }).first().value();
                              if (first)
                                  $group_selectize.addItem(first, true);

                              $group_selectize.refreshItems();
                          }

                          var $type = modal.find('select#type');
                          if (angular.isDefined($type[0])) {
                              var $type_selectize = $type[0].selectize;
                              options = $type_selectize.options;
                              first = _.chain(options).map(function(v, k) {
                                  if (angular.isDefined(v.$order) && v.$order === 1) return k;
                              }).first().value();

                              if (first)
                                  $type_selectize.addItem(first, true);

                              $type_selectize.refreshItems();
                          }
                      }
                  });
              }, 0, false);
            };

            $scope.loadNoticeAlertWindow = function() {
                //Load the function In the next Tick...
                $timeout(function() {
                    //Bind to Events
                    UI.$html.on('hide.uk.modal', function(event) {
                        var modal = $(event.target);
                        if (modal.length > 0) {
                            var form = modal.find('form')[0];
                            if (!_.isUndefined(form))
                                form.reset();
                            modal.find('option').prop('selected', false);
                            var $select = modal.find('form').find('select');
                            $select.each(function() {
                                var self = $(this);
                                var $selectize = self[0].selectize;
                                //$selectize.addOption({value: -1, text: "Select Group..."});
                                //$selectize.refreshOptions();
                                //$selectize.setValue(-1);
                                if (!_.isUndefined($selectize))
                                    $selectize.clear();
                            });
                            var $mdInputFilled = modal.find('*.md-input-filled');
                            $mdInputFilled.each(function() {
                                var self = $(this);
                                self.removeClass('md-input-filled');
                            })
                        }
                    });


                    $scope.noticeAlertWindow = $('#noticeAlertWindow');
                    if ($scope.noticeAlertWindow.length > 0) {
                        var cookieName = $('#__noticeCookieName').text();
                        if (angular.isUndefined(cookieName) || _.isEmpty(cookieName)) return true;
                        var shouldShowNotice = ($cookies.get(cookieName) === 'true' || angular.isUndefined($cookies.get(cookieName)));

                        if (shouldShowNotice) {
                            var modal = UI.modal($scope.noticeAlertWindow, {
                                bgclose: false
                            });

                            modal.show();
                        }
                    }
                }, 0, false);
            };

            $scope.confirmNoticeClick = function() {
                if ($scope.noticeAlertWindow.length < 1) return;
                var cookieName = $('#__noticeCookieName').text();
                var expiresDate = new Date();
                expiresDate.setDate(expiresDate.getDate() + 1);
                $cookies.put(cookieName, 'false', {expires: expiresDate});

                UI.modal($scope.noticeAlertWindow).hide();
            };

            $scope.clearNotifications = function($event) {
                $event.preventDefault();
                $event.stopPropagation();

                socket.ui.clearNotifications();
            };

            //Fired from Topbar.hbs
            $scope.loadTour = function() {
                $timeout(function() {
                    var showTour = ($('#__tourEnabled').text() === 'true');
                    if (showTour) {
                        if ($window.location.pathname !== '/dashboard') {
                            $window.location.href = '/dashboard';
                        } else
                            tour.init();
                    }
                }, 0, false);
            };

            $scope.markRead = function($event) {
                var $id = $($event.currentTarget).attr('data-notificationid');
                if ($id.length < 1) return;

                socket.ui.markNotificationRead($id);
            };

            $scope.closeNoticeAlert = function($event) {
                $event.preventDefault();
                UI.modal('#noticeAlertWindow').hide();
            };

            $scope.showPrivacyPolicyModal = function($event) {
                $event.preventDefault();

                $scope.privacyPolicyWindow = $('#privacyPolicyWindow');
                if ($scope.privacyPolicyWindow.length > 0) {

                    var modal = UI.modal($scope.privacyPolicyWindow, {
                        bgclose: true
                    });

                    modal.show();
                }
            };

            $scope.showAllNotifications = function($event) {
                $event.preventDefault();

                $scope.showAllNotificationsWindow = $('#viewAllNotificationsModal');
                if ($scope.showAllNotificationsWindow.length > 0) {
                    var modal = UI.modal($scope.showAllNotificationsWindow, {
                        bgclose: true
                    });

                    helpers.hideAllpDropDowns();
                    modal.show();
                }
            };
        })
        .directive('closeUkDropdown', function($document, $timeout) {
            return {
                restrict: 'A',
                link: function(scope, element) {
                    //$document.off('mouseup', mouseup);
                    //$document.on('mouseup', mouseup);

                    element.off('mouseup', mouseup);
                    element.on('mouseup', mouseup);

                    function mouseup() {
                        var this_dropdown = element.parents('.uk-dropdown');

                        this_dropdown.removeClass('uk-dropdown-shown');

                        $timeout(function() {
                            this_dropdown.removeClass('uk-dropdown-active');
                            this_dropdown.parents('*[data-uk-dropdown]').removeClass('uk-open').attr('aria-expanded', false);

                        },280);
                    }
                }
            }
        });
});