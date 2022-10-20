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
 *  Updated:    2/3/19 3:19 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { createAction } from 'redux-actions'
import {
  CREATE_TICKET_TYPE,
  RENAME_TICKET_TYPE,
  DELETE_TICKET_TYPE,
  FETCH_PRIORITIES,
  CREATE_PRIORITY,
  DELETE_PRIORITY,
  UPDATE_PRIORITY,
  CREATE_TAG,
  GET_TAGS_WITH_PAGE,
  TAGS_UPDATE_CURRENT_PAGE,
  CREATE_TICKET,
  FETCH_TICKETS,
  UNLOAD_TICKETS,
  TICKET_UPDATED,
  DELETE_TICKET,
  TICKET_EVENT,
  TRANSFER_TO_THIRDPARTY,
  FETCH_TICKET_TYPES,
  UPDATE_STATUS,
  CREATE_STATUS,
  FETCH_STATUS,
  DELETE_STATUS
} from 'actions/types'

export const fetchTickets = createAction(FETCH_TICKETS.ACTION)
export const createTicket = createAction(CREATE_TICKET.ACTION)
export const ticketUpdated = createAction(TICKET_UPDATED.ACTION)
export const deleteTicket = createAction(DELETE_TICKET.ACTION)
export const unloadTickets = createAction(
  UNLOAD_TICKETS.ACTION,
  payload => payload,
  () => ({ thunk: true })
)
export const ticketEvent = createAction(TICKET_EVENT.ACTION)

export const createTicketType = createAction(CREATE_TICKET_TYPE.ACTION, input => ({ name: input.name }))
export const renameTicketType = createAction(RENAME_TICKET_TYPE.ACTION, input => ({ name: input.name }))
export const deleteTicketType = createAction(DELETE_TICKET_TYPE.ACTION, (id, newTypeId) => ({ id, newTypeId }))
export const fetchPriorities = createAction(
  FETCH_PRIORITIES.ACTION,
  payload => payload,
  () => ({ thunk: true })
)
export const createPriority = createAction(CREATE_PRIORITY.ACTION, ({ name, overdueIn, htmlColor }) => ({
  name,
  overdueIn,
  htmlColor
}))
export const updatePriority = createAction(UPDATE_PRIORITY.ACTION, ({ id, name, overdueIn, htmlColor }) => ({
  id,
  name,
  overdueIn,
  htmlColor
}))

export const createStatus = createAction(CREATE_STATUS.ACTION, ({ name, htmlColor }) => ({
  name,
  htmlColor
}))
export const updateStatus = createAction(UPDATE_STATUS.ACTION, ({ id, name, htmlColor }) => ({
  id,
  name,
  htmlColor
}))

export const deletePriority = createAction(DELETE_PRIORITY.ACTION, ({ id, newPriority }) => ({ id, newPriority }))
export const deleteStatus = createAction(DELETE_STATUS.ACTION, (id) => ({ id }))
export const getTagsWithPage = createAction(GET_TAGS_WITH_PAGE.ACTION, ({ limit, page }) => ({ limit, page }))
export const tagsUpdateCurrentPage = createAction(TAGS_UPDATE_CURRENT_PAGE.ACTION, currentPage => ({ currentPage }))
export const createTag = createAction(CREATE_TAG.ACTION, ({ name, currentPage }) => ({ name, currentPage }))
export const transferToThirdParty = createAction(TRANSFER_TO_THIRDPARTY.ACTION, ({ uid }) => ({ uid }))
export const fetchTicketTypes = createAction(FETCH_TICKET_TYPES.ACTION)
export const fetchTicketStatus = createAction(FETCH_STATUS.ACTION)