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
 *  Updated:    3/14/19 12:26 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import { CREATE_TEAM, DELETE_TEAM, FETCH_TEAMS, SAVE_EDIT_TEAM, UNLOAD_TEAMS } from 'actions/types'

const initialState = {
  teams: List([])
}

const reducer = handleActions(
  {
    [FETCH_TEAMS.SUCCESS]: (state, action) => {
      return {
        ...state,
        teams: fromJS(action.payload.response.teams)
      }
    },

    [CREATE_TEAM.SUCCESS]: (state, action) => {
      const resTeam = action.response.team
      const withInsertedTeam = state.teams.push(fromJS(resTeam))
      return {
        ...state,
        teams: withInsertedTeam.sortBy(team => team.get('name'))
      }
    },

    [SAVE_EDIT_TEAM.SUCCESS]: (state, action) => {
      const resTeam = action.response.team
      const teamIndex = state.teams.findIndex(t => {
        return t.get('_id') === resTeam._id
      })
      return {
        ...state,
        teams: state.teams.set(teamIndex, fromJS(resTeam))
      }
    },

    [DELETE_TEAM.SUCCESS]: (state, action) => {
      const idx = state.teams.findIndex(t => {
        return t.get('_id') === action.payload._id
      })
      return {
        ...state,
        teams: state.teams.delete(idx)
      }
    },

    [UNLOAD_TEAMS.SUCCESS]: state => {
      return {
        ...state,
        teams: state.teams.clear()
      }
    }
  },
  initialState
)

export default reducer
