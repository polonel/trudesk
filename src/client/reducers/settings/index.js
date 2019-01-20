/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

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