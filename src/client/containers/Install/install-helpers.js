import UIkit from 'uikit'
import Snackbar from 'snackbar'
import $ from 'jquery'

const helpers = {
  isDoubleClicked: element => {
    element = $(element)
    if (element.data('isclicked')) return true

    element.data('isclicked', true)
    setTimeout(() => {
      element.removeData('isclicked')
    }, 1000)

    return false
  }
}

helpers.validateEmail = function (email) {
  var mailFormat = /^\w+([.-]\w+)*@\w+([.-]\w+)*(\.\w+)+$/
  return email.match(mailFormat)
}

helpers.UI = {}
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
    .removeClass('md-input-wrapper-danger md-input-wrapper-success uk-input-wrapper-nocolor md-input-wrapper-disabled')

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

helpers.UI.showSnackbar = function (text, error) {
  if (!error) error = false

  let actionText = '#4CAF50'
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

export default helpers
