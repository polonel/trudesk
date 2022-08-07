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
 *  Updated:    7/23/22 4:47 AM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import type { NextFunction, Request, Response } from 'express'
import * as _ from 'lodash'
import mongoose from 'mongoose'
import passport from 'passport'
import { init as databaseInit, TrudeskDatabase } from '../database'
import csrf from '../dependencies/csrf-td'
import viewdata from '../helpers/viewdata'
import winston from '../logger'
import { UserModel } from '../models'
import permissions from '../permissions'

export type RouteMiddlewareType = {
  db?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => TrudeskDatabase | void
  redirectToDashboardIfLoggedIn?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  redirectToLogin?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  ensurel2Auth?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  redirectIfUser?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  loadCommonData?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  cache?: (seconds: number) => (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  checkCaptcha?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  checkOrigin?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  api?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  hasAuth?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  apiv2?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  canUser?: (action: string) => (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  isAdmin?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  isAgentOrAdmin?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  isAgent?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  isSupport?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
  csrfCheck?: (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) => void
}

interface MiddlewareRequest extends Request {
  db: TrudeskDatabase | null | undefined
  user: any
  session: any
  viewdata: any
  csrfToken: any
}

interface MiddlewareResponse extends Response {
  session: any
}

const middleware: RouteMiddlewareType = {}

middleware.db = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    winston.warn('MongoDB ReadyState = ' + mongoose.connection.readyState)
    databaseInit(function (e, database) {
      if (e) {
        return res.status(503).send()
      }

      return (req.db = database)
    })
  }

  return next()
}

export const ensurel2Auth = function (req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction): void {
  if (req.session.l2auth === 'totp') {
    if (req.user) {
      if (req.user.role !== 'user') {
        return res.redirect('/dashboard')
      }

      return res.redirect('/tickets')
    }

    return next()
  }

  return res.redirect('/l2auth')
}
middleware.ensurel2Auth = ensurel2Auth

middleware.redirectToDashboardIfLoggedIn = (req, res, next) => {
  if (req.user) {
    if (req.user.hasL2Auth) {
      return ensurel2Auth(req, res, next)
    }

    if (!req.user.role.isAdmin || !req.user.role.isAgent) {
      return res.redirect('/tickets')
    }

    return res.redirect('/dashboard')
  }

  return next()
}

middleware.redirectToLogin = function (req, res, next) {
  if (!req.user) {
    if (!_.isUndefined(req.session)) {
      req.session.redirectUrl = req.url
    }

    return res.redirect('/')
  }

  if (req.user.deleted) {
    req.logout(function () {
      req.session.l2auth = null
      req.session.destroy()
      return res.redirect('/')
    })
  }

  if (req.user.hasL2Auth) {
    if (req.session.l2auth !== 'totp') {
      return res.redirect('/')
    }
  }

  return next()
}

middleware.redirectIfUser = function (req, res, next) {
  if (!req.user) {
    if (!_.isUndefined(req.session)) {
      res.session.redirectUrl = req.url
    }

    return res.redirect('/')
  }

  if (!req.user.role.isAdmin && !req.user.role.isAgent) {
    return res.redirect(301, '/tickets')
  }

  return next()
}

// Common
middleware.loadCommonData = function (req, _res, next) {
  viewdata.getData(req, function (data: { csrfToken: any }) {
    data.csrfToken = req.csrfToken
    req.viewdata = data

    return next()
  })
}

middleware.cache = function (seconds) {
  return function (_req, res, next) {
    res.setHeader('Cache-Control', 'public, max-age=' + seconds)

    next()
  }
}

middleware.checkCaptcha = function (req, res, next) {
  const postData = req.body
  if (postData === undefined) {
    return res.status(400).json({ success: false, error: 'Invalid Captcha' })
  }

  const captcha = postData.captcha
  const captchaValue = req.session.captcha

  if (captchaValue === undefined) {
    return res.status(400).json({ success: false, error: 'Invalid Captcha' })
  }

  if (captchaValue.toString() !== captcha.toString()) {
    return res.status(400).json({ success: false, error: 'Invalid Captcha' })
  }

  return next()
}

middleware.checkOrigin = function (req, res, next) {
  let origin = req.headers.origin
  const host = req.headers.host

  // Firefox Hack - Firefox Bug 1341689 & 1424076
  // Trudesk Bug #26
  // TODO: Fix this once Firefox fixes its Origin Header in same-origin POST request.
  if (!origin) {
    origin = host
  } else origin = origin.replace(/^https?:\/\//, '')

  if (origin !== host) {
    return res.status(400).json({ success: false, error: 'Invalid Origin!' })
  }

  return next()
}

// API
middleware.api = async function (req, res, next) {
  const accessToken = req.headers.accesstoken

  if (_.isUndefined(accessToken) || _.isNull(accessToken)) {
    const user = req.user
    if (_.isUndefined(user) || _.isNull(user)) return res.status(401).json({ error: 'Invalid Access Token' })

    return next()
  }

  try {
    const user = await UserModel.find(
      {
        accessToken,
        deleted: false,
      },
      '+password'
    )
    if (!user) return res.status(401).json({ error: 'Invalid Access Token' })

    req.user = user

    return next()
  } catch (err: any) {
    return res.status(401).json({ error: err.message })
  }
}

middleware.hasAuth = middleware.api

middleware.apiv2 = function (req, res, next) {
  // ByPass auth for now if user is set through session
  if (req.user) return next()

  passport.authenticate('jwt', { session: true }, function (err, user) {
    if (err && err.type === 'exp')
      return res.status(401).json({ success: false, error: { type: 'exp', message: 'invalid_token' } })

    if (err || !user) return res.status(401).json({ success: false, error: 'Invalid Authentication Token' })
    if (user) {
      req.user = user
      return next()
    }

    return res.status(500).json({ success: false, error: 'Unknown Error Occurred' })
  })(req, res, next)
}

middleware.canUser = function (action) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not Authorized for this API call.' })

    const perm = permissions.canThis(req.user.role._id, action)
    if (perm) return next()

    return res.status(401).json({ success: false, error: 'Not Authorized for this API call.' })
  }
}

middleware.isAdmin = function (req, res, next) {
  const roles = global.roles
  const role = _.find(roles, (role) => role._id.toString() === req.user.role._id.toString())
  if (role) {
    role.isAdmin = role.grants.indexOf('admin:*') !== -1

    if (role.isAdmin) return next()
  }

  return res.status(401).json({ success: false, error: 'Not Authorized for this API call.' })
}

middleware.isAgentOrAdmin = function (req, res, next) {
  const role = _.find(global.roles, (role) => role._id.toString() === req.user.role._id.toString())
  if (role) {
    role.isAdmin = role.grants.indexOf('admin:*') !== -1
    role.isAgent = role.grants.indexOf('agent:*') !== -1

    if (role.isAgent || role.isAdmin) return next()
  }

  return res.status(401).json({ success: false, error: 'Not Authorized for this API call.' })
}

middleware.isAgent = function (req, res, next) {
  const role = _.find(global.roles, { _id: req.user.role._id })
  if (role) {
    role.isAgent = role.grants.indexOf('agent:*') !== -1

    if (role.isAgent) return next()
  }

  return res.status(401).json({ success: false, error: 'Not Authorized for this API call.' })
}

middleware.isSupport = middleware.isAgent

middleware.csrfCheck = function (req, res, next) {
  csrf.init()
  return csrf.middleware(req, res, next)
}

module.exports = middleware

export default middleware
