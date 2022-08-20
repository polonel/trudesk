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
 *  Updated:    2/14/19 12:06 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { reject } from 'lodash'
import logger from '../../../logger'
import apiUtils from '../apiUtils'
import { TicketTagModel, TicketModel } from '../../../models'

const apiTags = {}

apiTags.create = async (req, res) => {
  const data = req.body
  if (!data.tag) return apiUtils.sendApiError_InvalidPostData(res)
  try {
    let tag = new TicketTagModel({
      name: data.tag
    })

    tag = await tag.save()

    return apiUtils.sendApiSuccess(res, { tag })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiTags.getTagsWithLimit = async (req, res) => {
  const qs = req.query
  const limit = qs.limit || 25
  const page = qs.page || 0

  try {
    const getTagsWithLimit = await TicketTagModel.getTagsWithLimit(parseInt(limit), parseInt(page))
    const countDocuments = await TicketTagModel.countDocuments({})

    return apiUtils.sendApiSuccess(res, {
      tags: getTagsWithLimit,
      count: countDocuments
    })
  } catch (e) {
    logger.error(e)
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiTags.updateTag = async (req, res) => {
  const id = req.params.id
  const data = req.body

  if (!id || !data || !data.name) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    let tag = await TicketTagModel.findOne({ _id: id })
    if (!tag) return apiUtils.sendApiError(res, 404, 'Tag not found')

    tag.name = data.name
    tag = await tag.save()

    return apiUtils.sendApiSuccess(res, { tag })
  } catch (e) {
    logger.error(e)
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiTags.deleteTag = async (req, res) => {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const tickets = await TicketModel.getAllTicketsByTag(id)
    for (const ticket of tickets) {
      ticket.tags = reject(ticket.tags, o => o._id.toString() === id.toString())
      await ticket.save()
    }

    await TicketTagModel.findByIdAndRemove(id)

    return apiUtils.sendApiSuccess(res)
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

module.exports = apiTags
