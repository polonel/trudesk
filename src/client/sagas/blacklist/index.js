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

import { call, put, takeLatest } from 'redux-saga/effects';
import { FETCH_BLACKLIST, ADD_EMAIL } from 'actions/types';

import api from '../../api';
import Log from '../../logger';
import helpers from 'lib/helpers';

function* fetchBlackList({ payload }) {
  console.log('fetchBlackList');
  try {
    const response = yield call(api.blacklist.fetch, payload);
    yield put({ type: FETCH_BLACKLIST.SUCCESS, response });
  } catch (error) {
    const errorText = error.response.data.error;
    helpers.UI.showSnackbar(`Error: ${errorText}`, true);
    yield put({ type: FETCH_BLACKLIST.ERROR, error });
  }
}

function* addEmail({ payload }) {
  try {
    const response = yield call(api.blacklist.add, payload);
    yield put({ type: ADD_EMAIL.SUCCESS, response });
    helpers.UI.showSnackbar('Account created successfully');
  } catch (error) {
    const errorText = error.response.data.error;
    helpers.UI.showSnackbar(`Error: ${errorText}`, true);
    Log.error(errorText, error.response || error);
    yield put({ type: ADD_EMAIL.ERROR, error });
  }
}

// function* updateBlackList({ payload }) {
//   try {
//     const response = yield call(api.blacklist.update, payload);
//     yield put({ type: BLACKLIST_UPDATED.SUCCESS, response });
//   } catch (error) {
//     const errorText = error.response ? error.response.data.error : error;
//     helpers.UI.showSnackbar(`Error: ${errorText}`, true);
//     yield put({ type: BLACKLIST_UPDATED.ERROR, error });
//     Log.error(errorText, error);
//   }
// }

export default function* watcher() {
  yield takeLatest(FETCH_BLACKLIST.ACTION, fetchBlackList);
  yield takeLatest(ADD_EMAIL.ACTION, addEmail);
}
