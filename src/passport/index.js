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

var passport = require('passport')
var Local = require('passport-local').Strategy
var TotpStrategy = require('passport-totp').Strategy
var JwtStrategy = require('passport-jwt').Strategy
var ExtractJwt = require('passport-jwt').ExtractJwt
var base32 = require('thirty-two')
var User = require('../models/user')
var nconf = require('nconf')

module.exports = function () {
  passport.serializeUser(function (user, done) {
    done(null, user._id)
  })

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user)
    })
  })

  passport.use(
    'local',
    new Local(
      {
        usernameField: 'login-username',
        passwordField: 'login-password',
        passReqToCallback: true
      },
      function (req, username, password, done) {
        User.findOne({ username: new RegExp('^' + username.trim() + '$', 'i') })
          .select('+password +tOTPKey +tOTPPeriod')
          .exec(function (err, user) {
            if (err) {
              return done(err)
            }

            if (!user || user.deleted) {
              return done(null, false, req.flash('loginMessage', 'No User Found.'))
            }

            if (!User.validate(password, user.password)) {
              return done(null, false, req.flash('loginMessage', 'Incorrect Password.'))
            }

            req.user = user

            return done(null, user)
          })
      }
    )
  )

  passport.use(
    'totp',
    new TotpStrategy(
      {
        window: 6
      },
      function (user, done) {
        if (!user.hasL2Auth) return done(false)

        User.findOne({ _id: user._id }, '+tOTPKey +tOTPPeriod', function (err, user) {
          if (err) return done(err)

          if (!user.tOTPPeriod) {
            user.tOTPPeriod = 30
          }

          return done(null, base32.decode(user.tOTPKey).toString(), user.tOTPPeriod)
        })
      }
    )
  )

  passport.use(
    'jwt',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: nconf.get('tokens') ? nconf.get('tokens').secret : false,
        ignoreExpiration: true
      },
      function (jwtPayload, done) {
        if (jwtPayload.exp < Date.now() / 1000) return done({ type: 'exp' })

        return done(null, jwtPayload.user)

        // User.findOne({ _id: jwtPayload.user._id }, function (err, user) {
        //   if (err) return done(err)
        //   if (user) {
        //     return done(null, jwtPayload.user)
        //   } else {
        //     return done(null, false)
        //   }
        // })
      }
    )
  )

  return passport
}
