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
 *  Updated:    5/23/23 6:37 PM
 *  Copyright (c) 2014-2023. All rights reserved.
 */

import { handleActions } from 'redux-actions'
import { fromJS, List, Map } from 'immutable'

import { FETCH_RELEASES } from 'actions/types'

const initialState = {
  currentVersion: '',
  releaseChannel: 'stable',
  data: List([]),
  loading: false,
  error: ''
}

const releasesReducer = handleActions(
  {
    [FETCH_RELEASES.PENDING]: state => {
      return {
        ...state,
        loading: true
      }
    },

    [FETCH_RELEASES.SUCCESS]: (state, action) => {
      return {
        ...state,
        loading: false,
        currentVersion: 'v' + fromJS(action.response.currentVersion),
        releaseChannel: fromJS(action.response.releaseChannel),
        data: fromJS(action.response.releases)
      }
    },
    [FETCH_RELEASES.ERROR]: (state, action) => {
      return {
        ...state,
        loading: false,
        data: initialState.data,
        error: action.error
      }
    }
  },

  initialState
)

export default releasesReducer
