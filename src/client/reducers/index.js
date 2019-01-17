import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';

import sidebar from './sidebarReducer';
import settings from './settings';

const IndexReducer = combineReducers({
    sidebar,
    settings,

    form
});

export default IndexReducer;