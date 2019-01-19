import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';

import shared from './shared';
import sidebar from './sidebarReducer';
import settings from './settings';

const IndexReducer = combineReducers({
    shared,
    sidebar,
    settings,

    form
});

export default IndexReducer;