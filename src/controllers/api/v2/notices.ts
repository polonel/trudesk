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

apiNotices.get = async function (_req: any, res: any) {
  try {
    const notices = await Notice.find({})

    return apiUtils.sendApiSuccess(res, { notices })
  } catch (err: any) {
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

apiNotices.update = async function (req: any, res: any) {
  const id = req.params.id
  const payload = req.body
  if (!id || !payload || !payload.name || !payload.message || !payload.color || !payload.fontColor)
    return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const updatedNotice = await Notice.findOneAndUpdate({ _id: id }, payload, { new: true })

    return apiUtils.sendApiSuccess(res, { notice: updatedNotice })
  } catch (err: any) {
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

apiNotices.activate = async function (req: any, res: any) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    await Notice.updateMany({}, { active: false })
    await Notice.findOneAndUpdate({ _id: id }, { active: true })

    return apiUtils.sendApiSuccess(res)
  } catch (err: any) {
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

apiNotices.clear = async function (_req: any, res: any) {
  try {
    await Notice.updateMany({}, { active: false })

    return apiUtils.sendApiSuccess(res)
  } catch (err: any) {
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

apiNotices.delete = async function (req: any, res: any) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    await Notice.findOneAndDelete({ _id: id })

    return apiUtils.sendApiSuccess(res)
  } catch (err: any) {
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

module.exports = apiNotices
