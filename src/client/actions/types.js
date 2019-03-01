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

import { defineAction } from 'redux-define'
import { PENDING, ERROR, SUCCESS } from './stateConstants'

// Shared
export const SHOW_MODAL = defineAction('SHOW_MODAL')
export const HIDE_MODAL = defineAction('HIDE_MODAL')
export const CLEAR_MODAL = defineAction('CLEAR_MODAL')
export const SHOW_NOTICE = defineAction('SHOW_NOTICE', [SUCCESS])
export const CLEAR_NOTICE = defineAction('CLEAR_NOTICE')
export const SET_SESSION_USER = defineAction('SET_SESSION_USER')
export const FETCH_ROLES = defineAction('FETCH_ROLES', [SUCCESS, ERROR])
export const UPDATE_ROLE_ORDER = defineAction('UPDATE_ROLE_ORDER', [SUCCESS, ERROR])

// Common Nav Change
export const NAV_CHANGE = defineAction('NAV_CHANGE')

// Tickets
export const CREATE_TICKET = defineAction('CREATE_TICKET', [PENDING, SUCCESS, ERROR])
export const CREATE_TICKET_TYPE = defineAction('CREATE_TICKET_TYPE', [SUCCESS, ERROR])
export const RENAME_TICKET_TYPE = defineAction('RENAME_TICKET_TYPE', [SUCCESS, ERROR])
export const DELETE_TICKET_TYPE = defineAction('DELETE_TICKET_TYPE', [SUCCESS, ERROR])
export const CREATE_PRIORITY = defineAction('CREATE_PRIORITY', [SUCCESS, ERROR])
export const UPDATE_PRIORITY = defineAction('UPDATE_PRIORITY', [SUCCESS, ERROR])
export const DELETE_PRIORITY = defineAction('DELETE_PRIORITY', [SUCCESS, ERROR])
export const GET_TAGS_WITH_PAGE = defineAction('GET_TAGS_WITH_PAGE', [SUCCESS, ERROR])
export const TAGS_UPDATE_CURRENT_PAGE = defineAction('TAGS_UPDATE_CURRENT_PAGE', [SUCCESS, ERROR])
export const CREATE_TAG = defineAction('CREATE_TAG', [SUCCESS, ERROR])

// Accounts
export const FETCH_ACCOUNTS = defineAction('FETCH_ACCOUNTS', [PENDING, SUCCESS, ERROR])
export const CREATE_ACCOUNT = defineAction('CREATE_ACCOUNT', [PENDING, SUCCESS, ERROR])
export const SAVE_EDIT_ACCOUNT = defineAction('SAVE_EDIT_ACCOUNT', [PENDING, SUCCESS, ERROR])
export const DELETE_ACCOUNT = defineAction('DELETE_ACCOUNT', [PENDING, SUCCESS, ERROR])
export const ENABLE_ACCOUNT = defineAction('ENABLE_ACCOUNT', [SUCCESS, ERROR])
export const UNLOAD_ACCOUNTS = defineAction('UNLOAD_ACCOUNTS', [SUCCESS])

// Settings
export const FETCH_SETTINGS = defineAction('FETCH_SETTINGS', [SUCCESS, ERROR])
export const UPDATE_SETTING = defineAction('UPDATE_SETTING', [SUCCESS, ERROR])
export const UPDATE_MULTIPLE_SETTINGS = defineAction('UPDATE_MULTIPLE_SETTINGS', [SUCCESS, ERROR])
export const UPDATE_COLORSCHEME = defineAction('UPDATE_COLORSCHEME', [SUCCESS, ERROR])
export const FETCH_MONGODB_TOOLS = defineAction('FETCH_MONGODB_TOOLS', [SUCCESS, ERROR])
export const FETCH_BACKUPS = defineAction('FETCH_BACKUPS', [SUCCESS, ERROR])
export const BACKUP_NOW = defineAction('BACKUP_NOW', [PENDING, SUCCESS, ERROR])
export const FETCH_DELETED_TICKETS = defineAction('FETCH_DELETED_TICKETS', [PENDING, SUCCESS, ERROR])
export const RESTORE_DELETED_TICKET = defineAction('RESTORE_DELETED_TICKET', [SUCCESS, ERROR])
export const CHANGE_DELETED_TICKETS_PAGE = defineAction('CHANGE_DELETED_TICKETS_PAGE')
export const UPDATE_PERMISSIONS = defineAction('UPDATE_PERMISSIONS', [PENDING, SUCCESS, ERROR])
export const CREATE_ROLE = defineAction('CREATE_ROLE', [SUCCESS, ERROR])
export const DELETE_ROLE = defineAction('DELETE_ROLE', [SUCCESS, ERROR])
