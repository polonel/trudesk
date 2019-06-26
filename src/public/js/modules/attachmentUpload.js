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

define('modules/attachmentUpload', ['jquery', 'underscore', 'modules/helpers', 'modules/socket'], function (
  $,
  _,
  helpers,
  socket
) {
  var attachmentUploader = {}

  attachmentUploader.init = function () {
    $(document).ready(function () {
      $('.attachmentInput1').each(function () {
        $(this).on('change', function () {
          var self = $(this)
          var val = self.val()
          if (val === '') return true

          var form = $('#attachmentForm')
          if (_.isUndefined(form) || _.isNull(form)) return false

          var formData = new FormData($(form)[0])

          $.ajax({
            url: '/tickets/uploadattachment',
            type: 'POST',
            data: formData,
            // async: false,
            cache: false,
            contentType: false,
            processData: false,
            success: function (data) {
              // helpers.showFlash('Attachment Successfully Uploaded.');
              helpers.UI.showSnackbar('Attachment Successfully Uploaded', false)

              // Refresh Attachments - Socket.IO
              if (_.isUndefined(data.ticket)) return false

              socket.ui.refreshTicketAttachments(data.ticket._id)
            },
            error: function (err) {
              console.log('[trudesk:attachmentUpload:onChange] Error - ' + err)
              // helpers.showFlash(err.responseText, true);
              helpers.UI.showSnackbar(err.responseText, true)
            }
          })

          self.val('')
        })
      })
    })
  }

  return attachmentUploader
})
