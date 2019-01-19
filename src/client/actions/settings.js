import { createAction } from 'redux-actions';
import {FETCH_SETTINGS, UPDATE_SETTING, UPDATE_MULTIPLE_SETTINGS, UPDATE_COLORSCHEME} from './types';

export const fetchSettings = createAction(FETCH_SETTINGS.ACTION);
export const updateSetting = createAction(UPDATE_SETTING.ACTION, (input) => ({name: input.name, value: input.value, stateName: input.stateName}));
export const updateMultipleSettings = createAction(UPDATE_MULTIPLE_SETTINGS.ACTION, (settings) => settings);
export const updateColorScheme = createAction(UPDATE_COLORSCHEME.ACTION, (action) => action);