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

import _ from 'lodash'
import permissions from '../permissions'

const reportsController: Record<string, any> = {}

reportsController.content = {}

reportsController.overview = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'reports:view')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Overview'
  content.nav = 'reports'
  content.subnav = 'reports-overview'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.groups = {}
  content.data.reports = {}

  return res.render('subviews/reports/overview', content)
}

reportsController.generate = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'reports:create')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Generate Report'
  content.nav = 'reports'
  content.subnav = 'reports-generate'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata

  const prioritySchema = require('../models/ticketpriority')
  prioritySchema.getPriorities(function (err: any, priorities: any) {
    if (err) {
      return res.render('error', {
        layout: false,
        error: err,
        message: err.message
      })
    }

    content.data.priorities = priorities

    return res.render('subviews/reports/generate', content)
  })
}

reportsController.breakdownGroup = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'reports:view')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Group Breakdown'
  content.nav = 'reports'
  content.subnav = 'reports-breakdown-group'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.groups = {}
  content.data.reports = {}

  return res.render('subviews/reports/breakdown_Group', content)
}

reportsController.breakdownUser = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'reports:view')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'User Breakdown'
  content.nav = 'reports'
  content.subnav = 'reports-breakdown-user'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.groups = {}
  content.data.reports = {}

  return res.render('subviews/reports/breakdown_User', content)
}

module.exports = reportsController
