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

define('modules/socket.io/logs.io', ['jquery', 'underscore', 'moment', 'modules/helpers', 'history'], function (
  $,
  _,
  moment,
  helpers
) {
  var logsIO = {}

  cleanPreTags()

  logsIO.getLogData = function (socket) {
    socket.removeAllListeners('logs:data')
    socket.on('logs:data', function (data) {
      var $sLogs = $('#serverlogs')
      if ($sLogs.length > 0) {
        $sLogs.append(data)
        $sLogs.append('\n<br />')
        $sLogs.scrollTop(99999999999999 * 999999999999999)
        helpers.scrollToBottom($sLogs)
      }
    })
  }

  function cleanPreTags () {
    ;[].forEach.call(document.querySelectorAll('pre'), function ($pre) {
      var lines = $($pre)
        .html()
        .split('\n')
      var matches
      for (var i = 0; i < lines.length; i++) {
        var indentation = (matches = /^\s+/.exec(lines[i])) !== null ? matches[0] : null
        if (indentation) {
          // lines = lines.map(function(line) {
          //     return line.replace(indentation, '');
          // });
          lines[i].replace(/^\s+/, '')
        }
      }

      return $($pre).html(lines.join('\n').trim())
    })
  }

  return logsIO
})
