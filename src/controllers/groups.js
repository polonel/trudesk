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

const async = require('async')
const _ = require('lodash')
const userSchema = require('../models/user')
const groupSchema = require('../models/group')
const permissions = require('../permissions')

const groupsController = {}

groupsController.content = {}

groupsController.get = function (req, res) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:view')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content = {}
  content.title = 'Groups'
  content.nav = 'groups'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.groups = {}
  content.data.users = []

  groupSchema.getAllGroups(function (err, groups) {
    if (err) handleError(res, err)

    content.data.groups = _.sortBy(groups, 'name')

    userSchema.findAll(function (err, users) {
      if (err) handleError(res, err)

      content.data.users = _.sortBy(users, 'fullname')

      res.render('groups', content)
    })
  })
}

groupsController.getCreate = function (req, res) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:create')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content = {}
  content.title = 'Groups'
  content.nav = 'groups'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.groups = {}
  content.data.users = []

  userSchema.findAll(function (err, users) {
    if (err) return handleError(res, err)

    content.data.users = _.sortBy(users, 'fullname')

    res.render('subviews/createGroup', content)
  })
}

groupsController.edit = function (req, res) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'groups:edit')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content = {}
  content.title = 'Groups'
  content.nav = 'groups'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.users = []
  const groupId = req.params.id
  if (_.isUndefined(groupId)) return res.redirect('/groups/')

  async.parallel(
    {
      users: function (next) {
        userSchema.findAll(function (err, users) {
          if (err) return next(err)

          next(null, users)
        })
      },
      group: function (next) {
        groupSchema.getGroupById(groupId, function (err, group) {
          if (err) return next(err)

          next(null, group)
        })
      }
    },
    function (err, done) {
      if (err) return handleError(res, err)

      content.data.users = _.sortBy(done.users, 'fullname')
      content.data.group = done.group

      res.render('subviews/editGroup', content)
    }
  )
}

function handleError (res, err) {
  if (err) {
    return res.render('error', {
      layout: false,
      error: err,
      message: err.message
    })
  }
}

module.exports = groupsController
