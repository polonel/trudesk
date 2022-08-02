// http://getuikit.com/docs/documentation_javascript.html#js-override
var easing_swiftOut = [0.4, 0, 0.2, 1]

if (typeof UIkit !== 'undefined') {
  UIkit.on('beforeready.uk.dom', function () {
    // accrodion
    if (typeof UIkit.components.accordion !== 'undefined') {
      // check if accordion component is defined
      $.extend(UIkit.components.accordion.prototype.defaults, {
        easing: easing_swiftOut,
        duration: 200
      })
    }

    if (typeof UIkit.components.datepicker !== 'undefined') {
      $.extend(UIkit.components.datepicker.prototype.defaults, {})
    }

    // dropdown
    if (typeof UIkit.components.dropdown.prototype !== 'undefined') {
      // check if dropdown component is defined

      $.extend(UIkit.components.dropdown.prototype.defaults, {
        remaintime: 150,
        delay: 50
      })
      ;(function () {
        var old_show_function = UIkit.components.dropdown.prototype.show

        UIkit.components.dropdown.prototype.show = function () {
          this.dropdown
            .css({
              'min-width': this.dropdown.outerWidth()
            })
            .addClass('uk-dropdown-active uk-dropdown-shown')

          return old_show_function.apply(this, arguments)
        }
      })()
      ;(function () {
        var old_hide_function = UIkit.components.dropdown.prototype.hide

        UIkit.components.dropdown.prototype.hide = function () {
          var this_dropdown = this.dropdown

          this_dropdown.removeClass('uk-dropdown-shown')

          var dropdown_timeout = setTimeout(function () {
            this_dropdown.removeClass('uk-dropdown-active')
          }, 280)

          return old_hide_function.apply(this, arguments)
        }
      })()
    }

    // modal
    if (typeof UIkit.components.modal !== 'undefined') {
      // check if modal component is defined

      $.extend(UIkit.components.modal.prototype.defaults, {
        center: true
      })

      var $body = $('body')

      UIkit.modal.dialog.template =
        '<div class="uk-modal uk-modal-dialog-replace"><div class="uk-modal-dialog" style="min-height:0;"></div></div>'
      $body.on('show.uk.modal', '.uk-modal-dialog-replace', function () {
        // customize uikit dialog
        setTimeout(function () {
          var dialogReplace = $('.uk-modal-dialog-replace')
          if (dialogReplace.find('.uk-button-primary').length) {
            var actionBtn = dialogReplace
              .find('.uk-button-primary')
              .toggleClass('uk-button-primary md-btn-flat-primary')
            if (actionBtn.next('button')) {
              actionBtn.next('button').after(actionBtn)
            }
          }
          if (dialogReplace.find('.uk-button').length) {
            dialogReplace.find('.uk-button').toggleClass('uk-button md-btn md-btn-flat')
          }
          if (dialogReplace.find('.uk-margin-small-top').length) {
            dialogReplace.find('.uk-margin-small-top').toggleClass('uk-margin-small-top uk-margin-top')
          }
          if (dialogReplace.find('input.uk-width-1-1').length) {
            dialogReplace.find('input.uk-width-1-1').toggleClass('uk-width-1-1 md-input')
          }
          if (dialogReplace.find('.uk-form').length) {
            dialogReplace.find('.uk-form').removeClass('uk-form')
          }
        }, 50)
      })
    }

    // tooltip
    if (typeof UIkit.components.tooltip !== 'undefined') {
      // check if tooltip component is defined
      $.extend(UIkit.components.tooltip.prototype.defaults, {
        animation: 280,
        offset: 8
      })
    }

    // sortable
    if (typeof UIkit.components.sortable !== 'undefined') {
      // check if sortable component is defined
      if (Modernizr.touch) {
        $('[data-uk-sortable]')
          .children()
          .addClass('needsclick')
      }
    }
  })
}
