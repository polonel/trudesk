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

import _ from 'lodash'
import nconf from 'nconf'
import jwt from 'jsonwebtoken'
import { GroupModel, DepartmentModel } from '../../models'
import Chance from 'chance'
import type { Response } from 'express'
import type { DocumentType } from '@typegoose/typegoose'
import type { UserModelClass } from '../../models/user'
import type { ISession } from '../../models/session'

const chance = new Chance()

type JWTResult = {
  session: string
  token: string
  refreshToken: string
}

type JWTCallback = (err: Error | null, result?: JWTResult) => void

const apiUtils = {
  sendApiSuccess(res: Response, object?: Record<string, unknown>) {
    const sendObject = { success: true }
    const resObject = _.merge(sendObject, object)
    return res.json(resObject)
  },

  sendApiError(res: Response, errorNum: number, error?: unknown) {
    return res.status(errorNum).json({ success: false, error })
  },

  sendApiError_InvalidPostData(res: Response) {
    return apiUtils.sendApiError(res, 400, 'Invalid Post Data')
  },

  generateMFAToken(userId: string) {
    const secret = nconf.get('tokens') ? (nconf.get('tokens') as { secret: string }).secret : false
    if (!secret) throw new Error('Invalid Server Configuration')
    return jwt.sign({ uid: userId, hash: chance.hash() }, secret, { expiresIn: '60s' })
  },

  verifyMFAToken(token: string) {
    const secret = nconf.get('tokens') ? (nconf.get('tokens') as { secret: string }).secret : false
    if (!secret) throw new Error('Invalid Server Configuration')
    return jwt.verify(token, secret)
  },

  async generateJWTToken(
    dbUser: DocumentType<UserModelClass>,
    session: ISession,
    callback?: JWTCallback
  ): Promise<JWTResult> {
    return new Promise((resolve, reject) => {
      ;(async () => {
        const resUser = _.clone((dbUser as any)._doc) as Record<string, unknown>
        const refreshTokenField = resUser['accessToken']
        void refreshTokenField
        delete resUser['resetPassExpire']
        delete resUser['resetPassHash']
        delete resUser['password']
        delete resUser['iOSDeviceTokens']
        delete resUser['tOTPKey']
        delete resUser['__v']
        delete resUser['accessToken']
        delete resUser['deleted']
        delete resUser['hasL2Auth']

        const tokens = nconf.get('tokens') as { secret?: string; expires?: number } | undefined
        const secret = tokens?.secret
        const expires = tokens?.expires ?? 3600
        if (!secret || !expires) {
          const err = new Error('Invalid Server Configuration')
          if (typeof callback === 'function') return callback(err)
          return reject(err)
        }

        try {
          const role = dbUser.role as { isAdmin?: boolean; isAgent?: boolean }
          if (role?.isAdmin || role?.isAgent) {
            const groups = await DepartmentModel.getDepartmentGroupsOfUser(dbUser._id)
            resUser['groups'] = groups.map(g => (g as any)._id)
          } else {
            const grps = await GroupModel.getAllGroupsOfUser(dbUser._id)
            resUser['groups'] = grps.map(g => (g as any)._id)
          }

          const token = jwt.sign({ user: resUser, session: session._id }, secret, { expiresIn: expires })
          const refreshToken = jwt.sign(
            { s: session._id, r: session.refreshToken },
            secret,
            { expiresIn: '96h' }
          )
          const result: JWTResult = { session: session._id as string, token, refreshToken }

          if (typeof callback === 'function') return callback(null, result)
          return resolve(result)
        } catch (e) {
          if (typeof callback === 'function') return callback(e as Error)
          return reject(e)
        }
      })()
    })
  },

  stripUserFields(user: Record<string, unknown>) {
    user['password'] = undefined
    user['accessToken'] = undefined
    user['__v'] = undefined
    user['tOTPKey'] = undefined
    user['iOSDeviceTokens'] = undefined
    return user
  },
}

export default apiUtils
module.exports = apiUtils
