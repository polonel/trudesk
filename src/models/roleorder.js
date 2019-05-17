/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    10/30/2018
 Author:     Chris Brame

 **/

var _ = require('lodash')
var mongoose = require('mongoose')

var COLLECTION = 'role_order'

var roleOrder = mongoose.Schema({
  order: [mongoose.Schema.Types.ObjectId]
})

roleOrder.statics.getOrder = function (callback) {
  return this.model(COLLECTION)
    .findOne({})
    .exec(callback)
}

roleOrder.statics.getOrderLean = function (callback) {
  return this.model(COLLECTION)
    .findOne({})
    .lean()
    .exec(callback)
}

roleOrder.methods.updateOrder = function (order, callback) {
  this.order = order
  this.save(callback)
}

roleOrder.methods.getHierarchy = function (checkRoleId) {
  var idx = _.findIndex(this.order, function (i) {
    return i.toString() === checkRoleId.toString()
  })
  if (idx === -1) return []
  if (idx === 0) return this.order
  return _.drop(this.order, idx)
}

roleOrder.methods.removeFromOrder = function (_id, callback) {
  this.order = _.filter(this.order, function (o) {
    return o.toString() !== _id.toString()
  })

  this.save(callback)
}

module.exports = mongoose.model(COLLECTION, roleOrder, COLLECTION)
