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
var ticketSchema = require('../../../models/ticket')
var groupSchema = require('../../../models/group')
var csv = require('csv')
var moment = require('moment')

var settingsSchema = require('../../../models/setting')

var apiReports = {
  generate: {}
}

/**
 * @api {post} /api/v1/reports/generate/tickets_by_group Generate Report - Groups
 * @apiName generate_ticketsByGroup
 * @apiDescription Generate report for the given groups
 * @apiVersion 0.1.9
 * @apiGroup Reports
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "startDate": {Date},
 *      "endDate": {Date},
 *      "groups": [{group_id}]
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "accesstoken: {accesstoken}"
 *      -H "Content-Type: application/json"
 *      -l http://localhost/api/v1/reports/generate/tickets_by_group
 *
 * @apiSuccess {object} success Report was generate
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiReports.generate.ticketsByGroup = function (req, res) {
  var postData = req.body
  if (!postData || !postData.startDate || !postData.endDate)
    return res.status(400).json({ success: false, error: 'Invalid Post Data' })

  ticketSchema.getTicketsWithObject(
    postData.groups,
    {
      limit: -1,
      page: 0,
      filter: {
        date: {
          start: postData.startDate,
          end: postData.endDate
        }
      }
    },
    function (err, tickets) {
      if (err) return res.status(400).json({ success: false, error: err })

      var input = processReportData(tickets)

      tickets = null

      return processResponse(res, input)
    }
  )
}

apiReports.generate.ticketsByTeam = function (req, res) {
  var postData = req.body
  if (!postData || !postData.startDate || !postData.endDate)
    return res.status(400).json({ success: false, error: 'Invalid Post Data' })

  var departmentSchema = require('../../../models/department')
  departmentSchema.getDepartmentsByTeam(postData.teams, function (err, departments) {
    if (err) return res.status(500).json({ success: false, error: err.message })

    ticketSchema.getTicketsByDepartments(
      departments,
      {
        limit: -1,
        page: 0,
        filter: {
          date: {
            start: postData.startDate,
            end: postData.endDate
          }
        }
      },
      function (err, tickets) {
        if (err) return res.status(500).json({ success: false, error: err.message })

        var input = processReportData(tickets)

        tickets = null

        return processResponse(res, input)
      }
    )
  })
}

/**
 * @api {post} /api/v1/reports/generate/tickets_by_priority Generate Report - Priority
 * @apiName generate_ticketsByPriority
 * @apiDescription Generate report for the given priorities
 * @apiVersion 0.1.9
 * @apiGroup Reports
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "startDate": {Date},
 *      "endDate": {Date},
 *      "groups": [{group_id}],
 *      "priorities": [{priority}]
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "accesstoken: {accesstoken}"
 *      -H "Content-Type: application/json"
 *      -l http://localhost/api/v1/reports/generate/tickets_by_priority
 *
 * @apiSuccess {object} success Report was generate
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiReports.generate.ticketsByPriority = function (req, res) {
  var postData = req.body

  async.waterfall(
    [
      function (done) {
        if (_.includes(postData.groups, '-1')) {
          if (req.user.role.isAdmin || req.user.role.isAgent) {
            groupSchema.getAllGroupsNoPopulate(function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          } else {
            groupSchema.getAllGroupsOfUser(req.user._id, function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          }
        } else {
          return done(null, postData.groups)
        }
      },
      function (grps, done) {
        ticketSchema.getTicketsWithObject(
          grps,
          {
            limit: -1,
            page: 0,
            filter: {
              priority: postData.priorities
            }
          },
          function (err, tickets) {
            if (err) return done(err)

            var input = processReportData(tickets)

            tickets = null

            return done(null, input)
          }
        )
      }
    ],
    function (err, input) {
      if (err) return res.status(400).json({ success: false, error: err })

      return processResponse(res, input)
    }
  )
}

/**
 * @api {post} /api/v1/reports/generate/tickets_by_status Generate Report - Status
 * @apiName generate_ticketsByStatus
 * @apiDescription Generate report for the given status
 * @apiVersion 0.1.9
 * @apiGroup Reports
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "startDate": {Date},
 *      "endDate": {Date},
 *      "groups": [{group_id}],
 *      "status": [{status}]
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "accesstoken: {accesstoken}"
 *      -H "Content-Type: application/json"
 *      -l http://localhost/api/v1/reports/generate/tickets_by_status
 *
 * @apiSuccess {object} success Report was generate
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiReports.generate.ticketsByStatus = function (req, res) {
  var postData = req.body

  async.waterfall(
    [
      function (done) {
        if (_.includes(postData.groups, '-1')) {
          if (req.user.role.isAdmin || req.user.role.isAgent) {
            groupSchema.getAllGroupsNoPopulate(function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          } else {
            groupSchema.getAllGroupsOfUser(req.user._id, function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          }
        } else {
          return done(null, postData.groups)
        }
      },
      function (grps, done) {
        ticketSchema.getTicketsWithObject(
          grps,
          {
            limit: -1,
            page: 0,
            status: postData.status,
            filter: {
              date: {
                start: postData.startDate,
                end: postData.endDate
              }
            }
          },
          function (err, tickets) {
            if (err) return done(err)

            var input = processReportData(tickets)

            tickets = null

            return done(null, input)
          }
        )
      }
    ],
    function (err, input) {
      if (err) return res.status(400).json({ success: false, error: err })

      return processResponse(res, input)
    }
  )
}

/**
 * @api {post} /api/v1/reports/generate/tickets_by_tags Generate Report - Tags
 * @apiName generate_ticketsByTags
 * @apiDescription Generate report for the given tags
 * @apiVersion 0.1.9
 * @apiGroup Reports
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "startDate": {Date},
 *      "endDate": {Date},
 *      "groups": [{group_id}],
 *      "tags": [{tag_id}]
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "accesstoken: {accesstoken}"
 *      -H "Content-Type: application/json"
 *      -l http://localhost/api/v1/reports/generate/tickets_by_tags
 *
 * @apiSuccess {object} success Report was generate
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiReports.generate.ticketsByTags = function (req, res) {
  var postData = req.body

  async.waterfall(
    [
      function (done) {
        if (_.includes(postData.groups, '-1')) {
          if (req.user.role.isAdmin || req.user.role.isAgent) {
            groupSchema.getAllGroupsNoPopulate(function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          } else {
            groupSchema.getAllGroupsOfUser(req.user._id, function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          }
        } else {
          return done(null, postData.groups)
        }
      },
      function (grps, done) {
        ticketSchema.getTicketsWithObject(
          grps,
          {
            limit: -1,
            page: 0,
            filter: {
              date: {
                start: postData.startDate,
                end: postData.endDate
              },
              tags: postData.tags
            }
          },
          function (err, tickets) {
            if (err) return done(err)

            var input = processReportData(tickets)

            tickets = null

            return done(null, input)
          }
        )
      }
    ],
    function (err, input) {
      if (err) return res.status(400).json({ success: false, error: err })

      return processResponse(res, input)
    }
  )
}

/**
 * @api {post} /api/v1/reports/generate/tickets_by_type Generate Report - Type
 * @apiName generate_ticketsByType
 * @apiDescription Generate report for the given types
 * @apiVersion 0.1.9
 * @apiGroup Reports
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "startDate": {Date},
 *      "endDate": {Date},
 *      "groups": [{group_id}],
 *      "types": [{type_id}]
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "accesstoken: {accesstoken}"
 *      -H "Content-Type: application/json"
 *      -l http://localhost/api/v1/reports/generate/tickets_by_type
 *
 * @apiSuccess {object} success Report was generate
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiReports.generate.ticketsByType = function (req, res) {
  var postData = req.body
  async.waterfall(
    [
      function (done) {
        if (_.includes(postData.groups, '-1')) {
          if (req.user.role.isAdmin || req.user.role.isAgent) {
            groupSchema.getAllGroupsNoPopulate(function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          } else {
            groupSchema.getAllGroupsOfUser(req.user._id, function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          }
        } else {
          return done(null, postData.groups)
        }
      },
      function (grps, done) {
        ticketSchema.getTicketsWithObject(
          grps,
          {
            limit: -1,
            page: 0,
            filter: {
              date: {
                start: postData.startDate,
                end: postData.endDate
              },
              types: postData.types
            }
          },
          function (err, tickets) {
            if (err) return done(err)

            var input = processReportData(tickets)

            tickets = null

            return done(null, input)
          }
        )
      }
    ],
    function (err, input) {
      if (err) return res.status(400).json({ success: false, error: err })

      return processResponse(res, input)
    }
  )
}

/**
 * @api {post} /api/v1/reports/generate/tickets_by_user Generate Report - User
 * @apiName generate_ticketsByUser
 * @apiDescription Generate report for the given users
 * @apiVersion 0.1.9
 * @apiGroup Reports
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "startDate": {Date},
 *      "endDate": {Date},
 *      "groups": [{group_id}],
 *      "users": [{user_id}]
 * }
 *
 * @apiExample Example usage:
 * curl -X POST
 *      -H "accesstoken: {accesstoken}"
 *      -H "Content-Type: application/json"
 *      -l http://localhost/api/v1/reports/generate/tickets_by_user
 *
 * @apiSuccess {object} success Report was generate
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiReports.generate.ticketsByUser = function (req, res) {
  var postData = req.body
  async.waterfall(
    [
      function (done) {
        if (_.includes(postData.groups, '-1')) {
          if (req.user.role.isAdmin || req.user.role.isAgent) {
            groupSchema.getAllGroupsNoPopulate(function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          } else {
            groupSchema.getAllGroupsOfUser(req.user._id, function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          }
        } else {
          return done(null, postData.groups)
        }
      },
      function (grps, done) {
        ticketSchema.getTicketsWithObject(
          grps,
          {
            limit: -1,
            page: 0,
            filter: {
              date: {
                start: postData.startDate,
                end: postData.endDate
              },
              owner: postData.users
            }
          },
          function (err, tickets) {
            if (err) return done(err)

            var input = processReportData(tickets)

            tickets = null

            return done(null, input)
          }
        )
      }
    ],
    function (err, input) {
      if (err) return res.status(400).json({ success: false, error: err })

      return processResponse(res, input)
    }
  )
}

apiReports.generate.ticketsByAssignee = function (req, res) {
  var postData = req.body
  async.waterfall(
    [
      function (done) {
        if (_.includes(postData.groups, '-1')) {
          if (req.user.role.isAdmin || req.user.role.isAgent) {
            groupSchema.getAllGroupsNoPopulate(function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          } else {
            groupSchema.getAllGroupsOfUser(req.user._id, function (err, grps) {
              if (err) return done(err)

              return done(null, grps)
            })
          }
        } else {
          return done(null, postData.groups)
        }
      },
      function (grps, done) {
        ticketSchema.getTicketsWithObject(
          grps,
          {
            limit: -1,
            page: 0,
            filter: {
              date: {
                start: postData.startDate,
                end: postData.endDate
              },
              assignee: postData.assignees
            }
          },
          function (err, tickets) {
            if (err) return done(err)

            var input = processReportData(tickets)

            tickets = null

            return done(null, input)
          }
        )
      }
    ],
    function (err, input) {
      if (err) return res.status(400).json({ success: false, error: err })

      return processResponse(res, input)
    }
  )
}

function processReportData (tickets) {
  var input = []
  for (var i = 0; i < tickets.length; i++) {
    var ticket = tickets[i]

    var t = []
    t.push(ticket.uid)
    t.push(ticket.type.name)
    t.push(ticket.priority.name)
    t.push(ticket.statusFormatted)
    t.push(moment(ticket.date).format('MMM DD, YY HH:mm:ss'))
    t.push(ticket.subject)
    t.push(ticket.owner.fullname)
    t.push(ticket.group.name)
    if (ticket.assignee) {
      t.push(ticket.assignee.fullname)
    } else {
      t.push('')
    }

    var tags = ''
    for (var k = 0; k < ticket.tags.length; k++) {
      if (k === ticket.tags.length - 1) {
        tags += ticket.tags[k].name
      } else {
        tags += ticket.tags[k].name + ';'
      }
    }

    t.push(tags)

    input.push(t)
  }

  return input
}

function processResponse (res, input) {
  var headers = {
    uid: 'uid',
    type: 'type',
    priority: 'priority',
    status: 'status',
    created: 'created',
    subject: 'subject',
    requester: 'requester',
    group: 'group',
    assignee: 'assignee',
    tags: 'tags'
  }

  csv.stringify(input, { header: true, columns: headers }, function (err, output) {
    if (err) return res.status(400).json({ success: false, error: err })

    res.setHeader('Content-disposition', 'attachment; filename=report_output.csv')
    res.set('Content-Type', 'text/csv')
    res.send(output)
  })
}

module.exports = apiReports
