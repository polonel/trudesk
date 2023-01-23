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
var tSortingSchema = require('../../../models/tsorting');
var emitter = require('../../../emitter');
var apiTSortings = {};

apiTSortings.get = function (req, res) {
  var tSortings = [];

  async.parallel(
    [
      function (done) {
        tSortingSchema.find({}, function (err, t) {
          if (err) return done(err);
          tSortings = t;
          return done();
        });
      },
    ],
    function (err) {
      if (err) return res.status(400).json({ success: false, error: err });
      emitter.emit('tsortings:fetch', { tSortings: tSortings });
      return res.json({ success: true, tSortings: tSortings });
    }
  );
};

apiTSortings.put = function (req, res) {
  const data = req.body;

  async.parallel(
    [
      function (done) {
        tSortingSchema.findOne({ userId: data.userId }, (err, tSorting) => {
          if (err) console.log(err);
          if (!tSorting) {
            const tSorting = {
              userId: data.userId,
              sorting: data.sorting,
              direction: 'topDown',
            };
            tSortingSchema.create(tSorting, (err) => {
              if (err) throw err;
              tSortingSchema.findOne({ userId: data.userId }, (err, tSorting) => {
                emitter.emit('tsorting:update', { userId: tSorting.userId, tSorting: tSorting });
              });
              return done();
            });
          } else {
            let direction = '';
            if (tSorting.direction == 'topDown') {
              direction = 'bottomUp';
            } else if (tSorting.direction == 'bottomUp' || tSorting.direction == '' || !tSorting.direction) {
              direction = 'topDown';
            }

            tSortingSchema.updateMany(
              { userId: data.userId },
              { sorting: data.sorting, direction: direction },
              (err, tSorting) => {
                if (err) console.log(err);
                tSortingSchema.findOne({ userId: data.userId }, (err, tSorting) => {
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

module.exports = apiTSortings;
