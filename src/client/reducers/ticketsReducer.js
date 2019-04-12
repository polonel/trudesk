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
 *  Updated:    4/1/19 2:02 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import isUndefined from 'lodash/isUndefined'
import {
  CREATE_TICKET,
  FETCH_TICKETS,
  TICKET_UPDATED,
  UNLOAD_TICKETS,
  DELETE_TICKET,
  TICKET_EVENT
} from 'actions/types'

const initialState = {
  tickets: List([]),
  totalCount: '',
  viewType: 'active',
  loading: false
}

// Util function until custom views are finished
function hasInView (view, status, assignee, userId) {
  switch (view) {
    case 'all':
      return [0, 1, 2, 3].indexOf(status) !== -1
    case 'active':
      return [0, 1, 2].indexOf(status) !== -1
    case 'assigned':
      return assignee === userId
    case 'unassigned':
      return isUndefined(assignee)
    case 'new':
      return status === 0
    case 'open':
      return status === 1
    case 'pending':
      return status === 2
    case 'closed':
      return status === 3
    default:
      return false
  }
}

const reducer = handleActions(
  {
    [FETCH_TICKETS.PENDING]: (state, action) => {
      return {
        ...state,
        viewType: action.payload.type,
        loading: true
      }
    },

    [FETCH_TICKETS.SUCCESS]: (state, action) => {
      return {
        ...state,
        tickets: fromJS(action.response.tickets || []),
        totalCount: action.response.totalCount
          ? fromJS(action.response.totalCount.toString())
          : action.response.tickets.length.toString(),
        loading: false
      }
    },

    [FETCH_TICKETS.ERROR]: (state, action) => {
      return {
        ...state,
        loading: false
      }
    },

    [CREATE_TICKET.SUCCESS]: (state, action) => {
      const ticket = action.response.ticket
      const inView = hasInView(
        state.viewType,
        ticket.status,
        ticket.assignee ? ticket.assignee._id : undefined,
        action.sessionUser._id
      )

      if (!inView) return { ...state }

      const withTicket = state.tickets.insert(0, fromJS(ticket))

      return {
        ...state,
        tickets: withTicket
      }
    },

    [DELETE_TICKET.SUCCESS]: (state, action) => {
      const idx = state.tickets.findIndex(ticket => {
        return ticket.get('_id') === action.payload.id
      })

      return {
        ...state,
        tickets: state.tickets.delete(idx)
      }
    },

    [TICKET_EVENT.SUCCESS]: (state, action) => {
      const type = action.payload.type
      switch (type) {
        case 'deleted': {
          const id = action.payload.data
          const idx = state.tickets.findIndex(ticket => {
            return ticket.get('_id') === id
          })
          return {
            ...state,
            tickets: state.tickets.delete(idx)
          }
        }
        default:
          return {
            ...state
          }
      }
    },

    [TICKET_UPDATED.SUCCESS]: (state, action) => {
      const ticket = action.payload.ticket
      const inView = hasInView(
        state.viewType,
        ticket.status,
        ticket.assignee ? ticket.assignee._id : undefined,
        action.sessionUser._id
      )

      const idx = state.tickets.findIndex(t => {
        return t.get('_id') === ticket._id
      })

      if (!inView && idx !== -1) {
        return {
          ...state,
          tickets: state.tickets.delete(idx)
        }
      }

      if (!inView) return { ...state }

      if (idx === -1) {
        const withTicket = state.tickets.push(fromJS(ticket))
        return {
          ...state,
          tickets: withTicket.sortBy(t => -t.get('uid'))
        }
      }

      if (ticket.status === 3) {
        return {
          ...state,
          tickets: state.tickets.delete(idx)
        }
      }

      return {
        ...state,
        tickets: state.tickets.set(idx, fromJS(ticket))
      }
    },

    [UNLOAD_TICKETS.SUCCESS]: state => {
      return {
        ...state,
        tickets: state.tickets.clear(),
        loading: false
      }
    }
  },
  initialState
)

export default reducer
