import { handleActions } from 'redux-actions';
import { NAV_CHANGE } from '../../actions/types';

const initialState = {
    siteTitle: ''
};

const generalReducer = handleActions({
    [NAV_CHANGE]: (state, action) => ({

    })

}, initialState);

export default generalReducer;