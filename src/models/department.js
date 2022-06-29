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
var async = require('async')
var mongoose = require('mongoose')
var utils = require('../helpers/utils')

// Refs
require('./group')
var Teams = require('./team')
var Groups = require('./group')

var COLLECTION = 'departments'

var departmentSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  normalized: { type: String },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'teams', autopopulate: true }],
  allGroups: { type: Boolean, default: false },
  publicGroups: { type: Boolean, default: false },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groups', autopopulate: true }]
})

departmentSchema.plugin(require('mongoose-autopopulate'))

departmentSchema.pre('save', function (next) {
  this.name = utils.sanitizeFieldPlainText(this.name.trim())
  this.normalized = utils.sanitizeFieldPlainText(this.name.trim().toLowerCase())

  return next()
})

departmentSchema.statics.getDepartmentsByTeam = function (teamIds, callback) {
  return this.model(COLLECTION)
    .find({ teams: { $in: teamIds } })
    .exec(callback)
}

departmentSchema.statics.getUserDepartments = async function (userId, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const teams = await Teams.getTeamsOfUser(userId)
        const exec = self.model(COLLECTION).find({ teams: { $in: teams } })
        if (typeof callback === 'function') {
          return exec.exec(callback)
        }

        const departments = await exec.exec()
        return resolve(departments)
      } catch (e) {
        return reject(e)
      }
    })()
  })
}

departmentSchema.statics.getDepartmentGroupsOfUser = function (userId, callback) {
  const self = this
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const teams = await Teams.getTeamsOfUser(userId)
        const departments = await self.model(COLLECTION).find({ teams: { $in: teams } })

        const hasAllGroups = _.some(departments, { allGroups: true })
        const hasPublicGroups = _.some(departments, { publicGroups: true })
        if (hasAllGroups) {
          const allGroups = await Groups.getAllGroups()
          if (typeof callback === 'function') return callback(null, allGroups)

          return resolve(allGroups)
        } else if (hasPublicGroups) {
          const publicGroups = await Groups.getAllPublicGroups()
          const mapped = departments.map(department => {
            return department.groups
          })

          let merged = _.concat(publicGroups, mapped)
          merged = _.flattenDeep(merged)
          merged = _.uniqBy(merged, i => {
            return i._id
          })

          if (typeof callback === 'function') return callback(null, merged)

          return resolve(merged)
        } else {
          const groups = _.flattenDeep(
            departments.map(function (department) {
              return department.groups
            })
          )

          if (typeof callback === 'function') return callback(null, groups)

          return resolve(groups)
        }
      } catch (error) {
        if (typeof callback === 'function') return callback(error)

        return reject(error)
      }
    })()
  })
}

departmentSchema.statics.getDepartmentsByGroup = function (groupId, callback) {
  var self = this

  return self
    .model(COLLECTION)
    .find({ $or: [{ groups: groupId }, { allGroups: true }] })
    .exec(callback)
}

module.exports = mongoose.model(COLLECTION, departmentSchema)
