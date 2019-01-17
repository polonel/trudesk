import { createAction } from 'redux-actions';
import { FETCH_SETTINGS, UPDATE_SETTING } from './types';

export const fetchSettings = createAction(FETCH_SETTINGS.ACTION);
export const updateSetting = createAction(UPDATE_SETTING.ACTION, (input) => ({name: input.name, value: input.value, stateName: input.stateName}));