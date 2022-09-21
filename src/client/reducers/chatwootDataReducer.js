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

import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import { CREATE_CHATWOOTDATA, DELETE_CHATWOOTDATA, FETCH_CHATWOOTDATA, UNLOAD_CHATWOOTDATA, UPDATE_CHATWOOTDATA } from 'actions/types'

const initialState = {
  chatwootData: {
    contact:{
        username:'',
        phone:'',
        email:''
    }
  }
}

const reducer = handleActions(
  {
    [FETCH_CHATWOOTDATA.SUCCESS]: (state, action) => {
    //   const ldapGroups = fromJS(action.response.ldapGroups)
      return {
        ...state,
        chatwootData: action.response.chatwootData
      }
    },

    [CREATE_CHATWOOTDATA.SUCCESS]: (state, action) => {
      const resChatwootData = action.response.chatwootData
      
      return {
        ...state,
        chatwootData: resChatwootData
      }
    }
  },
  initialState
)

export default reducer
