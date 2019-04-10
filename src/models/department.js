/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    11/1/2018
 Author:     Chris Brame

 **/

var _ = require('lodash')
var mongoose = require('mongoose')

// Refs
require('./group')
var Teams = require('./team')

var COLLECTION = 'departments'

var departmentSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  normalized: { type: String },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'teams', autopopulate: true }],
  allGroups: { type: Boolean, default: false },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groups', autopopulate: true }]
})

departmentSchema.plugin(require('mongoose-autopopulate'))

departmentSchema.pre('save', function (next) {
  this.name = this.name.trim()
  this.normalized = this.name.trim().toLowerCase()

  return next()
})

departmentSchema.statics.getUserDepartments = function (userId, callback) {
  var self = this

  Teams.getTeamsOfUser(userId, function (err, teams) {
    if (err) return callback({ error: err })

    return self
      .model(COLLECTION)
      .find({ teams: { $in: teams } })
      .exec(callback)
  })
}

module.exports = mongoose.model(COLLECTION, departmentSchema)
