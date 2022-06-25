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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { call, put, takeLatest } from 'redux-saga/effects'

import api from '../../api'
import { FETCH_ROLES, FETCH_VIEWDATA } from 'actions/types'

import Log from '../../logger'
import helpers from 'lib/helpers'

function * fetchRoles ({ payload }) {
  try {
    const response = yield call(api.common.fetchRoles, payload)
    yield put({ type: FETCH_ROLES.SUCCESS, response })
  } catch (error) {
    const errorText = error.response.data.error
    Log.error(errorText, error.response)
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_ROLES.ERROR, error })
  }
}

function * fetchViewData ({ payload, meta }) {
  yield put({ type: FETCH_VIEWDATA.PENDING })
  try {
    const response = yield call(api.common.fetchViewData)
    yield put({ type: FETCH_VIEWDATA.SUCCESS, payload: { response, payload }, meta })
  } catch (error) {
    let errorText = ''
    if (error.response) errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    Log.error(errorText, error.response || error)
    yield put({ type: FETCH_VIEWDATA.ERROR, error })
  }
}

export default function * watcher () {
  yield takeLatest(FETCH_ROLES.ACTION, fetchRoles)
  yield takeLatest(FETCH_VIEWDATA.ACTION, fetchViewData)
}
