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
var emitter = require('../../../emitter');
var apiBlackList = {};

apiBlackList.get = function (req, res) {
  var blacklist = [];
  const limit = req.query.limit;
  const skip = req.query.skip;
  async.parallel(
    [
      function (done) {
        blacklistSchema
          .find(function (err, b) {
            if (err) return done(err);
            return done();
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .then((emails) => {
            blacklist = emails;
          });
      },
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err });

      return res.json({ success: true, blacklist: blacklist });
    }
  );
};

apiBlackList.put = function (req, res) {
  const data = req.body;

  async.parallel(
    [
      function (done) {
        blacklistSchema.findOne({ email: data.email }, (err, email) => {
          if (err) console.log(err);
          if (!tSorting) {
            const email = {
              email: data.email,
            };
            blacklistSchema.create(tSorting, (err, tSorting) => {
              const stringSorting = String(tSorting.sorting);
              if (err) throw err;
              blacklistSchema.findOne({ userId: data.userId }, (err, tSorting) => {
                emitter.emit('tsorting:update', { userId: tSorting.userId, tSorting: tSorting });
              });
              return done();
            });
          } else {
            let direction = '';
            if (
              tSorting.direction == 'bottomUp' ||
              tSorting.direction == '' ||
              !tSorting.direction ||
              data.sorting !== String(tSorting.sorting)
            ) {
              direction = 'topDown';
            } else if (String(tSorting.direction) == 'topDown') {
              direction = 'bottomUp';
            }

            blacklistSchema.updateMany(
              { userId: data.userId },
              { sorting: data.sorting, direction: direction },
              (err, tSorting) => {
                if (err) console.log(err);
                blacklistSchema.findOne({ userId: data.userId }, (err, tSorting) => {
                  emitter.emit('tsorting:update', { userId: tSorting.userId, tSorting: tSorting });
                });
                return done();
              }
            );
          }
        });
      },
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
};

module.exports = apiBlackList;
