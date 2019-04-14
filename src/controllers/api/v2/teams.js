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

var _ = require('lodash')
var async = require('async')
var Team = require('../../../models/team')
var apiUtils = require('../apiUtils')

var apiTeams = {}

apiTeams.get = function (req, res) {
  var limit = 10
  if (!_.isUndefined(req.query.limit)) {
    try {
      limit = parseInt(req.query.limit)
    } catch (err) {
      limit = 10
    }
  }

  var page = 0
  if (req.query.page) {
    try {
      page = parseInt(req.query.page)
    } catch (err) {
      page = 0
    }
  }

  var obj = {
    limit: limit,
    page: page
  }

  Team.getWithObject(obj, function (err, results) {
    if (err) return apiUtils.sendApiError(res, 400, err.message)

    return apiUtils.sendApiSuccess(res, { count: results.length, teams: results })
  })
}

apiTeams.create = function (req, res) {
  var postData = req.body
  if (!postData) return apiUtils.sendApiError_InvalidPostData(res)

  Team.create(postData, function (err, team) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    team.populate('members', function (err, team) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      return apiUtils.sendApiSuccess(res, { team: team })
    })
  })
}

apiTeams.update = function (req, res) {
  var id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Team Id')

  var putData = req.body
  if (!putData) return apiUtils.sendApiError_InvalidPostData(res)

  Team.findOne({ _id: id }, function (err, team) {
    if (err || !team) return apiUtils.sendApiError(res, 400, 'Invalid Team')

    if (putData.name) team.name = putData.name
    if (putData.members) team.members = putData.members

    team.save(function (err, team) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      team.populate('members', function (err, team) {
        if (err) return apiUtils.sendApiError(res, 500, err.message)

        return apiUtils.sendApiSuccess(res, { team: team })
      })
    })
  })
}

apiTeams.delete = function (req, res) {
  var id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Team Id')

  Team.deleteOne({ _id: id }, function (err, success) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete team. Contact your administrator.')

    return apiUtils.sendApiSuccess(res, { _id: id })
  })
}

module.exports = apiTeams
