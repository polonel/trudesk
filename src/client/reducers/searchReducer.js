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
 *  Updated:    4/17/19 12:34 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import { FETCH_SEARCH_RESULTS, UNLOAD_SEARCH_RESULTS } from 'actions/types'

const initialState = {
  loading: false,
  results: List([]),
  error: null
}

const searchReducer = handleActions(
  {
    [FETCH_SEARCH_RESULTS.PENDING]: state => {
      return {
        ...state,
        loading: true
      }
    },

    [FETCH_SEARCH_RESULTS.SUCCESS]: (state, action) => {
      return {
        ...state,
        loading: false,
        results: fromJS(action.response.hits.hits)
      }
    },

    [FETCH_SEARCH_RESULTS.ERROR]: (state, action) => {
      return {
        ...state,
        loading: false,
        error: action.error.response.data
      }
    },

    [UNLOAD_SEARCH_RESULTS.SUCCESS]: state => {
      return {
        ...state,
        loading: false,
        results: state.results.clear()
      }
    }
  },
  initialState
)

export default searchReducer
