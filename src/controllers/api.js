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

var async = require('async')
var _ = require('lodash')
var winston = require('winston')
var permissions = require('../permissions')
var userSchema = require('../models/user')

// Sub APIs
var apiTicketsV1 = require('./api/v1/tickets')
var apiTagsV1 = require('./api/v1/tags')
var apiNoticesV1 = require('./api/v1/notices')
var apiUsersV1 = require('./api/v1/users')
var apiMessagesV1 = require('./api/v1/messages')
var apiGroupsV1 = require('./api/v1/groups')
var apiReportsV1 = require('./api/v1/reports')
var apiSettingsV1 = require('./api/v1/settings')
var apiPluginsV1 = require('./api/v1/plugins')

var apiController = {}
apiController.v1 = {}
apiController.v1.tickets = apiTicketsV1
apiController.v1.tags = apiTagsV1
apiController.v1.notices = apiNoticesV1
apiController.v1.users = apiUsersV1
apiController.v1.messages = apiMessagesV1
apiController.v1.groups = apiGroupsV1
apiController.v1.reports = apiReportsV1
apiController.v1.settings = apiSettingsV1
apiController.v1.plugins = apiPluginsV1

apiController.v2 = {}
apiController.v2.common = require('./api/v2/common')
apiController.v2.tickets = require('./api/v2/tickets')

apiController.import = function (req, res) {
  var fs = require('fs')
  var path = require('path')
  var UserModal = require('../models/user')
  var groupModel = require('../models/group')

  var array = fs
    .readFileSync(path.join(__dirname, '..', 'import.csv'))
    .toString()
    .split('\n')
  var clean = array.filter(function (e) {
    return e
  })

  async.eachSeries(
    clean,
    function (item, cb) {
      winston.info(item)

      var fields = item.split(',')
      var fullname = fields[0].toString().replace('.', ' ')
      var k = fullname.split(' ')
      var kCap = _.capitalize(k[0])
      var kCap1 = _.capitalize(k[1])
      fullname = kCap + ' ' + kCap1

      var groupName = fields[2].replace('\\r', '')
      groupName = _.trim(groupName)
      var User = new UserModal({
        username: fields[0],
        password: 'Password123',
        email: fields[1],
        fullname: fullname,
        role: 'user'
      })

      async.series(
        [
          function (next) {
            User.save(function (err) {
              if (err) return next(err)

              next()
            })
          },
          function (next) {
            winston.debug('Getting Group "' + groupName + '"')
            groupModel.getGroupByName(groupName, function (err, group) {
              if (err) return next(err)

              if (_.isUndefined(group) || _.isNull(group)) {
                return next('no group found = ' + groupName)
              }

              group.addMember(User._id, function (err) {
                if (err) return next(err)

                group.save(function (err) {
                  if (err) return next(err)

                  next()
                })
              })
            })
          }
        ],
        function (err) {
          if (err) return cb(err)

          cb()
        }
      )
    },
    function (err) {
      if (err) return res.status(500).send(err)

      res.status(200).send('Imported ' + _.size(clean))
    }
  )
}

/**
 * Redirects to login page
 * @param {object} req Express Request
 * @param {object} res Express Response
 * @return {View} Login View
 */
apiController.index = function (req, res) {
  res.redirect('login')
}

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
apiController.login = function (req, res) {
  var userModel = require('../models/user')
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

apiController.getLoggedInUser = function (req, res) {
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
apiController.logout = function (req, res) {
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

/**
 * @name apiController.roles
 * @description Stores all role/permission related static functions
 * @namespace
 */
apiController.roles = {}

apiController.roles.get = function (req, res) {
  var roleSchmea = require('../models/role')
  var roleOrderSchema = require('../models/roleorder')

  var roles = []
  var roleOrder = {}

  async.parallel(
    [
      function (done) {
        roleSchmea.find({}, function (err, r) {
          if (err) return done(err)

          roles = r

          return done()
        })
      },
      function (done) {
        roleOrderSchema.getOrder(function (err, ro) {
          if (err) return done(err)

          roleOrder = ro

          return done()
        })
      }
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err })

      return res.json({ success: true, roles: roles, roleOrder: roleOrder })
    }
  )
}

apiController.roles.create = function (req, res) {
  var name = req.body.name
  if (!name) return res.status(400).json({ success: false, error: 'Invalid Post Data' })

  var roleSchema = require('../models/role')
  var roleOrder = require('../models/roleorder')

  async.waterfall(
    [
      function (next) {
        roleSchema.create({ name: name }, next)
      },
      function (role, next) {
        if (!role) return next('Invalid Role')

        roleOrder.getOrder(function (err, ro) {
          if (err) return next(err)

          ro.order.push(role._id)

          ro.save(function (err, savedRo) {
            if (err) return next(err)

            return next(null, role, savedRo)
          })
        })
      }
    ],
    function (err, role, roleOrder) {
      if (err) return res.status(400).json({ success: false, error: err })

      global.roleOrder = roleOrder
      global.roles.push(role)

      return res.json({ success: true, role: role, roleOrder: roleOrder })
    }
  )
}

apiController.roles.update = function (req, res) {
  var _id = req.params.id
  var data = req.body
  if (_.isUndefined(_id) || _.isUndefined(data))
    return res.status(400).json({ success: false, error: 'Invalid Post Data' })

  var emitter = require('../emitter')
  var permissions = require('../permissions')
  var hierarchy = data.hierarchy ? data.hierarchy : false
  var cleaned = _.omit(data, ['_id', 'hierarchy'])
  var k = permissions.buildGrants(cleaned)
  var roleSchema = require('../models/role')
  roleSchema.get(data._id, function (err, role) {
    if (err) return res.status(400).json({ success: false, error: err })
    role.updateGrantsAndHierarchy(k, hierarchy, function (err) {
      if (err) return res.status(400).json({ success: false, error: err })

      emitter.emit('$trudesk:flushRoles')

      return res.send('OK')
    })
  })
}

apiController.roles.delete = function (req, res) {
  var _id = req.params.id
  var newRoleId = req.body.newRoleId
  if (!_id || !newRoleId) return res.status(400).json({ success: false, error: 'Invalid Post Data' })

  var roleSchema = require('../models/role')
  var roleOrderSchema = require('../models/roleorder')

  async.series(
    [
      function (done) {
        userSchema.updateMany({ role: _id }, { $set: { role: newRoleId } }, done)
      },
      function (done) {
        roleSchema.deleteOne({ _id: _id }, done)
      },
      function (done) {
        roleOrderSchema.getOrder(function (err, ro) {
          if (err) return done(err)

          ro.removeFromOrder(_id, done)
        })
      }
    ],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err })

      permissions.register(function (err) {
        if (err) return res.status(500).json({ success: false, error: err })

        return res.json({ success: true })
      })
    }
  )
}

module.exports = apiController
