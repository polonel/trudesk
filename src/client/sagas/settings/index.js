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
import { delay } from 'redux-saga'
import axios from 'axios'

import api from '../../api'
import {
  BACKUP_NOW,
  FETCH_BACKUPS,
  FETCH_DELETED_TICKETS,
  FETCH_MONGODB_TOOLS,
  FETCH_SETTINGS,
  RESTORE_DELETED_TICKET,
  UPDATE_COLORSCHEME,
  UPDATE_MULTIPLE_SETTINGS,
  UPDATE_SETTING
} from 'actions/types'

import Log from '../../logger'
import helpers from 'lib/helpers'

function fetchSettings () {
  return axios
    .get('/api/v1/settings')
    .then(res => {
      return res.data
    })
    .catch(error => {
      throw error.response
    })
}

function * fetchFlow ({ payload }) {
  try {
    const response = yield call(fetchSettings, payload)
    yield put({ type: FETCH_SETTINGS.SUCCESS, response })
  } catch (error) {
    // if (error.status === (401 || 403))
    //     yield put({type: LOGOUT});
    yield put({ type: FETCH_SETTINGS.ERROR, error })
  }
}

function * updateSetting ({ payload, meta }) {
  try {
    const response = yield call(api.settings.update, [payload])
    if (!payload.noSnackbar) helpers.UI.showSnackbar('Setting Saved Successfully', false)
    yield put({ type: UPDATE_SETTING.SUCCESS, response, payload, meta })
  } catch (error) {
    yield put({ type: UPDATE_SETTING.ERROR, error, meta })
  }
}

function * updateMultipleSettings ({ payload }) {
  try {
    const response = yield call(api.settings.update, payload)
    yield put({ type: UPDATE_MULTIPLE_SETTINGS.SUCCESS, response })
    helpers.UI.showSnackbar('Setting saved successfully.', false)
    yield put({ type: FETCH_SETTINGS.ACTION })
  } catch (error) {
    helpers.UI.showSnackbar(error, true)
    yield put({ type: UPDATE_MULTIPLE_SETTINGS.ERROR, error })
  }
}

function * updateColorScheme ({ payload }) {
  try {
    const response = yield call(api.settings.update, payload)
    yield put({ type: UPDATE_COLORSCHEME.SUCCESS, response })
    helpers.UI.showSnackbar('Setting saved successfully. Reloading...', false)
    setTimeout(function () {
      window.location.reload()
    }, 1000)
  } catch (error) {
    helpers.UI.showSnackbar(error, true)
    yield put({ type: UPDATE_MULTIPLE_SETTINGS.ERROR, error })
  }
}

function * checkMongoDBTools ({ payload }) {
  try {
    const response = yield call(api.settings.hasMongoDBTools, payload)
    yield put({ type: FETCH_MONGODB_TOOLS.SUCCESS, response })
  } catch (error) {
    const errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_MONGODB_TOOLS.ERROR, error })
  }
}

function * fetchBackups () {
  try {
    const response = yield call(api.settings.fetchBackups)
    yield put({ type: FETCH_BACKUPS.SUCCESS, response })
  } catch (error) {
    const errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_BACKUPS.ERROR, error })
  }
}

function * backupNow () {
  try {
    yield put({ type: BACKUP_NOW.PENDING })
    const response = yield call(api.settings.backupNow)
    yield put({ type: BACKUP_NOW.SUCCESS, response })
    yield put({ type: FETCH_BACKUPS.ACTION })
    helpers.UI.showSnackbar('Backup completed successfully')
  } catch (error) {
    if (!error.response) return Log.error(error)
    const errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: BACKUP_NOW.ERROR, error })
  }
}

function * fetchDeletedTickets () {
  try {
    yield put({ type: FETCH_DELETED_TICKETS.PENDING })
    const response = yield call(api.settings.fetchDeletedTickets)
    yield put({ type: FETCH_DELETED_TICKETS.SUCCESS, response })
  } catch (error) {
    const errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_DELETED_TICKETS.ERROR, error })
  }
}

function * restoreDeletedTicket ({ payload }) {
  try {
    const response = yield call(api.settings.restoreDeletedTicket, payload)
    yield put({ type: RESTORE_DELETED_TICKET.SUCCESS, response, payload })
    helpers.UI.showSnackbar('Ticket Restored')
  } catch (error) {
    const errorText = error.response.data.error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: RESTORE_DELETED_TICKET.ERROR, error })
  }
}

export default function * settingsWatcher () {
  yield takeLatest(FETCH_SETTINGS.ACTION, fetchFlow)
  yield takeLatest(UPDATE_SETTING.ACTION, updateSetting)
  yield takeLatest(UPDATE_MULTIPLE_SETTINGS.ACTION, updateMultipleSettings)
  yield takeLatest(UPDATE_COLORSCHEME.ACTION, updateColorScheme)
  yield takeLatest(FETCH_MONGODB_TOOLS.ACTION, checkMongoDBTools)
  yield takeLatest(FETCH_BACKUPS.ACTION, fetchBackups)
  yield takeLatest(BACKUP_NOW.ACTION, backupNow)
  yield takeLatest(FETCH_DELETED_TICKETS.ACTION, fetchDeletedTickets)
  yield takeLatest(RESTORE_DELETED_TICKET.ACTION, restoreDeletedTicket)
}
