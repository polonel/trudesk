/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/30/19 1:54 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import { saveSession, getSession, clearSession } from 'app/SessionContext'
import jwt_decode from 'jwt-decode'
import history from 'lib/lib-history'

import axios from 'axios'

const customAxios = axios.create()
customAxios.CancelToken = axios.CancelToken
customAxios.isCancel = axios.isCancel

let isAlreadyFetchingAccessToken = false
let subscribers = []

customAxios.interceptors.request.use(
  async function (config) {
    // Check for expired token
    let token = getSession().token
    if (token) {
      const decoded = jwt_decode(token)
      if (decoded.exp * 1000 < Date.now()) {
        console.log('Token is expired. We are going to grab a new one')
        try {
          const data = await axios.post('/api/v2/token').then(res => res.data)
          token = data.token
          saveSession(data)
        } catch (e) {
          // We couldn't get a new token. Lets logout.
          history.push('/logout')
          return {
            ...config,
            cancelToken: new customAxios.CancelToken(cancel => cancel('Operation was cancelled.'))
          }
        }
      }

      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

customAxios.interceptors.response.use(
  function (response) {
    return response
  },
  function (error) {
    if (axios.isCancel(error)) return Promise.reject(error)
    if (isNetworkError(error)) throw new Error('Unable to Connect to Endpoint')
    const errorResponse = error.response
    // if (!errorResponse) console.log(error)
    // Enable the below to get a new token on expired token error from the server.
    // (Currently we are doing this on the client in the request interceptor.)
    // if (isTokenExpiredError(errorResponse)) return refreshTokenAndReattemptRequest(error)
    return Promise.reject(error)
  }
)

function isTokenExpiredError (errorResponse) {
  if (errorResponse.status === 401) {
    if (errorResponse.data && errorResponse.data.error && errorResponse.data.error.type === 'exp') return true
    else {
      clearSession()
      return history.push('/')
    }
  }

  return false
}

function isNetworkError (error) {
  return !!error.isAxiosError && !error.response
}

customAxios.refreshToken = async function () {
  try {
    if (!isAlreadyFetchingAccessToken) {
      isAlreadyFetchingAccessToken = true
      const response = await axios({
        method: 'post',
        url: '/api/v2/token'
      })

      if (!response.data) return Promise.reject(new Error('Invalid Request. [RefreshToken]'))

      const newToken = response.data.token
      saveSession(response.data)

      isAlreadyFetchingAccessToken = false
      onAccessTokenFetched(newToken)
      return Promise.resolve(newToken)
    }

    return Promise.resolve()
  } catch (err) {
    console.log(err)
    isAlreadyFetchingAccessToken = false
    return Promise.reject(err)
  }
}

async function refreshTokenAndReattemptRequest (error) {
  try {
    const { response: errorResponse } = error
    const retryOriginalRequest = new Promise(resolve => {
      addSubscriber(accessToken => {
        errorResponse.config.headers.Authorization = `Bearer ${accessToken}`
        resolve(axios(errorResponse.config))
      })
    })

    if (!isAlreadyFetchingAccessToken) {
      isAlreadyFetchingAccessToken = true
      console.log('GETTING NEW TOKEN....')
      const response = await axios({
        method: 'post',
        url: '/api/v2/token'
      })

      if (!response.data) {
        return Promise.reject(error)
      }

      const newToken = response.data.token
      saveSession(response.data)
      isAlreadyFetchingAccessToken = false
      onAccessTokenFetched(newToken)
    }

    return retryOriginalRequest
  } catch (error) {
    isAlreadyFetchingAccessToken = false
    if (error.response && error.response.status === 401) {
      clearSession()
      history.push('/')
    }

    return Promise.reject(error)
  }
}

function onAccessTokenFetched (accessToken) {
  subscribers.forEach(callback => callback(accessToken))
  subscribers = []
}

function addSubscriber (callback) {
  subscribers.push(callback)
}

export default customAxios
