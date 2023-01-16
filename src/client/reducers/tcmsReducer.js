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
import { FETCH_TCMS, TCM_UPDATED } from 'actions/types'

const initialState = {
  tcms: List([])
}

const reducer = handleActions(
  {
    [FETCH_TCMS.SUCCESS]: (state, action) => {
      return {
        ...state,
        tcms: fromJS(action.response.tcms)
      }
    }, 

    [TCM_UPDATED.SUCCESS]: (state, action) => {

      const tcm = action.payload.tcm
      const idx = state.tcms.findIndex(t => {
        return t.get('_id') === tcm._id
      })

      if (idx !== -1) {
        return {
          ...state,
          tickets: state.tcms.delete(idx)
        }
      }

      if (idx === -1) {
        const withTCM = state.tcms.push(fromJS(tcm))
        return {
          ...state,
          tcms: withTCM.sortBy(t => -t.get('uid'))
        }
      }

      return {
        ...state,
        tcms: state.tcms.set(idx, fromJS(tcm))
      }
    }
  },
  
  initialState
)

export default reducer
