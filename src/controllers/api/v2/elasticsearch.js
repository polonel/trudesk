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
 *  Updated:    4/14/19 2:32 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')
var es = require('../../../elasticsearch')
var ticketSchema = require('../../../models/ticket')
var groupSchema = require('../../../models/group')

var apiElasticSearch = {}
var apiUtil = require('../apiUtils')

apiElasticSearch.rebuild = function (req, res) {
  es.rebuildIndex()

  return res.json({ success: true })
}

apiElasticSearch.status = function (req, res) {
  var response = {}

  async.parallel(
    [
      function (done) {
        return es.checkConnection(done)
      },
      function (done) {
        es.getIndexCount(function (err, data) {
          if (err) return done(err)
          response.indexCount = !_.isUndefined(data.count) ? data.count : 0
          return done()
        })
      },
      function (done) {
        ticketSchema.getCount(function (err, count) {
          if (err) return done(err)
          response.dbCount = count
          return done()
        })
      }
    ],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err })

      response.esStatus = global.esStatus
      response.isRebuilding = global.esRebuilding === true
      response.inSync = response.dbCount === response.indexCount

      res.json({ success: true, status: response })
    }
  )
}

apiElasticSearch.search = function (req, res) {
  var limit = !_.isUndefined(req.query['limit']) ? req.query.limit : 100
  try {
    limit = parseInt(limit)
  } catch (e) {
    limit = 100
  }

  async.waterfall(
    [
      function (next) {
        if (!req.user.role.isAdmin && !req.user.role.isAgent)
          return groupSchema.getAllGroupsOfUserNoPopulate(req.user._id, next)

        var Department = require('../../../models/department')
        return Department.getDepartmentGroupsOfUser(req.user._id, next)
      },
      function (groups, next) {
        var g = _.map(groups, function (i) {
          return i._id
        })
        // For docker we need to add a unique ID for the index.
        var obj = {
          index: es.indexName,
          body: {
            size: limit,
            from: 0,
            query: {
              bool: {
                must: {
                  multi_match: {
                    query: req.query['q'],
                    type: 'cross_fields',
                    operator: 'and',
                    fields: [
                      'uid^5',
                      'subject^4',
                      'issue^4',
                      'owner.fullname',
                      'owner.username',
                      'owner.email',
                      'comments.owner.email',
                      'tags.normalized',
                      'priority.name',
                      'type.name',
                      'group.name',
                      'comments.comment^3',
                      'notes.note^3',
                      'dateFormatted'
                    ],
                    tie_breaker: 0.3
                  }
                },
                filter: {
                  terms: { 'group._id': g }
                }
              }
            }
          }
        }

        return next(null, obj)
      }
    ],
    function (err, obj) {
      if (err) return apiUtil.sendApiError(res, 500, err.message)
      if (!es || !es.esclient) return apiUtil.sendApiError(res, 400, 'Elasticsearch is not configured')

      es.esclient.search(obj).then(function (r) {
        return res.send(r)
      })
    }
  )
}

module.exports = apiElasticSearch
