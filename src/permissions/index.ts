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
import type { Types } from 'mongoose'
import winston from '../logger'
import { RoleModel, RoleOrderModel } from '../models'
import type { IRole } from '../models/role'

const register = function (callback?: (err?: Error | undefined | null) => void) {
  return new Promise<void>((resolve, reject) => {
    ;(async () => {
      try {
        const roles = await RoleModel.getRolesLean()
        const ro = await RoleOrderModel.getOrderLean()

        winston.debug('Registering Permissions...')
        global.roleOrder = ro
        global.roles = roles

        if (typeof callback === 'function') return callback()

        return resolve()
      } catch (e) {
        winston.warn(e)

        if (typeof callback === 'function') return callback(e as Error)
        return reject(e)
      }
    })()
  })
}

const canThis = function (role: string | Types.ObjectId | IRole, a: string, adminOverride = false) {
  if (!role) return false

  let roleId = role
  if ((role as IRole)._id) {
    roleId = (role as IRole)._id
  }

  const roles = global.roles
  if (_.isUndefined(roles)) return false
  const rolePerm = _.find(roles, (role) => role._id.toString() === roleId.toString()) as IRole
  if (!rolePerm) return false
  if (adminOverride && rolePerm.isAdmin) return true
  if (_.indexOf(rolePerm.grants, '*') !== -1) return true

  const actionType = a.split(':')[0]
  const action = a.split(':')[1]
  if (_.isUndefined(actionType) || _.isUndefined(action)) return false

  const result = _.filter(rolePerm.grants, (v) => _.startsWith(v, actionType + ':'))

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

function buildGrants(obj: { k: string; v: string }): string[] {
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
  buildGrants,
}

export default Permissions
module.exports = Permissions
