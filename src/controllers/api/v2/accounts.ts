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

import _ from 'lodash'
import winston from '../../../logger'
import Chance from 'chance'
import apiUtil from '../apiUtils'
import { UserModel as User, GroupModel as Group, TeamModel as Team, DepartmentModel as Department } from '../../../models'
import passwordComplexity from '../../../settings/passwordComplexity'
import { RoleModel, RoleOrderModel, NotificationModel } from '../../../models'
import type { IRoleModel } from '../../../models/role'
import SettingsUtil from '../../../settings/settingsUtil'
import Session from '../../../models/session'
import passport from '../../../passport'

const accountsApi: Record<string, any> = {}

accountsApi.sessionUser = async (req: any, res: any) => {
  if (!req.user) return apiUtil.sendApiError(res, 500, 'Invalid User')

  try {
    const dbUser = await User.findOne({ _id: req.user._id })
    if (!dbUser) return apiUtil.sendApiError(res, 404, 'Invalid User')

    const role = dbUser.role as IRoleModel
    let groups: any[] = []
    if (role?.isAdmin || role?.isAgent) groups = await Department.getDepartmentGroupsOfUser(dbUser._id)
    else groups = await Group.getAllGroupsOfUser(dbUser._id)

    groups = groups.map((g: any) => g._id)

    const clonedUser: any = dbUser.toObject({ virtuals: true })
    delete clonedUser.__v
    delete clonedUser.iOSDeviceTokens
    delete clonedUser.deleted
    clonedUser.groups = groups

    // Ensure role virtuals (isAdmin, isAgent) are serialised even if nested populate didn't include them
    if (clonedUser.role && typeof clonedUser.role === 'object') {
      const liveRole = dbUser.role as IRoleModel
      clonedUser.role.isAdmin = liveRole.isAdmin ?? false
      clonedUser.role.isAgent = liveRole.isAgent ?? false
    }

    return res.json(clonedUser)
  } catch (error: any) {
    return apiUtil.sendApiError(res, 500, error.message)
  }
}

accountsApi.create = async function (req: any, res: any) {
  const postData = req.body
  if (!postData) return apiUtil.sendApiError_InvalidPostData(res)
  if (!postData.password || !postData.passwordConfirm) return apiUtil.sendApiError_InvalidPostData(res)

  let savedId: any = null
  const chance = new Chance()

  try {

    const settingsContent = await SettingsUtil.getSettings(_.noop)
    const settings = settingsContent.settings as any
    const passwordComplexityEnabled = settings?.accountsPasswordComplexity?.value

    if (passwordComplexityEnabled && !passwordComplexity.validate(postData.password))
      throw new Error('Password does not meet requirements')

    const createdUser = await User.create({
      username: postData.username,
      email: postData.email,
      password: postData.password,
      fullname: postData.fullname,
      title: postData.title,
      role: postData.role,
      accessToken: chance.hash()
    })

    savedId = createdUser._id

    const userPopulated = await createdUser.populate('role')

    let groups: any[] = []
    if (postData.groups) {
      groups = await Group.getGroups(postData.groups)
      for (const group of groups) {
        await (group as any).addMember(savedId)
        await (group as any).save()
      }
    }

    let teams: any[] = []
    if (postData.teams) {
      const dbTeams = await Team.getTeamsByIds(postData.teams)
      for (const team of dbTeams) {
        await (team as any).addMember(savedId)
        await (team as any).save()
      }
      teams = dbTeams
    }

    const departments = await Department.getUserDepartments(savedId)
    const user: any = userPopulated.toJSON()
    user.groups = groups.map((g: any) => ({ _id: g._id, name: g.name }))

    const userRole = user.role as IRoleModel
    if ((userRole?.isAgent || userRole?.isAdmin) && teams.length > 0) {
      user.teams = teams.map((t: any) => ({ _id: t._id, name: t.name }))
      user.departments = departments.map((d: any) => ({ _id: d._id, name: d.name }))
    }

    return apiUtil.sendApiSuccess(res, { account: user })
  } catch (e: any) {
    winston.warn(e)
    return apiUtil.sendApiError(res, 500, e.message)
  }
}

async function getAllAccounts(obj: any) {
  const accounts = await User.getWithObject(obj)
  return { accounts, count: accounts.length }
}

async function getRequesterAccounts(obj: any) {
  const accounts = await User.getRequesters(obj)
  const resAccounts: any[] = []
  for (const account of accounts) {
    const groups = await Group.getAllGroupsOfUser(account._id)
    const accountObj = (account as any).toObject()
    accountObj.groups = groups.map((group: any) => ({ name: group.name, _id: group._id }))
    resAccounts.push(accountObj)
  }
  return { accounts: resAccounts, count: resAccounts.length }
}

async function getAgentAccounts(obj: any) {
  const accounts = await User.getAgents(obj)
  const resAccounts: any[] = []
  for (const account of accounts) {
    const accountObj = (account as any).toObject()
    const departments = await Department.getUserDepartments(account._id)
    accountObj.departments = departments.map((d: any) => ({ name: d.name, _id: d._id }))
    const teams = await Team.getTeamsOfUser(account._id)
    accountObj.teams = teams.map((t: any) => ({ name: t.name, _id: t._id }))
    resAccounts.push(accountObj)
  }
  return { accounts: resAccounts, count: resAccounts.length }
}

async function getAdminAccounts(obj: any) {
  const accounts = await User.getAdmins(obj)
  const resAccounts: any[] = []
  for (const account of accounts) {
    const accountObj = (account as any).toObject()
    const departments = await Department.getUserDepartments(account._id)
    accountObj.departments = departments.map((d: any) => ({ name: d.name, _id: d._id }))
    const teams = await Team.getTeamsOfUser(account._id)
    accountObj.teams = teams.map((t: any) => ({ name: t.name, _id: t._id }))
    resAccounts.push(accountObj)
  }
  return { accounts: resAccounts, count: resAccounts.length }
}

accountsApi.get = async function (req: any, res: any) {
  const query = req.query
  const type = query.type || 'requesters'
  const limit = query.limit ? Number(query.limit) : 25
  const page = query.page ? Number(query.page) : 0

  const obj = {
    limit: limit === -1 ? 999999 : limit,
    page: page,
    showDeleted: query.showDeleted && query.showDeleted === 'true'
  }

  try {
    switch (type) {
      case 'all': {
        const result = await getAllAccounts(obj)
        return apiUtil.sendApiSuccess(res, result)
      }
      case 'requesters': {
        const result = await getRequesterAccounts(obj)
        return apiUtil.sendApiSuccess(res, result)
      }
      case 'agents': {
        const result = await getAgentAccounts(obj)
        return apiUtil.sendApiSuccess(res, result)
      }
      case 'admins': {
        const result = await getAdminAccounts(obj)
        return apiUtil.sendApiSuccess(res, result)
      }
      default:
        return apiUtil.sendApiError_InvalidPostData(res)
    }
  } catch (err: any) {
    winston.warn(err)
    return apiUtil.sendApiError(res, 500, err.message)
  }
}

async function updateUserGroups(userId: string, requestedGroups: string[] | undefined) {
  if (!requestedGroups) return Group.getAllGroupsOfUser(userId)

  const groups: any[] = []
  const allGroups = await Group.getAllGroups()
  for (const g of allGroups) {
    const gAny = g as any
    if (_.includes(requestedGroups, g._id.toString())) {
      if (gAny.isMember(userId)) {
        groups.push(g)
      } else {
        const result = await gAny.addMember(userId)
        if (result) {
          await gAny.save()
          groups.push(g)
        }
      }
    } else {
      const result = await gAny.removeMember(userId)
      if (result) await gAny.save()
    }
  }
  return groups
}

async function updateUserTeams(userId: string, requestedTeams: string[] | undefined) {
  if (!requestedTeams) return Team.getTeamsOfUser(userId)

  const teams: any[] = []
  const allTeams = await Team.getTeams()
  for (const t of allTeams) {
    const tAny = t as any
    if (_.includes(requestedTeams, t._id.toString())) {
      if (tAny.isMember(userId)) teams.push(t)
      else {
        const result = await tAny.addMember(userId)
        if (result) {
          await tAny.save()
          teams.push(t)
        }
      }
    } else {
      const result = await tAny.removeMember(userId)
      if (result) await tAny.save()
    }
  }
  return teams
}

accountsApi.update = async function (req: any, res: any) {
  const username = req.params.username
  const postData = req.body
  if (!username || !postData) return apiUtil.sendApiError_InvalidPostData(res)

  let passwordUpdated = false

  try {
    const settingsContent = await SettingsUtil.getSettings(_.noop)
    const settings = settingsContent.settings as any
    const passwordComplexityEnabled = settings?.accountsPasswordComplexity?.value

    let user = await User.getByUsername(username)
    if (!user) throw new Error('Invalid User')

    postData._id = user._id.toString()
    if (
      !_.isUndefined(postData.password) &&
      !_.isEmpty(postData.password) &&
      !_.isUndefined(postData.passwordConfirm) &&
      !_.isEmpty(postData.passwordConfirm)
    ) {
      if (postData.password.length < 4 || postData.passwordConfirm.length < 4)
        throw new Error('Password length is too short.')
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

    const groups = await updateUserGroups(postData._id, postData.groups)
    const teams = await updateUserTeams(postData._id, postData.teams)
    const departments = await Department.getUserDepartments(postData._id)

    const userObj: any = resUser.toJSON()
    userObj.groups = groups.map((g: any) => ({ _id: g._id, name: g.name }))

    const userRole = userObj.role as IRoleModel
    if ((userRole?.isAgent || userRole?.isAdmin) && teams.length > 0) {
      userObj.teams = teams.map((t: any) => ({ _id: t._id, name: t.name }))
      userObj.departments = departments.map((d: any) => ({ _id: d._id, name: d.name }))
    }

    if (passwordUpdated) {
      await Session.destroyUserSession(userObj._id)
    }

    return apiUtil.sendApiSuccess(res, { user: userObj })
  } catch (e: any) {
    const error = { name: e.name, message: e.message }
    return apiUtil.sendApiError(res, 400, error)
  }
}

accountsApi.saveProfile = async (req: any, res: any) => {
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

    if (!_.isUndefined(payload.preferences) && !_.isNull(payload.preferences)) {
      if (payload.preferences.timezone && dbUser.preferences) {
        dbUser.preferences.timezone = payload.preferences.timezone
      }
    }

    dbUser = await dbUser.save()
    return apiUtil.sendApiSuccess(res, { user: dbUser })
  } catch (error: any) {
    return apiUtil.sendApiError(res, 500, error.message)
  }
}

accountsApi.generateMFA = async (req: any, res: any) => {
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
  } catch (e: any) {
    return apiUtil.sendApiError(res, 500, e)
  }
}

accountsApi.verifyMFA = async (req: any, res: any) => {
  const payload = req.body
  if (!payload.tOTPKey) return apiUtil.sendApiError(res, 400, 'Invalid Verification')

  req.user.tOTPKey = payload.tOTPKey

  passport().authenticate('totp-verify', (err: any, success: any) => {
    if (err || !success) return apiUtil.sendApiError(res, 400, 'Invalid Verification')

    User.findOne({ _id: req.user._id }, function (err: any, user: any) {
      if (err) return apiUtil.sendApiError(res, 404, 'Invalid Verification')

      user.tOTPKey = req.user.tOTPKey
      user.tOTPPeriod = 30
      user.hasL2Auth = true

      user.save().then(function () {
        return apiUtil.sendApiSuccess(res)
      }).catch(function (err: any) {
        return apiUtil.sendApiError(res, 500, err.message)
      })
    })
  })(req, res)
}

accountsApi.disableMFA = async (req: any, res: any) => {
  const payload = req.body
  if (!payload.confirmPassword) return apiUtil.sendApiError(res, 400, 'Invalid Credentials')

  try {
    let user = await User.findOne({ _id: req.user }, '+password')
    if (!user) return apiUtil.sendApiError(res, 400, 'Invalid Account')

    if (!User.validatePassword(payload.confirmPassword, user.password))
      return apiUtil.sendApiError(res, 400, 'Invalid Credentials')

    const userAny = user as any
    userAny.tOTPKey = null
    userAny.tOTPPeriod = null
    user.hasL2Auth = false

    user = await user.save()
    return apiUtil.sendApiSuccess(res)
  } catch (e: any) {
    return apiUtil.sendApiError(res, 500, e.message)
  }
}

accountsApi.updatePassword = async (req: any, res: any) => {
  const payload = req.body
  const user = req.user
  if (!payload.currentPassword || !payload.newPassword || !payload.confirmPassword)
    return apiUtil.sendApiError(res, 400, 'Invalid Post Data')

  if (payload.newPassword !== payload.confirmPassword) return apiUtil.sendApiError(res, 400, 'Invalid Post Data')

  try {
    let dbUser = await User.findOne({ _id: user._id }, '+password')
    if (!dbUser) return apiUtil.sendApiError(res, 400, 'Invalid User')

    if (!User.validatePassword(payload.currentPassword, dbUser.password))
      return apiUtil.sendApiError(res, 400, 'Invalid Credentials')

    const settingsContent = await SettingsUtil.getSettings(_.noop)
    const settings = settingsContent.settings as any
    const passwordComplexityEnabled = settings?.accountsPasswordComplexity?.value

    if (passwordComplexityEnabled && !passwordComplexity.validate(payload.newPassword))
      throw new Error('Password does not meet requirements')

    dbUser.password = payload.newPassword
    dbUser = await dbUser.save()

    await Session.destroyUserSession(dbUser._id)

    return apiUtil.sendApiSuccess(res, {})
  } catch (err: any) {
    return apiUtil.sendApiError(res, 500, err.message)
  }
}

accountsApi.userNotifications = async (req: any, res: any) => {
  try {
    const notifications = await NotificationModel.findAllForUser(req.user._id)

    return apiUtil.sendApiSuccess(res, { notifications })
  } catch (err: any) {
    return apiUtil.sendApiError(res, 500, err)
  }
}

accountsApi.getRoles = async (_req: any, res: any) => {
  try {
    const roles = await RoleModel.find({})
    const roleOrder = await RoleOrderModel.findOne({})
    return apiUtil.sendApiSuccess(res, { roles, roleOrder })
  } catch (e: any) {
    return apiUtil.sendApiError(res, 500, e.message)
  }
}

module.exports = accountsApi
