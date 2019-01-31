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

define('modules/ajaximgupload', ['jquery', 'underscore', 'modules/helpers'], function ($, _, helpers) {
  var aiu = {}

  aiu.init = function () {
    $(document).ready(function () {
      $('#profileImageInput').on('change', function () {
        var val = $(this).val()
        if (val === '') return true

        var form = $('#aUploadImageForm')
        var formData = new FormData($(form)[0])
        var timestamp = new Date().getTime()

        $.ajax({
          url: '/accounts/uploadImage',
          type: 'POST',
          data: formData,
          // async: false,
          cache: false,
          contentType: false,
          processData: false,
          success: function (data) {
            form.find('img').attr('src', data + '?' + timestamp)
          },
          error: function (err) {
            console.log('[trudesk:ajaximgupload:onChange] Error - ', err)
            helpers.UI.showSnackbar({
              text: 'An error occurred. Please check console. 2',
              actionTextColor: '#B92929'
            })
          }
        })

        $(this).val('')
      })
    })
  }

  return aiu
})
