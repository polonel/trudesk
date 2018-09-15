/*
      .                             .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    09/15/2018
 Author:     Chris Brame

 **/

var _ = require('lodash'),
    async = require('async'),
    winston = require('winston'),
    tagSchema = require('../../../models/tag');

var api_tags = {};

/**
 * @api {post} /api/v1/tags/create Creates a tag
 * @apiName createTag
 * @apiDescription Create a tag
 * @apiVersion 0.1.6
 * @apiGroup Tags
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -H "accesstoken: {accesstoken}" -X POST -d "{\"tag\": {tag}}" -l http://localhost/api/v1/tags/create
 *
 * @apiParamExample {json} Request-Example:
 {
     "tag": {tag}
 }
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {boolean} tag Saved Tag
 *
 * @apiError InvalidPostData Invalid Post Data
 */
api_tags.createTag = function(req, res) {
    var data = req.body;
    if (_.isUndefined(data.tag)) return res.status(400).json({error: 'Invalid Post Data'});

    var Tag = new tagSchema({
        name: data.tag
    });

    Tag.save(function(err, T) {
        if (err) return res.status(400).json({error: err.message});

        return res.json({success: true, tag: T});
    });
};

api_tags.getTagsWithLimit = function(req, res) {
    var qs = req.query;
    var limit = qs["limit"] ? qs["limit"] : 25;
    var page = (qs["page"]) ? qs["page"] : 0;

    var tagSchema = require('../../../models/tag');
    try {
        tagSchema.getTagsWithLimit(parseInt(limit), parseInt(page), function(err, tags) {
            if (err) return res.status(400).json({success: false, error: err.message });

            return res.json({success: true, tags: tags});
        });
    } catch(e) {
        return res.status(400).json({success: false, error: 'Invalid Limit and/or page'});
    }
};

/**
 * @api {put} /api/v1/tags/:id Update Tag
 * @apiName updateTag
 * @apiDescription Updates given tag
 * @apiVersion 0.1.7
 * @apiGroup Tags
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tags/:id
 *
 * @apiSuccess {boolean} success Successfully?
 * @apiSuccess {object} tag Updated Tag
 *
 */
api_tags.updateTag = function(req, res) {
    var id = req.params.id;
    var data = req.body;
    if (_.isUndefined(id) || _.isNull(id) || _.isNull(data) || _.isUndefined(data))
        return res.status(400).json({success: false, error: 'Invalid Put Data'});

    var tagSchema = require('../../../models/tag');
    tagSchema.getTag(id, function(err, tag) {
        if (err) return res.status(400).json({success: false, error: err.message});

        tag.name = data.name;

        tag.save(function(err, t) {
            if (err) return res.status(400).json({success: false, error: err.message});

            return res.json({success: true, tag: t});
        });
    });
};

/**
 * @api {delete} /api/v1/tags/:id Delete Tag
 * @apiName deleteTag
 * @apiDescription Deletes the given tag
 * @apiVersion 0.1.7
 * @apiGroup Tags
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tags/:id
 *
 * @apiSuccess {boolean} success Successfully?
 *
 */
api_tags.deleteTag = function(req, res) {
    var id = req.params.id;
    if (_.isUndefined(id) || _.isNull(id)) return res.status(400).json({success: false, error: 'Invalid Tag Id'});

    async.series([
        function(next) {
            var ticketModel = require('../../../models/ticket');
            ticketModel.getAllTicketsByTag(id, function(err, tickets) {
                if (err) return next(err);
                async.each(tickets, function(ticket, cb) {
                    ticket.tags = _.reject(ticket.tags, function(o) { return o._id.toString() === id.toString(); });

                    ticket.save(function(err) {
                        return cb(err);
                    });

                }, function(err) {
                    if (err) return next(err);

                    return next(null);
                });
            });
        },
        function(next) {
            var tagSchema = require('../../../models/tag');
            tagSchema.findByIdAndRemove(id, function(err) {
                return next(err);
            });
        }
    ], function(err) {
        if (err) return res.status(400).json({success: false, error: err.message});

        return res.json({success: true});
    });
};

module.exports = api_tags;