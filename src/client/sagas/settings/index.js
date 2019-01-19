import { call, put, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import axios from 'axios';

import api from '../../api';
import {
    FETCH_SETTINGS, UPDATE_COLORSCHEME, UPDATE_MULTIPLE_SETTINGS,
    UPDATE_SETTING
} from 'actions/types';

import helpers from 'lib/helpers';

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
        const response = yield call(api.settings.update, [payload]);
        yield put({ type: UPDATE_SETTING.SUCCESS, response, payload });
    } catch (error) {
        yield put({ type: UPDATE_SETTING.ERROR, error });
    }
}

function* updateMultipleSettings({payload}) {
    try {
        const response = yield call(api.settings.update, payload);
        yield put({ type: UPDATE_MULTIPLE_SETTINGS.SUCCESS, response});
        helpers.UI.showSnackbar('Setting saved successfully.', false);
        yield put({ type: FETCH_SETTINGS.ACTION });
    } catch (error) {
        helpers.UI.showSnackbar(error, true);
        yield put({ type: UPDATE_MULTIPLE_SETTINGS.ERROR, error});
    }
}

function* updateColorScheme({payload}) {
    try {
        const response = yield call(api.settings.update, payload);
        yield put({ type: UPDATE_COLORSCHEME.SUCCESS, response});
        helpers.UI.showSnackbar('Setting saved successfully. Reloading...', false);
        setTimeout(function() {
            window.location.reload();
        }, 1000);
    } catch (error) {
        helpers.UI.showSnackbar(error, true);
        yield put({ type: UPDATE_MULTIPLE_SETTINGS.ERROR, error});
    }
}

export default function* settingsWatcher() {
    yield takeLatest(FETCH_SETTINGS.ACTION, fetchFlow);
    yield takeLatest(UPDATE_SETTING.ACTION, updateSetting);
    yield takeLatest(UPDATE_MULTIPLE_SETTINGS.ACTION, updateMultipleSettings);
    yield takeLatest(UPDATE_COLORSCHEME.ACTION, updateColorScheme);
}