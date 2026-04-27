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
import { NoticeModel as noticeSchema } from '../models'
import permissions from '../permissions'

const noticesController: Record<string, any> = {}

function handleError(res: any, err: any) {
  if (err) {
    return res.render('error', {
      layout: false,
      error: err,
      message: err.message
    })
  }
}

noticesController.get = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:create')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Notices'
  content.nav = 'notices'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata
  content.data.notices = {}

  return res.render('notices', content)
}

noticesController.create = function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:create')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Notices - Create'
  content.nav = 'notices'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata

  res.render('subviews/createNotice', content)
}

noticesController.edit = async function (req: any, res: any) {
  const user = req.user
  if (_.isUndefined(user) || !permissions.canThis(user.role, 'notices:update')) {
    req.flash('message', 'Permission Denied.')
    return res.redirect('/')
  }

  const content: Record<string, any> = {}
  content.title = 'Notices - Edit'
  content.nav = 'notices'

  content.data = {}
  content.data.user = req.user
  content.data.common = req.viewdata

  try {
    content.data.notice = await noticeSchema.getNotice(req.params.id)
    res.render('subviews/editNotice', content)
  } catch (err: any) {
    return handleError(res, err)
  }
}

module.exports = noticesController
