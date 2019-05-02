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
 *  Updated:    4/17/19 12:29 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { call, put, takeLatest } from 'redux-saga/effects'
import { FETCH_SEARCH_RESULTS, UNLOAD_SEARCH_RESULTS } from 'actions/types'

import api from '../../api'
import Log from '../../logger'
import helpers from 'lib/helpers'

function * fetchSearchResults ({ payload, meta }) {
  yield put({ type: FETCH_SEARCH_RESULTS.PENDING })
  if (!payload.term) yield put({ type: FETCH_SEARCH_RESULTS.ERROR, error: { message: 'Invalid search Term' } })
  try {
    const response = yield call(api.search.search, payload)
    yield put({ type: FETCH_SEARCH_RESULTS.SUCCESS, response, meta })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_SEARCH_RESULTS.ERROR, error })
    Log.error(errorText, error)
  }
}

function * unloadSearchResults ({ payload, meta }) {
  yield put({ type: UNLOAD_SEARCH_RESULTS.SUCCESS, payload, meta })
}

export default function * watcher () {
  yield takeLatest(FETCH_SEARCH_RESULTS.ACTION, fetchSearchResults)
  yield takeLatest(UNLOAD_SEARCH_RESULTS.ACTION, unloadSearchResults)
}
