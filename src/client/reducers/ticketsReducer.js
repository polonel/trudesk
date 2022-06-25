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
  TICKET_EVENT,
  FETCH_TICKET_TYPES,
  FETCH_TICKET_TAGS
} from 'actions/types'

const initialState = {
  tickets: List([]),
  loadingTicketTypes: false,
  types: List([]),
  priorities: List([]),
  loadingTicketTags: false,
  tags: List([]),
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
        prevPage: fromJS(action.response.prevPage),
        nextPage: fromJS(action.response.nextPage),
        totalCount: action.response.totalCount
          ? fromJS(action.response.totalCount.toString())
          : action.response.tickets.length.toString(),
        loading: false
      }
    },

    [FETCH_TICKETS.ERROR]: state => {
      return {
        ...state,
        loading: false
      }
    },

    [CREATE_TICKET.SUCCESS]: state => {
      // This is handle with a socket.io event...
      return { ...state }
    },

    [DELETE_TICKET.SUCCESS]: (state, action) => {
      const idx = state.tickets.findIndex(ticket => {
        return ticket.get('_id').toString() === action.payload.id.toString()
      })

      if (idx === -1) return { ...state }

      return {
        ...state,
        tickets: state.tickets.delete(idx)
      }
    },

    [TICKET_EVENT.SUCCESS]: (state, action) => {
      const type = action.payload.type
      switch (type) {
        case 'created': {
          const ticket = action.payload.data
          return {
            ...state,
            tickets: state.tickets.insert(0, fromJS(ticket))
          }
        }
        case 'deleted': {
          const id = action.payload.data
          const idx = state.tickets.findIndex(ticket => {
            return ticket.get('_id').toString() === id.toString()
          })
          if (idx === -1) return { ...state }

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
      const userGroupIds = action.sessionUser.groups

      const idx = state.tickets.findIndex(t => {
        return t.get('_id') === ticket._id
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
    },

    [FETCH_TICKET_TYPES.PENDING]: state => {
      return {
        ...state,
        loadingTicketTypes: true
      }
    },

    [FETCH_TICKET_TYPES.SUCCESS]: (state, action) => {
      return {
        ...state,
        loadingTicketTypes: false,
        types: fromJS(action.response.ticketTypes),
        priorities: fromJS(action.response.priorities)
      }
    },

    [FETCH_TICKET_TAGS.PENDING]: state => {
      return {
        ...state,
        loadingTicketTags: true
      }
    },

    [FETCH_TICKET_TAGS.SUCCESS]: (state, action) => {
      return {
        ...state,
        loadingTicketTags: false,
        tags: fromJS(action.response.tags)
      }
    }
  },
  initialState
)

export default reducer
