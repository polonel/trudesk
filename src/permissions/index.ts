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

import _ from 'lodash'
import winston from '../logger'
import { RoleModel, RoleOrderModel } from '../models'
import type { IRole } from "../models/role";
import type { Types } from "mongoose";

const register = function (callback: (err?: Error | undefined | null) => void) {
  // Register Roles
  RoleModel.getRolesLean(function (err, roles) {
    if (err) return callback(err)

    RoleOrderModel.getOrderLean(function (err, ro) {
      if (err) return callback(err)

      winston.debug('Registering Permissions...')
      global.roleOrder = ro
      global.roles = roles

      return callback()
    })
  })
}

/***
 * Checks to see if a role as the given action
 * @param roleId [role to check against]
 * @param a [action to check]
 * @param adminOverride [override if admin]
 * @returns {boolean}
 */

const canThis = function (roleId: string | Types.ObjectId, a: string, adminOverride = false) {
  if (_.isUndefined(roleId)) return false

  const roles = global.roles
  if (_.isUndefined(roles)) return false
  const rolePerm = _.find(roles, { _id: roleId }) as IRole
  if (!rolePerm) return false
  if (adminOverride && rolePerm.isAdmin) return true
  if (_.isUndefined(rolePerm)) return false
  if (_.indexOf(rolePerm.grants, '*') !== -1) return true

  const actionType = a.split(':')[0]
  const action = a.split(':')[1]

  if (_.isUndefined(actionType) || _.isUndefined(action)) return false

  const result = _.filter(rolePerm.grants, (value) => {
    if (_.startsWith(value, actionType + ':')) return value as string
    return null
  })

  if (!result || result.length < 1) return false
  if (result.length === 1) {
    if (result[0] === '*') return true
  }

  const singleResult = result[0] as string

  let typePerm = singleResult.split(':')[1]?.split(' ')
  typePerm = _.uniq(typePerm)

  if (_.indexOf(typePerm, '*') !== -1) return true

  return _.indexOf(typePerm, action) !== -1
}

const getRoles = (action: string) => {
  if (!action) return false

  let rolesWithAction: Array<IRole> = []
  const roles = global.roles
  if (_.isUndefined(roles)) return []

  _.each(roles, function (role) {
    const actionType = action.split(':')[0]
    const theAction = action.split(':')[1]

    if (_.isUndefined(actionType) || _.isUndefined(theAction)) return
    if (_.indexOf(role.grants, '*') !== -1) {
      rolesWithAction.push(role)
      return
    }

    const result = _.filter(role.grants, function (value) {
      if (_.startsWith(value, actionType + ':')) return value
      return null
    })

    if (_.isUndefined(result) || _.size(result) < 1) return
    if (_.size(result) === 1) {
      if (result[0] === '*') {
        rolesWithAction.push(role)
        return
      }
    }

    const singleResult = result[0] as string

    let typePerm = singleResult.split(':')[1]?.split(' ')
    typePerm = _.uniq(typePerm)

    if (_.indexOf(typePerm, '*') !== -1) {
      rolesWithAction.push(role)
      return
    }

    if (_.indexOf(typePerm, theAction) !== -1) {
      rolesWithAction.push(role)
    }
  })

  rolesWithAction = _.uniq(rolesWithAction)

  return rolesWithAction
}

function hasHierarchyEnabled(roleId: string | Types.ObjectId) {
  const role = _.find(global.roles, function (o) {
    return o._id.toString() === roleId.toString()
  })
  if (_.isUndefined(role) || _.isUndefined(role.hierarchy)) return true
  return role.hierarchy
}

function parseRoleHierarchy(roleId: string | Types.ObjectId) {
  const roleOrder = global.roleOrder?.order

  const idx = _.findIndex(roleOrder, function (i) {
    return i.toString() === roleId.toString()
  })
  if (idx === -1) return []

  return _.slice(roleOrder, idx)
}

function hasPermOverRole(ownRoleId: string | Types.ObjectId, extRoleId: string | Types.ObjectId) {
  const roles = parseRoleHierarchy(extRoleId)

  const i = _.find(roles, function (o) {
    return o.toString() === ownRoleId.toString()
  })

  return !_.isUndefined(i)
}

function isAdmin(roleId: string | Types.ObjectId, callback: (result: boolean) => void) {
  RoleModel.get(roleId, function (err, role) {
    if (err) return callback(false)
    if (!role) return callback(false)
    return callback(role.isAdmin)
  })
}

function isAdminSync(roleId: string | Types.ObjectId): boolean {
  const roles = global.roles
  if (!roles) return false
  const role = _.find(roles, function (r) {
    return r._id.toString() === roleId.toString()
  })

  if (!role) return false

  return role.isAdmin
}

function buildGrants(obj: { k: string, v: string }): string[] {
  return _.map(obj, function (v, k) {
    return k + ':' + _.join(v, ' ')
  })
}

const Permissions = {
  register,
  flushRoles: register,
  canThis,
  hasHierarchyEnabled,
  parseRoleHierarchy,
  hasPermOverRole,

  getRoles,
  isAdmin,
  isAdminSync,
  buildGrants
}

export default Permissions
module.exports = Permissions
