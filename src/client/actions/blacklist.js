import { createAction } from 'redux-actions';
import { FETCH_BLACKLIST, ADD_EMAIL } from 'actions/types';

export const fetchBlackList = createAction(FETCH_BLACKLIST.ACTION);
export const tSortingUpdated = createAction(ADD_EMAIL.ACTION);
