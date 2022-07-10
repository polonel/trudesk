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
 *  Updated:    7/2/22 5:23 AM
 *  Copyright (c) 2014-2022. Trudesk Inc (Chris Brame) All rights reserved.
 */

import { createAction } from 'redux-actions'
import {
  FETCH_CONVERSATIONS,
  FETCH_SINGLE_CONVERSATION,
  MESSAGES_SEND,
  MESSAGES_UI_RECEIVE,
  UNLOAD_SINGLE_CONVERSATION,
  UNLOAD_CONVERSATIONS,
  DELETE_CONVERSATION,
  SET_CURRENT_CONVERSATION
} from 'actions/types'

export const fetchConversations = createAction(
  FETCH_CONVERSATIONS.ACTION,
  payload => payload,
  () => ({ thunk: true })
)

export const unloadConversations = createAction(
  UNLOAD_CONVERSATIONS.ACTION,
  () => {},
  () => ({ thunk: true })
)

export const fetchSingleConversation = createAction(
  FETCH_SINGLE_CONVERSATION.ACTION,
  payload => payload,
  () => ({ thunk: true })
)

export const unloadSingleConversation = createAction(
  UNLOAD_SINGLE_CONVERSATION.ACTION,
  () => {},
  () => ({ thunk: true })
)

export const deleteConversation = createAction(
  DELETE_CONVERSATION.ACTION,
  payload => payload,
  () => ({ thunk: true })
)

export const setCurrentConversation = createAction(
  SET_CURRENT_CONVERSATION.SUCCESS,
  payload => payload,
  () => ({ thunk: true })
)

export const sendMessage = createAction(
  MESSAGES_SEND.ACTION,
  payload => payload,
  () => ({ thunk: true })
)

export const receiveMessage = createAction(
  MESSAGES_UI_RECEIVE.ACTION,
  payload => payload,
  () => ({ thunk: true })
)
