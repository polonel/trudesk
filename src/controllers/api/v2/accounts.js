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
 *  Updated:    4/8/19 1:00 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

const _ = require('lodash')
const async = require('async')
const winston = require('../../../logger')
const Chance = require('chance')
const apiUtil = require('../apiUtils')
const User = require('../../../models/user')
const Group = require('../../../models/group')
const Team = require('../../../models/team')
const Department = require('../../../models/department')
const passwordComplexity = require('../../../settings/passwordComplexity')

const accountsApi = {}

accountsApi.sessionUser = async (req, res) => {
  if (!req.user) return apiUtil.sendApiError(res, 500, 'Invalid User')

  try {
    const dbUser = await User.findOne({ _id: req.user._id })
    if (!dbUser) return apiUtil.sendApiError(res, 404, 'Invalid User')

    let groups = []
    if (dbUser.role.isAdmin || dbUser.role.isAgent) groups = await Department.getDepartmentGroupsOfUser(dbUser._id)
    else groups = await Group.getAllGroupsOfUser(dbUser._id)

    groups = groups.map(g => {
      return g._id
    })

    const clonedUser = _.clone(dbUser._doc)
    delete clonedUser.__v
    delete clonedUser.iOSDeviceTokens
    delete clonedUser.deleted
    clonedUser.groups = groups

    return res.json(clonedUser)
  } catch (error) {
    return apiUtil.sendApiError(res, 500, error.message)
  }
}

accountsApi.create = async function (req, res) {
  const postData = req.body
  if (!postData) return apiUtil.sendApiError_InvalidPostData(res)

  let savedId = null
  const chance = new Chance()

  try {
    if (!postData.password || !postData.passwordConfirm) throw new Error('Password length is too short.')

    // SETTINGS
    const SettingsUtil = require('../../../settings/settingsUtil')
    const settingsContent = await SettingsUtil.getSettings()
    const settings = settingsContent.data.settings
    const passwordComplexityEnabled = settings.accountsPasswordComplexity.value

    if (passwordComplexityEnabled && !passwordComplexity.validate(postData.password))
      throw new Error('Password does not meet requirements')

    let user = await User.create({
      username: postData.username,
      email: postData.email,
      password: postData.password,
      fullname: postData.fullname,
      title: postData.title,
      role: postData.role,
      accessToken: chance.hash()
    })

    savedId = user._id

    const userPopulated = await user.populate('role')

    let groups = []
    if (postData.groups) {
      groups = await Group.getGroups(postData.groups)
      for (const group of groups) {
        await group.addMember(savedId)
        await group.save()
      }
    }

    let teams = []
    if (postData.teams) {
      const dbTeams = await Team.getTeamsByIds(postData.teams)
      for (const team of dbTeams) {
        await team.addMember(savedId)
        await team.save()
      }

      teams = dbTeams
    }

    const departments = await Department.getUserDepartments(savedId)
    user = userPopulated.toJSON()
    user.groups = groups.map(g => {
      return { _id: g._id, name: g.name }
    })

    if ((user.role.isAgent || user.role.isAdmin) && teams.length > 0) {
      user.teams = teams.map(t => {
        return { _id: t._id, name: t.name }
      })

      user.departments = departments.map(d => {
        return { _id: d._id, name: d.name }
      })
    }

    return apiUtil.sendApiSuccess(res, { account: user })
  } catch (e) {
    winston.warn(e)
    return apiUtil.sendApiError(res, 500, e.message)
  }
}

accountsApi.get = function (req, res) {
  const query = req.query
  const type = query.type || 'customers'
  const limit = query.limit ? Number(query.limit) : 25
  const page = query.page ? Number(query.page) : 0

  const obj = {
    limit: limit === -1 ? 999999 : limit,
    page: page,
    showDeleted: query.showDeleted && query.showDeleted === 'true'
  }

  switch (type) {
    case 'all':
      User.getUserWithObject(obj, function (err, accounts) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)

        return apiUtil.sendApiSuccess(res, { accounts: accounts, count: accounts.length })
      })
      break
    case 'customers':
      User.getCustomers(obj, function (err, accounts) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)

        const resAccounts = []

        async.eachSeries(
          accounts,
          function (account, next) {
            Group.getAllGroupsOfUser(account._id, function (err, groups) {
              if (err) return next(err)
              const a = account.toObject()
              a.groups = groups.map(function (group) {
                return { name: group.name, _id: group._id }
              })
              resAccounts.push(a)
              next()
            })
          },
          function (err) {
            if (err) return apiUtil.sendApiError(res, 500, err.message)

            return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
          }
        )
      })
      break
    case 'agents':
      User.getAgents(obj, function (err, accounts) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)

        const resAccounts = []
        async.eachSeries(
          accounts,
          function (account, next) {
            const a = account.toObject()
            Department.getUserDepartments(account._id, function (err, departments) {
              if (err) return next(err)

              a.departments = departments.map(function (department) {
                return { name: department.name, _id: department._id }
              })

              Team.getTeamsOfUser(account._id, function (err, teams) {
                if (err) return next(err)
                a.teams = teams.map(function (team) {
                  return { name: team.name, _id: team._id }
                })
                resAccounts.push(a)
                next()
              })
            })
          },
          function (err) {
            if (err) return apiUtil.sendApiError(res, 500, err.message)

            return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
          }
        )
      })
      break
    case 'admins':
      User.getAdmins(obj, function (err, accounts) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)

        var resAccounts = []
        async.eachSeries(
          accounts,
          function (account, next) {
            var a = account.toObject()
            Department.getUserDepartments(account._id, function (err, departments) {
              if (err) return next(err)

              a.departments = departments.map(function (department) {
                return { name: department.name, _id: department._id }
              })

              Team.getTeamsOfUser(account._id, function (err, teams) {
                if (err) return next(err)
                a.teams = teams.map(function (team) {
                  return { name: team.name, _id: team._id }
                })
                resAccounts.push(a)
                next()
              })
            })
          },
          function (err) {
            if (err) return apiUtil.sendApiError(res, 500, err.message)

            return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
          }
        )
      })
      break
    default:
      return apiUtil.sendApiError_InvalidPostData(res)
  }
}

accountsApi.update = async function (req, res) {
  const username = req.params.username
  const postData = req.body
  if (!username || !postData) return apiUtil.sendApiError_InvalidPostData(res)

  let passwordUpdated = false

  try {
    // SETTINGS
    const SettingsUtil = require('../../../settings/settingsUtil')
    const settingsContent = await SettingsUtil.getSettings()
    const settings = settingsContent.data.settings
    const passwordComplexityEnabled = settings.accountsPasswordComplexity.value

    // USER
    let user = await User.getByUsername(username)
    if (!user) throw new Error('Invalid User')

    postData._id = user._id.toString()
    if (
      !_.isUndefined(postData.password) &&
      !_.isEmpty(postData.password) &&
      !_.isUndefined(postData.passwordConfirm) &&
      !_.isEmpty(postData.passwordConfirm)
    ) {
      if (postData.password.length < 4 || postData.passwordConfirm.length < 4) throw new Error('Password length is too short.')
      if (postData.password === postData.passwordConfirm) {
        if (passwordComplexityEnabled) {
          if (!passwordComplexity.validate(postData.password)) throw new Error('Password does not meet requirements')
        }

        user.password = postData.password
        passwordUpdated = true
      } else throw new Error('Password and Confirm Password do not match.')
    }

    if (!_.isUndefined(postData.fullname) && postData.fullname.length > 0) user.fullname = postData.fullname
    if (!_.isUndefined(postData.email) && postData.email.length > 0) user.email = postData.email
    if (!_.isUndefined(postData.title) && postData.title.length > 0) user.title = postData.title
    if (!_.isUndefined(postData.role) && postData.role.length > 0) user.role = postData.role

    if (!_.isUndefined(postData.preferences)) user.preferences = { ...user.preferences, ...postData.preferences }

    user = await user.save()
    const populatedUser = await user.populate('role')
    const resUser = apiUtil.stripUserFields(populatedUser)

    // GROUPS
    let groups = []
    if (!postData.groups) groups = await Group.getAllGroupsOfUser(postData._id)
    else {
      const allGroups = await Group.getAllGroups()
      for (const g of allGroups) {
        if (_.includes(postData.groups, g._id.toString())) {
          if (g.isMember(postData._id)) {
            groups.push(g)
          } else {
            const result = await g.addMember(postData._id)
            if (result) {
              await g.save()
              groups.push(g)
            }
          }
        } else {
          const result = await g.removeMember(postData._id)
          if (result) await g.save()
        }
      }
    }

    // TEAMS
    let teams = []
    if (!postData.teams) {
      teams = await Team.getTeamsOfUser(postData._id)
    } else {
      const allTeams = await Team.getTeams()
      for (const t of allTeams) {
        if (_.includes(postData.teams, t._id.toString())) {
          if (t.isMember(postData._id)) teams.push(t)
          else {
            const result = await t.addMember(postData._id)
            if (result) {
              await t.save()
              teams.push(t)
            }
          }
        } else {
          const result = await t.removeMember(postData._id)
          if (result) await t.save()
        }
      }
    }

    // DEPARTMENTS
    const departments = await Department.getUserDepartments(postData._id)

    user = resUser.toJSON()
    user.groups = groups.map(g => {
      return { _id: g._id, name: g.name }
    })

    if ((user.role.isAgent || user.role.isAdmin) && teams.length > 0) {
      user.teams = teams.map(t => {
        return { _id: t._id, name: t.name }
      })

      user.departments = departments.map(d => {
        return { _id: d._id, name: d.name }
      })
    }

    if (passwordUpdated) {
      const Session = require('../../../models/session')
      await Session.destroy(user._id)
    }

    return apiUtil.sendApiSuccess(res, { user })
  } catch (e) {
    const error = { name: e.name, message: e.message }
    return apiUtil.sendApiError(res, 400, error)
  }
}

accountsApi.saveProfile = async (req, res) => {
  const payload = req.body
  const user = req.user

  if (payload.username !== user.username || payload._id.toString() !== user._id.toString())
    return apiUtil.sendApiError(res, 400, 'Invalid User Account')

  try {
    let dbUser = await User.findOne({ _id: payload._id })
    if (!dbUser) return apiUtil.sendApiError(res, 404, 'Invalid User Account')

    if (!_.isUndefined(payload.fullname) && !_.isNull(payload.fullname)) dbUser.fullname = payload.fullname
    if (!_.isUndefined(payload.title) && !_.isNull(payload.title)) dbUser.title = payload.title
    if (!_.isUndefined(payload.workNumber) && !_.isNull(payload.workNumber)) dbUser.workNumber = payload.workNumber
    if (!_.isUndefined(payload.mobileNumber) && !_.isNull(payload.mobileNumber))
      dbUser.mobileNumber = payload.mobileNumber

    // User Preferences
    if (!_.isUndefined(payload.preferences) && !_.isNull(payload.preferences)) {
      if (payload.preferences.timezone) dbUser.preferences.timezone = payload.preferences.timezone
    }

    dbUser = await dbUser.save()
    return apiUtil.sendApiSuccess(res, { user: dbUser })
  } catch (error) {
    return apiUtil.sendApiError(res, 500, error.message)
  }
}

accountsApi.generateMFA = async (req, res) => {
  const payload = req.body
  const user = req.user

  if (payload.username !== user.username || payload._id.toString() !== user._id.toString())
    return apiUtil.sendApiError(res, 400, 'Invalid User Account')

  try {
    const dbUser = await User.findOne({ _id: payload._id })
    if (!dbUser) return apiUtil.sendApiError(res, 404, 'Invalid User Account')

    if (!dbUser.hasL2Auth) {
      const key = await dbUser.generateL2Auth()
      const uri = `otpauth://totp/Trudesk:${dbUser.username}-${req.hostname}?secret=${key}&issuer=Trudesk`

      return apiUtil.sendApiSuccess(res, { key, uri })
    } else {
      return apiUtil.sendApiError(res, 400, 'Invalid Account')
    }
  } catch (e) {
    return apiUtil.sendApiError(res, 500, e)
  }
}

accountsApi.verifyMFA = async (req, res) => {
  const payload = req.body
  if (!payload.tOTPKey) return apiUtil.sendApiError(res, 400, 'Invalid Verification')

  req.user.tOTPKey = payload.tOTPKey

  const passport = require('../../../passport')
  passport().authenticate('totp-verify', (err, success) => {
    if (err || !success) return apiUtil.sendApiError(res, 400, 'Invalid Verification')

    User.findOne({ _id: req.user._id }, function (err, user) {
      if (err) return apiUtil.sendApiError(res, 404, 'Invalid Verification')

      user.tOTPKey = req.user.tOTPKey
      user.tOTPPeriod = 30
      user.hasL2Auth = true

      user.save(function (err) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)

        return apiUtil.sendApiSuccess(res)
      })
    })
  })(req, res)
}

accountsApi.disableMFA = async (req, res) => {
  const payload = req.body
  if (!payload.confirmPassword) return apiUtil.sendApiError(res, 400, 'Invalid Credentials')

  try {
    let user = await User.findOne({ _id: req.user }, '+password')
    if (!user) return apiUtil.sendApiError(res, 400, 'Invalid Account')

    if (!User.validate(payload.confirmPassword, user.password))
      return apiUtil.sendApiError(res, 400, 'Invalid Credentials')

    user.tOTPKey = null
    user.tOTPPeriod = null
    user.hasL2Auth = false

    user = await user.save()
    return apiUtil.sendApiSuccess(res)
  } catch (e) {
    return apiUtil.sendApiError(res, 500, e.message)
  }
}

accountsApi.updatePassword = async (req, res) => {
  const payload = req.body
  const user = req.user
  if (!payload.currentPassword || !payload.newPassword || !payload.confirmPassword)
    return apiUtil.sendApiError(res, 400, 'Invalid Post Data')

  if (payload.newPassword !== payload.confirmPassword) return apiUtil.sendApiError(res, 400, 'Invalid Post Data')

  try {
    let dbUser = await User.findOne({ _id: user._id }, '+password')
    if (!dbUser) return apiUtil.sendApiError(res, 400, 'Invalid User')

    if (!User.validate(payload.currentPassword, dbUser.password))
      return apiUtil.sendApiError(res, 400, 'Invalid Credentials')

    // SETTINGS
    const SettingsUtil = require('../../../settings/settingsUtil')
    const settingsContent = await SettingsUtil.getSettings()
    const settings = settingsContent.data.settings
    const passwordComplexityEnabled = settings.accountsPasswordComplexity.value

    if (passwordComplexityEnabled && !passwordComplexity.validate(payload.newPassword))
      throw new Error('Password does not meet requirements')

    dbUser.password = payload.newPassword

    dbUser = await dbUser.save()

    const Session = require('../../../models/session')
    await Session.destroy(dbUser._id)

    return apiUtil.sendApiSuccess(res, {})
  } catch (err) {
    return apiUtil.sendApiError(res, 500, err.message)
  }
}

module.exports = accountsApi
