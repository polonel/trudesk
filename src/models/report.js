/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 */

var mongoose = require('mongoose')
var _ = require('lodash')

var COLLECTION = 'reports'

/**
 * @since 1.0
 * @author Chris Brame <polonel@gmail.com>
 * @copyright 2015 Chris Brame
 **/

/**
 * Report Object Schema for MongoDB
 * @module models/report
 * @class Report
 * @property {Number} uid ```Required``` ```unique``` Readable ID of the report
 * @property {String} name ```Required``` Name of the report
 * @property {Number} type ```Required``` Report Type
 * @property {Date} runDate ```Required``` [default:Date.now] Date the Report was ran.
 * @property {Number} status ```Required``` [default:0] Status of report.
 * @property {Array} data ```Required``` Data for the given report. *Based on report type*
 */
var reportSchema = mongoose.Schema({
  uid: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: Number, required: true },
  runDate: { type: Date, required: true, default: Date.now },
  status: { type: Number, required: true, default: 0 },
  data: { type: [mongoose.Schema.Types.Mixed], required: true }
})

reportSchema.pre('save', function (next) {
  if (!_.isUndefined(this.uid) || this.uid) return next()

  var c = require('./counters')
  var self = this
  c.increment('reports', function (err, res) {
    if (err) return next(err)

    self.uid = res.value.next

    if (_.isUndefined(self.uid)) {
      var error = new Error('Invalid UID.')
      return next(error)
    }

    return next()
  })
})

/**
 * Get All Reports
 *
 * @method getReports
 * @memberof Report
 * @param {QueryCallback} callback MongoDB Query Callback
 */
reportSchema.statics.getReports = function (callback) {
  return this.model(COLLECTION)
    .find({})
    .exec(callback)
}

// /**
//  * Get only Runnable Reports
//  *
//  * @method getRunnableReports
//  * @memberof Report
//  * @param {QueryCallback} callback MongoDB Query Callback
//  */
// reportSchema.statics.getRunnableReports = function(callback) {
//     var reports = [];
//     var q = this.model(COLLECTION).find({status: 0});
//
//     q.exec(function(err, items) {
//         if (err) return callback(err);
//         _.each(items, function(item) {
//             if (!item.recurring) {
//                 reports.push(item);
//             } else {
//                 var now = Date.now();
//                 var nextrun = new Date(now + item.interval);
//                 if (now >= nextrun)
//                     reports.push(item);
//             }
//         });
//
//         callback(null, reports);
//     });
// };

reportSchema.statics.getReportByType = function (type, callback) {
  if (_.isUndefined(type) || _.isNull(type))
    return callback('Invalid Report Type - ReportSchema.GetReportByType();', null)

  return this.model(COLLECTION)
    .find({ type: type })
    .exec(callback)
}

reportSchema.statics.getReportByStatus = function (status, callback) {
  if (_.isUndefined(status) || _.isNull(status))
    return callback('Invalid Report Status - ReportSchema.GetReportByStatus();', null)

  return this.model(COLLECTION)
    .find({ status: status })
    .exec(callback)
}

module.exports = mongoose.model(COLLECTION, reportSchema)
