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
 *  Updated:    3/13/19 12:21 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash');
var async = require('async');
var blacklistSchema = require('../../../models/blacklist');
var settingSchema = require('../../../models/setting');
var blacklistCheck = require('../../../mailer/blacklistCheck');
var emitter = require('../../../emitter');
const winston = require('../../../logger');
var apiBlackList = {};
const apiUtil = require('../apiUtils');

apiBlackList.get = function (req, res) {
  var blacklist = [];
  const limit = req.query.limit;
  const skip = req.query.skip;
  async.parallel(
    [
      function (done) {
        blacklistSchema
          .find()
          .skip(skip)
          .limit(limit)
          .then((regexs) => {
            blacklist = regexs;
            return done();
          })
          .catch((err) => {
            return done(err);
          });
      },
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err });
      emitter.emit('blacklist:fetch', { blacklist: blacklist });
      return res.json({ success: true, blacklist: blacklist });
    }
  );
};

apiBlackList.add = async function (req, res) {
  let recordsAdd = req.body;
  const recordsForFind = recordsAdd.map((record) => record.regex.replace(' ', '') != '');
  try {
    await blacklistSchema.findOne({ regex: { $in: recordsForFind } }).then((items) => {
      if (items) {
        for (let item of items) {
          recordsAdd = recordsAdd.filter((record) => {
            return record.regex !== item.regex;
          });
        }
      }
    });
  } catch (e) {
    winston.warn(e);
    return apiUtil.sendApiError(res, 500, e.message);
  }
  async.parallel(
    [
      function (done) {
        try {
          blacklistSchema.insertMany(recordsAdd, (err, record) => {
            if (err) throw err;
            return done();
          });
        } catch (e) {
          winston.warn(e);
          return apiUtil.sendApiError(res, 500, e.message);
        }
      },
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err });
      return apiUtil.sendApiSuccess(res);
    }
  );
};

apiBlackList.update = function (req, res) {
  const recordsUpdate = req.body;
  async.parallel(
    [
      function (done) {
        try {
          const operations = recordsUpdate.map((record) => ({
            updateOne: {
              filter: { _id: record._id },
              update: record,
            },
          }));
          blacklistSchema.bulkWrite(operations, (err, result) => {
            if (err) throw err;
            return done();
          });
        } catch {
          winston.warn(e);
          return apiUtil.sendApiError(res, 500, e.message);
        }
      },
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err });
      return res.json({ success: true });
    }
  );
};

apiBlackList.delete = function (req, res) {
  const recordsRemove = req.body;

  async.parallel(
    [
      function (done) {
        try {
          blacklistSchema.deleteMany({ _id: { $in: recordsRemove } }, (err) => {
            if (err) throw err;
            return done();
          });
        } catch (e) {
          winston.warn(e);
          return apiUtil.sendApiError(res, 500, e.message);
        }
      },
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err });
      return apiUtil.sendApiSuccess(res);
    }
  );
};

module.exports = apiBlackList;
