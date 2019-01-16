import { handleActions } from 'redux-actions';
import { NAV_CHANGE } from '../actions/types';

const initialState = {
    activeItem: '',
    activeSubItem: '',
    sessionUser: null,

    plugins: null
};

const sidebarReducer = handleActions({
    [NAV_CHANGE]: (state, action) => ({
        activeItem: action.payload.activeItem,
        activeSubItem: action.payload.activeSubItem,
        sessionUser: action.payload.sessionUser,

        plugins: null
    })

}, initialState);

export default sidebarReducer;