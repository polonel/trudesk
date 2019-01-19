import { find } from 'lodash';
import { fromJS, Map } from 'immutable';
import { handleActions } from 'redux-actions';
import {FETCH_SETTINGS, UPDATE_COLORSCHEME, UPDATE_MULTIPLE_SETTINGS, UPDATE_SETTING} from 'actions/types';

import helpers from 'lib/helpers';

const initialState = {
    settings: Map({}),
    loaded: false
};

const settingsReducer = handleActions({
    [FETCH_SETTINGS.SUCCESS]: (state, action) => ({
        settings: fromJS(action.response.settings.data),
        loaded: true
    }),

    [UPDATE_SETTING.SUCCESS]: (state, action) => {
        helpers.UI.showSnackbar('Setting Saved Successfully', false);
        const updatedSetting = find(action.response.updatedSettings, { name: action.payload.name });
        return {
            loaded: state.loaded,
            settings: state.settings.setIn(['settings', action.payload.stateName], updatedSetting)
        };
    },

    [UPDATE_SETTING.ERROR]: (state, action) => {
        helpers.UI.showSnackbar('Error: ' + action.error, true);
        return {
            loaded: state.loaded,
            settings: state.settings
        };
    },

    [UPDATE_MULTIPLE_SETTINGS.SUCCESS]: (state) => {
        return {
            loaded: state.loaded,
            settings: state.settings
        };
    }

}, initialState);

export default settingsReducer;