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

var COLLECTION = 'counters'

var countersSchema = mongoose.Schema({
  _id: String,
  next: Number
})

countersSchema.statics.increment = function (counter, callback) {
  return this.collection.findOneAndUpdate({ _id: counter }, { $inc: { next: 1 } }, callback)
}

countersSchema.statics.setCounter = function (counter, count, callback) {
  return this.collection.findOneAndUpdate({ _id: counter }, { $set: { next: count } }, callback)
}

module.exports = mongoose.model(COLLECTION, countersSchema)
