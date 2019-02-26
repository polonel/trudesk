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
 *  Updated:    2/24/19 2:48 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { call, put, takeLatest, takeEvery } from 'redux-saga/effects'
import { FETCH_ACCOUNTS, HIDE_MODAL, SAVE_EDIT_ACCOUNT, UNLOAD_ACCOUNTS } from 'actions/types'

import Log from '../../logger'

import api from '../../api'

import helpers from 'lib/helpers'

function * fetchAccounts ({ payload, meta }) {
  try {
    const response = yield call(api.accounts.getWithPage, payload)
    yield put({ type: FETCH_ACCOUNTS.SUCCESS, payload: { response, payload }, meta })
  } catch (error) {
    let errorText = ''
    if (error.response) errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    Log.error(errorText, error.response || error)
    yield put({ type: FETCH_ACCOUNTS.ERROR, error })
  }
}

function * saveEditAccount ({ payload }) {
  try {
    const response = yield call(api.accounts.updateUser, payload)
    yield put({ type: SAVE_EDIT_ACCOUNT.SUCCESS, response })
    yield put({ type: HIDE_MODAL.ACTION })
  } catch (error) {
    let errorText = ''
    if (error.response) errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    Log.error(errorText, error.response || error)
    yield put({ type: SAVE_EDIT_ACCOUNT.ERROR, error })
  }
}

function * unloadThunk ({ payload, meta }) {
  try {
    yield put({ type: UNLOAD_ACCOUNTS.SUCCESS, payload, meta })
  } catch (error) {
    Log.error(error)
  }
}

export default function * watcher () {
  yield takeLatest(FETCH_ACCOUNTS.ACTION, fetchAccounts)
  yield takeLatest(SAVE_EDIT_ACCOUNT.ACTION, saveEditAccount)
  yield takeEvery(UNLOAD_ACCOUNTS.ACTION, unloadThunk)
}
