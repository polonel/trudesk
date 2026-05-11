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
 *  Updated:    3/14/19 12:31 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import _ from 'lodash'
import { TeamModel as Team } from '../../../models'
import apiUtils from '../apiUtils'

const apiTeams: Record<string, any> = {}

apiTeams.get = async (req: any, res: any) => {
  let limit = 10
  if (!_.isUndefined(req.query.limit)) {
    try {
      limit = parseInt(req.query.limit)
    } catch (_err) {
      limit = 10
    }
  }

  let page = 0
  if (req.query.page) {
    try {
      page = parseInt(req.query.page)
    } catch (_err) {
      page = 0
    }
  }

  const obj = {
    limit: limit,
    page: page
  }

  try {
    const teams = await Team.getWithObject(obj)

    return apiUtils.sendApiSuccess(res, { count: teams.length, teams })
  } catch (err: any) {
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

apiTeams.create = function (req: any, res: any) {
  const postData = req.body
  if (!postData) return apiUtils.sendApiError_InvalidPostData(res)

  Team.create(postData).then(async function (team: any) {
    try {
      const populated = await team.populate('members')
      return apiUtils.sendApiSuccess(res, { team: populated })
    } catch (err: any) {
      return apiUtils.sendApiError(res, 500, err.message)
    }
  }).catch(function (err: any) {
    return apiUtils.sendApiError(res, 500, err.message)
  })

  return undefined
}

apiTeams.update = function (req: any, res: any) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Team Id')

  const putData = req.body
  if (!putData) return apiUtils.sendApiError_InvalidPostData(res)

  Team.findOne({ _id: id }).then(async function (team: any) {
    if (!team) return apiUtils.sendApiError(res, 400, 'Invalid Team')

    if (putData.name) team.name = putData.name
    if (putData.members) team.members = putData.members

    try {
      const saved = await team.save()
      const populated = await saved.populate('members')
      return apiUtils.sendApiSuccess(res, { team: populated })
    } catch (err: any) {
      return apiUtils.sendApiError(res, 500, err.message)
    }
  }).catch(function (err: any) {
    return apiUtils.sendApiError(res, 400, err.message)
  })

  return undefined
}

apiTeams.delete = function (req: any, res: any) {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Team Id')

  Team.deleteOne({ _id: id }, function (err: any, success: any) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete team. Contact your administrator.')

    return apiUtils.sendApiSuccess(res, { _id: id })
  })

  return undefined
}

module.exports = apiTeams
