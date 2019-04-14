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
 *  Updated:    3/29/19 12:11 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  FETCH_DEPARTMENTS,
  UNLOAD_DEPARTMENTS,
  UPDATE_DEPARTMENT
} from 'actions/types'

const initialState = {
  departments: List([])
}

const reducer = handleActions(
  {
    [FETCH_DEPARTMENTS.SUCCESS]: (state, action) => {
      const departmentList = fromJS(action.response.departments)
      return {
        ...state,
        departments: departmentList.sortBy(d => d.get('normalized'))
      }
    },

    [CREATE_DEPARTMENT.SUCCESS]: (state, action) => {
      const department = fromJS(action.response.department)
      const withDepartment = state.departments.push(department)
      return {
        ...state,
        departments: withDepartment.sortBy(department => department.get('normalized'))
      }
    },

    [UPDATE_DEPARTMENT.SUCCESS]: (state, action) => {
      const department = action.response.department
      const idx = state.departments.findIndex(d => {
        return d.get('_id') === department._id
      })

      return {
        ...state,
        departments: state.departments.set(idx, fromJS(department))
      }
    },

    [DELETE_DEPARTMENT.SUCCESS]: (state, action) => {
      const idx = state.departments.findIndex(d => {
        return d.get('_id') === action.payload._id
      })
      return {
        ...state,
        departments: state.departments.delete(idx)
      }
    },

    [UNLOAD_DEPARTMENTS.SUCCESS]: state => {
      return {
        ...state,
        departments: state.departments.clear()
      }
    }
  },
  initialState
)

export default reducer
