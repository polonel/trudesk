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

var winston = require('winston')

var NoticeSchema = require('../../../models/notice')

var apiNotices = {}

/**
 * @api {post} /api/v1/notices/create Create Notice
 * @apiName createNotice
 * @apiDescription Creates a notice with the given post data.
 * @apiVersion 0.1.0
 * @apiGroup Notice
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "Notice Name",
 *      "messages": "Notice Message",
 *      "color": "#CCCCC",
 *      "fontColor": "#000000",
 *      "alterWindow": true
 * }
 *
 * @apiExample Example usage:
 * curl -X POST -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/notices/create
 *
 * @apiSuccess {object} notice Notice Object that was created.
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiNotices.create = function (req, res) {
  var postData = req.body
  var notice = new NoticeSchema(postData)
  notice.save(function (err, notice) {
    if (err) {
      winston.debug(err)
      return res.status(400).send({ success: false, error: 'Invalid Post Data' })
    }

    return res.json(notice)
  })
}

/**
 * @api {put} /api/v1/notices/:nid Update Notice
 * @apiName updateNotice
 * @apiDescription Updates given Notice with given Post Data
 * @apiVersion 0.1.0
 * @apiGroup Notice
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "Notice Name",
 *      "messages": "Notice Message",
 *      "color": "#CCCCC",
 *      "fontColor": "#000000",
 *      "alterWindow": true
 * }
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json"
        -H "accesstoken: {accesstoken}"
        -X PUT -d "{\"name\": {name},\"message\": \"{message}\"}"
        -l http://localhost/api/v1/notices/:nid
 *
 * @apiSuccess {boolean} success Successful?
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiNotices.updateNotice = function (req, res) {
  var id = req.params.id
  NoticeSchema.getNotice(id, function (err, notice) {
    if (err) return res.status(400).json({ success: false, error: err })
    notice.update(req.body, function (err) {
      if (err) return res.status(400).json({ success: false, error: err })

      res.json({ success: true })
    })
  })
}

/**
 * @api {get} /api/v1/notices/clearactive Clear Active Notice
 * @apiName clearNotice
 * @apiDescription Clears the currently active Notice
 * @apiVersion 0.1.0
 * @apiGroup Notice
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/notices/clearactive
 *
 * @apiSuccess {boolean} success Successful?
 *
 * @apiError InvalidRequest The Request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": {Error Object}
 }
 */
apiNotices.clearActive = function (req, res) {
  NoticeSchema.getNotices(function (err, notices) {
    if (err) return res.status(400).json({ success: false, error: err })

    _.each(notices, function (notice) {
      notice.active = false
      notice.save(function (err) {
        if (err) return res.status(400).json({ success: false, error: err })
      })
    })

    res.json({ success: true })
  })
}

/**
 * @api {delete} /api/v1/notices/:nid Delete Notice
 * @apiName deleteNotice
 * @apiDescription Deletes Notice with the given Notice ID
 * @apiVersion 0.1.0
 * @apiGroup Notice
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost//api/v1/notices/:nid
 *
 * @apiSuccess {boolean} success Successful?
 *
 * @apiError InvalidRequest The Request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
    "success": {Boolean}
     "error": {Error Object}
 }
 */
apiNotices.deleteNotice = function (req, res) {
  var id = req.params.id
  NoticeSchema.getNotice(id, function (err, notice) {
    if (err) return res.status(400).json({ success: false, error: err })

    notice.remove(function (err) {
      if (err) return res.status(400).json({ success: false, error: err })

      res.json({ success: true })
    })
  })
}

module.exports = apiNotices
