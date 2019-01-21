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

define('pages/accounts', [
  'underscore',
  'jquery',
  'angular',
  'modules/helpers',
  'uikit',
  'modules/socket',
  'isinview',
  'datatables',
  'dt_responsive',
  'dt_grouping',
  // 'dt_foundation',
  'dt_scroller',
  'history'
], function (_, $, angular, helpers, UIkit, socket) {
  'use strict'
  var accountsPage = {}

  String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
  }

  accountsPage.init = function (callback, reset) {
    $(document).ready(function () {
      var $accountList = $('#account_list')

      var $scroller = $accountList.parents('.scrollable')

      var $scrollspy = $('#scrollspy')

      var $spinner = $scrollspy.find('i')

      var $filterAll = $('.filter-all')

      var $nextPage = 1

      var $enabled = true

      var $loading = false

      if (reset) {
        $nextPage = 0
        getAccounts()
      }

      UIkit.grid($accountList, {
        controls: '#account_list_filter',
        gutter: 20
      })

      $scroller.scroll(function () {
        if ($scrollspy.isInView($scroller)) {
          var run = _.throttle(getAccounts, 500)
          run()
        }
      })

      $('#account_list_filter li a').on('click', function () {
        $('#account_list_search').val('')
        $('.tru-card[data-search-result]').remove()
        setTimeout(function () {
          helpers.resizeAll()
        }, 280)
      })

      $('#account_list_search').keyup(function (e) {
        e.preventDefault()
        var key = e.keyCode || e.which

        var sValue = $(this)
          .val()
          .toLowerCase()

        if (key === 13) {
          if (sValue.length < 3) {
            $('#account_list_filter li.uk-active a').trigger('click')
            return true
          }

          $.ajax({
            url: '/api/v1/users?search=' + sValue,
            success: function (data) {
              $accountList.children().css('display', 'none')
              var users = data.users
              var html = ''
              _.each(users, function (u) {
                html += buildUserHTML(u, true)
              })

              var $injector = angular.injector(['ng', 'trudesk'])
              $injector.invoke([
                '$compile',
                '$rootScope',
                function ($compile, $rootScope) {
                  var $scope = $accountList.append(html).scope()
                  $compile($accountList)($scope || $rootScope)
                  $rootScope.$digest()
                }
              ])

              $('.s-ajaxify').on('click', function (e) {
                e.preventDefault()
                var href = $(e.target).attr('href')

                History.pushState(null, null, href)
              })

              UIkit.$html.trigger('changed.uk.dom')
              helpers.resizeAll()

              socket.ui.updateUsers()
            },
            error: function (error) {
              console.log(
                '[trudesk:accountsPage:setupGrid] - Error: ' + error.error
              )
            }
          })
        }

        return false
      })

      function getAccounts () {
        if (!$enabled || $loading) {
          return false
        }

        if (!$filterAll.hasClass('uk-active')) return true

        $loading = true
        $spinner.removeClass('uk-hidden')

        $.ajax({
          url: '/api/v1/users?limit=20&page=' + $nextPage
        })
          .done(function (data) {
            $spinner.addClass('uk-hidden')
            var users = data.users
            if (_.size(users) < 1) {
              $enabled = false
              $loading = false
              return false
            }

            var html = ''

            _.each(users, function (u) {
              var h = null
              if (reset) {
                $accountList.html('')
                h = buildUserHTML(u, true)
                reset = false
              } else {
                h = buildUserHTML(u, false)
              }

              if (h.length > 0) html += h
            })

            var $injector = angular.injector(['ng', 'trudesk'])
            $injector.invoke([
              '$compile',
              '$rootScope',
              function ($compile, $rootScope) {
                var $scope = $accountList.append(html).scope()
                $compile($accountList)($scope || $rootScope)
                $rootScope.$digest()
              }
            ])

            UIkit.$html.trigger('changed.uk.dom')
            helpers.resizeAll()

            $('.s-ajaxify').on('click', function (e) {
              e.preventDefault()
              var href = $(e.target).attr('href')

              History.pushState(null, null, href)
            })

            $nextPage = $nextPage + 1
            $loading = false

            socket.ui.updateUsers()
          })
          .fail(function (err) {
            console.log(
              '[trudesk:accountsPage:setupGrid] - Error: ' + err.error
            )
            $loading = false
          })
      }

      if (typeof callback === 'function') {
        return callback()
      }
    })
  }

  function buildUserHTML (user, addRemove) {
    if (!addRemove) {
      var $card = $('[data-card-username="' + user.username + '"]')
      if ($card.length > 0) return ''
    }

    var html = '<div data-uk-filter="' + user.role + ',' + user.fullname + '">'
    if (addRemove) {
      html +=
        '<div class="tru-card tru-card-hover" data-card-username="' +
        user.username +
        '" data-search-result>'
    } else {
      html +=
        '<div class="tru-card tru-card-hover" data-card-username="' +
        user.username +
        '">'
    }

    if (user.role === 'admin') {
      html += '<div class="tru-card-head tru-card-head-admin">'
    } else {
      html +=
        '<div class="tru-card-head ' +
        (user.deleted ? 'tru-card-head-deleted' : '') +
        '">'
    }

    html +=
      '<div class="tru-card-head-menu" data-uk-dropdown="{pos: \'bottom-right\', mode: \'click\'}">'
    html += '<i class="material-icons tru-icon">&#xE5D4;</i>'
    html += '<div class="uk-dropdown uk-dropdown-small">'
    html += '<ul class="uk-nav">'
    html +=
      '<li><a href="#" data-username="' +
      user.username +
      '" ng-click="editAccount($event)" class="no-ajaxy">Edit</a></li>'
    html +=
      '<li><a href="#" data-username="' +
      user.username +
      '" ng-click="deleteAccount($event)" class="no-ajaxy delete-account-action ' +
      (user.deleted ? 'hide' : '') +
      '">Delete</a></li>'
    html +=
      '<li><a href="#" data-username="' +
      user.username +
      '" ng-click="enableAccount($event)" class="no-ajaxy enable-account-action ' +
      (!user.deleted ? 'hide' : '') +
      '">Enable</a></li>'
    html += '</ul>'
    html += '</div>'
    html += '</div>'
    html += '<div class="uk-text-center">'
    html += '<div class="account-image relative uk-display-inline-block">'
    if (user.image) {
      html +=
        '<img src="/uploads/users/' +
        user.image +
        '?' +
        (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000) +
        '" alt="Profile Pic" class="tru-card-head-avatar" />'
    } else {
      html +=
        '<img src="/uploads/users/defaultProfile.jpg" alt="Profile Pic" class="tru-card-head-avatar" />'
    }
    html +=
      '<span class="user-status-large user-offline uk-border-circle" data-user-status-id="' +
      user._id +
      '"></span>'
    html += '</div>'

    html += '</div>'
    html += '<h3 class="tru-card-head-text uk-text-center">'
    html += user.fullname
    html +=
      '<span class="uk-text-truncate">' +
      (_.isUndefined(user.title) ? '' : user.title.capitalizeFirstLetter()) +
      '</span>'
    html += '</h3>'
    html += '</div>'
    html += '<div class="tru-card-content">'
    html += '<ul class="tru-list">'
    html += '<li>'
    html += '<div class="tru-list-content">'
    html += '<span class="tru-list-heading">Role</span>'
    html +=
      '<span class="uk-text-small uk-text-muted">' +
      user.role.capitalizeFirstLetter() +
      '</span>'
    html += '</div>'
    html += '</li>'
    html += '<li>'
    html += '<div class="tru-list-content">'
    html += '<span class="tru-list-heading">Email</span>'
    html +=
      '<span class="uk-text-small uk-text-muted uk-text-truncate"><a href="mailto:' +
      user.email +
      '">' +
      user.email +
      '</a></span>'
    html += '</div>'
    html += '</li>'
    html += '<li>'
    html += '<div class="tru-list-content">'
    html += '<span class="tru-list-heading">Groups</span>'
    html += '<span class="uk-text-small uk-text-muted uk-text-truncate">'
    _.each(user.groups, function (g) {
      html += g
      if (_.size(user.groups) > 1) {
        if (_.last(user.groups) !== g) {
          html += ', '
        }
      }
    })
    html += '</span>'
    html += '</div>'
    html += '</li>'
    html += '</ul>'
    html += '</div>'
    html += '</div>'
    html += '</div>'

    return html
  }

  return accountsPage
})
