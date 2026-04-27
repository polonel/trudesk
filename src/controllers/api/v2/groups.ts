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
 *  Updated:    4/8/19 1:00 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import apiUtils from '../apiUtils'
import { GroupModel, DepartmentModel, TicketModel } from '../../../models'

const apiGroupModels: Record<string, any> = {}

apiGroupModels.create = function (req: any, res: any) {
  const postGroupModel = req.body
  if (!postGroupModel) return apiUtils.sendApiError_InvalidPostData(res)

  GroupModel.create(postGroupModel, function (err: any, GroupModel: any) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    GroupModel.populate('members sendMailTo', function (err: any, GroupModel: any) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      return apiUtils.sendApiSuccess(res, { group: GroupModel })
    })
  })
}

apiGroupModels.get = async function (req: any, res: any) {
  const limit = Number(req.query.limit) || 50
  const page = Number(req.query.page) || 0
  const type = req.query.type || 'user'

  try {
    if (type === 'all') {
      const groups = await GroupModel.getWithObject({ limit, page })
      return apiUtils.sendApiSuccess(res, { groups, count: groups.length })
    } else {
      if (req.user.role.isAdmin || req.user.role.isAgent) {
        const groups = await DepartmentModel.getDepartmentGroupsOfUser(req.user._id)
        return apiUtils.sendApiSuccess(res, { groups, count: groups.length })
      } else {
        const groups = await GroupModel.getAllGroupsOfUser(req.user._id)

        return apiUtils.sendApiSuccess(res, { groups, count: groups.length })
      }
    }
  } catch (e: any) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiGroupModels.update = function (req: any, res: any) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid GroupModel Id')

  const putData = req.body
  if (!putData) return apiUtils.sendApiError_InvalidPostData(res)

  GroupModel.findOne({ _id: id }, function (err: any, GroupModel: any) {
    if (err || !GroupModel) return apiUtils.sendApiError(res, 400, 'Invalid GroupModel')

    if (putData.name) GroupModel.name = putData.name
    if (putData.members) GroupModel.members = putData.members
    if (putData.sendMailTo) GroupModel.sendMailTo = putData.sendMailTo

    GroupModel.save(function (err: any, GroupModel: any) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      GroupModel.populate('members sendMailTo', function (err: any, GroupModel: any) {
        if (err) return apiUtils.sendApiError(res, 500, err.message)

        return apiUtils.sendApiSuccess(res, { group: GroupModel })
      })
    })
  })
}

apiGroupModels.delete = function (req: any, res: any) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  TicketModel.countDocuments({ group: { $in: [id] } }, function (err: any, tickets: number) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (tickets > 0) return apiUtils.sendApiError(res, 400, 'Unable to delete GroupModel with tickets.')

    GroupModel.deleteOne({ _id: id }, function (err: any, success: any) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)
      if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete GroupModel. Contact your administrator.')

      return apiUtils.sendApiSuccess(res, { _id: id })
    })
  })
}

module.exports = apiGroupModels
