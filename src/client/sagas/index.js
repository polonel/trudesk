import { all } from 'redux-saga/effects';
import SettingsSaga from './settings';

export default function* IndexSagas () {
    yield all([
        SettingsSaga()
    ]);
}