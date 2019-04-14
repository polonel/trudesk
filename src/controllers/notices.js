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

var _ = require('lodash')
var noticeSchema = require('../models/notice')
var permissions = require('../permissions')

var noticesController = {}

function handleError (res, err) {
  if (err) {
    return res.render('error', {
      layout: false,
      error: err,
      message: err.message
    })
  }
}

noticesController.get = function (req, res) {
  var user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:create')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  var content = {}
  content.title = 'Notices'
  content.nav = 'notices'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.notices = []

  noticeSchema.getNotices(function (err, notices) {
    if (err) return handleError(res, err)
    content.data.notices = notices

    res.render('notices', content)
  })
}

noticesController.create = function (req, res) {
  var user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:create')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  var content = {}
  content.title = 'Notices - Create'
  content.nav = 'notices'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata

  res.render('subviews/createNotice', content)
}

noticesController.edit = function (req, res) {
  var user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:update')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  var content = {}
  content.title = 'Notices - Edit'
  content.nav = 'notices'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  noticeSchema.getNotice(req.params.id, function (err, notice) {
    if (err) return handleError(res, err)
    content.data.notice = notice

    res.render('subviews/editNotice', content)
  })
}

module.exports = noticesController
