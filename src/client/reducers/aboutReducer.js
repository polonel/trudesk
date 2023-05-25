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
 *  Updated:    5/24/23 1:35 AM
 *  Copyright (c) 2014-2023. All rights reserved.
 */

import { handleActions } from 'redux-actions'
import { fromJS, Map } from 'immutable'

import { FETCH_ABOUT_STATS } from 'actions/types'

const initialState = {
  stats: Map({}),
  loading: false,
  error: ''
}

const aboutReducer = handleActions(
  {
    [FETCH_ABOUT_STATS.PENDING]: state => {
      return {
        ...state,
        loading: true
      }
    },

    [FETCH_ABOUT_STATS.SUCCESS]: (state, action) => {
      return {
        ...state,
        loading: false,
        stats: fromJS(action.response.stats)
      }
    },
    [FETCH_ABOUT_STATS.ERROR]: (state, action) => {
      return {
        ...state,
        loading: false,
        stats: initialState.stats,
        error: action.error
      }
    }
  },

  initialState
)

export default aboutReducer
