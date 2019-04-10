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

var _ = require('lodash')
var async = require('async')
var GroupSchema = require('../../../models/group')
var ticketSchema = require('../../../models/ticket')

var apiGroups = {}

/**
 * @api {get} /api/v1/groups Get Groups
 * @apiName getGroups
 * @apiDescription Gets groups for the current logged in user
 * @apiVersion 0.1.0
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/groups
 *
 * @apiSuccess {boolean}    success             Successful?
 * @apiSuccess {array}      groups              Array of returned Groups
 * @apiSuccess {object}     groups._id          The MongoDB ID
 * @apiSuccess {string}     groups.name         Group Name
 * @apiSuccess {array}      groups.sendMailTo   Array of Users to send Mail to
 * @apiSuccess {array}      groups.members      Array of Users that are members of this group
 *
 */
apiGroups.get = function (req, res) {
  var user = req.user
  var permissions = require('../../../permissions')
  var hasPublic = permissions.canThis(user.role, 'tickets:public')

  if (user.role.isAgent || user.role.isAdmin) {
    GroupSchema.getAllGroups(function (err, groups) {
      if (err) return res.status(400).json({ success: false, error: err.message })

      if (!hasPublic)
        groups = _.filter(function (g) {
          return !g.public
        })

      return res.json({ success: true, groups: groups })
    })
  } else {
    GroupSchema.getAllGroupsOfUser(user._id, function (err, groups) {
      if (err) return res.status(400).json({ success: false, error: err.message })

      if (hasPublic) {
        GroupSchema.getAllPublicGroups(function (err, grps) {
          if (err) return res.status(400).json({ success: false, error: err })

          groups = groups.concat(grps)

          return res.json({ success: true, groups: groups })
        })
      } else {
        return res.json({ success: true, groups: groups })
      }
    })
  }
}

/**
 * @api {get} /api/v1/groups/all Get Groups
 * @apiName getALlGroups
 * @apiDescription Gets all groups
 * @apiVersion 0.1.7
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/groups/all
 *
 * @apiSuccess {boolean}    success             Successful?
 * @apiSuccess {array}      groups              Array of returned Groups
 * @apiSuccess {object}     groups._id          The MongoDB ID
 * @apiSuccess {string}     groups.name         Group Name
 * @apiSuccess {array}      groups.sendMailTo   Array of Users to send Mail to
 * @apiSuccess {array}      groups.members      Array of Users that are members of this group
 *
 */

apiGroups.getAll = function (req, res) {
  GroupSchema.getAllGroups(function (err, groups) {
    if (err) return res.status(400).json({ success: false, error: err.message })

    return res.json({ success: true, groups: groups })
  })
}

/**
 * @api {get} /api/v1/groups/:id Get Single Group
 * @apiName getSingleGroup
 * @apiDescription Gets Single Group via ID param
 * @apiVersion 0.1.7
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/group/:id
 *
 * @apiSuccess {boolean}    success             Successful?
 * @apiSuccess {object}     group               Returned Group
 * @apiSuccess {object}     groups._id          The MongoDB ID
 * @apiSuccess {string}     groups.name         Group Name
 * @apiSuccess {array}      groups.sendMailTo   Array of Users to send Mail to
 * @apiSuccess {array}      groups.members      Array of Users that are members of this group
 *
 */
apiGroups.getSingleGroup = function (req, res) {
  var id = req.params.id
  if (_.isUndefined(id)) return res.status(400).json({ error: 'Invalid Request' })

  GroupSchema.getGroupById(id, function (err, group) {
    if (err) return res.status(400).json({ error: err.message })

    return res.status(200).json({ success: true, group: group })
  })
}

/**
 * @api {post} /api/v1/groups/create Create Group
 * @apiName createGroup
 * @apiDescription Creates a group with the given post data.
 * @apiVersion 0.1.0
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "Group Name",
 *      "members": [members],
 *      "sendMailTo": [sendMailTo]
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"name\": \"Group Name\", \"members\": [members], \"sendMailTo\": [sendMailTo] }"
 *      -l http://localhost/api/v1/groups/create
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} group Saved Group Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiGroups.create = function (req, res) {
  var Group = new GroupSchema()

  Group.name = req.body.name
  Group.members = req.body.members
  Group.sendMailTo = req.body.sendMailTo

  Group.save(function (err, group) {
    if (err) return res.status(400).json({ success: false, error: 'Error: ' + err.message })

    res.json({ success: true, error: null, group: group })
  })
}

/**
 * @api {put} /api/v1/groups/:id Edit Group
 * @apiName editGroup
 * @apiDescription Updates giving group with PUT data
 * @apiVersion 0.1.7
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "Group Name",
 *      "members": [members],
 *      "sendMailTo": [sendMailTo]
 * }
 *
 * @apiExample Example usage:
 * curl -X PUT
 *      -H "Content-Type: application/json"
 *      -H "accesstoken: {accesstoken}"
 *      -d "{\"name\": \"Group Name\", \"members\": [members], \"sendMailTo\": [sendMailTo] }"
 *      -l http://localhost/api/v1/groups/:id
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 * @apiSuccess {object} group Saved Group Object
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiGroups.updateGroup = function (req, res) {
  var id = req.params.id
  var data = req.body
  if (_.isUndefined(id) || _.isUndefined(data) || !_.isObject(data))
    return res.status(400).json({ error: 'Invalid Post Data' })

  if (!_.isArray(data.members)) {
    data.members = [data.members]
  }
  if (!_.isArray(data.sendMailTo)) {
    data.sendMailTo = [data.sendMailTo]
  }

  GroupSchema.getGroupById(id, function (err, group) {
    if (err) return res.status(400).json({ error: err.message })

    var members = _.compact(data.members)
    var sendMailTo = _.compact(data.sendMailTo)

    group.name = data.name
    group.members = members
    group.sendMailTo = sendMailTo

    group.save(function (err, savedGroup) {
      if (err) return res.status(400).json({ error: err.message })

      return res.json({ success: true, group: savedGroup })
    })
  })
}

/**
 * @api {delete} /api/v1/groups/:id Delete Group
 * @apiName deleteGroup
 * @apiDescription Deletes the given group by ID
 * @apiVersion 0.1.6
 * @apiGroup Group
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/groups/:id
 *
 * @apiSuccess {boolean} success If the Request was a success
 * @apiSuccess {object} error Error, if occurred
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiGroups.deleteGroup = function (req, res) {
  var id = req.params.id
  if (_.isUndefined(id)) return res.status(400).json({ success: false, error: 'Error: Invalid Group Id.' })

  async.series(
    [
      function (next) {
        var grps = [id]
        ticketSchema.getTickets(grps, function (err, tickets) {
          if (err) {
            return next('Error: ' + err.message)
          }

          if (_.size(tickets) > 0) {
            return next('Error: Cannot delete a group with tickets.')
          }

          return next()
        })
      },
      function (next) {
        GroupSchema.getGroupById(id, function (err, group) {
          if (err) return next('Error: ' + err.message)

          if (group.name.toLowerCase() === 'administrators')
            return next('Error: Unable to delete default Administrators group.')

          group.remove(function (err, success) {
            if (err) return next('Error: ' + err.message)

            return next(null, success)
          })
        })
      }
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err })

      return res.json({ success: true })
    }
  )
}

module.exports = apiGroups
