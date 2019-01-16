import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';

import sidebar from './sidebarReducer';

const IndexReducer = combineReducers({
    sidebar,

    form
});

export default IndexReducer;