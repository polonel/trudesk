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

var mongoose = require('mongoose')

var COLLECTION = 'tasks'

/**
 * @since 1.0
 * @author Chris Brame <polonel@gmail.com>
 * @copyright 2015 Chris Brame
 **/

/**
 * Task Object Schema for MongoDB
 * @module models/task
 * @class Task
 * @property {Number} type ```Required``` Type of Task {@link TaskType}
 * @property {String} title ```Required``` Title for Task
 * @property {String} query ```Required``` MongoDB Query to run for this task
 * @property {Date} nextRun ```Required``` Next run date for the task
 * @property {Date} lastRun Last run date for the task
 */

var taskSchema = mongoose.Schema({
  type: { type: Number, required: true },
  title: { type: String, required: true },
  query: { type: String, required: true },
  nextRun: { type: Date, required: true },
  lastRun: Date
})

taskSchema.statics.getTasks = function (callback) {
  return this.model(COLLECTION).find({}, callback)
}

module.exports = mongoose.model(COLLECTION, taskSchema)
