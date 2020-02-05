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
export const FETCH_TICKETS = defineAction('FETCH_TICKETS', [SUCCESS, PENDING, ERROR])
export const CREATE_TICKET = defineAction('CREATE_TICKET', [PENDING, SUCCESS, ERROR])
export const DELETE_TICKET = defineAction('DELETE_TICKET', [SUCCESS, PENDING, ERROR])
export const UNLOAD_TICKETS = defineAction('UNLOAD_TICKETS', [SUCCESS])
export const TICKET_UPDATED = defineAction('TICKET_UPDATED', [SUCCESS])
export const TICKET_EVENT = defineAction('TICKET_EVENT', [SUCCESS])

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
export const FETCH_ACCOUNTS_CREATE_TICKET = defineAction('FETCH_ACCOUNTS_CREATE_TICKET', [PENDING, SUCCESS, ERROR])
export const CREATE_ACCOUNT = defineAction('CREATE_ACCOUNT', [PENDING, SUCCESS, ERROR])
export const SAVE_EDIT_ACCOUNT = defineAction('SAVE_EDIT_ACCOUNT', [PENDING, SUCCESS, ERROR])
export const DELETE_ACCOUNT = defineAction('DELETE_ACCOUNT', [PENDING, SUCCESS, ERROR])
export const ENABLE_ACCOUNT = defineAction('ENABLE_ACCOUNT', [SUCCESS, ERROR])
export const UNLOAD_ACCOUNTS = defineAction('UNLOAD_ACCOUNTS', [SUCCESS])

// Groups
export const FETCH_GROUPS = defineAction('FETCH_GROUPS', [PENDING, SUCCESS, ERROR])
export const CREATE_GROUP = defineAction('CREATE_GROUP', [SUCCESS, PENDING, ERROR])
export const UPDATE_GROUP = defineAction('UPDATE_GROUP', [SUCCESS, PENDING, ERROR])
export const DELETE_GROUP = defineAction('DELETE_GROUP', [SUCCESS, PENDING, ERROR])
export const UNLOAD_GROUPS = defineAction('UNLOAD_GROUPS', [SUCCESS])

// Teams
export const FETCH_TEAMS = defineAction('FETCH_TEAMS', [PENDING, SUCCESS, ERROR])
export const CREATE_TEAM = defineAction('CREATE_TEAM', [PENDING, SUCCESS, ERROR])
export const SAVE_EDIT_TEAM = defineAction('SAVE_EDIT_TEAM', [PENDING, SUCCESS, ERROR])
export const DELETE_TEAM = defineAction('DELETE_TEAM', [PENDING, SUCCESS, ERROR])
export const UNLOAD_TEAMS = defineAction('UNLOAD_TEAMS', [SUCCESS])

// Departments
export const FETCH_DEPARTMENTS = defineAction('FETCH_DEPARTMENTS', [PENDING, SUCCESS, ERROR])
export const CREATE_DEPARTMENT = defineAction('CREATE_DEPARTMENT', [PENDING, SUCCESS, ERROR])
export const UPDATE_DEPARTMENT = defineAction('UPDATE_DEPARTMENT', [SUCCESS, PENDING, ERROR])
export const DELETE_DEPARTMENT = defineAction('DELETE_DEPARTMENT', [SUCCESS, PENDING, ERROR])
export const UNLOAD_DEPARTMENTS = defineAction('UNLOAD_DEPARTMENTS', [SUCCESS])

// Search
export const FETCH_SEARCH_RESULTS = defineAction('FETCH_SEARCH_RESULTS', [SUCCESS, PENDING, ERROR])
export const UNLOAD_SEARCH_RESULTS = defineAction('UNLOAD_SEARCH_RESULTS', [SUCCESS])

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
export const PERM_DELETE_TICKET = defineAction('PERM_DELETE_TICKET', [SUCCESS, ERROR])
export const CHANGE_DELETED_TICKETS_PAGE = defineAction('CHANGE_DELETED_TICKETS_PAGE')
export const UPDATE_PERMISSIONS = defineAction('UPDATE_PERMISSIONS', [PENDING, SUCCESS, ERROR])
export const CREATE_ROLE = defineAction('CREATE_ROLE', [SUCCESS, ERROR])
export const DELETE_ROLE = defineAction('DELETE_ROLE', [SUCCESS, ERROR])
