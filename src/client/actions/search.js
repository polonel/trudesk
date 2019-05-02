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
 *  Updated:    4/17/19 12:28 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { createAction } from 'redux-actions'
import { FETCH_SEARCH_RESULTS, UNLOAD_SEARCH_RESULTS } from 'actions/types'

export const fetchSearchResults = createAction(FETCH_SEARCH_RESULTS.ACTION, payload => payload, () => ({ thunk: true }))
export const unloadSearchResults = createAction(
  UNLOAD_SEARCH_RESULTS.ACTION,
  payload => payload,
  () => ({ thunk: true })
)
