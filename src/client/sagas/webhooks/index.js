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
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { call, put, takeLatest } from 'redux-saga/effects'
import {
  CREATE_WEBHOOK,
  DELETE_WEBHOOK,
  FETCH_WEBHOOKS,
  TEST_WEBHOOK,
  TOGGLE_WEBHOOK,
  UPDATE_WEBHOOK
} from 'actions/types'

import api from '../../api'
import Log from '../../logger'
import helpers from 'lib/helpers'

function * fetchWebhooks () {
  try {
    const response = yield call(api.webhooks.fetch)
    yield put({ type: FETCH_WEBHOOKS.SUCCESS, response })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: FETCH_WEBHOOKS.ERROR, error })
    Log.error(errorText, error)
  }
}

function * createWebhook ({ payload }) {
  try {
    const response = yield call(api.webhooks.create, payload)
    yield put({ type: CREATE_WEBHOOK.SUCCESS, response })
    helpers.UI.showSnackbar('Webhook created successfully')
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: CREATE_WEBHOOK.ERROR, error })
    Log.error(errorText, error)
  }
}

function * updateWebhook ({ payload }) {
  try {
    const response = yield call(api.webhooks.update, payload)
    yield put({ type: UPDATE_WEBHOOK.SUCCESS, response })
    helpers.UI.showSnackbar('Webhook updated successfully')
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: UPDATE_WEBHOOK.ERROR, error })
    Log.error(errorText, error)
  }
}

function * toggleWebhook ({ payload }) {
  try {
    const response = yield call(api.webhooks.toggle, payload)
    yield put({ type: TOGGLE_WEBHOOK.SUCCESS, response })
    const enabled = response.webhook.enabled
    helpers.UI.showSnackbar(`Webhook ${enabled ? 'enabled' : 'disabled'}`)
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: TOGGLE_WEBHOOK.ERROR, error })
    Log.error(errorText, error)
  }
}

function * deleteWebhook ({ payload }) {
  try {
    const response = yield call(api.webhooks.delete, payload)
    yield put({ type: DELETE_WEBHOOK.SUCCESS, response, payload })
    helpers.UI.showSnackbar('Webhook deleted')
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: DELETE_WEBHOOK.ERROR, error })
    Log.error(errorText, error)
  }
}

function * testWebhook ({ payload }) {
  try {
    const response = yield call(api.webhooks.test, payload)
    yield put({ type: TEST_WEBHOOK.SUCCESS, response })
    helpers.UI.showSnackbar('Webhook test dispatched')
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    yield put({ type: TEST_WEBHOOK.ERROR, error })
    Log.error(errorText, error)
  }
}

export default function * watcher () {
  yield takeLatest(FETCH_WEBHOOKS.ACTION, fetchWebhooks)
  yield takeLatest(CREATE_WEBHOOK.ACTION, createWebhook)
  yield takeLatest(UPDATE_WEBHOOK.ACTION, updateWebhook)
  yield takeLatest(TOGGLE_WEBHOOK.ACTION, toggleWebhook)
  yield takeLatest(DELETE_WEBHOOK.ACTION, deleteWebhook)
  yield takeLatest(TEST_WEBHOOK.ACTION, testWebhook)
}
