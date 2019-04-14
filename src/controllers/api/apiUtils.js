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
 *  Updated:    2/14/19 2:09 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')

var apiUtils = {}

apiUtils.sendApiSuccess = function (res, object) {
  var sendObject = { success: true }
  var resObject = _.merge(sendObject, object)

  return res.json(resObject)
}

apiUtils.sendApiError = function (res, errorNum, error) {
  return res.status(errorNum).json({ success: false, error: error })
}
apiUtils.sendApiError_InvalidPostData = function (res) {
  return apiUtils.sendApiError(res, 400, 'Invalid Post Data')
}

apiUtils.generateJWTToken = function (dbUser, callback) {
  var nconf = require('nconf')
  var jwt = require('jsonwebtoken')

  var resUser = _.clone(dbUser._doc)
  var refreshToken = resUser.accessToken
  delete resUser.resetPassExpire
  delete resUser.resetPassHash
  delete resUser.password
  delete resUser.iOSDeviceTokens
  delete resUser.tOTPKey
  delete resUser.__v
  delete resUser.preferences
  delete resUser.accessToken
  delete resUser.deleted
  delete resUser.hasL2Auth

  var secret = nconf.get('tokens') ? nconf.get('tokens').secret : false
  var expires = nconf.get('tokens') ? nconf.get('tokens').expires : 3600
  if (!secret || !expires) return callback({ message: 'Invalid Server Configuration' })

  require('../../models/group').getAllGroupsOfUserNoPopulate(dbUser._id, function (err, grps) {
    if (err) return callback(err)
    resUser.groups = grps.map(function (g) {
      return g._id
    })

    var token = jwt.sign({ user: resUser }, secret, { expiresIn: expires })

    return callback(null, { token: token, refreshToken: refreshToken })
  })
}

apiUtils.stripUserFields = function (user) {
  user.password = undefined
  user.accessToken = undefined
  user.__v = undefined
  user.tOTPKey = undefined
  user.iOSDeviceTokens = undefined

  return user
}

module.exports = apiUtils
