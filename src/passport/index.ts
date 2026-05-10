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
 *  Updated:    4/25/2026 4:43 PM
 *  Copyright (c) 2014-2026. All rights reserved.
 */

import passport from 'passport'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Strategy as LocalStrategy } from 'passport-local'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TotpStrategy from 'passport-totp'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import base32 from 'thirty-two'
import { UserModel } from '../models'
import config from '../config'
import type { Request } from 'express'
import type { Types } from 'mongoose'

import type { LocalVerifyDone, TotpVerifyDone, JwtVerifyDone } from './types'

export default function (): passport.PassportStatic {
  config.loadConfig()

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as { _id: Types.ObjectId })._id)
  })

  passport.deserializeUser(async (id: Types.ObjectId, done) => {
    try {
      const user = await UserModel.findById(id)
      return done(null, user)
    } catch (e) {
      return done(e)
    }
  })

  passport.use(
    'local',
    new LocalStrategy(
      {
        usernameField: 'login-username',
        passwordField: 'login-password',
        passReqToCallback: true
      },
      async (req: Request, username: string, password: string, done: LocalVerifyDone) => {
        try {
          const user = await UserModel.findOne({ username: new RegExp('^' + username.trim() + '$', 'i') })
            .select('+password +tOTPKey +tOTPPeriod')
            .exec()

          if (!user || user.deleted || !UserModel.validatePassword(password, (user as any).password)) {
            return done(null, false, { flash: 'Invalid Username/Password' })
          }

          req.user = user

          return done(null, user)
        } catch (err: any) {
          return done(err)
        }
      }
    )
  )

  passport.use(
    'totp',
    new TotpStrategy.Strategy(
      { window: 6 },
      async (user: any, done: TotpVerifyDone) => {
        if (!user.hasL2Auth) return done(false)

        try {
          const u = await UserModel.findOne({ _id: user._id })
            .select('+tOTPKey +tOTPPeriod')
            .exec()

          if (!u) return done(false)
          if (!(u as any).tOTPPeriod) (u as any).tOTPPeriod = 30

          return done(null, base32.decode((u as any).tOTPKey).toString(), (u as any).tOTPPeriod)
        } catch (err: any) {
          return done(err)
        }
      }
    )
  )

  passport.use(
    'totp-verify',
    new TotpStrategy.Strategy(
      { window: 2 },
      (user: any, done: TotpVerifyDone) => {
        if (!user.tOTPKey) return done(false)
        if (!user.tOTPPeriod) user.tOTPPeriod = 30

        return done(null, base32.decode(user.tOTPKey).toString(), user.tOTPPeriod)
      }
    )
  )

  const jwtSecret = config.get('tokens') ? config.get('tokens').secret : false
  if (!jwtSecret) throw new Error('[PANIC] - Invalid JWT Secret!!')

  passport.use(
    'jwt',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.get('tokens') ? config.get('tokens').secret : false,
        ignoreExpiration: true
      },
      (jwtPayload: { exp: number; user: Express.User }, done: JwtVerifyDone) => {
        if (jwtPayload.exp < Date.now() / 1000) return done({ type: 'exp' })

        return done(null, jwtPayload.user)
      }
    )
  )

  return passport
}
