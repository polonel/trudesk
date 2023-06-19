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
 *  Updated:    3/30/19 12:43 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { DepartmentModel } from '../../../models'
import apiUtils from '../apiUtils'
import logger from '../../../logger'

const apiDepartments = {}

apiDepartments.get = async (req, res) => {
  try {
    const departments = await DepartmentModel.find({})

    return apiUtils.sendApiSuccess(res, { departments })
  } catch (err) {
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

apiDepartments.create = async (req, res) => {
  const postData = req.body
  if (!postData) return apiUtils.sendApiError_InvalidPostData(res)

  if (!postData.teams) postData.teams = []
  if (!postData.groups) postData.groups = []

  try {
    const createdDepartment = await DepartmentModel.create(postData)
    if (!createdDepartment) return apiUtils.sendApiError(res, 500, 'Unable to create department')

    const populatedDepartment = await createdDepartment.populate('teams groups')

    return apiUtils.sendApiSuccess(res, { department: populatedDepartment })
  } catch (e) {
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiDepartments.update = async (req, res) => {
  const putData = req.body
  const id = req.params.id
  if (!putData || !id) return apiUtils.sendApiError_InvalidPostData(res)

  if (!putData.teams) putData.teams = []
  if (!putData.groups) putData.groups = []
  if (putData.allGroups) putData.groups = []

  try {
    const department = await DepartmentModel.findOneAndUpdate({ _id: id }, putData, { new: true })

    return apiUtils.sendApiSuccess(res, { department })
  } catch (e) {
    logger.debug(e)
    return apiUtils.sendApiError(res, 500, e.message)
  }
}

apiDepartments.delete = async (req, res) => {
  const id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  try {
    const success = await DepartmentModel.deleteOne({ _id: id })
    if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete department')

    return apiUtils.sendApiSuccess(res)
  } catch (err) {
    return apiUtils.sendApiError(res, 500, err.message)
  }
}

module.exports = apiDepartments
