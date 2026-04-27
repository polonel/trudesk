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
 *  Updated:    2/17/22 8:25 PM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import logger from '../../../logger'
import apiUtils from '../apiUtils'
import { NoticeModel as Notice } from '../../../models'

const apiNotices: Record<string, any> = {}

apiNotices.create = async (req: any, res: any) => {
  const payload = req.body

  try {
    const notice = await Notice.create({
      name: payload.name,
      message: payload.message,
      color: payload.color,
      fontColor: payload.fontColor
    })

    return apiUtils.sendApiSuccess(res, { notice })
  } catch (err: any) {
    logger.debug(err)
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

apiNotices.get = function (_req: any, res: any) {
  Notice.find({}, function (err: any, notices: any) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res, { notices: notices })
  })
}

apiNotices.update = function (req: any, res: any) {
  const id = req.params.id
  const payload = req.body
  if (!id || !payload || !payload.name || !payload.message || !payload.color || !payload.fontColor)
    return apiUtils.sendApiError_InvalidPostData(res)

  Notice.findOneAndUpdate({ _id: id }, payload, { new: true }, function (err: any, updatedNotice: any) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res, { notice: updatedNotice })
  })
}

apiNotices.activate = function (req: any, res: any) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  Notice.updateMany({}, { active: false }, function (err: any) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    Notice.findOneAndUpdate({ _id: id }, { active: true }, function (err: any) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      return apiUtils.sendApiSuccess(res)
    })
  })
}

apiNotices.clear = function (_req: any, res: any) {
  Notice.updateMany({}, { active: false }, function (err: any) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res)
  })
}

apiNotices.delete = function (req: any, res: any) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  Notice.findOneAndDelete({ _id: id }, function (err: any) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res)
  })
}

module.exports = apiNotices
