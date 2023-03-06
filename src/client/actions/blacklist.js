import { createAction } from 'redux-actions';
import { FETCH_BLACKLIST, ADD_REGEX } from 'actions/types';

export const fetchBlackList = createAction(
  FETCH_BLACKLIST.ACTION,
  (payload) => payload,
  () => ({ thunk: true })
);
export const addRegex = createAction(ADD_REGEX.ACTION);
