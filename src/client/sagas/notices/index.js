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
 *  Updated:    2/17/22 9:02 PM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import { call, put, takeLatest } from 'redux-saga/effects'
import { FETCH_NOTICES, UPDATE_NOTICE, DELETE_NOTICE, UNLOAD_NOTICES, HIDE_MODAL } from 'actions/types'

import api from '../../api'
import Log from '../../logger'
import helpers from 'lib/helpers'

function * fetchNotices ({ payload }) {
  try {
    const response = yield call(api.notices.get, payload)
    yield put({ type: FETCH_NOTICES.SUCCESS, response })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_NOTICES.ERROR, error })
    Log.error(errorText, error)
  }
}

function * updateNotice ({ payload }) {
  try {
    const response = yield call(api.notices.update, payload)
    yield put({ type: UPDATE_NOTICE.SUCCESS, response })
    yield put({ type: HIDE_MODAL.ACTION })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    if (error.response && error.response.status !== (401 || 403)) {
      Log.error(errorText, error)
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }

    yield put({ type: UPDATE_NOTICE.ERROR, error })
  }
}

function * deleteNotice ({ payload }) {
  try {
    const response = yield call(api.notices.delete, payload)
    yield put({ type: DELETE_NOTICE.SUCCESS, payload, response })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    if (error.response && error.response.status !== (401 || 403)) {
      Log.error(errorText, error)
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }

    yield put({ type: DELETE_NOTICE.ERROR, error })
  }
}

function * unloadThunk ({ payload, meta }) {
  try {
    yield put({ type: UNLOAD_NOTICES.SUCCESS, payload, meta })
  } catch (error) {
    Log.error(error)
  }
}

export default function * watch () {
  yield takeLatest(FETCH_NOTICES.ACTION, fetchNotices)
  yield takeLatest(UPDATE_NOTICE.ACTION, updateNotice)
  yield takeLatest(DELETE_NOTICE.ACTION, deleteNotice)
  yield takeLatest(UNLOAD_NOTICES.ACTION, unloadThunk)
}
