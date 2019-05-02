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
 *  Updated:    3/30/19 12:38 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { call, put, takeLatest } from 'redux-saga/effects'
import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  FETCH_DEPARTMENTS,
  HIDE_MODAL,
  UNLOAD_DEPARTMENTS,
  UPDATE_DEPARTMENT
} from 'actions/types'
import api from '../../api'
import helpers from 'lib/helpers'
import Log from '../../logger'

function * fetchDepartments ({ payload }) {
  try {
    const response = yield call(api.departments.get, payload)
    yield put({ type: FETCH_DEPARTMENTS.SUCCESS, response })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    Log.error(errorText, error)
    yield put({ type: FETCH_DEPARTMENTS.ERROR, error })
  }
}

function * createDepartment ({ payload }) {
  try {
    const response = yield call(api.departments.create, payload)
    yield put({ type: CREATE_DEPARTMENT.SUCCESS, response })
    yield put({ type: HIDE_MODAL })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: CREATE_DEPARTMENT.ERROR, error })
    Log.error(errorText, error)
  }
}

function * updateDepartment ({ payload }) {
  try {
    const response = yield call(api.departments.update, payload)
    yield put({ type: UPDATE_DEPARTMENT.SUCCESS, response })
    yield put({ type: HIDE_MODAL })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: UPDATE_DEPARTMENT.ERROR, error })
    Log.error(errorText, error)
  }
}

function * deleteDepartment ({ payload }) {
  try {
    const response = yield call(api.departments.delete, payload)
    yield put({ type: DELETE_DEPARTMENT.SUCCESS, payload, response })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: DELETE_DEPARTMENT.ERROR, error })
    Log.error(errorText, error)
  }
}

function * unloadDepartments ({ payload, meta }) {
  try {
    yield put({ type: UNLOAD_DEPARTMENTS.SUCCESS, payload, meta })
  } catch (error) {
    Log.error(error)
  }
}

export default function * watcher () {
  yield takeLatest(FETCH_DEPARTMENTS.ACTION, fetchDepartments)
  yield takeLatest(CREATE_DEPARTMENT.ACTION, createDepartment)
  yield takeLatest(UPDATE_DEPARTMENT.ACTION, updateDepartment)
  yield takeLatest(DELETE_DEPARTMENT.ACTION, deleteDepartment)
  yield takeLatest(UNLOAD_DEPARTMENTS.ACTION, unloadDepartments)
}
