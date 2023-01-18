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
import { FETCH_TSORTINGS, TSORTING_UPDATED } from 'actions/types'

const initialState = {
  tSortings: List([]),
  tickets: List([]),
  loadingTicketTypes: false,
  types: List([]),
  priorities: List([]),
  totalCount: '',
  viewType: 'active',
  loading: false,
  nextPage: 1,
  prevPage: 0
}



const reducer = handleActions(
  {
    [FETCH_TSORTINGS.SUCCESS]: (state, action) => {
      return {
        ...state,
        tSortings: fromJS(action.response.tSortings)
      }
    }, 

    [TSORTING_UPDATED.SUCCESS]: (state, action) => {

      const tSorting = action.payload.tcm

      const idx = state.tSortings.findIndex(t => {
        return t.get('_id') === tSorting._id
      })
      
      const inView = true

      if (!inView && idx !== -1) {
        return {
          ...state,
          tSortings: state.tSortings.delete(idx)
        }
      }

      if (!inView) return { ...state }

      if (idx === -1) {
        const withTSorting = state.tSortings.push(fromJS(tSorting))
        return {
          ...state,
          tSortings: withTSorting
        }
      }

      return {
        ...state,
        tSortings: state.tSortings.set(idx, fromJS(tSorting))
      }
    }
  },
  
  initialState
)

export default reducer
