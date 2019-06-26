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

'use strict'

define([
  'jquery',
  'underscore',
  'lodash',
  'moment',
  'uikit',
  'countup',
  'waves',
  'selectize',
  'snackbar',
  'jscookie',
  'tether',
  'formvalidator',
  'async',
  'easypiechart',
  'chosen',
  'velocity',
  'peity',
  'multiselect',
  'moment_timezone',
  'waypoints'
], function ($, _, __, moment, UIkit, CountUp, Waves, Selectize, Snackbar, Cookies, Tether) {
  var helpers = {}
  var easingSwiftOut = [0.4, 0, 0.2, 1]

  helpers.loaded = false
  helpers.init = function (reload) {
    var self = this
    if (reload) self.loaded = false
    if (self.loaded) {
      console.warn('Helpers already loaded. Possible double load.')
    }

    self.prototypes()

    self.setTimezone()

    self.resizeFullHeight()
    self.setupScrollers()
    self.formvalidator()
    self.pToolTip()
    self.setupDonutchart()
    self.setupBarChart()
    self.actionButtons()
    self.bindKeys()
    self.ajaxFormSubmit()
    self.setupChosen()
    self.bindNewMessageSubmit()
    self.jsPreventDefault()

    // self.UI.expandSidebar();
    // self.UI.tooltipSidebar();

    // self.UI.initSidebar()
    // self.UI.bindExpand()
    // self.UI.setupSidebarTether()
    // self.UI.bindAccordion()

    self.UI.fabToolbar()
    self.UI.fabSheet()
    self.UI.inputs()
    self.UI.cardOverlay()
    self.UI.setupPeity()
    self.UI.selectize()
    self.UI.multiSelect()
    self.UI.waves()
    self.UI.matchHeight()
    self.UI.onlineUserSearch()

    var layout = self.onWindowResize()
    // Initial Call to Load Layout
    layout()
    $(window).resize(layout)

    self.loaded = true
  }

  helpers.countUpMe = function () {
    $('.countUpMe').each(function () {
      var self = this
      var countTo = $(self).text()
      var theAnimation = new CountUp(self, 0, countTo, 0, 2)
      theAnimation.start()
    })
  }

  helpers.util = {}
  helpers.util.options = function (string) {
    if ($.type(string) !== 'string') return string

    if (string.indexOf(':') !== -1 && string.trim().substr(-1) !== '}') string = '{' + string + '}'

    var start = string ? string.indexOf('{') : -1,
      options = {}

    if (start !== -1) {
      try {
        options = helpers.util.str2json(string.substr(start))
      } catch (e) {}
    }

    return options
  }

  helpers.util.str2json = function (str, notevil) {
    try {
      if (notevil) {
        return JSON.parse(
          str
            // wrap keys without quote with valid double quote
            .replace(/([$\w]+)\s*:/g, function (_, $1) {
              return '"' + $1 + '":'
            })
            // replacing single quote wrapped ones to double quote
            .replace(/'([^']+)'/g, function (_, $1) {
              return '"' + $1 + '"'
            })
        )
      } else return new Function('', 'var json = ' + str + '; return JSON.parse(JSON.stringify(json));')()
    } catch (e) {
      return false
    }
  }

  helpers.countUpMe = function () {
    $('.countUpMe').each(function () {
      var self = this
      var countTo = $(self).text()
      var theAnimation = new CountUp(self, 0, countTo, 0, 2)
      theAnimation.start()
    })
  }
  helpers.jsPreventDefault = function () {
    $('.js-prevent-default').each(function () {
      $(this).on('click', function (event) {
        event.preventDefault()
      })
    })
  }

  helpers.UI = {}

  helpers.UI.playSound = function (soundId) {
    var audio = $('audio#' + soundId + '_audio')
    if (audio.length > 0) audio.trigger('play')
  }

  helpers.UI.bindAccordion = function () {
    $('li[data-nav-accordion]').each(function () {
      // Remove hasSubMenuOpen from LI and subMenuOpen from submenu UL to prevent menu from staying open after page load
      $(this).removeClass('hasSubMenuOpen')
      var subMenu = $(this).find('#' + $(this).attr('data-nav-accordion-target'))
      if (subMenu.length > 0) {
        if (subMenu.attr('id') !== 'side-nav-accordion-plugins') subMenu.removeClass('subMenuOpen')
      }
      if (
        $(this).hasClass('active') &&
        $(this)
          .parents('.sidebar')
          .hasClass('expand')
      ) {
        $(this).addClass('hasSubMenuOpen')
        if (subMenu.length > 0) subMenu.addClass('subMenuOpen')
      }
      var $this = $(this).find('> a')
      $this.off('click')
      $this.on('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        if (
          !$(this)
            .parents('.sidebar')
            .hasClass('expand')
        ) {
          var href = $(this).attr('href')
          if (href !== '#') History.pushState(null, null, href)
          return true
        }

        // Shut all other sidebars...
        $('li[data-nav-accordion].hasSubMenuOpen').each(function () {
          var $tTarget = $('#' + $(this).attr('data-nav-accordion-target'))
          $tTarget.removeClass('subMenuOpen')
          $(this).removeClass('hasSubMenuOpen')
        })

        var $target = $('#' + $this.parent('li').attr('data-nav-accordion-target'))

        if ($target.length > 0) {
          $target.toggleClass('subMenuOpen')
          $(this)
            .parent('li.hasSubMenu')
            .toggleClass('hasSubMenuOpen')
        }
      })
    })
  }

  helpers.UI.expandSidebar = function () {
    var $sidebar = $('.sidebar')
    $sidebar.addClass('no-animation expand')
    $('#page-content').addClass('no-animation expanded-sidebar')
    setTimeout(function () {
      $sidebar.removeClass('no-animation')
      $('#page-content').removeClass('no-animation')
    }, 500)
  }

  helpers.UI.toggleSidebar = function () {
    var $sidebar = $('.sidebar')
    $sidebar.toggleClass('expand')
    $('#page-content').toggleClass('expanded-sidebar')
    if ($sidebar.hasClass('expand')) {
      $sidebar.find('.tether-element.tether-enabled').hide()
      $sidebar.find('li[data-nav-accordion-target].active').addClass('hasSubMenuOpen')
      $sidebar.find('li[data-nav-accordion-target].active > ul').addClass('subMenuOpen')
    } else {
      setTimeout(function () {
        Tether.position()
        $('.sidebar')
          .find('.tether-element.tether-enabled')
          .show()
      }, 250)
      $sidebar.find('li[data-nav-accordion-target]').removeClass('hasSubMenuOpen')
      $sidebar.find('ul.side-nav-accordion.side-nav-sub').removeClass('subMenuOpen')
    }

    $(window).resize()
  }

  helpers.UI.bindExpand = function () {
    var menuButton = $('#expand-menu')
    if (menuButton.length > 0) {
      menuButton.off('click')
      menuButton.on('click', function (e) {
        e.preventDefault()
        helpers.UI.toggleSidebar()
        if ($('.sidebar').hasClass('expand')) {
          Cookies.set('$trudesk:sidebar:expanded', true, { expires: 999 })
        } else {
          Cookies.set('$trudesk:sidebar:expanded', false, { expires: 999 })
        }
      })
    }
  }

  helpers.UI.initSidebar = function () {
    if (Cookies.get('$trudesk:sidebar:expanded') === 'true') {
      helpers.UI.expandSidebar()
    }
  }

  helpers.UI.tooltipSidebar = function () {
    $('.sidebar')
      .find('a[data-uk-tooltip]')
      .each(function () {
        $(this).attr('style', 'padding: 0 !important; font-size: 0 !important;')
      })
  }

  helpers.UI.setupDataTethers = function () {
    var $elements = $('*[data-tether]')

    $elements.each(function () {
      var $this = $(this)
      var obj = helpers.util.options($this.attr('data-tether'))
      if (_.isObject(obj)) {
        var $target = $(obj.target)

        if ($target.length > 0) {
          new Tether({
            element: $this,
            target: $target,
            attachment: obj.pos,
            targetAttachment: obj.targetAttachment,
            offset: obj.offset
          })
        }
      }
    })
  }

  helpers.UI.setupSidebarTether = function () {
    var sidebarElements = [
      { element: '#side-nav-sub-tickets', target: 'tickets' },
      { element: '#side-nav-sub-accounts', target: 'accounts' },
      { element: '#side-nav-sub-reports', target: 'reports' },
      { element: '#side-nav-sub-settings', target: 'settings' }
    ]

    _.each(sidebarElements, function (item) {
      var element = $('.sidebar-to-right').find(item.element)
      if (element.length < 1) return
      var sidebar = $('.sidebar')
      var target = sidebar.find('li[data-nav-id="' + item.target + '"]')
      if (target.length < 1) return
      helpers.UI.sidebarTether(element, target)
      var isInside = false
      target.on('mouseover', function () {
        if (sidebar.hasClass('expand')) {
          element.removeClass('sub-menu-right-open')
          isInside = false
        } else {
          element.addClass('sub-menu-right-open')
          isInside = true
        }
      })
      target.on('mouseleave', function () {
        isInside = false
        setTimeout(function () {
          if (!isInside) {
            element.removeClass('sub-menu-right-open')
          }
        }, 100)
      })
      element.on('mouseover', function () {
        isInside = true
      })
      element.on('mouseleave', function () {
        isInside = false
        setTimeout(function () {
          if (!isInside) {
            element.removeClass('sub-menu-right-open')
          }
        }, 100)
      })
    })
  }

  helpers.UI.sidebarTether = function (element, target) {
    if (_.isUndefined(element) || _.isUndefined(target) || element.length < 1 || target.length < 1) {
      return
    }

    // eslint-disable-next-line
    new Tether({
      element: element,
      target: target,
      attachment: 'top left',
      targetAttachment: 'top right',
      offset: '0 -3px'
    })
  }

  helpers.UI.setNavItem = function (id) {
    var $sidebar = $('.sidebar')
    $sidebar.find('li.active').removeClass('active')
    $sidebar.find('li[data-nav-id="' + id.toLowerCase() + '"]').addClass('active')
  }

  helpers.UI.tetherUpdate = function () {
    setTimeout(function () {
      Tether.position()
    }, 500)
  }

  helpers.UI.onlineUserSearch = function () {
    $(document).off('keyup', '.online-list-search-box input[type="text"]', onSearchKeyUp)
    $(document).on('keyup', '.online-list-search-box input[type="text"]', onSearchKeyUp)

    function onSearchKeyUp () {
      var $searchBox = $('.online-list-search-box').find('input')
      var searchTerm = $searchBox.val().toLowerCase()

      $('.user-list li').each(function () {
        if ($(this).filter('[data-search-term *= ' + searchTerm + ']').length > 0 || searchTerm.length < 1) {
          $(this).show()
        } else {
          $(this).hide()
        }
      })
    }
  }

  helpers.UI.matchHeight = function () {
    var $d = $('div[data-match-height]')
    $d.each(function () {
      var self = $(this)
      var target = self.attr('data-match-height')

      var $target = $(target)
      var $targetHeight = $target.height()
      self.height($targetHeight)
    })
  }

  helpers.UI.showDisconnectedOverlay = function () {
    setTimeout(function () {
      var $disconnected = $('.disconnected')

      if ($disconnected.css('display') === 'block') {
        return true
      }

      $disconnected.velocity('fadeIn', {
        duration: 500,
        easing: easingSwiftOut,
        begin: function () {
          $disconnected.css({
            display: 'block',
            opacity: 0
          })
        }
      })
    }, 500)
  }

  helpers.UI.hideDisconnectedOverlay = function () {
    var $disconnected = $('.disconnected')

    if ($disconnected.css('display') === 'none') {
      return true
    }

    $disconnected.velocity('fadeOut', {
      duration: 500,
      easing: easingSwiftOut,
      complete: function () {
        $disconnected.css({
          display: 'none',
          opacity: 0
        })
      }
    })
  }

  helpers.UI.showSnackbar = function () {
    if (arguments.length === 1 && _.isObject(arguments[0])) {
      return helpers.UI.showSnackbar_.apply(this, arguments)
    }

    return helpers.UI.showSnackbar__.apply(this, arguments)
  }

  helpers.UI.showSnackbar_ = function (options) {
    Snackbar.show(options)
  }

  helpers.UI.showSnackbar__ = function (text, error) {
    if (_.isUndefined(error) || _.isNull(error)) {
      error = false
    }

    var actionText = '#4CAF50'
    if (error) {
      actionText = '#FF4835'
    }

    Snackbar.show({
      text: text,
      actionTextColor: actionText
    })
  }

  helpers.UI.closeSnackbar = function () {
    Snackbar.close()
  }

  helpers.UI.inputs = function (parent) {
    var $mdInput = typeof parent === 'undefined' ? $('.md-input') : $(parent).find('.md-input')
    $mdInput.each(function () {
      if (!$(this).closest('.md-input-wrapper').length) {
        var $this = $(this)

        if ($this.prev('label').length) {
          $this
            .prev('label')
            .andSelf()
            .wrapAll('<div class="md-input-wrapper"/>')
        } else if ($this.siblings('[data-uk-form-password]').length) {
          $this
            .siblings('[data-uk-form-password]')
            .andSelf()
            .wrapAll('<div class="md-input-wrapper"/>')
        } else {
          $this.wrap('<div class="md-input-wrapper"/>')
        }

        $this.closest('.md-input-wrapper').append('<span class="md-input-bar"/>')

        updateInput($this)
      }
      $('body')
        .on('focus', '.md-input', function () {
          $(this)
            .closest('.md-input-wrapper')
            .addClass('md-input-focus')
        })
        .on('blur', '.md-input', function () {
          $(this)
            .closest('.md-input-wrapper')
            .removeClass('md-input-focus')
          if (!$(this).hasClass('label-fixed')) {
            if ($(this).val() !== '') {
              $(this)
                .closest('.md-input-wrapper')
                .addClass('md-input-filled')
            } else {
              $(this)
                .closest('.md-input-wrapper')
                .removeClass('md-input-filled')
            }
          }
        })
        .on('change', '.md-input', function () {
          updateInput($(this))
        })

      $('.search-input')
        .focus(function () {
          $(this)
            .parent()
            .addClass('focus')
        })
        .blur(function () {
          $(this)
            .parent()
            .removeClass('focus')
        })
    })
  }

  helpers.UI.reRenderInputs = function () {
    $('.md-input').each(function () {
      updateInput($(this))
    })
  }

  function updateInput (object) {
    // clear wrapper classes
    object.closest('.uk-input-group').removeClass('uk-input-group-danger uk-input-group-success uk-input-group-nocolor')
    object
      .closest('.md-input-wrapper')
      .removeClass(
        'md-input-wrapper-danger md-input-wrapper-success uk-input-wrapper-nocolor md-input-wrapper-disabled'
      )

    if (object.hasClass('md-input-danger')) {
      if (object.closest('.uk-input-group').length) {
        object.closest('.uk-input-group').addClass('uk-input-group-danger')
      }

      object.closest('.md-input-wrapper').addClass('md-input-wrapper-danger')
    }
    if (object.hasClass('md-input-success')) {
      if (object.closest('.uk-input-group').length) {
        object.closest('.uk-input-group').addClass('uk-input-group-success')
      }

      object.closest('.md-input-wrapper').addClass('md-input-wrapper-success')
    }
    if (object.hasClass('md-input-nocolor')) {
      if (object.closest('.uk-input-group').length) {
        object.closest('.uk-input-group').addClass('uk-input-group-nocolor')
      }

      object.closest('.md-input-wrapper').addClass('md-input-wrapper-nocolor')
    }
    if (object.prop('disabled')) {
      object.closest('.md-input-wrapper').addClass('md-input-wrapper-disabled')
    }

    if (object.hasClass('label-fixed')) {
      object.closest('.md-input-wrapper').addClass('md-input-filled')
    }

    if (object.val() !== '') {
      object.closest('.md-input-wrapper').addClass('md-input-filled')
    }
  }

  helpers.UI.fabToolbar = function () {
    var $fabToolbar = $('.md-fab-toolbar')

    if ($fabToolbar) {
      $fabToolbar.children('i').on('click', function (e) {
        e.preventDefault()

        var toolbarItems = $fabToolbar.children('.md-fab-toolbar-actions').children().length

        $fabToolbar.addClass('md-fab-animated')

        var fabPadding = !$fabToolbar.hasClass('md-fab-small') ? 16 : 24

        var fabSize = !$fabToolbar.hasClass('md-fab-small') ? 64 : 44

        setTimeout(function () {
          $fabToolbar.width(toolbarItems * fabSize + fabPadding)
        }, 140)

        setTimeout(function () {
          $fabToolbar.addClass('md-fab-active')
        }, 420)
      })

      $('.page-content').on('scroll', function (e) {
        if ($fabToolbar.hasClass('md-fab-active')) {
          if (!$(e.target).closest($fabToolbar).length) {
            $fabToolbar.css({ height: '', width: '' }).removeClass('md-fab-active')

            setTimeout(function () {
              $fabToolbar.removeClass('md-fab-animated')
            }, 140)
          }
        }
      })

      $(document).on('click scroll', function (e) {
        if ($fabToolbar.hasClass('md-fab-active')) {
          if (!$(e.target).closest($fabToolbar).length) {
            $fabToolbar.css('width', '').removeClass('md-fab-active')

            setTimeout(function () {
              $fabToolbar.removeClass('md-fab-animated')
            }, 140)
          }
        }
      })
    }
  }

  helpers.UI.fabSheet = function () {
    var $fabSheet = $('.md-fab-sheet')

    if ($fabSheet) {
      $fabSheet.children('i').on('click', function (e) {
        e.preventDefault()

        var sheetItems = $fabSheet.children('.md-fab-sheet-actions').children('a').length
        $fabSheet.addClass('md-fab-animated')

        setTimeout(function () {
          $fabSheet.width('240px').height(sheetItems * 40 + 8)
        }, 140)

        setTimeout(function () {
          $fabSheet.addClass('md-fab-active')
        }, 280)
      })

      $fabSheet
        .children('.md-fab-sheet-actions')
        .children('a')
        .on('click', function () {
          if ($fabSheet.hasClass('md-fab-active')) {
            $fabSheet.css({ height: '', width: '' }).removeClass('md-fab-active')

            setTimeout(function () {
              $fabSheet.removeClass('md-fab-animated')
            }, 140)
          }
        })

      $('.page-content').on('scroll', function (e) {
        if ($fabSheet.hasClass('md-fab-active')) {
          if (!$(e.target).closest($fabSheet).length) {
            $fabSheet.css({ height: '', width: '' }).removeClass('md-fab-active')

            setTimeout(function () {
              $fabSheet.removeClass('md-fab-animated')
            }, 140)
          }
        }
      })

      $(document).on('click scroll', function (e) {
        if ($fabSheet.hasClass('md-fab-active')) {
          if (!$(e.target).closest($fabSheet).length) {
            $fabSheet.css({ height: '', width: '' }).removeClass('md-fab-active')

            setTimeout(function () {
              $fabSheet.removeClass('md-fab-animated')
            }, 140)
          }
        }
      })
    }
  }

  helpers.UI.waves = function () {
    Waves.attach('.md-btn-wave,.md-fab-wave', ['waves-button'])
    Waves.attach('.md-btn-wave-light,.md-fab-wave-light', ['waves-button', 'waves-light'])
    Waves.attach('.wave-box', ['waves-float'])
    Waves.init({
      delay: 300
    })
  }

  helpers.UI.selectize = function (parent) {
    // selectize plugins
    if (typeof $.fn.selectize !== 'undefined') {
      Selectize.define('hidden_textbox', function (options) {
        var self = this
        this.showInput = function () {
          this.$control.css({ cursor: 'pointer' })
          this.$control_input.css({ opacity: 0, position: 'relative', left: self.rtl ? 10000 : -10000 })
          this.isInputHidden = false
        }

        this.setup_original = this.setup

        this.setup = function () {
          self.setup_original()
          this.$control_input.prop('disabled', 'disabled')
        }
      })

      Selectize.define('dropdown_after', function () {
        var self = this
        self.positionDropdown = function () {
          var $control = this.$control
          var position = $control.position()
          var paddingLeft = position.left
          var paddingTop = position.top + $control.outerHeight(true) + 32
          this.$dropdown.css({
            width: $control.outerWidth(),
            top: paddingTop,
            left: paddingLeft
          })
        }
      })
    }

    var $selectize = parent ? $(parent).find('select') : $('[data-md-selectize],.data-md-selectize')

    $selectize.each(function () {
      var $this = $(this)
      if (!$this.hasClass('selectized')) {
        var thisPosBottom = $this.attr('data-md-selectize-bottom')
        var posTopOffset = $this.attr('data-md-selectize-top-offset')
        var closeOnSelect =
          $this.attr('data-md-selectize-closeOnSelect') !== 'undefined'
            ? $this.attr('data-md-selectize-closeOnSelect')
            : false

        var showTextBox = $this.attr('data-md-selectize-notextbox') !== 'true'

        var plugins = ['remove_button']
        if (!showTextBox) plugins.push('hidden_textbox')

        $this.after('<div class="selectize_fix"></div>').selectize({
          plugins: plugins,
          hideSelected: true,
          dropdownParent: 'body',
          closeAfterSelect: closeOnSelect,
          onDropdownOpen: function ($dropdown) {
            $dropdown.hide().velocity('slideDown', {
              begin: function () {
                if (typeof thisPosBottom !== 'undefined') {
                  $dropdown.css({ 'margin-top': '0' })
                  if (typeof posTopOffset !== 'undefined') {
                    $dropdown.css({ 'margin-top': posTopOffset + 'px' })
                  }
                }
              },
              duration: 200,
              easing: easingSwiftOut
            })
          },
          onDropdownClose: function ($dropdown) {
            $dropdown.show().velocity('slideUp', {
              complete: function () {
                if (typeof thisPosBottom !== 'undefined') {
                  $dropdown.css({ 'margin-top': '' })
                }

                if (closeOnSelect) {
                  $($dropdown)
                    .prev()
                    .find('input')
                    .blur()
                }
              },
              duration: 200,
              easing: easingSwiftOut
            })
          }
        })
      }
    })

    // dropdowns
    var $selectizeInline = $('[data-md-selectize-inline]')

    $selectizeInline.each(function () {
      var $this = $(this)
      if (!$this.hasClass('selectized')) {
        var thisPosBottom = $this.attr('data-md-selectize-bottom')
        var posTopOffset = $this.attr('data-md-selectize-top-offset')
        var closeOnSelect =
          $this.attr('data-md-selectize-closeOnSelect') !== 'undefined'
            ? $this.attr('data-md-selectize-closeOnSelect')
            : false
        var maxOptions =
          $this.attr('data-md-selectize-maxOptions') !== 'undefined' ? $this.attr('data-md-selectize-maxOptions') : 1000
        var showTextBox = $this.attr('data-md-selectize-notextbox') !== 'true'

        var plugins = ['dropdown_after', 'remove_button']
        if (!showTextBox) plugins.push('hidden_textbox')

        $this
          .after('<div class="selectize_fix"></div>')
          .closest('div')
          .addClass('uk-position-relative')
          .end()
          .selectize({
            plugins: plugins,
            dropdownParent: $this.closest('div'),
            hideSelected: true,
            closeAfterSelect: closeOnSelect,
            maxOptions: maxOptions,
            onFocus: function () {
              if (showTextBox) return

              $this.find('.selectize-input input').attr('readonly', true)
              $this.find('.selectize-input input, .selectize-input').css('cursor', 'pointer')
            },
            onDropdownOpen: function ($dropdown) {
              $dropdown.hide().velocity('slideDown', {
                begin: function () {
                  if (typeof thisPosBottom !== 'undefined') {
                    $dropdown.css({ 'margin-top': '0' })
                    if (typeof posTopOffset !== 'undefined') {
                      $dropdown.css({ 'margin-top': posTopOffset + 'px' })
                    }
                  }
                },
                duration: 200,
                easing: easingSwiftOut
              })
            },
            onDropdownClose: function ($dropdown) {
              $dropdown.show().velocity('slideUp', {
                complete: function () {
                  if (typeof thisPosBottom !== 'undefined') {
                    $dropdown.css({ 'margin-top': '' })
                  }

                  if (closeOnSelect) {
                    $($dropdown)
                      .prev()
                      .find('input')
                      .blur()
                  }
                },
                duration: 200,
                easing: easingSwiftOut
              })
            }
          })
      }
    })
  }

  helpers.UI.multiSelect = function (options) {
    $('.multiselect').each(function () {
      var self = $(this)
      self.multiSelect(options)
    })
  }

  helpers.UI.cardShow = function () {
    $('.tru-card-intro').each(function () {
      var self = $(this)
      self.velocity(
        {
          scale: 0.99999999,
          opacity: 1
        },
        {
          duration: 400,
          easing: easingSwiftOut
        }
      )
    })
  }

  helpers.UI.cardOverlay = function () {
    var $truCard = $('.tru-card')

    // replace toggler icon (x) when overlay is active
    $truCard.each(function () {
      var $this = $(this)
      if ($this.hasClass('tru-card-overlay-active')) {
        $this.find('.tru-card-overlay-toggler').html('close')
      }
    })

    // toggle card overlay
    $truCard.on('click', '.tru-card-overlay-toggler', function (e) {
      e.preventDefault()
      if (
        !$(this)
          .closest('.tru-card')
          .hasClass('tru-card-overlay-active')
      ) {
        $(this)
          .html('close')
          .closest('.tru-card')
          .addClass('tru-card-overlay-active')
      } else {
        $(this)
          .html('more_vert')
          .closest('.tru-card')
          .removeClass('tru-card-overlay-active')
      }
    })
  }

  helpers.UI.setupPeity = function () {
    $('.peity-bar').each(function () {
      $(this).peity('bar', {
        height: 28,
        width: 48,
        fill: ['#e74c3c'],
        padding: 0.2
      })
    })

    $('.peity-pie').each(function () {
      $(this).peity('donut', {
        height: 24,
        width: 24,
        fill: ['#29b955', '#ccc']
      })
    })

    $('.peity-line').each(function () {
      $(this).peity('line', {
        height: 28,
        width: 64,
        fill: '#d1e4f6',
        stroke: '#0288d1'
      })
    })
  }

  helpers.UI.getPlugins = function (callback) {
    $.ajax({
      url: '/api/v1/plugins/list/installed',
      method: 'GET',
      success: function (data) {
        if (_.isFunction(callback)) return callback(null, data)
      },
      error: function (error) {
        if (_.isFunction(callback)) return callback(error, null)
      }
    })
  }

  helpers.closeNotificationsWindow = function () {
    UIkit.modal('#viewAllNotificationsModal').hide()
  }

  helpers.showFlash = function (message, error, sticky) {
    var flash = $('.flash-message')
    if (flash.length < 1) return true

    var e = !!error
    var s = !!sticky

    var flashTO
    var flashText = flash.find('.flash-text')
    flashText.html(message)

    if (e) {
      flashText.css('background', '#de4d4d')
    } else {
      flashText.css('background', '#29b955')
    }

    if (s) {
      flash.off('mouseout')
      flash.off('mouseover')
    }

    if (!s) {
      flash.mouseout(function () {
        flashTO = setTimeout(flashTimeout, 2000)
      })

      flash.mouseover(function () {
        clearTimeout(flashTO)
      })
    }

    var isShown = flashText.is(':visible')
    if (isShown) return true

    flashText.css('top', '-50px')
    flash.show()
    if (flashTO) clearTimeout(flashTO)
    flashText.stop().animate({ top: '0' }, 500, function () {
      if (!s) {
        flashTO = setTimeout(flashTimeout, 2000)
      }
    })
  }

  helpers.clearFlash = function () {
    flashTimeout()
  }

  function flashTimeout () {
    var flashText = $('.flash-message').find('.flash-text')
    if (flashText.length < 1) return
    flashText.stop().animate({ top: '-50px' }, 500, function () {
      $('.flash-message').hide()
    })
  }

  helpers.formvalidator = function () {
    $.validate({
      errorElementClass: 'uk-form-danger',
      errorMessageClass: 'uk-form-danger'
      // ignore: ':hidden:not([class~=selectized]),:hidden > .selectized,.selectize-control .selectize-input input'
    })
  }

  helpers.bindKeys = function () {
    var ticketIssue = $('#createTicketForm').find('textarea#issue')
    if (ticketIssue.length > 0) {
      ticketIssue.off('keydown')
      ticketIssue.on('keydown', function (e) {
        var keyCode = e.which ? e.which : e.keyCode
        if (keyCode === 10 || (keyCode === 13 && e.ctrlKey)) {
          $('#saveTicketBtn').trigger('click')
        }
      })
    }

    var keyBindEnter = $('*[data-keyBindSubmit]')
    if (keyBindEnter.length > 0) {
      $.each(keyBindEnter, function (k, val) {
        var item = $(val)
        if (item.length < 1) return
        item.off('keydown')
        var actionItem = item.attr('data-keyBindSubmit')
        if (actionItem.length > 0) {
          var itemObj = $(actionItem)
          if (itemObj.length > 0) {
            item.on('keydown', function (e) {
              var keyCode = e.which ? e.which : e.keyCode
              if (keyCode === 10 || (keyCode === 13 && e.ctrlKey)) {
                itemObj.trigger('click')
              }
            })
          }
        }
      })
    }
  }

  helpers.onWindowResize = function () {
    var self = this
    return _.debounce(function () {
      $('body > .side-nav-sub.tether-element').each(function () {
        $(this).remove()
      })

      self.UI.tetherUpdate()

      self.resizeFullHeight()
      self.hideAllpDropDowns()

      self.resizeDataTables('.ticketList')
      self.resizeDataTables('.tagsList')
    }, 100)
  }

  helpers.setupScrollers = function () {
    $('.scrollable').css({ 'overflow-y': 'auto', 'overflow-x': 'hidden' })
    $('.scrollable-dark').css({ 'overflow-y': 'auto', 'overflow-x': 'hidden' })
  }

  helpers.scrollToBottom = function (jqueryObject, animate) {
    if (_.isUndefined(jqueryObject) || jqueryObject.length < 1) return true
    if (_.isUndefined(animate)) animate = false

    if (!jqueryObject.jquery) {
      jqueryObject = $(jqueryObject)
    }

    if (animate) {
      jqueryObject.animate({ scrollTop: jqueryObject[0].scrollHeight }, 1000)
    } else {
      jqueryObject.scrollTop(jqueryObject[0].scrollHeight)
    }
  }

  helpers.resizeAll = function () {
    var self = this
    var l = _.debounce(function () {
      self.resizeFullHeight()
      self.UI.matchHeight()
      self.hideAllpDropDowns()

      self.resizeDataTables('.ticketList')
      self.resizeDataTables('.tagsList')
    }, 100)

    l()
  }

  helpers.resizeFullHeight = function () {
    var ele = $('.full-height')
    $.each(ele, function () {
      var self = $(this)
      ele.ready(function () {
        var h = $(window).height()
        if (self.css('borderTopStyle') === 'solid') {
          h = h - 1
        }

        var dataOffset = self.attr('data-offset')
        if (!_.isUndefined(dataOffset)) {
          h = h - dataOffset
        }

        // self.css('overflow', 'hidden');
        self.height(h - self.offset().top)
      })
    })
  }

  helpers.resizeDataTables = function (selector, hasFooter) {
    if (_.isUndefined(selector)) {
      return true
    }

    if (_.isUndefined(hasFooter)) {
      hasFooter = false
    }

    $(document).ready(function () {
      var $selector = $(selector)
      var scroller = $selector.find('.dataTables_scrollBody')
      if (scroller.length !== 0) {
        var tableHead = $selector.find('.dataTables_scrollHead')
        var optionsHead = $selector.find('.table-options')
        var hasFilter = $selector.find('.dataTables_filter')
        var headHeight = 0
        if (optionsHead.length !== 0) {
          headHeight = optionsHead.height()
        } else if (hasFilter.length !== 0) {
          headHeight = hasFilter.height()
        }
        var footerHeight = 0
        if (hasFooter) {
          footerHeight = tableHead.height()
        }
        scroller.css({
          height: $selector.height() - tableHead.height() - headHeight - footerHeight + 'px'
        })
      }
    })
  }

  helpers.hideAllpDropDowns = function () {
    $('[data-notifications]').each(function () {
      var drop = $('#' + $(this).attr('data-notifications'))
      if (drop.hasClass('pDropOpen')) {
        drop.removeClass('pDropOpen')
      }
    })
  }

  helpers.hideAllUiKitDropdowns = function () {
    var dropdowns = $('.uk-dropdown')
    dropdowns.each(function () {
      var thisDropdown = $(this)
      thisDropdown.removeClass('uk-dropdown-shown')

      setTimeout(function () {
        thisDropdown.removeClass('uk-dropdown-active')
        thisDropdown
          .parents('*[data-uk-dropdown]')
          .removeClass('uk-open')
          .attr('aria-expanded', false)
      }, 280)
    })
  }

  helpers.pToolTip = function () {
    $(document).ready(function () {
      var pToolTip = $('span[data-ptooltip]')
      pToolTip.each(function () {
        var title = $(this).attr('data-title')
        var type = $(this).attr('data-ptooltip-type')
        var html =
          "<div class='ptooltip-box-wrap' data-ptooltip-id='" +
          $(this).attr('id') +
          "'><div class='ptooltip-box'><span>" +
          title +
          '</span>'
        if (type.toLowerCase() === 'service') {
          var status = $(this).attr('data-service-status')
          var color = '#fff'
          if (status.toLowerCase() === 'starting' || status.toLowerCase() === 'stopping') {
            color = '#e77c3c'
          }
          if (status.toLowerCase() === 'running') {
            color = '#29b955'
          }
          if (status.toLowerCase() === 'stopped') {
            color = '#e54242'
          }

          html += "<span>Status: <span style='color: " + color + ";'>" + status + '</span>'
        } else if (type.toLowerCase() === 'dailyticket') {
          var n = $(this).attr('data-new-count')
          var c = $(this).attr('data-closed-count')

          html +=
            "<span><span style='color: #e74c3c'>" +
            n +
            "</span> New / <span style='color: #2fb150'>" +
            c +
            '</span> Closed</span>'
        }

        html += '</div></div>'
        var k = $('<div></div>').css({ position: 'relative' })
        k.append(html)

        $(this).append(k)
      })

      pToolTip.hover(
        function () {
          var id = $(this).attr('id')
          $('div.ptooltip-box-wrap[data-ptooltip-id="' + id + '"]').show()
        },
        function () {
          var id = $(this).attr('id')
          $('div.ptooltip-box-wrap[data-ptooltip-id="' + id + '"]').hide()
        }
      )
    })
  }

  helpers.setupDonutchart = function () {
    $(document).ready(function () {
      $('.donutchart').each(function () {
        var trackColor = $(this).attr('data-trackColor')
        if (trackColor === null || trackColor.length <= 0) {
          trackColor = '#e74c3c'
        }
        var numCount = $(this).attr('data-numcount')
        if (numCount === null || numCount.length <= 0) {
          numCount = false
        }
        var $size = $(this).attr('data-size')
        if ($size === null || $size.length <= 0) {
          $size = 150
        }

        $(this).css({ height: $size, width: $size })

        $(this).easyPieChart({
          size: $size,
          lineCap: 'round',
          lineWidth: 8,
          scaleColor: false,
          barColor: trackColor,
          trackColor: '#e3e5e8',
          onStart: function (value) {
            $(this.el)
              .find('.chart-value')
              .text(value)
          },
          onStop: function (value, to) {
            if (numCount) {
              var totalNum = parseInt($(this.el).attr('data-totalNumCount'))
              if (totalNum <= 0) return false
              $(this.el)
                .find('.chart-value')
                .text(totalNum)
              return true
            }

            if (to === Infinity) to = 0
            $(this.el)
              .find('.chart-value')
              .text(Math.round(to))
          },
          onStep: function (from, to, percent) {
            if (numCount) {
              var countVal = parseInt($(this.el).attr('data-totalNumCount'))
              if (countVal <= 0) return false
              var current = parseInt(
                $(this.el)
                  .find('.chart-value')
                  .text()
              )
              if (countVal !== null && countVal > 0 && current !== null) {
                var totalCount = Math.round(countVal * (100 / Math.round(to)))
                var val = totalCount * (0.01 * Math.round(percent))
                var final = Math.round(val)
                if (isNaN(final)) return true
                $(this.el)
                  .find('.chart-value')
                  .text(final)
                return true
              }
            }

            if (percent === Infinity) percent = 0
            $(this.el)
              .find('.chart-value')
              .text(Math.round(percent))
          }
        })
      })
    })
  }

  helpers.setupBarChart = function () {
    $(document).ready(function () {
      $('.bar-chart > .bar').each(function () {
        var $this = $(this)
        var val = $this.attr('data-percent')
        var i = 170 * (0.01 * val)
        $this
          .find('span.bar-track')
          .height(0)
          .animate(
            {
              height: i
            },
            1000
          )
      })
    })
  }

  helpers.actionButtons = function () {
    $(document).ready(function () {
      $('*[data-action]').each(function () {
        var self = $(this)
        var action = self.attr('data-action')
        if (action.toLowerCase() === 'submit') {
          var formId = self.attr('data-form')
          if (!_.isUndefined(formId)) {
            var form = $('#' + formId)
            if (form.length !== 0) {
              self.click(function (e) {
                form.submit()

                var preventDefault = self.attr('data-preventDefault')
                if (_.isUndefined(preventDefault) || preventDefault.length < 1) {
                  e.preventDefault()
                } else if (preventDefault.toLowerCase() === 'true') {
                  e.preventDefault()
                }
              })
            }
          }
        } else if (action.toLowerCase() === 'scrolltobottom') {
          var targetScroll = self.attr('data-targetScroll')
          if (!_.isUndefined(targetScroll)) {
            var target = $(targetScroll)
            if (target.length !== 0) {
              self.click(function (e) {
                var animation = self.attr('data-action-animation')
                if (!_.isUndefined(animation) && animation.toLowerCase() === 'false') {
                  target.animate({ scrollTop: target[0].scrollHeight }, 0)
                } else {
                  target.animate({ scrollTop: target[0].scrollHeight }, 1000)
                }

                var preventDefault = self.attr('data-preventDefault')
                if (_.isUndefined(preventDefault) || preventDefault.length < 1) {
                  e.preventDefault()
                } else if (preventDefault.toLowerCase() === 'true') {
                  e.preventDefault()
                }
              })
            }
          }
        }
      })
    })
  }

  helpers.fadeOutLoader = function (time) {
    if (_.isUndefined(time)) {
      time = 100
    }

    $(document).ready(function () {
      $('#loader').fadeOut(time)
    })
  }

  helpers.hideLoader = function (time) {
    if (_.isUndefined(time) || _.isNull(time)) {
      time = 280
    }

    $(document).ready(function () {
      $('#loader-wrapper').fadeOut(time)
    })
  }

  helpers.showLoader = function (opacity) {
    if (_.isUndefined(opacity) || _.isNull(opacity)) {
      opacity = 1
    }

    var $loader = $('#loader-wrapper')
    $loader.css({ opacity: 0, display: 'block' })
    $loader.animate({ opacity: opacity }, 500)
  }

  helpers.ajaxFormSubmit = function () {
    // Bind to forms
    $('form.ajaxSubmit').each(function () {
      var self = $(this)
      self.submit(function (e) {
        $.ajax({
          type: self.attr('method'),
          url: self.attr('action'),
          data: self.serialize(),
          success: function () {
            // send socket to add reply.
            self.find('*[data-clearOnSubmit="true"]').each(function () {
              $(this).val('')
            })
          }
        })

        e.preventDefault()
        return false
      })
    })
  }

  helpers.setTimezone = function () {
    var $timezone = $('#__timezone')
    var timezone
    if ($timezone.length < 1) {
      Cookies.set('$trudesk:timezone', 'America/New_York')
    } else {
      timezone = Cookies.get('$trudesk:timezone')
      var __timezone = $timezone.text()
      if (!timezone) {
        Cookies.set('$trudesk:timezone', __timezone)
      } else if (timezone !== __timezone) {
        Cookies.set('$trudesk:timezone', __timezone)
      }
    }

    timezone = Cookies.get('$trudesk:timezone')

    moment.tz.setDefault(timezone)
    $timezone.remove()
  }

  helpers.getTimezone = function () {
    var timezone = Cookies.get('$trudesk:timezone')
    if (!timezone) {
      timezone = 'America/New_York'
    }

    return timezone
  }

  helpers.getTimeFormat = function () {
    if (window.trudeskSettingsService) {
      return window.trudeskSettingsService.getSettings().timeFormat.value
    }

    return 'hh:mma'
  }

  helpers.getCalendarDate = function (date) {
    moment.updateLocale('en', {
      calendar: {
        sameDay: '[Today at] LT',
        lastDay: '[Yesterday at] LT',
        nextDay: '[Tomorrow at] LT',
        lastWeek: '[Last] ddd [at] LT',
        nextWeek: 'ddd [at] LT',
        sameElse: helpers.getShortDateFormat()
      }
    })
    return moment
      .utc(date)
      .tz(this.getTimezone())
      .calendar()
  }

  helpers.calendarDate = helpers.getCalendarDate

  helpers.getShortDateFormat = function () {
    if (window.trudeskSettingsService) {
      return window.trudeskSettingsService.getSettings().shortDateFormat.value
    }

    return 'MM/DD/YYYY'
  }

  helpers.getLongDateFormat = function () {
    if (window.trudeskSettingsService) {
      return window.trudeskSettingsService.getSettings().longDateFormat.value
    }

    return 'MMM DD, YYYY'
  }

  helpers.formatDate = function (date, format) {
    var timezone = this.getTimezone()
    if (!timezone) {
      timezone = 'America/New_York'
    }

    return moment
      .utc(date)
      .tz(timezone)
      .format(format)
  }

  helpers.setupChosen = function () {
    $('.chosen-select').each(function () {
      var self = $(this)
      var nosearch = $(this).attr('data-nosearch')
      var placeholder = ''
      var elePlaceHolder = $(this).attr('data-placeholder')
      var noResults = 'No Results Found For '
      var eleNoResults = $(this).attr('data-noresults')
      var searchNum = 10
      if (nosearch) searchNum = 90000
      if (!_.isUndefined(elePlaceHolder) && elePlaceHolder.length > 0) {
        placeholder = elePlaceHolder
      }

      if (!_.isUndefined(eleNoResults) && eleNoResults.length > 0) {
        noResults = eleNoResults
      }

      self.chosen({
        disable_search_threshold: searchNum,
        placeholder_text_single: placeholder,
        placeholder_text_multiple: placeholder,
        no_results_text: noResults
      })
    })
  }

  helpers.clearMessageContent = function () {
    var contentDiv = $('#message-content')
    if (contentDiv.length > 0) {
      contentDiv.html('')
    }
  }

  helpers.closeMessageWindow = function () {
    // Close reveal and refresh page.
    UIkit.modal('#newMessageModal').hide()
    // Clear Fields
    var $newMessageTo = $('#newMessageTo')
    $newMessageTo.find('option').prop('selected', false)
    $newMessageTo.trigger('chosen:updated')
    $('#newMessageSubject').val('')
    $('#newMessageText').val('')
  }

  helpers.bindNewMessageSubmit = function () {
    var messageForm = $('#newMessageForm')
    if (messageForm.length < 1) return

    messageForm.unbind('submit', newMessageSubmit)
    messageForm.bind('submit', newMessageSubmit)
  }

  function newMessageSubmit (e) {
    e.preventDefault()
    var form = $('#newMessageForm')
    var formData = form.serializeObject()

    if (!form.isValid(null, null, false)) {
      return true
    }

    var data = {
      to: formData.newMessageTo,
      from: formData.from,
      subject: formData.newMessageSubject,
      message: formData.newMessageText
    }

    $.ajax({
      method: 'POST',
      url: '/api/v1/messages/send',
      data: JSON.stringify(data),
      processData: false,
      // headers: { 'Content-Type': 'application/json'}
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    })
      .success(function () {
        // helpers.showFlash('Message Sent');
        helpers.UI.showSnackbar({ text: 'Message Sent' })

        helpers.closeMessageWindow()
      })
      .error(function (err) {
        helpers.closeMessageWindow()
        // helpers.showFlash(err.error, true);
        helpers.UI.showSnackbar({ text: err.error, actionTextColor: '#B92929' })
        console.log('[trudesk:helpers:newMessageSubmit] Error - ' + err)
      })
  }

  helpers.canUser = function (a, adminOverride) {
    var role = window.trudeskSessionService.getUser().role
    var roles = window.trudeskSessionService.getRoles()

    if (adminOverride === true && role.isAdmin) return true

    if (_.isUndefined(role)) return false
    if (_.isUndefined(roles)) return false
    if (__.hasIn(role, '_id')) role = role._id
    var rolePerm = _.find(roles, { _id: role })
    if (_.isUndefined(rolePerm)) return false
    if (_.indexOf(rolePerm.grants, '*') !== -1) return true
    if (_.isUndefined(a)) return false

    var actionType = a.split(':')[0]
    var action = a.split(':')[1]

    if (_.isUndefined(actionType) || _.isUndefined(action)) return false

    var result = _.filter(rolePerm.grants, function (value) {
      if (__.startsWith(value, actionType + ':')) return value
    })

    if (_.isUndefined(result) || _.size(result) < 1) return false
    if (_.size(result) === 1) {
      if (result[0] === '*') return true
    }

    var typePerm = result[0].split(':')[1].split(' ')
    typePerm = _.uniq(typePerm)

    if (_.indexOf(typePerm, '*') !== -1) return true

    return _.indexOf(typePerm, action) !== -1
  }

  helpers.hasHierarchyEnabled = function (roleId) {
    var roles = window.trudeskSessionService.getRoles()
    var role = _.find(roles, function (o) {
      return o._id.toString() === roleId.toString()
    })
    if (_.isUndefined(role) || _.isUndefined(role.hierarchy)) throw new Error('Invalid Role: ' + roleId)
    return role.hierarchy
  }

  helpers.parseRoleGrants = function (grants) {
    // Takes an array of grants and returns object
    if (_.isUndefined(grants) || !_.isArray(grants)) return null
    var final = {}
    _.each(grants, function (grant) {
      var grantName = grant.split(':')[0]
      var typePerm = grant.split(':')[1].split(' ')
      typePerm = _.uniq(typePerm)
      var obj = {}
      obj[grantName] = {
        all: typePerm.indexOf('*') !== -1,
        create: typePerm.indexOf('create') !== -1,
        view: typePerm.indexOf('view') !== -1,
        update: typePerm.indexOf('update') !== -1,
        delete: typePerm.indexOf('delete') !== -1,
        special: __.without(typePerm, '*', 'create', 'view', 'update', 'delete')
      }

      final = __.merge(final, obj)
    })

    return final
  }

  helpers.parseRoleHierarchy = function (roleId) {
    var roleOrder = window.trudeskSessionService.getRoleOrder()
    if (_.isUndefined(roleOrder)) return []
    roleOrder = roleOrder.order

    var idx = _.findIndex(roleOrder, function (i) {
      return i.toString() === roleId.toString()
    })
    if (idx === -1) return []

    return _.rest(roleOrder, idx)
  }

  helpers.getLoggedInRoleHierarchy = function () {
    var loggedInRole = window.trudeskSessionService.getUser().role
    return helpers.parseRoleHierarchy(loggedInRole._id)
  }

  helpers.getRolesByHierarchy = function () {
    var roleOrder = helpers.getLoggedInRoleHierarchy()
    var roles = window.trudeskSessionService.getRoles()
    var returnedRoles = []
    _.each(roles, function (r) {
      var idx = _.findIndex(roleOrder, function (i) {
        return i.toString() === r._id.toString()
      })
      if (idx !== -1) returnedRoles.push(roles[idx])
    })

    return returnedRoles
  }

  helpers.hasHierarchyOverRole = function (roleToCheck) {
    var loggedInRole = window.trudeskSessionService.getUser().role
    var roleOrder = helpers.parseRoleHierarchy(loggedInRole._id)
    if (roleOrder.length < 1) return false
    var idx = _.findIndex(roleOrder, function (i) {
      return i.toString() === roleToCheck.toString()
    })

    return idx !== -1
  }

  helpers.hasPermOverRole = function (ownerRole, extRole, action, adminOverride) {
    if (action && !helpers.canUser(action, adminOverride)) return false
    if (!extRole) extRole = window.trudeskSessionService.getUser().role
    if (!_.isObject(ownerRole) || !_.isObject(extRole)) {
      console.log('Invalid Role Sent to helpers.hasPermOverRole. [Must be role obj]')
      console.log('Owner: ' + ownerRole)
      console.log('ExtRole: ' + extRole)
      return false
    }

    if (extRole.role) {
      console.warn(
        'Seems like a user object was sent to helpers.hasPermOverRole --- [extRole must be a role object or null]'
      )
      return false
    }

    if (ownerRole._id === extRole._id) return true

    if (adminOverride === true) {
      if (extRole && extRole.isAdmin) {
        return true
      } else {
        var r = window.trudeskSessionService.getRoles()
        var role = _.find(r, function (_role) {
          return _role._id.toString() === extRole._id.toString()
        })
        if (!_.isUndefined(role) && role.isAdmin) return true
      }
    }

    var roles = helpers.parseRoleHierarchy(extRole._id)

    var i = _.find(roles, function (o) {
      return o.toString() === ownerRole.toString()
    })

    return !_.isUndefined(i)
  }

  helpers.flushRoles = function () {
    window.trudeskSessionService.flushRoles()
    window.react.redux.store.dispatch({ type: 'FETCH_ROLES' })
  }

  helpers.setupContextMenu = function (selector, complete) {
    var $selector = $(selector)
    if ($selector.length < 1) return false

    $(document).off('mousedown')
    $(document).on('mousedown', function (e) {
      if ($(e.target).parents('.context-menu').length < 1) {
        var cm = $('.context-menu')
        if (cm.length > 0) {
          cm.hide(100)
        }
      }
    })

    var menuOpenFor
    $selector.off('contextmenu')
    $selector.on('contextmenu', function (event) {
      event.preventDefault()
      menuOpenFor = event.target
      $('.context-menu')
        .finish()
        .toggle(100)
        .css({
          top: event.pageY + 'px',
          left: event.pageX + 'px'
        })
    })

    $selector.off('mousedown')
    $selector.on('mousedown', function (event) {
      if ($(event.target).parents('.context-menu').length < 1) {
        $('.context-menu').hide(100)
      }
    })

    var $contextMenuLi = $('.context-menu li')
    $contextMenuLi.each(function () {
      var $item = $(this)
      $item.off('click')
      $item.on('click', function () {
        $('.context-menu').hide(100)
        if (!_.isFunction(complete)) {
          console.log('Invalid Callback Function in Context-Menu!')
        } else {
          return complete($(this).attr('data-action'), menuOpenFor)
        }
      })
    })
  }

  helpers.setupTruTabs = function (tabs) {
    var toggleTab = function (element) {
      if ($(element).hasClass('active')) {
        $(element)
          .parent()
          .find('.tru-tab-highlighter')
          .css({ width: $(element).outerWidth() })
      }

      $(element).off('click')
      $(element).on('click', function (event) {
        event.preventDefault()
        if ($(this).hasClass('active')) return true

        var $highlighter = $(this)
          .parent()
          .find('.tru-tab-highlighter')
        $(this)
          .parent()
          .find('.tru-tab-selector')
          .each(function () {
            $(this).removeClass('active')
          })

        $(this).addClass('active')
        $highlighter.css({ width: $(this).outerWidth() })

        var tabId = $(this).attr('data-tabid')

        $(this)
          .parents('.tru-tabs')
          .find('.tru-tab-section')
          .each(function () {
            $(this)
              .removeClass('visible')
              .addClass('hidden')
          })

        $(this)
          .parents('.tru-tabs')
          .find('.tru-tab-section[data-tabid="' + tabId + '"]')
          .addClass('visible')
          .removeClass('hidden')

        var highlighterPos = $(this).position().left + 'px'
        $highlighter.css('transform', 'translateX(' + highlighterPos + ')')
      })
    }

    _.each(tabs, function (i) {
      toggleTab(i)
    })
  }

  function stringStartsWith (string, prefix) {
    return string.slice(0, prefix.length) === prefix
  }

  helpers.prototypes = function () {
    // eslint-disable-next-line
    String.prototype.formatUnicorn =
      String.prototype.formatUnicorn ||
      function () {
        var str = this.toString()
        if (arguments.length) {
          var t = typeof arguments[0]
          var key
          var args = t === 'string' || t === 'number' ? Array.prototype.slice.call(arguments) : arguments[0]

          for (key in args) {
            str = str.replace(new RegExp('\\{' + key + '\\}', 'gi'), args[key])
          }
        }

        return str
      }
  }

  helpers.arrayIsEqual = function (value, other) {
    var isEqual = function (value, other) {
      // Get the value type
      var type = Object.prototype.toString.call(value)

      // If the two objects are not the same type, return false
      if (type !== Object.prototype.toString.call(other)) return false

      // If items are not an object or array, return false
      if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false

      // Compare the length of the length of the two items
      var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length
      var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length
      if (valueLen !== otherLen) return false

      // Compare two items
      var compare = function (item1, item2) {
        // Get the object type
        var itemType = Object.prototype.toString.call(item1)

        // If an object or array, compare recursively
        if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
          if (!isEqual(item1, item2)) return false
        }

        // Otherwise, do a simple comparison
        else {
          // If the two items are not the same type, return false
          if (itemType !== Object.prototype.toString.call(item2)) return false

          // Else if it's a function, convert to a string and compare
          // Otherwise, just compare
          if (itemType === '[object Function]') {
            if (item1.toString() !== item2.toString()) return false
          } else {
            if (item1 !== item2) return false
          }
        }
      }

      // Compare properties
      if (type === '[object Array]') {
        for (var i = 0; i < valueLen; i++) {
          if (compare(value[i], other[i]) === false) return false
        }
      } else {
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            if (compare(value[key], other[key]) === false) return false
          }
        }
      }

      // If nothing failed, return true
      return true
    }

    return isEqual(value, other)
  }

  helpers.UI.hierarchicalShow = function (element) {
    var $hierarchicalShow = $('.hierarchical_show')

    if ($hierarchicalShow.length) {
      $hierarchicalShow.each(function () {
        var timeout = $(this).attr('data-show-delay') ? parseInt($(this).attr('data-show-delay')) : 0
        var $this = $(this)
        var thisChildrenLength = $this.children().length
        var baseDelay = 100

        $this.children().each(function (index) {
          $(this).css({
            '-webkit-animation-delay': index * baseDelay + 'ms',
            'animation-delay': index * baseDelay + 'ms'
          })
        })

        setTimeout(function () {
          $this.waypoint({
            handler: function () {
              $this.addClass('hierarchical_show_inView')
              setTimeout(function () {
                $this
                  .removeClass('hierarchical_show hierarchical_show_inView fast_animation')
                  .children()
                  .css({
                    '-webkit-animation-delay': '',
                    'animation-delay': ''
                  })
              }, thisChildrenLength * baseDelay + 1200)
              this.destroy()
            },
            context: 'window',
            offset: '90%'
          })
        }, timeout)
      })
    }
    if (element) {
      var $this = $(element).addClass('hierarchical_show hierarchical_show_inView')
      var thisChildrenLength = $this.children().length
      var baseDelay = 100

      $this.children().each(function (index) {
        $(this).css({
          '-webkit-animation-delay': index * baseDelay + 'ms',
          'animation-delay': index * baseDelay + 'ms'
        })
      })

      $this.addClass('')
      setTimeout(function () {
        $this
          .removeClass('hierarchical_show hierarchical_show_inView fast_animation')
          .children()
          .css({
            '-webkit-animation-delay': '',
            'animation-delay': ''
          })
      }, thisChildrenLength * baseDelay + 1200)
    }
  }

  helpers.UI.hierarchicalSlide = function (element) {
    var $hierarchicalSlide = $('.hierarchical_slide')
    if ($hierarchicalSlide.length) {
      $hierarchicalSlide.each(function () {
        var $this = $(this)
        var $thisChildren = $this.attr('data-slide-children')
          ? $this.children($this.attr('data-slide-children'))
          : $this.children()
        var thisChildrenLength = $thisChildren.length
        var thisContext = $this.attr('data-slide-context')
          ? $this.closest($this.attr('data-slide-context'))[0]
          : 'window'
        var delay = $this.attr('data-delay') ? parseInt($this.attr('data-delay')) : 0
        var baseDelay = 100

        if (thisChildrenLength >= 1) {
          $thisChildren.each(function (index) {
            $(this).css({
              '-webkit-animation-delay': index * baseDelay + 'ms',
              'animation-delay': index * baseDelay + 'ms'
            })
          })

          setTimeout(function () {
            $this.waypoint({
              handler: function () {
                $this.addClass('hierarchical_slide_inView')
                setTimeout(function () {
                  $this.removeClass('hierarchical_slide hierarchical_slide_inView')
                  $thisChildren.css({
                    '-webkit-animation-delay': '',
                    'animation-delay': ''
                  })
                }, thisChildrenLength * baseDelay + 1200)
                this.destroy()
              },
              context: thisContext,
              offset: '90%'
            })
          }, delay)
        }
      })
    }

    if (element) {
      var $this = $(element).addClass('hierarchical_slide hierarchical_slide_inView')
      var $thisChildren = $this.attr('data-slide-children')
        ? $this.children($this.attr('data-slide-children'))
        : $this.children()
      var thisChildrenLength = $thisChildren.length
      // var thisContext = $this.attr('data-slide-context') ? $this.closest($this.attr('data-slide-context'))[0] : 'window'
      var baseDelay = 100

      if (thisChildrenLength >= 1) {
        $thisChildren.each(function (index) {
          $(this).css({
            '-webkit-animation-delay': index * baseDelay + 'ms',
            'animation-delay': index * baseDelay + 'ms'
          })
        })

        setTimeout(function () {
          $this.removeClass('hierarchical_slide hierarchical_slide_inView')
          $thisChildren.css({
            '-webkit-animation-delay': '',
            'animation-delay': ''
          })
        }, thisChildrenLength * baseDelay + 1200)
      }
    }
  }

  helpers.setupImageLink = function (el) {
    var $this = $(el)
    var src = $this.attr('src')
    $this.addClass('hasLinked')
    var a = $('<a>')
      .addClass('no-ajaxy')
      .attr('href', src)
      .attr('target', '_blank')
    $this.wrap(a)
  }

  return helpers
})
