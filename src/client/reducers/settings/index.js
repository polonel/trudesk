import { find } from 'lodash';
import { fromJS, Map } from 'immutable';
import { handleActions } from 'redux-actions';
import {FETCH_SETTINGS, UPDATE_SETTING} from 'actions/types';

import helpers from 'lib/helpers';

const initialState = {
    settings: Map({})
};

const settingsReducer = handleActions({
    [FETCH_SETTINGS.SUCCESS]: (state, action) => ({
        settings: fromJS(action.response.settings.data)
    }),

    [UPDATE_SETTING.SUCCESS]: (state, action) => {
        helpers.UI.showSnackbar('Setting Saved Successfully', false);
        const updatedSetting = find(action.response.updatedSettings, { name: action.payload.name });
        return {
            settings: state.settings.setIn(['settings', action.payload.stateName], updatedSetting)
        };
    }

}, initialState);

export default settingsReducer;