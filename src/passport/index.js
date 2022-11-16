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

const passport = require('passport')
const Local = require('passport-local').Strategy
const TotpStrategy = require('passport-totp').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const LdapStrategy = require('passport-ldapauth')
const ExtractJwt = require('passport-jwt').ExtractJwt
var basicAuth = require('basic-auth')
const base32 = require('thirty-two')
const User = require('../models/user')
const Role = require('../models/role')
const LDAPGroup = require('../models/ldapGroup')
const nconf = require('nconf')
const crypto = require('crypto')
const Setting = require('../models/setting')
const { ConstraintViolationError } = require('ldapjs')

serverSettings = function (server) {

  Setting.findOne({ name: 'ldapSettings:host' }, (err, host) => {
    if (err) console.log(err);
    if (host) {
      server.url = host.value;
    } else {
      server.url = ''
    }
  })

  Setting.findOne({ name: 'ldapSettings:bindDN' }, (err, bindDN) => {
    if (err) console.log(err);
    if (bindDN) {
      server.bindDN = bindDN.value;
    } else {
      server.bindDN = '';
    }
  })

  Setting.findOne({ name: 'ldapSettings:password' }, (err, password) => {
    if (err) console.log(err);
    if (password) {
      server.bindCredentials = password.value;
    } else {
      server.bindCredentials = '';
    }
  })

  Setting.findOne({ name: 'ldapSettings:username' }, (err, username) => {
    if (err) console.log(err);
    if (username) {
      server.username = username.value;
    } else {
      server.username = '';
    }
  })

}

var server = {
  url: '',
  bindDN: '',
  bindCredentials: '',
  searchBase: 'CN=Users,DC=shatura,DC=pro',
  searchFilter: '(&(userPrincipalName={{username}}))'
}

serverSettings(server);

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
    'ldapauth',
    new LdapStrategy(
      {
        server,
        usernameField: 'login-username',
        passwordField: 'login-password'
      }
      // , function (req, user, done) {
      , function (req, done) {
        console.log(req);

        // return done(null, username);
        User.findOne({ username: req.userPrincipalName })
          .select('+password +tOTPKey +tOTPPeriod')
          .exec(function (err, user) {
            if (err) {
              return done(err)
            }

            if (user) {
              //Если пользователь найден, то проверить его роль
              //Если у пользователь входит в группу LDAP, которая привязана к роли, то присвоить ему эту роль
              let countRole = 0;
              let countGroup = 0;
              let rolesForUser = [];
              Role.find({}, (err, roles) => {
                if (err) return done(err);
                for (let role of roles) {
                  LDAPGroup.findOne({ _id: role.ldapGroupID }, (err, ldapGroup) => {
                    if (err) return done(err)
                    countRole = countRole + 1;
                    countGroup = 0;
                    for (let group of req.memberOf) {
                      countGroup = countGroup + 1;
                      if (group == ldapGroup.name) {
                        if (user.role._id !== role._id) {
                          rolesForUser.push({ name: role.name, _id: role._id })
                        }
                      }

                      if (countRole == roles.length && countGroup == req.memberOf.length) {
                        if (rolesForUser.length == 0) {
                          return done(null, false, console.log('loginMessage', 'The LDAP group is not tied to roles'))
                        }

                        roleUser = rolesForUser.filter(role => role.name == "Admin")[0];
                        if (!roleUser) {
                          roleUser = rolesForUser.filter(role => role.name == "Support")[0];
                          if (!roleUser) {
                            roleUser = rolesForUser.filter(role => role.name == "User")[0];
                          }
                        }

                        User.updateOne({ _id: user._id }, { role: roleUser._id }, (err) => {
                          if (err) return done(err)
                        })
                        return done(null, user)
                      }
                    }
                  })
                }
              })

            } else {
              let countRole = 0;
              let countGroup = 0;
              let rolesForUser = [];
              Role.find({}, (err, roles) => {
                if (err) return done(err)
                for (let role of roles) {
                  LDAPGroup.findOne({ _id: role.ldapGroupID }, (err, ldapGroup) => {
                    if (err) return done(err)
                    countRole = countRole + 1;
                    countGroup = 0;
                    for (let group of req.memberOf) {
                      countGroup = countGroup + 1;
                      if (!ldapGroup && role.name == 'User') {
                        rolesForUser.push({ name: role.name, _id: role._id })
                      } else if (ldapGroup?.name == group) {
                        rolesForUser.push({ name: role.name, _id: role._id })
                      } 
                      
                      if (countRole == roles.length && countGroup == req.memberOf.length) {
                        if (rolesForUser.length == 0) {
                          return done(null, false, console.log('loginMessage', 'The LDAP group is not tied to roles'))
                        }
                        roleUser = rolesForUser.filter(role => role.name == "Admin")[0];
                        if (!roleUser) {
                          roleUser = rolesForUser.filter(role => role.name == "Support")[0];
                          if (!roleUser) {
                            roleUser = rolesForUser.filter(role => role.name == "User")[0];
                          }
                        }

                        let telephoneNumber = ''
                        if ( req?.telephoneNumber){
                          telephoneNumber = req?.telephoneNumber.replace(/ /g,'');
                          telephoneNumber = telephoneNumber.replace(/\(/g,'');
                          telephoneNumber = telephoneNumber.replace(/\)/g,'');
                          telephoneNumber = telephoneNumber.replace(/-/g,'');
                        }
                        
                        const passwordGuid = crypto.randomUUID();
                        const newUser = {
                          username: req.userPrincipalName,
                          password: passwordGuid,
                          phone: telephoneNumber,
                          fullname: req.name,
                          email: req.userPrincipalName,
                          role: roleUser._id
                        }

                        User.create(newUser, function (err, user) {
                          if (err) return done(err)
                          return done(null, user)
                        })

                      }
                    }
                  })
                }
              })

              //Функция проверки ролей пользователя, удаление или добавление ролей

            }
          })
      })); //Можно подставить функцию для обработки результата, например завести в базе данных пользователя из LDAP

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

            if (!user || user.deleted || !User.validate(password, user.password)) {
              req.flash('loginMessage', '')
              return done(null, false, req.flash('loginMessage', 'Invalid Username/Password'))
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
    'totp-verify',
    new TotpStrategy(
      {
        window: 2
      },
      function (user, done) {
        if (!user.tOTPKey) return done(false)
        if (!user.tOTPPeriod) user.tOTPPeriod = 30

        return done(null, base32.decode(user.tOTPKey).toString(), user.tOTPPeriod)
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
      }
    )
  )

  return passport
}
