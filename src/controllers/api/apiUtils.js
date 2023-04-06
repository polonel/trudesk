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

const _ = require('lodash')
const nconf = require('nconf')
const jwt = require('jsonwebtoken')
const { GroupModel, DepartmentModel } = require('../../models')

const apiUtils = {}

apiUtils.sendApiSuccess = function (res, object) {
  const sendObject = { success: true }
  const resObject = _.merge(sendObject, object)

  return res.json(resObject)
}

apiUtils.sendApiError = function (res, errorNum, error) {
  return res.status(errorNum).json({ success: false, error })
}
apiUtils.sendApiError_InvalidPostData = function (res) {
  return apiUtils.sendApiError(res, 400, 'Invalid Post Data')
}

apiUtils.generateJWTToken = async function (dbUser, session, callback) {
  return new Promise((resolve, reject) => {
    if (!dbUser || !session) return reject(new Error('Invalid Args'))
    ;(async () => {
      const resUser = _.clone(dbUser._doc)
      const refreshToken = resUser.accessToken
      delete resUser.resetPassExpire
      delete resUser.resetPassHash
      delete resUser.password
      delete resUser.iOSDeviceTokens
      delete resUser.tOTPKey
      delete resUser.__v
      // delete resUser.preferences
      delete resUser.accessToken
      delete resUser.deleted
      delete resUser.hasL2Auth

      const secret = nconf.get('tokens') ? nconf.get('tokens').secret : false
      const expires = nconf.get('tokens') ? nconf.get('tokens').expires : 3600
      if (!secret || !expires) return callback({ message: 'Invalid Server Configuration' })

      try {
        if (dbUser.role.isAdmin || dbUser.role.isAgent) {
          const groups = await DepartmentModel.getDepartmentGroupsOfUser(dbUser._id)
          resUser.groups = groups.map(g => g._id)

          const token = jwt.sign({ user: resUser, session: session._id }, secret, { expiresIn: expires })
          const refreshToken = jwt.sign({ s: session._id, r: session.refreshToken }, secret, { expiresIn: '96h' })
          const result = { session: session._id, token, refreshToken }

          if (typeof callback === 'function') return callback(null, result)

          return resolve(result)
        } else {
          const grps = await GroupModel.getAllGroupsOfUser(dbUser._id)
          resUser.groups = grps.map(function (g) {
            return g._id
          })

          const token = jwt.sign({ user: resUser, session: session._id }, secret, { expiresIn: expires })
          const refreshToken = jwt.sign({ s: session._id, r: session.refreshToken }, secret, { expiresIn: '96h' })
          const result = { session: session._id, token, refreshToken }

          if (typeof callback === 'function') return callback(null, result)

          return resolve(result)
        }
      } catch (e) {
        if (typeof callback === 'function') return callback(e)

        return reject(e)
      }
    })()
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
