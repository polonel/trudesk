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

define('modules/ajaxify', ['jquery', 'lodash', 'modules/helpers', 'history'], function ($, _, helpers) {
  $(window).on('statechangecomplete', function () {
    // Remove Rogue Tethers
    $('body > .side-nav-sub.tether-element').each(function () {
      $(this).remove()
    })

    helpers.init(true)
    helpers.hideAllUiKitDropdowns()
    helpers.UI.initSidebar()
    helpers.UI.bindExpand()

    // Update react nav on ajaxy request
    window.react.renderer(window.react.redux.store)
    window.react.redux.store.dispatch({
      type: 'NAV_CHANGE',
      payload: {
        activeItem: $('#__sidebar_route').text(),
        activeSubItem: $('#__sidebar_sub_route').text(),
        sessionUser: window.trudeskSessionService.getUser()
      }
    })

    // Load UI Animations Load
    // helpers.UI.cardShow()

    const event = _.debounce(function () {
      $.event.trigger('trudesk:ready')
    }, 100)

    event()
  })

  // Prepare our constiables
  const History = window.History

  const document = window.document

  // Check to see if History.js is enabled for our Browser
  if (!History.enabled) {
    return false
  }

  // Wait for Document
  $(function () {
    // Prepare constiables
    const contentSelector = '.wrapper > .ajaxyContent:first'
    let $content = $(contentSelector).filter(':first')
    const contentNode = $content.get(0)
    const completedEventName = 'statechangecomplete'

    const $window = $(window)
    const $body = $(document.body)
    const rootUrl = History.getRootUrl()

    const scrollOptions = {
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
      const $this = $(obj)
      const url = $this.attr('href') || ''
      const isInternalLink = url.substring(0, rootUrl.length) === rootUrl || url.indexOf(':') === -1

      // Ignore or Keep
      return isInternalLink
    }

    // HTML Helper
    const documentHtml = function (html) {
      // Prepare
      const result = String(html)
        .replace(/<!DOCTYPE[^>]*>/i, '')
        .replace(/<(html|head|body|title|meta|script)([\s>])/gi, '<div class="document-$1"$2')
        .replace(/<\/(html|head|body|title|meta|script)>/gi, '</div>')

      // Return
      return $.trim(result)
    }

    // Ajaxify Helper
    $.fn.ajaxify = function () {
      // Prepare
      const $this = $(this)

      // Ajaxify
      $this
        .find('a:internal:not(.no-ajaxy):not(.ajaxify-bound):not(.search-choice-close)')
        .addClass('ajaxify-bound')
        .on('click', function (event) {
          // Prepare
          const $this = $(this)

          const url = $this.attr('href')

          const title = $this.attr('title') || null

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
      // Prepare constiables
      const State = History.getState()
      const url = State.url
      const relativeUrl = url.replace(rootUrl, '')

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
          const $data = $(documentHtml(data))
          const $dataBody = $data.find('.document-body:first')
          const $dataContent = $dataBody.find(contentSelector).filter(':first')

          const $scripts = $dataContent.find('.document-script')
          if ($scripts.length) {
            $scripts.detach()
          }

          // Fetch the content
          const contentHtml = $dataContent.html()
          if (!contentHtml) {
            document.location.href = url
            return false
          }

          // This fixes showing the overflow on scrollers when removing them before page load
          $('#page-content').animate({ opacity: 0 }, 0, function () {
            // Memory Leak Fix- Remove events before destroying content;
            let $oldContent = $('#page-content')
            $oldContent.find('*').off('click click.chosen mouseup mousemove mousedown change')

            // Manually Unload React components from renders
            if (document.getElementById('dashboard-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('dashboard-container'))
            if (document.getElementById('tickets-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('tickets-container'))
            if (document.getElementById('single-ticket-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('single-ticket-container'))
            if (document.getElementById('settings-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('settings-container'))
            if (document.getElementById('profile-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('profile-container'))
            if (document.getElementById('accounts-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('accounts-container'))
            if (document.getElementById('accounts-import-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('accounts-import-container'))
            if (document.getElementById('groups-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('groups-container'))
            if (document.getElementById('teams-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('teams-container'))
            if (document.getElementById('departments-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('departments-container'))
            if (document.getElementById('notices-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('notices-container'))
            if (document.getElementById('messages-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('messages-container'))
            if (document.getElementById('reports-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('reports-container'))
            if (document.getElementById('about-container'))
              window.react.dom.unmountComponentAtNode(document.getElementById('about-container'))

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
              const $script = $(this)
              const scriptText = $script.text()
              const scriptNode = document.createElement('script')
              if ($script.attr('src')) {
                if (!$script[0].async) scriptNode.async = false
                scriptNode.src = $script.attr('src')
              }
              scriptNode.appendChild(document.createTextNode(scriptText))
              contentNode.appendChild(scriptNode)
            })

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
