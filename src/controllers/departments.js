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
 *  Updated:    3/20/19 1:14 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var permissions = require('../permissions')
var Department = require('../models/department')

var departmentController = {}

departmentController.get = function (req, res) {
  var user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'departments:view')) {
    return res.redirect('/')
  }

  var content = {}
  content.title = 'Departments'
  content.nav = 'departments'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.departments = {}

  return res.render('departments', content)
}

module.exports = departmentController
