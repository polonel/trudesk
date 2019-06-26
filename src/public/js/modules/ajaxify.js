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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define('modules/ajaxify', [
  'jquery',
  'underscore',
  'angular',
  'modules/helpers',
  'modules/navigation',
  'pages/pageloader',
  'modules/socket',
  'history'
], function ($, _, angular, helpers, nav, pageLoader, socketClient) {
  $(window).on('statechangecomplete', function () {
    // Global
    var $ele = $('#page-content')
    $ele.ready(function () {
      angular.bootstrap($ele, ['trudesk'])
    })

    socketClient.ui.init(socketClient.socket)
    socketClient.chat.getOpenWindows()
    socketClient.chat.updateOnlineBubbles()

    // Remove Rogue Tethers
    $('body > .side-nav-sub.tether-element').each(function () {
      $(this).remove()
    })

    helpers.init(true)
    helpers.hideAllUiKitDropdowns()
    helpers.UI.initSidebar()
    helpers.UI.bindExpand()

    nav.init()

    // Page Loader
    pageLoader.init()

    // Load UI Animations Load
    helpers.UI.cardShow()
    helpers.countUpMe()

    var event = _.debounce(function () {
      $.event.trigger('$trudesk:ready')
    }, 100)

    event()
  })

  // Prepare our Variables
  var History = window.History

  var document = window.document

  // Check to see if History.js is enabled for our Browser
  if (!History.enabled) {
    return false
  }

  // Wait for Document
  $(function () {
    // Prepare Variables
    var /* Application Specific Variables */
      contentSelector = '.wrapper > .ajaxyContent:first'

    var $content = $(contentSelector).filter(':first')

    var contentNode = $content.get(0)

    // $menu = $('.sidebar > .side-nav').filter(':first'),
    // activeClass = 'active',
    // activeSelector = '.active',
    // menuChildrenSelector = '> li,> ul > li,> li > ul > li',

    var completedEventName = 'statechangecomplete'

    /* Application Generic Variables */

    var $window = $(window)

    var $body = $(document.body)

    var rootUrl = History.getRootUrl()

    var scrollOptions = {
      duration: 800,
      easing: 'swing'
    }

    // Ensure Content
    if ($content.length === 0) {
      $content = $body
    }

    // Internal Helper
    $.expr[':'].internal = function (obj) {
      // Prepare
      var $this = $(obj)

      var url = $this.attr('href') || ''

      var isInternalLink

      // Check link
      isInternalLink = url.substring(0, rootUrl.length) === rootUrl || url.indexOf(':') === -1

      // Ignore or Keep
      return isInternalLink
    }

    // HTML Helper
    var documentHtml = function (html) {
      // Prepare
      var result = String(html)
        .replace(/<!DOCTYPE[^>]*>/i, '')
        .replace(/<(html|head|body|title|meta|script)([\s>])/gi, '<div class="document-$1"$2')
        .replace(/<\/(html|head|body|title|meta|script)>/gi, '</div>')

      // Return
      return $.trim(result)
    }

    // Ajaxify Helper
    $.fn.ajaxify = function () {
      // Prepare
      var $this = $(this)

      // Ajaxify
      $this
        .find('a:internal:not(.no-ajaxy):not(.ajaxify-bound):not(.search-choice-close)')
        .addClass('ajaxify-bound')
        .on('click', function (event) {
          // Prepare
          var $this = $(this)

          var url = $this.attr('href')

          var title = $this.attr('title') || null

          // Continue as normal for cmd clicks etc
          if (event.which === 2 || event.metaKey) return true

          // Ajaxify this link
          History.pushState(null, title, url)
          event.preventDefault()
          return false
        })

      // Chain
      return $this
    }

    // Ajaxify our Internal Links
    $body.ajaxify()

    // Hook into State Changes
    $window.bind('statechange', function () {
      // Prepare Variables
      var State = History.getState()
      var url = State.url
      var relativeUrl = url.replace(rootUrl, '')

      // Set Loading
      $body.addClass('loading')

      // Start Fade Out
      // Animating to opacity to 0 still keeps the element's height intact
      // Which prevents that annoying pop bang issue when loading in new content
      // $content.animate({opacity:0},100);

      // Ajax Request the Traditional Page

      $.ajax({
        url: url,
        success: function (data) {
          // Prepare
          var $data = $(documentHtml(data))
          var $dataBody = $data.find('.document-body:first')
          var $dataContent = $dataBody.find(contentSelector).filter(':first')

          var contentHtml
          var $scripts

          // Fetch the scripts
          $scripts = $dataContent.find('.document-script')
          if ($scripts.length) {
            $scripts.detach()
          }

          // Fetch the content
          contentHtml = $dataContent.html()
          if (!contentHtml) {
            document.location.href = url
            return false
          }

          // Update the menu -- Custom to close submenu and add classes
          // This is not needed because I am settin the menu active on the node.js route (Controller)
          // $menuChildren = $menu.find(menuChildrenSelector);
          // $menuChildren.filter(activeSelector).removeClass(activeClass);
          // $menuChildren = $menuChildren.has(
          //             'a[href^="'+relativeUrl+'"],' +
          //             'a[href^="/'+relativeUrl+'"],' +
          //             'a[href^="'+url+'"]' +
          //             'a[data-url^="'+relativeUrl+'"]'
          //
          // );

          //                    if ( $menuChildren.length === 1 ) { $menuChildren.addClass(activeClass); }

          // This fixes showing the overflow on scrollers when removing them before page load
          $('#page-content').animate({ opacity: 0 }, 0, function () {
            // Memory Leak Fix- Remove events before destroying content;
            var $oldContent = $('#page-content')
            $oldContent.find('*').off('click click.chosen mouseup mousemove mousedown change')

            // Manually Unload React components from renders
            // This will be removed once angular and ajaxy are gone (react-router will Replace)
            if (document.getElementById('tickets-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('tickets-container'))
            if (document.getElementById('single-ticket-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('single-ticket-container'))
            if (document.getElementById('settings-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('settings-container'))
            if (document.getElementById('accounts-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('accounts-container'))
            if (document.getElementById('groups-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('groups-container'))
            if (document.getElementById('teams-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('teams-container'))
            if (document.getElementById('departments-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('departments-container'))

            // if (document.getElementById('modal-wrapper'))
            //   window.react.dom.unmountComponentAtNode(document.getElementById('modal-wrapper'))

            // Update the content
            $content.stop(true, true)
            $oldContent.find('*').remove()
            $oldContent = null

            $content
              .html(contentHtml)
              .ajaxify()
              .css('opacity', 1)
              .show() /* you could fade in here if you'd like */

            // Update the title
            document.title = $data.find('.document-title:first').text()
            try {
              document.getElementsByTagName('title')[0].innerHTML = document.title
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace(' & ', ' &amp; ')
            } catch (Exception) {
              // Should be an empty block
              console.log('[AJAXIFY] ERROR: SHOULD HAVE NOT HAPPENED!')
            }

            // Add the scripts
            $scripts.each(function () {
              var $script = $(this)
              var scriptText = $script.text()
              var scriptNode = document.createElement('script')
              if ($script.attr('src')) {
                if (!$script[0].async) scriptNode.async = false
                scriptNode.src = $script.attr('src')
              }
              scriptNode.appendChild(document.createTextNode(scriptText))
              contentNode.appendChild(scriptNode)
            })

            // helpers.removeAllScrollers();

            // Complete the change
            if ($body.ScrollTo || false)
              $body.ScrollTo(scrollOptions) /* http://balupton.com/projects/jquery-scrollto */
            $body.removeClass('loading')
            $window.trigger(completedEventName)

            // Inform Google Analytics of the change
            if (typeof window._gaq !== 'undefined') {
              window._gaq.push(['_trackPageview', relativeUrl])
            }
          })
        },
        error: function (jqXHR, textStatus, errorThrown) {
          document.location.href = url
          console.log('[trudesk:ajaxify:Load] - Error Loading Document!!!')
          console.error(errorThrown)
          return false
        }
      }) // end ajax
    }) // end onStateChange
  }) // end onDomLoad
})
