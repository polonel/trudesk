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
import { CREATE_LDAPGROUP, DELETE_LDAPGROUP, FETCH_LDAPGROUPS, UNLOAD_LDAPGROUPS, UPDATE_LDAPGROUP } from 'actions/types'

const initialState = {
  ldapGroups: List([])
}

const reducer = handleActions(
  {
    [FETCH_LDAPGROUPS.SUCCESS]: (state, action) => {
    //   const ldapGroups = fromJS(action.response.ldapGroups)
      return {
        ...state,
        ldapGroups: fromJS(action.response.ldapGroups)
      }
    },

    [CREATE_LDAPGROUP.SUCCESS]: (state, action) => {
      const resLDAPGroup = action.response.ldapGroup
      const withInsertedLDAPGroup = state.ldapGroups.push(fromJS(resLDAPGroup))

      return {
        ...state,
        ldapGroups: withInsertedLDAPGroup.sortBy(team => team.get('name'))
      }
    },

    [UPDATE_LDAPGROUP.SUCCESS]: (state, action) => {
      const resLDAPGroup = action.response.ldapGroup
      const ldapGroupIndex = state.ldapGroups.findIndex(g => {
        return g.get('_id') === resLDAPGroup._id
      })
      return {
        ...state,
        ldapGroups: state.ldapGroups.set(ldapGroupIndex, fromJS(resLDAPGroup))
      }
    },

    [DELETE_LDAPGROUP.SUCCESS]: (state, action) => {
      const idx = state.ldapGroups.findIndex(g => {
        return g.get('_id') === action.payload._id
      })
      return {
        ...state,
        ldapGroups: state.ldapGroups.delete(idx)
      }
    },

    [UNLOAD_LDAPGROUPS.SUCCESS]: state => {
      return {
        ...state,
        ldapGroups: state.ldapGroups.clear()
      }
    }
  },
  initialState
)

export default reducer
