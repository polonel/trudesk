import { createAction } from 'redux-actions';
import { NAV_CHANGE } from './types';

export const updateNavChange = createAction(NAV_CHANGE.ACTION, values => ({activeItem: values.activeItem, activeSubItem: values.activeSubItem, sessionUser: values.sessionUser }));