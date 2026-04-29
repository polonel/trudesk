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

import type { Socket } from 'socket.io'
import winston from '../logger'
import utils from '../helpers/utils'
import { UserModel as UserSchema } from '../models'
import Role from '../models/role'
import permissions from '../permissions'

interface AccountImportSocketEvents {
  onImportCSV: (socket: Socket) => void
  onImportJSON: (socket: Socket) => void
  onImportLDAP: (socket: Socket) => void
}

const events = {} as AccountImportSocketEvents

function register(socket: Socket): void {
  events.onImportCSV(socket)
  events.onImportJSON(socket)
  events.onImportLDAP(socket)
}

events.onImportCSV = (socket: Socket) => {
  socket.on('$trudesk:accounts:import:csv', async (data: any) => {
    const authUser = (socket.request as any).user
    if (!permissions.canThis(authUser.role, 'accounts:import')) {
      winston.warn('[$trudesk:accounts:import:csv] - Error: Invalid permissions.')
      utils.sendToSelf(socket, '$trudesk:accounts:import:error', {
        error: 'Invalid Permissions. Check Console.'
      })
      return
    }

    const addedUsers: any[] = data.addedUsers
    const updatedUsers: any[] = data.updatedUsers

    let completedCount = 0

    for (const addedUser of addedUsers) {
      const statusData: any = {
        type: 'csv',
        totalCount: addedUsers.length + updatedUsers.length,
        completedCount,
        item: { username: addedUser.username, state: 1 }
      }

      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)

      const user = new UserSchema({
        username: addedUser.username,
        fullname: addedUser.fullname,
        email: addedUser.email,
        title: addedUser.title ? addedUser.title : null,
        password: 'Password1!'
      })

      const normalizedRole = addedUser.role ? addedUser.role : 'user'

      try {
        const role = await Role.findOne({ normalized: normalizedRole })
        if (!role) throw new Error('Invalid Role')

        user.role = role._id

        await user.save()
        completedCount++

        statusData.item.state = 2
        setTimeout(() => {
          utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
        }, 150)
      } catch (err) {
        winston.warn(err)
        statusData.item.state = 3
        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
      }
    }

    for (const updatedUser of updatedUsers) {
      const statusData: any = {
        type: 'csv',
        totalCount: addedUsers.length + updatedUsers.length,
        completedCount,
        item: { username: updatedUser.username, state: 1 }
      }

      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)

      try {
        const user = await UserSchema.getByUsername(updatedUser.username)
        if (!user) throw new Error('User not found')
        user.fullname = updatedUser.fullname
        user.title = updatedUser.title
        user.email = updatedUser.email

        if (updatedUser.role) {
          const role = await Role.findOne({ normalized: updatedUser.role })
          if (!role) throw new Error('Invalid Role')
          user.role = role._id
        }

        await user.save()
        completedCount++
        statusData.item.state = 2
        statusData.completedCount = completedCount
        setTimeout(function () {
          utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
        }, 150)
      } catch (err) {
        winston.warn(err)
        statusData.item.state = 3
        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
      }
    }
  })
}

events.onImportJSON = (socket: Socket) => {
  socket.on('$trudesk:accounts:import:json', async (data: any) => {
    const authUser = (socket.request as any).user
    if (!permissions.canThis(authUser.role, 'accounts:import')) {
      winston.warn('[$trudesk:accounts:import:json] - Error: Invalid permissions.')
      utils.sendToSelf(socket, '$trudesk:accounts:import:error', {
        error: 'Invalid Permissions. Check Console.'
      })
      return
    }

    const addedUsers: any[] = data.addedUsers
    const updatedUsers: any[] = data.updatedUsers
    let completedCount = 0

    for (const cu of addedUsers) {
      const statusData: any = {
        type: 'json',
        totalCount: addedUsers.length + updatedUsers.length,
        completedCount,
        item: { username: cu.username, state: 1 }
      }

      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)

      const user = new UserSchema({
        username: cu.username,
        fullname: cu.fullname,
        email: cu.email,
        password: 'Password1!'
      })

      try {
        if (cu.role) {
          const role = await Role.findOne({ normalized: cu.role })
          if (!role) throw new Error('Invalid Role')
          user.role = role._id
        } else {
          const defaultRole = await Role.findOne({ normalized: 'user' })
          if (defaultRole) user.role = defaultRole._id
        }

        if (cu.title) user.title = cu.title

        await user.save()
        completedCount++
        statusData.completedCount = completedCount
        statusData.item.state = 2
        await new Promise<void>(resolve => setTimeout(() => {
          utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
          resolve()
        }, 150))
      } catch (err) {
        winston.warn(err)
        statusData.item.state = 3
        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
      }
    }

    for (const uu of updatedUsers) {
      const statusData: any = {
        type: 'json',
        totalCount: addedUsers.length + updatedUsers.length,
        completedCount,
        item: { username: uu.username, state: 1 }
      }

      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)

      try {
        const user = await UserSchema.getByUsername(uu.username)
        if (!user) throw new Error('User not found')
        user.fullname = uu.fullname
        user.title = uu.title
        user.email = uu.email

        if (uu.role) {
          const role = await Role.findOne({ normalized: uu.role })
          if (!role) throw new Error('Invalid Role')
          user.role = role._id
        }

        await user.save()
        completedCount++
        statusData.item.state = 2
        statusData.completedCount = completedCount
        setTimeout(() => {
          utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
        }, 150)
      } catch (err) {
        winston.warn(err)
        statusData.item.state = 3
        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
      }
    }
  })
}

events.onImportLDAP = (socket: Socket) => {
  socket.on('$trudesk:accounts:import:ldap', async (data: any) => {
    const authUser = (socket.request as any).user
    if (!permissions.canThis(authUser.role, 'accounts:import')) {
      winston.warn('[$trudesk:accounts:import:ldap] - Error: Invalid permissions.')
      utils.sendToSelf(socket, '$trudesk:accounts:import:error', {
        error: 'Invalid Permissions. Check Console.'
      })
      return
    }

    const addedUsers: any[] = data.addedUsers
    const updatedUsers: any[] = data.updatedUsers
    let completedCount = 0

    const settingSchema = require('../models/setting')
    let defaultUserRole: any = null
    try {
      const setting = await new Promise<any>((resolve, reject) => {
        settingSchema.getSettingByName('role:user:default', (err: Error | null, s: any) => {
          if (err || !s) reject(err || new Error('Default user role not set'))
          else resolve(s)
        })
      })
      defaultUserRole = setting.value
    } catch (err) {
      utils.sendToSelf(socket, '$trudesk:accounts:import:error', {
        error: 'Default user role not set. Please contact an Administrator.'
      })
      return
    }

    for (const lu of addedUsers) {
      const statusData: any = {
        type: 'ldap',
        totalCount: addedUsers.length + updatedUsers.length,
        completedCount,
        item: { username: lu.sAMAccountName, state: 1 }
      }

      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)

      const user = new UserSchema({
        username: lu.sAMAccountName,
        fullname: lu.displayName,
        email: lu.mail,
        title: lu.title,
        role: defaultUserRole,
        password: 'Password1!'
      })

      try {
        await user.save()
        completedCount++
        statusData.completedCount = completedCount
        statusData.item.state = 2
        await new Promise<void>(resolve => setTimeout(() => {
          utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
          resolve()
        }, 150))
      } catch (err) {
        winston.warn(err)
        statusData.item.state = 3
        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
      }
    }

    for (const uu of updatedUsers) {
      const statusData: any = {
        type: 'ldap',
        totalCount: addedUsers.length + updatedUsers.length,
        completedCount,
        item: { username: uu.username, state: 1 }
      }

      utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)

      try {
        const user = await UserSchema.getUser(uu._id)
        if (!user) throw new Error('User not found')
        user.fullname = uu.fullname
        user.title = uu.title
        user.email = uu.email

        await user.save()
        completedCount++
        statusData.item.state = 2
        statusData.completedCount = completedCount
        setTimeout(() => {
          utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
        }, 150)
      } catch (err) {
        winston.warn(err)
        statusData.item.state = 3
        utils.sendToSelf(socket, '$trudesk:accounts:import:onStatusChange', statusData)
      }
    }
  })
}

export { events, register }
export default { events, register }
