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
 *  Updated:    3/12/19 11:32 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')
var winston = require('winston')

var commonV1 = {}

/**
 * Preforms login with username/password and adds
 * an access token to the {@link User} object.
 *
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {JSON} {@link User} object
 * @see {@link User}
 * @example
 * //Accepts Content-Type:application/json
 * {
 *    username: req.body.username,
 *    password: req.body.password
 * }
 *
 * @example
 * //Object Returned has the following properties removed
 * var resUser = _.clone(user._doc);
 * delete resUser.resetPassExpire;
 * delete resUser.resetPassHash;
 * delete resUser.password;
 * delete resUser.iOSDeviceToken;
 *
 */
commonV1.login = function (req, res) {
  var userModel = require('../../../models/user')
  var username = req.body.username
  var password = req.body.password

  if (_.isUndefined(username) || _.isUndefined(password)) {
    return res.sendStatus(403)
  }

  userModel.getUserByUsername(username, function (err, user) {
    if (err) return res.status(401).json({ success: false, error: err.message })
    if (!user) return res.status(401).json({ success: false, error: 'Invalid User' })

    if (!userModel.validate(password, user.password))
      return res.status(401).json({ success: false, error: 'Invalid Password' })

    var resUser = _.clone(user._doc)
    delete resUser.resetPassExpire
    delete resUser.resetPassHash
    delete resUser.password
    delete resUser.iOSDeviceTokens
    delete resUser.tOTPKey
    delete resUser.__v
    delete resUser.preferences

    if (_.isUndefined(resUser.accessToken) || _.isNull(resUser.accessToken)) {
      return res.status(200).json({ success: false, error: 'No API Key assigned to this User.' })
    }

    req.user = resUser
    res.header('X-Subject-Token', resUser.accessToken)
    return res.json({
      success: true,
      accessToken: resUser.accessToken,
      user: resUser
    })
  })
}

commonV1.getLoggedInUser = function (req, res) {
  if (!req.user) {
    return res.status(400).json({ success: false, error: 'Invalid Auth' })
  }

  var resUser = _.clone(req.user._doc)
  delete resUser.resetPassExpire
  delete resUser.accessToken
  delete resUser.resetPassHash
  delete resUser.password
  delete resUser.iOSDeviceTokens
  delete resUser.tOTPKey
  delete resUser.__v
  delete resUser.preferences

  return res.json({ success: true, user: resUser })
}

/**
 * Preforms logout
 * {@link User} object.
 *
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {JSON} Success/Error object
 *
 * @example
 * //Tokens are sent in the HTTP Header
 * var token = req.headers.token;
 * var deviceToken = req.headers.devicetoken;
 */
commonV1.logout = function (req, res) {
  var deviceToken = req.headers.devicetoken
  var user = req.user

  async.series(
    [
      function (callback) {
        if (!deviceToken) return callback()
        user.removeDeviceToken(deviceToken, 1, function (err) {
          if (err) return callback(err)

          callback()
        })
      }
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err.message })

      return res.status(200).json({ success: true })
    }
  )
}

module.exports = commonV1
