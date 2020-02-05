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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { createAction } from 'redux-actions'
import {
  FETCH_SETTINGS,
  UPDATE_SETTING,
  UPDATE_MULTIPLE_SETTINGS,
  UPDATE_COLORSCHEME,
  FETCH_MONGODB_TOOLS,
  FETCH_BACKUPS,
  FETCH_DELETED_TICKETS,
  CHANGE_DELETED_TICKETS_PAGE,
  BACKUP_NOW,
  RESTORE_DELETED_TICKET,
  PERM_DELETE_TICKET,
  UPDATE_PERMISSIONS,
  CREATE_ROLE,
  DELETE_ROLE
} from './types'

export const fetchSettings = createAction(FETCH_SETTINGS.ACTION)
export const updateSetting = createAction(
  UPDATE_SETTING.ACTION,
  input => ({
    name: input.name,
    value: input.value,
    stateName: input.stateName,
    noSnackbar: input.noSnackbar ? input.noSnackbar : false
  }),
  () => ({ thunk: true }) // Allows for thunk style promises in redux-saga
)
export const updateMultipleSettings = createAction(UPDATE_MULTIPLE_SETTINGS.ACTION)
export const updateColorScheme = createAction(UPDATE_COLORSCHEME.ACTION)

export const fetchMongoDBTools = createAction(FETCH_MONGODB_TOOLS.ACTION)
export const fetchBackups = createAction(FETCH_BACKUPS.ACTION)
export const backupNow = createAction(BACKUP_NOW.ACTION)
export const fetchDeletedTickets = createAction(FETCH_DELETED_TICKETS.ACTION)
export const restoreDeletedTicket = createAction(RESTORE_DELETED_TICKET.ACTION)
export const permDeleteTicket = createAction(PERM_DELETE_TICKET.ACTION)
export const changeDeletedTicketsPage = createAction(CHANGE_DELETED_TICKETS_PAGE.ACTION, pageIndex => ({
  pageIndex
}))
export const createRole = createAction(CREATE_ROLE.ACTION)
export const updatePermissions = createAction(UPDATE_PERMISSIONS.ACTION)
export const deleteRole = createAction(DELETE_ROLE.ACTION)
