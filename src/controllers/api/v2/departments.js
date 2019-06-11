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

var Department = require('../../../models/department')
var apiUtils = require('../apiUtils')

var apiDepartments = {}

apiDepartments.get = function (req, res) {
  Department.find({}, function (err, departments) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res, { departments: departments })
  })
}

apiDepartments.create = function (req, res) {
  var postData = req.body
  if (!postData) return apiUtils.sendApiError_InvalidPostData(res)
  
  if (!postData.teams) postData.teams = []
  if (!postData.groups) postData.groups = []

  Department.create(postData, function (err, createdDepartment) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (!createdDepartment) return apiUtils.sendApiError(res, 500, 'Unable to create department')

    createdDepartment.populate('teams groups', function (err, populatedDepartment) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      return apiUtils.sendApiSuccess(res, { department: populatedDepartment })
    })
  })
}

apiDepartments.test = function (req, res) {
  Department.getDepartmentGroupsOfUser(req.user._id, function (err, groups) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res, { groups: groups, count: groups.length })
  })
}

apiDepartments.update = function (req, res) {
  var putData = req.body
  var id = req.params.id
  if (!putData || !id) return apiUtils.sendApiError_InvalidPostData(res)

  if (!putData.teams) putData.teams = []
  if (!putData.groups) putData.groups = []
  if (putData.allGroups) putData.groups = []

  Department.findOneAndUpdate({ _id: id }, putData, { new: true }, function (err, department) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    department.populate('teams groups', function (err, department) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      return apiUtils.sendApiSuccess(res, { department: department })
    })
  })

  // Department.findOne({ _id: id }, function (err, d) {
  //   if (err) return apiUtils.sendApiError(res, 500, err.message)
  //
  //   var department = d.
  //
  //   if (putData.name) department.name = putData.name
  //   if (putData.teams) department.teams = putData.teams
  //   if (putData.allGroups) department.allGroups = putData.allGroups
  //   if (!department.allGroups) {
  //     if (putData.groups) department.groups = putData.groups
  //   } else {
  //     department.groups = []
  //   }
  //
  //   console.log(department)
  //
  //   department.save(function (err, department) {
  //     if (err) return apiUtils.sendApiError(res, 500, err.message)
  //
  //     department.populate('teams groups', function (err, department) {
  //       if (err) return apiUtils.sendApiError(res, 500, err.message)
  //
  //       return apiUtils.sendApiSuccess(res, { department: department })
  //     })
  //   })
  // })
}

apiDepartments.delete = function (req, res) {
  var id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  Department.deleteOne({ _id: id }, function (err, success) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete department')

    return apiUtils.sendApiSuccess(res)
  })
}

module.exports = apiDepartments
