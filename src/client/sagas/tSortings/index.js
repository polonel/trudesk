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

import { call, put, takeLatest, takeEvery, select } from 'redux-saga/effects'
import { FETCH_TSORTINGS, TSORTING_UPDATED } from 'actions/types'

import api from '../../api'
import helpers from 'lib/helpers'
import Log from '../../logger'

const getSessionUser = state => state.shared.sessionUser

function* fetchTSortings({ payload }) {
    try {
        const response = yield call(api.tSortings.fetchTSortings, payload)
        yield put({ type: FETCH_TSORTINGS.SUCCESS, response })
    } catch (error) {
        const errorText = error.response.data.error
        helpers.UI.showSnackbar(`Error: ${errorText}`, true)
        yield put({ type: FETCH_TSORTINGS.ERROR, error })
    }
}

function* tSortingUpdated({ payload }) {
    try {
        yield call(api.tSortings.tSortingUpdated, payload)
        const sessionUser = yield select(getSessionUser)
        yield put({ type: TSORTING_UPDATED.SUCCESS, payload, sessionUser })
    } catch (error) {
        Log.error(error)
        const errorText = error.response.data.error
        helpers.UI.showSnackbar(`Error: ${errorText}`, true)
        yield put({ type: FETCH_TSORTINGS.ERROR, error })
    }
}

export default function* watcher() {
    yield takeLatest(FETCH_TSORTINGS.ACTION, fetchTSortings)
    yield takeEvery(TSORTING_UPDATED.ACTION, tSortingUpdated)
}