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
 *  Updated:    3/30/19 1:00 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { fromJS, List } from 'immutable';
import { handleActions } from 'redux-actions';
import isUndefined from 'lodash/isUndefined';
import { FETCH_BLACKLIST } from 'actions/types';

const initialState = {
  blacklist: List([]),
};

const reducer = handleActions(
  {
    [FETCH_BLACKLIST.SUCCESS]: (state, action) => {
      return {
        ...state,
        blacklist: fromJS(action.response.blacklist),
      };
    },

    // [BLACKLIST_UPDATED.SUCCESS]: (state, action) => {
    //   const resEmail = action.response.email;
    //   const emailIndex = state.blacklist.findIndex((e) => {
    //     return e.get('_id') === resEmail._id;
    //   });
    //   return {
    //     ...state,
    //     blacklist: state.blacklist.set(emailIndex, fromJS(resEmail)),
    //   };
    // },
  },

  initialState
);

export default reducer;
