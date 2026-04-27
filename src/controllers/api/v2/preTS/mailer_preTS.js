/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    1/15/20, 1:23 AM
 *  Copyright (c) 2014-2020 Trudesk, Inc. All rights reserved.
 */
var mailCheck = require('../../../mailer/mailCheck')
var apiUtils = require('../apiUtils')

var mailerApi = {}

mailerApi.check = function (req, res) {
  mailCheck.refetch()
  return apiUtils.sendApiSuccess(res)
}

module.exports = mailerApi
