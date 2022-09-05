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
import { CREATE_LDAPGROUP, DELETE_LDAPGROUP, FETCH_LDAPGROUPS, HIDE_MODAL, UNLOAD_LDAPGROUPS, UPDATE_LDAPGROUP } from 'actions/types'

import api from '../../api'
import Log from '../../logger'
import helpers from 'lib/helpers'

function * fetchLDAPGroups ({ payload }) {
  try {
    const response = yield call(api.ldapGroups.fetchLDAPGroups, payload)
    yield put({ type: FETCH_LDAPGROUPS.SUCCESS, response })
  } catch (error) {
    const errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_LDAPGROUPS.ERROR, error })
  }
}

function * createLDAPGroup ({ payload }) {
  try {
    const response = yield call(api.ldapGroups.create, payload)
    yield put({ type: CREATE_LDAPGROUP.SUCCESS, response })
    yield put({ type: HIDE_MODAL.ACTION })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: CREATE_LDAPGROUP.ERROR, error })
    Log.error(errorText, error)
  }
}

function * updateLDAPGroup ({ payload }) {
  try {
    const response = yield call(api.ldapGroups.update, payload)
    yield put({ type: UPDATE_LDAPGROUP.SUCCESS, response })
    yield put({ type: HIDE_MODAL.ACTION })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: UPDATE_LDAPGROUP.ERROR, error })
    Log.error(errorText, error)
  }
}

function * deleteLDAPGroup ({ payload, meta }) {
  try {
    const response = yield call(api.ldapGroups.delete, payload)
    yield put({ type: DELETE_LDAPGROUP.SUCCESS, payload, response, meta })
    helpers.UI.showSnackbar('Successfully delete LDAP group')
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: DELETE_LDAPGROUP.ERROR, error })
    Log.error(errorText, error)
  }
}

function * unloadThunk ({ payload, meta }) {
  try {
    yield put({ type: UNLOAD_LDAPGROUPS.SUCCESS, payload, meta })
  } catch (error) {
    Log.error(error)
  }
}

export default function * watcher () {
  yield takeLatest(FETCH_LDAPGROUPS.ACTION, fetchLDAPGroups)
  yield takeLatest(CREATE_LDAPGROUP.ACTION, createLDAPGroup)
  yield takeLatest(UPDATE_LDAPGROUP.ACTION, updateLDAPGroup)
  yield takeLatest(DELETE_LDAPGROUP.ACTION, deleteLDAPGroup)
  yield takeLatest(UNLOAD_LDAPGROUPS.ACTION, unloadThunk)
}
