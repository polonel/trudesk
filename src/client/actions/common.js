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
 *  Updated:    2/4/19 12:36 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { createAction } from 'redux-actions'
import {
  SHOW_MODAL,
  HIDE_MODAL,
  CLEAR_MODAL,
  FETCH_ROLES,
  UPDATE_ROLE_ORDER,
  SHOW_NOTICE,
  CLEAR_NOTICE
} from 'actions/types'

export const showModal = createAction(SHOW_MODAL.ACTION, (modalType, modalProps) => ({ modalType, modalProps }))
export const hideModal = createAction(HIDE_MODAL.ACTION)
export const clearModal = createAction(CLEAR_MODAL.ACTION)

export const showNotice = createAction(SHOW_NOTICE.ACTION)
export const clearNotice = createAction(CLEAR_NOTICE.ACTION)

export const fetchRoles = createAction(FETCH_ROLES.ACTION)
export const updateRoleOrder = createAction(UPDATE_ROLE_ORDER.ACTION)
