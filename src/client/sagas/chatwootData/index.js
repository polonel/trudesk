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
 *  Updated:    3/30/19 1:02 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { call, put, takeLatest } from 'redux-saga/effects'
import { CREATE_CHATWOOTDATA, FETCH_CHATWOOTDATA, REQUEST_CHATWOOTDATA } from 'actions/types'

import api from '../../api'
import Log from '../../logger'
import helpers from 'lib/helpers'

function * fetchChatwootData ({ payload }) {
  try {
    // const response = yield call(api.chatwootData.fetchChatwootData, payload)
    yield put({ type: FETCH_CHATWOOTDATA.SUCCESS, response })
  } catch (error) {
    const errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_CHATWOOTDATA.ERROR, error })
  }
}

function * createChatwootData ({ payload }) {
  try {
    // const response = yield call(api.chatwootData.create, payload)
    yield put({ type: CREATE_CHATWOOTDATA.SUCCESS, payload })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: CREATE_CHATWOOTDATA.ERROR, error })
    Log.error(errorText, error)
  }
}

function * requestChatwootData ({ payload }) {
  try {
    const response = yield call(api.chatwootData.request, payload)
    yield put({ type: REQUEST_CHATWOOTDATA.SUCCESS, payload })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: REQUEST_CHATWOOTDATA.SUCCESS, error })
    Log.error(errorText, error)
  }
}

export default function * watcher () {
  yield takeLatest(FETCH_CHATWOOTDATA.ACTION, fetchChatwootData)
  yield takeLatest(CREATE_CHATWOOTDATA.ACTION, createChatwootData)
  yield takeLatest(REQUEST_CHATWOOTDATA.ACTION, requestChatwootData)

}
