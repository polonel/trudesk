/*
      .                             .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    06/27/2016
 Author:     Chris Brame

 **/

var async           = require('async'),
    _               = require('lodash'),
    winston         = require('winston'),
    sanitizeHtml    = require('sanitize-html'),

    SettingsSchema   = require('../../../models/setting');

var apiSettings = {};

function defaultApiResponse(err, res) {
    if (err) return res.status(400).json({success: false, error: err});

    return res.json({success: true});
}

/**
 * @api {put} /api/v1/settings/:setting Update Setting
 * @apiName updateSetting
 * @apiDescription Updates given Setting with given Post Data
 * @apiVersion 0.1.7
 * @apiGroup Setting
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "setting:name",
 *      "value": {setting value},
 * }
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json"
        -H "accesstoken: {accesstoken}"
        -X PUT -d "{\"name\": {name},\"value\": \"{value}\"}"
        -l http://localhost/api/v1/settings/:setting
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
apiSettings.updateSetting = function(req, res) {
    var postData = req.body;
    if (_.isUndefined(postData)) return res.status(400).json({success: false, error: 'Invalid Post Data'});

    if (!_.isArray(postData)) postData = [postData];

    async.each(postData, function(item, callback) {
        SettingsSchema.getSettingByName(item.name, function(err, s) {
            if (err) return callback(err.message);
            if (_.isNull(s) || _.isUndefined(s)) {
                s = new SettingsSchema({
                    name: item.name
                });
            }

            if (s.name === 'legal:privacypolicy')
                {item.value = sanitizeHtml(item.value, {
                    allowedTags: false
                });}

            s.value = item.value;

            s.save(function(err) {
                if (err) return callback(err.message);

                callback();
            });
        });
    }, function(err) {
        return defaultApiResponse(err, res);
    });
};

apiSettings.testMailer = function(req, res) {
    var mailer = require('../../../mailer');
    mailer.verify(function(err) {
        if (err) {
            winston.debug(err);
            return res.status(400).json({success: false, error: err.code ? err.code : 'See Console'});
        }

        return res.json({success: true});
    });
};

apiSettings.buildsass = function(req, res) {
    var buildsass = require('../../../sass/buildsass');
    buildsass.build(function(err) {
        return defaultApiResponse(err, res);
    });
};


module.exports = apiSettings;