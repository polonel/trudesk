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
import { FETCH_TEAMS, UNLOAD_TEAMS } from 'actions/types'

const initialState = {
  teams: List([])
}

const reducer = handleActions(
  {
    [FETCH_TEAMS.SUCCESS]: (state, action) => {
      let arr = state.teams.toArray()
      action.payload.response.teams.map(i => {
        arr.push(i)
      })
      return {
        ...state,
        teams: fromJS(arr)
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
