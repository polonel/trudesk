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
 *  Updated:    2/14/19 12:30 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var User = require('../../../models/user')
var apiUtils = require('../apiUtils')

var commonV2 = {}

commonV2.login = function (req, res) {
  var username = req.body.username
  var password = req.body.password

  if (!username || !password) return apiUtils.sendApiError_InvalidPostData(res)

  User.getUserByUsername(username, function (err, user) {
    if (err) return apiUtils.sendApiError(res, 401, err.message)
    if (!user) return apiUtils.sendApiError(res, 401, 'Invalid Username/Password')

    if (!User.validate(password, user.password))
      return res.status(401).json({ success: false, error: 'Invalid Username/Password' })

    apiUtils.generateJWTToken(user, function (err, tokens) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)
      return apiUtils.sendApiSuccess(res, { token: tokens.token, refreshToken: tokens.refreshToken })
    })
  })
}

commonV2.token = function (req, res) {
  var refreshToken = req.body.refreshToken
  if (!refreshToken) return apiUtils.sendApiError_InvalidPostData(res)

  User.getUserByAccessToken(refreshToken, function (err, user) {
    if (err || !user) return apiUtils.sendApiError(res, 401)

    apiUtils.generateJWTToken(user, function (err, tokens) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)
      return apiUtils.sendApiSuccess(res, { token: tokens.token, refreshToken: tokens.refreshToken })
    })
  })
}

module.exports = commonV2
