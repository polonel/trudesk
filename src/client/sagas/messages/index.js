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
 *  Updated:    7/2/22 5:23 AM
 *  Copyright (c) 2014-2022. Trudesk Inc (Chris Brame) All rights reserved.
 */

import { call, put, takeLatest, takeEvery } from 'redux-saga/effects'

import api from '../../api'
import {
  FETCH_CONVERSATIONS,
  FETCH_SINGLE_CONVERSATION,
  UNLOAD_SINGLE_CONVERSATION,
  MESSAGES_SEND,
  UNLOAD_CONVERSATIONS
} from 'actions/types'

import Log from '../../logger'
import helpers from 'lib/helpers'

function * fetchConversations ({ payload }) {
  yield put({ type: FETCH_CONVERSATIONS.PENDING })
  try {
    const response = yield call(api.messages.getConversations, payload)
    yield put({ type: FETCH_CONVERSATIONS.SUCCESS, response })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    if (error.response && error.response.status !== (401 || 403)) {
      Log.error(errorText, error)
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }

    yield put({ type: FETCH_CONVERSATIONS.ERROR, error })
  }
}

function * unloadConversations ({ meta }) {
  try {
    yield put({ type: UNLOAD_CONVERSATIONS.SUCCESS, meta })
  } catch (error) {
    Log.error(error)

    yield put({ type: UNLOAD_CONVERSATIONS.ERROR, error })
  }
}

function * fetchSingleConversation ({ payload, meta }) {
  yield put({ type: FETCH_SINGLE_CONVERSATION.PENDING })
  try {
    const response = yield call(api.messages.getSingleConversation, payload)
    yield put({ type: FETCH_SINGLE_CONVERSATION.SUCCESS, response, meta })
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    if (error.response && error.response.status !== (401 || 403)) {
      Log.error(errorText, error)
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }

    yield put({ type: FETCH_SINGLE_CONVERSATION.ERROR, error })
  }
}

function * unloadSingleConversation ({ meta }) {
  try {
    yield put({ type: UNLOAD_SINGLE_CONVERSATION.SUCCESS, meta })
  } catch (error) {
    Log.error(error)

    yield put({ type: UNLOAD_SINGLE_CONVERSATION.ERROR, error })
  }
}

function * sendMessage ({ payload, meta }) {
  try {
    const response = yield call(api.messages.send, payload)
    yield put({ type: MESSAGES_SEND.SUCCESS, payload: response, response, meta })
  } catch (error) {
    Log.error(error)
    const errorText = error.response ? error.response.data.error : error
    if (error.response && error.response.status !== (401 || 403)) {
      Log.error(errorText, error)
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }

    yield put({ type: MESSAGES_SEND.ERROR, error })
  }
}

export default function * watcher () {
  yield takeLatest(FETCH_CONVERSATIONS.ACTION, fetchConversations)
  yield takeLatest(UNLOAD_CONVERSATIONS.ACTION, unloadConversations)
  yield takeLatest(FETCH_SINGLE_CONVERSATION.ACTION, fetchSingleConversation)
  yield takeLatest(UNLOAD_SINGLE_CONVERSATION.ACTION, unloadSingleConversation)
  yield takeEvery(MESSAGES_SEND.ACTION, sendMessage)
}
