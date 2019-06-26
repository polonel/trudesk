/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define([
  'angular',
  'underscore',
  'jquery',
  'modules/socket',
  'uikit',
  'modules/tour',
  'modules/helpers',
  'history'
], function (angular, _, $, socket, UI, tour, helpers) {
  return angular
    .module('trudesk.controllers.common', ['trudesk.controllers.messages'])
    .controller('commonCtrl', function ($scope, $window, $http, $cookies, $timeout, $log) {
      $scope.showCreateTagWindow = function ($event) {
        $event.preventDefault()
        var createTagModal = $('#createTagModal')
        if (createTagModal.length > 0) {
          UI.modal(createTagModal, { bgclose: false }).show()
        }
      }

      $scope.createTag = function (page, $event) {
        $event.preventDefault()
        var form = $('#createTagForm')
        if (!form.isValid(null, null, false)) {
          return true
        }

        var tagName = form.find('input[name="tagName"]').val()
        if (!tagName || tagName.length < 2) return true

        $http
          .post(
            '/api/v1/tags/create',
            {
              tag: tagName
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
          .then(
            function successCallback (response) {
              var data = response.data
              helpers.UI.showSnackbar('Tag: ' + tagName + ' created successfully', false)
              if (page === 'settings') {
                var time = new Date().getTime()
                History.pushState(null, null, '/settings/tickets/?refresh=' + time)
              } else if (page === 'singleticket') {
                var tagModal = $('#createTagModal')
                var tagFormField = $('select#tags')
                tagFormField.append(
                  '<option id="TAG__' + data.tag._id + '" value="' + data.tag._id + '">' + data.tag.name + '</option>'
                )
                tagFormField.find('option#TAG__' + data.tag._id).prop('selected', true)
                tagFormField.trigger('chosen:updated')
                form.find('#tag').val('')
                if (tagModal.length > 0) UI.modal(tagModal).hide()
                $timeout(function () {
                  $scope.showTags($event)
                }, 250)
              }
            },
            function errorCallback (err) {
              helpers.UI.showSnackbar('Unable to create tag. Check console', true)
              $log.error(err)
            }
          )
      }

      // NG Init function
      $scope.setDefaultCreateTicketValues = function () {
        $timeout(
          function () {
            UI.$html.on('show.uk.modal', function (event) {
              var modal = $(event.target)
              var options

              var first
              if (modal.length > 0 && modal.attr('id') === 'ticketCreateModal') {
                var codeMirror = modal.find('form#createTicketForm').find('.CodeMirror')[0].CodeMirror
                codeMirror.setValue('')
                modal.find('.error-border-wrap').css({ border: 'none' })
                modal.find('.mde-error').remove()

                // Needed on a timeout to allow blinking cursor to render
                $timeout(function () {
                  codeMirror.refresh()
                }, 150)

                var $group = modal.find('select#group')
                if (angular.isDefined($group[0])) {
                  var $groupSelectize = $group[0].selectize
                  options = $groupSelectize.options
                  first = _.chain(options)
                    .map(function (v, k) {
                      if (angular.isDefined(v.$order) && v.$order === 1) {
                        return k
                      }
                    })
                    .first()
                    .value()
                  if (first) {
                    $groupSelectize.addItem(first, true)
                  }

                  $groupSelectize.refreshItems()
                }

                var $type = modal.find('select#type')
                var $priorities = modal.find('#priority-wrapper')
                if (angular.isDefined($priorities[0])) {
                  $priorities.empty()
                }

                if (angular.isDefined($type[0])) {
                  var $typeSelectize = $type[0].selectize
                  $typeSelectize.on('change', function (value) {
                    // Load Priorities on Change.
                    var $priorityLoader = $('#priorityLoader')
                    $priorityLoader.show()
                    $priorities.empty()
                    $timeout(function () {
                      $http.get('/api/v1/tickets/type/' + value).then(
                        function success (response) {
                          if (
                            response.data &&
                            response.data.type &&
                            response.data.type.priorities &&
                            response.data.success
                          ) {
                            var typePriorities = response.data.type.priorities
                            if (angular.isUndefined($priorities[0])) {
                              return
                            }

                            var priorities = _.sortBy(typePriorities, 'migrationNum')
                            $priorities.empty()
                            _.each(priorities, function (priority, idx) {
                              var checked = idx === 0 ? 'checked' : ''
                              if (angular.isUndefined(priority.htmlColor)) {
                                priority.htmlColor = '#29b955'
                              }

                              var html =
                                '<span class="icheck-inline">' +
                                '<input class="with-gap" type="radio" name="priority" id="priority_' +
                                priority._id +
                                '" value="' +
                                priority._id +
                                '" data-md-icheck ' +
                                checked +
                                ' />' +
                                '<label for="priority_' +
                                priority._id +
                                '" class="mb-10 inline-label"><span class="uk-badge" style="background-color: ' +
                                priority.htmlColor +
                                '">' +
                                priority.name +
                                '</span></label>' +
                                '</span>'

                              $priorities.append(html)
                            })

                            $priorityLoader.hide()
                          }
                        },
                        function error (err) {
                          $log.error(err)
                        }
                      )
                    }, 250)
                  })

                  options = $typeSelectize.options
                  var defaultType = $type.attr('data-default')
                  if (defaultType) {
                    var selectDefault = _.find(options, { value: defaultType }).value

                    if (selectDefault) {
                      $typeSelectize.addItem(selectDefault, true)
                    }
                  } else {
                    first = _.chain(options)
                      .map(function (v, k) {
                        if (angular.isDefined(v.$order) && v.$order === 1) return k
                      })
                      .first()
                      .value()

                    if (first) {
                      $typeSelectize.addItem(first, true)
                    }
                  }

                  $typeSelectize.refreshItems()
                }

                // Now load priorities for the given type...
                // NOTE: This ends up being handled in the onChange event during modal load.
                // if (angular.isDefined($priorities[0])) {
                //     $priorities.empty();
                //     var json = $priorities.attr('data-default-priorities');
                //     var parsedPriorities = angular.fromJson(json);
                //     var priorities = _.sortBy(parsedPriorities, 'migrationNum');
                //     _.each(priorities, function(priority, idx) {
                //         var checked = (idx === 0) ? 'checked' : '';
                //         if (angular.isUndefined(priority.htmlColor))
                //             priority.htmlColor = '#29b955';
                //
                //         var html = '<span class="icheck-inline">\n' +
                //             '<input class="with-gap" type="radio" name="priority" id="priority_' + priority._id + '" value="' + priority._id + '" data-md-icheck ' + checked + ' />\n' +
                //             '<label for="priority_' + priority._id + '" class="mb-10 inline-label"><span class="uk-badge" style="background-color: ' + priority.htmlColor +'">' + priority.name + '</span></label>\n' +
                //             '</span>';
                //
                //         $priorities.append(html);
                //     });
                // }
              }
            })
          },
          0,
          false
        )
      }

      $scope.loadNoticeAlertWindow = function () {
        // Load the function In the next Tick...
        $timeout(
          function () {
            // Bind to Events
            UI.$html.on('hide.uk.modal', function (event) {
              var modal = $(event.target)
              if (modal.length > 0) {
                var form = modal.find('form')[0]
                if (!_.isUndefined(form)) {
                  form.reset()
                }
                modal.find('option').prop('selected', false)
                var $select = modal.find('form').find('select')
                $select.each(function () {
                  var vm = this
                  var self = $(vm)
                  var $selectize = self[0].selectize
                  // $selectize.addOption({value: -1, text: "Select Group..."});
                  // $selectize.refreshOptions();
                  // $selectize.setValue(-1);
                  if (!_.isUndefined($selectize)) {
                    $selectize.clear()
                  }
                })
                var $mdInputFilled = modal.find('*.md-input-filled')
                $mdInputFilled.each(function () {
                  var vm = this
                  var self = $(vm)
                  self.removeClass('md-input-filled')
                })
              }
            })

            $scope.noticeAlertWindow = $('#noticeAlertWindow')
          },
          0,
          false
        )
      }

      // Fired from Topbar.hbs
      $scope.loadTour = function () {
        $timeout(
          function () {
            var showTour = $('#__tourEnabled').text() === 'true'
            if (showTour) {
              if ($window.location.pathname !== '/dashboard') {
                $window.location.href = '/dashboard'
              } else {
                tour.init()
              }
            }
          },
          0,
          false
        )
      }

      $scope.markRead = function ($event) {
        var $id = $($event.currentTarget).attr('data-notificationid')
        if ($id.length < 1) return

        socket.ui.markNotificationRead($id)
      }

      $scope.showPrivacyPolicyModal = function ($event) {
        $event.preventDefault()

        $scope.privacyPolicyWindow = $('#privacyPolicyWindow')
        if ($scope.privacyPolicyWindow.length > 0) {
          var modal = UI.modal($scope.privacyPolicyWindow, {
            bgclose: true
          })

          modal.show()
        }
      }
    })
    .directive('closeUkDropdown', function ($document, $timeout) {
      return {
        restrict: 'A',
        link: function (scope, element) {
          // $document.off('mouseup', mouseup);
          // $document.on('mouseup', mouseup);

          element.off('mouseup', mouseup)
          element.on('mouseup', mouseup)

          function mouseup () {
            var thisDropdown = element.parents('.uk-dropdown')

            thisDropdown.removeClass('uk-dropdown-shown')

            $timeout(function () {
              thisDropdown.removeClass('uk-dropdown-active')
              thisDropdown
                .parents('*[data-uk-dropdown]')
                .removeClass('uk-open')
                .attr('aria-expanded', false)
            }, 280)
          }
        }
      }
    })
})
