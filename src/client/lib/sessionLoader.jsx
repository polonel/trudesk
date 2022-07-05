import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SET_SESSION_USER } from 'actions/types'

const SessionLoader = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch({ type: SET_SESSION_USER.ACTION })
  }, [])

  return <></>
}

export default SessionLoader
