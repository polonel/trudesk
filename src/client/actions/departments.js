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
 *  Updated:    3/29/19 12:01 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { createAction } from 'redux-actions'
import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  FETCH_DEPARTMENTS,
  UNLOAD_DEPARTMENTS,
  UPDATE_DEPARTMENT
} from 'actions/types'

export const fetchDepartments = createAction(FETCH_DEPARTMENTS.ACTION, payload => payload, () => ({ thunk: true }))
export const createDepartment = createAction(CREATE_DEPARTMENT.ACTION)
export const updateDepartment = createAction(UPDATE_DEPARTMENT.ACTION)
export const deleteDepartment = createAction(DELETE_DEPARTMENT.ACTION)
export const unloadDepartments = createAction(UNLOAD_DEPARTMENTS.ACTION, payload => payload, () => ({ thunk: true }))
