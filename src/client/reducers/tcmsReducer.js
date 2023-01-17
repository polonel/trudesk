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
import isUndefined from 'lodash/isUndefined'
import { FETCH_TCMS, TCM_UPDATED } from 'actions/types'

const initialState = {
  tcms: List([]),
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

// Util function until custom views are finished
function hasInView (view, status, assignee, userId, userGroupIds, groupId) {
  let hasView = false
  let hasGroup = false
  switch (view) {
    case 'filter':
      hasView = true
      break
    case 'all':
      hasView = [0, 1, 2, 3].indexOf(status) !== -1
      break
    case 'active':
      hasView = [0, 1, 2].indexOf(status) !== -1
      break
    case 'assigned':
      hasView = assignee === userId
      break
    case 'unassigned':
      hasView = isUndefined(assignee)
      break
    case 'new':
      hasView = status === 0
      break
    case 'open':
      hasView = status === 1
      break
    case 'pending':
      hasView = status === 2
      break
    case 'closed':
      hasView = status === 3
      break
    default:
      hasView = false
  }

  if (isUndefined(userGroupIds) || isUndefined(groupId)) hasGroup = false
  else hasGroup = userGroupIds.indexOf(groupId) !== -1

  return hasGroup && hasView
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
      const ticket = action.payload.ticket
      const tcm = action.payload.tcm
      const userGroupIds = action.sessionUser.groups

      const idx = state.tcms.findIndex(t => {
        return t.get('_id') === tcm._id
      })

      const inView = hasInView(
        state.viewType,
        ticket.status,
        ticket.assignee ? ticket.assignee._id : undefined,
        action.sessionUser._id,
        userGroupIds,
        ticket.group._id
      )

      if (!inView && idx !== -1) {
        return {
          ...state,
          tickets: state.tcms.delete(idx)
        }
      }

      if (!inView) return { ...state }

      if (idx === -1) {
        const withTCMs = state.tcms.push(fromJS(tcm))
        return {
          ...state,
          tcms: withTCMs
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
