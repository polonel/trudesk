import { defineAction } from 'redux-define';
import { ERROR, SUCCESS } from './stateConstants';

// Shared
export const SET_SESSION_USER = defineAction('SET_SESSION_USER');

// Common Nav Change
export const NAV_CHANGE = defineAction('NAV_CHANGE');

// Settings
export const FETCH_SETTINGS = defineAction('FETCH_SETTINGS', [SUCCESS, ERROR]);
export const UPDATE_SETTING = defineAction('UPDATE_SETTING', [SUCCESS, ERROR]);
export const UPDATE_MULTIPLE_SETTINGS = defineAction('UPDATE_MULTIPLE_SETTINGS', [SUCCESS, ERROR]);
export const UPDATE_COLORSCHEME = defineAction('UPDATE_COLORSCHEME', [SUCCESS, ERROR]);