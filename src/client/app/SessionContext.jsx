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
import jwt_decode from 'jwt-decode'
import axios from 'api/axios'

import { store } from 'app'

const SESSIONKEY = 'trudesk/session'

const memory = { data: null }
const defaultData = {}

export let sessionMemory = memory.data || {}

export function getSession () {
  // if (!memory.data) {
  //   try {
  //     const response = await axios.post('/api/v2/token')
  //     const data = response.data
  //     if (data && data.token) {
  //       const decoded = jwt_decode(data.token)
  //       if (decoded.user) {
  //         const saveData = { user: decoded.user, token: data.token }
  //
  //         store.dispatch({ type: 'SET_SESSION_USER', payload: { sessionUser: decoded.user } })
  //
  //         memory.data = saveData
  //         console.log(memory.data)
  //         return memory.data
  //       }
  //     }
  //
  //     memory.data = defaultData
  //   } catch (error) {
  //     memory.data = defaultData
  //   }
  // }

  return memory.data || defaultData
}

export function saveSession (session) {
  if (!session.token) {
    throw new Error('Invalid Session')
  }

  const decoded = jwt_decode(session.token)
  if (!decoded.user) throw new Error('Invalid Session')

  memory.data = { user: decoded.user, token: session.token }

  // sessionStorage.setItem(SESSIONKEY, JSON.stringify(saveData))

  store.dispatch({ type: 'SET_SESSION_USER', payload: { sessionUser: decoded.user } })

  return memory.data
}

export function clearSession () {
  memory.data = defaultData
  store.dispatch({ type: 'SET_SESSION_USER', payload: { sessionUser: null } })

  return memory.data
}

export async function forceRefreshSession () {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const response = await axios.post('/api/v2/token')
        const data = response.data
        if (data && data.token) {
          const decoded = jwt_decode(data.token)
          if (decoded.user) {
            const saveData = { user: decoded.user, token: data.token }
            memory.data = saveData
          }
        }

        return resolve(memory.data)
      } catch (error) {
        return reject(error)
      }
    })()
  })
}

const SessionContext = createContext({
  session: defaultData,
  setSession: () => {}
})

export default SessionContext
