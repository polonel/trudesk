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

define(['jquery', 'modules/helpers', 'underscore', 'modules/socket'], function ($, helpers, _, socket) {
  var navigation = {}

  navigation.init = function () {
    this.notifications()
    this.flashMessageClose()
  }

  navigation.flashMessageClose = function () {
    var flashMessage = $('.flash-message').find('.close')
    flashMessage.off('click', closeFlash)
    flashMessage.on('click', closeFlash)
  }

  function closeFlash (e) {
    var self = $(this)
    var flashMessage = self.parent()

    flashMessage.slideUp(250, function () {
      helpers.resizeAll()
    })

    e.preventDefault()
  }

  navigation.notifications = function () {
    $('[data-notifications]').each(function () {
      $(this).off('click', showDropdown)
      $(this).on('click', showDropdown)
    })

    $('[data-clearNotifications]').each(function () {
      $(this).off('click', clearNotifications)
      $(this).on('click', clearNotifications)
    })

    $(document).off('mouseup', hideDropdownMouseUp)
    $(document).on('mouseup', hideDropdownMouseUp)
  }

  function clearNotifications () {
    socket.ui.clearNotifications()
  }

  function hideDropdownMouseUp (e) {
    var hasEnjoyHint = $('.enjoyhint').length > 0
    if (hasEnjoyHint) return true

    $('[data-notifications]').each(function () {
      var drop = $('#' + $(this).attr('data-notifications'))
      if ($(this).has(e.target).length !== 0) {
        return
      }
      if (!drop.is(e.target) && drop.has(e.target).length === 0) {
        if (drop.hasClass('pDropOpen')) {
          drop.removeClass('pDropOpen')
        }
      }
    })
  }

  function showDropdown (e) {
    var drop = $('#' + $(this).attr('data-notifications'))

    // var scroll = $('#' + $(drop).attr('data-scroll'));
    if (drop.css('visibility') === 'visible') {
      drop.removeClass('pDropOpen')

      return true
    }
    var pageContent = $(this).parents('#page-content > div')
    var insidePage = pageContent.length > 0
    var pageOffsetTop = 0
    var pageOffsetLeft = 0
    if (insidePage) {
      var pOffset = pageContent.offset()
      pageOffsetTop = pOffset.top
      pageOffsetLeft = pOffset.left
    }

    pageOffsetTop += $(this).offset().top

    var leftO = 250

    if ($(drop).hasClass('pSmall')) leftO = 180

    var left = $(this).offset().left - $(window).scrollLeft() - pageOffsetLeft - leftO
    // if (drop.hasClass('p-dropdown-left')) {
    //     //left += 250;
    // }
    var leftExtraOffset = $(drop).attr('data-left-offset')
    if (_.isUndefined(leftExtraOffset)) {
      leftExtraOffset = 0
    }

    left += Number(leftExtraOffset)
    left = left + 'px'

    var hasNotice = false
    var $noticeFrame = $('.wrapper').find('#notice-banner')
    if ($noticeFrame.length > 0) {
      hasNotice = $noticeFrame.hasClass('uk-hidden') === false
    }

    var topOffset = $(this).offset().top - $(window).scrollTop() - pageOffsetTop
    var top = $(this).outerHeight() + topOffset
    var topExtraOffset = $(drop).attr('data-top-offset')
    if (_.isUndefined(topExtraOffset)) {
      topExtraOffset = 0
    }

    top += Number(topExtraOffset)

    if (hasNotice) {
      top += 30
    }

    top = top + 'px'

    var override = $(drop).attr('data-override')
    if (!_.isUndefined(override) && override === ('true' || true)) {
      top = topExtraOffset + 'px'
      left = leftExtraOffset + 'px'
    }

    $(drop)
      .find('.close-on-click')
      .find('li > a')
      .each(function () {
        $(this).off('click', liClick)
        $(this).on('click', liClick)
      })

    $(drop).addClass('pDropOpen')
    $(drop).css({ position: 'absolute', left: left, top: top })
    e.preventDefault()
  }

  function liClick () {
    helpers.hideAllpDropDowns()
  }

  return navigation
})
