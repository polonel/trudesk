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
 *  Updated:    2/6/19 12:54 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'

import { GET_TAGS_WITH_PAGE, TAGS_UPDATE_CURRENT_PAGE } from 'actions/types'

const initialState = {
  loading: true,
  totalCount: 0,
  tags: List([]),
  currentPage: 0
}

const tagsReducer = handleActions(
  {
    [GET_TAGS_WITH_PAGE.SUCCESS]: (state, action) => {
      return {
        ...state,
        loading: false,
        totalCount: action.response.count,
        tags: fromJS(action.response.tags)
      }
    },

    [GET_TAGS_WITH_PAGE.ERROR]: (state, action) => {
      return {
        ...state,
        loading: false
      }
    },

    [TAGS_UPDATE_CURRENT_PAGE]: (state, action) => {
      return {
        ...state,
        currentPage: action.payload.currentPage
      }
    }
  },
  initialState
)

export default tagsReducer
