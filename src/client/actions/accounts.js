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
 *  Updated:    2/24/19 2:46 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { createAction } from 'redux-actions'
import {
  CREATE_ACCOUNT,
  DELETE_ACCOUNT,
  ENABLE_ACCOUNT,
  FETCH_ACCOUNTS,
  FETCH_ACCOUNTS_CREATE_TICKET,
  SAVE_EDIT_ACCOUNT,
  UNLOAD_ACCOUNTS
} from 'actions/types'

export const fetchAccounts = createAction(FETCH_ACCOUNTS.ACTION, payload => payload, () => ({ thunk: true }))
export const fetchAccountsCreateTicket = createAction(
  FETCH_ACCOUNTS_CREATE_TICKET.ACTION,
  payload => payload,
  () => ({ thunk: true })
)
export const createAccount = createAction(CREATE_ACCOUNT.ACTION)
export const saveEditAccount = createAction(SAVE_EDIT_ACCOUNT.ACTION)
export const deleteAccount = createAction(DELETE_ACCOUNT.ACTION)
export const enableAccount = createAction(ENABLE_ACCOUNT.ACTION)
export const unloadAccounts = createAction(UNLOAD_ACCOUNTS.ACTION, payload => payload, () => ({ thunk: true }))
