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
 *  Updated:    3/30/19 1:00 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import { CREATE_GROUP, DELETE_GROUP, FETCH_GROUPS, UNLOAD_GROUPS, UPDATE_GROUP } from 'actions/types'

const initialState = {
  groups: List([])
}

const reducer = handleActions(
  {
    [FETCH_GROUPS.SUCCESS]: (state, action) => {
      const groups = fromJS(action.response.groups)
      return {
        ...state,
        groups: groups.sortBy(group => group.get('name'))
      }
    },

    [CREATE_GROUP.SUCCESS]: (state, action) => {
      const resGroup = action.response.group
      const withInsertedGroup = state.groups.push(fromJS(resGroup))

      return {
        ...state,
        groups: withInsertedGroup.sortBy(team => team.get('name'))
      }
    },

    [UPDATE_GROUP.SUCCESS]: (state, action) => {
      const resGroup = action.response.group
      const groupIndex = state.groups.findIndex(g => {
        return g.get('_id') === resGroup._id
      })
      return {
        ...state,
        groups: state.groups.set(groupIndex, fromJS(resGroup))
      }
    },

    [DELETE_GROUP.SUCCESS]: (state, action) => {
      const idx = state.groups.findIndex(g => {
        return g.get('_id') === action.payload._id
      })
      return {
        ...state,
        groups: state.groups.delete(idx)
      }
    },

    [UNLOAD_GROUPS.SUCCESS]: state => {
      return {
        ...state,
        groups: state.groups.clear()
      }
    }
  },
  initialState
)

export default reducer
