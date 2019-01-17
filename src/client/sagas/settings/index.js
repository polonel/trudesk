import { call, put, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import axios from 'axios';

import api from '../../api';
import {
    FETCH_SETTINGS,
    UPDATE_SETTING
} from 'actions/types';

function fetchSettings() {
    return axios.get('/api/v1/settings')
        .then(res => {
            return res.data;
        }).catch((error) => { throw error.response; });
}

function* fetchFlow({payload}) {
    try {
        const response = yield call(fetchSettings, payload);
        yield put({ type: FETCH_SETTINGS.SUCCESS, response });
    } catch (error) {
        // if (error.status === (401 || 403))
        //     yield put({type: LOGOUT});
        yield put({ type: FETCH_SETTINGS.ERROR, error});
    }
}

function* updateSetting({payload}) {
    try {
        const response = yield call(api.settings.update, payload);
        yield put({ type: UPDATE_SETTING.SUCCESS, response, payload });
        // yield put({ type: FETCH_SETTINGS.ACTION });
    } catch (error) {
        yield put({ type: UPDATE_SETTING.ERROR, error });
    }
}

export default function* settingsWatcher() {
    yield takeLatest(FETCH_SETTINGS.ACTION, fetchFlow);
    yield takeLatest(UPDATE_SETTING.ACTION, updateSetting);
}