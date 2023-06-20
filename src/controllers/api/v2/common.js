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

import crypto from 'crypto'
import moment from 'moment'
import pkg from '../../../../package.json'
import logger from '../../../logger'
import apiUtils from '../apiUtils'
import { SessionModel, TicketModel, UserModel } from '../../../models'
import jwt from 'jsonwebtoken'
import config from '../../../config'
import { getReleases } from '../../../memory/releases_inmemory'

const commonV2 = {}

commonV2.login = async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const mfa = req.body.mfa

  if (!username || !password) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const user = await UserModel.getByUsername(username)
    if (!user) return apiUtils.sendApiError(res, 401, 'Invalid Username/Password')

    if (!UserModel.validatePassword(password, user.password))
      return apiUtils.sendApiError(res, 401, 'Invalid Username/Password')

    if (user.hasL2Auth) {
      const auth = apiUtils.generateMFAToken(user._id)
      return apiUtils.sendApiSuccess(res, { uid: user._id, mfa: true, auth })
    }

    const hash = crypto.createHash('sha256')

    const session = await SessionModel.create({
      user: user._id,
      refreshToken: hash.update(user._id.toString()).digest('hex'),
      exp: moment()
        .utc()
        .add(96, 'hours')
        // .add(1, 'minutes')
        .toDate()
    })

    const cookie = {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
      // maxAge: 1000 * 60 // 1 min
    }

    const tokens = await apiUtils.generateJWTToken(user, session)

    res.cookie('_rft_', tokens.refreshToken, cookie)

    // This is temporary to handle middleware.hasAuth() until we can handle passing the token to download links,
    // such as backups and to load /uploads static files.
    // req.logIn(user, err => {
    //   if (err) throw err

    return apiUtils.sendApiSuccess(res, tokens)
    // })
  } catch (e) {
    logger.warn(e)
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

commonV2.logout = async (req, res) => {
  try {
    const rftJWT = req.cookies['_rft_']
    if (!rftJWT) return apiUtils.sendApiSuccess(res)

    const decoded = await jwt.verify(rftJWT, config.get('tokens:secret'))
    if (!decoded) return apiUtils.sendApiSuccess(res)
    const sessionId = decoded.s

    await SessionModel.deleteOne({ _id: sessionId })
    res.cookie('_rft_', null, { maxAge: 0 })

    return apiUtils.sendApiSuccess(res)
  } catch (e) {
    logger.warn(e)
    return apiUtils.sendApiError(res, 401, e)
  }
}

commonV2.token = async (req, res) => {
  const refreshToken = req.cookies['_rft_']
  if (!refreshToken) return apiUtils.sendApiSuccess(res)
  try {
    const decoded = jwt.verify(refreshToken, config.get('tokens:secret'))
    if (!decoded || !decoded.s) return apiUtils.sendApiError(res, 401)
    const sessionId = decoded.s

    let session = await SessionModel.findOne({ _id: sessionId })
    if (!session) {
      res.cookie('_rft_', null, { maxAge: 0 })
      return apiUtils.sendApiError(res, 401)
    }

    const expDate = new Date(session.exp)
    if (expDate < Date.now()) {
      await SessionModel.deleteOne({ _id: sessionId })
      res.cookie('_rft_', null, { maxAge: 0 })
      return apiUtils.sendApiError(res, 401)
    }

    // session.exp = moment()
    //   .utc()
    //   .add(96, 'hours')
    //   .toDate()

    const user = await UserModel.findOne({ _id: session.user })
    if (!user) {
      res.cookie('_rft_', null, { maxAge: 0 })
      await SessionModel.deleteOne({ _id: sessionId })
      return apiUtils.sendApiError(res, 401)
    }

    const tokens = await apiUtils.generateJWTToken(user, session)

    return apiUtils.sendApiSuccess(res, {
      token: tokens.token
    })
  } catch (e) {
    res.cookie('_rft_', null, { maxAge: 0 })
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

commonV2.viewData = async (req, res) => {
  return apiUtils.sendApiSuccess(res, { viewdata: req.viewdata })
}

commonV2.getReleases = async (req, res) => {
  let releaseChannel = config.get('trudesk')?.release
  if (!releaseChannel) releaseChannel = 'stable'
  return apiUtils.sendApiSuccess(res, { currentVersion: pkg.version, releaseChannel, releases: getReleases() })
}

commonV2.aboutStats = async (req, res) => {
  try {
    const stats = {
      version: 'v' + pkg.version
    }
    stats.ticketCount = await TicketModel.countDocuments({ deleted: false })

    const obj = {
      limit: 99999999,
      page: 0,
      showDeleted: false
    }
    const requesters = await UserModel.getRequesters(obj)
    const agents = await UserModel.getAgents(obj)
    stats.requesterCount = requesters ? requesters.length : 0
    stats.agentCount = agents ? agents.length : 0
    return apiUtils.sendApiSuccess(res, { stats })
  } catch (e) {
    return apiUtils.sendApiError(res, e)
  }
}

module.exports = commonV2
