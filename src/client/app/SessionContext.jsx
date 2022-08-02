/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/29/19 12:29 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import { createContext } from 'react'

// TODO: remove once redux is gone
import { store } from '../app'

const SESSIONKEY = 'trudesk/session'

const memory = { data: null }
const defaultData = {}

export function getSession () {
  if (!memory.data) {
    try {
      const data = JSON.parse(localStorage.getItem(SESSIONKEY))
      if (data && data.token && data.refreshToken && data.user && data.session) {
        // Part of Redux Shit
        store.dispatch({ type: 'SET_SESSION_USER', payload: { sessionUser: data.user } })

        memory.data = data
        return memory.data
      }

      memory.data = defaultData
    } catch (error) {
      memory.data = defaultData
    }
  }

  return memory.data || defaultData
}

export function saveSession (session) {
  if (!session.session || !session.token || !session.refreshToken || !session.user) {
    throw new Error('Invalid Session')
  }

  memory.data = session
  localStorage.setItem(SESSIONKEY, JSON.stringify(session))

  // Part of Redux Shit
  store.dispatch({ type: 'SET_SESSION_USER', payload: { sessionUser: session.user } })

  return memory.data
}

export function clearSession () {
  memory.data = defaultData
  localStorage.removeItem(SESSIONKEY)
  return memory.data
}

const SessionContext = createContext({
  session: defaultData,
  setSession: () => {}
})

export default SessionContext
