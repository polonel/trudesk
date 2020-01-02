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
import {
  CREATE_ACCOUNT,
  DELETE_ACCOUNT,
  ENABLE_ACCOUNT,
  FETCH_ACCOUNTS,
  FETCH_ACCOUNTS_CREATE_TICKET,
  HIDE_MODAL,
  SAVE_EDIT_ACCOUNT,
  UNLOAD_ACCOUNTS
} from 'actions/types'

import Log from '../../logger'
import api from '../../api'
import helpers from 'lib/helpers'

function * fetchAccounts ({ payload, meta }) {
  yield put({ type: FETCH_ACCOUNTS.PENDING })
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

function * fetchAccountsCreateTicket ({ payload, meta }) {
  try {
    const response = yield call(api.accounts.getWithPage, payload)
    yield put({ type: FETCH_ACCOUNTS_CREATE_TICKET.SUCCESS, payload: { response, payload }, meta })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    if (error.response && error.response.status !== (401 || 403)) {
      Log.error(errorText, error)
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }

    yield put({ type: FETCH_ACCOUNTS_CREATE_TICKET.ERROR, error })
  }
}

function * createAccount ({ payload }) {
  try {
    const response = yield call(api.accounts.create, payload)
    yield put({ type: CREATE_ACCOUNT.SUCCESS, response })
    yield put({ type: HIDE_MODAL.ACTION })
    helpers.UI.showSnackbar('Account created successfully')
  } catch (error) {
    const errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    Log.error(errorText, error.response || error)
    yield put({ type: CREATE_ACCOUNT.ERROR, error })
  }
}

function * saveEditAccount ({ payload }) {
  try {
    const response = yield call(api.accounts.updateUser, payload)
    yield put({ type: SAVE_EDIT_ACCOUNT.SUCCESS, response })
    yield put({ type: HIDE_MODAL.ACTION })
    helpers.UI.showSnackbar('Account updated successfully')
  } catch (error) {
    let errorText = ''
    if (error.response) errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    Log.error(errorText, error.response || error)
    yield put({ type: SAVE_EDIT_ACCOUNT.ERROR, error })
  }
}

function * deleteAccount ({ payload }) {
  try {
    yield put({ type: DELETE_ACCOUNT.PENDING, payload })
    const response = yield call(api.accounts.deleteAccount, payload)
    yield put({ type: DELETE_ACCOUNT.SUCCESS, response, payload })
    if (response.disabled) helpers.UI.showSnackbar('Account is linked to existing tickets. Account Disabled')
    else helpers.UI.showSnackbar('Account deleted successfully')
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    Log.error(errorText, error.response || error)
    yield put({ type: DELETE_ACCOUNT.ERROR, error })
  }
}

function * enableAccount ({ payload }) {
  try {
    const response = yield call(api.accounts.enableAccount, payload)
    yield put({ type: ENABLE_ACCOUNT.SUCCESS, response, payload })
    helpers.UI.showSnackbar('Account has been enabled')
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    Log.error(errorText, error.response || error)
    yield put({ type: ENABLE_ACCOUNT.ERROR, error })
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
  yield takeLatest(CREATE_ACCOUNT.ACTION, createAccount)
  yield takeLatest(FETCH_ACCOUNTS.ACTION, fetchAccounts)
  yield takeLatest(FETCH_ACCOUNTS_CREATE_TICKET.ACTION, fetchAccountsCreateTicket)
  yield takeLatest(SAVE_EDIT_ACCOUNT.ACTION, saveEditAccount)
  yield takeEvery(DELETE_ACCOUNT.ACTION, deleteAccount)
  yield takeEvery(ENABLE_ACCOUNT.ACTION, enableAccount)
  yield takeLatest(UNLOAD_ACCOUNTS.ACTION, unloadThunk)
}
