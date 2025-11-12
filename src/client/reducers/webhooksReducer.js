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
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import {
  FETCH_WEBHOOKS,
  CREATE_WEBHOOK,
  UPDATE_WEBHOOK,
  DELETE_WEBHOOK,
  TOGGLE_WEBHOOK,
  TEST_WEBHOOK
} from 'actions/types'

const initialState = {
  loading: false,
  webhooks: List([]),
  supportedEvents: List([]),
  error: null
}

const reducer = handleActions(
  {
    [FETCH_WEBHOOKS.ACTION]: state => ({
      ...state,
      loading: true,
      error: null
    }),
    [FETCH_WEBHOOKS.SUCCESS]: (state, action) => ({
      ...state,
      loading: false,
      webhooks: fromJS(action.response.webhooks || []),
      supportedEvents: fromJS(action.response.supportedEvents || []),
      error: null
    }),
    [FETCH_WEBHOOKS.ERROR]: (state, action) => ({
      ...state,
      loading: false,
      error: action.error
    }),
    [CREATE_WEBHOOK.SUCCESS]: (state, action) => ({
      ...state,
      webhooks: state.webhooks.push(fromJS(action.response.webhook))
    }),
    [UPDATE_WEBHOOK.SUCCESS]: (state, action) => {
      const idx = state.webhooks.findIndex(hook => hook.get('_id') === action.response.webhook._id)
      if (idx === -1) return state
      return {
        ...state,
        webhooks: state.webhooks.set(idx, fromJS(action.response.webhook))
      }
    },
    [TOGGLE_WEBHOOK.SUCCESS]: (state, action) => {
      const idx = state.webhooks.findIndex(hook => hook.get('_id') === action.response.webhook._id)
      if (idx === -1) return state
      return {
        ...state,
        webhooks: state.webhooks.set(idx, fromJS(action.response.webhook))
      }
    },
    [TEST_WEBHOOK.SUCCESS]: (state, action) => {
      const idx = state.webhooks.findIndex(hook => hook.get('_id') === action.response.webhook._id)
      if (idx === -1) return state
      return {
        ...state,
        webhooks: state.webhooks.set(idx, fromJS(action.response.webhook))
      }
    },
    [DELETE_WEBHOOK.SUCCESS]: (state, action) => ({
      ...state,
      webhooks: state.webhooks.filter(hook => hook.get('_id') !== action.payload._id)
    })
  },
  initialState
)

export default reducer
